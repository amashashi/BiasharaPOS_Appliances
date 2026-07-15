# Architecture — BiasharaPOS Appliance & Electronics Platform

> Defines the **how** at a structural level. The Builder treats this as binding; changing it requires re-entering Architect mode.

**Status:** Draft (pending human approval)
**Last updated:** 2026-07-15

## Approach (chosen)

A **modular monolith** (single Node.js/TypeScript backend, module-per-domain) with a **web POS client (offline-capable PWA)** and a **web back office**, consuming the existing BiasharaPOS platform services (fiscalization, payments, identity, notifications, sync) through **typed API contracts with swappable adapters**. Optimizes for: small team velocity, one deployable, stack alignment with the existing platform, and independence of the domain model from the old product's closed-sale assumptions. Rejected options: vertical toggle in the existing product; microservices-first (see DECISIONS.md D-001, D-002).

## System shape

```
[ POS PWA (offline-capable) ]        [ Back-office web app ]
            │  REST/JSON (+ local IndexedDB queue)   │
            ▼                                        ▼
        [ API Gateway / NestJS app ─ modular monolith ]
   ┌──────────┬──────────┬──────────┬──────────┬───────────┐
   │ Catalog  │ Inventory│  Orders  │  Credit  │ Delivery  │   ← domain modules (new, owned here)
   │          │ (serials)│(sched.   │ (install-│           │
   │          │          │  sale)   │  ments)  │           │
   └──────────┴──────────┴──────────┴──────────┴───────────┘
   ┌───────────────────────────────────────────────────────┐
   │ Platform Adapters: Fiscal · Payments · Identity ·     │   ← thin clients over existing
   │ Notifications · Sync                                  │     BiasharaPOS platform APIs
   └───────────────────────────────────────────────────────┘
            │                     │
   [ PostgreSQL ]        [ BiasharaPOS platform services ]
                          (TRA VFD, mobile money, auth,
                           SMS, offline sync)
```

## Components

| Component | Responsibility | Notes |
|-----------|----------------|-------|
| POS PWA | Checkout, quotes, deposits, installment payment recording, serial scan/pick, works through outages for cash sales | React + IndexedDB outbox; service worker; talks only to our API |
| Back-office web | Catalog, receiving, credit/arrears dashboards, delivery planning, reports, settings | React SPA; online-only |
| Catalog module | Products, brands/models, pricing, tax category | No serial logic here |
| Inventory module | Goods receipts (GRN), `SerializedUnit` state machine, locations, stock views, serial lookup | The spine; owns serial truth |
| Orders module | `SalesOrder` lifecycle: quote → confirmed → fulfilled → closed; deposits; payment application; fiscal triggering | The "scheduled sale" object |
| Credit module | `CreditAgreement` (installment/layaway), schedules, arrears computation, reminders, statements | Retailer-carried credit only in V1 |
| Delivery module | Delivery jobs: schedule, assign, dispatch list, proof-of-delivery, serial confirmation | No route optimization in V1 |
| Platform adapters | Typed clients for Fiscal, Payments, Identity, Notifications, Sync platform APIs; each has a sandbox/stub implementation | Anti-corruption layer; contracts frozen in M0 |
| PostgreSQL | System of record for all new domain data | One schema; migrations via a standard tool |

## Data flow

**1. Receiving:** Back office creates GRN → staff scans serials per line → each serial becomes a `SerializedUnit(IN_STOCK, location)` → stock views update.

**2. Scheduled sale (the core flow):** POS creates `SalesOrder` (customer, lines, delivery/installation service lines) → optionally reserves specific serials (or defers pick to fulfillment) → takes deposit: Payment created → Fiscal adapter issues VFD receipt (or queues offline) → Delivery module schedules job → on delivery day, driver confirms serials + proof → units → `DELIVERED`, order fulfillment updated → balance payments recorded (each fiscalized) → order closes when paid + fulfilled.

