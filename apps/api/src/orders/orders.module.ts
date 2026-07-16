import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';

/**
 * Orders domain module (M2): quotes & orders (T2.1), serial reservation (T2.2),
 * payments (T2.3+). Holds the order lifecycle door; unit state stays in Inventory.
 */
@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
