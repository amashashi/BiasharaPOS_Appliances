/** Pure arrears date math (T3.3) — kept DB-free so it unit-tests cleanly. */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days from `dueDate` up to `asOf` (both YYYY-MM-DD). Negative if not yet due. */
export function daysBetween(dueDate: string, asOf: string): number {
  const due = Date.parse(`${dueDate}T00:00:00Z`);
  const at = Date.parse(`${asOf}T00:00:00Z`);
  return Math.round((at - due) / DAY_MS);
}

/** A schedule row is in arrears when it is past due and not fully paid. */
export function isOverdue(
  row: { dueDate: string; amountTzs: number; paidTzs: number },
  asOf: string,
): boolean {
  return row.paidTzs < row.amountTzs && daysBetween(row.dueDate, asOf) > 0;
}
