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

/**
 * TRA VFD tax groups carried on every catalog item and fiscal receipt line.
 * A = standard rate (18% VAT), B = special rate, C = zero-rated,
 * D = special relief, E = exempt.
 */
export type TaxCode = 'A' | 'B' | 'C' | 'D' | 'E';
export const TAX_CODES: readonly TaxCode[] = ['A', 'B', 'C', 'D', 'E'];

export type CreditAgreementType = 'INSTALLMENT' | 'LAYAWAY';

export type CreditAgreementStatus =
  | 'ACTIVE'
  | 'SETTLED'
  | 'DEFAULTED'
  | 'CANCELLED';

/** One row of a credit agreement's payment schedule (T3.1). */
export type ScheduleRowStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'OVERDUE';

export type DeliveryStatus = 'PLANNED' | 'DISPATCHED' | 'DELIVERED' | 'FAILED';

export * from './contracts.js';
