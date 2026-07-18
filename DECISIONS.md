# Decision Log — BiasharaPOS Appliance & Electronics Platform

> One short entry per non-obvious choice. Newest at top.

---

### D-035 — Mobile money goes through the ClickPesa aggregator, not a platform API (which doesn't exist)
**Date:** 2026-07-18 · **Mode:** Builder (T5.3, owner-approved rail choice)
**Decision:** T5.3 assumed the BiasharaPOS platform exposed a mobile-money **push** API to bind the PaymentsService port to. It does not — the platform's mobile money is manual code-entry (`backend/src/lib/paymentRef.js`; the transaction controller notes *"no push prompt is sent"*), with only empty operator env placeholders and no push/webhook route. So the real rail is an **aggregator: ClickPesa** (owner-approved 2026-07-18), which fronts M-Pesa + Mixx by Yas (Tigo) + Airtel Money behind one USSD-PUSH API, one signed webhook, one credential set, and a real sandbox. Isolated behind the existing `PaymentsService` port, so swapping to Selcom/AzamPay later is one adapter file. **Contract (from docs.clickpesa.com):** token = `POST /third-parties/generate-token` with `client-id`+`api-key` headers → `{success, token:"Bearer …"}` (1h life); push = `POST /third-parties/payments/initiate-ussd-push-request` `{amount, currency:"TZS", orderReference, phoneNumber(255…, no +), checksum}` → `{id, status:PROCESSING|SUCCESS|FAILED|SETTLED, channel, …}`; checksum = HMAC-SHA256 over the payload canonicalized by recursively alphabetizing keys → compact JSON → hex, signed with the merchant checksum key (excludes `checksum`/`checksumMethod`); webhook = `{event:"PAYMENT RECEIVED"|"PAYMENT FAILED", data:{id, status:SUCCESS|FAILED, orderReference, collectedAmount, channel, paymentReference, …}}`. **Split:** T5.3a — rail-agnostic reconciliation view + orphan-webhook capture (an unknown-intent webhook is now recorded and 200'd, not 404'd, so a real rail's retries don't loop and nothing is dropped). T5.3b — the ClickPesa adapter, built faithfully + tested against a fake ClickPesa server; the **live per-provider sandbox e2e is blocked on owner-provisioned sandbox credentials** (`client-id`, `api-key`, checksum key), like T5.2's TRA gate.
**Why:** Three direct provider integrations is ~3× the work and Mixx by Yas has no open public sandbox — an aggregator is the only path to genuine push+webhook for all three, and matches how Tanzanian retail actually collects. The reconciliation half is fully buildable now regardless of the rail.
**Rejected:** direct provider APIs (3× work, Mixx sandbox gap); mirror the platform's manual code-entry (drops the STK-push/webhook model already built, rewrites T5.3); block the whole task on credentials (the reconciliation view is rail-agnostic and independently valuable).
**Status:** active

---

### D-034 — Real identity: thin client over the platform's /auth/me, no shared signing secret
**Date:** 2026-07-18 · **Mode:** Builder (T5.1)
**Decision:** `PlatformIdentityService` verifies bearer tokens by calling the platform's `GET /auth/me` with the caller's token (60s success cache, failures never cached), instead of validating the HS256 signature locally. Platform `businessId` → our merchant via new `merchants.platformBusinessId` (unique, nullable; unlinked businesses rejected until onboarded, T6.2). Role map: `admin`→OWNER, `manager`→OWNER (platform managers run the back office day-to-day), `cashier`→CASHIER, `delivery`→DELIVERY (custom platform role; its role CHECK was dropped upstream), anything else **rejected** — a new platform role must be consciously mapped before it touches appliance data. Sign-in is proxied (`POST /auth/login`, `/auth/refresh` — @Public): browsers never talk to the platform directly (CORS + keeps the platform surface in the adapter layer). Platform access tokens live 15 min and refresh tokens **rotate**, so both frontends do single-flight 401→refresh→retry and store the new pair. Binding is env-branched at module-definition time (`IDENTITY_MODE=platform`); tests never read `.env` and keep the HS256 stub. **D-028 amendment:** the dev *identity* scaffolding (context/login) is deleted as promised, but `mm-resolve` survives as `MmResolveDevController` — it simulates the *payments* stub's STK approval, whose lifetime is tied to T5.3, not T5.1. **Verification target:** the platform has no staging environment, so the verify clause runs against production with a dedicated throwaway test business (owner-approved 2026-07-18; created by the owner — account creation is outside what the agent may do).
**Why:** /auth/me delegation means zero secret sharing, and revoked/deactivated users die within the cache TTL — local HS256 validation would need `JWT_SECRET` handed to a second system and would keep trusting deactivated users for 15 minutes. The cache keeps steady-state load at ≤1 upstream call per user per minute.
**Rejected:** shared `JWT_SECRET` local validation (secret sprawl, stale revocation); browser→platform direct login (CORS, platform coupling in feature code); defaulting unmapped roles to CASHIER (silent privilege grant); deleting mm-resolve now (breaks the POS mobile-money demo while payments are still stubbed).
**Status:** active

