# Decision Log — BiasharaPOS Appliance & Electronics Platform

> One short entry per non-obvious choice. Newest at top.

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
