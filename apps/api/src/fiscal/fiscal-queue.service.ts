import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Queue } from 'bullmq';
import { fiscalQueueName, redisConnection } from './redis.js';

/**
 * Fiscal retry queue (T2.4): every recorded payment enqueues one job; the
 * worker issues the VFD receipt. Failures retry with exponential backoff and
 * failed jobs are KEPT — the T5.7 aging alert reads them.
 */
@Injectable()
export class FiscalQueueService implements OnApplicationShutdown {
  private readonly queue = new Queue(fiscalQueueName(), { connection: redisConnection() });

  async enqueue(paymentId: string): Promise<void> {
    await this.queue.add(
      'issue-receipt',
      { paymentId },
      {
        jobId: paymentId, // one job per payment — re-enqueue is a no-op
        attempts: Number(process.env.FISCAL_MAX_ATTEMPTS ?? 8),
        backoff: { type: 'exponential', delay: Number(process.env.FISCAL_BACKOFF_MS ?? 15000) },
        removeOnComplete: 1000,
        removeOnFail: false,
      },
    );
  }

  async onApplicationShutdown(): Promise<void> {
    await this.queue.close();
  }
}
