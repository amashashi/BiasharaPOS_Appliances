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
import { Customer } from '../db/entities/customer.entity.js';
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

/** Collect a binary body (supertest parses only known text types). */
const binary = (res: request.Response, cb: (err: Error | null, body: Buffer) => void): void => {
  const chunks: Buffer[] = [];
  res.on('data', (c: Buffer) => chunks.push(c));
  res.on('end', () => cb(null, Buffer.concat(chunks)));
};

/**
 * pdfkit writes text as hex glyph arrays (`<48656c6c6f> Tj`) even uncompressed;
 * with standard WinAnsi fonts the hex bytes ARE the character codes, so
 * decoding every <...> string in stream order recovers the visible text.
 */
const pdfText = (pdf: Buffer): string =>
  (pdf.toString('latin1').match(/<([0-9a-fA-F]+)>/g) ?? [])
    .map((h) => Buffer.from(h.slice(1, -1), 'hex').toString('latin1'))
    .join('');

describe('Sales orders & quotes (T2.1, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let cashierToken: string;
  let deliveryToken: string;
  let otherOwnerToken: string;
  let merchantId: string;
  let dukaId: string;
  let fridge: Product;
  let cable: Product;
  const merchantName = `PdfSpec${Date.now()}`; // single token → greppable in the PDF

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds
      .getRepository(Merchant)
      .save(ds.getRepository(Merchant).create({ name: merchantName, tin: '123-456-789', phone: '+255700000001' }));
    merchantId = merchant.id;
    const other = await ds
      .getRepository(Merchant)
      .save(ds.getRepository(Merchant).create({ name: `Orders other ${Date.now()}`, tin: null, phone: null }));
    dukaId = (
      await ds.getRepository(Location).save(
        ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }),
      )
    ).id;
    fridge = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: null, brand: 'Samsung', model: 'RT38', category: 'Refrigerator',
        taxCode: 'A', priceTzs: 1650000, costTzs: null, active: true, isSerialized: true,
      }),
    );
    cable = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: null, brand: 'Generic', model: 'HDMI', category: 'Accessory',
        taxCode: 'A', priceTzs: 15000, costTzs: null, active: true, isSerialized: false,
      }),
    );

    const mint = new StubIdentityService();
    cashierToken = mint.sign({ sub: 'u-cash', mid: merchantId, name: 'Juma', roles: ['CASHIER'] });
    deliveryToken = mint.sign({ sub: 'u-del', mid: merchantId, name: 'Deo', roles: ['DELIVERY'] });
    otherOwnerToken = mint.sign({ sub: 'u-o2', mid: other.id, name: 'Neema', roles: ['OWNER'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  const asCashier = (r: request.Test) => r.set('Authorization', `Bearer ${cashierToken}`);
  let quoteId: string;

  it('cashier creates a quote with inline customer, catalog + agreed prices, service lines; totals computed', async () => {
    const res = await asCashier(request(http).post('/orders'))
      .send({
        locationId: dukaId,
        customer: { name: 'Mama Ntilie', phone: '+255711111111' },
        lines: [
          { productId: fridge.id, qty: 1, unitPriceTzs: 1600000 }, // negotiated down
          { productId: cable.id, qty: 2 }, // catalog price
        ],
        serviceLines: [
          { kind: 'DELIVERY', priceTzs: 30000, note: 'Mbezi Beach' },
          { kind: 'INSTALLATION', priceTzs: 20000 },
        ],
      })
      .expect(201);
    quoteId = res.body.id;
    expect(res.body.status).toBe('QUOTE');
    expect(res.body.number).toBe(1);
    expect(res.body.numberFormatted).toBe('SO-000001');
    expect(res.body.customer.name).toBe('Mama Ntilie');
    expect(res.body.totals).toEqual({
      linesTzs: 1600000 + 2 * 15000,
      servicesTzs: 50000,
      totalTzs: 1680000,
    });
    const saved = await ds.getRepository(Customer).findOneBy({ merchantId, name: 'Mama Ntilie' });
    expect(saved?.phone).toBe('+255711111111');
  });

  it("type: 'ORDER' is born CONFIRMED and numbers are sequential per merchant", async () => {
    const res = await asCashier(request(http).post('/orders'))
      .send({ locationId: dukaId, type: 'ORDER', lines: [{ productId: cable.id, qty: 1 }] })
      .expect(201);
    expect(res.body.status).toBe('CONFIRMED');
    expect(res.body.number).toBe(2);
    const audit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'SalesOrder', entityId: res.body.id, action: 'ORDER_CREATED' });
    expect(audit).toHaveLength(1);
    expect(audit[0].actorUserId).toBe('u-cash');
  });

  it('lifecycle: quote → confirm → cancel, each audited; illegal transitions 409', async () => {
    const confirmed = await asCashier(request(http).post(`/orders/${quoteId}/confirm`)).expect(200);
    expect(confirmed.body.status).toBe('CONFIRMED');
    const cancelled = await asCashier(request(http).post(`/orders/${quoteId}/cancel`)).expect(200);
    expect(cancelled.body.status).toBe('CANCELLED');

    // terminal: both edges now illegal
    await asCashier(request(http).post(`/orders/${quoteId}/confirm`)).expect(409);
    await asCashier(request(http).post(`/orders/${quoteId}/cancel`)).expect(409);

    const trail = await ds
      .getRepository(AuditEvent)
      .createQueryBuilder('e')
      .where('e.entityId = :id AND e.action LIKE :p', { id: quoteId, p: 'ORDER\\_%' })
      .orderBy('e.at', 'ASC')
      .getMany();
    expect(trail.map((e) => e.action)).toEqual(['ORDER_CONFIRMED', 'ORDER_CANCELLED']);
  });

  it('validation reports per-field errors and creates nothing', async () => {
    const res = await asCashier(request(http).post('/orders'))
      .send({
        type: 'INVOICE',
        locationId: dukaId,
        lines: [{ productId: fridge.id, qty: 0 }, { productId: '11111111-1111-4111-8111-111111111111', qty: 1 }],
        serviceLines: [{ kind: 'SHIPPING', priceTzs: -5 }],
      })
      .expect(400);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(
      expect.arrayContaining(['type', 'lines[0].qty', 'lines[1].productId', 'serviceLines[0].kind']),
    );
    await asCashier(request(http).post('/orders')).send({ locationId: dukaId, lines: [] }).expect(400);
  });

  it('role + merchant scoping: DELIVERY 403; other merchant sees 404', async () => {
    await request(http)
      .get('/orders')
      .set('Authorization', `Bearer ${deliveryToken}`)
      .expect(403);
    await request(http)
      .get(`/orders/${quoteId}`)
      .set('Authorization', `Bearer ${otherOwnerToken}`)
      .expect(404);
  });

  it('quote PDF renders with the merchant branding placeholder (verify clause)', async () => {
    const res = await asCashier(request(http).get(`/orders/${quoteId}/quote.pdf`))
      .buffer(true)
      .parse(binary)
      .expect(200)
      .expect('Content-Type', /application\/pdf/);
    const pdf = res.body as Buffer;
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    const text = pdfText(pdf);
    expect(text).toContain('BiasharaPOS'); // brand wordmark placeholder
    expect(text).toContain('APPLIANCES & ELECTRONICS'); // sub-brand line
    expect(text).toContain(merchantName); // merchant identity
    expect(text).toContain('KADIRIO'); // bilingual title
    expect(text).toContain('SO-000001');
    expect(text).toContain('1,680,000'); // grand total, tabular TZS
  });

  it('list filters by status and formats numbers', async () => {
    const res = await asCashier(request(http).get('/orders?status=CONFIRMED')).expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].numberFormatted).toBe('SO-000002');
  });
});
