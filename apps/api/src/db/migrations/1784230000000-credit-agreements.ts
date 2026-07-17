import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreditAgreements1784230000000 implements MigrationInterface {
  name = 'CreditAgreements1784230000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE credit_agreements (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "orderId" uuid NOT NULL REFERENCES sales_orders(id),
        "customerId" uuid NOT NULL REFERENCES customers(id),
        "type" varchar NOT NULL,
        "principalTzs" integer NOT NULL,
        "depositTzs" integer NOT NULL,
        "status" varchar NOT NULL DEFAULT 'ACTIVE',
        "createdByUserId" varchar NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "settledAt" timestamptz,
        CONSTRAINT uq_agreement_order UNIQUE ("orderId"),
        CONSTRAINT ck_agreement_type CHECK ("type" IN ('INSTALLMENT', 'LAYAWAY')),
        CONSTRAINT ck_agreement_status CHECK ("status" IN ('ACTIVE', 'SETTLED', 'DEFAULTED', 'CANCELLED')),
        CONSTRAINT ck_agreement_principal_positive CHECK ("principalTzs" > 0),
        CONSTRAINT ck_agreement_deposit_nonnegative CHECK ("depositTzs" >= 0)
      )`);
    await q.query(`CREATE INDEX ix_agreement_merchant_status ON credit_agreements ("merchantId", "status")`);
    await q.query(`
      CREATE TABLE credit_schedule_rows (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "agreementId" uuid NOT NULL REFERENCES credit_agreements(id),
        "seq" integer NOT NULL,
        "dueDate" date NOT NULL,
        "amountTzs" integer NOT NULL,
        "paidTzs" integer NOT NULL DEFAULT 0,
        "status" varchar NOT NULL DEFAULT 'PENDING',
        CONSTRAINT uq_schedule_agreement_seq UNIQUE ("agreementId", "seq"),
        CONSTRAINT ck_schedule_amount_positive CHECK ("amountTzs" > 0),
        CONSTRAINT ck_schedule_paid_nonnegative CHECK ("paidTzs" >= 0),
        CONSTRAINT ck_schedule_status CHECK ("status" IN ('PENDING', 'PAID', 'PARTIAL', 'OVERDUE'))
      )`);
    await q.query(`CREATE INDEX ix_schedule_due ON credit_schedule_rows ("dueDate")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE credit_schedule_rows`);
    await q.query(`DROP TABLE credit_agreements`);
  }
}
