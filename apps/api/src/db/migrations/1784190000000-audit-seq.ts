import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Monotonic insertion order for the audit log. `at` (now()) is
 * transaction-stable in Postgres, so two events written in one transaction
 * (e.g. a pick: RESERVED then SOLD) share a timestamp and uuid ids don't
 * order — history must sort by `seq`.
 */
export class AuditSeq1784190000000 implements MigrationInterface {
  name = 'AuditSeq1784190000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE audit_events ADD COLUMN "seq" bigserial`);
    await q.query(`CREATE INDEX ix_audit_seq ON audit_events ("seq")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE audit_events DROP COLUMN "seq"`);
  }
}
