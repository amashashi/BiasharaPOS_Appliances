import { describe, expect, it } from 'vitest';
import { daysBetween, isOverdue } from './arrears.js';

describe('arrears date math (T3.3)', () => {
  it('counts whole days from due date to asOf, negative before due', () => {
    expect(daysBetween('2026-08-05', '2026-08-05')).toBe(0);
    expect(daysBetween('2026-08-05', '2026-08-12')).toBe(7);
    expect(daysBetween('2026-08-05', '2026-08-04')).toBe(-1);
    expect(daysBetween('2026-08-31', '2026-09-01')).toBe(1); // across month end
  });

  it('a row is overdue only when past due AND not fully paid', () => {
    const base = { dueDate: '2026-08-05', amountTzs: 300000 };
    expect(isOverdue({ ...base, paidTzs: 0 }, '2026-08-06')).toBe(true);
    expect(isOverdue({ ...base, paidTzs: 100000 }, '2026-08-06')).toBe(true); // partial + late
    expect(isOverdue({ ...base, paidTzs: 300000 }, '2026-08-06')).toBe(false); // paid off
    expect(isOverdue({ ...base, paidTzs: 0 }, '2026-08-05')).toBe(false); // due today, not yet late
    expect(isOverdue({ ...base, paidTzs: 0 }, '2026-08-04')).toBe(false); // not yet due
  });
});
