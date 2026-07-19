import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { DATA_SOURCE } from '../db/tokens.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { Payment } from '../db/entities/payment.entity.js';
import { SerializedUnit } from '../db/entities/serialized-unit.entity.js';
import { SyncException, type SyncExceptionKind } from '../db/entities/sync-exception.entity.js';
import { OrdersService, formatOrderNumber } from './orders.service.js';
import { PaymentsService } from './payments.service.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_TZS = 2_000_000_000;

/** One queued offline cash sale: an ORDER plus its cash payment, keyed by clientRef. */
export interface OutboxOperation {
  clientRef?: unknown;
  locationId?: unknown;
  customer?: { name?: unknown; phone?: unknown };
  /** Per-line the POS captured the offered price (stale-price check) and any scanned serials (conflict check). */
  lines?: Array<{ productId?: unknown; qty?: unknown; unitPriceTzs?: unknown; serials?: unknown }>;
  payment?: { amountTzs?: unknown };
  /** When the sale was actually made offline (ISO); drives fiscal aging (T5.7). */
  soldAt?: unknown;
}

export type SyncOutcome =
  | { clientRef: string; status: 'created' | 'duplicate'; order: { id: string; numberFormatted: string }; conflicts?: number }
  | { clientRef: string; status: 'failed'; error: string };

type DetectedException = { kind: SyncExceptionKind; detail: Record<string, unknown> };

