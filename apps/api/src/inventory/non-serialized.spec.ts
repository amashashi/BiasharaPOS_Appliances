import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import 'reflect-metadata';
import { INestApplication, Module } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { createDataSource } from '../db/data-source.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { Location } from '../db/entities/location.entity.js';
import { StockLevel } from '../db/entities/stock-level.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { InventoryModule } from './inventory.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';

@Module({
  imports: [DbModule, PlatformModule, CatalogModule, InventoryModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('Non-serialized items (T1.5, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let ownerToken: string;
  let merchantId: string;
  let dukaId: string;
  let fridgeId: string; // serialized
  let cableId: string; // non-serialized

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds
      .getRepository(Merchant)
      .save(ds.getRepository(Merchant).create({ name: `NS Spec ${Date.now()}`, tin: null, phone: null }));
    merchantId = merchant.id;
    dukaId = (
      await ds.getRepository(Location).save(
        ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }),
      )
    ).id;

    ownerToken = new StubIdentityService().sign({
      sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'],
    });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${ownerToken}`);

  it('creates serialized and non-serialized products (default = serialized)', async () => {
    const fridge = await asOwner(request(http).post('/catalog/products'))
      .send({ brand: 'Samsung', model: 'RT38', category: 'Refrigerator', priceTzs: 1650000 })
      .expect(201);
    expect(fridge.body.isSerialized).toBe(true); // defaulted
    fridgeId = fridge.body.id;

    const cable = await asOwner(request(http).post('/catalog/products'))
      .send({
        brand: 'Generic', model: 'HDMI 2m', category: 'Accessory',
        priceTzs: 15000, isSerialized: false,
      })
      .expect(201);
    expect(cable.body.isSerialized).toBe(false);
    cableId = cable.body.id;
  });

  it('CSV import accepts the isSerialized column (blank → serialized) and rejects garbage', async () => {
    const csv = [
      'brand,model,category,priceTzs,isSerialized',
      'Sony,Soundbar S100,Audio,480000,', // line 2: blank → true
      'Generic,RCA Cable,Accessory,8000,no', // line 3: no → false
      'Generic,Batteries AA,Accessory,3000,maybe', // line 4: invalid
    ].join('\n');
    const res = await asOwner(request(http).post('/catalog/products/import'))
      .send({ csv })
      .expect(200);
    expect(res.body.imported).toBe(2);
    expect(res.body.errors).toEqual([
      { line: 4, errors: [{ field: 'isSerialized', message: expect.stringContaining('true/false') }] },
    ]);
    const list = await asOwner(request(http).get('/catalog/products?q=RCA')).expect(200);
    expect(list.body.items[0].isSerialized).toBe(false);
  });

  it('mixed GRN receives correctly: units for serialized line, stock level for qty line', async () => {
    const res = await asOwner(request(http).post('/grns'))
      .send({
        locationId: dukaId,
        lines: [
          { productId: fridgeId, unitCostTzs: 1400000, serials: ['NS-FRG-1', 'NS-FRG-2', 'NS-FRG-3'] },
          { productId: cableId, qty: 10, unitCostTzs: 9000 },
        ],
      })
      .expect(201);
    expect(res.body.lines).toHaveLength(2);
    expect(res.body.units).toHaveLength(3); // only the serialized line makes units
    const cableLine = res.body.lines.find((l: { productId: string }) => l.productId === cableId);
    expect(cableLine.qty).toBe(10);

    const level = await ds.getRepository(StockLevel).findOneByOrFail({
      merchantId, productId: cableId, locationId: dukaId,
    });
    expect(level.qty).toBe(10);
  });

  it('a second receipt accumulates the stock level', async () => {
    await asOwner(request(http).post('/grns'))
      .send({ locationId: dukaId, lines: [{ productId: cableId, qty: 15 }] })
      .expect(201);
    const level = await ds.getRepository(StockLevel).findOneByOrFail({
      merchantId, productId: cableId, locationId: dukaId,
    });
    expect(level.qty).toBe(25);
  });

  it('line shape must match the product type — both mismatches rejected with clear errors', async () => {
    const res = await asOwner(request(http).post('/grns'))
      .send({
        locationId: dukaId,
        lines: [
          { productId: fridgeId, qty: 5 }, // serialized product with qty, no serials
          { productId: cableId, serials: ['CAB-1'] }, // non-serialized with serials, no qty
        ],
      })
      .expect(400);
    const byField = Object.fromEntries(
      res.body.errors.map((e: { field: string; message: string }) => [e.field, e.message]),
    );
    expect(byField['lines[0].serials']).toContain('serialized product requires serials');
    expect(byField['lines[0].qty']).toContain('not allowed for serialized lines');
    expect(byField['lines[1].qty']).toContain('required for non-serialized');
    expect(byField['lines[1].serials']).toContain('not allowed for non-serialized');
    // atomicity: the bad request must not have bumped the level
    const level = await ds.getRepository(StockLevel).findOneByOrFail({
      merchantId, productId: cableId, locationId: dukaId,
    });
    expect(level.qty).toBe(25);
  });

  it('stock view shows both models side by side', async () => {
    const res = await asOwner(request(http).get('/stock')).expect(200);
    expect(res.body.items).toEqual([
      {
        productId: cableId, brand: 'Generic', model: 'HDMI 2m', sku: null,
        locationId: dukaId, locationName: 'Duka', isSerialized: false,
        inStock: 25, reserved: 0, sold: 0, returned: 0,
      },
      {
        productId: fridgeId, brand: 'Samsung', model: 'RT38', sku: null,
        locationId: dukaId, locationName: 'Duka', isSerialized: true,
        inStock: 3, reserved: 0, sold: 0, returned: 0,
      },
    ]);
  });

  it('isSerialized cannot change once the product has stock history', async () => {
    const res = await asOwner(request(http).patch(`/catalog/products/${cableId}`))
      .send({ isSerialized: true })
      .expect(400);
    expect(res.body.errors[0].message).toContain('cannot change isSerialized');
    // but a stock-less product can still flip
    const fresh = await asOwner(request(http).post('/catalog/products'))
      .send({ brand: 'Generic', model: 'Flippable', category: 'Accessory', priceTzs: 1000 })
      .expect(201);
    await asOwner(request(http).patch(`/catalog/products/${fresh.body.id}`))
      .send({ isSerialized: false })
      .expect(200);
  });
});
