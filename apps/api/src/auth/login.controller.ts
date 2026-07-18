import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  Inject,
  NotImplementedException,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import type { IdentityService } from '@biashara/shared';
import { IDENTITY_SERVICE } from '../platform/tokens.js';
import { PlatformAuthError, PlatformIdentityService } from '../platform/real/identity.platform.js';
import { Public } from './decorators.js';

/** Re-throw a platform auth failure with matching HTTP semantics. */
const toHttp = (e: unknown): never => {
  if (e instanceof PlatformAuthError) {
    if (e.status === 401) throw new UnauthorizedException({ message: e.message, code: e.code });
    if (e.status === 403) throw new ForbiddenException({ message: e.message, code: e.code });
    if (e.status === 400) throw new BadRequestException({ message: e.message, code: e.code });
    throw new BadGatewayException({ message: e.message, code: e.code });
  }
  throw e;
};

/**
 * Real sign-in (T5.1, D-034): both frontends post phone + PIN here; we proxy
 * to the platform (browser → platform directly would hit CORS and leak the
 * platform surface into feature code). Access tokens live 15 min — clients
 * call /auth/refresh on 401; note the platform ROTATES the refresh token, so
 * clients must store the new pair every time.
 */
@Controller('auth')
export class PlatformAuthController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(IDENTITY_SERVICE) private readonly identity: IdentityService) {}

  private platform(): PlatformIdentityService {
    if (!(this.identity instanceof PlatformIdentityService)) {
      throw new NotImplementedException('Platform identity is not enabled (IDENTITY_MODE != platform)');
    }
    return this.identity;
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { phone?: unknown; pin?: unknown }) {
    const phone = String(body?.phone ?? '').trim();
    const pin = String(body?.pin ?? '').trim();
    if (!phone || !pin) throw new BadRequestException({ message: 'phone and pin are required' });
    try {
      return await this.platform().login(phone, pin);
    } catch (e) {
      return toHttp(e);
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: { refreshToken?: unknown }) {
    const refreshToken = String(body?.refreshToken ?? '').trim();
    if (!refreshToken) throw new BadRequestException({ message: 'refreshToken is required' });
    try {
      return await this.platform().refresh(refreshToken);
    } catch (e) {
      return toHttp(e);
    }
  }
}
