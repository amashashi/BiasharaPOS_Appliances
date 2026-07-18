import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Deliveries1784250000000 implements MigrationInterface {
  name = 'Deliveries1784250000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE deliveries (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "orderId" uuid NOT NULL REFERENCES sales_orders(id),
        "scheduledDate" date NOT NULL,
        "window" varchar,
        "addressText" varchar NOT NULL,
        "assigneeUserId" varchar,
        "note" varchar,
        "status" varchar NOT NULL DEFAULT 'PLANNED',
        "scheduledByUserId" varchar NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT ck_delivery_status CHECK ("status" IN ('PLANNED', 'DISPATCHED', 'DELIVERED', 'FAILED'))
      )`);
    await q.query(`CREATE INDEX ix_delivery_order ON deliveries ("orderId")`);
    await q.query(`CREATE INDEX ix_delivery_assignee ON deliveries ("assigneeUserId", "scheduledDate")`);
    // Double-booking guard (T4.1): an order can have at most ONE live delivery.
    // A FAILED delivery is done-with, so rescheduling (T4.3) creates a fresh row.
    await q.query(`
      CREATE UNIQUE INDEX uq_delivery_active_order
        ON deliveries ("orderId") WHERE "status" <> 'FAILED'`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE deliveries`);
  }
}
