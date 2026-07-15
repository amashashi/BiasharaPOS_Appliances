import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DataSource } from 'typeorm';
import { createDataSource } from './data-source.js';
import { Merchant } from './entities/merchant.entity.js';
import { AuditEvent } from './entities/audit-event.entity.js';

const DB_URL =
  process.env.DATABASE_URL ?? 'postgres://biashara:biashara@localhost:5432/biashara_appliances';

describe('audit log (T0.5, real Postgres)', () => {
  let ds: DataSource;

  beforeAll(async () => {
    ds = createDataSource(DB_URL);
    await ds.initialize();
    await ds.runMigrations();
  });

  afterAll(async () => {
    await ds.destroy();
  });

  it('creating any entity writes an audit row automatically', async () => {
    const merchants = ds.getRepository(Merchant);
    const m = await merchants.save(
      merchants.create({ name: `Audit Test ${Date.now()}`, tin: null, phone: null }),
    );
    const rows = await ds
      .getRepository(AuditEvent)
      .find({ where: { entityType: 'Merchant', entityId: m.id } });
    expect(rows.some((r) => r.action === 'INSERT')).toBe(true);
  });

  it('updating an entity records before and after', async () => {
    const merchants = ds.getRepository(Merchant);
    const m = await merchants.save(
      merchants.create({ name: `Audit Update ${Date.now()}`, tin: null, phone: null }),
    );
    m.phone = '+255700000099';
    await merchants.save(m);
    const rows = await ds
      .getRepository(AuditEvent)
      .find({ where: { entityType: 'Merchant', entityId: m.id, action: 'UPDATE' } });
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].before).toBeTruthy();
    expect((rows[0].after as { phone?: string }).phone).toBe('+255700000099');
  });

  it('audit rows are immutable: UPDATE and DELETE are rejected by the database', async () => {
    const [row] = await ds.getRepository(AuditEvent).find({ take: 1 });
    expect(row).toBeTruthy();
    await expect(
      ds.query(`UPDATE audit_events SET "action" = 'TAMPERED' WHERE id = $1`, [row.id]),
    ).rejects.toThrow(/append-only/);
    await expect(ds.query(`DELETE FROM audit_events WHERE id = $1`, [row.id])).rejects.toThrow(
      /append-only/,
    );
  });
});
