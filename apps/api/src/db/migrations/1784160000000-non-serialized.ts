import type { MigrationInterface, QueryRunner } from 'typeorm';

export class NonSerialized1784160000000 implements MigrationInterface {
  name = 'NonSerialized1784160000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE products ADD COLUMN "isSerialized" boolean NOT NULL DEFAULT true`,
    );
    await q.query(`
      CREATE TABLE stock_levels (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "productId" uuid NOT NULL REFERENCES products(id),
        "locationId" uuid NOT NULL REFERENCES locations(id),
        "qty" integer NOT NULL DEFAULT 0,
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_stock_level UNIQUE ("merchantId", "productId", "locationId"),
        CONSTRAINT ck_stock_level_qty_nonnegative CHECK ("qty" >= 0)
      )`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE stock_levels`);
    await q.query(`ALTER TABLE products DROP COLUMN "isSerialized"`);
  }
}
