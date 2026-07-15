import type { MigrationInterface, QueryRunner } from 'typeorm';

export class BaseEntities1784120000000 implements MigrationInterface {
  name = 'BaseEntities1784120000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);
    await q.query(`
      CREATE TABLE merchants (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar NOT NULL,
        "tin" varchar,
        "phone" varchar,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )`);
    await q.query(`
      CREATE TABLE locations (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "name" varchar NOT NULL,
        "kind" varchar NOT NULL DEFAULT 'SHOP',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_location_merchant_name UNIQUE ("merchantId", "name")
      )`);
    await q.query(`
      CREATE TABLE user_refs (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "merchantId" uuid NOT NULL REFERENCES merchants(id),
        "platformUserId" varchar NOT NULL,
        "displayName" varchar NOT NULL,
        "role" varchar NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_userref_merchant_platform UNIQUE ("merchantId", "platformUserId")
      )`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DROP TABLE user_refs`);
    await q.query(`DROP TABLE locations`);
    await q.query(`DROP TABLE merchants`);
  }
}
