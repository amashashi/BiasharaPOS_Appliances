import { Module } from '@nestjs/common';
import { InventoryModule } from '../inventory/inventory.module.js';
import { FiscalModule } from '../fiscal/fiscal.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { OrdersController } from './orders.controller.js';
import { WebhooksController } from './webhooks.controller.js';
import { ReconciliationController } from './reconciliation.controller.js';
import { SyncController } from './sync.controller.js';
import { OrdersService } from './orders.service.js';
import { FulfillmentService } from './fulfillment.service.js';
import { PaymentsService } from './payments.service.js';
import { MobileMoneyService } from './mobile-money.service.js';
import { ReconciliationService } from './reconciliation.service.js';
import { SyncService } from './sync.service.js';
import { SyncExceptionService } from './sync-exception.service.js';

/**
 * Orders domain module (M2): quotes & orders (T2.1), serial reservation & pick
 * (T2.2), payments (T2.3+). Holds the order lifecycle door; unit state stays
 * in Inventory — FulfillmentService composes the two, never bypasses them.
 */
@Module({
  imports: [InventoryModule, FiscalModule, PlatformModule],
  controllers: [OrdersController, WebhooksController, ReconciliationController, SyncController],
  providers: [OrdersService, FulfillmentService, PaymentsService, MobileMoneyService, ReconciliationService, SyncService, SyncExceptionService],
  exports: [OrdersService, FulfillmentService, PaymentsService, MobileMoneyService, ReconciliationService, SyncService, SyncExceptionService],
})
export class OrdersModule {}
