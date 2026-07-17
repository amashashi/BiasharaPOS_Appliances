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
import { Payment } from '../db/entities/payment.entity.js';
import { PaymentIntent } from '../db/entities/payment-intent.entity.js';
import { FiscalReceipt } from '../db/entities/fiscal-receipt.entity.js';
import { AuditEvent } from '../db/entities/audit-event.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { PAYMENTS_SERVICE } from '../platform/tokens.js';
import { StubPaymentsService } from '../platform/stubs/payments.stub.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { OrdersModule } from './orders.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
// isolated fiscal queue per run (Redis persists across runs)
process.env.FISCAL_QUEUE_NAME = `fiscal-mm-test-${Date.now()}`;
process.env.FISCAL_BACKOFF_MS = '100';

@Module({
  imports: [DbModule, PlatformModule, OrdersModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

const waitFor = async <T>(fn: () => Promise<T | null>, ms = 10_000): Promise<T> => {
  const deadline = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > deadline) throw new Error(`waitFor timed out after ${ms}ms`);
    await new Promise((r) => setTimeout(r, 100));
  }
};

describe('Mobile money at POS (T2.5, real Postgres + real Redis)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let token: string;
  let merchantId: string;
  let dukaId: string;
  let cable: Product;

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);
  /** CONFIRMED order: 4 cables @15,000 + 30,000 delivery = TZS 90,000. */
  const makeOrder = async () => {
    const res = await asOwner(request(http).post('/orders'))
      .send({
        type: 'ORDER',
        locationId: dukaId,
        lines: [{ productId: cable.id, qty: 4 }],
        serviceLines: [{ kind: 'DELIVERY', priceTzs: 30000 }],
      })
      .expect(201);
    return res.body as { id: string };
  };
  const initiate = (orderId: string, amountTzs: number) =>
    asOwner(request(http).post(`/orders/${orderId}/mobile-money`)).send({
      provider: 'MPESA',
      msisdn: '+255712345678',
      amountTzs,
    });
  const confirmViaHttp = (intentId: string, status: 'CONFIRMED' | 'FAILED' = 'CONFIRMED') =>
    request(http) // deliberately no auth header — the platform doesn't carry a user JWT
      .post('/webhooks/payments')
      .send({ intentId, status, providerRef: `TEST-REF-${intentId.slice(0, 6)}`, paidAt: new Date().toISOString() });

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds.getRepository(Merchant).save(
      ds.getRepository(Merchant).create({
        name: `MM Spec ${Date.now()}`, tin: '123-456-789', phone: '+255755000001',
      }),
    );
    merchantId = merchant.id;
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
    token = new StubIdentityService().sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();

    await asOwner(request(http).post('/grns'))
      .send({ locationId: dukaId, lines: [{ productId: cable.id, qty: 100 }] })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  it('e2e: initiate → webhook → payment applied → fiscal receipt issued (verify clause)', async () => {
    const order = await makeOrder();

    // initiate: PENDING intent, nothing in the ledger yet
    const init = await initiate(order.id, 25000).expect(201);
    expect(init.body.status).toBe('PENDING');
    const intentId = init.body.intentId as string;
    expect(intentId).toBeTruthy();
    const pending = await asOwner(request(http).get(`/orders/${order.id}/mobile-money`)).expect(200);
    expect(pending.body.items[0].status).toBe('PENDING');
    expect(await ds.getRepository(Payment).countBy({ orderId: order.id })).toBe(0);

    // webhook confirms → payment auto-applies
    const hook = await confirmViaHttp(intentId).expect(200);
    expect(hook.body.appliedPaymentId).toBeTruthy();

    const payment = await ds
      .getRepository(Payment)
      .findOneByOrFail({ id: hook.body.appliedPaymentId });
    expect(payment.method).toBe('MOBILE_MONEY');
    expect(payment.amountTzs).toBe(25000);
    expect(payment.recordedByUserId).toBe('platform:webhook');
    expect(payment.note).toContain('MPESA');

    const read = await asOwner(request(http).get(`/orders/${order.id}`)).expect(200);
    expect(read.body.totals).toMatchObject({ paidTzs: 25000, balanceTzs: 65000 });

    const intent = await ds.getRepository(PaymentIntent).findOneByOrFail({ intentId });
    expect(intent.status).toBe('CONFIRMED');
    expect(intent.appliedPaymentId).toBe(payment.id);
    expect(intent.resolvedAt).not.toBeNull();

    // …and fiscalizes through the T2.4 queue
    const fiscal = await waitFor(() =>
      ds.getRepository(FiscalReceipt).findOneBy({ paymentId: payment.id }),
    );
    expect(fiscal.vfdNumber).toMatch(/^STUB-VFD-/);
  });

  it('webhook replay is idempotent — one payment, replay flagged', async () => {
    const order = await makeOrder();
    const init = await initiate(order.id, 10000).expect(201);
    await confirmViaHttp(init.body.intentId).expect(200);
    const replay = await confirmViaHttp(init.body.intentId).expect(200);
    expect(replay.body.replay).toBe(true);
    expect(await ds.getRepository(Payment).countBy({ orderId: order.id })).toBe(1);
  });

  it("the stub's auto-confirm loop delivers confirmations platform-style", async () => {
    const order = await makeOrder();
    const init = await initiate(order.id, 5000).expect(201);
    const stub = app.get<StubPaymentsService>(PAYMENTS_SERVICE);
    await stub.confirm(init.body.intentId); // stub → registered handler → same pipeline
    const intent = await ds.getRepository(PaymentIntent).findOneByOrFail({ intentId: init.body.intentId });
    expect(intent.status).toBe('CONFIRMED');
    expect(intent.appliedPaymentId).toBeTruthy();
  });

  it('a FAILED push resolves the intent without touching the ledger', async () => {
    const order = await makeOrder();
    const init = await initiate(order.id, 10000).expect(201);
    await confirmViaHttp(init.body.intentId, 'FAILED').expect(200);
    const intent = await ds.getRepository(PaymentIntent).findOneByOrFail({ intentId: init.body.intentId });
    expect(intent.status).toBe('FAILED');
    expect(intent.appliedPaymentId).toBeNull();
    expect(await ds.getRepository(Payment).countBy({ orderId: order.id })).toBe(0);
    const audit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'PaymentIntent', entityId: intent.id, action: 'MM_PUSH_FAILED' });
    expect(audit).toHaveLength(1);
  });

  it('initiation guards: provider, msisdn, over-balance, quotes; webhook guards: unknown intent, bad status', async () => {
    const order = await makeOrder();
    const bad = await asOwner(request(http).post(`/orders/${order.id}/mobile-money`))
      .send({ provider: 'TIGO', msisdn: '0712345678', amountTzs: 100000 })
      .expect(400);
    const fields = bad.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['provider', 'msisdn']));
    await initiate(order.id, 95000).expect(400); // exceeds balance

    const quote = await asOwner(request(http).post('/orders'))
      .send({ locationId: dukaId, lines: [{ productId: cable.id, qty: 1 }] })
      .expect(201);
    await initiate(quote.body.id, 1000).expect(400);

    await confirmViaHttp('00000000-dead-beef-0000-000000000000').expect(404);
    await request(http).post('/webhooks/payments').send({ intentId: 'x', status: 'MAYBE' }).expect(400);
  });

  it('confirmed money that no longer fits the balance stays visible but unapplied (reconciliation case)', async () => {
    const order = await makeOrder();
    const init = await initiate(order.id, 90000).expect(201); // full balance pushed…
    await asOwner(request(http).post(`/orders/${order.id}/payments`))
      .send({ method: 'CASH', amountTzs: 90000 })
      .expect(201); // …but cash settles while the push is pending
    await confirmViaHttp(init.body.intentId).expect(200);

    const intent = await ds.getRepository(PaymentIntent).findOneByOrFail({ intentId: init.body.intentId });
    expect(intent.status).toBe('CONFIRMED');
    expect(intent.appliedPaymentId).toBeNull(); // money acknowledged, nothing force-applied
    expect(await ds.getRepository(Payment).countBy({ orderId: order.id })).toBe(1); // just the cash
    const audit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'PaymentIntent', entityId: intent.id, action: 'MM_CONFIRMED_UNAPPLIED' });
    expect(audit).toHaveLength(1);
  });
});
