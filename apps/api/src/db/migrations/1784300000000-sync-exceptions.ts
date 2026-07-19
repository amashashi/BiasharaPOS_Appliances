import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * T5.6: conflicts found while replaying an offline sale. SERIAL_CONFLICT — a
 * serial the offline sale claimed is no longer available (sold online in the
 * meantime). STALE_PRICE — the price the cashier charged offline no longer
 * matches the catalog. The order + cash still land (the sale happened); the
 * exception flags it for an OWNER to resolve (reassign a serial / accept the
 * price), never silently overwriting authoritative state.
 */
export class SyncExceptions1784300000000 implements MigrationInterface {
  name = 'SyncExceptions1784300000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE sync_exceptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL,
        "orderId" uuid NOT NULL,
        "clientRef" uuid NOT NULL,
        kind varchar NOT NULL,
        detail jsonb NOT NULL,
        status varchar NOT NULL DEFAULT 'OPEN',
        "resolutionNote" varchar,
        "resolvedByUserId" varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "resolvedAt" timestamptz
      )
    `);
    await q.query(`CREATE INDEX "IX_sync_exceptions_merchant_open" ON sync_exceptions ("merchantId") WHERE status = 'OPEN'`);
    // one open exception per logical conflict — keyed by serial (SERIAL_CONFLICT)
    // or line (STALE_PRICE, which has no serial). Detection runs on every replay,
    // so this stops a re-detected conflict from piling up duplicate rows.
    await q.query(
      `CREATE UNIQUE INDEX "UQ_sync_exceptions_open" ON sync_exceptions ("orderId", kind, (COALESCE(detail->>'serial', detail->>'lineId'))) WHERE status = 'OPEN'`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX "UQ_sync_exceptions_open"`);
    await q.query(`DROP INDEX "IX_sync_exceptions_merchant_open"`);
    await q.query(`DROP TABLE sync_exceptions`);
  }
}
