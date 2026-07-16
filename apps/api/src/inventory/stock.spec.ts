import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import 'reflect-metadata';
import { INestApplication, Module } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { createDataSource } from '../db/data-source.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { Location } from '../db/entities/location.entity.js';
import { Product } from '../db/entities/product.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { InventoryModule } from './inventory.module.js';
import { UnitStateService } from './unit-state.service.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';

@Module({
  imports: [DbModule, PlatformModule, InventoryModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('Stock views + serial lookup (T1.4, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let ownerToken: string;
  let cashierToken: string;
  let otherOwnerToken: string;
  let merchantId: string;
  let dukaId: string;
  let ghalaId: string;
  let fridge: Product;
  let tv: Product;
  let grn1Id: string;

  const serials = (prefix: string, n: number) =>
    Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(3, '0')}`);

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds
      .getRepository(Merchant)
      .save(ds.getRepository(Merchant).create({ name: `Stock Spec ${Date.now()}`, tin: null, phone: null }));
    merchantId = merchant.id;
    const other = await ds
      .getRepository(Merchant)
      .save(ds.getRepository(Merchant).create({ name: `Stock other ${Date.now()}`, tin: null, phone: null }));
    dukaId = (
      await ds.getRepository(Location).save(
        ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }),
      )
    ).id;
    ghalaId = (
      await ds.getRepository(Location).save(
        ds.getRepository(Location).create({ merchantId, name: 'Ghala', kind: 'WAREHOUSE' }),
      )
    ).id;
    fridge = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: 'FRG-RT38', brand: 'Samsung', model: 'RT38 Fridge',
        category: 'Refrigerator', taxCode: 'A', priceTzs: 1650000, costTzs: 1380000, active: true,
      }),
    );
    tv = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: 'TV-50A6K', brand: 'Hisense', model: '50A6K TV',
        category: 'TV', taxCode: 'A', priceTzs: 980000, costTzs: null, active: true,
      }),
    );

    const mint = new StubIdentityService();
    ownerToken = mint.sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });
    cashierToken = mint.sign({ sub: 'u-cash', mid: merchantId, name: 'Juma', roles: ['CASHIER'] });
    otherOwnerToken = mint.sign({ sub: 'u-o2', mid: other.id, name: 'Neema', roles: ['OWNER'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();

    // receive: 6 fridges at Duka, 4 TVs at Ghala — through the real endpoint
    const g1 = await request(http)
      .post('/grns')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        locationId: dukaId,
        supplierName: 'Kariakoo Wholesale',
        lines: [{ productId: fridge.id, unitCostTzs: 1400000, serials: serials('FRG', 6) }],
      })
      .expect(201);
    grn1Id = g1.body.id;
    await request(http)
      .post('/grns')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ locationId: ghalaId, lines: [{ productId: tv.id, serials: serials('TV', 4) }] })
      .expect(201);

    // transitions through the state machine (T1.3)
    const units = app.get(UnitStateService);
    const unitId = async (serial: string): Promise<string> =>
      (await ds.query(`SELECT id FROM serialized_units WHERE "merchantId"=$1 AND serial=$2`, [merchantId, serial]))[0].id;
    await units.transition(merchantId, await unitId('FRG-001'), 'RESERVED', 'u-actor'); // reserved
    const sold = await unitId('FRG-002');
    await units.transition(merchantId, sold, 'RESERVED', 'u-actor', { orderId: 'ord-42' });
    await units.transition(merchantId, sold, 'SOLD', 'u-actor', { orderId: 'ord-42' });
    const gone = await unitId('TV-001'); // delivered → out of stock view
    for (const to of ['RESERVED', 'SOLD', 'DELIVERED'] as const) {
      await units.transition(merchantId, gone, to, 'u-actor');
    }
    const back = await unitId('TV-002'); // full circle → RETURNED
    for (const to of ['RESERVED', 'SOLD', 'DELIVERED', 'RETURNED'] as const) {
      await units.transition(merchantId, back, to, 'u-actor');
    }
    await units.transition(merchantId, await unitId('TV-003'), 'RESERVED', 'u-actor');
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${ownerToken}`);

  it('stock counts by product × location match the seeded fixture exactly', async () => {
    const res = await asOwner(request(http).get('/stock')).expect(200);
    expect(res.body.items).toEqual([
      {
        productId: tv.id, brand: 'Hisense', model: '50A6K TV', sku: 'TV-50A6K',
        locationId: ghalaId, locationName: 'Ghala', isSerialized: true,
        inStock: 1, reserved: 1, sold: 0, returned: 1, // TV-001 DELIVERED is gone from view
      },
      {
        productId: fridge.id, brand: 'Samsung', model: 'RT38 Fridge', sku: 'FRG-RT38',
        locationId: dukaId, locationName: 'Duka', isSerialized: true,
        inStock: 4, reserved: 1, sold: 1, returned: 0,
      },
    ]);
  });

  it('filters by productId, locationId, and q', async () => {
    const byProduct = await asOwner(
      request(http).get(`/stock?productId=${fridge.id}`),
    ).expect(200);
    expect(byProduct.body.items).toHaveLength(1);
    expect(byProduct.body.items[0].model).toBe('RT38 Fridge');

    const byLocation = await asOwner(request(http).get(`/stock?locationId=${ghalaId}`)).expect(200);
    expect(byLocation.body.items).toHaveLength(1);
    expect(byLocation.body.items[0].locationName).toBe('Ghala');

    const byQ = await asOwner(request(http).get('/stock?q=50A6K')).expect(200);
    expect(byQ.body.items).toHaveLength(1);
    expect(byQ.body.items[0].brand).toBe('Hisense');
  });

  it('cashiers can read stock', async () => {
    await request(http).get('/stock').set('Authorization', `Bearer ${cashierToken}`).expect(200);
  });

  it('lookup of a received serial shows GRN provenance and the full actor-attributed history', async () => {
    const res = await asOwner(request(http).get('/units/lookup?serial=FRG-002')).expect(200);

    expect(res.body.unit).toMatchObject({
      serial: 'FRG-002',
      status: 'SOLD',
      costTzs: 1400000,
      product: { brand: 'Samsung', model: 'RT38 Fridge', sku: 'FRG-RT38' },
      location: { name: 'Duka' },
    });
    // GRN provenance (the verify clause)
    expect(res.body.grn).toMatchObject({
      id: grn1Id,
      supplierName: 'Kariakoo Wholesale',
      receivedByUserId: 'u-owner',
      location: { name: 'Duka' },
    });
    // full history: received → reserved → sold, in order, with actors and context
    expect(res.body.history.map((h: { action: string }) => h.action)).toEqual([
      'RECEIVED', 'UNIT_RESERVED', 'UNIT_SOLD',
    ]);
    expect(res.body.history[1].actorUserId).toBe('u-actor');
    expect(res.body.history[1].after).toMatchObject({ status: 'RESERVED', orderId: 'ord-42' });
    expect(res.body.history[2].before).toMatchObject({ status: 'RESERVED' });
  });

  it('a RETURNED unit shows its whole life in order', async () => {
    const res = await asOwner(request(http).get('/units/lookup?serial=TV-002')).expect(200);
    expect(res.body.unit.status).toBe('RETURNED');
    expect(res.body.history.map((h: { action: string }) => h.action)).toEqual([
      'RECEIVED', 'UNIT_RESERVED', 'UNIT_SOLD', 'UNIT_DELIVERED', 'UNIT_RETURNED',
    ]);
  });

  it('lookup is merchant-scoped and validates input', async () => {
    await request(http)
      .get('/units/lookup?serial=FRG-002')
      .set('Authorization', `Bearer ${otherOwnerToken}`)
      .expect(404);
    await asOwner(request(http).get('/units/lookup?serial=NOPE-1')).expect(404);
    await asOwner(request(http).get('/units/lookup')).expect(400);
  });
});
