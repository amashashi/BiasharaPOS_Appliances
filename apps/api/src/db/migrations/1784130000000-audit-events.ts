import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AuditEvents1784130000000 implements MigrationInterface {
  name = 'AuditEvents1784130000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      CREATE TABLE audit_events (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid,
        "actorUserId" varchar,
        "entityType" varchar NOT NULL,
        "entityId" varchar,
        "action" varchar NOT NULL,
        "before" jsonb,
        "after" jsonb,
        "at" timestamptz NOT NULL DEFAULT now()
      )`);
    await q.query(`CREATE INDEX idx_audit_entity ON audit_events ("entityType", "entityId")`);
    // Append-only enforced in the database itself — no role or ORM path can
    // mutate or erase history (D-015 lineage: this is the collateral registry).
    await q.query(`
      CREATE OR REPLACE FUNCTION audit_events_immutable() RETURNS trigger AS $$
      BEGIN
        RAISE EXCEPTION 'audit_events is append-only';
      END;
      $$ LANGUAGE plpgsql`);
    await q.query(`
      CREATE TRIGGER trg_audit_events_immutable
      BEFORE UPDATE OR DELETE ON audit_events
      FOR EACH ROW EXECUTE FUNCTION audit_events_immutable()`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TRIGGER trg_audit_events_immutable ON audit_events`);
    await q.query(`DROP FUNCTION audit_events_immutable`);
    await q.query(`DROP TABLE audit_events`);
  }
}
