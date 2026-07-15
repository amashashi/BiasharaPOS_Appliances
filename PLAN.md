# Plan — BiasharaPOS Appliance & Electronics Platform

> The ordered task list the Builder executes. Written by the Architect; checked off by the Builder. **No code is written until the human approves this plan.**

**Status:** ✅ Approved
**Approved by:** Abdallah Mashashi — 2026-07-15

## Milestones
- [ ] **M0 — Foundations & contracts:** repo, CI, schema base, platform-adapter contracts with working stubs; the walking skeleton deploys.
- [ ] **M1 — Catalog & serialized inventory:** receive stock with serials; serial state machine is the source of truth.
- [ ] **M2 — Scheduled sales & POS checkout:** the appliance transaction exists end-to-end with fiscalized payments (stub fiscal).
- [ ] **M3 — Installment & layaway ledger:** the credit notebook is replaced.
- [ ] **M4 — Delivery workflow:** scheduled fulfillment with proof.
- [ ] **M5 — Real platform integration & offline:** stubs swapped for real APIs; POS survives an outage.
- [ ] **M6 — Back office, reporting & pilot readiness:** dealers can run a real day on it.

## Tasks

### M0 — Foundations & contracts
- [x] **T0.1** Monorepo scaffold (NestJS API, React POS PWA shell, React back-office shell, shared types package), lint/test/CI pipeline. — *Verify:* CI green on empty test suite; `docker compose up` serves API healthcheck + both web shells.
- [x] **T0.2** PostgreSQL + migration tooling + base entities (Merchant, Location, User refs from identity claims). — *Verify:* migration up/down clean; seed script creates a demo merchant with 2 locations.
- [x] **T0.3** Define and freeze platform adapter interfaces (`FiscalService`, `PaymentsService`, `IdentityService`, `NotificationService`) in shared types; implement **stub adapters** (in-memory fiscal numbers, fake STK push with auto-confirm webhook, JWT verification against a test key, console SMS). — *Verify:* contract tests pass against stubs; interfaces reviewed against real platform API docs (audit note attached to PR).
- [x] **T0.4** Auth middleware: validate platform JWT, resolve merchant/user/roles; role guard scaffolding (OWNER, CASHIER, DELIVERY). — *Verify:* requests without/with wrong-role token rejected in integration test.
- [x] **T0.5** Append-only audit-event table + helper (every domain mutation logs actor, entity, before/after). — *Verify:* creating any entity writes an audit row; test asserts immutability (no UPDATE/DELETE grants).
- [x] **T0.6** Design system foundation per `DESIGN_SYSTEM.md`: `packages/ui` with `tokens.ts` (inherited Biashara Green palette, Steel Blue sub-brand accent, type scale, spacing, domain status colors), core components (Button, MoneyDisplay with tabular-nums TZS, StatusBadge, SerialChip, OfflineBar), and a lint rule banning raw hex/spacing literals in feature code. — *Verify:* component showcase page renders all tokens/components in both Swahili and English; lint fails a fixture file containing a hex literal.
- [ ] **T0.7** Brand assets integrated: sub-brand lockup and icon (`brand/logo-appliances-lockup.svg`, `brand/logo-appliances-icon.svg`) wired into POS shell, back-office shell, favicon/PWA manifest icons, and the receipt/statement header templates. — *Verify:* both app shells display the lockup per the usage rules in DESIGN_SYSTEM.md §6; receipt preview shows the icon; PWA install prompt shows the correct icon.

### M1 — Catalog & serialized inventory
- [ ] **T1.1** Catalog module: Product CRUD (brand, model, category, tax code, prices), CSV import. — *Verify:* import 50-product sample file; validation errors reported per row.
- [ ] **T1.2** GRN receiving: create receipt with lines; capture serials per line (scan/type); duplicate-serial rejection per merchant. — *Verify:* receiving 10 units creates 10 `SerializedUnit(IN_STOCK)`; duplicate serial rejected with clear error.
- [ ] **T1.3** SerializedUnit state machine with single transition function + audit. — *Verify:* unit tests cover every legal/illegal transition; illegal transition throws and logs nothing.
- [ ] **T1.4** Stock views + serial lookup API/UI: stock by product/location, find-by-serial returns full unit history. — *Verify:* lookup of a received serial shows GRN provenance; counts match seeded data.
- [ ] **T1.5** Non-serialized item support (accessories, cables — qty-based) alongside serialized. — *Verify:* mixed GRN (serialized + qty lines) receives correctly; stock views show both.

### M2 — Scheduled sales & POS checkout
- [ ] **T2.1** SalesOrder module: create quote/order with lines + service lines (delivery/installation); status lifecycle; quote→order conversion; printable/shareable quote (PDF). — *Verify:* lifecycle integration test; quote PDF renders with merchant branding placeholder.
- [ ] **T2.2** Serial reservation & pick: reserve specific serials at order time OR defer; pick at fulfillment; release on cancel. — *Verify:* reserved serial excluded from available stock; cancel returns it; deferred order fulfills with pick.
- [ ] **T2.3** Payments on orders: record CASH payment; compute balance; deposit vs. full payment; reversing-entry corrections. — *Verify:* ledger test — deposit + balance = total; correction produces reversing entry, never mutation.
- [ ] **T2.4** Fiscal integration point: every payment triggers `FiscalService.issueReceipt` (stub); receipt (HTML/PDF) shows VFD number + QR; fiscal failures land in a retry queue (BullMQ). — *Verify:* payment → receipt with stub VFD number; forced stub failure retries and succeeds; receipt reprint works.
- [ ] **T2.5** Mobile-money payment at POS via `PaymentsService` stub: initiate push, pending state, webhook confirms, auto-applies + fiscalizes. — *Verify:* e2e test: initiate → webhook → payment applied → fiscal receipt issued.
- [ ] **T2.6** POS PWA checkout flow: product search/scan, cart, customer attach (name+phone), deposit/full payment, receipt print view. — *Verify:* manual script — complete a cash sale and a deposit sale in under 90 seconds each on a tablet browser.

