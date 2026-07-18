import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller.js';
import { DeliveryService } from './delivery.service.js';

/**
 * Delivery domain module (M4): scheduling (T4.1), dispatch list (T4.2),
 * proof-of-delivery (T4.3). Handover flows through the fulfillment state
 * machine (T2.2) so the layaway gate (D-029) holds.
 */
@Module({
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}
