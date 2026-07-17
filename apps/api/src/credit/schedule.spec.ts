import { describe, expect, it } from 'vitest';
import { addMonthsClamped, generateEqualMonthly, validateCustomRows } from './schedule.js';

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
