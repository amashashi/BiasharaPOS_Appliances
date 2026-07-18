import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import 'reflect-metadata';
import { createServer, type Server } from 'node:http';
import { INestApplication, Module } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import request from 'supertest';
import type { DataSource } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { createDataSource } from '../db/data-source.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { Location } from '../db/entities/location.entity.js';
import { DbModule } from '../db/db.module.js';
import { DATA_SOURCE } from '../db/tokens.js';
import { IDENTITY_SERVICE } from '../platform/tokens.js';
import { PlatformAuthError, PlatformIdentityService } from '../platform/real/identity.platform.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { CatalogModule } from '../catalog/catalog.module.js';
import { AuthGuard } from './auth.guard.js';
import { PlatformAuthController } from './login.controller.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';

/**
 * Fake BiasharaPOS platform: /auth/login, /auth/me, /auth/refresh with the
 * real response envelopes. Opaque tokens (`tok-<key>`); hit counters let the
 * cache test assert /auth/me traffic.
 */
const BIZ_LINKED = randomUUID();
const BIZ_UNLINKED = randomUUID();
type FakeUser = { key: string; phone: string; pin: string; businessId: string; role: string; fullName: string };
const USERS: FakeUser[] = [
  { key: 'admin', phone: '+255700000001', pin: '1234', businessId: BIZ_LINKED, role: 'admin', fullName: 'Asha Owner' },
  { key: 'manager', phone: '+255700000002', pin: '1234', businessId: BIZ_LINKED, role: 'manager', fullName: 'Mo Manager' },
  { key: 'cashier', phone: '+255700000003', pin: '1234', businessId: BIZ_LINKED, role: 'cashier', fullName: 'Cathy Cashier' },
  { key: 'delivery', phone: '+255700000004', pin: '1234', businessId: BIZ_LINKED, role: 'delivery', fullName: 'Deo Delivery' },
  { key: 'waiter', phone: '+255700000005', pin: '1234', businessId: BIZ_LINKED, role: 'waiter', fullName: 'Wai Ter' },
  { key: 'stranger', phone: '+255700000006', pin: '1234', businessId: BIZ_UNLINKED, role: 'admin', fullName: 'Stan Stranger' },
];
const meHits = { count: 0 };
let refreshGeneration = 0;

