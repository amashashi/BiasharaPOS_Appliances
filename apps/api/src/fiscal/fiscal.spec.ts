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
import { FiscalReceipt } from '../db/entities/fiscal-receipt.entity.js';
import { AuditEvent } from '../db/entities/audit-event.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { FISCAL_SERVICE } from '../platform/tokens.js';
import { StubFiscalService } from '../platform/stubs/fiscal.stub.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { OrdersModule } from '../orders/orders.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
// isolated queue per run (Redis persists across runs) + fast retries for the outage test
process.env.FISCAL_QUEUE_NAME = `fiscal-test-${Date.now()}`;
process.env.FISCAL_BACKOFF_MS = '100';
process.env.FISCAL_MAX_ATTEMPTS = '6';

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

describe('Fiscal integration point (T2.4, real Postgres + real Redis)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let token: string;
  let merchantId: string;
  let dukaId: string;
  let cable: Product;

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);
  const makeOrder = async () => {
    const res = await asOwner(request(http).post('/orders'))
      .send({
        type: 'ORDER',
        locationId: dukaId,
        customer: { name: 'Bibi Salma', phone: '+255713000111' },
        lines: [{ productId: cable.id, qty: 4 }],
        serviceLines: [{ kind: 'DELIVERY', priceTzs: 30000 }],
      })
      .expect(201);
    return res.body as { id: string };
  };
  const pay = async (orderId: string, amountTzs: number) => {
    const res = await asOwner(request(http).post(`/orders/${orderId}/payments`))
      .send({ method: 'CASH', amountTzs })
      .expect(201);
    return res.body.payment as { id: string };
  };
  const receiptRow = (paymentId: string) => () =>
    ds.getRepository(FiscalReceipt).findOneBy({ paymentId });

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds.getRepository(Merchant).save(
      ds.getRepository(Merchant).create({
        name: `Fiscal Spec ${Date.now()}`, tin: '123-456-789', phone: '+255755000001',
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

  it('payment → fiscal receipt with a stub VFD number (verify clause); full payment itemizes the order', async () => {
    const order = await makeOrder();
    const payment = await pay(order.id, 90000); // full total in one payment

    const fiscal = await waitFor(receiptRow(payment.id));
    expect(fiscal.vfdNumber).toMatch(/^STUB-VFD-\d{8}$/);
    expect(fiscal.verificationCode).toMatch(/^VC/);
    expect(fiscal.qrUrl).toContain('verify.tra.go.tz');

    const audit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'FiscalReceipt', entityId: payment.id, action: 'FISCAL_ISSUED' });
    expect(audit).toHaveLength(1);
    expect((audit[0].after as { attempts: number }).attempts).toBe(1);
  });

  it('receipt renders as printable HTML with VFD number + QR, and reprint works (verify clause)', async () => {
    const order = await makeOrder();
    const payment = await pay(order.id, 90000);
    const fiscal = await waitFor(receiptRow(payment.id));

    const first = await asOwner(
      request(http).get(`/orders/${order.id}/payments/${payment.id}/receipt`),
    )
      .expect(200)
      .expect('Content-Type', /text\/html/);
    expect(first.text).toContain(fiscal.vfdNumber);
    expect(first.text).toContain(fiscal.verificationCode);
    expect(first.text).toContain('<svg'); // the TRA QR, inlined
    expect(first.text).toContain('RISITI YA KODI / FISCAL RECEIPT');
    expect(first.text).toContain('Generic HDMI'); // full payment itemizes lines
    expect(first.text).toContain('Bibi Salma');

    // reprint: same document again
    const second = await asOwner(
      request(http).get(`/orders/${order.id}/payments/${payment.id}/receipt`),
    ).expect(200);
    expect(second.text).toBe(first.text);
  });

  it('a forced fiscal outage retries and succeeds (verify clause)', async () => {
    const stub = app.get<StubFiscalService>(FISCAL_SERVICE);
    stub.failNext(2); // two TRA outages, then recovery

    const order = await makeOrder();
    const payment = await pay(order.id, 25000); // deposit
    const fiscal = await waitFor(receiptRow(payment.id), 15_000);
    expect(fiscal.vfdNumber).toMatch(/^STUB-VFD-/);

    const audit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'FiscalReceipt', entityId: payment.id, action: 'FISCAL_ISSUED' });
    expect((audit[0].after as { attempts: number }).attempts).toBe(3); // failed twice, succeeded third

    // deposits fiscalize as a summary line, not itemized
    const html = await asOwner(
      request(http).get(`/orders/${order.id}/payments/${payment.id}/receipt`),
    ).expect(200);
    expect(html.text).toContain('(deposit)');
  });

  it('reversals never fiscalize; unfiscalized payments 404 with a helpful message', async () => {
    const order = await makeOrder();
    const payment = await pay(order.id, 90000);
    await waitFor(receiptRow(payment.id));

    const rev = await asOwner(
      request(http).post(`/orders/${order.id}/payments/${payment.id}/reverse`),
    )
      .send({ reason: 'test' })
      .expect(200);
    await new Promise((r) => setTimeout(r, 600)); // give the worker a chance to (wrongly) act
    expect(await ds.getRepository(FiscalReceipt).findOneBy({ paymentId: rev.body.payment.id })).toBeNull();

    const res = await asOwner(
      request(http).get(`/orders/${order.id}/payments/${rev.body.payment.id}/receipt`),
    ).expect(404);
    expect(res.body.message).toContain('fiscal queue');
  });
});
