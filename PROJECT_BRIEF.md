# Project Brief — BiasharaPOS Appliance & Electronics Platform ("Biashara Appliances", working name)

> Source of truth for **what** and **why**. Distilled from the product brainstorm of 2026-07-15 (see project docs `brainstorm/appliance-vertical-brainstorm-summary.md` and `research/market-feature-landscape.md`).

**Status:** Approved (brainstorm concluded; direction confirmed by product owner)
**Date:** 2026-07-15
**One-liner:** An independent, offline-tolerant retail platform for home appliance & electronics dealers in Tanzania — built around the three things generic POS cannot do: serialized inventory, the scheduled sale, and installment/shop-credit selling — borrowing fiscalization, payments, identity, and notifications from the existing BiasharaPOS platform via its APIs.

## Problem

Appliance/electronics retail is structurally different from generic retail, and no platform available in Tanzania handles it:
1. **The item has an identity.** A fridge is a serial number with a warranty and service history, not a SKU × quantity. Generic POS (incl. BiasharaPOS retail vertical, Square, Loyverse) has no serialized inventory.
2. **The sale is not the fulfillment.** Deposit today, delivery Thursday, installation Friday, after-sales for years. Generic POS assumes the sale closes at the counter.
3. **Payment is often incomplete at the counter.** Installments ("mali kauli" / lipa mdogo mdogo) and layaway are tracked today in paper notebooks — the retailer's biggest source of anxiety (untracked arrears, disputes, lost records).

Global vertical software (STORIS, TylerNet) solves this but is US-centric, dated, and knows nothing of TRA VFD fiscalization or mobile money. Local TZ POS vendors solve compliance + M-Pesa but nothing vertical. The intersection is empty.

## Who it's for

- **Owner/manager** of a formal or semi-formal appliance & electronics shop (Kariakoo, Mwenge, regional towns): needs stock truth by serial, credit-book control, arrears visibility.
- **Counter staff**: fast checkout, quotes, deposits, installment payment recording.
- **Delivery staff**: what to deliver, where, confirmation with proof.
- (Phase 2, out of V1 scope: financiers consuming repayment data.)

## Success criteria

- [ ] A dealer can receive stock with serials, sell a unit by serial, and trace any serial to its customer, order, payments, and delivery — end to end.
- [ ] A scheduled sale (deposit → delivery on a future date → balance collection) is representable and completable without workarounds.
- [ ] A shopkeeper can replace the credit notebook: create an installment or layaway agreement, record payments (cash + mobile money), see who is in arrears today, and send payment reminders.
- [ ] Every payment produces a TRA-compliant fiscal receipt via the platform Fiscal API.
- [ ] POS keeps selling (cash sale + payment capture) through an internet outage and reconciles when back online, including queued fiscalization.
- [ ] 3–5 design-partner dealers run their real daily operations on it for 30 consecutive days.

## Constraints

- **Stack / platform:** Node.js/TypeScript backend (aligned with existing BiasharaPOS); web/browser POS client (matches existing client model); PostgreSQL. Shared platform services (TRA VFD fiscalization, mobile-money payments, identity/onboarding, offline sync, SMS notifications) are **already exposed as APIs** and must be consumed, not reimplemented — unless an audited contract gap forces a scoped reimplementation behind the same interface.
- **Must-haves:** serialized inventory; scheduled-sale order model; installment + layaway ledger; TRA VFD fiscal receipts; mobile money (M-Pesa, Mixx by Yas, Airtel Money) via platform Payments API; offline sale capture; Swahili + English UI.
- **Must-NOT-haves (V1):** no lending by us or credit scoring; no financier integrations; no e-commerce storefront; no WhatsApp catalog; no warranty/repair job cards (V2); no multi-country tax logic; no route optimization.

## Scope

**In scope for V1:** product catalog + serialized receiving/stock; sales orders with quotes, deposits, scheduled fulfillment; POS checkout (cash, mobile money) with fiscal receipts; installment & layaway credit agreements with payment recording, reminders, arrears dashboard; basic delivery workflow (schedule, assign, confirm with proof); back-office dashboards (sales, stock by serial, arrears); merchant onboarding via platform identity.

**Out of scope (for now):** warranty registration & service/repair job cards (V2); trade-ins; vendor price files; financier marketplace; multi-branch transfers beyond basic location support; hardware integrations beyond standard receipt printing.

## Chosen direction

Independent product on a shared-services foundation ("modular monolith + platform APIs") — see DECISIONS.md D-001–D-005. Rejected: building as a vertical toggle inside the existing product (data-model conflict: closed-sale assumption), and microservices-from-day-one (ops cost with no V1 payoff).

## Open questions

1. **TRA fiscal treatment of installment sales** — fiscalize the full invoice at sale vs. a fiscal receipt per payment received. Architecture abstracts both; needs confirmation from TRA compliance counsel before M5. Current working assumption: fiscal receipt per payment.
2. **Reusability of the existing offline-sync service for new aggregate types** — assumed consumable; verify in M0 contract audit; fallback design included.
3. **Serial capture point** — at receiving (preferred, better stock truth) vs. at sale (lower friction). V1 supports receiving-time capture with sale-time capture as fallback per dealer setting.
