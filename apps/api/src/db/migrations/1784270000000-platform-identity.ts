import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * T5.1: link each merchant to the platform business that owns it. Identity is
 * now verified against the real BiasharaPOS platform; its `businessId` claim
 * resolves to our merchant through this column. Null = not yet onboarded
 * (full handshake arrives in T6.2). UNIQUE: one merchant per platform business.
 */
export class PlatformIdentity1784270000000 implements MigrationInterface {
  name = 'PlatformIdentity1784270000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE merchants ADD COLUMN "platformBusinessId" uuid`);
    await q.query(
      `ALTER TABLE merchants ADD CONSTRAINT "UQ_merchants_platformBusinessId" UNIQUE ("platformBusinessId")`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE merchants DROP CONSTRAINT "UQ_merchants_platformBusinessId"`);
    await q.query(`ALTER TABLE merchants DROP COLUMN "platformBusinessId"`);
  }
}
