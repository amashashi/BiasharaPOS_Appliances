# Progress — BiasharaPOS Appliances & Electronics Platform

> Builder log. Newest at bottom. Each entry: what was done, how it was verified, surprises.

## 2026-07-15 — T0.1 Monorepo scaffold + CI ✅

**Done:** npm-workspaces monorepo at repo root: `apps/api` (NestJS 11, tsc build, `GET /api/health`), `apps/pos` (Vite+React PWA shell, manifest, port 5173), `apps/backoffice` (Vite+React shell, port 5174), `packages/shared` (frozen domain types: UUID, Tzs, UnitStatus, OrderStatus, PaymentMethod, CreditAgreement types, Role). Root ESLint 9 flat config (ts-eslint), Vitest per workspace, GitHub Actions CI (`.github/workflows/ci.yml`), `docker-compose.yml` (postgres + api) with `apps/api/Dockerfile`. Git repo initialized, first commit `5548d70`.

**Verified:** `npm run build` green across all workspaces; `npm run lint` green; `npm test` — 1/1 passing (health controller); API started and `curl /api/health` returned `{"status":"ok","service":"biashara-appliances-api","version":"0.1.0"}`; POS preview served correct `<title>`.

**Surprises / adaptations:**
- **Docker daemon unavailable in this sandbox** (compose file cannot be run here). Local PostgreSQL 16 cluster exists and will be used for DB verification from T0.2 onward. docker-compose remains the contract for dev machines/CI. → logged as D-012.
- eslint config renamed to `.mjs` to silence module-type warning.

## 2026-07-15 — T0.2 PostgreSQL + migrations + base entities ✅

**Done:** TypeORM + pg data layer in `apps/api`: entities `Merchant`, `Location` (SHOP/WAREHOUSE, unique per merchant+name), `UserRef` (platform-identity mapping + role, per D-004); handwritten SQL migration `1784120000000-base-entities`; `createDataSource()` with `synchronize: false`; runner scripts `npm run migrate` / `migrate:down` / `seed` (idempotent demo merchant "Demo Electronics Ltd" + Kariakoo Showroom + Ubungo Warehouse + owner user). `.env.example` added.

**Verified:** migrate up → seed → migrate **down** → migrate up → re-seed all clean; psql join query returns the 2 seeded locations under the merchant; root lint + tests still green.

**Surprises:** Prisma engine downloads 403-blocked by sandbox allowlist → switched to TypeORM per D-003's sanctioned alternative (D-014). No Nest wiring of the DataSource yet — first consumer arrives with T0.5 (audit table) and M1 modules.

## 2026-07-15 — Repo relocated to GitHub-linked device folder + design handoff adopted

**Done:** Synced the repo (47 tracked files) to `C:\BiasharaPOS_Appliances` (GitHub: amashashi/BiasharaPOS_Appliances) and committed there (`68a95fc`) on top of the repo's initial commit. Discovered the official **design handoff zip** in that folder; vendored it at `design-handoff/`; rewrote `DESIGN_SYSTEM.md` to v2 (Azure Blue primary, green CTA, gold accent, Plus Jakarta Sans; sub-brand Steel Blue + status vocabulary + green power-bolt mark ratified) → D-015. T0.6 must transcribe tokens from `design-handoff/_ds/*/tokens/*.css` and bundle the Plus Jakarta Sans TTFs.

**Blocked on device:** `.git/index.lock` left behind on the device repo cannot be deleted through the bridge (no-delete limitation) — device-side git commits are blocked until the user deletes `C:\BiasharaPOS_Appliances\.git\index.lock` manually. Push to GitHub must also run from the user's machine (workspace VM has no network). Container repo remains the working copy; sync to device at checkpoints.

## 2026-07-15 — GitHub push attempts + history hygiene (between T0.2 and T0.3)

