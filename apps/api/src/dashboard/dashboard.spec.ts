import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import 'reflect-metadata';
import { INestApplication, Module } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { createDataSource } from '../db/data-source.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { Location } from '../db/entities/location.entity.js';
import { Customer } from '../db/entities/customer.entity.js';
import { Product } from '../db/entities/product.entity.js';
import { Grn } from '../db/entities/grn.entity.js';
import { SerializedUnit } from '../db/entities/serialized-unit.entity.js';
import { StockLevel } from '../db/entities/stock-level.entity.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { Payment } from '../db/entities/payment.entity.js';
import { CreditAgreement } from '../db/entities/credit-agreement.entity.js';
import { CreditScheduleRow } from '../db/entities/credit-schedule-row.entity.js';
import { Delivery } from '../db/entities/delivery.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { DashboardModule } from './dashboard.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';

@Module({
  imports: [DbModule, PlatformModule, DashboardModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

const D = '2026-07-15'; // the dashboard day
const daysAgo = (n: number): Date => new Date(Date.now() - n * 86_400_000);

describe('Owner dashboard (T6.1, real Postgres — reconciles against raw queries)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let token: string;
  let merchantId: string;
  let locationId: string;

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${token}`);
  const newOrder = async (): Promise<string> => {
    const n = (await ds.query('SELECT COALESCE(MAX(number),0)+1 n FROM sales_orders WHERE "merchantId"=$1', [merchantId]))[0].n as number;
    const o = await ds.getRepository(SalesOrder).save(ds.getRepository(SalesOrder).create({
      merchantId, number: Number(n), status: 'CONFIRMED', customerId: null, locationId, note: null, createdByUserId: 'seed', clientRef: null,
    }));
    return o.id;
  };
  const pay = async (orderId: string, method: string, amountTzs: number, occurredAt: Date): Promise<void> => {
    await ds.getRepository(Payment).save(ds.getRepository(Payment).create({
      merchantId, orderId, method: method as 'CASH', amountTzs, reversesPaymentId: null, note: null, recordedByUserId: 'seed', occurredAt,
    }));
  };
  const delivery = async (orderId: string, status: string): Promise<void> => {
    await ds.getRepository(Delivery).save(ds.getRepository(Delivery).create({
      merchantId, orderId, scheduledDate: D, addressText: 'x', status: status as 'PLANNED', assigneeUserId: null, scheduledByUserId: 'seed',
    } as Partial<Delivery>));
  };

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize();
    const merchant = await ds.getRepository(Merchant).save(ds.getRepository(Merchant).create({ name: `Dash ${Date.now()}`, tin: null, phone: null }));
    merchantId = merchant.id;
    locationId = (await ds.getRepository(Location).save(ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }))).id;
    const customer = await ds.getRepository(Customer).save(ds.getRepository(Customer).create({ merchantId, name: 'Mteja', phone: '+255700000000', tin: null }));
    const fridge = await ds.getRepository(Product).save(ds.getRepository(Product).create({
      merchantId, sku: null, brand: 'LG', model: 'RT', category: 'Refrigerator', taxCode: 'A', priceTzs: 900000, costTzs: 500000, active: true, isSerialized: true,
    }));
    const cable = await ds.getRepository(Product).save(ds.getRepository(Product).create({
      merchantId, sku: null, brand: 'Gen', model: 'HDMI', category: 'Accessory', taxCode: 'A', priceTzs: 15000, costTzs: null, active: true, isSerialized: false,
    }));
    token = new StubIdentityService().sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });
    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();

    // ── STOCK: 5 serialized units (grn provenance) — 3 IN_STOCK (fresh/aging/stale), 1 SOLD, 1 RESERVED
    const grn = await ds.getRepository(Grn).save(ds.getRepository(Grn).create({ merchantId, locationId, receivedByUserId: 'seed' }));
    const unitRepo = ds.getRepository(SerializedUnit);
    const mk = (serial: string) => unitRepo.create({ merchantId, productId: fridge.id, serial, status: 'IN_STOCK', locationId, grnId: grn.id, costTzs: 500000, orderLineId: null });
    const units = await unitRepo.save(['U1', 'U2', 'U3', 'U4', 'U5'].map((s) => mk(`${s}-${Date.now()}`)));
    await unitRepo.update(units[3].id, { status: 'SOLD' });
    await unitRepo.update(units[4].id, { status: 'RESERVED' });
    // age the three IN_STOCK units: fresh (now), aging (45d), stale (120d)
    await ds.query('UPDATE serialized_units SET "createdAt" = $1 WHERE id = $2', [daysAgo(45), units[1].id]);
    await ds.query('UPDATE serialized_units SET "createdAt" = $1 WHERE id = $2', [daysAgo(120), units[2].id]);
    // non-serialized stock: 40 cables
    await ds.getRepository(StockLevel).save(ds.getRepository(StockLevel).create({ merchantId, productId: cable.id, locationId, qty: 40 }));

    // ── DAILY SALES on D: CASH 10k + CASH 20k + MOBILE_MONEY 50k. Plus a reversal and an off-day payment (both excluded).
    await pay(await newOrder(), 'CASH', 10000, new Date(`${D}T09:00:00Z`));
    await pay(await newOrder(), 'CASH', 20000, new Date(`${D}T10:00:00Z`));
    await pay(await newOrder(), 'MOBILE_MONEY', 50000, new Date(`${D}T11:00:00Z`));
    await pay(await newOrder(), 'CASH', -5000, new Date(`${D}T12:00:00Z`)); // reversal → excluded (amountTzs>0)
    await pay(await newOrder(), 'CASH', 99000, new Date('2026-07-14T10:00:00Z')); // different day → excluded

    // ── ARREARS: one ACTIVE agreement with one overdue schedule row (100k unpaid)
    const agOrderId = await newOrder();
    const agreement = await ds.getRepository(CreditAgreement).save(ds.getRepository(CreditAgreement).create({
      merchantId, orderId: agOrderId, customerId: customer.id, type: 'INSTALLMENT', principalTzs: 100000, depositTzs: 0, status: 'ACTIVE', createdByUserId: 'seed',
    } as Partial<CreditAgreement>));
    await ds.getRepository(CreditScheduleRow).save(ds.getRepository(CreditScheduleRow).create({
      agreementId: agreement.id, seq: 1, dueDate: '2026-07-05', amountTzs: 100000, paidTzs: 0, status: 'OVERDUE',
    }));

    // ── DELIVERIES on D: 2 PLANNED, 1 DISPATCHED, 1 DELIVERED, 1 FAILED
    await delivery(await newOrder(), 'PLANNED');
    await delivery(await newOrder(), 'PLANNED');
    await delivery(await newOrder(), 'DISPATCHED');
    await delivery(await newOrder(), 'DELIVERED');
    await delivery(await newOrder(), 'FAILED');
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  it('daily sales by method reconcile with a raw payments aggregate (verify clause)', async () => {
    const res = await asOwner(request(http).get(`/dashboard?date=${D}`)).expect(200);
    const ds1 = res.body.dailySales;
    const byMethod = Object.fromEntries(ds1.byMethod.map((m: { method: string }) => [m.method, m]));
    expect(byMethod.CASH).toMatchObject({ count: 2, totalTzs: 30000 });
    expect(byMethod.MOBILE_MONEY).toMatchObject({ count: 1, totalTzs: 50000 });
    expect(ds1.totalTzs).toBe(80000); // reversal + off-day payment excluded
    expect(ds1.count).toBe(3);

    // independent raw query must agree
    const [raw] = await ds.query(
      `SELECT SUM("amountTzs")::int AS t, COUNT(*)::int AS c FROM payments
        WHERE "merchantId"=$1 AND "amountTzs">0 AND COALESCE("occurredAt",at)::date=$2::date`,
      [merchantId, D],
    );
    expect(ds1.totalTzs).toBe(raw.t);
    expect(ds1.count).toBe(raw.c);
  });

  it('stock summary reconciles: status counts, IN_STOCK aging buckets, value at cost, non-serialized qty', async () => {
    const res = await asOwner(request(http).get(`/dashboard?date=${D}`)).expect(200);
    const s = res.body.stock;
    expect(s.serialized.byStatus).toMatchObject({ IN_STOCK: 3, SOLD: 1, RESERVED: 1 });
    expect(s.serialized.inStock).toBe(3);
    expect(s.serialized.aging).toEqual({ fresh: 1, aging: 1, stale: 1 });
    expect(s.serialized.valueTzs).toBe(1500000); // 3 IN_STOCK × 500,000 cost
    expect(s.nonSerializedQty).toBe(40);

    const [rawVal] = await ds.query(`SELECT COALESCE(SUM("costTzs"),0)::int v FROM serialized_units WHERE "merchantId"=$1 AND status='IN_STOCK'`, [merchantId]);
    expect(s.serialized.valueTzs).toBe(rawVal.v);
  });

  it('arrears and today\'s deliveries reconcile', async () => {
    const res = await asOwner(request(http).get(`/dashboard?date=${D}`)).expect(200);
    expect(res.body.arrears).toEqual({ agreements: 1, arrearsTzs: 100000 });
    expect(res.body.deliveries).toEqual({ planned: 2, dispatched: 1, delivered: 1, failed: 1 });
  });

  it('defaults to today when no date is given, and is OWNER-only', async () => {
    const res = await asOwner(request(http).get('/dashboard')).expect(200);
    expect(res.body.date).toBe(new Date().toISOString().slice(0, 10));
    const cashier = new StubIdentityService().sign({ sub: 'u-c', mid: merchantId, name: 'C', roles: ['CASHIER'] });
    await request(http).get('/dashboard').set('Authorization', `Bearer ${cashier}`).expect(403);
  });
});
