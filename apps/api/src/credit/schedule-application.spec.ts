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
import { AuditEvent } from '../db/entities/audit-event.entity.js';
import { PaymentIntent } from '../db/entities/payment-intent.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { PAYMENTS_SERVICE } from '../platform/tokens.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { StubPaymentsService } from '../platform/stubs/payments.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CreditModule } from './credit.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
process.env.FISCAL_QUEUE_NAME = `fiscal-sched-test-${Date.now()}`; // isolated queue

@Module({
  imports: [DbModule, PlatformModule, CreditModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('Schedule payment application (T3.2, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let token: string;
  let merchantId: string;
  let dukaId: string;
  let fridge: Product;

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

  /** CONFIRMED order, customer, fridge 1,720,000 + delivery 30,000 = 1,750,000; deposit 550,000 → financed 1,200,000. */
  const makeCreditOrder = async (): Promise<string> => {
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
    return order.body.id as string;
  };
  const installment = async (orderId: string) =>
    asOwner(request(http).post(`/orders/${orderId}/credit-agreement`))
      .send({ type: 'INSTALLMENT', schedule: { months: 4, firstDueDate: '2026-08-05' } }) // 4×300,000
      .expect(201);
  const layaway = async (orderId: string) =>
    asOwner(request(http).post(`/orders/${orderId}/credit-agreement`))
      .send({ type: 'LAYAWAY', schedule: { months: 4, firstDueDate: '2026-08-05' } })
      .expect(201);
  const pay = (orderId: string, amountTzs: number) =>
    asOwner(request(http).post(`/orders/${orderId}/payments`)).send({ method: 'CASH', amountTzs });
  const schedule = async (orderId: string) =>
    (await asOwner(request(http).get(`/orders/${orderId}/credit-agreement`)).expect(200)).body;
  const rowView = (agreement: { schedule: Array<{ amountTzs: number; paidTzs: number; status: string }> }) =>
    agreement.schedule.map((r) => ({ paid: r.paidTzs, status: r.status }));

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds.getRepository(Merchant).save(
      ds.getRepository(Merchant).create({ name: `Sched Spec ${Date.now()}`, tin: '111-111-111', phone: null }),
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
      .send({ locationId: dukaId, lines: [{ productId: fridge.id, serials: ['SCH-1', 'SCH-2', 'SCH-3', 'SCH-4', 'SCH-5'] }] })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  it('cash payments apply oldest-due-first, partials on the boundary row', async () => {
    const orderId = await makeCreditOrder();
    await installment(orderId);

    await pay(orderId, 750000).expect(201); // covers row1+row2 fully, row3 half
    expect(rowView(await schedule(orderId))).toEqual([
      { paid: 300000, status: 'PAID' },
      { paid: 300000, status: 'PAID' },
      { paid: 150000, status: 'PARTIAL' },
      { paid: 0, status: 'PENDING' },
    ]);

    await pay(orderId, 150000).expect(201); // finishes row3
    const after = await schedule(orderId);
    expect(rowView(after)).toEqual([
      { paid: 300000, status: 'PAID' },
      { paid: 300000, status: 'PAID' },
      { paid: 300000, status: 'PAID' },
      { paid: 0, status: 'PENDING' },
    ]);
    expect(after.status).toBe('ACTIVE'); // still one row owed
  });

  it('settling the last row closes the agreement (verify clause)', async () => {
    const orderId = await makeCreditOrder();
    const agr = await installment(orderId);
    await pay(orderId, 900000).expect(201); // 3 rows
    await pay(orderId, 300000).expect(201); // final row → settled

    const after = await schedule(orderId);
    expect(after.schedule.every((r: { status: string }) => r.status === 'PAID')).toBe(true);
    expect(after.status).toBe('SETTLED');
    expect(after.settledAt).not.toBeNull();

    const audit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'CreditAgreement', entityId: agr.body.id, action: 'AGREEMENT_SETTLED' });
    expect(audit).toHaveLength(1);
  });

  it('mobile-money payments apply to the schedule via the webhook path', async () => {
    const orderId = await makeCreditOrder();
    await installment(orderId);

    const init = await asOwner(request(http).post(`/orders/${orderId}/mobile-money`))
      .send({ provider: 'MPESA', msisdn: '+255712345678', amountTzs: 600000 })
      .expect(201);
    const stub = app.get<StubPaymentsService>(PAYMENTS_SERVICE);
    await stub.confirm(init.body.intentId); // platform-style confirmation → applyPayment → schedule hook

    // let the intent resolve
    const intent = await ds.getRepository(PaymentIntent).findOneByOrFail({ intentId: init.body.intentId });
    expect(intent.appliedPaymentId).toBeTruthy();

    expect(rowView(await schedule(orderId))).toEqual([
      { paid: 300000, status: 'PAID' },
      { paid: 300000, status: 'PAID' },
      { paid: 0, status: 'PENDING' },
      { paid: 0, status: 'PENDING' },
    ]);
  });

  it('LAYAWAY settlement auto-unlocks fulfillment (verify clause)', async () => {
    const orderId = await makeCreditOrder();
    await layaway(orderId);
    const read = await asOwner(request(http).get(`/orders/${orderId}`)).expect(200);
    const lineId = read.body.lines[0].id as string;
    const pick = { picks: [{ lineId, serials: ['SCH-1'] }] };

    await asOwner(request(http).post(`/orders/${orderId}/fulfill`)).send(pick).expect(409); // held
    await pay(orderId, 1200000).expect(201); // pay it off in one shot

    const after = await schedule(orderId);
    expect(after.status).toBe('SETTLED');
    // now the goods release with no code change — the settle flipped the gate
    await asOwner(request(http).post(`/orders/${orderId}/fulfill`)).send(pick).expect(200);
  });

  it('reversing a payment unwinds the schedule and reopens a settled agreement', async () => {
    const orderId = await makeCreditOrder();
    const agr = await installment(orderId);
    const paid = await pay(orderId, 1200000).expect(201); // settle in full
    expect((await schedule(orderId)).status).toBe('SETTLED');

    await asOwner(request(http).post(`/orders/${orderId}/payments/${paid.body.payment.id}/reverse`))
      .send({ reason: 'wrong order' })
      .expect(200);

    const after = await schedule(orderId);
    expect(after.status).toBe('ACTIVE'); // debt is live again
    expect(after.settledAt).toBeNull();
    expect(after.schedule.every((r: { status: string }) => r.status === 'PENDING')).toBe(true);

    const reopened = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'CreditAgreement', entityId: agr.body.id, action: 'AGREEMENT_REOPENED' });
    expect(reopened).toHaveLength(1);
  });

  it('a partial reversal unwinds newest-paid-first', async () => {
    const orderId = await makeCreditOrder();
    await installment(orderId);
    const p1 = await pay(orderId, 700000).expect(201); // rows: PAID, PAID, PARTIAL(100k)
    await asOwner(request(http).post(`/orders/${orderId}/payments/${p1.body.payment.id}/reverse`))
      .send({ reason: 'redo' })
      .expect(200);
    // 700k removed newest-first: row3 100k, row2 300k, row1 300k → all back to zero
    expect(rowView(await schedule(orderId))).toEqual([
      { paid: 0, status: 'PENDING' },
      { paid: 0, status: 'PENDING' },
      { paid: 0, status: 'PENDING' },
      { paid: 0, status: 'PENDING' },
    ]);
  });
});
