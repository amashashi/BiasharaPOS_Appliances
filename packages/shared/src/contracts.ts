/**
 * Platform adapter contracts — FROZEN (D-004).
 * These interfaces are the only seam between this product's domain code and the
 * BiasharaPOS platform services. Domain modules depend on these types, never on
 * platform SDKs. Each has a stub implementation (M0) and a real one (M5).
 * Changing a contract requires Architect mode.
 *
 * NOTE (T0.3 audit): shapes derived from ARCHITECTURE.md; to be confirmed
 * against the platform team's API docs before M5 swap-in (tracked in PLAN.md).
 */

import type { Tzs, Role } from './index.js';

// ---------------------------------------------------------------------------
// Fiscal (TRA VFD)
// ---------------------------------------------------------------------------

export interface FiscalLineItem {
  description: string;
  quantity: number;
  unitPriceTzs: Tzs;
  /** TRA tax code, e.g. 'A' = standard VAT 18%, 'C' = exempt */
  taxCode: string;
}

export interface FiscalReceiptDraft {
  merchantTin: string;
  items: FiscalLineItem[];
  payment: { method: 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'BANK'; amountTzs: Tzs };
  /** Buyer TIN — required for B2B invoices */
  customerTin?: string;
  /** Client-generated idempotency key (offline replay safety) */
  idempotencyKey: string;
}

export interface FiscalReceipt {
  vfdNumber: string;
  verificationCode: string;
  /** TRA verification QR target printed on the receipt */
  qrUrl: string;
  issuedAt: string; // ISO 8601
}

export interface FiscalService {
  /** Submit a receipt to TRA via the platform VFD service. Idempotent by draft.idempotencyKey. */
  issueReceipt(draft: FiscalReceiptDraft): Promise<FiscalReceipt>;
}

// ---------------------------------------------------------------------------
// Payments (mobile money rails)
// ---------------------------------------------------------------------------

export type MobileMoneyProvider = 'MPESA' | 'MIXX_BY_YAS' | 'AIRTEL_MONEY';

export interface PaymentIntent {
  intentId: string;
  provider: MobileMoneyProvider;
  msisdn: string;
  amountTzs: Tzs;
  /** Our reference (order/agreement id) echoed back in the confirmation webhook */
  ref: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

/** Webhook payload the platform POSTs to us on payment resolution. */
export interface PaymentConfirmation {
  intentId: string;
  status: 'CONFIRMED' | 'FAILED';
  providerRef: string;
  paidAt?: string; // ISO 8601, present when CONFIRMED
}

export interface PaymentsService {
  /** Trigger an STK/USSD push to the customer's phone. */
  initiateMobileMoneyPush(
    provider: MobileMoneyProvider,
    msisdn: string,
    amountTzs: Tzs,
    ref: string,
  ): Promise<{ intentId: string }>;
}

// ---------------------------------------------------------------------------
// Identity (platform OAuth2/JWT)
// ---------------------------------------------------------------------------

export interface AuthContext {
  merchantId: string;
  userId: string;
  displayName: string;
  roles: Role[];
}

export interface IdentityService {
  /** Validate a platform-issued JWT; throws on invalid/expired tokens. */
  verifyToken(jwt: string): Promise<AuthContext>;
}

// ---------------------------------------------------------------------------
// Notifications (SMS)
// ---------------------------------------------------------------------------

export interface NotificationService {
  /** Send a templated SMS (templates are bilingual sw/en, managed per merchant). */
  sendSms(msisdn: string, templateKey: string, params: Record<string, string>): Promise<void>;
}
