import type { Tzs } from '@biashara/shared';
import type { FieldError } from '../catalog/product.rules.js';

export interface ScheduleRowPlan {
  seq: number;
  dueDate: string; // YYYY-MM-DD
  amountTzs: Tzs;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isIsoDate = (s: string): boolean => {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

/**
 * Add months keeping the day-of-month, clamped to the target month's end —
 * an agreement due on the 31st falls due Feb 28, not Mar 3. Mali-kauli
 * customers think in "kila tarehe 5" (every 5th); the math must too.
 */
export function addMonthsClamped(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  const targetMonthIndex = m - 1 + months;
  const targetYear = y + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  const result = new Date(Date.UTC(targetYear, targetMonth, day));
  return result.toISOString().slice(0, 10);
}

/**
 * Equal monthly rows summing EXACTLY to financedTzs — integer TZS only, the
 * rounding remainder lands on the last row.
 */
export function generateEqualMonthly(
  financedTzs: Tzs,
  months: number,
  firstDueDate: string,
): ScheduleRowPlan[] {
  const base = Math.floor(financedTzs / months);
  if (base < 1) throw new Error('financed amount too small for that many months');
  return Array.from({ length: months }, (_, i) => ({
    seq: i + 1,
    dueDate: addMonthsClamped(firstDueDate, i),
    amountTzs: i === months - 1 ? financedTzs - base * (months - 1) : base,
  }));
}

/** Validate custom rows: ISO dates strictly ascending, positive integer amounts, exact sum. */
export function validateCustomRows(
  financedTzs: Tzs,
  rows: Array<{ dueDate?: unknown; amountTzs?: unknown }>,
): { plan: ScheduleRowPlan[]; errors: FieldError[] } {
  const errors: FieldError[] = [];
  const plan: ScheduleRowPlan[] = [];
  let previous = '';
  for (let i = 0; i < rows.length; i++) {
    const at = (f: string): string => `schedule.rows[${i}].${f}`;
    const dueDate = String(rows[i]?.dueDate ?? '');
    const amountTzs = rows[i]?.amountTzs;
    if (!isIsoDate(dueDate)) {
      errors.push({ field: at('dueDate'), message: 'dueDate must be YYYY-MM-DD' });
      continue;
    }
    if (previous && dueDate <= previous) {
      errors.push({ field: at('dueDate'), message: 'dueDates must be strictly ascending' });
    }
    previous = dueDate;
    if (typeof amountTzs !== 'number' || !Number.isSafeInteger(amountTzs) || amountTzs <= 0) {
      errors.push({ field: at('amountTzs'), message: 'amountTzs must be a positive whole number of TZS' });
      continue;
    }
    plan.push({ seq: plan.length + 1, dueDate, amountTzs });
  }
  if (errors.length === 0) {
    const sum = plan.reduce((s, r) => s + r.amountTzs, 0);
    if (sum !== financedTzs) {
      errors.push({
        field: 'schedule.rows',
        message: `schedule must sum to the financed amount: rows total TZS ${sum.toLocaleString('en-US')}, financed is TZS ${financedTzs.toLocaleString('en-US')}`,
      });
    }
  }
  return { plan, errors };
}
