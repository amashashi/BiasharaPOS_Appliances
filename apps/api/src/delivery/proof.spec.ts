import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import 'reflect-metadata';
import { INestApplication, Module } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import request from 'supertest';
import { In, type DataSource } from 'typeorm';
import { createDataSource } from '../db/data-source.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { Location } from '../db/entities/location.entity.js';
import { Product } from '../db/entities/product.entity.js';
import { SerializedUnit } from '../db/entities/serialized-unit.entity.js';
import { Delivery } from '../db/entities/delivery.entity.js';
import { AuditEvent } from '../db/entities/audit-event.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { OrdersModule } from '../orders/orders.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { DeliveryModule } from './delivery.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';
process.env.FISCAL_QUEUE_NAME = `fiscal-proof-test-${Date.now()}`;

@Module({
  imports: [DbModule, PlatformModule, OrdersModule, InventoryModule, DeliveryModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('Proof of delivery (T4.3, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ds: DataSource;
  let ownerToken: string;
  let deoToken: string;
  let merchantId: string;
  let dukaId: string;
  let fridge: Product;
  let serialSeq = 0;

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${ownerToken}`);
  const asDeo = (r: request.Test) => r.set('Authorization', `Bearer ${deoToken}`);

  /**
   * Full scheduled sale up to FULFILLED with SOLD serials, then a DISPATCHED
   * delivery assigned to Deo. Returns { orderId, deliveryId, serials }.
   */
  const prepareDispatched = async (): Promise<{ orderId: string; deliveryId: string; serials: string[] }> => {
    const serials = [`PRF-${++serialSeq}-A`, `PRF-${serialSeq}-B`];
    await asOwner(request(http).post('/grns'))
      .send({ locationId: dukaId, lines: [{ productId: fridge.id, serials }] })
      .expect(201);
    const order = await asOwner(request(http).post('/orders'))
      .send({
        type: 'ORDER', locationId: dukaId,
        customer: { name: 'Mama Delivery', phone: '+255713000999' },
        lines: [{ productId: fridge.id, qty: 2 }],
      })
      .expect(201);
    const orderId = order.body.id as string;
    await asOwner(request(http).post(`/orders/${orderId}/payments`))
      .send({ method: 'CASH', amountTzs: order.body.totals.totalTzs })
      .expect(201);
    const lineId = order.body.lines[0].id as string;
    await asOwner(request(http).post(`/orders/${orderId}/fulfill`))
      .send({ picks: [{ lineId, serials }] })
      .expect(200); // units RESERVED→SOLD, order FULFILLED
    const del = await asOwner(request(http).post(`/orders/${orderId}/delivery`))
      .send({ scheduledDate: '2026-08-30', addressText: 'Tegeta', assigneeUserId: 'u-deo' })
      .expect(201);
    await asDeo(request(http).post(`/deliveries/${del.body.id}/dispatch`)).expect(200);
    return { orderId, deliveryId: del.body.id, serials };
  };

  beforeAll(async () => {
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds
      .getRepository(Merchant)
      .save(ds.getRepository(Merchant).create({ name: `Proof Spec ${Date.now()}`, tin: null, phone: null }));
    merchantId = merchant.id;
    dukaId = (
      await ds.getRepository(Location).save(
        ds.getRepository(Location).create({ merchantId, name: 'Duka', kind: 'SHOP' }),
      )
    ).id;
    fridge = await ds.getRepository(Product).save(
      ds.getRepository(Product).create({
        merchantId, sku: null, brand: 'Samsung', model: 'RT38', category: 'Refrigerator',
        taxCode: 'A', priceTzs: 900000, costTzs: null, active: true, isSerialized: true,
      }),
    );
    const mint = new StubIdentityService();
    ownerToken = mint.sign({ sub: 'u-owner', mid: merchantId, name: 'Asha', roles: ['OWNER'] });
    deoToken = mint.sign({ sub: 'u-deo', mid: merchantId, name: 'Deo', roles: ['DELIVERY'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
  });

  it('confirmed delivery flips serials to DELIVERED and the delivery to DELIVERED (verify clause)', async () => {
    const { deliveryId, serials } = await prepareDispatched();

    const res = await asDeo(request(http).post(`/deliveries/${deliveryId}/confirm`))
      .send({ serials, signedByName: 'Mama Delivery', otpConfirmed: true })
      .expect(200);
    expect(res.body.status).toBe('DELIVERED');
    expect(res.body.proofSignedByName).toBe('Mama Delivery');
    expect(res.body.proofOtpConfirmed).toBe(true);
    expect(res.body.confirmedSerialIds).toHaveLength(2);
    expect(res.body.deliveredAt).toBeTruthy();

    // the physical units are now DELIVERED (SOLD→DELIVERED through the state machine)
    const units = await ds.getRepository(SerializedUnit).findBy({ merchantId, serial: In(serials) });
    expect(units.every((u) => u.status === 'DELIVERED')).toBe(true);

    // each unit transition + the delivery confirmation are audited
    const unitAudit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'SerializedUnit', entityId: units[0].id, action: 'UNIT_DELIVERED' });
    expect(unitAudit).toHaveLength(1);
    const delAudit = await ds
      .getRepository(AuditEvent)
      .findBy({ entityType: 'Delivery', entityId: deliveryId, action: 'DELIVERY_CONFIRMED' });
    expect(delAudit).toHaveLength(1);
    expect((delAudit[0].after as { unitsDelivered: number }).unitsDelivered).toBe(2);
  });

  it('a failed delivery records the reason and frees the order to be rescheduled (verify clause)', async () => {
    const { orderId, deliveryId, serials } = await prepareDispatched();

    const fail = await asDeo(request(http).post(`/deliveries/${deliveryId}/fail`))
      .send({ reason: 'Mteja hakuwepo / customer not home' })
      .expect(200);
    expect(fail.body.status).toBe('FAILED');
    expect(fail.body.failureReason).toContain('customer not home');

    // units stay SOLD (goods returned to the shop, still committed)
    const units = await ds.getRepository(SerializedUnit).findBy({ merchantId, serial: In(serials) });
    expect(units.every((u) => u.status === 'SOLD')).toBe(true);

    // the order can now be rescheduled — a fresh delivery is allowed (FAILED excluded from the guard)
    const reschedule = await asOwner(request(http).post(`/orders/${orderId}/delivery`))
      .send({ scheduledDate: '2026-09-02', addressText: 'Tegeta (jaribio la pili)', assigneeUserId: 'u-deo' })
      .expect(201);
    expect(reschedule.body.status).toBe('PLANNED');
    expect(reschedule.body.id).not.toBe(deliveryId);

    // and the new one delivers successfully
    await asDeo(request(http).post(`/deliveries/${reschedule.body.id}/dispatch`)).expect(200);
    await asDeo(request(http).post(`/deliveries/${reschedule.body.id}/confirm`))
      .send({ serials, photoUrl: 'https://proof.example/x.jpg' })
      .expect(200);
    const delivered = await ds.getRepository(SerializedUnit).findBy({ merchantId, serial: In(serials) });
    expect(delivered.every((u) => u.status === 'DELIVERED')).toBe(true);
  });

  it('guards: proof required, serial mismatch rejected, own-job scoping, no double-confirm', async () => {
    const { deliveryId, serials } = await prepareDispatched();

    // no proof
    await asDeo(request(http).post(`/deliveries/${deliveryId}/confirm`)).send({ serials }).expect(400);
    // wrong serial
    const wrong = await asDeo(request(http).post(`/deliveries/${deliveryId}/confirm`))
      .send({ serials: [serials[0], 'GHOST-1'], otpConfirmed: true })
      .expect(400);
    expect(JSON.stringify(wrong.body.errors)).toContain('GHOST-1');
    // missing a serial
    const missing = await asDeo(request(http).post(`/deliveries/${deliveryId}/confirm`))
      .send({ serials: [serials[0]], otpConfirmed: true })
      .expect(400);
    expect(JSON.stringify(missing.body.errors)).toContain(serials[1]);
    // fail needs a reason
    await asDeo(request(http).post(`/deliveries/${deliveryId}/fail`)).send({}).expect(400);

    // a different staffer can't confirm this job
    const jua = new StubIdentityService().sign({ sub: 'u-jua', mid: merchantId, name: 'Jua', roles: ['DELIVERY'] });
    await request(http)
      .post(`/deliveries/${deliveryId}/confirm`)
      .set('Authorization', `Bearer ${jua}`)
      .send({ serials, otpConfirmed: true })
      .expect(404);

    // valid confirm, then no second confirm and no fail-after-delivered
    await asDeo(request(http).post(`/deliveries/${deliveryId}/confirm`))
      .send({ serials, otpConfirmed: true })
      .expect(200);
    await asDeo(request(http).post(`/deliveries/${deliveryId}/confirm`))
      .send({ serials, otpConfirmed: true })
      .expect(409);
    await asDeo(request(http).post(`/deliveries/${deliveryId}/fail`)).send({ reason: 'late' }).expect(409);
    expect((await ds.getRepository(Delivery).findOneByOrFail({ id: deliveryId })).status).toBe('DELIVERED');
  });
});
