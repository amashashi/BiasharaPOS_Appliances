import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Payments1784200000000 implements MigrationInterface {
  name = 'Payments1784200000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE payments (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "orderId" uuid NOT NULL REFERENCES sales_orders(id),
        "method" varchar NOT NULL,
        "amountTzs" integer NOT NULL,
        "reversesPaymentId" uuid REFERENCES payments(id),
        "note" varchar,
        "recordedByUserId" varchar NOT NULL,
        "at" timestamptz NOT NULL DEFAULT now(),
        "seq" bigserial,
        CONSTRAINT ck_payment_method CHECK ("method" IN ('CASH', 'MOBILE_MONEY', 'CARD', 'BANK')),
        CONSTRAINT ck_payment_amount_nonzero CHECK ("amountTzs" <> 0),
        CONSTRAINT uq_payment_reversal UNIQUE ("reversesPaymentId")
      )`);
    await q.query(`CREATE INDEX ix_payment_order ON payments ("orderId")`);
    // The money ledger is append-only in the DATABASE (hard rule): corrections
    // are reversing entries; fiscal receipts live in their own table (T2.4)
    // precisely so payment rows never need an UPDATE.
    await q.query(`
      CREATE OR REPLACE FUNCTION payments_immutable() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'payments is append-only — corrections are reversing entries';
      END;
      $$ LANGUAGE plpgsql`);
    await q.query(`
      CREATE TRIGGER trg_payments_immutable
      BEFORE UPDATE OR DELETE ON payments
      FOR EACH ROW EXECUTE FUNCTION payments_immutable()`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TRIGGER trg_payments_immutable ON payments`);
    await q.query(`DROP FUNCTION payments_immutable`);
    await q.query(`DROP TABLE payments`);
  }
}
