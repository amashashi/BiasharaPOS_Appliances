import type { MigrationInterface, QueryRunner } from 'typeorm';

export class DeliveryProof1784260000000 implements MigrationInterface {
  name = 'DeliveryProof1784260000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE deliveries ADD COLUMN "proofPhotoUrl" varchar`);
    await q.query(`ALTER TABLE deliveries ADD COLUMN "proofSignedByName" varchar`);
    await q.query(`ALTER TABLE deliveries ADD COLUMN "proofOtpConfirmed" boolean NOT NULL DEFAULT false`);
    await q.query(`ALTER TABLE deliveries ADD COLUMN "confirmedSerialIds" jsonb`);
    await q.query(`ALTER TABLE deliveries ADD COLUMN "failureReason" varchar`);
    await q.query(`ALTER TABLE deliveries ADD COLUMN "deliveredAt" timestamptz`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE deliveries DROP COLUMN "deliveredAt"`);
    await q.query(`ALTER TABLE deliveries DROP COLUMN "failureReason"`);
    await q.query(`ALTER TABLE deliveries DROP COLUMN "confirmedSerialIds"`);
    await q.query(`ALTER TABLE deliveries DROP COLUMN "proofOtpConfirmed"`);
    await q.query(`ALTER TABLE deliveries DROP COLUMN "proofSignedByName"`);
    await q.query(`ALTER TABLE deliveries DROP COLUMN "proofPhotoUrl"`);
  }
}
