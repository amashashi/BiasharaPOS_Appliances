import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In, type EntityManager } from 'typeorm';
import type { OrderStatus, Tzs } from '@biashara/shared';
import { DATA_SOURCE } from '../db/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { SalesOrderLine } from '../db/entities/sales-order-line.entity.js';
import {
  SalesOrderServiceLine,
  type ServiceKind,
} from '../db/entities/sales-order-service-line.entity.js';
import { Customer } from '../db/entities/customer.entity.js';
import { Product } from '../db/entities/product.entity.js';
import { Location } from '../db/entities/location.entity.js';
import type { FieldError } from '../catalog/product.rules.js';
import { assertOrderTransition } from './order-state.js';

export interface CreateOrderInput {
  /** 'QUOTE' (default) or 'ORDER' (born CONFIRMED — walk-in sale). */
  type?: unknown;
  locationId?: unknown;
  customerId?: unknown;
  /** Inline customer: { name, phone?, tin? } — created and attached. */
  customer?: { name?: unknown; phone?: unknown; tin?: unknown };
  note?: unknown;
  lines?: Array<{ productId?: unknown; qty?: unknown; unitPriceTzs?: unknown }>;
  serviceLines?: Array<{ kind?: unknown; priceTzs?: unknown; note?: unknown }>;
}

export interface OrderTotals {
  linesTzs: Tzs;
  servicesTzs: Tzs;
  totalTzs: Tzs;
  paidTzs: Tzs;
  balanceTzs: Tzs;
}

const MAX_TZS = 2_000_000_000;
const MAX_QTY = 10_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SERVICE_KINDS: readonly ServiceKind[] = ['DELIVERY', 'INSTALLATION'];

const trimmed = (v: unknown): string | null => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};
const asInt = (v: unknown): number | null =>
  typeof v === 'number' && Number.isSafeInteger(v) ? v : null;

export const formatOrderNumber = (n: number): string => `SO-${String(n).padStart(6, '0')}`;

