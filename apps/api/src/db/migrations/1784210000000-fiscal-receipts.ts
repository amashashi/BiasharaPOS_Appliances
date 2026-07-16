import type { MigrationInterface, QueryRunner } from 'typeorm';

export class FiscalReceipts1784210000000 implements MigrationInterface {
  name = 'FiscalReceipts1784210000000';

  public async up(q: QueryRunner): Promise<void> {
    // Own table by design (D-025): the payments ledger is append-only, so the
    // VFD result references the payment — never the other way around.
    await q.query(`
      CREATE TABLE fiscal_receipts (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "paymentId" uuid NOT NULL REFERENCES payments(id),
        "vfdNumber" varchar NOT NULL,
        "verificationCode" varchar NOT NULL,
        "qrUrl" varchar NOT NULL,
        "issuedAt" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_fiscal_payment UNIQUE ("paymentId")
      )`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE fiscal_receipts`);
  }
}
