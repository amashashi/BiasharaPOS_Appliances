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
import { ReminderLog } from '../db/entities/reminder-log.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { NOTIFICATION_SERVICE } from '../platform/tokens.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { StubNotificationService } from '../platform/stubs/notifications.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CreditModule } from './credit.module.js';
import { RemindersService } from './reminders.service.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
process.env.ARREARS_CRON = 'off';
process.env.REMINDERS_CRON = 'off'; // no BullMQ scheduler in tests — fake clock drives dispatchDue
process.env.FISCAL_QUEUE_NAME = `fiscal-reminders-test-${Date.now()}`;

@Module({
  imports: [DbModule, PlatformModule, CreditModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

/** Run-unique msisdns: dispatch is global, so assertions filter to this run's customers. */
const RUN = String(Date.now()).slice(-7);
const msisdnA = `+2557${RUN}1`;
const msisdnB = `+2557${RUN}2`;
const msisdnC = `+2557${RUN}3`;
const OURS = new Set([msisdnA, msisdnB, msisdnC]);

describe('Payment reminders (T3.4, real Postgres, fake clock)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let reminders: RemindersService;
  let sms: StubNotificationService;
  let ownerA: string;
  let ownerB: string;
  let merchantAId: string;

  const ourSms = () => sms.sent.filter((s) => OURS.has(s.msisdn));

  const makeAgreement = async (
    token: string,
    dukaId: string,
    productId: string,
    customer: { name: string; phone?: string },
    firstDue: string,
  ): Promise<{ orderId: string; agreementId: string }> => {
    const as = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);
    const order = await as(request(http).post('/orders'))
      .send({
        type: 'ORDER',
        locationId: dukaId,
        customer,
        lines: [{ productId, qty: 1 }],
        serviceLines: [{ kind: 'DELIVERY', priceTzs: 30000 }],
      })
      .expect(201);
    await as(request(http).post(`/orders/${order.body.id}/payments`))
      .send({ method: 'CASH', amountTzs: 550000 })
      .expect(201);
    const agr = await as(request(http).post(`/orders/${order.body.id}/credit-agreement`))
      .send({ type: 'INSTALLMENT', schedule: { months: 4, firstDueDate: firstDue } }) // 4×300,000
      .expect(201);
    return { orderId: order.body.id as string, agreementId: agr.body.id as string };
  };

  const seedMerchant = async (tag: string) => {
    const merchant = await ds.getRepository(Merchant).save(
      ds.getRepository(Merchant).create({ name: `Rem ${tag} ${RUN}`, tin: null, phone: null }),
    );
    const duka = await ds.getRepository(Location).save(
      ds.getRepository(Location).create({ merchantId: merchant.id, name: 'Duka', kind: 'SHOP' }),
    );
    const fridge = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId: merchant.id, sku: null, brand: 'LG', model: 'GN-B422', category: 'Refrigerator',
        taxCode: 'A', priceTzs: 1720000, costTzs: null, active: true, isSerialized: false,
      }),
    );
    const token = new StubIdentityService().sign({
      sub: `u-${tag}`, mid: merchant.id, name: tag, roles: ['OWNER'],
    });
    return { merchant, dukaId: duka.id, productId: fridge.id, token };
  };

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts
    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
    reminders = app.get(RemindersService);
    sms = app.get<StubNotificationService>(NOTIFICATION_SERVICE);
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  it('a date sweep dispatches EXACTLY the configured reminders per merchant policy (verify clause)', async () => {
    const A = await seedMerchant('A'); // default policy [-2, 0, 3]
    merchantAId = A.merchant.id;
    ownerA = A.token;
    const B = await seedMerchant('B');
    ownerB = B.token;
    await request(http)
      .put('/credit/reminder-policy')
      .set('Authorization', `Bearer ${ownerB}`)
      .send({ offsetsDays: [0] }) // B only texts on the due day
      .expect(200);

    await makeAgreement(ownerA, A.dukaId, A.productId, { name: 'Mama Amina', phone: msisdnA }, '2026-08-05');
    await makeAgreement(ownerB, B.dukaId, B.productId, { name: 'Bwana Bakari', phone: msisdnB }, '2026-08-10');

    // fake clock: run the "nightly" job for each day of a two-week window
    for (let day = 1; day <= 15; day++) {
      await reminders.dispatchDue(`2026-08-${String(day).padStart(2, '0')}`);
    }

    const got = ourSms().map((s) => `${s.templateKey} ${s.msisdn} due=${s.params.dueDate}`);
    expect(got.sort()).toEqual(
      [
        `reminder.upcoming ${msisdnA} due=05/08/2026`, // Aug 3 (T-2)
        `reminder.due ${msisdnA} due=05/08/2026`, // Aug 5
        `reminder.overdue ${msisdnA} due=05/08/2026`, // Aug 8 (+3)
        `reminder.due ${msisdnB} due=10/08/2026`, // Aug 10 — B's only offset
      ].sort(),
    );

    // params carry everything a bilingual SMS template needs, formats per §7/§3
    const dueSms = ourSms().find((s) => s.templateKey === 'reminder.due' && s.msisdn === msisdnA)!;
    expect(dueSms.params).toMatchObject({
      customerName: 'Mama Amina',
      amountTzs: '300,000',
      dueDate: '05/08/2026',
    });
    expect(dueSms.params.orderNumber).toMatch(/^SO-\d{6}$/);
    const overdueSms = ourSms().find((s) => s.templateKey === 'reminder.overdue')!;
    expect(overdueSms.params.daysOverdue).toBe('3');
  });

  it('rerunning a day never double-texts (idempotent by row+offset)', async () => {
    const before = ourSms().length;
    await reminders.dispatchDue('2026-08-05');
    await reminders.dispatchDue('2026-08-05');
    expect(ourSms().length).toBe(before);
    const logs = await ds.getRepository(ReminderLog).findBy({ merchantId: merchantAId });
    expect(logs.filter((l) => l.offsetDays === 0)).toHaveLength(1);
    expect(logs.every((l) => l.status === 'SENT')).toBe(true);
  });

  it('paid rows and phone-less customers are never reminded', async () => {
    const A = await seedMerchant('A2');
    const paid = await makeAgreement(A.token, A.dukaId, A.productId, { name: 'Mlipaji', phone: msisdnC }, '2026-09-05');
    // settle row 1 (300,000) before its due date
    await request(http)
      .post(`/orders/${paid.orderId}/payments`)
      .set('Authorization', `Bearer ${A.token}`)
      .send({ method: 'CASH', amountTzs: 300000 })
      .expect(201);
    // second agreement: customer with NO phone
    await makeAgreement(A.token, A.dukaId, A.productId, { name: 'Bila Simu' }, '2026-09-05');

    const before = ourSms().filter((s) => s.msisdn === msisdnC).length;
    for (const day of ['2026-09-03', '2026-09-05', '2026-09-08']) {
      await reminders.dispatchDue(day);
    }
    // row1 is PAID → zero reminders for it; phone-less customer can't be texted at all
    expect(ourSms().filter((s) => s.msisdn === msisdnC).length).toBe(before);
  });

  it('a failed send is logged FAILED with the error and never retried by reruns', async () => {
    const A = await seedMerchant('A3');
    const phone = `+2557${RUN}4`;
    OURS.add(phone);
    const { agreementId } = await makeAgreement(A.token, A.dukaId, A.productId, { name: 'Hitilafu', phone }, '2026-10-05');

    // dispatch is global — other agreements may text the same day, so the
    // injected outage must hit exactly OUR customer's send, once
    const original = sms.sendSms.bind(sms);
    sms.sendSms = async (m, t, p) => {
      if (m === phone) {
        sms.sendSms = original;
        throw new Error('STUB_SMS_DOWN');
      }
      return original(m, t, p);
    };
    await reminders.dispatchDue('2026-10-05');
    const failed = await ds.getRepository(ReminderLog).findBy({ agreementId });
    expect(failed).toHaveLength(1);
    expect(failed[0].status).toBe('FAILED');
    expect(failed[0].error).toContain('STUB_SMS_DOWN');

    await reminders.dispatchDue('2026-10-05'); // rerun: claimed → no resend, still FAILED
    const after = await ds.getRepository(ReminderLog).findBy({ agreementId });
    expect(after).toHaveLength(1);
    expect(after[0].status).toBe('FAILED');
  });

  it('the reminder log is visible on the agreement (verify clause)', async () => {
    const orders = await request(http)
      .get('/orders?limit=5')
      .set('Authorization', `Bearer ${ownerA}`)
      .expect(200);
    const withAgreement = orders.body.items.find(
      (o: { customer: { phone: string | null } | null }) => o.customer?.phone === msisdnA,
    );
    const res = await request(http)
      .get(`/orders/${withAgreement.id}/credit-agreement`)
      .set('Authorization', `Bearer ${ownerA}`)
      .expect(200);
    expect(res.body.reminders.length).toBeGreaterThanOrEqual(3);
    const kinds = res.body.reminders.map((r: { templateKey: string; status: string }) => r.templateKey);
    expect(kinds).toEqual(
      expect.arrayContaining(['reminder.upcoming', 'reminder.due', 'reminder.overdue']),
    );
    expect(res.body.reminders.every((r: { status: string }) => r.status === 'SENT')).toBe(true);
  });

  it('policy endpoint: default, update (stored sorted), validation, role guard', async () => {
    const A = await seedMerchant('A4');
    const get1 = await request(http)
      .get('/credit/reminder-policy')
      .set('Authorization', `Bearer ${A.token}`)
      .expect(200);
    expect(get1.body.offsetsDays).toEqual([-2, 0, 3]);

    const put = await request(http)
      .put('/credit/reminder-policy')
      .set('Authorization', `Bearer ${A.token}`)
      .send({ offsetsDays: [7, -1, 0] })
      .expect(200);
    expect(put.body.offsetsDays).toEqual([-1, 0, 7]);

    for (const bad of [[], [1.5], [0, 0], [99], Array.from({ length: 7 }, (_, i) => i), 'x']) {
      await request(http)
        .put('/credit/reminder-policy')
        .set('Authorization', `Bearer ${A.token}`)
        .send({ offsetsDays: bad })
        .expect(400);
    }

    const cashier = new StubIdentityService().sign({
      sub: 'u-cash', mid: A.merchant.id, name: 'Juma', roles: ['CASHIER'],
    });
    await request(http)
      .get('/credit/reminder-policy')
      .set('Authorization', `Bearer ${cashier}`)
      .expect(403);
  });
});
