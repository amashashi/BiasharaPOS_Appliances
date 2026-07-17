import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Post,
} from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { IdentityService, PaymentsService, Role } from '@biashara/shared';
import { DATA_SOURCE } from '../db/tokens.js';
import { IDENTITY_SERVICE, PAYMENTS_SERVICE } from '../platform/tokens.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { Location } from '../db/entities/location.entity.js';
import { Public } from './decorators.js';

const ROLES: readonly Role[] = ['OWNER', 'CASHIER', 'DELIVERY'];

/**
 * STUB-ERA dev sign-in (T2.6, D-028). The real platform OAuth arrives in T5.1
 * and this controller is DELETED with it. Every route 404s when DEV_AUTH=off
 * (set that in any real deployment until T5.1 lands). Tokens are signed by
 * the identity STUB — they are worthless against a real identity service.
 */
@Controller('auth/dev')
export class DevAuthController {
  // explicit tokens: vitest (esbuild) emits no design:paramtypes metadata
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(IDENTITY_SERVICE) private readonly identity: IdentityService,
    @Inject(PAYMENTS_SERVICE) private readonly payments: PaymentsService,
  ) {}

  private assertEnabled(): void {
    if ((process.env.DEV_AUTH ?? 'on') === 'off') throw new NotFoundException();
  }

  /** Merchants + locations for the dev sign-in picker. */
  @Public()
  @Get('context')
  async context() {
    this.assertEnabled();
    const merchants = await this.ds.getRepository(Merchant).find({ take: 20, order: { createdAt: 'ASC' } });
    const locations = await this.ds.getRepository(Location).find();
    return {
      enabled: true,
      roles: ROLES,
      merchants: merchants.map((m) => ({
        id: m.id,
        name: m.name,
        locations: locations.filter((l) => l.merchantId === m.id).map((l) => ({ id: l.id, name: l.name })),
      })),
    };
  }

  /** Sign a stub JWT for the picked merchant/role. */
  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { merchantId?: unknown; name?: unknown; role?: unknown }) {
    this.assertEnabled();
    const merchantId = String(body?.merchantId ?? '');
    const name = String(body?.name ?? '').trim() || 'Dev User';
    const role = String(body?.role ?? 'CASHIER').toUpperCase() as Role;
    if (!ROLES.includes(role)) {
      throw new BadRequestException({ message: `role must be one of ${ROLES.join(', ')}` });
    }
    const merchant = await this.ds.getRepository(Merchant).findOneBy({ id: merchantId });
    if (!merchant) throw new BadRequestException({ message: 'merchantId not found' });

    const stub = this.identity as Partial<{
      sign: (c: { sub: string; mid: string; name: string; roles: Role[] }) => string;
    }>;
    if (typeof stub.sign !== 'function') {
      throw new BadRequestException({ message: 'Dev login requires the stub identity service' });
    }
    const token = stub.sign({ sub: `dev:${name}`, mid: merchant.id, name, roles: [role] });
    return { token, merchant: { id: merchant.id, name: merchant.name }, displayName: name, role };
  }

  /** Simulate the customer approving/declining the STK push on their phone. */
  @Public()
  @Post('mm-resolve')
  @HttpCode(200)
  async mmResolve(@Body() body: { intentId?: unknown; outcome?: unknown }) {
    this.assertEnabled();
    const intentId = String(body?.intentId ?? '');
    const outcome = String(body?.outcome ?? 'CONFIRMED').toUpperCase();
    const stub = this.payments as Partial<{
      confirm: (id: string) => Promise<void>;
      fail: (id: string) => Promise<void>;
    }>;
    if (typeof stub.confirm !== 'function' || typeof stub.fail !== 'function') {
      throw new BadRequestException({ message: 'mm-resolve requires the stub payments service' });
    }
    try {
      if (outcome === 'FAILED') await stub.fail(intentId);
      else await stub.confirm(intentId);
    } catch {
      throw new BadRequestException({ message: 'Unknown or already-resolved intent' });
    }
    return { intentId, outcome };
  }
}
