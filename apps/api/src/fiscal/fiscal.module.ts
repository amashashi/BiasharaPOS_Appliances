import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module.js';
import { FiscalQueueService } from './fiscal-queue.service.js';
import { FiscalWorker } from './fiscal.worker.js';
import { FiscalAgingService } from './fiscal-aging.service.js';
import { FiscalController } from './fiscal.controller.js';

/**
 * Fiscal integration point (T2.4, D-008): payments enqueue here; the worker
 * issues VFD receipts through the FiscalService port with BullMQ retries. The
 * aging alert (T5.7) surfaces payments overdue for fiscalization.
 */
@Module({
  imports: [PlatformModule],
  controllers: [FiscalController],
  providers: [FiscalQueueService, FiscalWorker, FiscalAgingService],
  exports: [FiscalQueueService],
})
export class FiscalModule {}
