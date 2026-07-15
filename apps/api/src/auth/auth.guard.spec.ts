import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import 'reflect-metadata';
import { Controller, Get, INestApplication, Module, Req } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import request from 'supertest';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard, type AuthedRequest } from './auth.guard.js';
import { Public, Roles } from './decorators.js';

@Controller('probe')
class ProbeController {
  @Public()
  @Get('open')
  open() {
    return { ok: 'public' };
  }

  @Get('authed')
  authed(@Req() req: AuthedRequest) {
    return { merchantId: req.auth.merchantId, userId: req.auth.userId };
  }

  @Roles('OWNER')
  @Get('owner-only')
  ownerOnly() {
    return { ok: 'owner' };
  }
}

@Module({
  imports: [PlatformModule],
  controllers: [ProbeController],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

// mint tokens with the same default secret the PlatformModule stub uses
const mint = new StubIdentityService();
const ownerToken = mint.sign({ sub: 'u-owner', mid: 'm-1', name: 'Asha', roles: ['OWNER'] });
const cashierToken = mint.sign({ sub: 'u-cash', mid: 'm-1', name: 'Juma', roles: ['CASHIER'] });

describe('AuthGuard (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('lets @Public routes through with no token', async () => {
    await request(app.getHttpServer()).get('/probe/open').expect(200, { ok: 'public' });
  });

  it('rejects missing and invalid tokens with 401', async () => {
    await request(app.getHttpServer()).get('/probe/authed').expect(401);
    await request(app.getHttpServer())
      .get('/probe/authed')
      .set('Authorization', 'Bearer not.a.token')
      .expect(401);
  });

  it('attaches AuthContext for valid tokens', async () => {
    const res = await request(app.getHttpServer())
      .get('/probe/authed')
      .set('Authorization', `Bearer ${cashierToken}`)
      .expect(200);
    expect(res.body).toEqual({ merchantId: 'm-1', userId: 'u-cash' });
  });

  it('enforces @Roles: cashier gets 403 on owner-only, owner gets 200', async () => {
    await request(app.getHttpServer())
      .get('/probe/owner-only')
      .set('Authorization', `Bearer ${cashierToken}`)
      .expect(403);
    await request(app.getHttpServer())
      .get('/probe/owner-only')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200, { ok: 'owner' });
  });
});
