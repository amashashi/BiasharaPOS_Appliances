import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DATA_SOURCE } from '../db/tokens.js';
import { Payment } from '../db/entities/payment.entity.js';
import { FiscalReceipt } from '../db/entities/fiscal-receipt.entity.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { formatOrderNumber } from '../orders/orders.service.js';

/** TRA submission window (hours) — how long a sale may go un-fiscalized before it's overdue. */
const windowHours = (): number => {
  const v = Number(process.env.FISCAL_TRA_WINDOW_HOURS ?? 24);
  return Number.isFinite(v) && v > 0 ? v : 24;
};

export interface AgingRow {
  paymentId: string;
  orderId: string;
  orderNumber: string;
  amountTzs: number;
  occurredAt: string;
  ageHours: number;
}

/**
 * Fiscal aging alert (T5.7). Every payment enqueues a VFD receipt job; if the
 * fiscal service is down (or a long-offline sale replayed late), a payment can
 * sit un-fiscalized past the TRA submission window — a compliance risk an OWNER
 * must see. This reads the payments with no receipt whose collection time
 * (occurredAt — the offline sale time for replays, not the sync time) is older
 * than the window. Reversals never fiscalize, so they're excluded.
 */
@Injectable()
export class FiscalAgingService {
  constructor(@Inject(DATA_SOURCE) private readonly ds: DataSource) {}

  async overdue(merchantId: string): Promise<{ windowHours: number; count: number; oldestAgeHours: number; items: AgingRow[] }> {
    const hours = windowHours();
    const now = Date.now();
    const cutoff = new Date(now - hours * 3_600_000);

    const rows = await this.ds
      .getRepository(Payment)
      .createQueryBuilder('p')
      .innerJoin(SalesOrder, 'o', 'o.id = p."orderId"')
      .leftJoin(FiscalReceipt, 'fr', 'fr."paymentId" = p.id')
      .select([
        'p.id AS "paymentId"',
        'o.id AS "orderId"',
        'o.number AS "orderNumber"',
        'p."amountTzs" AS "amountTzs"',
        'COALESCE(p."occurredAt", p.at) AS "occurredAt"',
      ])
      .where('p."merchantId" = :merchantId', { merchantId })
      .andWhere('p."amountTzs" > 0') // reversals never fiscalize
      .andWhere('fr.id IS NULL') // not yet fiscalized
      .andWhere('COALESCE(p."occurredAt", p.at) < :cutoff', { cutoff })
      .orderBy('COALESCE(p."occurredAt", p.at)', 'ASC')
      .getRawMany<{ paymentId: string; orderId: string; orderNumber: number; amountTzs: number; occurredAt: Date }>();

    const items = rows.map((r): AgingRow => ({
      paymentId: r.paymentId,
      orderId: r.orderId,
      orderNumber: formatOrderNumber(Number(r.orderNumber)),
      amountTzs: Number(r.amountTzs),
      occurredAt: new Date(r.occurredAt).toISOString(),
      ageHours: Math.floor((now - new Date(r.occurredAt).getTime()) / 3_600_000),
    }));
    return { windowHours: hours, count: items.length, oldestAgeHours: items[0]?.ageHours ?? 0, items };
  }
}
