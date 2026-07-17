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
import { CreditAgreement } from '../db/entities/credit-agreement.entity.js';
import { AuditEvent } from '../db/entities/audit-event.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CreditModule } from './credit.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
process.env.FISCAL_QUEUE_NAME = `fiscal-credit-test-${Date.now()}`; // isolated queue

@Module({
  imports: [DbModule, PlatformModule, CreditModule], // CreditModule pulls Orders → Inventory → Fiscal
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('Credit agreements (T3.1, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let token: string;
  let merchantId: string;
  let dukaId: string;
  let fridge: Product;

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

  /**
   * The shared order fixture (verify clause: "both types created from same
   * order fixture"): CONFIRMED order, customer attached, 1 fridge @1,720,000
   * + delivery 30,000 = 1,750,000; cash deposit 550,000 → financed 1,200,000.
   */
  const makeCreditOrder = async () => {
    const order = await asOwner(request(http).post('/orders'))
      .send({
        type: 'ORDER',
        locationId: dukaId,
        customer: { name: 'Mama Zawadi', phone: '+255713222333' },
        lines: [{ productId: fridge.id, qty: 1 }],
        serviceLines: [{ kind: 'DELIVERY', priceTzs: 30000 }],
      })
      .expect(201);
    await asOwner(request(http).post(`/orders/${order.body.id}/payments`))
      .send({ method: 'CASH', amountTzs: 550000 })
      .expect(201);
    return order.body as { id: string };
  };
  const reserveAndPickInput = async (orderId: string, serial: string) => {
    const read = await asOwner(request(http).get(`/orders/${orderId}`)).expect(200);
    const lineId = read.body.lines[0].id as string;
    return { picks: [{ lineId, serials: [serial] }] };
  };

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds.getRepository(Merchant).save(
      ds.getRepository(Merchant).create({ name: `Credit Spec ${Date.now()}`, tin: '111-111-111', phone: null }),
    );
    merchantId = merchant.id;
    dukaId = (
      await ds.getRepository(Location).save(
        ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }),
      )
    ).id;
    fridge = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: null, brand: 'LG', model: 'GN-B422', category: 'Refrigerator',
        taxCode: 'A', priceTzs: 1720000, costTzs: null, active: true, isSerialized: true,
      }),
    );
    token = new StubIdentityService().sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();

    await asOwner(request(http).post('/grns'))
      .send({ locationId: dukaId, lines: [{ productId: fridge.id, serials: ['CRD-1', 'CRD-2', 'CRD-3', 'CRD-4'] }] })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  it('INSTALLMENT from the order fixture: equal-monthly schedule, deposit + schedule = total, goods release (fulfillment allowed)', async () => {
    const order = await makeCreditOrder();
    const res = await asOwner(request(http).post(`/orders/${order.id}/credit-agreement`))
      .send({ type: 'INSTALLMENT', schedule: { months: 4, firstDueDate: '2026-08-05' } })
      .expect(201);

    expect(res.body.type).toBe('INSTALLMENT');
    expect(res.body.status).toBe('ACTIVE');
    expect(res.body.principalTzs).toBe(1750000);
    expect(res.body.depositTzs).toBe(550000);
    expect(res.body.financedTzs).toBe(1200000);
    expect(res.body.schedule).toHaveLength(4);
    expect(res.body.schedule.map((r: { amountTzs: number }) => r.amountTzs)).toEqual([
      300000, 300000, 300000, 300000,
    ]);
    expect(res.body.schedule.map((r: { dueDate: string }) => r.dueDate)).toEqual([
      '2026-08-05', '2026-09-05', '2026-10-05', '2026-11-05',
    ]);
    expect(res.body.scheduleTotalTzs + res.body.depositTzs).toBe(res.body.principalTzs); // the ledger identity
    expect(res.body.customer.name).toBe('Mama Zawadi');

    const audit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'CreditAgreement', entityId: res.body.id, action: 'AGREEMENT_CREATED' });
    expect(audit).toHaveLength(1);

    // INSTALLMENT releases goods: fulfillment proceeds with an unpaid balance
    const fulfil = await asOwner(request(http).post(`/orders/${order.id}/fulfill`))
      .send(await reserveAndPickInput(order.id, 'CRD-1'))
      .expect(200);
    expect(fulfil.body.status).toBe('FULFILLED');
  });

  it('LAYAWAY from the same fixture: created fine, but blocks fulfillment until SETTLED (verify clause)', async () => {
    const order = await makeCreditOrder();
    const res = await asOwner(request(http).post(`/orders/${order.id}/credit-agreement`))
      .send({
        type: 'LAYAWAY',
        schedule: {
          rows: [
            { dueDate: '2026-08-10', amountTzs: 700000 },
            { dueDate: '2026-09-10', amountTzs: 500000 },
          ],
        },
      })
      .expect(201);
    expect(res.body.type).toBe('LAYAWAY');
    expect(res.body.schedule).toHaveLength(2);

    // layaway blocks delivery/fulfillment…
    const blocked = await asOwner(request(http).post(`/orders/${order.id}/fulfill`))
      .send(await reserveAndPickInput(order.id, 'CRD-2'))
      .expect(409);
    expect(blocked.body.message).toContain('Layaway holds goods until fully paid');

    // …until settled (T3.2 automates this transition; fixture backdoor here)
    await ds.query(`UPDATE credit_agreements SET status = 'SETTLED', "settledAt" = now() WHERE id = $1`, [res.body.id]);
    const after = await asOwner(request(http).post(`/orders/${order.id}/fulfill`))
      .send(await reserveAndPickInput(order.id, 'CRD-2'))
      .expect(200);
    expect(after.body.status).toBe('FULFILLED');
  });

  it('cancelling an order with an ACTIVE agreement is blocked', async () => {
    const order = await makeCreditOrder();
    await asOwner(request(http).post(`/orders/${order.id}/credit-agreement`))
      .send({ type: 'INSTALLMENT', schedule: { months: 2, firstDueDate: '2026-08-01' } })
      .expect(201);
    const res = await asOwner(request(http).post(`/orders/${order.id}/cancel`)).expect(409);
    expect(res.body.message).toContain('ACTIVE INSTALLMENT agreement');
  });

  it('guards: one agreement per order, quotes rejected, customer required, fully-paid rejected, bad schedules rejected', async () => {
    const order = await makeCreditOrder();
    await asOwner(request(http).post(`/orders/${order.id}/credit-agreement`))
      .send({ type: 'LAYAWAY', schedule: { months: 2, firstDueDate: '2026-08-01' } })
      .expect(201);
    await asOwner(request(http).post(`/orders/${order.id}/credit-agreement`))
      .send({ type: 'INSTALLMENT', schedule: { months: 2, firstDueDate: '2026-08-01' } })
      .expect(409); // already has one

    const quote = await asOwner(request(http).post('/orders'))
      .send({ locationId: dukaId, customer: { name: 'X' }, lines: [{ productId: fridge.id, qty: 1 }] })
      .expect(201);
    await asOwner(request(http).post(`/orders/${quote.body.id}/credit-agreement`))
      .send({ type: 'INSTALLMENT', schedule: { months: 2, firstDueDate: '2026-08-01' } })
      .expect(400); // QUOTE

    const anonymous = await asOwner(request(http).post('/orders'))
      .send({ type: 'ORDER', locationId: dukaId, lines: [{ productId: fridge.id, qty: 1 }] })
      .expect(201);
    const noCust = await asOwner(request(http).post(`/orders/${anonymous.body.id}/credit-agreement`))
      .send({ type: 'INSTALLMENT', schedule: { months: 2, firstDueDate: '2026-08-01' } })
      .expect(400);
    expect(noCust.body.message).toContain('customer');

    const paid = await asOwner(request(http).post('/orders'))
      .send({
        type: 'ORDER', locationId: dukaId, customer: { name: 'Y' },
        lines: [{ productId: fridge.id, qty: 1 }],
      })
      .expect(201);
    await asOwner(request(http).post(`/orders/${paid.body.id}/payments`))
      .send({ method: 'CASH', amountTzs: 1720000 })
      .expect(201);
    await asOwner(request(http).post(`/orders/${paid.body.id}/credit-agreement`))
      .send({ type: 'INSTALLMENT', schedule: { months: 2, firstDueDate: '2026-08-01' } })
      .expect(400); // nothing to finance

    const order2 = await makeCreditOrder();
    const wrongSum = await asOwner(request(http).post(`/orders/${order2.id}/credit-agreement`))
      .send({ type: 'INSTALLMENT', schedule: { rows: [{ dueDate: '2026-08-10', amountTzs: 100 }] } })
      .expect(400);
    expect(JSON.stringify(wrongSum.body.errors)).toContain('must sum to the financed amount');
    await asOwner(request(http).post(`/orders/${order2.id}/credit-agreement`))
      .send({ type: 'INSTALLMENT' })
      .expect(400); // no schedule shape
    await asOwner(request(http).post(`/orders/${order2.id}/credit-agreement`))
      .send({ type: 'HIRE_PURCHASE', schedule: { months: 2, firstDueDate: '2026-08-01' } })
      .expect(400); // bad type

    // nothing persisted for order2 through all those rejections
    expect(await ds.getRepository(CreditAgreement).countBy({ orderId: order2.id })).toBe(0);
  });

  it('GET returns the agreement with schedule; orders without one 404', async () => {
    const order = await makeCreditOrder();
    await asOwner(request(http).get(`/orders/${order.id}/credit-agreement`)).expect(404);
    await asOwner(request(http).post(`/orders/${order.id}/credit-agreement`))
      .send({ type: 'INSTALLMENT', schedule: { months: 3, firstDueDate: '2026-08-05' } })
      .expect(201);
    const res = await asOwner(request(http).get(`/orders/${order.id}/credit-agreement`)).expect(200);
    expect(res.body.schedule).toHaveLength(3);
    expect(res.body.financedTzs).toBe(1200000);
  });
});
