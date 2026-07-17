import { describe, expect, it } from 'vitest';
import type { ScheduleRowStatus } from '@biashara/shared';
import {
  addMonthsClamped,
  applyDelta,
  generateEqualMonthly,
  rowStatusFor,
  validateCustomRows,
  type ApplicableRow,
} from './schedule.js';

const rows = (...amounts: number[]): ApplicableRow[] =>
  amounts.map((amountTzs, i) => ({ seq: i + 1, amountTzs, paidTzs: 0, status: 'PENDING' as ScheduleRowStatus }));
const snapshot = (rs: ApplicableRow[]) => rs.map((r) => ({ paid: r.paidTzs, status: r.status }));

describe('credit schedule generator (T3.1)', () => {
  it('adds months keeping the due day, clamped to month end', () => {
    expect(addMonthsClamped('2026-08-05', 1)).toBe('2026-09-05'); // kila tarehe 5
    expect(addMonthsClamped('2026-01-31', 1)).toBe('2026-02-28'); // clamp, not roll over
    expect(addMonthsClamped('2024-01-31', 1)).toBe('2024-02-29'); // leap year
    expect(addMonthsClamped('2026-11-30', 3)).toBe('2027-02-28'); // year boundary + clamp
  });

  it('equal monthly rows sum EXACTLY to the financed amount — remainder on the last row', () => {
    const rows = generateEqualMonthly(1_000_000, 3, '2026-08-05');
    expect(rows.map((r) => r.amountTzs)).toEqual([333333, 333333, 333334]);
    expect(rows.reduce((s, r) => s + r.amountTzs, 0)).toBe(1_000_000);
    expect(rows.map((r) => r.dueDate)).toEqual(['2026-08-05', '2026-09-05', '2026-10-05']);
    expect(rows.map((r) => r.seq)).toEqual([1, 2, 3]);
  });

  it('a single month takes the whole financed amount', () => {
    expect(generateEqualMonthly(1_220_000, 1, '2026-08-01')).toEqual([
      { seq: 1, dueDate: '2026-08-01', amountTzs: 1_220_000 },
    ]);
  });

  it('custom rows validate dates ascending, positive integers, and the exact sum', () => {
    const ok = validateCustomRows(100_000, [
      { dueDate: '2026-08-10', amountTzs: 60_000 },
      { dueDate: '2026-09-10', amountTzs: 40_000 },
    ]);
    expect(ok.errors).toEqual([]);
    expect(ok.plan.map((r) => r.seq)).toEqual([1, 2]);

    const bad = validateCustomRows(100_000, [
      { dueDate: '2026-08-10', amountTzs: 60_000 },
      { dueDate: '2026-08-10', amountTzs: 40_000.5 },
      { dueDate: 'siku ya tano', amountTzs: 1 },
    ]);
    const fields = bad.errors.map((e) => e.field);
    expect(fields).toEqual(
      expect.arrayContaining(['schedule.rows[1].dueDate', 'schedule.rows[1].amountTzs', 'schedule.rows[2].dueDate']),
    );

    const wrongSum = validateCustomRows(100_000, [{ dueDate: '2026-08-10', amountTzs: 99_999 }]);
    expect(wrongSum.errors[0].message).toContain('must sum to the financed amount');
  });
});

describe('credit schedule payment application (T3.2)', () => {
  it('rowStatusFor derives PAID / PARTIAL / PENDING', () => {
    expect(rowStatusFor({ amountTzs: 100, paidTzs: 100 })).toBe('PAID');
    expect(rowStatusFor({ amountTzs: 100, paidTzs: 40 })).toBe('PARTIAL');
    expect(rowStatusFor({ amountTzs: 100, paidTzs: 0 })).toBe('PENDING');
  });

  it('fills oldest-due-first, leaving a partial on the boundary row', () => {
    const rs = rows(300_000, 300_000, 300_000, 300_000);
    const left = applyDelta(rs, 750_000);
    expect(left).toBe(0);
    expect(snapshot(rs)).toEqual([
      { paid: 300_000, status: 'PAID' },
      { paid: 300_000, status: 'PAID' },
      { paid: 150_000, status: 'PARTIAL' },
      { paid: 0, status: 'PENDING' },
    ]);
  });

  it('accumulates across calls and reports the leftover that does not fit', () => {
    const rs = rows(100_000, 100_000);
    applyDelta(rs, 100_000); // clears row 1
    const left = applyDelta(rs, 150_000); // clears row 2 (100k), 50k has nowhere to go
    expect(left).toBe(50_000);
    expect(rs.every((r) => r.status === 'PAID')).toBe(true);
  });

  it('a reversal unwinds newest-paid-first (mirror of application order)', () => {
    const rs = rows(300_000, 300_000, 300_000);
    applyDelta(rs, 700_000); // rows: 300k PAID, 300k PAID, 100k PARTIAL
    applyDelta(rs, -250_000); // unwind from the newest paid row first
    expect(snapshot(rs)).toEqual([
      { paid: 300_000, status: 'PAID' },
      { paid: 150_000, status: 'PARTIAL' }, // 100k (row3) + 150k (row2) removed
      { paid: 0, status: 'PENDING' },
    ]);
  });

  it('full application then full reversal returns to all-PENDING', () => {
    const rs = rows(500_000, 700_000);
    applyDelta(rs, 1_200_000);
    expect(rs.every((r) => r.status === 'PAID')).toBe(true);
    applyDelta(rs, -1_200_000);
    expect(snapshot(rs)).toEqual([
      { paid: 0, status: 'PENDING' },
      { paid: 0, status: 'PENDING' },
    ]);
  });
});
