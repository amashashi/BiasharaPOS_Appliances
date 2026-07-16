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
import { SerializedUnit } from '../db/entities/serialized-unit.entity.js';
import { StockLevel } from '../db/entities/stock-level.entity.js';
import { AuditEvent } from '../db/entities/audit-event.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { OrdersModule } from './orders.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';

@Module({
  imports: [DbModule, PlatformModule, OrdersModule], // OrdersModule pulls InventoryModule (/grns, /stock)
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('Serial reservation & pick (T2.2, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let token: string;
  let merchantId: string;
  let dukaId: string;
  let fridge: Product;
  let cable: Product;

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

  const makeOrder = async (
    lines: Array<{ productId: string; qty: number }>,
    type: 'QUOTE' | 'ORDER' = 'ORDER',
  ) => {
    const res = await asOwner(request(http).post('/orders'))
      .send({ type, locationId: dukaId, lines })
      .expect(201);
    return res.body as {
      id: string;
      status: string;
      lines: Array<{ id: string; productId: string }>;
    };
  };
  const lineOf = (order: { lines: Array<{ id: string; productId: string }> }, productId: string) =>
    order.lines.find((l) => l.productId === productId)!.id;
  const fridgeStock = async () => {
    const res = await asOwner(request(http).get(`/stock?productId=${fridge.id}`)).expect(200);
    return res.body.items[0] ?? { inStock: 0, reserved: 0, sold: 0 };
  };
  const cableLevel = async () =>
    (await ds.getRepository(StockLevel).findOneByOrFail({
      merchantId, productId: cable.id, locationId: dukaId,
    })).qty;

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds
      .getRepository(Merchant)
      .save(ds.getRepository(Merchant).create({ name: `Fulfil Spec ${Date.now()}`, tin: null, phone: null }));
    merchantId = merchant.id;
    dukaId = (
      await ds.getRepository(Location).save(
        ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }),
      )
    ).id;
    fridge = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: null, brand: 'Samsung', model: 'RT38', category: 'Refrigerator',
        taxCode: 'A', priceTzs: 1650000, costTzs: null, active: true, isSerialized: true,
      }),
    );
    cable = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: null, brand: 'Generic', model: 'HDMI', category: 'Accessory',
        taxCode: 'A', priceTzs: 15000, costTzs: null, active: true, isSerialized: false,
      }),
    );
    token = new StubIdentityService().sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();

    await asOwner(request(http).post('/grns'))
      .send({
        locationId: dukaId,
        lines: [
          { productId: fridge.id, serials: ['FRG-1', 'FRG-2', 'FRG-3'] },
          { productId: cable.id, qty: 10 },
        ],
      })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  let orderA: Awaited<ReturnType<typeof makeOrder>>;

  it('reserving serials excludes them from available stock (verify clause)', async () => {
    orderA = await makeOrder([
      { productId: fridge.id, qty: 2 },
      { productId: cable.id, qty: 4 },
    ]);
    expect((await fridgeStock())).toMatchObject({ inStock: 3, reserved: 0 });

    await asOwner(request(http).post(`/orders/${orderA.id}/reserve`))
      .send({ lineId: lineOf(orderA, fridge.id), serials: ['FRG-1', 'FRG-2'] })
      .expect(200);

    expect(await fridgeStock()).toMatchObject({ inStock: 1, reserved: 2 }); // excluded from available
    const unit = await ds.getRepository(SerializedUnit).findOneByOrFail({ merchantId, serial: 'FRG-1' });
    expect(unit.status).toBe('RESERVED');
    expect(unit.orderLineId).toBe(lineOf(orderA, fridge.id));
  });

  it('reservation guards: over-reserve, wrong product, unavailable serial, qty line, non-CONFIRMED order', async () => {
    const fridgeLine = lineOf(orderA, fridge.id);
    const over = await asOwner(request(http).post(`/orders/${orderA.id}/reserve`))
      .send({ lineId: fridgeLine, serials: ['FRG-3'] })
      .expect(400);
    expect(over.body.errors[0].message).toContain("won't fit");

    const taken = await asOwner(request(http).post(`/orders/${orderA.id}/reserve`))
      .send({ lineId: fridgeLine, serials: ['FRG-2'] })
      .expect(400);
    expect(JSON.stringify(taken.body.errors)).toContain('not available (status RESERVED)');

    await asOwner(request(http).post(`/orders/${orderA.id}/reserve`))
      .send({ lineId: lineOf(orderA, cable.id), serials: ['FRG-3'] })
      .expect(400); // serials only apply to serialized products

    const quote = await makeOrder([{ productId: fridge.id, qty: 1 }], 'QUOTE');
    const q = await asOwner(request(http).post(`/orders/${quote.id}/reserve`))
      .send({ lineId: lineOf(quote, fridge.id), serials: ['FRG-3'] })
      .expect(400);
    expect(q.body.message).toContain('CONFIRMED');
  });

  it('cancel returns reserved serials to stock (verify clause)', async () => {
    const res = await asOwner(request(http).post(`/orders/${orderA.id}/cancel`)).expect(200);
    expect(res.body.status).toBe('CANCELLED');
    expect(await fridgeStock()).toMatchObject({ inStock: 3, reserved: 0 });
    const unit = await ds.getRepository(SerializedUnit).findOneByOrFail({ merchantId, serial: 'FRG-1' });
    expect(unit.status).toBe('IN_STOCK');
    expect(unit.orderLineId).toBeNull();
  });

  it('a deferred order fulfills with pick: units → SOLD, qty stock decremented, order FULFILLED (verify clause)', async () => {
    const order = await makeOrder([
      { productId: fridge.id, qty: 2 },
      { productId: cable.id, qty: 4 },
    ]); // no reservation — deferred
    const res = await asOwner(request(http).post(`/orders/${order.id}/fulfill`))
      .send({ picks: [{ lineId: lineOf(order, fridge.id), serials: ['FRG-1', 'FRG-3'] }] })
      .expect(200);
    expect(res.body.status).toBe('FULFILLED');

    expect(await fridgeStock()).toMatchObject({ inStock: 1, reserved: 0, sold: 2 });
    expect(await cableLevel()).toBe(6); // 10 - 4

    // picked unit's full history: pick composes RESERVE then SELL (D-021)
    const unit = await ds.getRepository(SerializedUnit).findOneByOrFail({ merchantId, serial: 'FRG-3' });
    expect(unit.status).toBe('SOLD');
    const trail = await ds
      .getRepository(AuditEvent)
      .createQueryBuilder('e')
      .where(`e.entityId = :id AND e.action LIKE 'UNIT\\_%'`, { id: unit.id })
      .orderBy('e.seq', 'ASC')
      .getMany();
    expect(trail.map((e) => e.action)).toEqual(['UNIT_RESERVED', 'UNIT_SOLD']);
  });

  it('a reserved order fulfills without re-picking', async () => {
    const order = await makeOrder([{ productId: fridge.id, qty: 1 }]);
    await asOwner(request(http).post(`/orders/${order.id}/reserve`))
      .send({ lineId: lineOf(order, fridge.id), serials: ['FRG-2'] })
      .expect(200);
    const res = await asOwner(request(http).post(`/orders/${order.id}/fulfill`)).send({}).expect(200);
    expect(res.body.status).toBe('FULFILLED');
    expect(await fridgeStock()).toMatchObject({ inStock: 0, sold: 3 });
  });

  it('fulfillment guards: under-assigned line, insufficient qty stock (atomic), double fulfill', async () => {
    const under = await makeOrder([{ productId: fridge.id, qty: 1 }]);
    const u = await asOwner(request(http).post(`/orders/${under.id}/fulfill`)).send({}).expect(400);
    expect(u.body.errors[0].message).toContain('needs 1 unit(s), has 0');

    const tooMany = await makeOrder([{ productId: cable.id, qty: 100 }]);
    const t = await asOwner(request(http).post(`/orders/${tooMany.id}/fulfill`)).send({}).expect(400);
    expect(t.body.errors[0].message).toContain('insufficient stock');
    expect(await cableLevel()).toBe(6); // unchanged — nothing persisted

    const cancelled = await asOwner(request(http).get(`/orders/${under.id}`)).expect(200);
    expect(cancelled.body.status).toBe('CONFIRMED'); // failed fulfill left the order alone
  });
});
