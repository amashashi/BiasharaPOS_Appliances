import { Module } from '@nestjs/common';
import { OrdersModule } from '../orders/orders.module.js';
import { CreditController } from './credit.controller.js';
import { ArrearsController } from './arrears.controller.js';
import { CreditService } from './credit.service.js';
import { ScheduleApplicationService } from './schedule-application.service.js';
import { ArrearsService } from './arrears.service.js';
import { ArrearsWorker } from './arrears.worker.js';

/**
 * Credit domain module (M3): agreements + schedules (T3.1), payment
 * application (T3.2), arrears engine (T3.3), reminders (T3.4),
 * statements (T3.5). Retailer-carried credit only (D-009).
 */
@Module({
  imports: [OrdersModule],
  controllers: [CreditController, ArrearsController],
  providers: [CreditService, ScheduleApplicationService, ArrearsService, ArrearsWorker],
  exports: [CreditService, ArrearsService],
})
export class CreditModule {}