const startFakePlatform = (): Promise<{ server: Server; url: string }> =>
  new Promise((resolve) => {
    const server = createServer((req, res) => {
      const send = (status: number, body: unknown): void => {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(body));
      };
      const fail = (status: number, code: string, message: string): void =>
        send(status, { success: false, error: { code, message } });
      let raw = '';
      req.on('data', (c: Buffer) => (raw += c.toString()));
      req.on('end', () => {
        const body = raw ? (JSON.parse(raw) as Record<string, string>) : {};
        if (req.method === 'POST' && req.url === '/auth/login') {
          const user = USERS.find((u) => u.phone === body.phone && u.pin === body.pin);
          if (!user) return fail(401, 'INVALID_CREDENTIALS', 'Invalid phone or PIN');
          return send(200, { success: true, data: { accessToken: `tok-${user.key}`, refreshToken: `ref-${user.key}` } });
        }
        if (req.method === 'GET' && req.url === '/auth/me') {
          meHits.count += 1;
          const token = (req.headers.authorization ?? '').replace('Bearer ', '');
          const user = USERS.find((u) => token === `tok-${u.key}` || token === `tok2-${u.key}`);
          if (!user) return fail(401, 'INVALID_TOKEN', 'Invalid token');
          return send(200, {
            success: true,
            data: { id: `uid-${user.key}`, businessId: user.businessId, fullName: user.fullName, role: user.role },
          });
        }
        if (req.method === 'POST' && req.url === '/auth/refresh') {
          const user = USERS.find((u) => body.refreshToken === `ref-${u.key}`);
          if (!user) return fail(401, 'INVALID_REFRESH', 'Refresh token not valid');
          refreshGeneration += 1; // rotation: old pair dies, new pair issued
          return send(200, { success: true, data: { accessToken: `tok2-${user.key}`, refreshToken: `ref2-${user.key}` } });
        }
        return fail(404, 'NOT_FOUND', 'no such route');
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      resolve({ server, url: `http://127.0.0.1:${addr.port}` });
    });
  });

describe('Platform identity adapter (T5.1, real Postgres + fake platform)', () => {
  let fake: { server: Server; url: string };
  let ds: DataSource;
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let identity: PlatformIdentityService;
  let merchantId: string;

  beforeAll(async () => {
    fake = await startFakePlatform();
    ds = createDataSource();
    await ds.initialize(); // migrations applied by test/global-setup.ts

    const merchant = await ds.getRepository(Merchant).save(
      ds.getRepository(Merchant).create({
        name: `Platform Spec ${Date.now()}`, tin: null, phone: null, platformBusinessId: BIZ_LINKED,
      }),
    );
    merchantId = merchant.id;
    await ds.getRepository(Location).save(
      ds.getRepository(Location).create({ merchantId, name: 'Duka Kuu', kind: 'SHOP' }),
    );

    identity = new PlatformIdentityService(ds, fake.url);

    @Module({
      imports: [DbModule, CatalogModule],
      controllers: [PlatformAuthController],
      providers: [
        { provide: IDENTITY_SERVICE, useFactory: (d: DataSource) => new PlatformIdentityService(d, fake.url), inject: [DATA_SOURCE] },
        { provide: APP_GUARD, useClass: AuthGuard },
      ],
    })
    class TestModule {}
    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
    await ds.destroy();
    await new Promise((r) => fake.server.close(r));
  });

  it('verifies a platform token and maps every supported role (verify clause: roles map correctly)', async () => {
    const expectations = [
      { key: 'admin', role: 'OWNER', name: 'Asha Owner' },
      { key: 'manager', role: 'OWNER', name: 'Mo Manager' },
      { key: 'cashier', role: 'CASHIER', name: 'Cathy Cashier' },
      { key: 'delivery', role: 'DELIVERY', name: 'Deo Delivery' },
    ] as const;
    for (const e of expectations) {
      const ctx = await identity.verifyToken(`tok-${e.key}`);
      expect(ctx).toEqual({
        userId: `uid-${e.key}`, merchantId, displayName: e.name, roles: [e.role],
      });
    }
  });

  it('rejects unmapped roles, unlinked businesses, and bad tokens — and never caches failures', async () => {
    await expect(identity.verifyToken('tok-waiter')).rejects.toMatchObject({ code: 'UNMAPPED_ROLE', status: 403 });
    await expect(identity.verifyToken('tok-stranger')).rejects.toMatchObject({ code: 'MERCHANT_NOT_LINKED', status: 403 });
    await expect(identity.verifyToken('tok-nonsense')).rejects.toBeInstanceOf(PlatformAuthError);
    // still rejected on retry (nothing cached a success for these)
    await expect(identity.verifyToken('tok-waiter')).rejects.toMatchObject({ code: 'UNMAPPED_ROLE' });
  });

  it('caches successful verifications (one upstream /auth/me per token per minute)', async () => {
    const fresh = new PlatformIdentityService(ds, fake.url);
    const before = meHits.count;
    await fresh.verifyToken('tok-admin');
    await fresh.verifyToken('tok-admin');
    await fresh.verifyToken('tok-admin');
    expect(meHits.count).toBe(before + 1);
  });

  it('login proxy: phone + PIN → session with mapped role, merchant, and locations (verify clause: login works)', async () => {
    const res = await request(http)
      .post('/auth/login')
      .send({ phone: '+255700000001', pin: '1234' })
      .expect(200);
    expect(res.body).toMatchObject({
      token: 'tok-admin',
      refreshToken: 'ref-admin',
      merchant: { id: merchantId },
      displayName: 'Asha Owner',
      role: 'OWNER',
    });
    expect(res.body.locations).toEqual([expect.objectContaining({ name: 'Duka Kuu' })]);

    // the issued token really works against a guarded endpoint
    await request(http)
      .get('/catalog/products?q=x')
      .set('Authorization', `Bearer ${res.body.token}`)
      .expect(200);
  });

  it('login proxy failures: bad PIN 401, unlinked business 403, missing fields 400', async () => {
    await request(http).post('/auth/login').send({ phone: '+255700000001', pin: '9999' }).expect(401);
    const unlinked = await request(http)
      .post('/auth/login')
      .send({ phone: '+255700000006', pin: '1234' })
      .expect(403);
    expect(unlinked.body.message).toContain('not onboarded');
    await request(http).post('/auth/login').send({ phone: '+255700000001' }).expect(400);
  });

  it('refresh proxy rotates the pair and the new access token authenticates', async () => {
    const before = refreshGeneration;
    const res = await request(http).post('/auth/refresh').send({ refreshToken: 'ref-cashier' }).expect(200);
    expect(res.body).toEqual({ token: 'tok2-cashier', refreshToken: 'ref2-cashier' });
    expect(refreshGeneration).toBe(before + 1);
    await request(http)
      .get('/catalog/products?q=x')
      .set('Authorization', `Bearer ${res.body.token}`)
      .expect(200);
    await request(http).post('/auth/refresh').send({ refreshToken: 'ref-bogus' }).expect(401);
  });

  it('guard rejects garbage bearer tokens through the real adapter', async () => {
    await request(http).get('/catalog/products?q=x').set('Authorization', 'Bearer tok-garbage').expect(401);
    await request(http).get('/catalog/products?q=x').expect(401);
  });

  it('login/refresh return 501 when identity is still the stub (IDENTITY_MODE unset)', async () => {
    @Module({
      controllers: [PlatformAuthController],
      providers: [{ provide: IDENTITY_SERVICE, useClass: StubIdentityService }],
    })
    class StubModule {}
    const stubApp = await NestFactory.create(StubModule, { logger: false });
    await stubApp.init();
    const stubHttp = stubApp.getHttpServer();
    await request(stubHttp).post('/auth/login').send({ phone: 'x', pin: 'y' }).expect(501);
    await request(stubHttp).post('/auth/refresh').send({ refreshToken: 'z' }).expect(501);
    await stubApp.close();
  });

  it('adapter refuses to boot without a platform URL', () => {
    const saved = process.env.PLATFORM_API_URL;
    delete process.env.PLATFORM_API_URL;
    try {
      expect(() => new PlatformIdentityService(ds)).toThrow(/PLATFORM_API_URL/);
    } finally {
      if (saved !== undefined) process.env.PLATFORM_API_URL = saved;
    }
  });
});
