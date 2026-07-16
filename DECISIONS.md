# Decision Log — BiasharaPOS Appliance & Electronics Platform

> One short entry per non-obvious choice. Newest at top.

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