**3. Installment sale:** SalesOrder + `CreditAgreement(INSTALLMENT)` with schedule → goods released (units `SOLD`) → payments recorded at POS (cash) or via Payments adapter STK-push; webhook confirms and applies payment to the schedule → nightly job computes arrears; reminders sent via Notifications adapter → agreement `SETTLED` when balance = 0. `LAYAWAY` variant: identical ledger, but units stay `RESERVED` until fully paid, then fulfillment proceeds.

**4. Offline:** POS writes sale + payment to IndexedDB outbox with client-generated UUIDs → service worker replays to API on reconnect → server validates serial availability against authoritative state (conflict → flagged exception queue, never silent overwrite) → queued payments fiscalized on replay within TRA's allowed submission window.

## Key interfaces / contracts

### Platform adapter contracts (frozen in M0; stub + real implementations)

```ts
interface FiscalService {
  issueReceipt(draft: FiscalReceiptDraft): Promise<FiscalReceipt>;
  // FiscalReceiptDraft: { merchantTin, items: {desc, qty, unitPrice, taxCode}[], payment: {method, amount}, customerTin? }
  // FiscalReceipt: { vfdNumber, verificationCode, qrUrl, issuedAt }
}

interface PaymentsService {
  initiateMobileMoneyPush(msisdn: string, amountTzs: number, ref: string): Promise<{ intentId: string }>;
  // Platform calls back: POST /webhooks/payments { intentId, status: 'CONFIRMED'|'FAILED', providerRef, paidAt }
}

interface IdentityService {
  // OAuth2/JWT: platform issues tokens; our API validates. Merchant + user + role claims.
  verifyToken(jwt: string): Promise<{ merchantId, userId, roles[] }>;
}

interface NotificationService {
  sendSms(msisdn: string, templateKey: string, params: Record<string, string>): Promise<void>;
}
```

### Core domain schema (seams only)

```ts
SerializedUnit {
  id: uuid; productId; serial: string;            // unique per merchant
  status: 'IN_STOCK'|'RESERVED'|'SOLD'|'DELIVERED'|'RETURNED';  // extensible for V2 'IN_SERVICE'
  locationId; grnId; costTzs; orderLineId?;
}
// Legal transitions: IN_STOCK→RESERVED→SOLD→DELIVERED; RESERVED→IN_STOCK (release);
// DELIVERED→RETURNED. Enforced in one place (state machine), audited.

SalesOrder {
  id; number; merchantId; customerId;
  status: 'QUOTE'|'CONFIRMED'|'PARTIALLY_FULFILLED'|'FULFILLED'|'CLOSED'|'CANCELLED';
  lines: { productId, qty, unitPriceTzs, serialUnitIds[] }[];
  serviceLines: { kind: 'DELIVERY'|'INSTALLATION', priceTzs }[];
  payments: Payment[];  balanceTzs: computed;
}

Payment { id; orderId; method: 'CASH'|'MOBILE_MONEY'|'CARD'|'BANK'; amountTzs; fiscalReceiptId?; intentId?; recordedBy; at; }

CreditAgreement {
  id; orderId; type: 'INSTALLMENT'|'LAYAWAY';
  principalTzs; depositTzs;
  schedule: { seq, dueDate, amountTzs, status: 'PENDING'|'PAID'|'PARTIAL'|'OVERDUE' }[];
  status: 'ACTIVE'|'SETTLED'|'DEFAULTED'|'CANCELLED';
  arrearsTzs: computed nightly + on payment;
}

Delivery {
  id; orderId; scheduledDate; window?; addressText; geo?; assigneeUserId;
  status: 'PLANNED'|'DISPATCHED'|'DELIVERED'|'FAILED';
  proof: { photoUrl?, signedByName?, otpConfirmed? }; confirmedSerialIds[];
}
```

### API surface (representative, not exhaustive)

