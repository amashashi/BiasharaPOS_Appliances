import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import 'reflect-metadata';
import { INestApplication, Module } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import { createDataSource } from '../db/data-source.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { Location } from '../db/entities/location.entity.js';
import { Product } from '../db/entities/product.entity.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { Payment } from '../db/entities/payment.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { OrdersModule } from './orders.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
process.env.FISCAL_QUEUE_NAME = `fiscal-sync-test-${Date.now()}`;

@Module({
  imports: [DbModule, PlatformModule, OrdersModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('Offline outbox sync (T5.5, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let token: string;
  let cashierToken: string;
  let merchantId: string;
  let locationId: string;
  let cable: Product;

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);
  const op = (amountTzs: number, qty: number) => ({
    clientRef: randomUUID(),
    locationId,
    customer: { name: 'Walk-in' },
    lines: [{ productId: cable.id, qty }],
    payment: { amountTzs },
  });
  const postOutbox = (operations: unknown[]) =>
    asOwner(request(http).post('/sync/outbox')).send({ operations });

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize();
    const merchant = await ds.getRepository(Merchant).save(
      ds.getRepository(Merchant).create({ name: `Sync Spec ${Date.now()}`, tin: null, phone: null }),
    );
    merchantId = merchant.id;
    locationId = (await ds.getRepository(Location).save(ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }))).id;
    cable = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: null, brand: 'Generic', model: 'HDMI', category: 'Accessory',
        taxCode: 'A', priceTzs: 15000, costTzs: null, active: true, isSerialized: false,
      }),
    );
    const mint = new StubIdentityService();
    token = mint.sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });
    cashierToken = mint.sign({ sub: 'u-cash', mid: merchantId, name: 'Cash', roles: ['CASHIER'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
    await asOwner(request(http).post('/grns')).send({ locationId, lines: [{ productId: cable.id, qty: 500 }] }).expect(201);
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  const ordersFor = (refs: string[]) =>
    ds.getRepository(SalesOrder).createQueryBuilder('o').where('o.clientRef IN (:...refs)', { refs }).getMany();

  it('3 offline sales replay to exactly 3 orders; double-replay makes no duplicates (verify clause)', async () => {
    const ops = [op(15000, 1), op(30000, 2), op(45000, 3)];
    const refs = ops.map((o) => o.clientRef);

    const first = await postOutbox(ops).expect(200);
    expect(first.body.results.map((r: { status: string }) => r.status)).toEqual(['created', 'created', 'created']);

    let orders = await ordersFor(refs);
    expect(orders).toHaveLength(3);
    // each order got exactly its one cash payment
    for (const o of orders) {
      expect(await ds.getRepository(Payment).countBy({ orderId: o.id })).toBe(1);
    }

    // reconnect flap → the SAME batch replays; still exactly 3 orders, 3 payments
    const second = await postOutbox(ops).expect(200);
    expect(second.body.results.map((r: { status: string }) => r.status)).toEqual(['duplicate', 'duplicate', 'duplicate']);
    // the returned order numbers match the originals
    expect(second.body.results.map((r: { order: { id: string } }) => r.order.id).sort())
      .toEqual(first.body.results.map((r: { order: { id: string } }) => r.order.id).sort());

    orders = await ordersFor(refs);
    expect(orders).toHaveLength(3);
    const paymentCounts = await Promise.all(orders.map((o) => ds.getRepository(Payment).countBy({ orderId: o.id })));
    expect(paymentCounts).toEqual([1, 1, 1]); // no double-charge on replay
  });

  it('a half-finished replay converges: an order with no payment gets its cash applied on the next pass', async () => {
    const ref = randomUUID();
    // simulate the crash-between-order-and-payment case: create the order (with clientRef) but no payment
    const created = await asOwner(request(http).post('/orders'))
      .send({ type: 'ORDER', locationId, lines: [{ productId: cable.id, qty: 1 }], clientRef: ref })
      .expect(201);
    expect(await ds.getRepository(Payment).countBy({ orderId: created.body.id })).toBe(0);

    const res = await postOutbox([{ clientRef: ref, locationId, lines: [{ productId: cable.id, qty: 1 }], payment: { amountTzs: 15000 } }]).expect(200);
    expect(res.body.results[0].status).toBe('duplicate');
    expect(res.body.results[0].order.id).toBe(created.body.id); // same order, not a new one
    expect(await ds.getRepository(Payment).countBy({ orderId: created.body.id })).toBe(1); // now settled
  });

  it('a bad operation is reported without aborting the rest of the batch', async () => {
    const good = op(15000, 1);
    const bad = { clientRef: randomUUID(), locationId, lines: [], payment: { amountTzs: 15000 } }; // no lines
    const notUuid = { clientRef: 'not-a-uuid', locationId, lines: [{ productId: cable.id, qty: 1 }], payment: { amountTzs: 1 } };

    const res = await postOutbox([good, bad, notUuid]).expect(200);
    expect(res.body.results[0].status).toBe('created');
    expect(res.body.results[1].status).toBe('failed');
    expect(res.body.results[2].status).toBe('failed');
    expect(res.body.results[2].error).toMatch(/uuid/);
    // the good one really landed
    expect(await ordersFor([good.clientRef])).toHaveLength(1);
  });

  it('scoping: DELIVERY role is rejected; CASHIER may sync', async () => {
    const deliveryToken = new StubIdentityService().sign({ sub: 'u-deo', mid: merchantId, name: 'Deo', roles: ['DELIVERY'] });
    await request(http).post('/sync/outbox').set('Authorization', `Bearer ${deliveryToken}`).send({ operations: [] }).expect(403);
    await request(http).post('/sync/outbox').set('Authorization', `Bearer ${cashierToken}`).send({ operations: [op(15000, 1)] }).expect(200);
  });
});
