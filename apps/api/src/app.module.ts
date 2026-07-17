import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { HealthController } from './health/health.controller.js';
import { DevAuthController } from './auth/dev.controller.js';
import { PlatformModule } from './platform/platform.module.js';
import { DbModule } from './db/db.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { AuthGuard } from './auth/auth.guard.js';

@Module({
  imports: [PlatformModule, DbModule, CatalogModule, InventoryModule, OrdersModule],
  controllers: [HealthController, DevAuthController],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AppModule {}
