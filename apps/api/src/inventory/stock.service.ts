import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { UnitStatus } from '@biashara/shared';
import { DATA_SOURCE } from '../db/tokens.js';
import { SerializedUnit } from '../db/entities/serialized-unit.entity.js';
import { AuditEvent } from '../db/entities/audit-event.entity.js';

export interface StockRow {
  productId: string;
  brand: string;
  model: string;
  sku: string | null;
  locationId: string;
  locationName: string;
  inStock: number;
  reserved: number;
  sold: number;
  returned: number;
}

export interface StockQuery {
  productId?: string;
  locationId?: string;
  q?: string;
}

export interface UnitHistoryEvent {
  at: Date;
  action: string;
  actorUserId: string | null;
  before: unknown;
  after: unknown;
}

@Injectable()
export class StockService {
  constructor(@Inject(DATA_SOURCE) private readonly ds: DataSource) {}

  /**
   * Stock by product × location (T1.4): per-status counts of units physically
   * tied to the shop. DELIVERED units are gone and excluded; RETURNED shown
   * separately (present but not sellable in V1).
   */
  async stock(merchantId: string, query: StockQuery): Promise<{ items: StockRow[] }> {
    const params: unknown[] = [merchantId];
    let where = `u."merchantId" = $1 AND u."status" <> 'DELIVERED'`;
    if (query.productId) {
      params.push(query.productId);
      where += ` AND u."productId" = $${params.length}`;
    }
    if (query.locationId) {
      params.push(query.locationId);
      where += ` AND u."locationId" = $${params.length}`;
    }
    if (query.q) {
      params.push(`%${query.q}%`);
      where += ` AND (p."brand" ILIKE $${params.length} OR p."model" ILIKE $${params.length} OR p."sku" ILIKE $${params.length})`;
    }
    const items = await this.ds.query(
      `SELECT u."productId", p."brand", p."model", p."sku",
              u."locationId", l."name" AS "locationName",
              COUNT(*) FILTER (WHERE u."status" = 'IN_STOCK')::int  AS "inStock",
              COUNT(*) FILTER (WHERE u."status" = 'RESERVED')::int  AS "reserved",
              COUNT(*) FILTER (WHERE u."status" = 'SOLD')::int      AS "sold",
              COUNT(*) FILTER (WHERE u."status" = 'RETURNED')::int  AS "returned"
         FROM serialized_units u
         JOIN products  p ON p."id" = u."productId"
         JOIN locations l ON l."id" = u."locationId"
        WHERE ${where}
        GROUP BY u."productId", p."brand", p."model", p."sku", u."locationId", l."name"
        ORDER BY p."brand", p."model", l."name"`,
      params,
    );
    return { items };
  }

  /**
   * Find-by-serial (T1.4): exact serial within the merchant → unit, GRN
   * provenance, and the full history (received + every state transition,
   * actor-attributed). Safety-net UPDATE rows are filtered out — the
   * UNIT_* events already describe each transition.
   */
  async lookupBySerial(merchantId: string, serial: string) {
    const unit = await this.ds.getRepository(SerializedUnit).findOne({
      where: { merchantId, serial },
      relations: { product: true, location: true, grn: { location: true } },
    });
    if (!unit) throw new NotFoundException(`No unit with serial "${serial}" for this merchant`);

    const events = await this.ds
      .getRepository(AuditEvent)
      .createQueryBuilder('e')
      .where('e.entityType = :t AND e.entityId = :id', { t: 'SerializedUnit', id: unit.id })
      .andWhere(`(e.action = 'INSERT' OR e.action LIKE 'UNIT\\_%')`)
      .orderBy('e.at', 'ASC')
      .addOrderBy('e.id', 'ASC')
      .getMany();

    const history: UnitHistoryEvent[] = events.map((e) => ({
      at: e.at,
      action: e.action === 'INSERT' ? 'RECEIVED' : e.action,
      actorUserId: e.actorUserId,
      before: e.before,
      after: e.after,
    }));

    return {
      unit: {
        id: unit.id,
        serial: unit.serial,
        status: unit.status as UnitStatus,
        costTzs: unit.costTzs,
        createdAt: unit.createdAt,
        product: {
          id: unit.product.id,
          brand: unit.product.brand,
          model: unit.product.model,
          sku: unit.product.sku,
        },
        location: { id: unit.location.id, name: unit.location.name },
      },
      grn: {
        id: unit.grn.id,
        receivedAt: unit.grn.createdAt,
        supplierName: unit.grn.supplierName,
        receivedByUserId: unit.grn.receivedByUserId,
        location: { id: unit.grn.location.id, name: unit.grn.location.name },
      },
      history,
    };
  }
}
