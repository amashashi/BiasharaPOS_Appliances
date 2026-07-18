import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Not } from 'typeorm';
import { DATA_SOURCE } from '../db/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { Delivery } from '../db/entities/delivery.entity.js';
import type { FieldError } from '../catalog/product.rules.js';

export interface ScheduleDeliveryInput {
  scheduledDate?: unknown;
  window?: unknown;
  addressText?: unknown;
  assigneeUserId?: unknown;
  note?: unknown;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** Deliveries plan the handover of goods; quotes and dead orders can't have one. */
const SCHEDULABLE = ['CONFIRMED', 'PARTIALLY_FULFILLED', 'FULFILLED'] as const;
const ADDRESS_MAX = 500;

const trimmed = (v: unknown): string | null => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};
const isIsoDate = (s: string): boolean => {
  if (!DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

/**
 * Delivery scheduling (T4.1). One live delivery per order — a second attempt
 * while one is active is rejected (double-booking guard, backed by a partial
 * unique index). Dispatch (T4.2) and proof (T4.3) build on this.
 */
@Injectable()
export class DeliveryService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async schedule(merchantId: string, orderId: string, actorUserId: string, input: ScheduleDeliveryInput) {
    const errors: FieldError[] = [];

    const scheduledDate = trimmed(input.scheduledDate) ?? '';
    if (!isIsoDate(scheduledDate)) {
      errors.push({ field: 'scheduledDate', message: 'scheduledDate must be a valid date (YYYY-MM-DD)' });
    }
    const addressText = trimmed(input.addressText);
    if (!addressText) {
      errors.push({ field: 'addressText', message: 'addressText is required' });
    } else if (addressText.length > ADDRESS_MAX) {
      errors.push({ field: 'addressText', message: `addressText must be at most ${ADDRESS_MAX} characters` });
    }
    if (errors.length) throw new BadRequestException({ message: 'Validation failed', errors });

    const delivery = await this.ds.transaction(async (mgr) => {
      const order = await mgr
        .getRepository(SalesOrder)
        .createQueryBuilder('o')
        .setLock('pessimistic_write')
        .where('o.id = :orderId AND o.merchantId = :merchantId', { orderId, merchantId })
        .getOne();
      if (!order) throw new NotFoundException('Order not found');
      if (!(SCHEDULABLE as readonly string[]).includes(order.status)) {
        throw new BadRequestException({
          message: `Deliveries schedule on ${SCHEDULABLE.join('/')} orders (this one is ${order.status})`,
        });
      }
      // double-booking guard (T4.1 verify): reject if a non-FAILED delivery exists
      const active = await mgr
        .getRepository(Delivery)
        .findOne({ where: { orderId: order.id, status: Not('FAILED') } });
      if (active) {
        throw new ConflictException(
          `Order already has a ${active.status} delivery scheduled for ${active.scheduledDate}`,
        );
      }

      const saved = await mgr.getRepository(Delivery).save(
        mgr.getRepository(Delivery).create({
          merchantId,
          orderId: order.id,
          scheduledDate,
          window: trimmed(input.window),
          addressText: addressText as string,
          assigneeUserId: trimmed(input.assigneeUserId),
          note: trimmed(input.note),
          status: 'PLANNED',
          scheduledByUserId: actorUserId,
        }),
      );
      await this.audit.record(
        {
          merchantId,
          actorUserId,
          entityType: 'Delivery',
          entityId: saved.id,
          action: 'DELIVERY_SCHEDULED',
          after: {
            orderId: order.id,
            orderNumber: order.number,
            scheduledDate,
            window: saved.window,
            assigneeUserId: saved.assigneeUserId,
          },
        },
        mgr,
      );
      return saved;
    });
    return delivery;
  }

  /** The order's current delivery (the live one, else the most recent). */
  async forOrder(merchantId: string, orderId: string): Promise<Delivery | null> {
    if (!UUID_RE.test(orderId)) return null;
    const order = await this.ds.getRepository(SalesOrder).findOneBy({ id: orderId, merchantId });
    if (!order) throw new NotFoundException('Order not found');
    const deliveries = await this.ds
      .getRepository(Delivery)
      .find({ where: { orderId: order.id }, order: { createdAt: 'DESC' } });
    return deliveries.find((d) => d.status !== 'FAILED') ?? deliveries[0] ?? null;
  }
}
