import type { MigrationInterface, QueryRunner } from 'typeorm';

export class GrnSerializedUnits1784150000000 implements MigrationInterface {
  name = 'GrnSerializedUnits1784150000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE grns (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "locationId" uuid NOT NULL REFERENCES locations(id),
        "supplierName" varchar,
        "note" varchar,
        "receivedByUserId" varchar NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);
    await q.query(`CREATE INDEX ix_grn_merchant_created ON grns ("merchantId", "createdAt")`);
    await q.query(`
      CREATE TABLE grn_lines (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "grnId" uuid NOT NULL REFERENCES grns(id),
        "productId" uuid NOT NULL REFERENCES products(id),
        "qty" integer NOT NULL,
        "unitCostTzs" integer,
        CONSTRAINT ck_grn_line_qty_positive CHECK ("qty" > 0),
        CONSTRAINT ck_grn_line_cost_nonnegative CHECK ("unitCostTzs" IS NULL OR "unitCostTzs" >= 0)
      )`);
    await q.query(`
      CREATE TABLE serialized_units (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "productId" uuid NOT NULL REFERENCES products(id),
        "serial" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'IN_STOCK',
        "locationId" uuid NOT NULL REFERENCES locations(id),
        "grnId" uuid NOT NULL REFERENCES grns(id),
        "costTzs" integer,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_unit_merchant_serial UNIQUE ("merchantId", "serial"),
        CONSTRAINT ck_unit_cost_nonnegative CHECK ("costTzs" IS NULL OR "costTzs" >= 0)
      )`);
    await q.query(`
      CREATE INDEX ix_unit_merchant_product_status
        ON serialized_units ("merchantId", "productId", "status")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE serialized_units`);
    await q.query(`DROP TABLE grn_lines`);
    await q.query(`DROP TABLE grns`);
  }
}
