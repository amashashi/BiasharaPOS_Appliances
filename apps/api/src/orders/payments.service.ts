import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import type { Tzs } from '@biashara/shared';
import { DATA_SOURCE } from '../db/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { SalesOrderLine } from '../db/entities/sales-order-line.entity.js';
import { SalesOrderServiceLine } from '../db/entities/sales-order-service-line.entity.js';
import { Payment } from '../db/entities/payment.entity.js';
import { OrdersService } from './orders.service.js';
import { FiscalQueueService } from '../fiscal/fiscal-queue.service.js';
import type { FieldError } from '../catalog/product.rules.js';

export interface RecordPaymentInput {
  method?: unknown;
  amountTzs?: unknown;
  note?: unknown;
}

export interface PaymentSummary {
  totalTzs: Tzs;
  paidTzs: Tzs;
  balanceTzs: Tzs;
}

const MAX_TZS = 2_000_000_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Quotes aren't orders; cancelled/closed orders take no new money. */
const PAYABLE = ['CONFIRMED', 'PARTIALLY_FULFILLED', 'FULFILLED'] as const;

/**
 * The order money ledger (T2.3). Payments are append-only (DB trigger);
 * corrections are reversing entries. Balance is always computed —
 * total(lines+services) − sum(ledger) — never stored.
 */
