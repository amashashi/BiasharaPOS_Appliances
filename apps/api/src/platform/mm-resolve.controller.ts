import { BadRequestException, Body, Controller, HttpCode, Inject, NotFoundException, Post } from '@nestjs/common';
import type { PaymentsService } from '@biashara/shared';
import { PAYMENTS_SERVICE } from './tokens.js';
import { Public } from '../auth/decorators.js';

/**
 * STUB-ERA payments simulator (D-028, amended T5.1/D-034). The dev *identity*
 * scaffolding is gone — real platform login landed in T5.1 — but payments are
 * still stubbed until T5.3, and the POS demo needs a way to play the customer
 * approving/declining the STK push. This is that button. DELETED at T5.3 with
 * the payments swap.
 *
 * SECURE BY DEFAULT: this is an unauthenticated (@Public) endpoint that, against
 * the stub payments service, confirms a payment with no money collected — so it
 * must never be live in a real deployment. It auto-disables whenever real
 * identity is on (IDENTITY_MODE=platform); DEV_AUTH=on force-enables it for a
 * dev/staging payments demo that also uses real login, and DEV_AUTH=off is a
 * hard kill everywhere.
 */
@Controller('auth/dev')
export class MmResolveDevController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(PAYMENTS_SERVICE) private readonly payments: PaymentsService) {}

  private enabled(): boolean {
    if (process.env.DEV_AUTH === 'off') return false; // hard kill
    if (process.env.DEV_AUTH === 'on') return true; // explicit opt-in (dev payments demo)
    return process.env.IDENTITY_MODE !== 'platform'; // default: off in real deployments
  }

  /** Simulate the customer approving/declining the STK push on their phone. */
  @Public()
  @Post('mm-resolve')
  @HttpCode(200)
  async mmResolve(@Body() body: { intentId?: unknown; outcome?: unknown }) {
    if (!this.enabled()) throw new NotFoundException();
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
