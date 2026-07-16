import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module.js';
import { FiscalModule } from '../fiscal/fiscal.module.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { FulfillmentService } from './fulfillment.service.js';
import { PaymentsService } from './payments.service.js';

/**
 * Orders domain module (M2): quotes & orders (T2.1), serial reservation & pick
 * (T2.2), payments (T2.3+). Holds the order lifecycle door; unit state stays
 * in Inventory — FulfillmentService composes the two, never bypasses them.
 */
@Module({
  imports: [InventoryModule, FiscalModule],
  controllers: [OrdersController],
  providers: [OrdersService, FulfillmentService, PaymentsService],
  exports: [OrdersService, FulfillmentService, PaymentsService],
})
export class OrdersModule {}
