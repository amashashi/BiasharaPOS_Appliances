import { ConflictException } from '@nestjs/common';
import type { OrderStatus } from '@biashara/shared';

/**
 * Order lifecycle (T2.1, ARCHITECTURE.md statuses). Same single-graph
 * discipline as unit-state.ts. Fulfillment edges are consumed from T2.2 on;
 * CLOSED is reached when fully fulfilled AND fully paid (T2.3).
 * CANCELLED is only reachable before fulfillment starts.
 */
const LEGAL_TRANSITIONS: Readonly<Record<OrderStatus, readonly OrderStatus[]>> = {
  QUOTE: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'],
  PARTIALLY_FULFILLED: ['FULFILLED'],
  FULFILLED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: [],
};

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}

export class IllegalOrderTransition extends ConflictException {
  constructor(orderNumber: number, from: OrderStatus, to: OrderStatus) {
    super(
      `Illegal order transition ${from} → ${to} for order SO-${String(orderNumber).padStart(6, '0')} ` +
        `(legal from ${from}: ${LEGAL_TRANSITIONS[from].join(', ') || 'none — terminal state'})`,
    );
  }
}

export function assertOrderTransition(
  orderNumber: number,
  from: OrderStatus,
  to: OrderStatus,
): void {
  if (!canTransitionOrder(from, to)) throw new IllegalOrderTransition(orderNumber, from, to);
}
