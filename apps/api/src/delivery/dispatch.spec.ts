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
process.env.FISCAL_QUEUE_NAME = `fiscal-dispatch-test-${Date.now()}`;

@Module({
  imports: [DbModule, PlatformModule, OrdersModule, DeliveryModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

const DAY = '2026-08-25';
const OTHER_DAY = '2026-08-26';

describe('Dispatch list (T4.2, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let ownerToken: string;
  let deoToken: string; // delivery staffer A (u-deo); staffer B (u-jua) is asserted via scoping
  let merchantId: string;
  let dukaId: string;
  let tv: Product;

  const authed = (r: request.Test, token: string) => r.set('Authorization', `Bearer ${token}`);

  /** Confirmed order + a delivery assigned to `assignee` on `date`. Returns deliveryId. */
  const scheduleFor = async (assignee: string, date: string, customer = 'Mteja'): Promise<string> => {
    const order = await authed(request(http).post('/orders'), ownerToken)
      .send({
        type: 'ORDER', locationId: dukaId,
        customer: { name: customer, phone: '+255713000000' },
        lines: [{ productId: tv.id, qty: 1 }],
      })
      .expect(201);
    const del = await authed(request(http).post(`/orders/${order.body.id}/delivery`), ownerToken)
      .send({ scheduledDate: date, addressText: 'Mikocheni', assigneeUserId: assignee, window: 'Mchana' })
      .expect(201);
    return del.body.id as string;
  };

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds
      .getRepository(Merchant)
      .save(ds.getRepository(Merchant).create({ name: `Dispatch Spec ${Date.now()}`, tin: null, phone: null }));
    merchantId = merchant.id;
    dukaId = (
      await ds.getRepository(Location).save(
        ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }),
      )
    ).id;
    tv = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: null, brand: 'Samsung', model: 'UA43', category: 'TV',
        taxCode: 'A', priceTzs: 850000, costTzs: null, active: true, isSerialized: false,
      }),
    );

    const mint = new StubIdentityService();
    ownerToken = mint.sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });
    deoToken = mint.sign({ sub: 'u-deo', mid: merchantId, name: 'Deo', roles: ['DELIVERY'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  it('a delivery staffer sees ONLY their own assigned jobs, with contents + phone (verify clause)', async () => {
    const mine = await scheduleFor('u-deo', DAY, 'Mama Deo');
    await scheduleFor('u-jua', DAY, 'Bwana Jua'); // someone else's job
    await scheduleFor('u-deo', OTHER_DAY, 'Kesho'); // my job but a different day

    const res = await authed(request(http).get(`/deliveries/dispatch?date=${DAY}`), deoToken).expect(200);
    expect(res.body.date).toBe(DAY);
    expect(res.body.jobs).toHaveLength(1); // only my job, only today
    const job = res.body.jobs[0];
    expect(job.id).toBe(mine);
    expect(job.customer).toEqual({ name: 'Mama Deo', phone: '+255713000000' });
    expect(job.lines).toEqual([{ description: 'Samsung UA43', qty: 1 }]);
    expect(job.order.numberFormatted).toMatch(/^SO-\d{6}$/);
    expect(job.status).toBe('PLANNED');
  });

  it('an owner sees every job that day (planning oversight)', async () => {
    const res = await authed(request(http).get(`/deliveries/dispatch?date=${DAY}`), ownerToken).expect(200);
    // both u-deo's and u-jua's DAY jobs (created above)
    expect(res.body.jobs.length).toBeGreaterThanOrEqual(2);
    const assignees = new Set(res.body.jobs.map((j: { assigneeUserId: string }) => j.assigneeUserId));
    expect(assignees.has('u-deo')).toBe(true);
    expect(assignees.has('u-jua')).toBe(true);
  });

  it('marking a job DISPATCHED moves it and audits; it then leaves the PLANNED view but stays dispatched', async () => {
    const id = await scheduleFor('u-deo', DAY, 'Wa Kusafirisha');
    const res = await authed(request(http).post(`/deliveries/${id}/dispatch`), deoToken).expect(200);
    expect(res.body.status).toBe('DISPATCHED');

    const audit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'Delivery', entityId: id, action: 'DELIVERY_DISPATCHED' });
    expect(audit).toHaveLength(1);
    expect(audit[0].actorUserId).toBe('u-deo');

    // still on the dispatch list (DISPATCHED is in-progress), now flagged dispatched
    const list = await authed(request(http).get(`/deliveries/dispatch?date=${DAY}`), deoToken).expect(200);
    const job = list.body.jobs.find((j: { id: string }) => j.id === id);
    expect(job.status).toBe('DISPATCHED');

    // can't dispatch twice
    await authed(request(http).post(`/deliveries/${id}/dispatch`), deoToken).expect(409);
  });

  it("a staffer cannot dispatch another staffer's job (404, not visible)", async () => {
    const jua = await scheduleFor('u-jua', DAY);
    await authed(request(http).post(`/deliveries/${jua}/dispatch`), deoToken).expect(404);
    expect((await ds.getRepository(Delivery).findOneByOrFail({ id: jua })).status).toBe('PLANNED');
    // but the owner can
    await authed(request(http).post(`/deliveries/${jua}/dispatch`), ownerToken).expect(200);
  });

  it('role guard + default date: cashiers are blocked; no date defaults to today', async () => {
    const cashier = new StubIdentityService().sign({ sub: 'u-c', mid: merchantId, name: 'C', roles: ['CASHIER'] });
    await authed(request(http).get('/deliveries/dispatch'), cashier).expect(403);
    const res = await authed(request(http).get('/deliveries/dispatch'), deoToken).expect(200);
    expect(res.body.date).toBe(new Date().toISOString().slice(0, 10));
  });
});
