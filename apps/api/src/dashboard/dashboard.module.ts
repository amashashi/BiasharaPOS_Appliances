import { Module } from '@nestjs/common';
import { CreditModule } from '../credit/credit.module.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

/**
 * Owner dashboard (T6.1). Composes read-only aggregates across domains; imports
 * CreditModule for ArrearsService so the arrears figure reuses the one source
 * of arrears truth (exports don't cascade — import where injected).
 */
@Module({
  imports: [CreditModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
