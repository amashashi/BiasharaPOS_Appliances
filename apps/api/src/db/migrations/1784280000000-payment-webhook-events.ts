import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * T5.3a: inbound payment webhooks that did NOT cleanly apply — the reconciliation
 * queue. Two kinds (see `reason`): UNMATCHED (no intent for the ref — money we
 * can't attribute; `merchantId` null) and UNAPPLIED_BALANCE (a confirmed intent
 * whose amount no longer fit the order balance, D-027). Recording these — rather
 * than 404'ing — stops a real aggregator's retries from looping and keeps every
 * cent visible for a human to resolve.
 */
export class PaymentWebhookEvents1784280000000 implements MigrationInterface {
  name = 'PaymentWebhookEvents1784280000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE payment_webhook_events (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid,
        "matchedIntentId" uuid,
        "intentRef" varchar NOT NULL,
        provider varchar,
        "providerRef" varchar,
        "amountTzs" integer,
        status varchar NOT NULL,
        reason varchar NOT NULL,
        "rawPayload" jsonb NOT NULL,
        "receivedAt" timestamptz NOT NULL DEFAULT now(),
        "resolvedAt" timestamptz,
        "resolvedByUserId" varchar,
        "resolutionNote" varchar
      )
    `);
    // one open reconciliation row per intent — a real rail retries webhooks, and
    // a partial unique index (WHERE resolvedAt IS NULL) makes the UNAPPLIED insert
    // idempotent while still allowing a fresh row after a human resolves.
    await q.query(
      `CREATE UNIQUE INDEX "UQ_pwe_open_intent" ON payment_webhook_events ("matchedIntentId") WHERE "resolvedAt" IS NULL AND "matchedIntentId" IS NOT NULL`,
    );
    await q.query(
      `CREATE INDEX "IX_pwe_merchant_open" ON payment_webhook_events ("merchantId") WHERE "resolvedAt" IS NULL`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP INDEX "IX_pwe_merchant_open"`);
    await q.query(`DROP INDEX "UQ_pwe_open_intent"`);
    await q.query(`DROP TABLE payment_webhook_events`);
  }
}
