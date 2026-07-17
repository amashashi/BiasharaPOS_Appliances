import { Inject, Injectable } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { Tzs } from '@biashara/shared';
import { DATA_SOURCE } from '../db/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { daysBetween } from './arrears.js';

export interface ArrearsRow {
  agreementId: string;
  orderId: string;
  orderNumber: number;
  type: string;
  customer: { id: string; name: string; phone: string | null };
  arrearsTzs: Tzs;
  overdueRows: number;
  oldestDueDate: string;
  daysOverdue: number;
  nextDueDate: string | null;
  scheduleBalanceTzs: Tzs;
}

export type ArrearsSort = 'days' | 'amount';

/** UTC today as YYYY-MM-DD — the default `asOf` for the nightly job and dashboard. */
export const todayIso = (): string => new Date().toISOString().slice(0, 10);

/**
 * Arrears engine (T3.3). `recomputeOverdue` is the nightly job's work: flip
 * past-due, not-fully-paid rows of ACTIVE agreements to OVERDUE. `dashboard`
 * computes arrears LIVE from dates (robust regardless of when the job last
 * ran); the persisted OVERDUE status drives the schedule view + reminders (T3.4).
 * Every method takes an explicit `asOf` so a fake clock can time-travel in tests.
 */
@Injectable()
export class ArrearsService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /**
   * Nightly job: persist OVERDUE on past-due unpaid rows of ACTIVE agreements.
   * Idempotent. The nightly worker runs global; pass `merchantId` to scope
   * (a merchant-triggered recompute, and test isolation on the shared DB).
   */
  async recomputeOverdue(
    asOf: string = todayIso(),
    merchantId?: string,
  ): Promise<{ rowsFlipped: number }> {
    const flipped: Array<{ id: string }> = await this.ds.query(
      `UPDATE credit_schedule_rows r
          SET status = 'OVERDUE'
         FROM credit_agreements a
        WHERE r."agreementId" = a.id
          AND a.status = 'ACTIVE'
          AND r."paidTzs" < r."amountTzs"
          AND r."dueDate" < $1
          AND r.status IN ('PENDING', 'PARTIAL')
          AND ($2::uuid IS NULL OR a."merchantId" = $2)
      RETURNING r.id`,
      [asOf, merchantId ?? null],
    );
    const rowsFlipped = flipped.length;
    if (rowsFlipped > 0) {
      await this.audit.record({
        merchantId: merchantId ?? null,
        actorUserId: 'system:arrears',
        entityType: 'ArrearsRun',
        entityId: asOf,
        action: 'ARREARS_RECOMPUTED',
        after: { asOf, rowsFlipped, merchantId: merchantId ?? null },
      });
    }
    return { rowsFlipped };
  }

  /** Arrears dashboard: one row per ACTIVE agreement with something past due. */
  async dashboard(
    merchantId: string,
    asOf: string = todayIso(),
    sort: ArrearsSort = 'days',
  ): Promise<{ asOf: string; items: ArrearsRow[]; totals: { agreements: number; arrearsTzs: Tzs } }> {
    const rows: Array<{
      agreementId: string;
      orderId: string;
      orderNumber: number;
      type: string;
      customerId: string;
      customerName: string;
      customerPhone: string | null;
      arrearsTzs: number;
      overdueRows: number;
      oldestDueDate: string;
      nextDueDate: string | null;
      scheduleBalanceTzs: number;
    }> = await this.ds.query(
      `SELECT a.id AS "agreementId", a."orderId", o."number" AS "orderNumber", a."type",
              c.id AS "customerId", c."name" AS "customerName", c."phone" AS "customerPhone",
              SUM(CASE WHEN r."dueDate" < $2 THEN r."amountTzs" - r."paidTzs" ELSE 0 END)::int AS "arrearsTzs",
              COUNT(*) FILTER (WHERE r."dueDate" < $2)::int AS "overdueRows",
              MIN(r."dueDate") FILTER (WHERE r."dueDate" < $2)::text AS "oldestDueDate",
              MIN(r."dueDate") FILTER (WHERE r."dueDate" >= $2)::text AS "nextDueDate",
              SUM(r."amountTzs" - r."paidTzs")::int AS "scheduleBalanceTzs"
         FROM credit_agreements a
         JOIN sales_orders o ON o.id = a."orderId"
         JOIN customers c ON c.id = a."customerId"
         JOIN credit_schedule_rows r ON r."agreementId" = a.id AND r."paidTzs" < r."amountTzs"
        WHERE a."merchantId" = $1 AND a.status = 'ACTIVE'
        GROUP BY a.id, a."orderId", o."number", a."type", c.id, c."name", c."phone"
       HAVING COUNT(*) FILTER (WHERE r."dueDate" < $2) > 0`,
      [merchantId, asOf],
    );

    const items: ArrearsRow[] = rows.map((r) => ({
      agreementId: r.agreementId,
      orderId: r.orderId,
      orderNumber: r.orderNumber,
      type: r.type,
      customer: { id: r.customerId, name: r.customerName, phone: r.customerPhone },
      arrearsTzs: r.arrearsTzs,
      overdueRows: r.overdueRows,
      oldestDueDate: r.oldestDueDate,
      daysOverdue: daysBetween(r.oldestDueDate, asOf),
      nextDueDate: r.nextDueDate,
      scheduleBalanceTzs: r.scheduleBalanceTzs,
    }));

    items.sort((a, b) =>
      sort === 'amount'
        ? b.arrearsTzs - a.arrearsTzs || b.daysOverdue - a.daysOverdue
        : b.daysOverdue - a.daysOverdue || b.arrearsTzs - a.arrearsTzs,
    );

    return {
      asOf,
      items,
      totals: {
        agreements: items.length,
        arrearsTzs: items.reduce((s, i) => s + i.arrearsTzs, 0),
      },
    };
  }
}
