import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * T5.5: client-generated idempotency key for offline sales. The POS mints a
 * `clientRef` (uuid) per offline sale and replays it through /sync/outbox; the
 * partial unique index makes replay exactly-once — a double-replay finds the
 * existing order instead of creating a duplicate. Null for online sales.
 */
export class OrderClientRef1784290000000 implements MigrationInterface {
  name = 'OrderClientRef1784290000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE sales_orders ADD COLUMN "clientRef" uuid`);
    await q.query(
      `CREATE UNIQUE INDEX "UQ_sales_orders_merchant_clientRef" ON sales_orders ("merchantId", "clientRef") WHERE "clientRef" IS NOT NULL`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX "UQ_sales_orders_merchant_clientRef"`);
    await q.query(`ALTER TABLE sales_orders DROP COLUMN "clientRef"`);
  }
}