/**
 * Offline outbox replay (T5.5) with conflict handling (T5.6). The POS queues
 * cash sales offline with a client-generated `clientRef` and POSTs the batch
 * here on reconnect. Replay is **exactly-once and convergent**: the clientRef is
 * a partial-unique key on the order, so a double-replay finds the existing order
 * instead of duplicating; the cash payment and the conflict detection both run
 * on EVERY pass, guarded to be idempotent (a locked payment count that never
 * double-charges, a partial-unique index that never duplicates an exception), so
 * a half-finished or failed first replay fully converges on a later one.
 *
 * On replay we validate the sale against authoritative state — a **stale price**
 * (the offline price no longer matches the catalog) or a **serial conflict** (a
 * scanned serial was sold online meanwhile) is recorded as a sync exception for
 * an OWNER to resolve. The order + cash still land (the sale happened); nothing
 * is silently overwritten (ARCHITECTURE offline note). Each op in a batch
 * succeeds or fails independently — a throw never aborts the batch. Scope: CASH.
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
    // validate the cash amount BEFORE creating anything — a bad amount must never
    // leave a committed order with no payment and no exception
    const amountTzs = typeof op.payment?.amountTzs === 'number' ? op.payment.amountTzs : NaN;
    if (!Number.isSafeInteger(amountTzs) || amountTzs <= 0 || amountTzs > MAX_TZS) {
      return { clientRef, status: 'failed', error: 'payment.amountTzs must be a positive whole number of TZS' };
    }

    // the sale's real (offline) time drives fiscal aging (T5.7); fall back to now
    const soldAt = typeof op.soldAt === 'string' ? new Date(op.soldAt) : undefined;
    const occurredAt = soldAt && !Number.isNaN(soldAt.getTime()) ? soldAt : undefined;

    // ONE outer catch so any throw (incl. a create race or a converge repair)
    // degrades this op to 'failed' without aborting the rest of the batch.
    try {
      const existing = await this.ds.getRepository(SalesOrder).findOneBy({ merchantId, clientRef });
      if (existing) return await this.converge(merchantId, actorUserId, existing, op, amountTzs, occurredAt, clientRef);

      const order = await this.orders.create(merchantId, actorUserId, {
        type: 'ORDER',
        locationId: op.locationId,
        customer: op.customer,
        lines: op.lines, // carries unitPriceTzs (offered price) per line
        clientRef,
      });
      await this.ensurePaid(merchantId, actorUserId, order.id, amountTzs, occurredAt);
      const conflicts = await this.detectConflicts(merchantId, order.id, op);
      return { clientRef, status: 'created', order: { id: order.id, numberFormatted: order.numberFormatted }, conflicts };
    } catch (e) {
      // a concurrent replay of the same clientRef won the create race — converge as a duplicate
      if ((e as { code?: string }).code === '23505') {
        const raced = await this.ds.getRepository(SalesOrder).findOneBy({ merchantId, clientRef });
        if (raced) return await this.converge(merchantId, actorUserId, raced, op, amountTzs, occurredAt, clientRef);
      }
      return { clientRef, status: 'failed', error: e instanceof Error ? this.reason(e) : 'sync failed' };
    }
  }

  /** Converge an already-created sale: settle the cash if missing, (re-)detect conflicts. Both idempotent. */
  private async converge(
    merchantId: string, actorUserId: string, order: SalesOrder, op: OutboxOperation, amountTzs: number, occurredAt: Date | undefined, clientRef: string,
  ): Promise<SyncOutcome> {
    await this.ensurePaid(merchantId, actorUserId, order.id, amountTzs, occurredAt);
    const conflicts = await this.detectConflicts(merchantId, order.id, op);
    return { clientRef, status: 'duplicate', order: { id: order.id, numberFormatted: formatOrderNumber(order.number) }, conflicts };
  }

  /**
   * Apply the cash payment exactly once, atomically: lock the order, count its
   * payments inside the lock, and apply only if there are none. The lock (not an
   * unlocked check-then-act) is what makes two concurrent replays of the same
   * clientRef safe even for a partial/deposit amount that would otherwise both
   * "fit" the balance and double-credit. `occurredAt` carries the offline sale
   * time so fiscal aging (T5.7) measures from when the money was collected.
   */
  private async ensurePaid(merchantId: string, actorUserId: string, orderId: string, amountTzs: number, occurredAt?: Date): Promise<void> {
    const paymentId = await this.ds.transaction(async (mgr) => {
      const order = await mgr
        .getRepository(SalesOrder)
        .createQueryBuilder('o')
        .setLock('pessimistic_write')
        .where('o.id = :orderId AND o.merchantId = :merchantId', { orderId, merchantId })
        .getOne();
      if (!order) return null;
      const paidCount = await mgr.getRepository(Payment).countBy({ orderId });
      if (paidCount > 0) return null; // already settled by an earlier pass — never double-charge
      this.payments.assertPayable(order);
      const { payment } = await this.payments.applyPayment(mgr, order, {
        method: 'CASH', amountTzs, note: null, actorUserId, recordedByUserId: actorUserId, occurredAt,
      });
      return payment.id;
    });
    // fiscalize after commit, exactly like an online cash payment (D-008)
    if (paymentId) await this.payments.enqueueFiscal(merchantId, actorUserId, paymentId);
  }

  /**
   * Validate the order against authoritative state and record an exception per
   * problem — STALE_PRICE (line price ≠ catalog) or SERIAL_CONFLICT (a scanned
   * serial not IN_STOCK). Idempotent: runs on every replay, de-duped in memory
   * and by a partial unique index, so re-detection never piles up rows. Returns
   * the count of currently-open exceptions for the order.
   */
  private async detectConflicts(merchantId: string, orderId: string, op: OutboxOperation): Promise<number> {
    const order = await this.orders.getById(merchantId, orderId);
    const found: DetectedException[] = [];
    const orderLines = order.lines ?? [];

    for (const line of orderLines) {
      if (line.unitPriceTzs !== line.product.priceTzs) {
        found.push({
          kind: 'STALE_PRICE',
          detail: { productId: line.productId, lineId: line.id, offeredTzs: line.unitPriceTzs, catalogTzs: line.product.priceTzs },
        });
      }
    }

    const opLines = Array.isArray(op.lines) ? op.lines : [];
    for (const opLine of opLines) {
      const serials = Array.isArray(opLine.serials) ? [...new Set(opLine.serials.map((s) => String(s).trim()).filter(Boolean))] : [];
      if (serials.length === 0) continue;
      const line = orderLines.find((l) => l.productId === opLine.productId);
      if (!line) continue;
      const units = await this.ds.getRepository(SerializedUnit).findBy({ merchantId, serial: In(serials) });
      const bySerial = new Map(units.map((u) => [u.serial, u]));
      for (const serial of serials) {
        const unit = bySerial.get(serial);
        const available = unit && unit.productId === line.productId && unit.status === 'IN_STOCK';
        if (!available) {
          found.push({
            kind: 'SERIAL_CONFLICT',
            detail: { productId: line.productId, lineId: line.id, serial, foundStatus: unit ? unit.status : 'NOT_FOUND' },
          });
        }
      }
    }

    const repo = this.ds.getRepository(SyncException);
    // one row per logical conflict (serial for SERIAL_CONFLICT, lineId for STALE_PRICE).
    // De-dup against exceptions in ANY status so a re-replay never re-opens one an
    // OWNER already resolved, and never piles up duplicates.
    const key = (kind: string, d: Record<string, unknown>): string => `${kind}:${d.serial ?? d.lineId ?? ''}`;
    const already = new Set((await repo.findBy({ orderId })).map((e) => key(e.kind, e.detail)));
    for (const ex of found) {
      if (already.has(key(ex.kind, ex.detail))) continue;
      already.add(key(ex.kind, ex.detail));
      try {
        await repo.save(repo.create({
          merchantId, orderId, clientRef: order.clientRef as string, kind: ex.kind, detail: ex.detail,
          status: 'OPEN', resolutionNote: null, resolvedByUserId: null, resolvedAt: null,
        }));
      } catch (e) {
        if ((e as { code?: string }).code !== '23505') throw e; // concurrent detect won — already flagged
      }
    }
    return repo.countBy({ orderId, status: 'OPEN' });
  }

  private reason(e: Error): string {
    const body = (e as { response?: { message?: string; errors?: Array<{ message: string }> } }).response;
    return body?.errors?.map((x) => x.message).join('; ') ?? body?.message ?? e.message;
  }
}
