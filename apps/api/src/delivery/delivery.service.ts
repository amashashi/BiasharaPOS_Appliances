import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import type { Role } from '@biashara/shared';
import { DATA_SOURCE } from '../db/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { SalesOrderLine } from '../db/entities/sales-order-line.entity.js';
import { Delivery } from '../db/entities/delivery.entity.js';
import { formatOrderNumber } from '../orders/orders.service.js';
import type { FieldError } from '../catalog/product.rules.js';

export interface ScheduleDeliveryInput {
  scheduledDate?: unknown;
  window?: unknown;
  addressText?: unknown;
  assigneeUserId?: unknown;
  note?: unknown;
}

export interface Actor {
  userId: string;
  roles: Role[];
}

export interface DispatchJob {
  id: string;
  status: string;
  scheduledDate: string;
  window: string | null;
  addressText: string;
  note: string | null;
  assigneeUserId: string | null;
  order: { id: string; number: number; numberFormatted: string };
  customer: { name: string; phone: string | null } | null;
  lines: Array<{ description: string; qty: number }>;
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
const todayIsoUtc = (): string => new Date().toISOString().slice(0, 10);

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

  /**
   * Dispatch list (T4.2): active jobs (PLANNED/DISPATCHED) for a day, with
   * order contents + customer phone. A DELIVERY staffer sees ONLY jobs
   * assigned to them; an OWNER sees every job that day (planning oversight).
   */
  async dispatchList(merchantId: string, actor: Actor, date: string): Promise<{ date: string; jobs: DispatchJob[] }> {
    const day = isIsoDate(date) ? date : todayIsoUtc();
    const onlyMine = !actor.roles.includes('OWNER'); // DELIVERY-only users are scoped to themselves

    const qb = this.ds
      .getRepository(Delivery)
      .createQueryBuilder('d')
      .innerJoinAndSelect('d.order', 'o')
      .leftJoinAndSelect('o.customer', 'c')
      .where('d.merchantId = :merchantId', { merchantId })
      .andWhere('d.scheduledDate = :day', { day })
      .andWhere("d.status IN ('PLANNED', 'DISPATCHED')");
    if (onlyMine) qb.andWhere('d.assigneeUserId = :uid', { uid: actor.userId });
    const deliveries = await qb.orderBy('d.status', 'ASC').addOrderBy('d.createdAt', 'ASC').getMany();

    const orderIds = deliveries.map((d) => d.orderId);
    const lines = orderIds.length
      ? await this.ds
          .getRepository(SalesOrderLine)
          .find({ where: { orderId: In(orderIds) }, relations: { product: true } })
      : [];
    const linesByOrder = new Map<string, Array<{ description: string; qty: number }>>();
    for (const l of lines) {
      const list = linesByOrder.get(l.orderId) ?? [];
      list.push({ description: `${l.product.brand} ${l.product.model}`.trim(), qty: l.qty });
      linesByOrder.set(l.orderId, list);
    }

    const jobs: DispatchJob[] = deliveries.map((d) => ({
      id: d.id,
      status: d.status,
      scheduledDate: d.scheduledDate,
      window: d.window,
      addressText: d.addressText,
      note: d.note,
      assigneeUserId: d.assigneeUserId,
      order: { id: d.order.id, number: d.order.number, numberFormatted: formatOrderNumber(d.order.number) },
      customer: d.order.customer
        ? { name: d.order.customer.name, phone: d.order.customer.phone }
        : null,
      lines: linesByOrder.get(d.orderId) ?? [],
    }));
    return { date: day, jobs };
  }

  /** Mark a job dispatched (PLANNED → DISPATCHED). A DELIVERY user may only dispatch their own. */
  async markDispatched(merchantId: string, deliveryId: string, actor: Actor): Promise<Delivery> {
    return this.ds.transaction(async (mgr) => {
      const delivery = UUID_RE.test(deliveryId)
        ? await mgr
            .getRepository(Delivery)
            .createQueryBuilder('d')
            .setLock('pessimistic_write')
            .where('d.id = :deliveryId AND d.merchantId = :merchantId', { deliveryId, merchantId })
            .getOne()
        : null;
      // a delivery staffer can't even see — let alone act on — someone else's job
      if (!delivery || (!actor.roles.includes('OWNER') && delivery.assigneeUserId !== actor.userId)) {
        throw new NotFoundException('Delivery not found');
      }
      if (delivery.status !== 'PLANNED') {
        throw new ConflictException(
          `Only PLANNED deliveries can be dispatched (this one is ${delivery.status})`,
        );
      }
      delivery.status = 'DISPATCHED';
      const saved = await mgr.getRepository(Delivery).save(delivery);
      await this.audit.record(
        {
          merchantId,
          actorUserId: actor.userId,
          entityType: 'Delivery',
          entityId: delivery.id,
          action: 'DELIVERY_DISPATCHED',
          before: { status: 'PLANNED' },
          after: { status: 'DISPATCHED', orderId: delivery.orderId },
        },
        mgr,
      );
      return saved;
    });
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