```
POST /grns                          → create receipt, capture serials
POST /orders                        → create quote/order
POST /orders/:id/payments           → record payment (triggers fiscal)
POST /orders/:id/credit-agreement   → attach installment/layaway plan
GET  /credit/arrears?asOf=today     → arrears dashboard
POST /deliveries/:id/confirm        → proof + serial confirmation
POST /sync/outbox                   → offline replay endpoint (idempotent by client UUID)
```

## Stack

| Layer | Choice | Why (one line) |
|-------|--------|----------------|
| Language | TypeScript (backend + frontend) | Matches existing platform; one language across the team |
| Backend framework | NestJS | Modular-monolith structure out of the box; standard in Node shops; DI makes adapter swapping (stub↔real) trivial |
| Database | PostgreSQL | Relational integrity for serials/ledgers is non-negotiable; boring and proven |
| ORM/migrations | Prisma (or TypeORM if the existing platform already standardizes on it) | Typed schema + migration discipline; prefer whatever the platform team already runs |
| POS client | React PWA + IndexedDB (Dexie) + service worker | Matches existing web-POS model; offline outbox is the smallest thing that satisfies the offline requirement |
| Back office | React SPA (same design system as POS) | One frontend stack; no offline complexity where none is needed |
| Auth | Platform Identity API (OAuth2/JWT) | Borrowed, already exposed; zero custom auth code |
| Jobs/scheduling | BullMQ + Redis (arrears nightly job, reminder dispatch, fiscal retry queue) | Only stateful infra addition; needed for retries/reminders; well-worn |
| Hosting/CI | Same environment/CI conventions as existing platform | Ops leverage; no new deployment paradigm |

> Every dependency is a liability. Redis/BullMQ is the only infrastructure added beyond the platform's existing footprint; everything else aligns with what already runs.

## Non-functional notes

- **Offline:** scope = POS cash sales + payment capture + order creation against last-synced catalog/stock snapshot. Credit agreement creation, deliveries, and back office require connectivity. Conflicts (e.g., serial sold twice) surface in an exception queue for human resolution — never silently merged.
- **Fiscal compliance:** every payment fiscalized via platform Fiscal API; offline payments queue and fiscalize on replay. The per-payment vs. per-invoice question is abstracted behind `FiscalService` (open question #1 in the brief).
- **Money:** all amounts integer TZS (no decimals, no floats). Ledger entries append-only; corrections are reversing entries.
- **Audit:** serial state transitions and payment/credit mutations are event-logged (append-only table) — this is the future collateral-registry data asset.
- **i18n:** UI strings externalized day one; Swahili + English.
- **Scale:** design for hundreds of merchants, not millions. No premature sharding/caching.

## Acceptance criteria

- [ ] Receive a GRN with 10 serialized units; each serial is findable and shows status `IN_STOCK` at the correct location.
- [ ] Create a scheduled sale with deposit: order shows CONFIRMED, deposit fiscalized (VFD number + QR on receipt), delivery scheduled for a future date; completing delivery flips units to DELIVERED with proof stored; final payment closes the order.
- [ ] Sell the same serial twice → the system prevents it online, and flags it in the exception queue when it arrives via offline replay.
- [ ] Create an installment agreement (deposit + 4 monthly payments): schedule generated; a mobile-money STK payment confirmed via webhook auto-applies to the schedule; missing a due date shows the customer in the arrears dashboard next morning; a reminder SMS is dispatched.
- [ ] Layaway: goods remain RESERVED and undeliverable until the balance reaches zero.
- [ ] Kill connectivity: complete 3 cash sales at POS; restore connectivity; all 3 appear server-side with fiscal receipts issued, no duplicates.
- [ ] All money amounts round-trip as integer TZS; ledger sums reconcile per agreement and per order.
- [ ] A user with Swahili locale sees a fully translated POS flow.
- [ ] 3–5 design-partner dealers operate for 30 consecutive days (pilot gate, post-M6).
