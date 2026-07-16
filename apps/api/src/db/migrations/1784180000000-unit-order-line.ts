import type { MigrationInterface, QueryRunner } from 'typeorm';

export class UnitOrderLine1784180000000 implements MigrationInterface {
  name = 'UnitOrderLine1784180000000';

  public async up(q: QueryRunner): Promise<void> {
    await q.query(
      `ALTER TABLE serialized_units
         ADD COLUMN "orderLineId" uuid REFERENCES sales_order_lines(id)`,
    );
    await q.query(
      `CREATE INDEX ix_unit_order_line ON serialized_units ("orderLineId")
        WHERE "orderLineId" IS NOT NULL`,
    );
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`ALTER TABLE serialized_units DROP COLUMN "orderLineId"`);
  }
}
