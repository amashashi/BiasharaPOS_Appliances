import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import 'reflect-metadata';
import { INestApplication, Module } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import request from 'supertest';
import { createDataSource } from '../db/data-source.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { Location } from '../db/entities/location.entity.js';
import { Product } from '../db/entities/product.entity.js';
import { AuditEvent } from '../db/entities/audit-event.entity.js';
import { SerializedUnit } from '../db/entities/serialized-unit.entity.js';
import { Grn } from '../db/entities/grn.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { InventoryModule } from './inventory.module.js';
import type { DataSource } from 'typeorm';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';

@Module({
  imports: [DbModule, PlatformModule, InventoryModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('GRN receiving (T1.2, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource; // direct handle for assertions
  let ownerToken: string;
  let cashierToken: string;
  let otherOwnerToken: string;
  let merchantId: string;
  let shopId: string;
  let warehouseId: string;
  let otherLocationId: string;
  let fridge: Product;
  let tv: Product;
  let otherMerchantProduct: Product;

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations already applied by test/global-setup.ts

    const merchants = ds.getRepository(Merchant);
    const locations = ds.getRepository(Location);
    const products = ds.getRepository(Product);

    const shopOwnerM = await merchants.save(
      merchants.create({ name: `GRN Spec ${Date.now()}`, tin: null, phone: null }),
    );
    merchantId = shopOwnerM.id;
    const otherM = await merchants.save(
      merchants.create({ name: `GRN Spec other ${Date.now()}`, tin: null, phone: null }),
    );

    shopId = (await locations.save(locations.create({ merchantId, name: 'Duka', kind: 'SHOP' }))).id;
    warehouseId = (
      await locations.save(locations.create({ merchantId, name: 'Ghala', kind: 'WAREHOUSE' }))
    ).id;
    otherLocationId = (
      await locations.save(locations.create({ merchantId: otherM.id, name: 'Duka', kind: 'SHOP' }))
    ).id;

    fridge = await products.save(
      products.create({
        merchantId, sku: null, brand: 'Samsung', model: 'RT38 Fridge',
        category: 'Refrigerator', taxCode: 'A', priceTzs: 1650000, costTzs: 1380000, active: true,
      }),
    );
    tv = await products.save(
      products.create({
        merchantId, sku: null, brand: 'Hisense', model: '50A6K TV',
        category: 'TV', taxCode: 'A', priceTzs: 980000, costTzs: null, active: true,
      }),
    );
    otherMerchantProduct = await products.save(
      products.create({
        merchantId: otherM.id, sku: null, brand: 'LG', model: 'Foreign',
        category: 'TV', taxCode: 'A', priceTzs: 100000, costTzs: null, active: true,
      }),
    );

    const mint = new StubIdentityService();
    ownerToken = mint.sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });
    cashierToken = mint.sign({ sub: 'u-cash', mid: merchantId, name: 'Juma', roles: ['CASHIER'] });
    otherOwnerToken = mint.sign({ sub: 'u-o2', mid: otherM.id, name: 'Neema', roles: ['OWNER'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${ownerToken}`);
  const serials = (prefix: string, n: number) =>
    Array.from({ length: n }, (_, i) => `${prefix}-${String(i + 1).padStart(3, '0')}`);

  it('receiving 10 units creates 10 SerializedUnit(IN_STOCK) with GRN provenance and costs', async () => {
    const res = await asOwner(request(http).post('/grns'))
      .send({
        locationId: shopId,
        supplierName: 'Kariakoo Wholesale Ltd',
        lines: [
          { productId: fridge.id, unitCostTzs: 1400000, serials: serials('FRG', 6) },
          { productId: tv.id, serials: serials('TV', 4) }, // no line cost, product cost is null
        ],
      })
      .expect(201);

    expect(res.body.lines).toHaveLength(2);
    expect(res.body.units).toHaveLength(10);
    expect(res.body.receivedByUserId).toBe('u-owner');

    const units = await ds.getRepository(SerializedUnit).findBy({ grnId: res.body.id });
    expect(units).toHaveLength(10);
    expect(units.every((u) => u.status === 'IN_STOCK')).toBe(true);
    expect(units.every((u) => u.locationId === shopId)).toBe(true);
    expect(units.every((u) => u.merchantId === merchantId)).toBe(true);
    const fridgeUnits = units.filter((u) => u.productId === fridge.id);
    expect(fridgeUnits).toHaveLength(6);
    expect(fridgeUnits.every((u) => u.costTzs === 1400000)).toBe(true); // line cost wins
    const tvUnits = units.filter((u) => u.productId === tv.id);
    expect(tvUnits.every((u) => u.costTzs === null)).toBe(true); // no cost anywhere

    const audit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'Grn', entityId: res.body.id, action: 'GRN_RECEIVED' });
    expect(audit).toHaveLength(1);
    expect(audit[0].actorUserId).toBe('u-owner');
  });

  it('line cost falls back to the product default cost when not given', async () => {
    const res = await asOwner(request(http).post('/grns'))
      .send({ locationId: warehouseId, lines: [{ productId: fridge.id, serials: ['FRG-FB-1'] }] })
      .expect(201);
    const [unit] = await ds.getRepository(SerializedUnit).findBy({ grnId: res.body.id });
    expect(unit.costTzs).toBe(1380000); // product.costTzs
  });

  it('duplicate serial already in stock is rejected with the serial named; nothing persists', async () => {
    const before = await ds.getRepository(Grn).countBy({ merchantId });
    const res = await asOwner(request(http).post('/grns'))
      .send({
        locationId: shopId,
        lines: [{ productId: tv.id, serials: ['TV-999', 'FRG-001'] }], // FRG-001 received above
      })
      .expect(400);
    const messages = res.body.errors.map((e: { message: string }) => e.message);
    expect(messages).toContain(
      'serial "FRG-001" already exists for this merchant (status IN_STOCK)',
    );
    expect(await ds.getRepository(Grn).countBy({ merchantId })).toBe(before);
    expect(await ds.getRepository(SerializedUnit).countBy({ merchantId, serial: 'TV-999' })).toBe(0);
  });

  it('duplicate serial inside one request is rejected and points at both positions', async () => {
    const res = await asOwner(request(http).post('/grns'))
      .send({
        locationId: shopId,
        lines: [
          { productId: fridge.id, serials: ['DUP-A'] },
          { productId: tv.id, serials: ['DUP-A'] },
        ],
      })
      .expect(400);
    expect(res.body.errors[0].field).toBe('lines[1].serials[0]');
    expect(res.body.errors[0].message).toContain('first at lines[0].serials[0]');
  });

  it('the same serial is fine for a different merchant', async () => {
    await request(http)
      .post('/grns')
      .set('Authorization', `Bearer ${otherOwnerToken}`)
      .send({
        locationId: otherLocationId,
        lines: [{ productId: otherMerchantProduct.id, serials: ['FRG-001'] }],
      })
      .expect(201);
  });

  it("rejects another merchant's location or product, archived products, and empty lines", async () => {
    const archived = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: null, brand: 'Old', model: 'Gone', category: 'TV',
        taxCode: 'A', priceTzs: 1000, costTzs: null, active: false,
      }),
    );
    const res = await asOwner(request(http).post('/grns'))
      .send({
        locationId: otherLocationId, // not ours
        lines: [
          { productId: otherMerchantProduct.id, serials: ['X-1'] }, // not ours
          { productId: archived.id, serials: ['X-2'] },
        ],
      })
      .expect(400);
    const messages = res.body.errors.map((e: { field: string; message: string }) => e.message);
    expect(messages).toContain('location does not belong to this merchant');
    expect(messages).toContain('product not found for this merchant');
    expect(messages).toContain('product is archived');

    await asOwner(request(http).post('/grns')).send({ locationId: shopId, lines: [] }).expect(400);
  });

  it('CASHIER cannot receive stock or read GRNs', async () => {
    await request(http)
      .post('/grns')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ locationId: shopId, lines: [{ productId: tv.id, serials: ['C-1'] }] })
      .expect(403);
    await request(http).get('/grns').set('Authorization', `Bearer ${cashierToken}`).expect(403);
  });

  it('GET /grns/:id shows provenance and is merchant-scoped; list returns newest first', async () => {
    const created = await asOwner(request(http).post('/grns'))
      .send({ locationId: shopId, lines: [{ productId: tv.id, serials: ['PROV-1'] }] })
      .expect(201);
    const res = await asOwner(request(http).get(`/grns/${created.body.id}`)).expect(200);
    expect(res.body.units.map((u: { serial: string }) => u.serial)).toEqual(['PROV-1']);
    expect(res.body.lines[0].qty).toBe(1);

    await request(http)
      .get(`/grns/${created.body.id}`)
      .set('Authorization', `Bearer ${otherOwnerToken}`)
      .expect(404);

    const list = await asOwner(request(http).get('/grns')).expect(200);
    expect(list.body.total).toBe(3); // the two receipts above + this one; rejected requests created nothing
    expect(list.body.items[0].id).toBe(created.body.id);
  });
});
