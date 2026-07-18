import { Inject, Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Queue, Worker } from 'bullmq';
import { redisConnection } from '../fiscal/redis.js';
import { todayIso } from './arrears.service.js';
import { RemindersService } from './reminders.service.js';

const queueName = (): string => process.env.REMINDERS_QUEUE_NAME ?? 'reminders';
/** Default 07:00 daily — a reminder SMS should reach a customer at breakfast, not 2am. */
const cron = (): string => process.env.REMINDERS_CRON ?? '0 7 * * *';

/**
 * Daily reminder dispatch (T3.4) — same shape as the arrears worker (T3.3).
 * `REMINDERS_CRON=off` skips registration; tests drive RemindersService with
 * an explicit asOf (fake clock).
 */
@Injectable()
export class RemindersWorker implements OnModuleInit, OnApplicationShutdown {
  private queue?: Queue;
  private worker?: Worker;

  constructor(@Inject(RemindersService) private readonly reminders: RemindersService) {}

  async onModuleInit(): Promise<void> {
    if (cron() === 'off') return;
    this.queue = new Queue(queueName(), { connection: redisConnection() });
    this.worker = new Worker(queueName(), () => this.reminders.dispatchDue(todayIso()), {
      connection: redisConnection(),
      concurrency: 1,
    });
    await this.queue.upsertJobScheduler('daily', { pattern: cron() }, { name: 'dispatch-reminders' });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
    await this.queue?.close();
  }
}
