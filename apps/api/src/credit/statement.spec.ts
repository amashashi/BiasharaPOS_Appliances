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
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CreditModule } from './credit.module.js';
import { binaryParser, pdfText } from '../testkit/pdf.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
process.env.ARREARS_CRON = 'off';
process.env.REMINDERS_CRON = 'off';
process.env.FISCAL_QUEUE_NAME = `fiscal-statement-test-${Date.now()}`;

@Module({
  imports: [DbModule, PlatformModule, CreditModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

/** Every `TZS 1,234,567` amount in the decoded PDF text. */
const tzsAmounts = (text: string): number[] =>
  [...text.matchAll(/TZS ([\d,]+)/g)].map((m) => Number(m[1].replace(/,/g, '')));

describe('Customer statement (T3.5, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let token: string;
  let otherToken: string;
  let merchantId: string;
  let dukaId: string;
  let fridge: Product;
  const merchantName = `StmtSpec${Date.now()}`; // single token → greppable

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds.getRepository(Merchant).save(
      ds.getRepository(Merchant).create({ name: merchantName, tin: '111-222-333', phone: '+255755000009' }),
    );
    merchantId = merchant.id;
    const other = await ds.getRepository(Merchant).save(
      ds.getRepository(Merchant).create({ name: `Other ${Date.now()}`, tin: null, phone: null }),
    );
    dukaId = (
      await ds.getRepository(Location).save(
        ds.getRepository(Location).create({ merchantId, name: 'Kariakoo', kind: 'SHOP' }),
      )
    ).id;
    fridge = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: null, brand: 'LG', model: 'GN-B422', category: 'Refrigerator',
        taxCode: 'A', priceTzs: 1720000, costTzs: null, active: true, isSerialized: false,
      }),
    );
    token = new StubIdentityService().sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });
    otherToken = new StubIdentityService().sign({ sub: 'u-o2', mid: other.id, name: 'Neema', roles: ['OWNER'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  /**
   * Order 1,750,000 (fridge + 30k delivery), deposit 550,000 → financed
   * 1,200,000, INSTALLMENT 4×300,000. Then pay 300k, pay 300k, reverse the
   * second 300k. Ledger truth: paid = 550k + 300k + 300k − 300k = 850,000;
   * balance = 1,750,000 − 850,000 = 900,000.
   */
  const makeScenario = async (): Promise<string> => {
    const order = await asOwner(request(http).post('/orders'))
      .send({
        type: 'ORDER',
        locationId: dukaId,
        customer: { name: 'Mama Zawadi', phone: '+255713222333' },
        lines: [{ productId: fridge.id, qty: 1 }],
        serviceLines: [{ kind: 'DELIVERY', priceTzs: 30000 }],
      })
      .expect(201);
    const orderId = order.body.id as string;
    await asOwner(request(http).post(`/orders/${orderId}/payments`)).send({ method: 'CASH', amountTzs: 550000 }).expect(201);
    await asOwner(request(http).post(`/orders/${orderId}/credit-agreement`))
      .send({ type: 'INSTALLMENT', schedule: { months: 4, firstDueDate: '2026-08-05' } })
      .expect(201);
    await asOwner(request(http).post(`/orders/${orderId}/payments`)).send({ method: 'CASH', amountTzs: 300000 }).expect(201);
    const p2 = await asOwner(request(http).post(`/orders/${orderId}/payments`)).send({ method: 'CASH', amountTzs: 300000 }).expect(201);
    await asOwner(request(http).post(`/orders/${orderId}/payments/${p2.body.payment.id}/reverse`))
      .send({ reason: 'keyed twice' })
      .expect(200);
    return orderId;
  };

  it('renders a PDF whose totals equal the ledger (verify clause)', async () => {
    const orderId = await makeScenario();

    // ledger truth from the API the rest of the app trusts
    const agr = await asOwner(request(http).get(`/orders/${orderId}/credit-agreement`)).expect(200);
    expect(agr.body.principalTzs).toBe(1750000);

    const res = await asOwner(request(http).get(`/orders/${orderId}/statement.pdf`))
      .buffer(true)
      .parse(binaryParser)
      .expect(200)
      .expect('Content-Type', /application\/pdf/);
    const pdf = res.body as Buffer;
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    const text = pdfText(pdf);

    // brand + parties + section headers
    expect(text).toContain('BiasharaPOS');
    expect(text).toContain(merchantName);
    expect(text).toContain('TAARIFA YA MKOPO / CREDIT STATEMENT');
    expect(text).toContain('SO-000001');
    expect(text).toContain('Mama Zawadi');
    expect(text).toContain('PAYMENT SCHEDULE');
    expect(text).toContain('PAYMENT HISTORY');
    expect(text).toContain('Marejesho / Reversal'); // the reversal is shown

    // the numbers that MUST equal the ledger
    const amounts = tzsAmounts(text);
    expect(amounts).toContain(1750000); // principal
    expect(amounts).toContain(550000); // deposit
    expect(amounts).toContain(850000); // TOTAL PAID (net of reversal)
    expect(amounts).toContain(900000); // BALANCE DUE
    // schedule sums to the financed amount (deposit + schedule = principal)
    expect(agr.body.scheduleTotalTzs + agr.body.depositTzs).toBe(agr.body.principalTzs);
  });

  it('a fully-settled agreement shows zero balance', async () => {
    const order = await asOwner(request(http).post('/orders'))
      .send({
        type: 'ORDER', locationId: dukaId, customer: { name: 'Bwana Kamili' },
        lines: [{ productId: fridge.id, qty: 1 }],
      })
      .expect(201);
    const orderId = order.body.id as string;
    await asOwner(request(http).post(`/orders/${orderId}/payments`)).send({ method: 'CASH', amountTzs: 720000 }).expect(201);
    await asOwner(request(http).post(`/orders/${orderId}/credit-agreement`))
      .send({ type: 'INSTALLMENT', schedule: { months: 2, firstDueDate: '2026-08-05' } }) // financed 1,000,000
      .expect(201);
    await asOwner(request(http).post(`/orders/${orderId}/payments`)).send({ method: 'CASH', amountTzs: 1000000 }).expect(201);

    const res = await asOwner(request(http).get(`/orders/${orderId}/statement.pdf`))
      .buffer(true).parse(binaryParser).expect(200);
    const amounts = tzsAmounts(pdfText(res.body as Buffer));
    expect(amounts).toContain(1720000); // total paid
    expect(amounts).toContain(0); // balance due
  });

  it('404 when the order has no agreement, and merchant-scoped', async () => {
    const noAgreement = await asOwner(request(http).post('/orders'))
      .send({ type: 'ORDER', locationId: dukaId, lines: [{ productId: fridge.id, qty: 1 }] })
      .expect(201);
    await asOwner(request(http).get(`/orders/${noAgreement.body.id}/statement.pdf`)).expect(404);

    const mine = await makeScenario();
    await request(http)
      .get(`/orders/${mine}/statement.pdf`)
      .set('Authorization', `Bearer ${otherToken}`)
      .expect(404); // another merchant can't read it
  });
});
