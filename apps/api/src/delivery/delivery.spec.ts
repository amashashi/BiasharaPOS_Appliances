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
import { Delivery } from '../db/entities/delivery.entity.js';
import { AuditEvent } from '../db/entities/audit-event.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { OrdersModule } from '../orders/orders.module.js';
import { DeliveryModule } from './delivery.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
process.env.FISCAL_QUEUE_NAME = `fiscal-delivery-test-${Date.now()}`;

@Module({
  imports: [DbModule, PlatformModule, OrdersModule, DeliveryModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('Delivery scheduling (T4.1, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let ownerToken: string;
  let deliveryToken: string;
  let otherOwnerToken: string;
  let merchantId: string;
  let dukaId: string;
  let cable: Product;

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${ownerToken}`);

  /** A CONFIRMED order (walk-in) ready to receive a delivery. */
  const makeOrder = async (): Promise<string> => {
    const res = await asOwner(request(http).post('/orders'))
      .send({
        type: 'ORDER',
        locationId: dukaId,
        customer: { name: 'Mama Uledi', phone: '+255713444555' },
        lines: [{ productId: cable.id, qty: 2 }],
      })
      .expect(201);
    return res.body.id as string;
  };

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds
      .getRepository(Merchant)
      .save(ds.getRepository(Merchant).create({ name: `Delivery Spec ${Date.now()}`, tin: null, phone: null }));
    merchantId = merchant.id;
    const other = await ds
      .getRepository(Merchant)
      .save(ds.getRepository(Merchant).create({ name: `Deliv other ${Date.now()}`, tin: null, phone: null }));
    dukaId = (
      await ds.getRepository(Location).save(
        ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }),
      )
    ).id;
    cable = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: null, brand: 'Generic', model: 'HDMI', category: 'Accessory',
        taxCode: 'A', priceTzs: 15000, costTzs: null, active: true, isSerialized: false,
      }),
    );

    const mint = new StubIdentityService();
    ownerToken = mint.sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });
    deliveryToken = mint.sign({ sub: 'u-deo', mid: merchantId, name: 'Deo', roles: ['DELIVERY'] });
    otherOwnerToken = mint.sign({ sub: 'u-o2', mid: other.id, name: 'Neema', roles: ['OWNER'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  it('schedules a delivery (date, window, address, assignee) and the order screen shows it (verify clause)', async () => {
    const orderId = await makeOrder();
    const res = await asOwner(request(http).post(`/orders/${orderId}/delivery`))
      .send({
        scheduledDate: '2026-08-20',
        window: 'Asubuhi / Morning 09:00–12:00',
        addressText: 'Mbezi Beach, nyumba ya bluu karibu na shule',
        assigneeUserId: 'u-deo',
        note: 'Piga simu ukifika',
      })
      .expect(201);
    expect(res.body.status).toBe('PLANNED');
    expect(res.body.scheduledDate).toBe('2026-08-20');
    expect(res.body.assigneeUserId).toBe('u-deo');
    expect(res.body.scheduledByUserId).toBe('u-owner');

    // the order read carries the scheduled delivery
    const order = await asOwner(request(http).get(`/orders/${orderId}`)).expect(200);
    expect(order.body.delivery.id).toBe(res.body.id);
    expect(order.body.delivery.addressText).toContain('Mbezi Beach');

    // and the dedicated endpoint returns it
    const direct = await asOwner(request(http).get(`/orders/${orderId}/delivery`)).expect(200);
    expect(direct.body.window).toBe('Asubuhi / Morning 09:00–12:00');

    const audit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'Delivery', entityId: res.body.id, action: 'DELIVERY_SCHEDULED' });
    expect(audit).toHaveLength(1);
    expect(audit[0].actorUserId).toBe('u-owner');
  });

  it('double-booking the same order is prevented (verify clause)', async () => {
    const orderId = await makeOrder();
    await asOwner(request(http).post(`/orders/${orderId}/delivery`))
      .send({ scheduledDate: '2026-08-21', addressText: 'Kariakoo' })
      .expect(201);
    const dup = await asOwner(request(http).post(`/orders/${orderId}/delivery`))
      .send({ scheduledDate: '2026-08-22', addressText: 'Kariakoo' })
      .expect(409);
    expect(dup.body.message).toContain('already has a PLANNED delivery');
    expect(await ds.getRepository(Delivery).countBy({ orderId })).toBe(1);
  });

  it('validation: date and address required; only schedulable orders; unknown order 404', async () => {
    const orderId = await makeOrder();
    const bad = await asOwner(request(http).post(`/orders/${orderId}/delivery`))
      .send({ scheduledDate: '20 Aug', window: 'x' })
      .expect(400);
    const fields = bad.body.errors.map((e: { field: string }) => e.field).sort();
    expect(fields).toEqual(['addressText', 'scheduledDate']);

    // a QUOTE can't have a delivery
    const quote = await asOwner(request(http).post('/orders'))
      .send({ locationId: dukaId, lines: [{ productId: cable.id, qty: 1 }] })
      .expect(201);
    const q = await asOwner(request(http).post(`/orders/${quote.body.id}/delivery`))
      .send({ scheduledDate: '2026-08-20', addressText: 'Somewhere' })
      .expect(400);
    expect(q.body.message).toContain('QUOTE');

    await asOwner(request(http).post('/orders/00000000-0000-4000-8000-000000000000/delivery'))
      .send({ scheduledDate: '2026-08-20', addressText: 'x' })
      .expect(404);
  });

  it('role + merchant scoping: DELIVERY role cannot schedule; other merchant 404; no-delivery order returns null', async () => {
    const orderId = await makeOrder();
    await request(http)
      .post(`/orders/${orderId}/delivery`)
      .set('Authorization', `Bearer ${deliveryToken}`)
      .send({ scheduledDate: '2026-08-20', addressText: 'x' })
      .expect(403);
    await request(http)
      .get(`/orders/${orderId}/delivery`)
      .set('Authorization', `Bearer ${otherOwnerToken}`)
      .expect(404);
    const none = await asOwner(request(http).get(`/orders/${orderId}/delivery`)).expect(200);
    expect(none.body).toEqual({}); // no delivery yet → null body
  });
});
