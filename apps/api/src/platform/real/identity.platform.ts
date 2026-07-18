import type { DataSource } from 'typeorm';
import type { AuthContext, IdentityService, Role } from '@biashara/shared';
import { Merchant } from '../../db/entities/merchant.entity.js';
import { Location } from '../../db/entities/location.entity.js';

/** Envelope every BiasharaPOS platform endpoint wraps its payload in. */
interface Envelope<T> {
  success: boolean;
  data: T;
  error?: { code?: string; message?: string };
}

interface PlatformMe {
  id: string;
  businessId: string;
  fullName: string;
  role: string;
}

interface PlatformTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Platform role → appliances role (D-034). The platform's users.role CHECK was
 * dropped upstream, so custom values like `delivery` are assignable there.
 * Unmapped roles are REJECTED, not defaulted — a new platform role must be
 * consciously mapped before it can touch appliance data.
 */
const ROLE_MAP: Record<string, Role> = {
  admin: 'OWNER',
  manager: 'OWNER', // platform managers run the back office day-to-day
  cashier: 'CASHIER',
  delivery: 'DELIVERY',
};

const CACHE_TTL_MS = 60_000; // ≪ the platform's 15-min access-token life
const CACHE_MAX = 1000;

/** Auth failure with the HTTP semantics the platform gave us (or we decided). */
export class PlatformAuthError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

/**
 * Real identity adapter (T5.1, D-034): a thin client over the platform's auth
 * API. verifyToken = GET /auth/me with the caller's bearer token — no shared
 * signing secret, and a revoked/deactivated user dies within the cache TTL.
 * The platform `businessId` resolves to our merchant via
 * merchants.platformBusinessId; unlinked businesses are rejected until
 * onboarded (T6.2).
 */
export class PlatformIdentityService implements IdentityService {
  private readonly cache = new Map<string, { ctx: AuthContext; until: number }>();

  constructor(
    private readonly ds: DataSource,
    private readonly baseUrl = process.env.PLATFORM_API_URL ?? '',
  ) {
    if (!this.baseUrl) throw new Error('PLATFORM_API_URL is required for IDENTITY_MODE=platform');
  }

  private async platform<T>(path: string, init: RequestInit): Promise<T> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}${path}`, init);
    } catch {
      throw new PlatformAuthError(502, 'Platform identity service unreachable', 'PLATFORM_DOWN');
    }
    const body = (await res.json().catch(() => ({}))) as Envelope<T>;
    if (!res.ok || !body.success) {
      throw new PlatformAuthError(
        res.status,
        body.error?.message ?? `Platform responded ${res.status}`,
        body.error?.code,
      );
    }
    return body.data;
  }

  /** Verify the token upstream, map the role, and resolve our merchant. */
  private async resolve(jwt: string): Promise<{ ctx: AuthContext; merchant: Merchant }> {
    const me = await this.platform<PlatformMe>('/auth/me', {
      headers: { authorization: `Bearer ${jwt}` },
    });
    const role = ROLE_MAP[me.role];
    if (!role) {
      throw new PlatformAuthError(403, `Platform role "${me.role}" is not enabled for Appliances & Electronics`, 'UNMAPPED_ROLE');
    }
    const merchant = await this.ds.getRepository(Merchant).findOneBy({ platformBusinessId: me.businessId });
    if (!merchant) {
      throw new PlatformAuthError(403, 'This business is not onboarded to Appliances & Electronics', 'MERCHANT_NOT_LINKED');
    }
    return {
      ctx: { userId: me.id, merchantId: merchant.id, displayName: me.fullName, roles: [role] },
      merchant,
    };
  }

  async verifyToken(jwt: string): Promise<AuthContext> {
    const hit = this.cache.get(jwt);
    if (hit && hit.until > Date.now()) return hit.ctx;
    const { ctx } = await this.resolve(jwt); // failures are never cached
    if (this.cache.size >= CACHE_MAX) {
      for (const [k, v] of this.cache) if (v.until <= Date.now()) this.cache.delete(k);
      if (this.cache.size >= CACHE_MAX) this.cache.clear(); // pathological flood — reset
    }
    this.cache.set(jwt, { ctx, until: Date.now() + CACHE_TTL_MS });
    return ctx;
  }

  /**
   * Phone + PIN login, proxied to the platform. Returns the app session shape
   * both frontends store, including the merchant's locations (the POS needs
   * one to run a till; the back office ignores them).
   */
  async login(phone: string, pin: string): Promise<{
    token: string;
    refreshToken: string;
    merchant: { id: string; name: string };
    displayName: string;
    role: Role;
    locations: Array<{ id: string; name: string }>;
  }> {
    const tokens = await this.platform<PlatformTokens>('/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone, pin }),
    });
    const { ctx, merchant } = await this.resolve(tokens.accessToken);
    const locations = await this.ds.getRepository(Location).find({
      where: { merchantId: merchant.id },
      order: { name: 'ASC' },
    });
    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      merchant: { id: merchant.id, name: merchant.name },
      displayName: ctx.displayName,
      role: ctx.roles[0],
      locations: locations.map((l) => ({ id: l.id, name: l.name })),
    };
  }

  /** Rotate: the platform revokes the old refresh token and issues a new pair. */
  async refresh(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    const tokens = await this.platform<PlatformTokens>('/auth/refresh', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    return { token: tokens.accessToken, refreshToken: tokens.refreshToken };
  }
}
