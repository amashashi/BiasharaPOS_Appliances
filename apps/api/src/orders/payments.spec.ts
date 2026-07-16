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
import { AuditEvent } from '../db/entities/audit-event.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { OrdersModule } from './orders.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';

@Module({
  imports: [DbModule, PlatformModule, OrdersModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('Payments on orders (T2.3, real Postgres)', () => {
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
    return res.body as { id: string; totals: { totalTzs: number } };
  };
  const pay = (orderId: string, amountTzs: number) =>
    asOwner(request(http).post(`/orders/${orderId}/payments`)).send({ method: 'CASH', amountTzs });

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds
      .getRepository(Merchant)
      .save(ds.getRepository(Merchant).create({ name: `Pay Spec ${Date.now()}`, tin: null, phone: null }));
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
      .send({ locationId: dukaId, lines: [{ productId: cable.id, qty: 50 }] })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  it('ledger: deposit + balance = total (verify clause)', async () => {
    const order = await makeOrder();
    expect(order.totals.totalTzs).toBe(90000);

    const res = await pay(order.id, 25000).expect(201);
    expect(res.body.payment.method).toBe('CASH');
    expect(res.body.summary).toEqual({ totalTzs: 90000, paidTzs: 25000, balanceTzs: 65000 });
    expect(res.body.summary.paidTzs + res.body.summary.balanceTzs).toBe(order.totals.totalTzs);

    const audit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'Payment', entityId: res.body.payment.id, action: 'PAYMENT_RECORDED' });
    expect(audit).toHaveLength(1);
    expect((audit[0].after as { kind: string }).kind).toBe('DEPOSIT');

    // order reads carry the ledger view
    const read = await asOwner(request(http).get(`/orders/${order.id}`)).expect(200);
    expect(read.body.totals).toMatchObject({ paidTzs: 25000, balanceTzs: 65000 });

    // settle the rest — audited as FULL_SETTLEMENT; still CONFIRMED (not fulfilled → not closed)
    const settle = await pay(order.id, 65000).expect(201);
    expect(settle.body.summary.balanceTzs).toBe(0);
    const settleAudit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'Payment', entityId: settle.body.payment.id, action: 'PAYMENT_RECORDED' });
    expect((settleAudit[0].after as { kind: string }).kind).toBe('FULL_SETTLEMENT');
    const after = await asOwner(request(http).get(`/orders/${order.id}`)).expect(200);
    expect(after.body.status).toBe('CONFIRMED');
  });

  it('overpayment is rejected naming the balance; nothing lands in the ledger', async () => {
    const order = await makeOrder();
    await pay(order.id, 50000).expect(201);
    const res = await pay(order.id, 50000).expect(400);
    expect(res.body.errors[0].message).toContain('exceeds the balance of TZS 40,000');
    const count = await ds.getRepository(Payment).countBy({ orderId: order.id });
    expect(count).toBe(1);
  });

  it('correction produces a reversing entry, never a mutation (verify clause) — and the DB forbids mutation outright', async () => {
    const order = await makeOrder();
    const paid = await pay(order.id, 90000).expect(201);
    const originalId = paid.body.payment.id as string;

    const rev = await asOwner(
      request(http).post(`/orders/${order.id}/payments/${originalId}/reverse`),
    )
      .send({ reason: 'cashier keyed the wrong order' })
      .expect(200);
    expect(rev.body.payment.amountTzs).toBe(-90000);
    expect(rev.body.payment.reversesPaymentId).toBe(originalId);
    expect(rev.body.summary).toEqual({ totalTzs: 90000, paidTzs: 0, balanceTzs: 90000 });

    // the original row is byte-for-byte untouched
    const original = await ds.getRepository(Payment).findOneByOrFail({ id: originalId });
    expect(original.amountTzs).toBe(90000);
    expect(original.reversesPaymentId).toBeNull();

    // and the ledger is append-only at the database level
    await expect(
      ds.query(`UPDATE payments SET "amountTzs" = 1 WHERE id = $1`, [originalId]),
    ).rejects.toThrow(/append-only/);
    await expect(ds.query(`DELETE FROM payments WHERE id = $1`, [originalId])).rejects.toThrow(
      /append-only/,
    );

    // a payment reverses at most once; reversals can't be reversed
    await asOwner(request(http).post(`/orders/${order.id}/payments/${originalId}/reverse`))
      .send({})
      .expect(409);
    await asOwner(
      request(http).post(`/orders/${order.id}/payments/${rev.body.payment.id}/reverse`),
    )
      .send({})
      .expect(400);

    // the freed balance is payable again
    await pay(order.id, 90000).expect(201);
  });

  it('payment guards: quotes, cancelled orders, bad amounts, non-cash methods', async () => {
    const quote = await asOwner(request(http).post('/orders'))
      .send({ locationId: dukaId, lines: [{ productId: cable.id, qty: 1 }] })
      .expect(201);
    const q = await pay(quote.body.id, 1000).expect(400);
    expect(q.body.message).toContain('QUOTE');

    const order = await makeOrder();
    await asOwner(request(http).post(`/orders/${order.id}/cancel`)).expect(200);
    await pay(order.id, 1000).expect(400);

    const order2 = await makeOrder();
    await pay(order2.id, 0).expect(400);
    await pay(order2.id, -5).expect(400);
    await pay(order2.id, 12.5).expect(400);
    await asOwner(request(http).post(`/orders/${order2.id}/payments`))
      .send({ method: 'MOBILE_MONEY', amountTzs: 1000 })
      .expect(400);
  });

  it('fully fulfilled + fully paid auto-closes the order', async () => {
    const order = await makeOrder();
    await asOwner(request(http).post(`/orders/${order.id}/fulfill`)).send({}).expect(200);
    const res = await pay(order.id, 90000).expect(201);
    expect(res.body.summary.balanceTzs).toBe(0);
    const read = await asOwner(request(http).get(`/orders/${order.id}`)).expect(200);
    expect(read.body.status).toBe('CLOSED');
    const closed = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'SalesOrder', entityId: order.id, action: 'ORDER_CLOSED' });
    expect(closed).toHaveLength(1);
  });

  it('payment listing returns the ledger in insertion order with reversal linkage', async () => {
    const order = await makeOrder();
    const p1 = await pay(order.id, 40000).expect(201);
    await asOwner(request(http).post(`/orders/${order.id}/payments/${p1.body.payment.id}/reverse`))
      .send({ reason: 'redo' })
      .expect(200);
    await pay(order.id, 90000).expect(201);

    const res = await asOwner(request(http).get(`/orders/${order.id}/payments`)).expect(200);
    expect(res.body.items.map((p: { amountTzs: number }) => p.amountTzs)).toEqual([
      40000, -40000, 90000,
    ]);
    expect(res.body.items[1].reversesPaymentId).toBe(p1.body.payment.id);
    expect(res.body.summary).toEqual({ totalTzs: 90000, paidTzs: 90000, balanceTzs: 0 });
  });
});
