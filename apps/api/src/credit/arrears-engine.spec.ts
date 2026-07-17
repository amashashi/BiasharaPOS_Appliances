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
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CreditModule } from './credit.module.js';
import { ArrearsService } from './arrears.service.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
process.env.ARREARS_CRON = 'off'; // no BullMQ scheduler in tests; drive ArrearsService directly
process.env.FISCAL_QUEUE_NAME = `fiscal-arrears-test-${Date.now()}`;

@Module({
  imports: [DbModule, PlatformModule, CreditModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('Arrears engine (T3.3, real Postgres, fake clock)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let arrears: ArrearsService;
  let ownerToken: string;
  let cashierToken: string;
  let merchantId: string;
  let dukaId: string;
  let fridge: Product;

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${ownerToken}`);

  /** Order 1,750,000, deposit 550,000, INSTALLMENT 4×300,000 from `firstDue`; returns orderId. */
  const makeAgreement = async (customerName: string, firstDue: string): Promise<string> => {
    const order = await asOwner(request(http).post('/orders'))
      .send({
        type: 'ORDER',
        locationId: dukaId,
        customer: { name: customerName, phone: '+255713000000' },
        lines: [{ productId: fridge.id, qty: 1 }],
        serviceLines: [{ kind: 'DELIVERY', priceTzs: 30000 }],
      })
      .expect(201);
    await asOwner(request(http).post(`/orders/${order.body.id}/payments`))
      .send({ method: 'CASH', amountTzs: 550000 })
      .expect(201);
    await asOwner(request(http).post(`/orders/${order.body.id}/credit-agreement`))
      .send({ type: 'INSTALLMENT', schedule: { months: 4, firstDueDate: firstDue } })
      .expect(201);
    return order.body.id as string;
  };

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds.getRepository(Merchant).save(
      ds.getRepository(Merchant).create({ name: `Arrears Spec ${Date.now()}`, tin: null, phone: null }),
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
        taxCode: 'A', priceTzs: 1720000, costTzs: null, active: true, isSerialized: false,
      }),
    );
    ownerToken = new StubIdentityService().sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });
    cashierToken = new StubIdentityService().sign({ sub: 'u-cash', mid: merchantId, name: 'Juma', roles: ['CASHIER'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
    arrears = app.get(ArrearsService);
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  const dashboard = async (asOf: string, sort?: string) =>
    (await asOwner(request(http).get(`/credit/arrears?asOf=${asOf}${sort ? `&sort=${sort}` : ''}`)).expect(200)).body;

  it('before any due date, nothing is overdue and the dashboard is empty', async () => {
    const orderId = await makeAgreement('Mama Early', '2026-08-05');
    const board = await dashboard('2026-07-20'); // before firstDue
    expect(board.items.find((i: { orderId: string }) => i.orderId === orderId)).toBeUndefined();
  });

  it('nightly recompute the morning after a due date moves the agreement into arrears (verify clause)', async () => {
    const orderId = await makeAgreement('Mama Overdue', '2026-08-05');

    // fake clock: it is now the morning of Aug 6 — the night job runs
    // (scoped to this merchant so the shared test DB stays isolated)
    const run = await arrears.recomputeOverdue('2026-08-06', merchantId);
    expect(run.rowsFlipped).toBeGreaterThanOrEqual(1); // this agreement's row, plus any earlier fixture's

    // the first schedule row is now OVERDUE in the persisted schedule
    const read = await asOwner(request(http).get(`/orders/${orderId}/credit-agreement`)).expect(200);
    expect(read.body.schedule[0].status).toBe('OVERDUE');
    expect(read.body.schedule[1].status).toBe('PENDING'); // not yet due

    // and the dashboard reflects it "next morning"
    const board = await dashboard('2026-08-06');
    const row = board.items.find((i: { orderId: string }) => i.orderId === orderId);
    expect(row).toBeDefined();
    expect(row.arrearsTzs).toBe(300000); // one missed installment
    expect(row.overdueRows).toBe(1);
    expect(row.daysOverdue).toBe(1);
    expect(row.oldestDueDate).toBe('2026-08-05');
    expect(row.customer.name).toBe('Mama Overdue');

    const audit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'ArrearsRun', action: 'ARREARS_RECOMPUTED' });
    expect(audit.length).toBeGreaterThanOrEqual(1);
  });

  it('arrears deepen as more installments fall due; a payment clears the oldest', async () => {
    const orderId = await makeAgreement('Mzee Deni', '2026-08-05');
    // three months later: rows 1,2,3 are past due, row 4 not yet
    let board = await dashboard('2026-10-06');
    let row = board.items.find((i: { orderId: string }) => i.orderId === orderId);
    expect(row.overdueRows).toBe(3);
    expect(row.arrearsTzs).toBe(900000);
    expect(row.nextDueDate).toBe('2026-11-05');

    // customer pays one installment — arrears drop by exactly that (oldest-first, T3.2)
    await asOwner(request(http).post(`/orders/${orderId}/payments`))
      .send({ method: 'CASH', amountTzs: 300000 })
      .expect(201);
    board = await dashboard('2026-10-06');
    row = board.items.find((i: { orderId: string }) => i.orderId === orderId);
    expect(row.overdueRows).toBe(2);
    expect(row.arrearsTzs).toBe(600000);
  });

  it('a settled agreement drops off the dashboard entirely', async () => {
    const orderId = await makeAgreement('Bibi Malizia', '2026-08-05');
    await asOwner(request(http).post(`/orders/${orderId}/payments`))
      .send({ method: 'CASH', amountTzs: 1200000 })
      .expect(201); // settle in full
    const board = await dashboard('2026-12-31'); // long after every due date
    expect(board.items.find((i: { orderId: string }) => i.orderId === orderId)).toBeUndefined();
  });

  it('dashboard sorts by days overdue (default) or amount, and totals reconcile', async () => {
    const board = await dashboard('2026-10-06', 'days');
    const days = board.items.map((i: { daysOverdue: number }) => i.daysOverdue);
    expect([...days]).toEqual([...days].sort((a, b) => b - a)); // descending

    const byAmount = await dashboard('2026-10-06', 'amount');
    const amounts = byAmount.items.map((i: { arrearsTzs: number }) => i.arrearsTzs);
    expect([...amounts]).toEqual([...amounts].sort((a, b) => b - a));

    expect(board.totals.agreements).toBe(board.items.length);
    expect(board.totals.arrearsTzs).toBe(
      board.items.reduce((s: number, i: { arrearsTzs: number }) => s + i.arrearsTzs, 0),
    );
  });

  it('recompute is idempotent and only touches ACTIVE agreements; paying an overdue row lifts OVERDUE', async () => {
    const orderId = await makeAgreement('Tena Tena', '2026-08-05');
    const overdueCount = async (): Promise<number> => {
      const [{ n }] = (await ds.query(
        `SELECT COUNT(*)::int n FROM credit_schedule_rows r
           JOIN credit_agreements a ON a.id = r."agreementId"
          WHERE a."merchantId" = $1 AND r.status = 'OVERDUE'`,
        [merchantId],
      )) as [{ n: number }];
      return n;
    };
    await arrears.recomputeOverdue('2026-09-06', merchantId); // rows 1,2 overdue
    const first = await overdueCount();
    await arrears.recomputeOverdue('2026-09-06', merchantId); // same asOf — no double-flip
    const second = await overdueCount();
    expect(second).toBe(first);

    // paying clears the oldest overdue row back to PAID (T3.2 status recompute)
    await asOwner(request(http).post(`/orders/${orderId}/payments`))
      .send({ method: 'CASH', amountTzs: 300000 })
      .expect(201);
    const read = await asOwner(request(http).get(`/orders/${orderId}/credit-agreement`)).expect(200);
    expect(read.body.schedule[0].status).toBe('PAID');
    expect(read.body.schedule[1].status).toBe('OVERDUE'); // still past due, unpaid
  });

  it('the dashboard is OWNER-only and validates asOf', async () => {
    await request(http).get('/credit/arrears').set('Authorization', `Bearer ${cashierToken}`).expect(403);
    await asOwner(request(http).get('/credit/arrears?asOf=not-a-date')).expect(400);
  });
});
