/**
 * @biashara/shared — shared domain types and platform-adapter contracts.
 * Contracts here are FROZEN per ARCHITECTURE.md; changing them requires Architect mode.
 */

/** Opaque UUID string (client-generated v4 for offline-created entities). */
export type UUID = string;

/**
 * All money in the system is integer Tanzanian Shillings.
 * Never floats, never decimals (ARCHITECTURE.md non-functional notes).
 */
export type Tzs = number;

export type Role = 'OWNER' | 'CASHIER' | 'DELIVERY';

export interface HealthStatus {
  status: 'ok';
  service: string;
  version: string;
}

/** Serialized unit lifecycle (D-007). Extensible with 'IN_SERVICE' in V2. */
export type UnitStatus =
  | 'IN_STOCK'
  | 'RESERVED'
  | 'SOLD'
  | 'DELIVERED'
  | 'RETURNED';

export type OrderStatus =
  | 'QUOTE'
  | 'CONFIRMED'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CLOSED'
  | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'MOBILE_MONEY' | 'CARD' | 'BANK';

export type CreditAgreementType = 'INSTALLMENT' | 'LAYAWAY';

export type CreditAgreementStatus =
  | 'ACTIVE'
  | 'SETTLED'
  | 'DEFAULTED'
  | 'CANCELLED';

export type DeliveryStatus = 'PLANNED' | 'DISPATCHED' | 'DELIVERED' | 'FAILED';
