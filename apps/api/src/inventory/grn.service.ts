import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { DATA_SOURCE } from '../db/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { Grn } from '../db/entities/grn.entity.js';
import { GrnLine } from '../db/entities/grn-line.entity.js';
import { SerializedUnit } from '../db/entities/serialized-unit.entity.js';
import { Product } from '../db/entities/product.entity.js';
import { Location } from '../db/entities/location.entity.js';
import type { FieldError } from '../catalog/product.rules.js';

export interface ReceiveLineInput {
  productId?: unknown;
  unitCostTzs?: unknown;
  serials?: unknown;
}

export interface ReceiveGrnInput {
  locationId?: unknown;
  supplierName?: unknown;
  note?: unknown;
  lines?: ReceiveLineInput[];
}

const SERIAL_MAX = 128;
const MAX_TZS = 2_000_000_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const trimmed = (v: unknown): string | null => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
};

@Injectable()
export class GrnService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /**
   * Receive stock (T1.2): create the GRN + lines and one IN_STOCK
   * SerializedUnit per serial, atomically. Serials are unique per merchant —
   * duplicates (in the payload or already in stock) reject the whole request
   * with every offending serial named, so a scan mistake is fixed in one go.
   */
  async receive(
    merchantId: string,
    actorUserId: string,
    input: ReceiveGrnInput,
  ): Promise<Grn> {
    const errors: FieldError[] = [];

    const locationId = trimmed(input.locationId);
    if (!locationId || !UUID_RE.test(locationId)) {
      errors.push({ field: 'locationId', message: 'locationId is required (uuid)' });
    } else {
      const location = await this.ds
        .getRepository(Location)
        .findOneBy({ id: locationId, merchantId });
      if (!location) {
        errors.push({ field: 'locationId', message: 'location does not belong to this merchant' });
      }
    }

    const lines = Array.isArray(input.lines) ? input.lines : [];
    if (lines.length === 0) {
      errors.push({ field: 'lines', message: 'at least one line is required' });
    }

    // per-line shape validation
    const parsed: Array<{ productId: string; unitCostTzs: number | null; serials: string[] }> = [];
    const seenSerials = new Map<string, string>(); // serial -> first field path
    for (let i = 0; i < lines.length; i++) {
      const at = (f: string): string => `lines[${i}].${f}`;
      const line = lines[i] ?? {};

      const productId = trimmed(line.productId);
      if (!productId || !UUID_RE.test(productId)) {
        errors.push({ field: at('productId'), message: 'productId is required (uuid)' });
      }

      let unitCostTzs: number | null = null;
      if (line.unitCostTzs !== undefined && line.unitCostTzs !== null && line.unitCostTzs !== '') {
        const n = typeof line.unitCostTzs === 'number' ? line.unitCostTzs : NaN;
        if (!Number.isSafeInteger(n) || n < 0 || n > MAX_TZS) {
          errors.push({
            field: at('unitCostTzs'),
            message: 'unitCostTzs must be a non-negative whole number of TZS',
          });
        } else unitCostTzs = n;
      }

      const rawSerials = Array.isArray(line.serials) ? line.serials : [];
      if (rawSerials.length === 0) {
        errors.push({ field: at('serials'), message: 'at least one serial is required per line' });
      }
      const serials: string[] = [];
      for (let s = 0; s < rawSerials.length; s++) {
        const serial = trimmed(rawSerials[s]);
        if (!serial || serial.length > SERIAL_MAX) {
          errors.push({
            field: at(`serials[${s}]`),
            message: `serial must be a non-empty string of at most ${SERIAL_MAX} characters`,
          });
          continue;
        }
        const firstSeen = seenSerials.get(serial);
        if (firstSeen) {
          errors.push({
            field: at(`serials[${s}]`),
            message: `duplicate serial "${serial}" in this request (first at ${firstSeen})`,
          });
        } else {
          seenSerials.set(serial, at(`serials[${s}]`));
          serials.push(serial);
        }
      }
      if (productId && UUID_RE.test(productId)) {
        parsed.push({ productId, unitCostTzs, serials });
      }
    }

    // products must exist, belong to the merchant, and be active
    const productIds = [...new Set(parsed.map((l) => l.productId))];
    const products = productIds.length
      ? await this.ds.getRepository(Product).findBy({ id: In(productIds), merchantId })
      : [];
    const productById = new Map(products.map((p) => [p.id, p]));
    for (let i = 0; i < lines.length; i++) {
      const productId = trimmed(lines[i]?.productId);
      if (!productId || !UUID_RE.test(productId)) continue;
      const product = productById.get(productId);
      if (!product) {
        errors.push({
          field: `lines[${i}].productId`,
          message: 'product not found for this merchant',
        });
      } else if (!product.active) {
        errors.push({ field: `lines[${i}].productId`, message: 'product is archived' });
      }
    }

    // duplicate-serial rejection against existing stock, per merchant (T1.2 verify clause)
    const allSerials = [...seenSerials.keys()];
    if (allSerials.length) {
      const existing = await this.ds
        .getRepository(SerializedUnit)
        .findBy({ merchantId, serial: In(allSerials) });
      for (const unit of existing) {
        errors.push({
          field: seenSerials.get(unit.serial) ?? 'serials',
          message: `serial "${unit.serial}" already exists for this merchant (status ${unit.status})`,
        });
      }
    }

    if (errors.length) throw new BadRequestException({ message: 'Validation failed', errors });

    const grn = await this.ds.transaction(async (mgr) => {
      const created = await mgr
        .getRepository(Grn)
        .save(
          mgr.getRepository(Grn).create({
            merchantId,
            locationId: locationId as string,
            supplierName: trimmed(input.supplierName),
            note: trimmed(input.note),
            receivedByUserId: actorUserId,
          }),
        );
      for (const line of parsed) {
        const product = productById.get(line.productId) as Product;
        const savedLine = await mgr.getRepository(GrnLine).save(
          mgr.getRepository(GrnLine).create({
            grnId: created.id,
            productId: line.productId,
            qty: line.serials.length,
            unitCostTzs: line.unitCostTzs ?? product.costTzs,
          }),
        );
        for (const serial of line.serials) {
          await mgr.getRepository(SerializedUnit).save(
            mgr.getRepository(SerializedUnit).create({
              merchantId,
              productId: line.productId,
              serial,
              status: 'IN_STOCK',
              locationId: locationId as string,
              grnId: created.id,
              costTzs: savedLine.unitCostTzs,
            }),
          );
        }
      }
      return created;
    });

    await this.audit.record({
      merchantId,
      actorUserId,
      entityType: 'Grn',
      entityId: grn.id,
      action: 'GRN_RECEIVED',
      after: { locationId, lines: parsed.map((l) => ({ productId: l.productId, qty: l.serials.length })) },
    });

    return this.getById(merchantId, grn.id);
  }

  /** GRN with lines and the serials it brought in (receiving provenance). */
  async getById(
    merchantId: string,
    id: string,
  ): Promise<Grn & { units: Pick<SerializedUnit, 'id' | 'productId' | 'serial' | 'status'>[] }> {
    const grn = UUID_RE.test(id)
      ? await this.ds.getRepository(Grn).findOne({ where: { id, merchantId }, relations: { lines: true } })
      : null;
    if (!grn) throw new NotFoundException('GRN not found');
    const units = await this.ds.getRepository(SerializedUnit).find({
      where: { grnId: grn.id },
      select: { id: true, productId: true, serial: true, status: true },
      order: { serial: 'ASC' },
    });
    return Object.assign(grn, { units });
  }

  async list(merchantId: string, limit = 50, offset = 0): Promise<{ items: Grn[]; total: number }> {
    const [items, total] = await this.ds.getRepository(Grn).findAndCount({
      where: { merchantId },
      relations: { lines: true },
      order: { createdAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 200),
      skip: Math.max(offset, 0),
    });
    return { items, total };
  }
}
