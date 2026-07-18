import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health/health.controller.js';
import { PlatformAuthController } from './auth/login.controller.js';
import { MmResolveDevController } from './platform/mm-resolve.controller.js';
import { PlatformModule } from './platform/platform.module.js';
import { DbModule } from './db/db.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { CreditModule } from './credit/credit.module.js';
import { DeliveryModule } from './delivery/delivery.module.js';
import { AuthGuard } from './auth/auth.guard.js';

@Module({
  imports: [
    PlatformModule, DbModule, CatalogModule, InventoryModule, OrdersModule, CreditModule, DeliveryModule,
  ],
  controllers: [HealthController, PlatformAuthController, MmResolveDevController],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
