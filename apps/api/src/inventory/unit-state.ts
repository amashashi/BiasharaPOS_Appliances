import { ConflictException } from '@nestjs/common';
import type { UnitStatus } from '@biashara/shared';

/**
 * The ONLY definition of legal serialized-unit transitions (T1.3, D-007).
 * Transcribed from ARCHITECTURE.md (binding):
 *   IN_STOCK → RESERVED → SOLD → DELIVERED → RETURNED, plus RESERVED → IN_STOCK (release).
 * Deliberately no shortcuts (e.g. IN_STOCK→SOLD): a direct POS sale composes
 * RESERVE then SELL (D-021). RETURNED is terminal in V1 ('IN_SERVICE' arrives in V2).
 */
const LEGAL_TRANSITIONS: Readonly<Record<UnitStatus, readonly UnitStatus[]>> = {
  IN_STOCK: ['RESERVED'],
  RESERVED: ['SOLD', 'IN_STOCK'],
  SOLD: ['DELIVERED'],
  DELIVERED: ['RETURNED'],
  RETURNED: [],
};

export function canTransition(from: UnitStatus, to: UnitStatus): boolean {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}

export class IllegalUnitTransition extends ConflictException {
  constructor(serial: string, from: UnitStatus, to: UnitStatus) {
    super(
      `Illegal unit transition ${from} → ${to} for serial "${serial}" ` +
        `(legal from ${from}: ${LEGAL_TRANSITIONS[from].join(', ') || 'none — terminal state'})`,
    );
  }
}

/** Throws IllegalUnitTransition unless from→to is in the legal graph. */
export function assertTransition(serial: string, from: UnitStatus, to: UnitStatus): void {
  if (!canTransition(from, to)) throw new IllegalUnitTransition(serial, from, to);
}
