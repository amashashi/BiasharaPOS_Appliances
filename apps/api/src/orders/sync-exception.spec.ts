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
import { SerializedUnit } from '../db/entities/serialized-unit.entity.js';
import { SyncException } from '../db/entities/sync-exception.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { OrdersModule } from './orders.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
process.env.FISCAL_QUEUE_NAME = `fiscal-syncex-test-${Date.now()}`;

@Module({
  imports: [DbModule, PlatformModule, OrdersModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('Offline sync exceptions (T5.6, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let ownerToken: string;
  let cashierToken: string;
  let merchantId: string;
  let locationId: string;
  let fridge: Product;
  let cable: Product;
  let serialSeq = 0;

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${ownerToken}`);

  /** GRN a fresh serial and return it (IN_STOCK). */
  const receiveSerial = async (): Promise<string> => {
    const serial = `SYX-${++serialSeq}-${Date.now() % 10000}`;
    await asOwner(request(http).post('/grns')).send({ locationId, lines: [{ productId: fridge.id, serials: [serial] }] }).expect(201);
    return serial;
  };
  /** Sell a serial online so it's no longer IN_STOCK. */
  const sellOnline = async (serial: string): Promise<void> => {
    const order = await asOwner(request(http).post('/orders'))
      .send({ type: 'ORDER', locationId, lines: [{ productId: fridge.id, qty: 1 }] })
      .expect(201);
    await asOwner(request(http).post(`/orders/${order.body.id}/fulfill`))
      .send({ picks: [{ lineId: order.body.lines[0].id, serials: [serial] }] })
      .expect(200);
  };
  const postOutbox = (operations: unknown[]) => asOwner(request(http).post('/sync/outbox')).send({ operations });

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize();
    const merchant = await ds.getRepository(Merchant).save(ds.getRepository(Merchant).create({ name: `SyncEx ${Date.now()}`, tin: null, phone: null }));
    merchantId = merchant.id;
    locationId = (await ds.getRepository(Location).save(ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }))).id;
    fridge = await ds.getRepository(Product).save(ds.getRepository(Product).create({
      merchantId, sku: null, brand: 'LG', model: 'RT38', category: 'Refrigerator', taxCode: 'A', priceTzs: 900000, costTzs: null, active: true, isSerialized: true,
    }));
    cable = await ds.getRepository(Product).save(ds.getRepository(Product).create({
      merchantId, sku: null, brand: 'Generic', model: 'HDMI', category: 'Accessory', taxCode: 'A', priceTzs: 15000, costTzs: null, active: true, isSerialized: false,
    }));
    const mint = new StubIdentityService();
    ownerToken = mint.sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });
    cashierToken = mint.sign({ sub: 'u-cash', mid: merchantId, name: 'Cash', roles: ['CASHIER'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  it('serial sold online + offline → conflict lands in queue; reassigning an available serial corrects it (verify clause)', async () => {
    const soldSerial = await receiveSerial();
    const spareSerial = await receiveSerial();
    await sellOnline(soldSerial); // taken by an online sale first

    // the offline sale claimed the now-sold serial
    const clientRef = randomUUID();
    const res = await postOutbox([{
      clientRef, locationId, customer: { name: 'Walk-in' },
      lines: [{ productId: fridge.id, qty: 1, unitPriceTzs: 900000, serials: [soldSerial] }],
      payment: { amountTzs: 900000 },
    }]).expect(200);
    expect(res.body.results[0].status).toBe('created');
    expect(res.body.results[0].conflicts).toBe(1); // order + cash still landed, but flagged

    const list = await asOwner(request(http).get('/sync/exceptions')).expect(200);
    const ex = list.body.items.find((i: { detail: { serial?: string } }) => i.detail.serial === soldSerial);
    expect(ex.kind).toBe('SERIAL_CONFLICT');
    expect(ex.detail.foundStatus).toBe('SOLD');
    expect(ex.order.id).toBe(res.body.results[0].order.id);

    // reassign to the spare — it gets RESERVED to the order line, and the exception clears
    await asOwner(request(http).post(`/sync/exceptions/${ex.id}/resolve`))
      .send({ action: 'reassign', serial: spareSerial, note: 'gave them the other fridge' })
      .expect(200);
    const spare = await ds.getRepository(SerializedUnit).findOneByOrFail({ merchantId, serial: spareSerial });
    expect(spare.status).toBe('RESERVED');
    const after = await asOwner(request(http).get('/sync/exceptions')).expect(200);
    expect(after.body.items.find((i: { id: string }) => i.id === ex.id)).toBeUndefined();
  });

  it('a stale offline price lands as STALE_PRICE and accepts on resolve; a matching price flags nothing', async () => {
    // catalog is 15,000 but the cashier sold at 12,000 offline (price changed since last sync)
    const stale = await postOutbox([{
      clientRef: randomUUID(), locationId,
      lines: [{ productId: cable.id, qty: 1, unitPriceTzs: 12000 }],
      payment: { amountTzs: 12000 },
    }]).expect(200);
    expect(stale.body.results[0].conflicts).toBe(1);
    const list = await asOwner(request(http).get('/sync/exceptions')).expect(200);
    const ex = list.body.items.find((i: { order: { id: string } | null }) => i.order?.id === stale.body.results[0].order.id);
    expect(ex.kind).toBe('STALE_PRICE');
    expect(ex.detail).toMatchObject({ offeredTzs: 12000, catalogTzs: 15000 });

    await asOwner(request(http).post(`/sync/exceptions/${ex.id}/resolve`)).send({ action: 'accept' }).expect(200);
    const after = await asOwner(request(http).get('/sync/exceptions')).expect(200);
    expect(after.body.items.find((i: { id: string }) => i.id === ex.id)).toBeUndefined();

    // a sale at the catalog price flags nothing
    const clean = await postOutbox([{
      clientRef: randomUUID(), locationId, lines: [{ productId: cable.id, qty: 1, unitPriceTzs: 15000 }], payment: { amountTzs: 15000 },
    }]).expect(200);
    expect(clean.body.results[0].conflicts).toBe(0);
  });

  it('detects conflicts on the converge path — a first replay that only created the order still gets flagged (review fix A)', async () => {
    // model a first replay that committed the order (with clientRef, stale price) but never ran detection
    const ref = randomUUID();
    const created = await asOwner(request(http).post('/orders'))
      .send({ type: 'ORDER', locationId, lines: [{ productId: cable.id, qty: 1, unitPriceTzs: 12000 }], clientRef: ref })
      .expect(201);
    // no exception yet (detection never ran on the crashed first pass)
    expect(await ds.getRepository(SyncException).count({ where: { orderId: created.body.id } })).toBe(0);

    // the POS re-replays the same op → converge path settles cash AND runs detection
    const res = await postOutbox([{ clientRef: ref, locationId, lines: [{ productId: cable.id, qty: 1, unitPriceTzs: 12000 }], payment: { amountTzs: 12000 } }]).expect(200);
    expect(res.body.results[0].status).toBe('duplicate');
    expect(res.body.results[0].conflicts).toBe(1); // the STALE_PRICE was caught on converge, not lost
    const list = await asOwner(request(http).get('/sync/exceptions')).expect(200);
    expect(list.body.items.find((i: { order: { id: string } | null }) => i.order?.id === created.body.id).kind).toBe('STALE_PRICE');
  });

  it('idempotent + guarded: a re-replayed conflict does not pile up; reassign to an unavailable serial is rejected; CASHIER can’t view', async () => {
    const soldSerial = await receiveSerial();
    await sellOnline(soldSerial);
    const clientRef = randomUUID();
    const op = { clientRef, locationId, lines: [{ productId: fridge.id, qty: 1, unitPriceTzs: 900000, serials: [soldSerial] }], payment: { amountTzs: 900000 } };

    await postOutbox([op]).expect(200);
    await postOutbox([op]).expect(200); // reconnect flap → same batch again
    const openForOrder = await ds.getRepository(SyncException).count({ where: { clientRef, status: 'OPEN' } });
    expect(openForOrder).toBe(1); // partial unique index kept it to one

    const list = await asOwner(request(http).get('/sync/exceptions')).expect(200);
    const ex = list.body.items.find((i: { detail: { serial?: string } }) => i.detail.serial === soldSerial);
    // reassigning to a serial that is itself unavailable is rejected (reserve() re-validates)
    await asOwner(request(http).post(`/sync/exceptions/${ex.id}/resolve`)).send({ action: 'reassign', serial: soldSerial }).expect(400);
    // bad action shape rejected
    await asOwner(request(http).post(`/sync/exceptions/${ex.id}/resolve`)).send({ action: 'whatever' }).expect(400);

    // CASHIER may sync but not review exceptions
    await request(http).get('/sync/exceptions').set('Authorization', `Bearer ${cashierToken}`).expect(403);
  });
});
