import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Products1784140000000 implements MigrationInterface {
  name = 'Products1784140000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE products (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "sku" varchar,
        "brand" varchar NOT NULL,
        "model" varchar NOT NULL,
        "category" varchar NOT NULL,
        "taxCode" varchar NOT NULL DEFAULT 'A',
        "priceTzs" integer NOT NULL,
        "costTzs" integer,
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT ck_product_price_positive CHECK ("priceTzs" > 0),
        CONSTRAINT ck_product_cost_nonnegative CHECK ("costTzs" IS NULL OR "costTzs" >= 0)
      )`);
    await q.query(`
      CREATE UNIQUE INDEX uq_product_merchant_sku
        ON products ("merchantId", "sku") WHERE "sku" IS NOT NULL`);
    await q.query(`
      CREATE INDEX ix_product_merchant_brand_model
        ON products ("merchantId", "brand", "model")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE products`);
  }
}
