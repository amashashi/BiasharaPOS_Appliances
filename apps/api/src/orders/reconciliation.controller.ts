import { Body, Controller, Get, HttpCode, Inject, Param, Post, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { ReconciliationService } from './reconciliation.service.js';

/**
 * Reconciliation queue (T5.3a): unapplied mobile-money payments an OWNER must
 * resolve. OWNER-only — this is money that needs a decision (refund / apply
 * elsewhere), not a cashier action.
 */
@Roles('OWNER')
@Controller('reconciliation')
export class ReconciliationController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(ReconciliationService) private readonly reconciliation: ReconciliationService) {}

  @Get()
  list(@Req() req: AuthedRequest) {
    return this.reconciliation.list(req.auth.merchantId);
  }

  @Post(':id/resolve')
  @HttpCode(200)
  resolve(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: { note?: unknown }) {
    return this.reconciliation.resolve(req.auth.merchantId, id, req.auth.userId, body?.note);
  }
}
