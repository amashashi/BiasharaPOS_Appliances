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
import { PaymentWebhookEvent } from '../db/entities/payment-webhook-event.entity.js';
import { AuditEvent } from '../db/entities/audit-event.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { OrdersModule } from './orders.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
process.env.FISCAL_QUEUE_NAME = `fiscal-recon-test-${Date.now()}`;

@Module({
  imports: [DbModule, PlatformModule, OrdersModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('Reconciliation queue (T5.3a, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let ownerToken: string;
  let cashierToken: string;
  let otherOwnerToken: string;
  let merchantId: string;
  let dukaId: string;
  let cable: Product;

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${ownerToken}`);

  /** Push the full balance, settle it in cash, then confirm — the D-027 unapplied case. */
  const makeUnappliedItem = async (): Promise<string> => {
    const order = await asOwner(request(http).post('/orders'))
      .send({ type: 'ORDER', locationId: dukaId, lines: [{ productId: cable.id, qty: 4 }], serviceLines: [{ kind: 'DELIVERY', priceTzs: 30000 }] })
      .expect(201);
    const orderId = order.body.id as string;
    const init = await asOwner(request(http).post(`/orders/${orderId}/mobile-money`))
      .send({ provider: 'MPESA', msisdn: '+255712345678', amountTzs: 90000 })
      .expect(201);
    await asOwner(request(http).post(`/orders/${orderId}/payments`))
      .send({ method: 'CASH', amountTzs: 90000 })
      .expect(201);
    await request(http)
      .post('/webhooks/payments')
      .send({ intentId: init.body.intentId, status: 'CONFIRMED', providerRef: 'REF-RECON', paidAt: new Date().toISOString() })
      .expect(200);
    return orderId;
  };

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize();

    const merchant = await ds.getRepository(Merchant).save(
      ds.getRepository(Merchant).create({ name: `Recon Spec ${Date.now()}`, tin: null, phone: null }),
    );
    merchantId = merchant.id;
    const other = await ds.getRepository(Merchant).save(
      ds.getRepository(Merchant).create({ name: `Recon Other ${Date.now()}`, tin: null, phone: null }),
    );
    dukaId = (await ds.getRepository(Location).save(ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }))).id;
    cable = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: null, brand: 'Generic', model: 'HDMI', category: 'Accessory',
        taxCode: 'A', priceTzs: 15000, costTzs: null, active: true, isSerialized: false,
      }),
    );
    const mint = new StubIdentityService();
    ownerToken = mint.sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });
    cashierToken = mint.sign({ sub: 'u-cash', mid: merchantId, name: 'Cash', roles: ['CASHIER'] });
    otherOwnerToken = mint.sign({ sub: 'u-other', mid: other.id, name: 'Bibi', roles: ['OWNER'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
    await asOwner(request(http).post('/grns')).send({ locationId: dukaId, lines: [{ productId: cable.id, qty: 200 }] }).expect(201);
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  it('an unapplied confirmation lands in the reconciliation view; resolving clears it (verify clause)', async () => {
    const orderId = await makeUnappliedItem();

    const list = await asOwner(request(http).get('/reconciliation')).expect(200);
    const row = list.body.items.find((i: { order: { id: string } | null }) => i.order?.id === orderId);
    expect(row).toBeTruthy();
    expect(row.reason).toBe('UNAPPLIED_BALANCE');
    expect(row.amountTzs).toBe(90000);
    expect(row.provider).toBe('MPESA');
    expect(row.order.numberFormatted).toMatch(/^SO-\d{6}$/);
    expect(list.body.totalTzs).toBeGreaterThanOrEqual(90000);

    // resolve requires a note
    await asOwner(request(http).post(`/reconciliation/${row.id}/resolve`)).send({}).expect(400);
    // resolve with a note clears it and audits
    await asOwner(request(http).post(`/reconciliation/${row.id}/resolve`))
      .send({ note: 'Refunded via M-Pesa reversal, ticket 4412' })
      .expect(200);
    const after = await asOwner(request(http).get('/reconciliation')).expect(200);
    expect(after.body.items.find((i: { id: string }) => i.id === row.id)).toBeUndefined();
    const audit = await ds.getRepository(AuditEvent).findBy({ entityType: 'PaymentWebhookEvent', entityId: row.id, action: 'RECONCILIATION_RESOLVED' });
    expect(audit).toHaveLength(1);
    // double-resolve is rejected
    await asOwner(request(http).post(`/reconciliation/${row.id}/resolve`)).send({ note: 'again' }).expect(400);
  });

  it('scoping: CASHIER 403, another merchant never sees it, unknown id 404', async () => {
    const orderId = await makeUnappliedItem();
    const list = await asOwner(request(http).get('/reconciliation')).expect(200);
    const row = list.body.items.find((i: { order: { id: string } | null }) => i.order?.id === orderId);
    expect(row).toBeTruthy();

    // CASHIER cannot reach the reconciliation queue at all
    await request(http).get('/reconciliation').set('Authorization', `Bearer ${cashierToken}`).expect(403);
    // another merchant's OWNER doesn't see this row and can't resolve it
    const otherList = await request(http).get('/reconciliation').set('Authorization', `Bearer ${otherOwnerToken}`).expect(200);
    expect(otherList.body.items.find((i: { id: string }) => i.id === row.id)).toBeUndefined();
    await request(http).post(`/reconciliation/${row.id}/resolve`).set('Authorization', `Bearer ${otherOwnerToken}`).send({ note: 'x' }).expect(404);
    // and it's still open for the real owner
    expect((await ds.getRepository(PaymentWebhookEvent).findOneByOrFail({ id: row.id })).resolvedAt).toBeNull();
    // unknown id → 404
    await asOwner(request(http).post('/reconciliation/11111111-2222-3333-4444-555555555555/resolve')).send({ note: 'x' }).expect(404);
  });
});
