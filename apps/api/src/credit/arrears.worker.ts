import { Inject, Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../fiscal/redis.js';
import { ArrearsService, todayIso } from './arrears.service.js';

const queueName = (): string => process.env.ARREARS_QUEUE_NAME ?? 'arrears';
/** Default 02:00 daily; overridable for ops. */
const cron = (): string => process.env.ARREARS_CRON ?? '0 2 * * *';

/**
 * Nightly arrears job (T3.3, ARCHITECTURE: BullMQ). A repeatable scheduler
 * enqueues one run per night; the worker recomputes OVERDUE for today.
 * `ARREARS_CRON=off` skips registration (tests drive ArrearsService directly).
 */
@Injectable()
export class ArrearsWorker implements OnModuleInit, OnApplicationShutdown {
  private queue?: Queue;
  private worker?: Worker;

  constructor(@Inject(ArrearsService) private readonly arrears: ArrearsService) {}

  async onModuleInit(): Promise<void> {
    if (cron() === 'off') return;
    this.queue = new Queue(queueName(), { connection: redisConnection() });
    this.worker = new Worker(queueName(), () => this.arrears.recomputeOverdue(todayIso()), {
      connection: redisConnection(),
      concurrency: 1,
    });
    await this.queue.upsertJobScheduler('nightly', { pattern: cron() }, { name: 'recompute-overdue' });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }
}
