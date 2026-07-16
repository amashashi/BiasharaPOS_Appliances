import { Module } from '@nestjs/common';
import { GrnController } from './grn.controller.js';
import { GrnService } from './grn.service.js';
import { UnitStateService } from './unit-state.service.js';
import { StockController } from './stock.controller.js';
import { StockService } from './stock.service.js';

/**
 * Inventory domain module (M1): receiving (T1.2), serial state machine (T1.3),
 * stock views + serial lookup (T1.4). Owns all serial logic — Catalog never does.
 */
@Module({
  controllers: [GrnController, StockController],
  providers: [GrnService, UnitStateService, StockService],
  exports: [GrnService, UnitStateService, StockService],
})
export class InventoryModule {}
