import { describe, expect, it } from 'vitest';
import type { UnitStatus } from '@biashara/shared';
import { assertTransition, canTransition, IllegalUnitTransition } from './unit-state.js';

const STATES: UnitStatus[] = ['IN_STOCK', 'RESERVED', 'SOLD', 'DELIVERED', 'RETURNED'];

/** The complete legal graph per ARCHITECTURE.md — the single source this spec asserts against. */
const LEGAL: Array<[UnitStatus, UnitStatus]> = [
  ['IN_STOCK', 'RESERVED'],
  ['RESERVED', 'SOLD'],
  ['RESERVED', 'IN_STOCK'], // release
  ['SOLD', 'DELIVERED'],
  ['DELIVERED', 'RETURNED'],
];

const isLegal = (from: UnitStatus, to: UnitStatus): boolean =>
  LEGAL.some(([f, t]) => f === from && t === to);

describe('unit state machine — full 5×5 transition matrix (T1.3)', () => {
  for (const from of STATES) {
    for (const to of STATES) {
      const legal = isLegal(from, to);
      it(`${from} → ${to} is ${legal ? 'LEGAL' : 'ILLEGAL'}`, () => {
        expect(canTransition(from, to)).toBe(legal);
        if (legal) {
          expect(() => assertTransition('SN-1', from, to)).not.toThrow();
        } else {
          expect(() => assertTransition('SN-1', from, to)).toThrow(IllegalUnitTransition);
        }
      });
    }
  }

  it('exactly 5 of 25 transitions are legal', () => {
    const count = STATES.flatMap((f) => STATES.map((t) => canTransition(f, t))).filter(
      Boolean,
    ).length;
    expect(count).toBe(5);
  });

  it('the error names serial, states, and the legal alternatives', () => {
    try {
      assertTransition('IMEI-353', 'IN_STOCK', 'DELIVERED');
      expect.unreachable();
    } catch (e) {
      const msg = (e as Error).message;
      expect(msg).toContain('IN_STOCK → DELIVERED');
      expect(msg).toContain('IMEI-353');
      expect(msg).toContain('legal from IN_STOCK: RESERVED');
    }
  });

  it('terminal RETURNED says so explicitly', () => {
    expect(() => assertTransition('SN-9', 'RETURNED', 'IN_STOCK')).toThrow(/terminal state/);
  });
});