---

### D-031 — Arrears: persisted OVERDUE flag drives display/reminders; dashboard computes live from dates
**Date:** 2026-07-17 · **Mode:** Builder
**Decision:** Two complementary layers. (1) The nightly BullMQ job (`recomputeOverdue`) *persists* OVERDUE on past-due unpaid rows — this is what the schedule view shows and what T3.4 reminders will trigger on. (2) The dashboard *computes* arrears live from `dueDate < asOf AND paidTzs < amountTzs`, never trusting the persisted flag — so it's correct even if the job hasn't run yet or `asOf` is backdated. `recomputeOverdue` takes an optional `merchantId` (nightly job runs global; also enables merchant-scoped recompute and test isolation on the shared DB). Every method takes explicit `asOf` for fake-clock testing. Back-office arrears screen ships now (not deferred like D-022's stock view) since it's M3's headline deliverable and the D-028 dev-auth pattern made it cheap.
**Why:** A persisted status is needed for the schedule display and reminder triggers, but making the *dashboard* depend on job timing would show stale or empty arrears between runs — computing live from dates is always right. Two sources, each authoritative for its purpose, kept consistent by the same predicate.
**Rejected:** dashboard reads the persisted OVERDUE flag only (stale between runs, wrong for backdated asOf); no persisted flag at all (T3.4 reminders need a durable overdue signal + audit trail); merchant-scoped-only recompute (the real nightly job is global).
**Status:** active

---

### D-033 — Reminder dispatch: strict-day matching, at-most-once claims, no auto-retry of failures
**Date:** 2026-07-18 · **Mode:** Builder
**Decision:** The daily job (07:00 — a debt reminder should arrive at breakfast, not 2am) dispatches a reminder only when `(today − dueDate)` EXACTLY equals a policy offset; the `UNIQUE(scheduleRowId, offsetDays)` claim row (PENDING → SENT/FAILED) is inserted before the SMS call, so crashes and reruns can never double-text a customer. A FAILED send stays FAILED and visible in the log — reruns skip it; there is no automatic retry. If the job misses a day entirely (server down), that day's reminders are skipped, not sent late.
**Why:** Double-texting a debtor damages the dealer–customer relationship more than a missed nudge does — at-most-once is the right bias for collections SMS. Strict-day matching keeps semantics predictable ("kila tarehe 5 unapata ujumbe"); a late catch-up reminder ("you were due 4 days ago" arriving on day 6 labeled +3) would lie about itself. Failures need a human eye (wrong number?), not a robot hammering the same msisdn.
**Rejected:** catch-up windows for missed days (misleading offsets); auto-retrying FAILED sends (risk of repeated texts on flaky rails); sending at the arrears job's 02:00 slot (hostile timing).
**Status:** active

---

### D-032 — Default UI language is English; the choice persists per device
**Date:** 2026-07-18 · **Mode:** Builder (product-owner decision)
**Decision:** Both apps start in English (`DEFAULT_LOCALE='en'`) and remember the user's toggle in localStorage (`biashara-locale-v1`, per origin/device) — a refresh never resets the language. Swahili remains first-class per DESIGN_SYSTEM.md §7 (full coverage, labels designed for Swahili length); only the initial selection changed from the sw-first default the screens shipped with.
**Why:** Owner instruction 2026-07-18. Per-device persistence (not per-account) because the language of a shared till is a property of the shop counter, not of whoever is signed in.
**Rejected:** browser-language detection (Tanzanian Windows/Android devices commonly report en-US regardless of the operator's preference — an explicit toggle is more honest); per-account persistence (server round-trip for a preference that belongs to the device).
**Status:** active

---

### D-030 — Schedule application is a transaction hook on the payment door, not a separate step
**Date:** 2026-07-17 · **Mode:** Builder
**Decision:** Payments apply to a credit schedule via a hook registered on `PaymentsService` (`registerAppliedHook`), fired inside the payment's transaction for every ledger row — positive (payment) and negative (reversal). The credit module registers a `ScheduleApplicationService` that distributes the delta oldest-due-first (reversals newest-paid-first) and settles/reopens the agreement. Application is a side effect of paying through the existing endpoints; there is no `/schedule/apply` call and no schedule-side balance (the order ledger is the one source of money truth — deposit+schedule=total per D-029, so overpayment is already caught by the order-balance guard).
**Why:** The schedule and the order ledger are two views of the same money; they must move together or a crash desyncs the notebook from the ledger — a transaction hook guarantees atomicity. A hook (vs. Orders calling Credit) keeps the dependency direction Credit→Orders intact. Settling flips T3.1's layaway gate with no new code, so "settlement releases goods" falls out for free.
**Rejected:** a separate apply-to-schedule endpoint (two writes, desync window, double-entry surface); Orders importing Credit (circular); a schedule-side running balance (second source of truth that can disagree with the ledger).
**Status:** active

---

### D-029 — Agreement snapshot semantics: deposit = paid-at-creation; layaway enforced at fulfillment
**Date:** 2026-07-17 · **Mode:** Builder
**Decision:** A credit agreement snapshots the order at creation: `principalTzs` = order total, `depositTzs` = sum already paid on the order, and the schedule must finance exactly the difference — so **deposit + schedule = principal** is a checkable identity, not a convention. "LAYAWAY holds units RESERVED" is enforced at the single choke point goods pass through (FulfillmentService.fulfill, inside the same transaction that would move them; delivery in M4 goes through fulfillment too). Orders with an ACTIVE agreement cannot be cancelled — the agreement resolves first (cancellation flow later in M3). Credit requires a customer attached to the order.
**Why:** Deposits arrive through the existing payments ledger before the agreement exists (POS flow: take deposit, then write the notebook) — deriving deposit from the ledger keeps one source of truth for money; a separately-entered "agreed deposit" could disagree with reality. Enforcing layaway where stock moves catches every future path (fulfill now, deliver in M4) without each caller remembering.
**Rejected:** deposit as free input (drifts from the ledger); enforcing layaway in controllers (bypassable by any new caller); agreements on anonymous orders (unenforceable debt).
**Status:** active

---

### D-028 — Stub-era dev sign-in endpoints carry the POS until real identity (T5.1)
**Date:** 2026-07-17 · **Mode:** Builder
**Decision:** `DevAuthController` (`/auth/dev/context`, `/auth/dev/login`, `/auth/dev/mm-resolve`) gives the POS a merchant/role picker, stub-signed JWTs, and STK-approval simulation. All routes 404 when `DEV_AUTH=off` (set in any real deployment) and require the stub services (duck-typed `sign`/`confirm` — a real IdentityService makes them inert). The controller is DELETED when T5.1 lands the platform OAuth. API CORS is permissive (bearer-only auth, no cookies) for the same window.
**Why:** T2.6 needs a signed token to exercise every guarded endpoint; building real login against a stub would be throwaway of a different, more deceptive kind. Explicit, flagged scaffolding beats a hardcoded token in the client.
**Rejected:** tokens hardcoded in the POS bundle (invisible, leaks into builds); building the T5.1 OAuth flow early against a fake issuer (wasted twice); leaving the POS unauthenticated behind a mock fetch layer (would verify nothing real).
**Status:** active (self-destructs at T5.1)

---

### D-027 — Confirmed mobile money that no longer fits the balance is held, not forced or dropped
**Date:** 2026-07-17 · **Mode:** Builder
**Decision:** When a confirmation webhook arrives for an intent whose amount now exceeds the order balance (e.g. cash settled the order while the push was pending), the intent resolves CONFIRMED with `appliedPaymentId = null` and an `MM_CONFIRMED_UNAPPLIED` audit event. No ledger entry is written, nothing is silently discarded — these rows are the input for the T5.3 reconciliation view, where a human decides (refund, apply elsewhere).
**Why:** The customer's money genuinely left their phone — dropping the record would lose real money; force-applying would overpay the order and break the ledger invariant. Holding it visibly matches how the offline conflict queue treats serial conflicts: humans resolve, systems never silently merge.
**Rejected:** rejecting the webhook (the platform already moved the money; a 4xx just makes the rail retry); auto-refund (no refund rail exists until M5); applying as credit balance (no such concept in V1's ledger).
**Status:** active

---

### D-026 — Deposit fiscalization: one summary line, pending the TRA ruling
**Date:** 2026-07-16 · **Mode:** Builder (provisional, rides on D-008)
**Decision:** A payment equal to the order total fiscalizes with the order fully itemized (per-line tax codes); a partial payment (deposit) fiscalizes as a single summary line (`Malipo / Payment — SO-xxxxxx (deposit)`, tax code A) — receipt items must sum to the paid amount. Reversals do not fiscalize (TRA credit-note handling is deferred with the real API, M5).
**Why:** Per-payment fiscalization (D-008) forces a choice for partial payments; itemizing a fraction of the goods misstates what was sold. The summary-line approach is what the open TRA compliance question (blocks T5.2) will confirm or overturn — the FiscalService port isolates the blast radius either way.
**Rejected:** pro-rating item quantities across payments (fictional fractions of physical goods); fiscalizing only at settlement (contradicts D-008's per-payment working assumption).
**Status:** active (provisional — revisit at T5.2 with the compliance answer)

---

### D-025 — Payments ledger: DB-enforced append-only; fiscal receipts live in their own table
**Date:** 2026-07-16 · **Mode:** Builder
**Decision:** `payments` carries the same immutability trigger as `audit_events` — UPDATE/DELETE raise at the database level; corrections are reversing entries (negative amount, `reversesPaymentId` UNIQUE so a payment reverses at most once). Consequence: T2.4 fiscal receipts go in a separate `fiscal_receipts` table referencing `paymentId` — a payment row never needs an UPDATE, not even to attach a VFD number. Manual recording is CASH-only; MOBILE_MONEY enters exclusively via the T2.5 webhook path; CARD/BANK when a real dealer needs them.
**Why:** "Ledger corrections are reversing entries, never mutations" is a hard rule — enforcing it in Postgres makes it unbreakable by any future code path; the ARCHITECTURE seam's `fiscalReceiptId?` on Payment would have required mutating ledger rows, so the reference direction is flipped.
**Rejected:** app-level-only immutability (one careless repository.save away from silent corruption); `fiscalReceiptId` column on payments (forces UPDATE of ledger rows); accepting any method on the manual endpoint (mobile money must be webhook-confirmed, not keyed in).
**Status:** active

---

### D-024 — Post-merge migrations to Neon dev + prod are standing policy; prod is up-only
**Date:** 2026-07-16 · **Mode:** Builder (product-owner decision)
**Decision:** After every merge that adds migrations, apply them to both Neon branches: `npm run migrate -w apps/api` (dev) then `npm run migrate:prod -w apps/api`. The prod runner reads `PROD_DATABASE_URL` from the gitignored `apps/api/.env` and only runs UP — there is deliberately no prod down-runner (schema rollbacks in prod are reversing migrations, same philosophy as the money ledger).
**Why:** Owner instruction (2026-07-16) after twice approving prod migrations manually; keeping both branches schema-current pre-launch removes a whole class of deploy-day surprises. Storing the prod URL in the local gitignored env beats keeping a Neon API key around (narrower capability: one database vs. the whole account).
**Rejected:** re-fetching the URL per run via Neon API key (key is account-wide and shouldn't live on disk); migrating prod only at deploy time (schema drift accumulates); committing the URL anywhere (never).
**Status:** active

---

### D-023 — Quote/receipt PDFs via pdfkit; API consumes design tokens through a subpath export
**Date:** 2026-07-16 · **Mode:** Builder
**Decision:** Document rendering (T2.1 quote, later T2.4 receipts / T3.5 statements) uses `pdfkit` (pure JS, no native binaries or headless browser). Brand values come from the new `@biashara/ui/tokens` subpath export — tokens only, so the API respects the hex ban without pulling React from the ui package's main entry. PDFs are generated uncompressed (`compress:false`) — negligible size, and content stays assertable in tests. Branding placeholder = brand bar + wordmark text in canonical colors; the drawn logo mark joins at T2.4.
**Why:** pdfkit is the smallest thing that makes a real, printable PDF (verify clause says PDF, not HTML); Chromium/puppeteer for print-to-PDF is a giant dependency and likely blocked on this network (D-014 pattern); one token source across web and PDF output.
**Rejected:** print-ready HTML only (fails the clause); puppeteer (footprint + network risk); duplicating brand hex values in the API (defeats the single-source rule the lint enforces).
**Status:** active

---

### D-022 — T1.4 ships API-only; the stock UI lands with the M6 dashboards
**Date:** 2026-07-16 · **Mode:** Builder
**Decision:** T1.4's "API/UI" delivered the API (`GET /stock`, `GET /units/lookup`); the visual stock screen is deferred to T6.1 (back-office dashboards include "stock summary + aging").
**Why:** The SPAs have no auth wiring until identity integration (M5) — a stock screen now would need throwaway token plumbing; T1.4's verify clause is entirely API-level; and T6.1 already owns the screen this would become. Smallest correct version.
**Rejected:** building the screen with a hardcoded dev token (throwaway auth scaffolding that D-004 stubs make unnecessary); silently skipping the UI without recording it (this entry is the record).
**Status:** active

---

### D-021 — No shortcut unit transitions; direct sales compose RESERVE → SELL
**Date:** 2026-07-16 · **Mode:** Builder
**Decision:** The state machine implements exactly the transitions ARCHITECTURE.md lists — no IN_STOCK→SOLD shortcut for walk-in cash sales. A direct sale performs two transitions (RESERVE, then SELL) through the same single door; each is audited.
**Why:** One graph, one meaning per edge: every SOLD unit was verifiably RESERVED first, so the audit trail (the future collateral-registry asset) has uniform shape; adding shortcut edges doubles the matrix the tests and offline conflict-resolution must reason about. Cost is one extra UPDATE per cash sale — negligible.
**Rejected:** IN_STOCK→SOLD edge (audit shape divergence); allowing services to write `status` directly for "simple" cases (that's how state machines die).
**Status:** active

---

### D-020 — Databases live on a dedicated Neon project; branch-per-environment
**Date:** 2026-07-16 · **Mode:** Builder (product-owner decision)
**Decision:** Dev and production databases are hosted on Neon (managed Postgres 16) in a **dedicated project `biashara-appliances`** (`green-unit-19592753`, `aws-eu-central-1` — same region as the core platform's DBs), using Neon branches as environments: `production` (default, `br-floral-rain-asfqebid`) and `development` (`br-rough-fire-asgix3h9`), database `biashara_appliances`, role `biashara_app`. Dev URL lives in gitignored `apps/api/.env`; the production URL is stored **only** in the deploy platform's env vars (no deployment exists yet — M5/M6). Both branches migrated 2026-07-16; dev seeded. CI keeps its throwaway `postgres:16` service; the embedded local Postgres (D-017) remains the offline fallback and the default for tests (vitest doesn't read `.env`, so tests hit localhost unless `DATABASE_URL` is exported).
**Why:** Product owner chose Neon to match core-platform ops, and explicitly chose a dedicated project over sharing the core `biashara-pos` instances — product/credential isolation (the shared-instance route also meant operating on the core product's live prod server with its owner credentials, declined). Outbound 5432 + TLS to Neon verified working from the dev network (full cert verification — no interception on this path).
**Rejected:** sharing core Neon instances (couples two products' infra and secrets); two separate Neon projects for dev/prod (branches are the Neon-native split and allow copy-on-write dev resets); keeping dev purely local (user wants dev on Neon).
**Status:** active

---

### D-019 — GRN receive is all-or-nothing; receiving is OWNER-only in V1
**Date:** 2026-07-16 · **Mode:** Builder
**Decision:** `POST /grns` is atomic: any invalid line or duplicate serial rejects the entire request (every problem reported at once with `lines[i].serials[j]` paths); nothing persists. Contrast D-018, where CSV import is partial-success. Receiving requires the OWNER role (CASHIER/DELIVERY cannot receive or read GRNs).
**Why:** A GRN mirrors one physical delivery — partially accepting it would make system stock silently diverge from what's on the floor, and a re-scan after fixing is cheap. Catalog rows have no physical counterpart, so partial import is dealer-friendly there. Role: stock intake is an owner/manager act in the dealer profile from the brief; a STOREKEEPER role can be added when a real merchant asks.
**Rejected:** partial receipt (stock/reality divergence); per-line accept + exception queue (that machinery is for offline conflicts, M5).
**Status:** active

---

### D-018 — Catalog CSV import: partial success, create-only, zero new dependencies
**Date:** 2026-07-16 · **Mode:** Builder
**Decision:** Import semantics (T1.1): every valid row imports, every invalid row is reported as `{line, errors[{field,message}]}` keyed to the real file line — a bad row never blocks the file. Import is create-only (existing merchant sku → per-row error, not upsert). Duplicate skus are unique per merchant only when present (partial index). Product DELETE is a soft archive (`active=false`). Validation is one hand-rolled rule source (`product.rules.ts`) shared by CRUD bodies and CSV rows; CSV parsing is a ~50-line RFC-4180 parser; the file travels as JSON `{csv}` (client reads the file locally; 2mb body limit).
**Why:** Dealers fix a 3-row problem, not a 500-row re-import; one rule source keeps API and import errors identical; class-validator/csv-parse/multer would add three dependencies for behavior we need to control per-row anyway ("every dependency is a liability"); catalog rows get referenced by stock/orders so hard delete is never safe.
**Rejected:** all-or-nothing import (hostile to dealers); upsert-by-sku (surprising bulk overwrites — revisit when a real update-workflow need appears); multipart upload via multer (second body pipeline for no V1 gain).
**Status:** active

---

### D-017 — Dev-machine Postgres via npm-delivered embedded binaries
**Date:** 2026-07-16 · **Mode:** Builder (dev-environment, not product)
**Decision:** On the primary dev machine (corporate Windows, no Docker daemon, no admin installer, apt inside WSL TLS-intercepted/blocked), the verification database is PostgreSQL 16.13 from `@embedded-postgres/windows-x64` (npm registry is the one allowed artifact channel, cf. D-014), installed under `~/.biashara-devdb`, started with `pg_ctl -D ~/.biashara-devdb/data -l ~/.biashara-devdb/pg.log start` (must be launched from PowerShell/cmd, not git-bash — MSYS env crashes postgres startup with 0xC0000142). Role/db match the project defaults (`biashara`/`biashara`, `biashara_appliances`). docker-compose remains the dev/CI contract (D-012).
**Why:** "Done means verified" needs a real Postgres; every conventional install path is blocked by the corporate network; npm demonstrably works.
**Rejected:** pg-mem (no plpgsql triggers — audit immutability untestable); skipping DB verification (violates the loop); system-wide EDB installer (needs admin + blocked download).
**Status:** active

---

### D-016 — Repo SVGs are the canonical logo assets
**Date:** 2026-07-15 · **Mode:** Builder (product-owner decision)
**Decision:** `brand/logo-appliances-icon.svg` and `brand/logo-appliances-lockup.svg` (green rounded square, white power-arc, lightning-bolt stem, Steel Blue descriptor) are canonical for all surfaces — favicon, PWA icons, app headers, receipts.
**Why:** Product owner confirmed the created assets; the handoff mark is the same concept with variant geometry, so no dual source.
**Rejected:** regenerating from handoff geometry (no user-visible benefit, churn).
**Status:** active

---

### D-015 — Official design handoff supersedes v1 design assumptions
**Date:** 2026-07-15 · **Mode:** Builder
**Decision:** Adopted the design handoff bundle (found in the GitHub-linked project folder, now vendored at `design-handoff/`) as the canonical design source. Core corrections: Azure Blue `#0F5DA4` is primary brand (not green), green `#239B46` is CTA/money, gold `#E7A52C` accent, typeface Plus Jakarta Sans (not Inter; TTFs bundled, self-hosted for offline). Sub-brand extensions from v1 were ratified by the handoff and retained: Steel Blue `#1D6A96` accent, domain status-badge vocabulary, green power-bolt mark. `DESIGN_SYSTEM.md` rewritten as v2; T0.6 tokens must be transcribed from `design-handoff/_ds/*/tokens/*.css`.
**Why:** The handoff is hifi and explicitly canonical ("logo-sampled website values"); building tokens from my earlier assumptions would have shipped a wrong-color product.
**Rejected:** keeping v1 values (contradicts the real brand); mixing sources per component (drift).
**Status:** active

---

### D-014 — TypeORM + pg instead of Prisma
**Date:** 2026-07-15 · **Mode:** Builder
**Decision:** Data layer uses TypeORM with handwritten SQL migrations (runner scripts `migrate`/`migrate:down`/`seed`), `synchronize: false`.
**Why:** Prisma's engine binaries are fetched from binaries.prisma.sh, which the build sandbox's network allowlist blocks (403). D-003 pre-approved TypeORM as the alternative; it is pure JS, and NestJS+TypeORM is the canonical pairing. Handwritten SQL migrations keep schema changes explicit and reviewable.
**Rejected:** Prisma (unfetchable engines here; revisit only if the team strongly prefers it on unrestricted infra); Drizzle (fine tool, but TypeORM was the sanctioned fallback); `synchronize: true` (schema drift risk).
**Status:** active

---

### D-013 — Vitest everywhere; no @nestjs/cli; plain tsc builds
**Date:** 2026-07-15 · **Mode:** Builder
**Decision:** One test runner (Vitest) across API and web workspaces; API compiled with plain `tsc` instead of the Nest CLI/webpack.
**Why:** One toolchain to learn/maintain; tsc output is transparent and container-friendly; Nest CLI adds no value at this size.
**Rejected:** Jest for API (second runner, slower TS story); Nest CLI (opaque build wrapper).
**Status:** active

---

### D-012 — Sandbox verification uses local PostgreSQL; docker-compose is the dev/CI contract
**Date:** 2026-07-15 · **Mode:** Builder
**Decision:** The build sandbox has no docker daemon; DB-dependent tasks verify against the local PostgreSQL 16 cluster. `docker-compose.yml` + Dockerfile remain the canonical dev/CI environment.
**Why:** Plan's verify steps referenced `docker compose up`; the equivalent evidence (running API + real Postgres) is achievable with local processes.
**Rejected:** skipping runtime verification (violates "done means verified").
**Status:** active

---

### D-011 — Inherit BiasharaPOS design system; differentiate with a Steel Blue sub-brand accent and a power-bolt vertical mark
**Date:** 2026-07-15 · **Mode:** Architect
**Decision:** The platform inherits the core BiasharaPOS brand (Biashara Green `#239B46`, flat/minimal card-based style, family wordmark) and extends it with: a Steel Blue accent (`#1D6A96`) reserved for the Appliances & Electronics sub-brand, a fixed domain-status color vocabulary (unit states, arrears severity, sync state), and a vertical mark — rounded green square with a white power-symbol whose stem is a lightning bolt. Codified in `DESIGN_SYSTEM.md`; implemented as `packages/ui` tokens (T0.6–T0.7). Typeface set to Inter pending confirmation of the core platform's font.
**Why:** Family recognition ("One POS. Every business") with instant vertical identification; a single token source prevents the design drift that plagues multi-product suites; the power symbol is the universal electronics glyph — flat, minimal, legible at 24px.
**Rejected:** a fully separate brand (loses BiasharaPOS trust equity in-market); no sub-brand differentiation (sales and support can't tell the products apart); appliance-silhouette icons like a fridge (too literal, poor at small sizes).
**Status:** active

---

### D-010 — Reminders via platform SMS only in V1
**Date:** 2026-07-15 · **Mode:** Architect
**Decision:** Payment reminders go through the platform `NotificationService` (SMS). No WhatsApp integration in V1.
**Why:** SMS is universal in TZ and already exposed as a platform API; WhatsApp Business API adds approval processes and template management for marginal V1 value.
**Rejected:** WhatsApp Business API (deferred to the WhatsApp-commerce phase); in-app-only reminders (customers don't have the app).
**Status:** active

### D-009 — V1 credit is retailer-carried only
**Date:** 2026-07-15 · **Mode:** Architect
**Decision:** The credit module records agreements funded by the retailer (installment/layaway). No lending by us, no credit scoring, no financier integrations.
**Why:** Brainstorm conclusion (financing model v3): digitize the existing mali-kauli notebook first; repayment data accumulates into the phase-2 financier-marketplace asset. Avoids balance-sheet risk and BoT licensing entirely.
**Rejected:** financier waterfall (no financiers to orchestrate in TZ); being the lender (no license/balance sheet — how POS startups die).
**Status:** active

### D-008 — Fiscalize per payment received (working assumption)
**Date:** 2026-07-15 · **Mode:** Architect
**Decision:** Each payment triggers a fiscal receipt via `FiscalService`. The interface abstracts the alternative (full-invoice fiscalization at sale) so a compliance ruling flips a strategy, not the architecture.
**Why:** Matches how installment/deposit money actually arrives; keeps offline queueing coherent.
**Rejected (pending):** invoice-at-sale fiscalization — not rejected on merits; awaiting TRA compliance confirmation (blocks T5.2 only).
**Status:** active (provisional)

### D-007 — SerializedUnit is a first-class aggregate; serial pick deferrable
**Date:** 2026-07-15 · **Mode:** Architect
**Decision:** Serials are entities with a guarded state machine (not a text field on an order line). Serial capture happens at receiving by default; dealers can defer specific-serial pick to fulfillment.
**Why:** Serial truth is the product's spine and the future collateral-registry data asset; a text field cannot enforce "can't sell the same fridge twice." Deferred pick keeps counter friction low.
**Rejected:** serial-as-attribute-at-sale only (Lightspeed X-Series style capture — no stock truth); mandatory pick at order time (slows checkout).
**Status:** active

### D-006 — Offline scope: POS sale capture only
**Date:** 2026-07-15 · **Mode:** Architect
**Decision:** Offline mode covers cash sales, payment capture, and order creation against the last-synced snapshot, via an IndexedDB outbox with idempotent replay. Credit-agreement creation, deliveries, and all back-office work require connectivity. Conflicts go to a human exception queue.
**Why:** Smallest offline surface that satisfies "keep selling through an outage." Full offline sync of ledgers and serial states is a distributed-systems project V1 doesn't need.
**Rejected:** full offline-first replication (CRDTs/sync-everything) — cost and risk out of proportion; no offline at all — disqualifying in TZ.
**Status:** active

### D-005 — Web PWA POS (no native app)
**Date:** 2026-07-15 · **Mode:** Architect
**Decision:** POS is a browser PWA with service worker + IndexedDB, matching the existing platform's web-POS client model.
**Why:** The existing product proves web POS works for BiasharaPOS's market; server-side VFD fiscalization removes the fiscal-printer driver problem; one distribution channel (URL) beats app-store ops.
**Rejected:** native/Flutter Android app — better offline ergonomics but new stack, new pipeline, unjustified while the incumbent client model is web.
**Status:** active

### D-004 — Borrow platform capabilities via typed API contracts + stub adapters
**Date:** 2026-07-15 · **Mode:** Architect
**Decision:** Fiscal, payments, identity, notifications are consumed through frozen TypeScript interfaces with two implementations each: stub (M0) and real platform API (M5). Domain modules never import platform SDKs directly.
**Why:** Platform services are already exposed as APIs (confirmed by product owner); the adapter seam lets M1–M4 build at full speed with stubs, keeps the domain model uncontaminated, and localizes the blast radius if any contract turns out weaker than advertised.
**Rejected:** direct SDK calls from domain code (couples the new product to platform internals); reimplementing the services (waste; regulatory surface).
**Status:** active

### D-003 — Stack: TypeScript/NestJS/PostgreSQL/React, BullMQ+Redis as only new infra
**Date:** 2026-07-15 · **Mode:** Architect
**Decision:** Align language and conventions with the existing Node/TS platform; PostgreSQL as system of record; BullMQ/Redis for retries, nightly arrears, reminders.
**Why:** One-language team leverage; relational integrity for serials/money; the job queue is the only genuinely new infrastructure need (fiscal retries, scheduled jobs).
**Rejected:** new language/framework (no benefit, real cost); cron-in-process instead of a queue (no retry semantics for fiscal submission).
**Status:** active

### D-002 — Modular monolith, not microservices
**Date:** 2026-07-15 · **Mode:** Architect
**Decision:** One deployable NestJS application with enforced module boundaries (catalog, inventory, orders, credit, delivery, adapters).
**Why:** Small team, one market, hundreds of merchants. Module boundaries preserve the option to extract services later; separate deployables now would buy ops burden with nothing.
**Rejected:** microservices-first (premature); no internal boundaries (guarantees the entanglement we're escaping from).
**Status:** active

### D-001 — Independent product, not a vertical toggle in the existing BiasharaPOS
**Date:** 2026-07-15 · **Mode:** Architect (ratifying brainstorm conclusion)
**Decision:** New codebase, new data model, own roadmap; shares the platform services layer only.
**Why:** The appliance transaction violates the generic POS core assumptions (item identity, sale ≠ fulfillment, payment incomplete at counter). Bolting it on is the documented failure mode of every generic platform in the market research.
**Rejected:** vertical toggle in existing product (schema fight forever); fully standalone with zero sharing (reimplements regulated plumbing for no reason).
**Status:** active
