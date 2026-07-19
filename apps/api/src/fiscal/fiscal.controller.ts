import { Controller, Get, Inject, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { FiscalAgingService } from './fiscal-aging.service.js';

/**
 * Fiscal compliance surface (T5.7). The aging alert lists payments overdue for
 * fiscalization (past the TRA window) — OWNER-only, it's a compliance decision.
 */
@Roles('OWNER')
@Controller('fiscal')
export class FiscalController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(FiscalAgingService) private readonly aging: FiscalAgingService) {}

  @Get('aging')
  agingAlert(@Req() req: AuthedRequest) {
    return this.aging.overdue(req.auth.merchantId);
  }
}