**Findings:** Sandbox GitHub gateway allows reads but binds writes to session-configured repos — pushes 403 regardless of PAT (user's token revoke-recommended; deleted from container). Device-folder `.git` further degraded (object store gutted, stale HEAD.lock) — declared dead; recovery = fresh `claude-history.bundle` placed in the folder (post-merge, corrected identities) + five PowerShell commands (delete 2 locks, fetch bundle, checkout -B, plain push). History rewritten once (user-authorized): all Claude commits now author+committer `noreply@anthropic.com`; user's `c7fe31c` untouched and merged in (no force-push needed). Remaining stop-hook "Unverified" flag is the unfixable missing-signature condition — accepted.

## 2026-07-15 — T0.3 Platform adapter contracts + stubs ✅

**Done:** Frozen contracts in `packages/shared/src/contracts.ts` (D-004): `FiscalService` (issueReceipt with idempotencyKey; TRA VFD receipt shape), `PaymentsService` (initiateMobileMoneyPush for MPESA/MIXX_BY_YAS/AIRTEL_MONEY + PaymentConfirmation webhook payload), `IdentityService` (verifyToken → AuthContext), `NotificationService` (sendSms templated, bilingual). Stub implementations in `apps/api/src/platform/stubs/` (sequential VFD numbers + idempotency + failNext() outage simulation; intent registry + webhook-style confirm/fail; HS256 JWT verify with sign() test helper; SMS send log). NestJS `PlatformModule` binds stubs via injection tokens (FISCAL_SERVICE etc.), imported by AppModule.

**Verified:** 8 new contract tests + health test = 9/9 passing; shared + api builds green; lint green after excluding vendored `design-handoff/**` from ESLint (minified bundle was producing 1179 errors — config fix, not code).

**Note:** contract shapes derived from ARCHITECTURE.md; confirm against real platform API docs before M5 swap-in (audit note in contracts.ts header).

## 2026-07-15 — T0.4 Auth middleware + role guards ✅

**Done:** Global `AuthGuard` (APP_GUARD in AppModule): validates `Authorization: Bearer` JWTs through the `IDENTITY_SERVICE` port, attaches `AuthContext` to the request (`AuthedRequest`), enforces `@Roles(...)` metadata (OWNER/CASHIER/DELIVERY), `@Public()` opt-out used on the healthcheck. Decorators in `src/auth/decorators.ts`.

**Verified:** 4 integration tests (supertest against a real Nest app): public route 200 with no token; missing/garbage token 401; valid token attaches merchantId/userId; cashier 403 on @Roles('OWNER') route while owner 200. Full suite 13/13; lint green; live smoke test confirms `/api/health` still public on the built app.

## 2026-07-15 — T0.5 Append-only audit log ✅

**Done:** `audit_events` table (migration 1784130000000) with a **database trigger** rejecting UPDATE/DELETE (`audit_events is append-only`) — immutability holds regardless of role or code path. `AuditSubscriber` (TypeORM) auto-records INSERT/UPDATE/REMOVE for every entity in the same transaction (recursion-guarded); `AuditService.record()` for actor-attributed domain verbs (UNIT_SOLD etc.). Global `DbModule` provides the initialized DataSource (`DATA_SOURCE` token) + AuditService to the app; API scripts use `--env-file-if-exists=.env`; CI gained a postgres:16 service so DB tests run there.

**Verified (against real Postgres):** creating a Merchant auto-writes an INSERT audit row; updating records before+after; raw SQL UPDATE and DELETE on audit_events both rejected by the trigger. Full suite 16/16, lint + build green.

**Surprises:** (1) TypeORM `insert()` generics reject `Record<string,unknown>|null` jsonb payloads → switched audit writes to `create()+save()`. (2) Vitest/esbuild doesn't emit decorator metadata → all entity `@Column()`s now declare explicit types (also makes schema intent visible; keep this convention for every future entity).

## 2026-07-15 — T0.6 Design tokens + packages/ui foundation ✅

**Done:** `packages/ui` — `tokens.ts` transcribed exactly from the design handoff (core palette blue/green/gold/cyan + neutrals, Steel Blue sub-brand, Plus Jakarta Sans stacks, type scale, 4px spacing scale, radii, shadows, motion, layout) plus the domain status vocabulary (`unitStatusStyle`, `arrearsStyle` ramp). Components: Button (primary/secondary/danger/ghost, `pos` 48px variant), MoneyDisplay + `formatTzs` (integer-only, tabular-nums), StatusBadge (unit + arrears, bilingual), SerialChip (steel pill, copy + lookup), OfflineBar (queued=gold / conflicts=red, hidden when synced). Bilingual `i18n.ts` (Swahili-first). Plus Jakarta Sans variable TTFs bundled + `fonts.css` export (self-hosted for offline POS). ESLint rule bans raw hex in `apps/**` and ui components (tokens.ts is the sanctioned home). Back-office shell now renders a Showcase page (sw/en toggle); POS shell restyled from tokens.

**Verified:** 4 token/i18n/format tests (20 total green); lint green; hex fixture file correctly rejected by the new rule ("Raw hex color…"); Chromium screenshots of the Showcase in both locales confirm palette, CTA shadow, tabular money alignment, status vocabulary incl. the 3-step arrears ramp, serial chips, offline bar.

**Surprise:** a `*/` inside a doc-comment glob path terminated the comment block — reworded (watch for this in comments referencing glob paths).

## 2026-07-15 — T0.7 Brand assets integration ✅ — **M0 COMPLETE**

**Done:** PNG icon set (32/192/512) rendered from the canonical `brand/logo-appliances-icon.svg` (D-016); PWA manifest now declares png + svg icons; SVG+PNG favicons in both apps; POS shell renders the full lockup; Showcase header carries the mark; `receiptHeaderHtml()` in packages/ui — self-contained 80mm header (inlined icon, merchant name/TIN/location, sub-brand line; VFD QR reserved for the footer in T2.4) previewed in the Showcase.

**Verified:** builds/lint/tests green; manifest fetch lists `/icons/icon-192.png, /icons/icon-512.png, /logo-icon.svg`; Chromium screenshots confirm the branded POS shell and Showcase header.

**Milestone note:** GitHub is now live — user re-initialized the folder from the fresh bundle and pushed successfully (`c7fe31c..e613305 main`). Update flow until a push-capable session exists: Builder drops `claude-history.bundle` in the folder → user runs `git pull claude-history.bundle main` → `git push`.

## 2026-07-16 — T1.1 Catalog module: Product CRUD + CSV import ✅ (M1 begins)

**Done:** `products` table (migration 1784140000000: FK merchant, partial-unique `(merchantId, sku)` where sku present, price/cost CHECKs, brand+model index) + `Product` entity (explicit column types per convention). `CatalogModule`: OWNER-gated create/update/archive + import, any-authenticated read. One validation source (`product.rules.ts`) feeds both CRUD bodies and CSV rows → identical per-field errors; taxCode A–E (TRA VFD groups, blank→A), integer-TZS-only prices. Zero-dependency RFC-4180 CSV parser (`csv.ts`: quotes, escaped quotes, CRLF, BOM). Import: header matched by name case-insensitively, every valid row imports, every bad row reported as `{line, errors[]}` (validation, in-file sku dupes, DB sku dupes) — one bad row never blocks the file. DELETE = soft archive (`active=false`); default list hides archived. JSON body limit raised to 2mb in main.ts for `{csv}` payloads. Shared gains `TaxCode`/`TAX_CODES`. Fixture: `apps/api/test/fixtures/products-sample-50.csv` (50 realistic TZ appliance rows incl. quoted commas).

**Verified (real Postgres):** 16 new tests (6 CSV parser unit, 10 supertest integration) — create normalizes + defaults taxCode; per-field 400s; CASHIER read-only (403 on write); merchant scoping (cross-merchant 404, same sku ok across merchants); archive semantics; **50-row sample imports with `{totalRows:50, imported:50, errors:[]}`**; engineered bad file reports errors keyed by exact file line (missing brand, decimal price, bad taxCode, in-file dupe, exists-in-DB dupe) while importing the good rows; header/`{csv}` guards 400. Full suite 36/36, lint + both builds green, migrate down/up clean, live smoke-boot on :3999 created a product end-to-end.

**Surprises:** (1) `DATA_SOURCE` token lived in `db.module.ts` while `AuditService` imported it from there — a latent CJS circular import that left the token `undefined` once CatalogModule joined the graph (API refused to boot). Token moved to `src/db/tokens.ts` (mirrors `platform/tokens.ts`); importers updated. **Convention: DI tokens never live in module files.** (2) Constructor injection *by type* also dies under vitest's esbuild (no `design:paramtypes`) — CatalogController now uses explicit `@Inject(CatalogService)`; extend the T0.5 convention: **every constructor injection uses an explicit `@Inject(token)`**. (3) Dev machine had no Postgres/Docker and apt is TLS-intercepted; stood up Postgres 16.13 via npm-delivered binaries (`@embedded-postgres/windows-x64`) under `~/.biashara-devdb`, role/db per project defaults — see D-017.

## 2026-07-16 — T1.2 GRN receiving with serials ✅

**Done:** `grns` + `grn_lines` + `serialized_units` tables (migration 1784150000000; `UNIQUE(merchantId, serial)`, qty/cost CHECKs, product/status index) and entities. `InventoryModule` (owns all serial logic per ARCHITECTURE): `POST /grns` (OWNER) creates receipt + lines + one `SerializedUnit(IN_STOCK)` per serial **atomically**; `GET /grns`, `GET /grns/:id` return lines + the units each receipt brought in (provenance for T1.4). Duplicate serials — in-payload or already in stock for the merchant — reject the whole request with every offending serial named and its exact field path (`lines[i].serials[j]`), incl. current status of the clashing unit. Line `unitCostTzs` falls back to `product.costTzs`; unit stores its landed cost. Actor-attributed `GRN_RECEIVED` audit event via AuditService (first real use) + subscriber safety net. Receiving is OWNER-only (D-019).

**Verified (real Postgres):** 8 integration tests — **receiving 10 units (2 lines) creates exactly 10 `SerializedUnit(IN_STOCK)`** with location/merchant/grn provenance and correct per-line costs incl. fallback; **duplicate serial vs stock → 400 naming `serial "FRG-001" already exists for this merchant (status IN_STOCK)`** with nothing persisted (atomicity asserted); in-payload dupe points at both positions; same serial ok for another merchant; foreign location/product + archived product + empty lines rejected; CASHIER 403; cross-merchant GRN read 404. Full suite 44/44 (40 api + 4 ui), lint + builds green, migrate down/up clean, live smoke on :3999: create 201 with 3 IN_STOCK units, replay 400 with named serial.

**Surprise:** none in code; test-side only (JSON.stringify escapes quotes → assert on `errors[].message` directly). Stale smoke-server from the T1.1 session still held :3999 — kill by port before smoke tests.

## 2026-07-16 — T1.3 SerializedUnit state machine ✅

**Done:** `unit-state.ts` — the single legal-transition graph (transcribed from ARCHITECTURE.md: IN_STOCK→RESERVED→SOLD→DELIVERED→RETURNED + RESERVED→IN_STOCK release; RETURNED terminal in V1), pure `canTransition`/`assertTransition` + `IllegalUnitTransition` (409) whose message names serial, attempted transition, and the legal alternatives. `UnitStateService.transition()` — THE only door for status changes: row locked FOR UPDATE, transition validated, status change + actor-attributed `UNIT_<STATUS>` audit event (before/after + domain context like orderId) committed in ONE transaction; `AuditService.record()` gained an optional EntityManager for exactly this. No endpoint — T1.4/T2.x consume the service. No shortcut transitions: a direct POS sale composes RESERVE→SELL (D-021).

**Verified (real Postgres):** 31 new tests — the **full 5×5 matrix** (25 cases: exactly 5 legal, 20 illegal incl. self-transitions) at the pure layer; integration walks the whole lifecycle incl. release+re-reserve asserting persisted status and one audit event per step with actor/before/after/context; **all 20 illegal combos re-driven against the DB: each throws, leaves status untouched, and writes ZERO audit rows**; unknown unit + cross-merchant both 404 without state change. Full suite 75/75 (71 api + 4 ui), lint + builds green.

**Surprises:** none.

## 2026-07-16 — T1.4 Stock views + serial lookup ✅

**Done:** `StockService` + `StockController` in InventoryModule (read-side, any authenticated role — cashiers use both at the counter). `GET /stock` — per product × location status counts (`inStock/reserved/sold/returned`; DELIVERED excluded — those units are gone), filters `productId`/`locationId`/`q` (brand/model/sku ILIKE), single GROUP BY query with FILTER clauses. `GET /units/lookup?serial=` (query param: serials may contain `/`) — exact per-merchant match returning unit (+product/location/cost), **GRN provenance** (grn id, receivedAt, supplier, receivedBy, receiving location), and the full ordered history: RECEIVED (the insert) + every `UNIT_*` transition with actor, before/after, and domain context; safety-net UPDATE rows filtered out as noise. UI deferred to T6.1 dashboards (D-022 — SPA has no auth wiring until M5; verify clause is API-level).

**Verified (real Postgres):** 6 integration tests — fixture received through real `POST /grns` (6 fridges Duka + 4 TVs Ghala) then driven through the T1.3 state machine; **stock counts match the seeded fixture exactly** (fridges 4/1/1/0, TVs 1/1/0/1 with the DELIVERED unit absent) via deep-equal on the whole response; all three filters; **lookup of a received serial shows GRN provenance** (grn id, supplier, receiver, location) and history `RECEIVED → UNIT_RESERVED → UNIT_SOLD` with actors + orderId context; RETURNED unit shows its whole life in order; cross-merchant lookup 404, unknown serial 404, missing param 400; cashier read 200. Full suite 77/77, lint + builds green; live smoke as CASHIER on :3999.

**Surprise:** audit timestamp column is `at`, not `createdAt` (caught by tsc). Embedded PG had stopped (earlier process cleanup) — restarted per D-017; remember it does not auto-start after reboot.

## 2026-07-16 — T1.5 Non-serialized item support ✅ — **M1 COMPLETE**

**Done:** `products.isSerialized` (default true; immutable once the product has stock history — the two models don't convert) + `stock_levels` table (qty per merchant × product × location, `qty >= 0` CHECK, unique row; migration 1784160000000). GRN lines are now type-shaped: serialized products take `serials[]` (unchanged), non-serialized take `qty` — mixed receipts in one GRN; qty receipts lock-read the level row and accumulate (audit subscriber records the change; GRN_RECEIVED context is type-aware). Shape mismatches rejected per line with explicit guidance (serials↔qty each way). Catalog CRUD + CSV import accept `isSerialized` (true/false/yes/no/1/0; blank → serialized). `GET /stock` now returns both models side by side with an `isSerialized` flag — serialized rows carry status counts, non-serialized rows qty-on-hand. Neon dev branch migrated; **production branch migration deliberately deferred** (guardrail: prod schema changes want an explicit owner go — run `npm run migrate` with the prod URL, or it happens at first deploy).

**Verified (real Postgres):** 7 new tests — mixed GRN (3 serialized fridges + 10 cables) creates exactly 3 units and a level of 10 with correct line qtys; second receipt accumulates to 25; both shape mismatches rejected with per-field errors and the bad request changes nothing (atomicity); stock view deep-equal shows the cable row (isSerialized false, 25 on hand) next to the fridge row (3 IN_STOCK); CSV `isSerialized` column round-trips with blank-default and per-row error on garbage; type flip blocked once stock exists, allowed while fresh. T1.4 spec updated for the new field. Full suite 84/84, lint + builds green, migrate down/up clean.

**Surprises:** none.

## 2026-07-16 — T2.1 SalesOrder module: quotes, orders, lifecycle, quote PDF ✅ (M2 begins)

**Done:** `customers`, `sales_orders` (per-merchant sequential `number` — merchant row locked, `UNIQUE(merchantId, number)`), `sales_order_lines` (agreed `unitPriceTzs` captured at order time, defaults to catalog price), `sales_order_service_lines` (DELIVERY/INSTALLATION, kind CHECK) — migration 1784170000000. `OrdersModule` (OWNER+CASHIER): `POST /orders` creates QUOTE (default) or ORDER (born CONFIRMED) atomically with optional inline customer `{name, phone, tin}`; `order-state.ts` mirrors the T1.3 single-graph discipline over the full ARCHITECTURE lifecycle (QUOTE→CONFIRMED→PARTIALLY_FULFILLED→FULFILLED→CLOSED; CANCELLED only pre-fulfillment); `transition()` locks the row, validates, audits `ORDER_<STATUS>` in-transaction (accepts an external EntityManager for T2.2+ composition). Totals always computed from lines, never stored. `GET /orders/:id/quote.pdf` — pdfkit (pure-JS, D-023) A4 quotation: brand bar + wordmark placeholder in canonical colors via the new `@biashara/ui/tokens` subpath export (API-safe, no React; hex ban holds), bilingual sw/en labels, tabular TZS, green total, "not a fiscal receipt" disclaimer.

**Verified (real Postgres):** 7 integration tests — quote with inline customer + negotiated and catalog prices + 2 service lines totals to the shilling; ORDER born CONFIRMED with actor-attributed audit; sequential numbering; **lifecycle integration test** (confirm → cancel each audited in order; both edges 409 on the terminal state); per-field validation incl. bad type/qty/service-kind; DELIVERY role 403 + cross-merchant 404; **quote PDF renders with merchant branding placeholder** — %PDF magic, wordmark, sub-brand line, merchant name, KADIRIO title, SO number, and grand total all asserted (hex-glyph decode helper since pdfkit hex-encodes text). Full suite 91/91, lint + builds green, migrate down/up clean; live smoke on :3999 produced a visually-inspected 6KB quote PDF. Neon dev migrated; **prod migration pending an explicit owner go** (per-action rule).

**Surprises:** (1) pdfkit writes text as hex glyph arrays even with `compress:false` — spec decodes `<...>` strings to grep content. (2) Stale smoke-servers strike again: an old pre-orders API on :3999 answered the smoke test; kill-by-port before every smoke run.

## 2026-07-16 — T2.2 Serial reservation & pick ✅

**Done:** `serialized_units.orderLineId` (nullable FK + partial index, migration 1784180000000) links units to order lines. `FulfillmentService` (orders module, composes the two state machines — never bypasses either): `POST /orders/:id/reserve {lineId, serials[]}` on CONFIRMED orders — units must be IN_STOCK, right product, within line qty (counting already-assigned); `POST /orders/:id/fulfill {picks?}` — deferred quantities picked now (pick composes RESERVE→SELL per D-021), every serialized line must be fully assigned, non-serialized lines decrement their locked stock level at the order's location, order → FULFILLED; **cancel releases**: reserved units → IN_STOCK with `orderLineId` cleared, inside the same transaction as the order's CANCELLED transition. `UnitStateService.transition()` gained the optional EntityManager param for exactly this composition. Plus migration 1784190000000: **`audit_events.seq` bigserial** — `at` is transaction-stable in Postgres so same-transaction events tied; unit history (T1.4 lookup) now orders by seq.

**Verified (real Postgres):** 6 integration tests — **reserved serial excluded from available stock** (3/0 → 1 inStock / 2 reserved, unit row carries orderLineId); **cancel returns it** (back to 3/0, orderLineId null); **deferred order fulfills with pick** (units SOLD with `UNIT_RESERVED → UNIT_SOLD` trail in seq order, cable level 10→6, order FULFILLED); reserved order fulfills without re-picking; guards — over-reserve ("won't fit"), already-reserved serial, wrong product, serials on a qty line, reserve on QUOTE, under-assigned fulfill, insufficient qty stock with nothing persisted, failed fulfill leaves order CONFIRMED. Full suite 101/101 (97 api + 4 ui), lint + builds green, both migrations cycle down/up clean.

**Surprises:** the deferred-pick test caught a real audit-ordering bug — two events in one transaction share `now()` and uuid ids don't order, so serial history could render SOLD before RESERVED. Fixed durably with `audit_events.seq` (bigserial); **all history queries must order by seq, never by `at`**.

## 2026-07-16 — T2.3 Payments on orders ✅

**Done:** `payments` table (migration 1784200000000) — merchant/order FKs, method CHECK, `amountTzs <> 0`, `UNIQUE(reversesPaymentId)` (a payment reverses at most once, enforced by the DB), bigserial `seq`, and an **append-only trigger** (UPDATE/DELETE raise "payments is append-only — corrections are reversing entries") — the money hard rule now lives in the database like the audit log does. `PaymentsService`: `POST /orders/:id/payments` records CASH (mobile money is webhook territory, T2.5) on CONFIRMED/PARTIALLY_FULFILLED/FULFILLED orders under order lock — balance always computed (lines+services − ledger sum), overpayment rejected naming the balance, audit `PAYMENT_RECORDED` tagged DEPOSIT vs FULL_SETTLEMENT; **fully fulfilled + fully paid auto-closes** (FULFILLED→CLOSED through the order door). `POST .../:paymentId/reverse` writes the mirror entry (negative amount, `reversesPaymentId`, reason) — reversals of reversals rejected, freed balance payable again. `GET /orders/:id/payments` returns the ledger in seq order + summary. Order reads now carry `paidTzs`/`balanceTzs` in totals. Fiscal receipts will live in their OWN table (T2.4) precisely so payment rows never need an UPDATE (D-025).

**Verified (real Postgres):** 6 integration tests — **deposit + balance = total** asserted directly on the summary; **correction produces a reversing entry, never mutation**: original row byte-for-byte untouched, and raw SQL UPDATE/DELETE both rejected by the trigger; double-reverse 409, reverse-a-reversal 400; overpayment 400 with nothing landing in the ledger; guards for QUOTE/CANCELLED/zero/negative/float/MOBILE_MONEY; auto-close path with `ORDER_CLOSED` audit; ledger listing in insertion order with reversal linkage. Full suite 107/107 (103 api + 4 ui), lint + builds green, migration cycles clean.

**Surprises:** none in code (one test initially matched the subscriber's INSERT audit row instead of the domain event — filter by action).

## 2026-07-16 — T2.4 Fiscal integration point ✅

**Done:** `fiscal_receipts` table (migration 1784210000000; `UNIQUE(paymentId)` — receipt references the append-only ledger per D-025) + `FiscalModule`: every recorded payment enqueues a BullMQ job (after commit; enqueue failure lands in audit as `FISCAL_ENQUEUE_FAILED`, never loses the payment); `FiscalWorker` builds the draft and calls `FiscalService.issueReceipt` (stub) — success persists the VFD result + `FISCAL_ISSUED` audit (with attempt count); failure throws back to BullMQ (exponential backoff, `FISCAL_MAX_ATTEMPTS`/`FISCAL_BACKOFF_MS` env knobs, failed jobs kept for the T5.7 aging alert; `jobId=paymentId` makes enqueue idempotent, `idempotencyKey=paymentId` makes TRA submission idempotent). Draft rules (D-026): full-total payment itemizes order lines + services; deposits fiscalize as one summary line (stub enforces items-sum==payment). Reversals never fiscalize. `GET /orders/:id/payments/:paymentId/receipt` — self-contained 80mm HTML: T0.7 brand header (`@biashara/ui/receipt` subpath), items, green total, VFD footer (number, verification code, inlined QR SVG via `qrcode`); reprint = the same read. Local Redis = the Memurai service already running on this machine (:6379); CI gained a `redis:7` service + `REDIS_URL`.

**Verified (real Postgres + real Redis/Memurai):** 4 integration tests on an isolated per-run queue — **payment → receipt with stub VFD number** (STUB-VFD-…, audit attempts=1); **receipt HTML shows VFD number + QR** and **reprint returns the identical document**; **forced stub outage (failNext(2)) retries and succeeds** — audit records attempts=3; reversals produce no receipt and unfiscalized payments 404 with a "still in the fiscal queue" message. Full suite 111/111 (107 api + 4 ui), lint + builds green, migration cycles clean; live smoke on :3999: cash payment fiscalized through the real queue, 3.9KB receipt with QR + brand header.

**Surprises:** none in code. Stale smoke-server on :3999 again (third time) — always kill-by-port first.
