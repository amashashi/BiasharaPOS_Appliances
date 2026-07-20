import { Controller, Get, Inject, Query, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { DashboardService } from './dashboard.service.js';

/** Owner dashboard (T6.1): the day's sales, stock health, arrears, and deliveries. */
@Roles('OWNER')
@Controller('dashboard')
export class DashboardController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(DashboardService) private readonly dashboard: DashboardService) {}

  @Get()
  overview(@Req() req: AuthedRequest, @Query('date') date?: string) {
    return this.dashboard.overview(req.auth.merchantId, date);
  }
}
