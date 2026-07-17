import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, type EntityManager } from 'typeorm';
import { DATA_SOURCE } from '../db/tokens.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { SalesOrderLine } from '../db/entities/sales-order-line.entity.js';
import { SerializedUnit } from '../db/entities/serialized-unit.entity.js';
import { StockLevel } from '../db/entities/stock-level.entity.js';
import { CreditAgreement } from '../db/entities/credit-agreement.entity.js';
import { UnitStateService } from '../inventory/unit-state.service.js';
import { OrdersService } from './orders.service.js';
import type { FieldError } from '../catalog/product.rules.js';

export interface ReserveInput {
  lineId?: unknown;
  serials?: unknown;
}

export interface FulfillInput {
  /** Picks for quantities not already reserved (deferred flow). */
  picks?: Array<{ lineId?: unknown; serials?: unknown }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Serial reservation & pick (T2.2): connects the order lifecycle to the unit
 * state machine. Every path runs in ONE transaction and only ever moves
 * units through UnitStateService — no direct status writes.
 */
@Injectable()
export class FulfillmentService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(UnitStateService) private readonly units: UnitStateService,
  ) {}

  /** Reserve specific serials against a CONFIRMED order's line (or several calls, line by line). */
  async reserve(merchantId: string, orderId: string, actorUserId: string, input: ReserveInput) {
    const { lineId, serials } = this.parseLineSerials(input);
    await this.ds.transaction(async (mgr) => {
      const order = await this.lockOrder(mgr, merchantId, orderId);
      if (order.status !== 'CONFIRMED') {
        throw new BadRequestException({
          message: `Serials are reserved on CONFIRMED orders (this one is ${order.status})`,
        });
      }
      const line = await this.getLine(mgr, order.id, lineId);
      const found = await this.lockUnitsBySerial(mgr, merchantId, serials);

      const errors: FieldError[] = [];
      for (const serial of serials) {
        const unit = found.get(serial);
        if (!unit) errors.push({ field: 'serials', message: `serial "${serial}" not found for this merchant` });
        else if (unit.productId !== line.productId) {
          errors.push({ field: 'serials', message: `serial "${serial}" is a different product than the line` });
        } else if (unit.status !== 'IN_STOCK') {
          errors.push({ field: 'serials', message: `serial "${serial}" is not available (status ${unit.status})` });
        }
      }
      const already = await mgr
        .getRepository(SerializedUnit)
        .countBy({ orderLineId: line.id, status: In(['RESERVED', 'SOLD']) });
      if (already + serials.length > line.qty) {
        errors.push({
          field: 'serials',
          message: `line takes ${line.qty} unit(s); ${already} already assigned — ${serials.length} more won't fit`,
        });
      }
      if (errors.length) throw new BadRequestException({ message: 'Validation failed', errors });

      for (const serial of serials) {
        const unit = found.get(serial) as SerializedUnit;
        await this.units.transition(
          merchantId, unit.id, 'RESERVED', actorUserId,
          { orderId: order.id, orderLineId: line.id, orderNumber: order.number },
          mgr,
        );
        await mgr.getRepository(SerializedUnit).update(unit.id, { orderLineId: line.id });
      }
    });
    return this.orders.getById(merchantId, orderId);
  }

  /**
   * Fulfill a CONFIRMED order: every serialized line must end up fully
   * assigned (reservations + picks provided now); picked/reserved units go to
   * SOLD; non-serialized lines decrement their stock level at the order's
   * location. Order → FULFILLED. All-or-nothing.
   */
  async fulfill(merchantId: string, orderId: string, actorUserId: string, input: FulfillInput) {
    const rawPicks = Array.isArray(input.picks) ? input.picks : [];
    const picks = rawPicks.map((p, i) => {
      try {
        return this.parseLineSerials(p);
      } catch (e) {
        throw new BadRequestException({ message: `picks[${i}]: ${(e as BadRequestException).message}` });
      }
    });

    await this.ds.transaction(async (mgr) => {
      const order = await this.lockOrder(mgr, merchantId, orderId);
      if (order.status !== 'CONFIRMED') {
        throw new BadRequestException({
          message: `Only CONFIRMED orders fulfill (this one is ${order.status})`,
        });
      }
      // LAYAWAY holds the goods until the schedule is settled (T3.1);
      // INSTALLMENT releases them — that's the whole difference between the two.
      const agreement = await mgr.getRepository(CreditAgreement).findOneBy({ orderId: order.id });
      if (agreement?.type === 'LAYAWAY' && agreement.status !== 'SETTLED') {
        throw new ConflictException(
          `Layaway holds goods until fully paid — agreement is ${agreement.status}`,
        );
      }
      const lines = await mgr
        .getRepository(SalesOrderLine)
        .find({ where: { orderId: order.id }, relations: { product: true } });
      const lineById = new Map(lines.map((l) => [l.id, l]));
      const errors: FieldError[] = [];

      // apply picks first (deferred flow): same rules as reserve
      for (let i = 0; i < picks.length; i++) {
        const { lineId, serials } = picks[i];
        const line = lineById.get(lineId);
        if (!line) {
          errors.push({ field: `picks[${i}].lineId`, message: 'line not found on this order' });
          continue;
        }
        const found = await this.lockUnitsBySerial(mgr, merchantId, serials);
        for (const serial of serials) {
          const unit = found.get(serial);
          if (!unit) errors.push({ field: `picks[${i}].serials`, message: `serial "${serial}" not found for this merchant` });
          else if (unit.productId !== line.productId) {
            errors.push({ field: `picks[${i}].serials`, message: `serial "${serial}" is a different product than the line` });
          } else if (unit.status !== 'IN_STOCK') {
            errors.push({ field: `picks[${i}].serials`, message: `serial "${serial}" is not available (status ${unit.status})` });
          }
        }
        if (errors.length) continue;
        for (const serial of serials) {
          const unit = found.get(serial) as SerializedUnit;
          // D-021: no shortcut edges — pick composes RESERVE, SELL happens below
          await this.units.transition(
            merchantId, unit.id, 'RESERVED', actorUserId,
            { orderId: order.id, orderLineId: line.id, pick: 1 },
            mgr,
          );
          await mgr.getRepository(SerializedUnit).update(unit.id, { orderLineId: line.id });
        }
      }
      if (errors.length) throw new BadRequestException({ message: 'Validation failed', errors });

      // every line must now be fully covered
      for (const line of lines) {
        if (line.product.isSerialized) {
          const assigned = await mgr
            .getRepository(SerializedUnit)
            .findBy({ orderLineId: line.id, status: 'RESERVED' });
          if (assigned.length !== line.qty) {
            errors.push({
              field: 'picks',
              message:
                `line for ${line.product.brand} ${line.product.model} needs ${line.qty} unit(s), ` +
                `has ${assigned.length} — pick the remaining serials to fulfill`,
            });
            continue;
          }
        } else {
          const level = await mgr
            .getRepository(StockLevel)
            .createQueryBuilder('sl')
            .setLock('pessimistic_write')
            .where('sl.merchantId = :m AND sl.productId = :p AND sl.locationId = :l', {
              m: merchantId, p: line.productId, l: order.locationId,
            })
            .getOne();
          if (!level || level.qty < line.qty) {
            errors.push({
              field: 'lines',
              message:
                `insufficient stock of ${line.product.brand} ${line.product.model} at this location ` +
                `(need ${line.qty}, have ${level?.qty ?? 0})`,
            });
          }
        }
      }
      if (errors.length) throw new BadRequestException({ message: 'Validation failed', errors });

      // commit the movement: units → SOLD, levels decremented, order → FULFILLED
      for (const line of lines) {
        if (line.product.isSerialized) {
          const assigned = await mgr
            .getRepository(SerializedUnit)
            .findBy({ orderLineId: line.id, status: 'RESERVED' });
          for (const unit of assigned) {
            await this.units.transition(
              merchantId, unit.id, 'SOLD', actorUserId,
              { orderId: order.id, orderLineId: line.id, orderNumber: order.number },
              mgr,
            );
          }
        } else {
          const level = (await mgr
            .getRepository(StockLevel)
            .findOneBy({ merchantId, productId: line.productId, locationId: order.locationId })) as StockLevel;
          level.qty -= line.qty;
          await mgr.getRepository(StockLevel).save(level);
        }
      }
      await this.orders.transition(merchantId, order.id, 'FULFILLED', actorUserId, mgr);
    });
    return this.orders.getById(merchantId, orderId);
  }

  /** Cancel an order, releasing any reserved units back to stock (T2.2 verify clause). */
  async cancel(merchantId: string, orderId: string, actorUserId: string) {
    await this.ds.transaction(async (mgr) => {
      const order = await this.lockOrder(mgr, merchantId, orderId);
      // an ACTIVE agreement means money is owed against a schedule — resolve
      // the agreement first (cancellation flow arrives later in M3)
      const agreement = await mgr.getRepository(CreditAgreement).findOneBy({ orderId: order.id });
      if (agreement?.status === 'ACTIVE') {
        throw new ConflictException(
          `Order has an ACTIVE ${agreement.type} agreement — resolve it before cancelling`,
        );
      }
      const reserved = await mgr
        .getRepository(SerializedUnit)
        .createQueryBuilder('u')
        .setLock('pessimistic_write')
        .innerJoin(SalesOrderLine, 'l', 'l.id = u."orderLineId"')
        .where('l.orderId = :orderId AND u.status = :status', { orderId: order.id, status: 'RESERVED' })
        .getMany();
      // order transition first — it validates cancellability (409 if fulfilled/terminal)
      await this.orders.transition(merchantId, order.id, 'CANCELLED', actorUserId, mgr);
      for (const unit of reserved) {
        await this.units.transition(
          merchantId, unit.id, 'IN_STOCK', actorUserId,
          { orderId: order.id, released: 1, orderNumber: order.number },
          mgr,
        );
        await mgr.getRepository(SerializedUnit).update(unit.id, { orderLineId: null });
      }
    });
    return this.orders.getById(merchantId, orderId);
  }

  // ── helpers ──

  private parseLineSerials(input: ReserveInput): { lineId: string; serials: string[] } {
    const lineId = typeof input.lineId === 'string' ? input.lineId.trim() : '';
    if (!UUID_RE.test(lineId)) {
      throw new BadRequestException({ message: 'lineId is required (uuid)' });
    }
    const raw = Array.isArray(input.serials) ? input.serials : [];
    const serials = [...new Set(raw.map((s) => String(s).trim()).filter((s) => s !== ''))];
    if (serials.length === 0) {
      throw new BadRequestException({ message: 'serials must be a non-empty array' });
    }
    return { lineId, serials };
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

  private async getLine(mgr: EntityManager, orderId: string, lineId: string) {
    const line = await mgr
      .getRepository(SalesOrderLine)
      .findOne({ where: { id: lineId, orderId }, relations: { product: true } });
    if (!line) throw new BadRequestException({ message: 'lineId does not belong to this order' });
    if (!line.product.isSerialized) {
      throw new BadRequestException({ message: 'serials only apply to serialized products' });
    }
    return line;
  }

  private async lockUnitsBySerial(
    mgr: EntityManager,
    merchantId: string,
    serials: string[],
  ): Promise<Map<string, SerializedUnit>> {
    const units = await mgr
      .getRepository(SerializedUnit)
      .createQueryBuilder('u')
      .setLock('pessimistic_write')
      .where('u.merchantId = :merchantId AND u.serial IN (:...serials)', { merchantId, serials })
      .getMany();
    return new Map(units.map((u) => [u.serial, u]));
  }
}