### M3 — Installment & layaway ledger
- [ ] **T3.1** CreditAgreement module: create from order (type, deposit, schedule generator — equal monthly or custom rows); INSTALLMENT releases goods, LAYAWAY holds units RESERVED. — *Verify:* both types created from same order fixture; layaway blocks delivery until settled (test).
- [ ] **T3.2** Payment application to schedules: cash + mobile-money payments apply oldest-due-first; partial payments; settlement closes agreement. — *Verify:* property-style tests on application order; overpayment rejected or applied per spec.
- [ ] **T3.3** Arrears engine: nightly job computes overdue status/amounts; arrears dashboard API + back-office screen (sortable by days overdue, amount). — *Verify:* time-travel test (fake clock) moves an agreement into arrears; dashboard reflects next "morning".
- [ ] **T3.4** Reminders: reminder policy per merchant (e.g., T-2 days, due day, +3 days overdue) dispatched via `NotificationService`; per-agreement reminder log. — *Verify:* fake-clock test dispatches exactly the configured reminders; log visible on agreement screen.
- [ ] **T3.5** Customer statement: printable statement per agreement (schedule, payments, balance). — *Verify:* statement totals equal ledger; renders as PDF.

### M4 — Delivery workflow
- [ ] **T4.1** Delivery module: create/schedule delivery from order (date, window, address, assignee). — *Verify:* order screen shows scheduled delivery; double-booking same order prevented.
- [ ] **T4.2** Dispatch list (mobile-friendly page for delivery staff): today's jobs, order contents, customer phone, mark DISPATCHED. — *Verify:* delivery user role sees only assigned jobs.
- [ ] **T4.3** Proof-of-delivery: confirm serials on handover (scan/check), capture photo and/or customer-OTP confirm; units → DELIVERED; failed-delivery path with reason. — *Verify:* e2e — confirmed delivery flips serials + order status; failed delivery reschedules.

### M5 — Real platform integration & offline
- [ ] **T5.1** Swap Identity stub → real platform OAuth/JWT (staging). — *Verify:* login via platform staging credentials; roles map correctly.
- [ ] **T5.2** Swap Fiscal stub → real Fiscal API (staging/TRA sandbox); confirm installment fiscal treatment against compliance answer (brief open question #1). — *Verify:* staging payment produces verifiable VFD receipt; compliance decision recorded in DECISIONS.md.
- [ ] **T5.3** Swap Payments stub → real mobile-money API (staging): M-Pesa, Mixx by Yas, Airtel push + webhooks; reconciliation view for unmatched payments. — *Verify:* sandbox STK e2e per provider; orphan webhook lands in reconciliation view.
- [ ] **T5.4** Swap Notification stub → real SMS API. — *Verify:* reminder SMS received on a real TZ number in staging.
- [ ] **T5.5** POS offline outbox: IndexedDB queue for cash sales/payments with client UUIDs; service worker replay; idempotent `/sync/outbox` endpoint. — *Verify:* airplane-mode test — 3 sales offline, reconnect, exactly 3 server orders, no dupes on double-replay.
- [ ] **T5.6** Offline conflict handling: serial-conflict and stale-price exceptions surface in back-office exception queue with resolve actions. — *Verify:* engineered conflict (same serial sold online + offline) lands in queue; resolving releases/corrects correctly.
- [ ] **T5.7** Offline fiscalization: queued payments fiscalize on replay; aging alert if fiscal queue exceeds TRA window. — *Verify:* replayed sale gets VFD receipt; forced fiscal outage triggers aging alert.

### M6 — Back office, reporting & pilot readiness
- [ ] **T6.1** Dashboards: daily sales (by method), stock summary + aging, arrears summary, deliveries today. — *Verify:* numbers reconcile against raw queries on seeded fixture.
- [ ] **T6.2** Merchant onboarding flow: platform identity handshake, locations, staff invites/roles, fiscal + payment config check-list, catalog import. — *Verify:* fresh merchant to first sale in ≤ 30 min following the runbook, no engineer involved.
- [ ] **T6.3** i18n pass: Swahili + English complete for POS + credit screens. — *Verify:* locale switch shows no untranslated keys (lint check).
- [ ] **T6.4** Design-system QA pass: audit all screens against `DESIGN_SYSTEM.md` — contrast (≥4.5:1), status-badge vocabulary used consistently, money always via MoneyDisplay, 80mm receipt + A4 statement print styles correct with VFD QR uncropped, logo usage rules respected. — *Verify:* checklist signed off; violations filed and fixed or waived.
- [ ] **T6.5** UAT with 3–5 design-partner dealers: seeded real catalogs, scripted day-in-the-life (receive, sell, installment, delivery, outage drill), issue log triaged. — *Verify:* every P0/P1 from UAT fixed or explicitly waived by product owner; pilot go/no-go recorded.

## Discovered during build
> Builder adds tasks found mid-flight here instead of silently doing them.
- [ ] —

## Blocked
- [ ] **T5.2 dependency** — *Blocked on:* TRA compliance answer on installment fiscalization (product owner to obtain; needed before M5, not before M0–M4 since fiscal is stubbed).

---
**Legend:** `[ ]` todo · `[x]` done · `[~]` in progress · `[!]` blocked
