import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SalesOrders1784170000000 implements MigrationInterface {
  name = 'SalesOrders1784170000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE customers (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "name" varchar NOT NULL,
        "phone" varchar,
        "tin" varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);
    await q.query(`CREATE INDEX ix_customer_merchant_phone ON customers ("merchantId", "phone")`);
    await q.query(`
      CREATE TABLE sales_orders (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "number" integer NOT NULL,
        "status" varchar NOT NULL DEFAULT 'QUOTE',
        "customerId" uuid REFERENCES customers(id),
        "locationId" uuid NOT NULL REFERENCES locations(id),
        "note" varchar,
        "createdByUserId" varchar NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_order_merchant_number UNIQUE ("merchantId", "number")
      )`);
    await q.query(`CREATE INDEX ix_order_merchant_status ON sales_orders ("merchantId", "status")`);
    await q.query(`
      CREATE TABLE sales_order_lines (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL REFERENCES sales_orders(id),
        "productId" uuid NOT NULL REFERENCES products(id),
        "qty" integer NOT NULL,
        "unitPriceTzs" integer NOT NULL,
        CONSTRAINT ck_order_line_qty_positive CHECK ("qty" > 0),
        CONSTRAINT ck_order_line_price_positive CHECK ("unitPriceTzs" > 0)
      )`);
    await q.query(`
      CREATE TABLE sales_order_service_lines (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL REFERENCES sales_orders(id),
        "kind" varchar NOT NULL,
        "priceTzs" integer NOT NULL,
        "note" varchar,
        CONSTRAINT ck_service_kind CHECK ("kind" IN ('DELIVERY', 'INSTALLATION')),
        CONSTRAINT ck_service_price_nonnegative CHECK ("priceTzs" >= 0)
      )`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE sales_order_service_lines`);
    await q.query(`DROP TABLE sales_order_lines`);
    await q.query(`DROP TABLE sales_orders`);
    await q.query(`DROP TABLE customers`);
  }
}
