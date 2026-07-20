import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DATA_SOURCE } from '../db/tokens.js';
import { ArrearsService } from '../credit/arrears.service.js';

const todayIso = (): string => new Date().toISOString().slice(0, 10);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface DashboardOverview {
  date: string;
  dailySales: { totalTzs: number; count: number; byMethod: Array<{ method: string; count: number; totalTzs: number }> };
  stock: {
    serialized: { inStock: number; byStatus: Record<string, number>; aging: { fresh: number; aging: number; stale: number }; valueTzs: number };
    nonSerializedQty: number;
  };
  arrears: { agreements: number; arrearsTzs: number };
  deliveries: { planned: number; dispatched: number; delivered: number; failed: number };
}

/**
 * Owner dashboard (T6.1). Four at-a-glance aggregates for a day: cash-in by
 * method, stock health (counts by unit state + IN_STOCK aging + value at cost),
 * arrears, and today's deliveries. Every figure is a straight aggregate over the
 * system-of-record tables (arrears reuses ArrearsService so it can never drift
 * from the arrears screen). Daily sales counts a payment on its COLLECTION day
 * (occurredAt — the offline sale day for replays, T5.7), not the ledger-write day.
 */
@Injectable()
export class DashboardService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(ArrearsService) private readonly arrears: ArrearsService,
  ) {}

  async overview(merchantId: string, dateInput?: string): Promise<DashboardOverview> {
    const date = dateInput && ISO_DATE.test(dateInput) ? dateInput : todayIso();

    const [dailySales, stock, deliveries, arrearsTotals] = await Promise.all([
      this.dailySales(merchantId, date),
      this.stock(merchantId),
      this.deliveries(merchantId, date),
      this.arrears.dashboard(merchantId, date).then((r) => r.totals),
    ]);

    return { date, dailySales, stock, arrears: arrearsTotals, deliveries };
  }

  private async dailySales(merchantId: string, date: string): Promise<DashboardOverview['dailySales']> {
    const rows: Array<{ method: string; count: number; totalTzs: number }> = await this.ds.query(
      `SELECT method, COUNT(*)::int AS count, SUM("amountTzs")::int AS "totalTzs"
         FROM payments
        WHERE "merchantId" = $1 AND "amountTzs" > 0 AND COALESCE("occurredAt", at)::date = $2::date
        GROUP BY method
        ORDER BY method`,
      [merchantId, date],
    );
    return {
      byMethod: rows,
      totalTzs: rows.reduce((s, r) => s + r.totalTzs, 0),
      count: rows.reduce((s, r) => s + r.count, 0),
    };
  }

  private async stock(merchantId: string): Promise<DashboardOverview['stock']> {
    const [byStatusRows, [aging], [{ valueTzs }], [{ qty }]] = await Promise.all([
      this.ds.query(
        `SELECT status, COUNT(*)::int AS count FROM serialized_units WHERE "merchantId" = $1 GROUP BY status`,
        [merchantId],
      ) as Promise<Array<{ status: string; count: number }>>,
      this.ds.query(
        `SELECT
           COUNT(*) FILTER (WHERE now() - "createdAt" <  interval '30 days')::int AS fresh,
           COUNT(*) FILTER (WHERE now() - "createdAt" >= interval '30 days' AND now() - "createdAt" < interval '90 days')::int AS aging,
           COUNT(*) FILTER (WHERE now() - "createdAt" >= interval '90 days')::int AS stale
         FROM serialized_units WHERE "merchantId" = $1 AND status = 'IN_STOCK'`,
        [merchantId],
      ) as Promise<[{ fresh: number; aging: number; stale: number }]>,
      this.ds.query(
        `SELECT COALESCE(SUM("costTzs"), 0)::int AS "valueTzs" FROM serialized_units WHERE "merchantId" = $1 AND status = 'IN_STOCK'`,
        [merchantId],
      ) as Promise<[{ valueTzs: number }]>,
      this.ds.query(
        `SELECT COALESCE(SUM(qty), 0)::int AS qty FROM stock_levels WHERE "merchantId" = $1`,
        [merchantId],
      ) as Promise<[{ qty: number }]>,
    ]);

    const byStatus: Record<string, number> = {};
    for (const r of byStatusRows) byStatus[r.status] = r.count;
    return {
      serialized: { inStock: byStatus.IN_STOCK ?? 0, byStatus, aging, valueTzs },
      nonSerializedQty: qty,
    };
  }

  private async deliveries(merchantId: string, date: string): Promise<DashboardOverview['deliveries']> {
    const rows: Array<{ status: string; count: number }> = await this.ds.query(
      `SELECT status, COUNT(*)::int AS count FROM deliveries WHERE "merchantId" = $1 AND "scheduledDate" = $2 GROUP BY status`,
      [merchantId, date],
    );
    const by: Record<string, number> = {};
    for (const r of rows) by[r.status] = r.count;
    return { planned: by.PLANNED ?? 0, dispatched: by.DISPATCHED ?? 0, delivered: by.DELIVERED ?? 0, failed: by.FAILED ?? 0 };
  }
}
