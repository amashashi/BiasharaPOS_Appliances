import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { DATA_SOURCE } from '../db/tokens.js';
import { Product } from '../db/entities/product.entity.js';
import { parseCsv } from './csv.js';
import { validateProductInput, type FieldError, type ProductInput } from './product.rules.js';

export interface ListQuery {
  q?: string;
  category?: string;
  includeArchived?: boolean;
  limit?: number;
  offset?: number;
}

/** One CSV row's problems; `line` is the 1-based line in the file (header = 1). */
export interface ImportRowError {
  line: number;
  errors: FieldError[];
}

export interface ImportReport {
  totalRows: number;
  imported: number;
  errors: ImportRowError[];
}

const CSV_COLUMNS = [
  'sku', 'brand', 'model', 'category', 'taxCode', 'priceTzs', 'costTzs', 'isSerialized',
];
const CSV_REQUIRED = ['brand', 'model', 'category', 'priceTzs'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class CatalogService {
  constructor(@Inject(DATA_SOURCE) private readonly ds: DataSource) {}

  private get repo() {
    return this.ds.getRepository(Product);
  }

  async create(merchantId: string, raw: Record<string, unknown>): Promise<Product> {
    const { value, errors } = validateProductInput(raw);
    if (errors.length) throw new BadRequestException({ message: 'Validation failed', errors });
    await this.assertSkuFree(merchantId, value.sku ?? null);
    return this.repo.save(this.repo.create({ ...(value as ProductInput), merchantId }));
  }

  async list(
    merchantId: string,
    query: ListQuery,
  ): Promise<{ items: Product[]; total: number }> {
    const qb = this.repo.createQueryBuilder('p').where('p.merchantId = :merchantId', { merchantId });
    if (!query.includeArchived) qb.andWhere('p.active = true');
    if (query.category) qb.andWhere('p.category = :category', { category: query.category });
    if (query.q) {
      qb.andWhere('(p.brand ILIKE :q OR p.model ILIKE :q OR p.sku ILIKE :q)', {
        q: `%${query.q}%`,
      });
    }
    const limit = Math.min(Math.max(query.limit ?? 50, 1), 200);
    const offset = Math.max(query.offset ?? 0, 0);
    const [items, total] = await qb
      .orderBy('p.brand', 'ASC')
      .addOrderBy('p.model', 'ASC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();
    return { items, total };
  }

  async getById(merchantId: string, id: string): Promise<Product> {
    const product = UUID_RE.test(id) ? await this.repo.findOneBy({ id, merchantId }) : null;
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(merchantId: string, id: string, raw: Record<string, unknown>): Promise<Product> {
    const product = await this.getById(merchantId, id);
    const { value, errors } = validateProductInput(raw, { partial: true });
    if (errors.length) throw new BadRequestException({ message: 'Validation failed', errors });
    if (value.sku !== undefined && value.sku !== product.sku) {
      await this.assertSkuFree(merchantId, value.sku);
    }
    if (value.isSerialized !== undefined && value.isSerialized !== product.isSerialized) {
      // the two stock models don't convert — existing units/levels would be orphaned
      const [{ n }] = (await this.ds.query(
        `SELECT (SELECT COUNT(*) FROM serialized_units WHERE "productId" = $1)
              + (SELECT COUNT(*) FROM stock_levels     WHERE "productId" = $1) AS n`,
        [product.id],
      )) as [{ n: string }];
      if (Number(n) > 0) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: [{
            field: 'isSerialized',
            message: 'cannot change isSerialized once the product has stock history',
          }],
        });
      }
    }
    return this.repo.save(this.repo.merge(product, value));
  }

  /** Soft archive — catalog rows referenced by stock/orders are never hard-deleted. */
  async archive(merchantId: string, id: string): Promise<void> {
    const product = await this.getById(merchantId, id);
    product.active = false;
    await this.repo.save(product);
  }

  /**
   * CSV import (T1.1). Header is matched by name (case-insensitive, any order);
   * every valid row imports, every invalid row is reported with its file line —
   * a bad row never blocks the rest of the file.
   */
  async importCsv(merchantId: string, csvText: string): Promise<ImportReport> {
    let rows: string[][];
    try {
      rows = parseCsv(csvText);
    } catch (e) {
      throw new BadRequestException({ message: (e as Error).message });
    }
    if (rows.length < 2) {
      throw new BadRequestException({ message: 'CSV must have a header row and at least one data row' });
    }

    const header = rows[0].map((h) => h.trim());
    const colIndex = new Map<string, number>();
    for (const col of CSV_COLUMNS) {
      const at = header.findIndex((h) => h.toLowerCase() === col.toLowerCase());
      if (at >= 0) colIndex.set(col, at);
    }
    const missing = CSV_REQUIRED.filter((c) => !colIndex.has(c));
    if (missing.length) {
      throw new BadRequestException({ message: `CSV header is missing required columns: ${missing.join(', ')}` });
    }

    const report: ImportReport = { totalRows: 0, imported: 0, errors: [] };
    const valid: Array<{ line: number; value: Partial<ProductInput> }> = [];
    const seenSkus = new Set<string>();

    for (let r = 1; r < rows.length; r++) {
      const line = r + 1;
      const cells = rows[r];
      if (cells.every((c) => c.trim() === '')) continue; // ignore blank lines
      report.totalRows++;

      const raw: Record<string, unknown> = {};
      for (const [col, at] of colIndex) raw[col] = cells[at] ?? '';
      const { value, errors } = validateProductInput(raw);

      const sku = value.sku ?? null;
      if (sku) {
        if (seenSkus.has(sku)) {
          errors.push({ field: 'sku', message: `duplicate sku "${sku}" earlier in this file` });
        }
        seenSkus.add(sku);
      }

      if (errors.length) report.errors.push({ line, errors });
      else valid.push({ line, value });
    }

    // Reject rows whose sku already exists for this merchant (import is create-only).
    const skusToCheck = valid.map((v) => v.value.sku).filter((s): s is string => !!s);
    const existing = skusToCheck.length
      ? new Set(
          (await this.repo.findBy({ merchantId, sku: In(skusToCheck) })).map((p) => p.sku as string),
        )
      : new Set<string>();

    const toInsert = valid.filter(({ line, value }) => {
      if (value.sku && existing.has(value.sku)) {
        report.errors.push({
          line,
          errors: [{ field: 'sku', message: `sku "${value.sku}" already exists for this merchant` }],
        });
        return false;
      }
      return true;
    });

    await this.ds.transaction(async (mgr) => {
      const repo = mgr.getRepository(Product);
      for (const { value } of toInsert) {
        await repo.save(repo.create({ ...(value as ProductInput), merchantId }));
      }
    });
    report.imported = toInsert.length;
    report.errors.sort((a, b) => a.line - b.line);
    return report;
  }

  private async assertSkuFree(merchantId: string, sku: string | null): Promise<void> {
    if (!sku) return;
    const clash = await this.repo.findOneBy({ merchantId, sku });
    if (clash) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [{ field: 'sku', message: `sku "${sku}" already exists for this merchant` }],
      });
    }
  }
}
