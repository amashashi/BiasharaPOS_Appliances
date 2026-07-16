import { Inject, Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import type { DataSource } from 'typeorm';
import type { FiscalService } from '@biashara/shared';
import { DATA_SOURCE } from '../db/tokens.js';
import { FISCAL_SERVICE } from '../platform/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { Payment } from '../db/entities/payment.entity.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { FiscalReceipt } from '../db/entities/fiscal-receipt.entity.js';
import { buildFiscalDraft } from './receipt-draft.js';
import { fiscalQueueName, redisConnection } from './redis.js';

/**
 * Processes fiscal jobs: load the payment, build the draft, issue via the
 * FiscalService port, persist the VFD result. Throwing hands the job back to
 * BullMQ for retry — that IS the outage behavior (T2.4 verify clause).
 */
@Injectable()
export class FiscalWorker implements OnModuleInit, OnApplicationShutdown {
  private worker?: Worker;

  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(FISCAL_SERVICE) private readonly fiscal: FiscalService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  onModuleInit(): void {
    this.worker = new Worker(
      fiscalQueueName(),
      (job) => this.process(job),
      { connection: redisConnection(), concurrency: 1 },
    );
  }

  async process(job: Job<{ paymentId: string }>): Promise<void> {
    const payment = await this.ds
      .getRepository(Payment)
      .findOneBy({ id: job.data.paymentId });
    if (!payment) return; // stale job from a wiped environment — nothing to do
    if (payment.amountTzs <= 0) return; // reversals never fiscalize (credit notes are M5+ scope)
    if (await this.ds.getRepository(FiscalReceipt).findOneBy({ paymentId: payment.id })) {
      return; // already issued — retry after a partial success is a no-op
    }

    const order = await this.ds.getRepository(SalesOrder).findOneOrFail({
      where: { id: payment.orderId },
      relations: { lines: { product: true }, serviceLines: true, customer: true },
    });
    const merchant = await this.ds
      .getRepository(Merchant)
      .findOneByOrFail({ id: payment.merchantId });

    const receipt = await this.fiscal.issueReceipt(buildFiscalDraft(merchant, order, payment));

    await this.ds.getRepository(FiscalReceipt).save(
      this.ds.getRepository(FiscalReceipt).create({
        merchantId: payment.merchantId,
        paymentId: payment.id,
        vfdNumber: receipt.vfdNumber,
        verificationCode: receipt.verificationCode,
        qrUrl: receipt.qrUrl,
        issuedAt: new Date(receipt.issuedAt),
      }),
    );
    await this.audit.record({
      merchantId: payment.merchantId,
      actorUserId: null, // system
      entityType: 'FiscalReceipt',
      entityId: payment.id,
      action: 'FISCAL_ISSUED',
      after: {
        vfdNumber: receipt.vfdNumber,
        paymentId: payment.id,
        orderId: payment.orderId,
        attempts: job.attemptsMade + 1,
      },
    });
  }

  async onApplicationShutdown(): Promise<void> {
    await this.worker?.close();
  }
}
