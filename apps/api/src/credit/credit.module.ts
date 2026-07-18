import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module.js';
import { OrdersModule } from '../orders/orders.module.js';
import { CreditController } from './credit.controller.js';
import { ArrearsController } from './arrears.controller.js';
import { CreditService } from './credit.service.js';
import { ScheduleApplicationService } from './schedule-application.service.js';
import { ArrearsService } from './arrears.service.js';
import { ArrearsWorker } from './arrears.worker.js';
import { RemindersService } from './reminders.service.js';
import { RemindersWorker } from './reminders.worker.js';

/**
 * Credit domain module (M3): agreements + schedules (T3.1), payment
 * application (T3.2), arrears engine (T3.3), reminders (T3.4),
 * statements (T3.5). Retailer-carried credit only (D-009).
 */
@Module({
  imports: [OrdersModule, PlatformModule], // Platform: NOTIFICATION_SERVICE for reminders (exports don't cascade)
  controllers: [CreditController, ArrearsController],
  providers: [
    CreditService, ScheduleApplicationService, ArrearsService, ArrearsWorker,
    RemindersService, RemindersWorker,
  ],
  exports: [CreditService, ArrearsService, RemindersService],
})
export class CreditModule {}
