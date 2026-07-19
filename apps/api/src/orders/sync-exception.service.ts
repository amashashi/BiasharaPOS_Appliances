import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { DATA_SOURCE } from '../db/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { SyncException } from '../db/entities/sync-exception.entity.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { FulfillmentService } from './fulfillment.service.js';
import { formatOrderNumber } from './orders.service.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ResolveInput {
  action?: unknown; // 'reassign' (serial conflict) | 'accept' (stale price) | 'acknowledge'
  serial?: unknown; // replacement serial for a 'reassign'
  note?: unknown;
}

export interface ExceptionRow {
  id: string;
  kind: SyncException['kind'];
  detail: Record<string, unknown>;
  createdAt: Date;
  order: { id: string; numberFormatted: string } | null;
}

/**
 * Offline-sync exception queue (T5.6). OWNER reviews conflicts a replayed sale
 * hit against authoritative state and resolves each: for a SERIAL_CONFLICT,
 * `reassign` an available serial (reserved to the order line — the conflict is
 * corrected), or `acknowledge` to handle it manually; for a STALE_PRICE,
 * `accept` the price the customer already paid. Every resolution is audited.
 */
@Injectable()
export class SyncExceptionService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(FulfillmentService) private readonly fulfillment: FulfillmentService,
  ) {}

  async list(merchantId: string): Promise<{ items: ExceptionRow[] }> {
    const rows = await this.ds.getRepository(SyncException).find({
      where: { merchantId, status: 'OPEN' },
      order: { createdAt: 'ASC' },
    });
    const orderIds = [...new Set(rows.map((r) => r.orderId))];
    const orders = orderIds.length ? await this.ds.getRepository(SalesOrder).find({ where: { id: In(orderIds) } }) : [];
    const byId = new Map(orders.map((o) => [o.id, o]));
    return {
      items: rows.map((r): ExceptionRow => {
        const order = byId.get(r.orderId);
        return {
          id: r.id,
          kind: r.kind,
          detail: r.detail,
          createdAt: r.createdAt,
          order: order ? { id: order.id, numberFormatted: formatOrderNumber(order.number) } : null,
        };
      }),
    };
  }

  async resolve(merchantId: string, exceptionId: string, actorUserId: string, input: ResolveInput) {
    if (!UUID_RE.test(exceptionId)) throw new NotFoundException('Exception not found');
    const action = String(input.action ?? '').trim().toLowerCase();
    const note = String(input.note ?? '').trim();

    const ex = await this.ds.getRepository(SyncException).findOneBy({ id: exceptionId, merchantId });
    if (!ex || ex.status !== 'OPEN') throw new NotFoundException('Exception not found');

    if (ex.kind === 'SERIAL_CONFLICT' && action === 'reassign') {
      const serial = String(input.serial ?? '').trim();
      if (!serial) throw new BadRequestException({ message: 'a replacement serial is required to reassign' });
      // reserve() validates the serial is available + the right product and RESERVES it to the line —
      // it throws a 4xx we let bubble if the replacement is also unavailable
      await this.fulfillment.reserve(merchantId, ex.orderId, actorUserId, { lineId: ex.detail.lineId, serials: [serial] });
    } else if (!['reassign', 'accept', 'acknowledge'].includes(action)) {
      throw new BadRequestException({ message: "action must be 'reassign', 'accept', or 'acknowledge'" });
    } else if (action === 'reassign') {
      throw new BadRequestException({ message: 'reassign only applies to a serial conflict' });
    }

    ex.status = 'RESOLVED';
    ex.resolutionNote = note || action;
    ex.resolvedByUserId = actorUserId;
    ex.resolvedAt = new Date();
    await this.ds.getRepository(SyncException).save(ex);
    await this.audit.record({
      merchantId,
      actorUserId,
      entityType: 'SyncException',
      entityId: ex.id,
      action: 'SYNC_EXCEPTION_RESOLVED',
      after: { kind: ex.kind, resolution: action, note: note || null, serial: input.serial ?? null },
    });
    return { id: ex.id, status: ex.status };
  }
}