@Injectable()
export class PaymentsService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(FiscalQueueService) private readonly fiscalQueue: FiscalQueueService,
  ) {}

  /** Record a CASH payment (mobile money arrives via webhook in T2.5). */
  async record(merchantId: string, orderId: string, actorUserId: string, input: RecordPaymentInput) {
    const errors: FieldError[] = [];
    const method = String(input.method ?? '').trim().toUpperCase();
    if (method !== 'CASH') {
      errors.push({
        field: 'method',
        message: "method must be 'CASH' (mobile money is confirmed by webhook from T2.5 on)",
      });
    }
    const amountTzs = typeof input.amountTzs === 'number' ? input.amountTzs : NaN;
    if (!Number.isSafeInteger(amountTzs) || amountTzs <= 0 || amountTzs > MAX_TZS) {
      errors.push({ field: 'amountTzs', message: 'amountTzs must be a positive whole number of TZS' });
    }
    if (errors.length) throw new BadRequestException({ message: 'Validation failed', errors });

    const result = await this.ds.transaction(async (mgr) => {
      const order = await this.lockOrder(mgr, merchantId, orderId);
      if (!(PAYABLE as readonly string[]).includes(order.status)) {
        throw new BadRequestException({
          message: `Payments apply to ${PAYABLE.join('/')} orders (this one is ${order.status})`,
        });
      }
      const { totalTzs, paidTzs } = await this.summaryOf(mgr, order);
      const balanceTzs = totalTzs - paidTzs;
      if (amountTzs > balanceTzs) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: [{
            field: 'amountTzs',
            message: `payment of TZS ${amountTzs.toLocaleString('en-US')} exceeds the balance of TZS ${balanceTzs.toLocaleString('en-US')}`,
          }],
        });
      }

      const payment = await mgr.getRepository(Payment).save(
        mgr.getRepository(Payment).create({
          merchantId,
          orderId: order.id,
          method: 'CASH',
          amountTzs,
          reversesPaymentId: null,
          note: this.trimmed(input.note),
          recordedByUserId: actorUserId,
        }),
      );
      const balanceAfter = balanceTzs - amountTzs;
      await this.audit.record(
        {
          merchantId,
          actorUserId,
          entityType: 'Payment',
          entityId: payment.id,
          action: 'PAYMENT_RECORDED',
          after: {
            orderId: order.id,
            orderNumber: order.number,
            method: 'CASH',
            amountTzs,
            kind: balanceAfter === 0 ? 'FULL_SETTLEMENT' : 'DEPOSIT',
            balanceAfterTzs: balanceAfter,
          },
        },
        mgr,
      );
      // fully fulfilled + fully paid = done (FULFILLED→CLOSED per the graph)
      if (balanceAfter === 0 && order.status === 'FULFILLED') {
        await this.orders.transition(merchantId, order.id, 'CLOSED', actorUserId, mgr);
      }
      return {
        payment,
        summary: { totalTzs, paidTzs: paidTzs + amountTzs, balanceTzs: balanceAfter },
      };
    });

    // Every payment fiscalizes (D-008) — enqueued AFTER commit so the worker
    // always sees the row. An enqueue failure must not lose the payment;
    // it lands in the audit log instead (aging alert catches it in T5.7).
    try {
      await this.fiscalQueue.enqueue(result.payment.id);
    } catch (e) {
      await this.audit.record({
        merchantId,
        actorUserId,
        entityType: 'Payment',
        entityId: result.payment.id,
        action: 'FISCAL_ENQUEUE_FAILED',
        after: { error: (e as Error).message },
      });
    }
    return result;
  }

  /** Correction: a reversing entry mirroring the original. The original row is never touched. */
  async reverse(
    merchantId: string,
    orderId: string,
    paymentId: string,
    actorUserId: string,
    reason?: unknown,
  ) {
    return this.ds.transaction(async (mgr) => {
      const order = await this.lockOrder(mgr, merchantId, orderId);
      const original = UUID_RE.test(paymentId)
        ? await mgr.getRepository(Payment).findOneBy({ id: paymentId, orderId: order.id, merchantId })
        : null;
      if (!original) throw new NotFoundException('Payment not found on this order');
      if (original.amountTzs <= 0) {
        throw new BadRequestException({ message: 'A reversing entry cannot itself be reversed' });
      }
      const existing = await mgr.getRepository(Payment).findOneBy({ reversesPaymentId: original.id });
      if (existing) {
        throw new ConflictException(`Payment already reversed by entry ${existing.id}`);
      }

      const reversal = await mgr.getRepository(Payment).save(
        mgr.getRepository(Payment).create({
          merchantId,
          orderId: order.id,
          method: original.method,
          amountTzs: -original.amountTzs,
          reversesPaymentId: original.id,
          note: this.trimmed(reason),
          recordedByUserId: actorUserId,
        }),
      );
      await this.audit.record(
        {
          merchantId,
          actorUserId,
          entityType: 'Payment',
          entityId: reversal.id,
          action: 'PAYMENT_REVERSED',
          before: { paymentId: original.id, amountTzs: original.amountTzs },
          after: { amountTzs: reversal.amountTzs, reason: reversal.note },
        },
        mgr,
      );
      const summary = await this.summaryOf(mgr, order);
      return { payment: reversal, summary: { ...summary, balanceTzs: summary.totalTzs - summary.paidTzs } };
    });
  }

  async listForOrder(merchantId: string, orderId: string) {
    const order = UUID_RE.test(orderId)
      ? await this.ds.getRepository(SalesOrder).findOneBy({ id: orderId, merchantId })
      : null;
    if (!order) throw new NotFoundException('Order not found');
    const items = await this.ds
      .getRepository(Payment)
      .find({ where: { orderId: order.id }, order: { seq: 'ASC' } });
    const { totalTzs, paidTzs } = await this.summaryOf(this.ds.manager, order);
    return { items, summary: { totalTzs, paidTzs, balanceTzs: totalTzs - paidTzs } };
  }

  private async summaryOf(
    mgr: EntityManager,
    order: SalesOrder,
  ): Promise<{ totalTzs: Tzs; paidTzs: Tzs }> {
    const lines = await mgr.getRepository(SalesOrderLine).findBy({ orderId: order.id });
    const services = await mgr.getRepository(SalesOrderServiceLine).findBy({ orderId: order.id });
    const totalTzs =
      lines.reduce((s, l) => s + l.qty * l.unitPriceTzs, 0) +
      services.reduce((s, l) => s + l.priceTzs, 0);
    const [{ paid }] = (await mgr.query(
      `SELECT COALESCE(SUM("amountTzs"), 0)::int AS paid FROM payments WHERE "orderId" = $1`,
      [order.id],
    )) as [{ paid: number }];
    return { totalTzs, paidTzs: paid };
  }

  private trimmed(v: unknown): string | null {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === '' ? null : s;
  }

  private async lockOrder(mgr: EntityManager, merchantId: string, orderId: string) {
    const order = UUID_RE.test(orderId)
      ? await mgr
          .getRepository(SalesOrder)
          .createQueryBuilder('o')
          .setLock('pessimistic_write')
          .where('o.id = :orderId AND o.merchantId = :merchantId', { orderId, merchantId })
          .getOne()
      : null;
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
