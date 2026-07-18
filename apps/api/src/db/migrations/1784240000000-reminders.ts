import type { MigrationInterface, QueryRunner } from 'typeorm';

export class Reminders1784240000000 implements MigrationInterface {
  name = 'Reminders1784240000000';

  public async up(q: QueryRunner): Promise<void> {
    // Per-merchant reminder policy: day offsets relative to a row's due date.
    // Default = the plan's example policy: T-2 days, due day, +3 days overdue.
    await q.query(
      `ALTER TABLE merchants ADD COLUMN "reminderOffsetsDays" jsonb NOT NULL DEFAULT '[-2,0,3]'`,
    );
    await q.query(`
      CREATE TABLE reminder_logs (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "agreementId" uuid NOT NULL REFERENCES credit_agreements(id),
        "scheduleRowId" uuid NOT NULL REFERENCES credit_schedule_rows(id),
        "offsetDays" integer NOT NULL,
        "dueDate" date NOT NULL,
        "msisdn" varchar NOT NULL,
        "templateKey" varchar NOT NULL,
        "amountTzs" integer NOT NULL,
        "status" varchar NOT NULL DEFAULT 'PENDING',
        "error" varchar,
        "sentAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT ck_reminder_status CHECK ("status" IN ('PENDING', 'SENT', 'FAILED')),
        CONSTRAINT uq_reminder_row_offset UNIQUE ("scheduleRowId", "offsetDays")
      )`);
    await q.query(`CREATE INDEX ix_reminder_agreement ON reminder_logs ("agreementId")`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE reminder_logs`);
    await q.query(`ALTER TABLE merchants DROP COLUMN "reminderOffsetsDays"`);
  }
}
