import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DATA_SOURCE } from '../db/tokens.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { Payment } from '../db/entities/payment.entity.js';
import { OrdersService, formatOrderNumber } from './orders.service.js';
import { PaymentsService } from './payments.service.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** One queued offline cash sale: an ORDER plus its cash payment, keyed by clientRef. */
export interface OutboxOperation {
  clientRef?: unknown;
  locationId?: unknown;
  customer?: { name?: unknown; phone?: unknown };
  lines?: Array<{ productId?: unknown; qty?: unknown; unitPriceTzs?: unknown }>;
  payment?: { amountTzs?: unknown };
}

export type SyncOutcome =
  | { clientRef: string; status: 'created' | 'duplicate'; order: { id: string; numberFormatted: string } }
  | { clientRef: string; status: 'failed'; error: string };

/**
 * Offline outbox replay (T5.5). The POS queues cash sales offline with a
 * client-generated `clientRef` and POSTs the batch here on reconnect. Replay is
 * **exactly-once**: the clientRef is a partial-unique key on the order, so a
 * double-replay finds the existing order instead of creating a duplicate, and a
 * half-finished replay (order created, payment not yet recorded) converges — the
 * missing cash payment is applied on the next pass. Each operation succeeds or
 * fails independently; a bad one never aborts the batch.
 *
 * Scope: CASH sales only. Mobile money needs the live push, and credit
 * agreements require connectivity (ARCHITECTURE offline note). Serial conflicts
 * and offline fiscalization are T5.6/T5.7 — here a replayed payment fiscalizes
 * through the normal queue.
 */
@Injectable()
export class SyncService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(PaymentsService) private readonly payments: PaymentsService,
  ) {}

  async replay(merchantId: string, actorUserId: string, operations: unknown): Promise<{ results: SyncOutcome[] }> {
    const ops = Array.isArray(operations) ? (operations as OutboxOperation[]) : [];
    const results: SyncOutcome[] = [];
    for (const op of ops) {
      results.push(await this.syncOne(merchantId, actorUserId, op ?? {}));
    }
    return { results };
  }

  private async syncOne(merchantId: string, actorUserId: string, op: OutboxOperation): Promise<SyncOutcome> {
    const clientRef = typeof op.clientRef === 'string' ? op.clientRef.trim() : '';
    if (!UUID_RE.test(clientRef)) {
      return { clientRef, status: 'failed', error: 'clientRef must be a uuid' };
    }
    const amountTzs = typeof op.payment?.amountTzs === 'number' ? op.payment.amountTzs : NaN;

    try {
      const existing = await this.ds.getRepository(SalesOrder).findOneBy({ merchantId, clientRef });
      if (existing) {
        await this.ensurePaid(merchantId, actorUserId, existing.id, amountTzs);
        return { clientRef, status: 'duplicate', order: { id: existing.id, numberFormatted: formatOrderNumber(existing.number) } };
      }

      const order = await this.orders.create(merchantId, actorUserId, {
        type: 'ORDER',
        locationId: op.locationId,
        customer: op.customer,
        lines: op.lines,
        clientRef,
      });
      await this.payments.record(merchantId, order.id, actorUserId, { method: 'CASH', amountTzs });
      return { clientRef, status: 'created', order: { id: order.id, numberFormatted: order.numberFormatted } };
    } catch (e) {
      // a concurrent replay of the same clientRef won the create race — treat as duplicate
      if ((e as { code?: string }).code === '23505') {
        const existing = await this.ds.getRepository(SalesOrder).findOneBy({ merchantId, clientRef });
        if (existing) {
          await this.ensurePaid(merchantId, actorUserId, existing.id, amountTzs);
          return { clientRef, status: 'duplicate', order: { id: existing.id, numberFormatted: formatOrderNumber(existing.number) } };
        }
      }
      const message = e instanceof Error ? this.reason(e) : 'sync failed';
      return { clientRef, status: 'failed', error: message };
    }
  }

  /** Complete a half-finished replay: apply the cash payment iff the order has none yet. */
  private async ensurePaid(merchantId: string, actorUserId: string, orderId: string, amountTzs: number): Promise<void> {
    if (!Number.isSafeInteger(amountTzs) || amountTzs <= 0) return;
    const paidCount = await this.ds.getRepository(Payment).countBy({ orderId });
    if (paidCount > 0) return; // already settled by the first replay — never double-charge
    await this.payments.record(merchantId, orderId, actorUserId, { method: 'CASH', amountTzs });
  }

  private reason(e: Error): string {
    const body = (e as { response?: { message?: string; errors?: Array<{ message: string }> } }).response;
    return body?.errors?.map((x) => x.message).join('; ') ?? body?.message ?? e.message;
  }
}