@Injectable()
export class OrdersService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /**
   * Create a quote or a confirmed order (T2.1), atomically: per-merchant
   * sequential number (merchant row locked), lines priced at the agreed or
   * catalog price, optional service lines, optional inline customer.
   */
  async create(merchantId: string, actorUserId: string, input: CreateOrderInput) {
    const errors: FieldError[] = [];

    const type = (trimmed(input.type) ?? 'QUOTE').toUpperCase();
    if (type !== 'QUOTE' && type !== 'ORDER') {
      errors.push({ field: 'type', message: "type must be 'QUOTE' or 'ORDER'" });
    }

    const locationId = trimmed(input.locationId);
    if (!locationId || !UUID_RE.test(locationId)) {
      errors.push({ field: 'locationId', message: 'locationId is required (uuid)' });
    } else if (!(await this.ds.getRepository(Location).findOneBy({ id: locationId, merchantId }))) {
      errors.push({ field: 'locationId', message: 'location does not belong to this merchant' });
    }

    // customer: by id, inline, or none
    let customerId = trimmed(input.customerId);
    if (customerId && !UUID_RE.test(customerId)) {
      errors.push({ field: 'customerId', message: 'customerId must be a uuid' });
    } else if (customerId) {
      const found = await this.ds.getRepository(Customer).findOneBy({ id: customerId, merchantId });
      if (!found) errors.push({ field: 'customerId', message: 'customer not found for this merchant' });
    }
    let inlineCustomer: { name: string; phone: string | null; tin: string | null } | null = null;
    if (!customerId && input.customer !== undefined && input.customer !== null) {
      const name = trimmed(input.customer.name);
      if (!name) errors.push({ field: 'customer.name', message: 'customer.name is required' });
      else inlineCustomer = { name, phone: trimmed(input.customer.phone), tin: trimmed(input.customer.tin) };
    }

    // product lines
    const rawLines = Array.isArray(input.lines) ? input.lines : [];
    if (rawLines.length === 0) {
      errors.push({ field: 'lines', message: 'at least one line is required' });
    }
    const productIds = rawLines
      .map((l) => trimmed(l?.productId))
      .filter((p): p is string => !!p && UUID_RE.test(p));
    const products = productIds.length
      ? await this.ds.getRepository(Product).findBy({ id: In(productIds), merchantId })
      : [];
    const productById = new Map(products.map((p) => [p.id, p]));

    const lines: Array<{ productId: string; qty: number; unitPriceTzs: number }> = [];
    for (let i = 0; i < rawLines.length; i++) {
      const at = (f: string): string => `lines[${i}].${f}`;
      const line = rawLines[i] ?? {};
      const productId = trimmed(line.productId);
      if (!productId || !UUID_RE.test(productId)) {
        errors.push({ field: at('productId'), message: 'productId is required (uuid)' });
        continue;
      }
      const product = productById.get(productId);
      if (!product) {
        errors.push({ field: at('productId'), message: 'product not found for this merchant' });
        continue;
      }
      if (!product.active) {
        errors.push({ field: at('productId'), message: 'product is archived' });
        continue;
      }
      const qty = asInt(line.qty);
      if (qty === null || qty <= 0 || qty > MAX_QTY) {
        errors.push({ field: at('qty'), message: 'qty must be a positive whole number' });
        continue;
      }
      let unitPriceTzs = product.priceTzs;
      if (line.unitPriceTzs !== undefined && line.unitPriceTzs !== null && line.unitPriceTzs !== '') {
        const n = asInt(line.unitPriceTzs);
        if (n === null || n <= 0 || n > MAX_TZS) {
          errors.push({
            field: at('unitPriceTzs'),
            message: 'unitPriceTzs must be a positive whole number of TZS',
          });
          continue;
        }
        unitPriceTzs = n;
      }
      lines.push({ productId, qty, unitPriceTzs });
    }

    // service lines
    const rawServices = Array.isArray(input.serviceLines) ? input.serviceLines : [];
    const serviceLines: Array<{ kind: ServiceKind; priceTzs: number; note: string | null }> = [];
    for (let i = 0; i < rawServices.length; i++) {
      const at = (f: string): string => `serviceLines[${i}].${f}`;
      const s = rawServices[i] ?? {};
      const kind = (trimmed(s.kind) ?? '').toUpperCase() as ServiceKind;
      if (!SERVICE_KINDS.includes(kind)) {
        errors.push({ field: at('kind'), message: `kind must be one of ${SERVICE_KINDS.join(', ')}` });
        continue;
      }
      const priceTzs = asInt(s.priceTzs);
      if (priceTzs === null || priceTzs < 0 || priceTzs > MAX_TZS) {
        errors.push({
          field: at('priceTzs'),
          message: 'priceTzs must be a non-negative whole number of TZS',
        });
        continue;
      }
      serviceLines.push({ kind, priceTzs, note: trimmed(s.note) });
    }

    if (errors.length) throw new BadRequestException({ message: 'Validation failed', errors });

    const orderId = await this.ds.transaction(async (mgr) => {
      if (inlineCustomer) {
        const saved = await mgr
          .getRepository(Customer)
          .save(mgr.getRepository(Customer).create({ merchantId, ...inlineCustomer }));
        customerId = saved.id;
      }
      // per-merchant sequence: lock the merchant row, then MAX+1
      await mgr.query(`SELECT id FROM merchants WHERE id = $1 FOR UPDATE`, [merchantId]);
      const [{ next }] = (await mgr.query(
        `SELECT COALESCE(MAX(number), 0) + 1 AS next FROM sales_orders WHERE "merchantId" = $1`,
        [merchantId],
      )) as [{ next: string | number }];

      const order = await mgr.getRepository(SalesOrder).save(
        mgr.getRepository(SalesOrder).create({
          merchantId,
          number: Number(next),
          status: type === 'ORDER' ? 'CONFIRMED' : 'QUOTE',
          customerId,
          locationId: locationId as string,
          note: trimmed(input.note),
          createdByUserId: actorUserId,
        }),
      );
      for (const line of lines) {
        await mgr
          .getRepository(SalesOrderLine)
          .save(mgr.getRepository(SalesOrderLine).create({ orderId: order.id, ...line }));
      }
      for (const s of serviceLines) {
        await mgr
          .getRepository(SalesOrderServiceLine)
          .save(mgr.getRepository(SalesOrderServiceLine).create({ orderId: order.id, ...s }));
      }
      await this.audit.record(
        {
          merchantId,
          actorUserId,
          entityType: 'SalesOrder',
          entityId: order.id,
          action: type === 'ORDER' ? 'ORDER_CREATED' : 'QUOTE_CREATED',
          after: { number: order.number, status: order.status, lines, serviceLines },
        },
        mgr,
      );
      return order.id;
    });
    return this.getById(merchantId, orderId);
  }

  /** Quote → order, cancellation, and (from T2.2 on) fulfillment edges — the single door. */
  async transition(
    merchantId: string,
    orderId: string,
    to: OrderStatus,
    actorUserId: string,
    manager?: EntityManager,
  ) {
    const run = async (mgr: EntityManager): Promise<void> => {
      const order = await mgr
        .getRepository(SalesOrder)
        .createQueryBuilder('o')
        .setLock('pessimistic_write')
        .where('o.id = :orderId AND o.merchantId = :merchantId', { orderId, merchantId })
        .getOne();
      if (!order) throw new NotFoundException('Order not found');
      const from = order.status;
      assertOrderTransition(order.number, from, to);
      order.status = to;
      await mgr.getRepository(SalesOrder).save(order);
      await this.audit.record(
        {
          merchantId,
          actorUserId,
          entityType: 'SalesOrder',
          entityId: order.id,
          action: `ORDER_${to}`,
          before: { status: from },
          after: { status: to, number: order.number },
        },
        mgr,
      );
    };
    if (manager) await run(manager);
    else await this.ds.transaction(run);
    return this.getById(merchantId, orderId);
  }

  async getById(merchantId: string, id: string) {
    const order = UUID_RE.test(id)
      ? await this.ds.getRepository(SalesOrder).findOne({
          where: { id, merchantId },
          relations: {
            lines: { product: true },
            serviceLines: true,
            payments: true,
            deliveries: true,
            customer: true,
            location: true,
          },
        })
      : null;
    if (!order) throw new NotFoundException('Order not found');
    // the order screen shows the current delivery (the live one, else latest) — T4.1
    const delivery =
      (order.deliveries ?? [])
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .find((d) => d.status !== 'FAILED') ??
      (order.deliveries ?? [])
        .slice()
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ??
      null;
    return {
      ...order,
      numberFormatted: formatOrderNumber(order.number),
      totals: this.totals(order),
      delivery,
    };
  }

  async list(
    merchantId: string,
    query: { status?: string; limit?: number; offset?: number },
  ) {
    const where: Record<string, unknown> = { merchantId };
    if (query.status) where.status = query.status;
    const [items, total] = await this.ds.getRepository(SalesOrder).findAndCount({
      where,
      relations: { lines: true, serviceLines: true, payments: true, customer: true },
      order: { number: 'DESC' },
      take: Math.min(Math.max(query.limit ?? 50, 1), 200),
      skip: Math.max(query.offset ?? 0, 0),
    });
    return {
      items: items.map((o) => ({
        ...o,
        numberFormatted: formatOrderNumber(o.number),
        totals: this.totals(o),
      })),
      total,
    };
  }

  totals(order: Pick<SalesOrder, 'lines' | 'serviceLines' | 'payments'>): OrderTotals {
    const linesTzs = (order.lines ?? []).reduce((s, l) => s + l.qty * l.unitPriceTzs, 0);
    const servicesTzs = (order.serviceLines ?? []).reduce((s, l) => s + l.priceTzs, 0);
    const totalTzs = linesTzs + servicesTzs;
    const paidTzs = (order.payments ?? []).reduce((s, p) => s + p.amountTzs, 0);
    return { linesTzs, servicesTzs, totalTzs, paidTzs, balanceTzs: totalTzs - paidTzs };
  }
}
