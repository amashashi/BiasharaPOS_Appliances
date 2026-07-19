import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * T5.7: when the money was actually collected, as distinct from when the row was
 * written (`at`). For an online sale they coincide; for an offline sale replayed
 * on reconnect, `occurredAt` is the offline sale time — so the fiscal aging alert
 * measures a sale's distance from the TRA submission window from when it happened,
 * not from when it synced. Nullable + backfilled via COALESCE(occurredAt, at) in
 * the reader, because the payments ledger is append-only (no UPDATE of old rows).
 */
export class PaymentOccurredAt1784310000000 implements MigrationInterface {
  name = 'PaymentOccurredAt1784310000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE payments ADD COLUMN "occurredAt" timestamptz`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE payments DROP COLUMN "occurredAt"`);
  }
}
