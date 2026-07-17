import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { DataSource, EntityManager } from 'typeorm';
import { DATA_SOURCE } from '../db/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { CreditAgreement } from '../db/entities/credit-agreement.entity.js';
import { CreditScheduleRow } from '../db/entities/credit-schedule-row.entity.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { Payment } from '../db/entities/payment.entity.js';
import { PaymentsService } from '../orders/payments.service.js';
import { applyDelta } from './schedule.js';

/**
 * Applies every order payment to its credit agreement's schedule (T3.2),
 * oldest-due-first, atomically inside the payment's transaction. Registers as
 * a hook on PaymentsService so cash and mobile-money flow through unchanged;
 * orders without an agreement are a no-op. Full coverage settles the agreement
 * (auto-unlocking layaway goods); a reversal that drops coverage un-settles.
 */
@Injectable()
export class ScheduleApplicationService implements OnModuleInit {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(PaymentsService) private readonly payments: PaymentsService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  onModuleInit(): void {
    this.payments.registerAppliedHook((mgr, order, payment) => this.apply(mgr, order, payment));
  }

  private async apply(mgr: EntityManager, order: SalesOrder, payment: Payment): Promise<void> {
    const agreement = await mgr
      .getRepository(CreditAgreement)
      .createQueryBuilder('a')
      .setLock('pessimistic_write')
      .where('a.orderId = :orderId', { orderId: order.id })
      .getOne();
    // no agreement, or one already resolved by hand — nothing to apply against
    if (!agreement || (agreement.status !== 'ACTIVE' && agreement.status !== 'SETTLED')) return;

    const rows = await mgr
      .getRepository(CreditScheduleRow)
      .find({ where: { agreementId: agreement.id }, order: { seq: 'ASC' } });

    applyDelta(rows, payment.amountTzs);
    for (const row of rows) {
      await mgr.getRepository(CreditScheduleRow).update(row.id, {
        paidTzs: row.paidTzs,
        status: row.status,
      });
    }

    const fullyPaid = rows.every((r) => r.paidTzs >= r.amountTzs);
    if (fullyPaid && agreement.status === 'ACTIVE') {
      await mgr
        .getRepository(CreditAgreement)
        .update(agreement.id, { status: 'SETTLED', settledAt: new Date() });
      await this.audit.record(
        {
          merchantId: agreement.merchantId,
          actorUserId: payment.recordedByUserId,
          entityType: 'CreditAgreement',
          entityId: agreement.id,
          action: 'AGREEMENT_SETTLED',
          after: { orderId: order.id, paymentId: payment.id },
        },
        mgr,
      );
    } else if (!fullyPaid && agreement.status === 'SETTLED') {
      // a reversal dropped coverage below full — the debt is live again
      await mgr
        .getRepository(CreditAgreement)
        .update(agreement.id, { status: 'ACTIVE', settledAt: null });
      await this.audit.record(
        {
          merchantId: agreement.merchantId,
          actorUserId: payment.recordedByUserId,
          entityType: 'CreditAgreement',
          entityId: agreement.id,
          action: 'AGREEMENT_REOPENED',
          before: { status: 'SETTLED' },
          after: { orderId: order.id, paymentId: payment.id },
        },
        mgr,
      );
    }
  }
}
