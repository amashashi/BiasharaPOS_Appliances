import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PaymentIntents1784220000000 implements MigrationInterface {
  name = 'PaymentIntents1784220000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE payment_intents (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "orderId" uuid NOT NULL REFERENCES sales_orders(id),
        "provider" varchar NOT NULL,
        "msisdn" varchar NOT NULL,
        "amountTzs" integer NOT NULL,
        "intentId" varchar NOT NULL,
        "status" varchar NOT NULL DEFAULT 'PENDING',
        "providerRef" varchar,
        "appliedPaymentId" uuid REFERENCES payments(id),
        "initiatedByUserId" varchar NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "resolvedAt" timestamptz,
        CONSTRAINT uq_intent_external UNIQUE ("intentId"),
        CONSTRAINT ck_intent_provider CHECK ("provider" IN ('MPESA', 'MIXX_BY_YAS', 'AIRTEL_MONEY')),
        CONSTRAINT ck_intent_status CHECK ("status" IN ('PENDING', 'CONFIRMED', 'FAILED')),
        CONSTRAINT ck_intent_amount_positive CHECK ("amountTzs" > 0)
      )`);
    await q.query(`CREATE INDEX ix_intent_order ON payment_intents ("orderId")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE payment_intents`);
  }
}
