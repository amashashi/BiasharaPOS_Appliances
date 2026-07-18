import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In, IsNull } from 'typeorm';
import { DATA_SOURCE } from '../db/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { PaymentWebhookEvent } from '../db/entities/payment-webhook-event.entity.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { formatOrderNumber } from './orders.service.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ReconciliationRow {
  id: string;
  reason: PaymentWebhookEvent['reason'];
  status: string;
  provider: string | null;
  providerRef: string | null;
  amountTzs: number | null;
  intentRef: string;
  receivedAt: Date;
  order: { id: string; numberFormatted: string } | null;
}

/**
 * Reconciliation queue (T5.3a): payment webhooks that couldn't be applied —
 * confirmed money that no longer fit the order balance (D-027). An OWNER
 * reviews each and resolves it (refund / applied elsewhere handled off-system
 * until the aggregator's refund API, T5.3b), which clears it from the queue.
 * Scoped to the merchant; unattributed UNMATCHED orphans (no merchant) are a
 * platform-ops concern and never surface here.
 */
@Injectable()
export class ReconciliationService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async list(merchantId: string): Promise<{ items: ReconciliationRow[]; totalTzs: number }> {
    const events = await this.ds.getRepository(PaymentWebhookEvent).find({
      where: { merchantId, resolvedAt: IsNull() },
      order: { receivedAt: 'ASC' },
    });
    const orderIds = [...new Set(events.map((e) => e.rawPayload?.orderId).filter((v): v is string => typeof v === 'string'))];
    const orders = orderIds.length
      ? await this.ds.getRepository(SalesOrder).find({ where: { id: In(orderIds) } })
      : [];
    const byId = new Map(orders.map((o) => [o.id, o]));

    const items = events.map((e): ReconciliationRow => {
      const orderId = typeof e.rawPayload?.orderId === 'string' ? e.rawPayload.orderId : null;
      const order = orderId ? byId.get(orderId) : undefined;
      return {
        id: e.id,
        reason: e.reason,
        status: e.status,
        provider: e.provider,
        providerRef: e.providerRef,
        amountTzs: e.amountTzs,
        intentRef: e.intentRef,
        receivedAt: e.receivedAt,
        order: order ? { id: order.id, numberFormatted: formatOrderNumber(order.number) } : null,
      };
    });
    const totalTzs = items.reduce((sum, i) => sum + (i.amountTzs ?? 0), 0);
    return { items, totalTzs };
  }

  /** OWNER resolves a queue item with a note (audit-logged); clears it from the view. */
  async resolve(merchantId: string, eventId: string, actorUserId: string, note: unknown) {
    const trimmed = String(note ?? '').trim();
    if (!trimmed) throw new BadRequestException({ message: 'A resolution note is required' });
    if (!UUID_RE.test(eventId)) throw new NotFoundException('Reconciliation item not found');

    return this.ds.transaction(async (mgr) => {
      const event = await mgr
        .getRepository(PaymentWebhookEvent)
        .createQueryBuilder('e')
        .setLock('pessimistic_write')
        .where('e.id = :eventId AND e.merchantId = :merchantId', { eventId, merchantId })
        .getOne();
      if (!event) throw new NotFoundException('Reconciliation item not found');
      if (event.resolvedAt) throw new BadRequestException({ message: 'Already resolved' });

      event.resolvedAt = new Date();
      event.resolvedByUserId = actorUserId;
      event.resolutionNote = trimmed;
      await mgr.getRepository(PaymentWebhookEvent).save(event);
      await this.audit.record(
        {
          merchantId,
          actorUserId,
          entityType: 'PaymentWebhookEvent',
          entityId: event.id,
          action: 'RECONCILIATION_RESOLVED',
          after: { intentRef: event.intentRef, reason: event.reason, note: trimmed },
        },
        mgr,
      );
      return { id: event.id, resolvedAt: event.resolvedAt };
    });
  }
}
