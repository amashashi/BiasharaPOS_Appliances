import { Module } from '@nestjs/common';
import { PlatformModule } from '../platform/platform.module.js';
import { FiscalQueueService } from './fiscal-queue.service.js';
import { FiscalWorker } from './fiscal.worker.js';

/**
 * Fiscal integration point (T2.4, D-008): payments enqueue here; the worker
 * issues VFD receipts through the FiscalService port with BullMQ retries.
 */
@Module({
  imports: [PlatformModule],
  providers: [FiscalQueueService, FiscalWorker],
  exports: [FiscalQueueService],
})
export class FiscalModule {}
