import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import 'reflect-metadata';
import { INestApplication, Module } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { createDataSource } from '../db/data-source.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { Location } from '../db/entities/location.entity.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { Payment } from '../db/entities/payment.entity.js';
import { FiscalReceipt } from '../db/entities/fiscal-receipt.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { FiscalController } from './fiscal.controller.js';
import { FiscalAgingService } from './fiscal-aging.service.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
process.env.FISCAL_TRA_WINDOW_HOURS = '24';

@Module({
  imports: [DbModule, PlatformModule],
  controllers: [FiscalController],
  providers: [FiscalAgingService, { provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

const HOUR = 3_600_000;

describe('Fiscal aging alert (T5.7, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let ownerToken: string;
  let cashierToken: string;
  let merchantId: string;
  let locationId: string;
  let orderSeq = 1000;

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${ownerToken}`);

  /** Directly append a payment at a chosen collection time; optionally mark it fiscalized. */
  const seedPayment = async (opts: { occurredAt: Date; amountTzs?: number; fiscalized?: boolean }): Promise<string> => {
    const order = await ds.getRepository(SalesOrder).save(
      ds.getRepository(SalesOrder).create({
        merchantId, number: orderSeq++, status: 'CONFIRMED', customerId: null, locationId, note: null, createdByUserId: 'u-owner', clientRef: null,
      }),
    );
    const payment = await ds.getRepository(Payment).save(
      ds.getRepository(Payment).create({
        merchantId, orderId: order.id, method: 'CASH', amountTzs: opts.amountTzs ?? 50000,
        reversesPaymentId: null, note: null, recordedByUserId: 'u-owner', occurredAt: opts.occurredAt,
      }),
    );
    if (opts.fiscalized) {
      await ds.getRepository(FiscalReceipt).save(
        ds.getRepository(FiscalReceipt).create({
          merchantId, paymentId: payment.id, vfdNumber: 'VFD-1', verificationCode: 'V-1', qrUrl: 'https://x', issuedAt: new Date(),
        }),
      );
    }
    return payment.id;
  };

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize();
    const merchant = await ds.getRepository(Merchant).save(ds.getRepository(Merchant).create({ name: `Aging ${Date.now()}`, tin: null, phone: null }));
    merchantId = merchant.id;
    locationId = (await ds.getRepository(Location).save(ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }))).id;
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

  it('lists un-fiscalized payments older than the TRA window; excludes fresh, fiscalized, and reversals (verify clause)', async () => {
    const overduePayId = await seedPayment({ occurredAt: new Date(Date.now() - 48 * HOUR) }); // 48h old, no receipt → OVERDUE
    await seedPayment({ occurredAt: new Date(Date.now() - 1 * HOUR) }); // 1h old → within window
    await seedPayment({ occurredAt: new Date(Date.now() - 72 * HOUR), fiscalized: true }); // old but fiscalized
    await seedPayment({ occurredAt: new Date(Date.now() - 72 * HOUR), amountTzs: -50000 }); // reversal — never fiscalizes

    const res = await asOwner(request(http).get('/fiscal/aging')).expect(200);
    expect(res.body.windowHours).toBe(24);
    expect(res.body.count).toBe(1);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].paymentId).toBe(overduePayId);
    expect(res.body.items[0].ageHours).toBeGreaterThanOrEqual(47);
    expect(res.body.items[0].orderNumber).toMatch(/^SO-\d{6}$/);
    expect(res.body.oldestAgeHours).toBeGreaterThanOrEqual(47);
  });

  it('an outage that clears (receipt arrives) drops the payment from the alert', async () => {
    const payId = await seedPayment({ occurredAt: new Date(Date.now() - 30 * HOUR) });
    let res = await asOwner(request(http).get('/fiscal/aging')).expect(200);
    expect(res.body.items.some((i: { paymentId: string }) => i.paymentId === payId)).toBe(true);

    // the fiscal service recovers and the queue finally issues the receipt
    await ds.getRepository(FiscalReceipt).save(
      ds.getRepository(FiscalReceipt).create({ merchantId, paymentId: payId, vfdNumber: 'VFD-2', verificationCode: 'V-2', qrUrl: 'https://x', issuedAt: new Date() }),
    );
    res = await asOwner(request(http).get('/fiscal/aging')).expect(200);
    expect(res.body.items.some((i: { paymentId: string }) => i.paymentId === payId)).toBe(false);
  });

  it('scoping: CASHIER is rejected; another merchant never sees the overdue payment', async () => {
    await seedPayment({ occurredAt: new Date(Date.now() - 48 * HOUR) });
    await request(http).get('/fiscal/aging').set('Authorization', `Bearer ${cashierToken}`).expect(403);

    const otherMerchant = await ds.getRepository(Merchant).save(ds.getRepository(Merchant).create({ name: `Other ${Date.now()}`, tin: null, phone: null }));
    const otherToken = new StubIdentityService().sign({ sub: 'u-o', mid: otherMerchant.id, name: 'Bi', roles: ['OWNER'] });
    const res = await request(http).get('/fiscal/aging').set('Authorization', `Bearer ${otherToken}`).expect(200);
    expect(res.body.count).toBe(0);
  });
});
