import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import 'reflect-metadata';
import type { DataSource } from 'typeorm';
import type { UnitStatus } from '@biashara/shared';
import { NotFoundException } from '@nestjs/common';
import { createDataSource } from '../db/data-source.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { Location } from '../db/entities/location.entity.js';
import { Product } from '../db/entities/product.entity.js';
import { Grn } from '../db/entities/grn.entity.js';
import { SerializedUnit } from '../db/entities/serialized-unit.entity.js';
import { AuditEvent } from '../db/entities/audit-event.entity.js';
import { AuditService } from '../db/audit.service.js';
import { UnitStateService } from './unit-state.service.js';
import { IllegalUnitTransition } from './unit-state.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';

const STATES: UnitStatus[] = ['IN_STOCK', 'RESERVED', 'SOLD', 'DELIVERED', 'RETURNED'];
const LEGAL: Array<[UnitStatus, UnitStatus]> = [
  ['IN_STOCK', 'RESERVED'],
  ['RESERVED', 'SOLD'],
  ['RESERVED', 'IN_STOCK'],
  ['SOLD', 'DELIVERED'],
  ['DELIVERED', 'RETURNED'],
];
const isLegal = (f: UnitStatus, t: UnitStatus): boolean =>
  LEGAL.some(([lf, lt]) => lf === f && lt === t);

describe('UnitStateService (T1.3, real Postgres)', () => {
  let ds: DataSource;
  let svc: UnitStateService;
  let merchantId: string;
  let unitId: string;

  const auditCount = (): Promise<number> =>
    ds.getRepository(AuditEvent).countBy({ entityId: unitId });
  /** Test-fixture backdoor: raw UPDATE bypasses the machine AND the audit subscriber. */
  const forceStatus = (status: UnitStatus): Promise<unknown> =>
    ds.query(`UPDATE serialized_units SET status = $1 WHERE id = $2`, [status, unitId]);
  const currentStatus = async (): Promise<UnitStatus> =>
    (await ds.getRepository(SerializedUnit).findOneByOrFail({ id: unitId })).status;

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts
    svc = new UnitStateService(ds, new AuditService(ds));

    const merchant = await ds
      .getRepository(Merchant)
      .save(ds.getRepository(Merchant).create({ name: `Unit SM ${Date.now()}`, tin: null, phone: null }));
    merchantId = merchant.id;
    const location = await ds
      .getRepository(Location)
      .save(ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }));
    const product = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: null, brand: 'LG', model: 'SM TV', category: 'TV',
        taxCode: 'A', priceTzs: 500000, costTzs: null, active: true,
      }),
    );
    const grn = await ds.getRepository(Grn).save(
      ds.getRepository(Grn).create({
        merchantId, locationId: location.id, supplierName: null, note: null, receivedByUserId: 'u-owner',
      }),
    );
    const unit = await ds.getRepository(SerializedUnit).save(
      ds.getRepository(SerializedUnit).create({
        merchantId, productId: product.id, serial: `SM-${Date.now()}`,
        status: 'IN_STOCK', locationId: location.id, grnId: grn.id, costTzs: null,
      }),
    );
    unitId = unit.id;
  });

  afterAll(async () => {
    await ds.destroy();
  });

  it('walks the full legal lifecycle, persisting status + one actor-attributed audit event per step', async () => {
    const chain: Array<[UnitStatus, UnitStatus]> = [
      ['IN_STOCK', 'RESERVED'],
      ['RESERVED', 'IN_STOCK'], // release…
      ['IN_STOCK', 'RESERVED'], // …and re-reserve
      ['RESERVED', 'SOLD'],
      ['SOLD', 'DELIVERED'],
      ['DELIVERED', 'RETURNED'],
    ];
    for (const [from, to] of chain) {
      const updated = await svc.transition(merchantId, unitId, to, 'u-actor', { orderId: 'ord-1' });
      expect(updated.status).toBe(to);
      const events = await ds
        .getRepository(AuditEvent)
        .findBy({ entityId: unitId, action: `UNIT_${to}` });
      const event = events.at(-1)!;
      expect(event.actorUserId).toBe('u-actor');
      expect(event.before).toMatchObject({ status: from });
      expect(event.after).toMatchObject({ status: to, orderId: 'ord-1' });
    }
    expect(await currentStatus()).toBe('RETURNED');
  });

  it('rejects every illegal transition from every state — throws, status untouched, ZERO audit rows', async () => {
    for (const from of STATES) {
      for (const to of STATES.filter((t) => !isLegal(from, t))) {
        await forceStatus(from);
        const before = await auditCount();
        await expect(svc.transition(merchantId, unitId, to, 'u-actor')).rejects.toThrow(
          IllegalUnitTransition,
        );
        expect(await currentStatus()).toBe(from);
        expect(await auditCount()).toBe(before); // nothing logged
      }
    }
  });

  it('unknown unit and cross-merchant access both 404', async () => {
    await expect(
      svc.transition(merchantId, '00000000-0000-4000-8000-000000000000', 'RESERVED', 'u'),
    ).rejects.toThrow(NotFoundException);
    const stranger = await ds
      .getRepository(Merchant)
      .save(ds.getRepository(Merchant).create({ name: `SM other ${Date.now()}`, tin: null, phone: null }));
    await forceStatus('IN_STOCK');
    await expect(svc.transition(stranger.id, unitId, 'RESERVED', 'u')).rejects.toThrow(
      NotFoundException,
    );
    expect(await currentStatus()).toBe('IN_STOCK');
  });
});
