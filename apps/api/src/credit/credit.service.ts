import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { DataSource, EntityManager } from 'typeorm';
import type { CreditAgreementType } from '@biashara/shared';
import { DATA_SOURCE } from '../db/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { CreditAgreement } from '../db/entities/credit-agreement.entity.js';
import { CreditScheduleRow } from '../db/entities/credit-schedule-row.entity.js';
import { ReminderLog } from '../db/entities/reminder-log.entity.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { Payment } from '../db/entities/payment.entity.js';
import { PaymentsService } from '../orders/payments.service.js';
import type { StatementData } from './statement-pdf.js';
import { generateEqualMonthly, isIsoDate, validateCustomRows, type ScheduleRowPlan } from './schedule.js';
import type { FieldError } from '../catalog/product.rules.js';

export interface CreateAgreementInput {
  type?: unknown;
  schedule?: {
    /** Equal-monthly generator … */
    months?: unknown;
    firstDueDate?: unknown;
    /** … OR custom rows. Exactly one of the two shapes. */
    rows?: Array<{ dueDate?: unknown; amountTzs?: unknown }>;
  };
}

const TYPES: readonly CreditAgreementType[] = ['INSTALLMENT', 'LAYAWAY'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_MONTHS = 36;

/**
 * The credit notebook (T3.1, D-009). Creation snapshot: principal = order
 * total, deposit = what's already paid, schedule finances the rest — so
 * deposit + schedule = total always holds. INSTALLMENT releases goods;
 * LAYAWAY blocks fulfillment until SETTLED (checked in FulfillmentService).
 */
@Injectable()
export class CreditService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(PaymentsService) private readonly payments: PaymentsService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async create(merchantId: string, orderId: string, actorUserId: string, input: CreateAgreementInput) {
    const type = String(input.type ?? '').trim().toUpperCase() as CreditAgreementType;
    if (!TYPES.includes(type)) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [{ field: 'type', message: `type must be one of ${TYPES.join(', ')}` }],
      });
    }

    const agreementId = await this.ds.transaction(async (mgr) => {
      const order = await this.lockOrder(mgr, merchantId, orderId);
      if (order.status !== 'CONFIRMED') {
        throw new BadRequestException({
          message: `Credit agreements attach to CONFIRMED orders (this one is ${order.status})`,
        });
      }
      if (!order.customerId) {
        throw new BadRequestException({
          message: 'Credit needs a customer on the order — attach name and phone first (mali kauli is personal)',
        });
      }
      const existing = await mgr.getRepository(CreditAgreement).findOneBy({ orderId: order.id });
      if (existing) {
        throw new ConflictException(`Order already has a ${existing.type} agreement (${existing.status})`);
      }

      const { totalTzs, paidTzs } = await this.payments.orderSummary(mgr, order);
      const financedTzs = totalTzs - paidTzs;
      if (financedTzs <= 0) {
        throw new BadRequestException({
          message: 'Order is already fully paid — nothing to finance',
        });
      }

      const plan = this.buildPlan(financedTzs, input.schedule ?? {});

      const agreement = await mgr.getRepository(CreditAgreement).save(
        mgr.getRepository(CreditAgreement).create({
          merchantId,
          orderId: order.id,
          customerId: order.customerId,
          type,
          principalTzs: totalTzs,
          depositTzs: paidTzs,
          status: 'ACTIVE',
          createdByUserId: actorUserId,
          settledAt: null,
        }),
      );
      for (const row of plan) {
        await mgr.getRepository(CreditScheduleRow).save(
          mgr.getRepository(CreditScheduleRow).create({
            agreementId: agreement.id,
            seq: row.seq,
            dueDate: row.dueDate,
            amountTzs: row.amountTzs,
            paidTzs: 0,
            status: 'PENDING',
          }),
        );
      }
      await this.audit.record(
        {
          merchantId,
          actorUserId,
          entityType: 'CreditAgreement',
          entityId: agreement.id,
          action: 'AGREEMENT_CREATED',
          after: {
            orderId: order.id,
            orderNumber: order.number,
            type,
            principalTzs: totalTzs,
            depositTzs: paidTzs,
            financedTzs,
            schedule: plan,
          },
        },
        mgr,
      );
      return agreement.id;
    });
    return this.getForOrder(merchantId, orderId, agreementId);
  }

  async getForOrder(merchantId: string, orderId: string, agreementId?: string) {
    const agreement = await this.ds.getRepository(CreditAgreement).findOne({
      where: agreementId
        ? { id: agreementId, merchantId }
        : UUID_RE.test(orderId)
          ? { orderId, merchantId }
          : { id: 'never' },
      relations: { customer: true },
    });
    if (!agreement) throw new NotFoundException('No credit agreement on this order');
    const schedule = await this.ds
      .getRepository(CreditScheduleRow)
      .find({ where: { agreementId: agreement.id }, order: { seq: 'ASC' } });
    // per-agreement reminder log (T3.4) — the agreement screen shows it
    const reminders = await this.ds
      .getRepository(ReminderLog)
      .find({ where: { agreementId: agreement.id }, order: { sentAt: 'DESC' } });
    const financedTzs = agreement.principalTzs - agreement.depositTzs;
    return {
      ...agreement,
      schedule,
      reminders,
      financedTzs,
      scheduleTotalTzs: schedule.reduce((s, r) => s + r.amountTzs, 0),
    };
  }

  /**
   * Assemble everything the statement PDF (T3.5) needs. Balance is computed
   * from the SAME ledger the payments API serves (principal − Σ payments),
   * never a stored field — the statement can't disagree with the ledger.
   */
  async statementData(merchantId: string, orderId: string): Promise<StatementData> {
    const agreement = UUID_RE.test(orderId)
      ? await this.ds.getRepository(CreditAgreement).findOne({
          where: { orderId, merchantId },
          relations: { customer: true, order: { location: true } },
        })
      : null;
    if (!agreement) throw new NotFoundException('No credit agreement on this order');

    const schedule = await this.ds
      .getRepository(CreditScheduleRow)
      .find({ where: { agreementId: agreement.id }, order: { seq: 'ASC' } });
    const payments = await this.ds
      .getRepository(Payment)
      .find({ where: { orderId: agreement.orderId }, order: { seq: 'ASC' } });
    const merchant = await this.ds.getRepository(Merchant).findOneByOrFail({ id: merchantId });

    const paidTzs = payments.reduce((s, p) => s + p.amountTzs, 0);
    return {
      merchant,
      order: agreement.order,
      customer: agreement.customer,
      agreement,
      schedule,
      payments,
      paidTzs,
      balanceTzs: agreement.principalTzs - paidTzs,
    };
  }

  private buildPlan(
    financedTzs: number,
    schedule: NonNullable<CreateAgreementInput['schedule']>,
  ): ScheduleRowPlan[] {
    const hasMonths = schedule.months !== undefined;
    const hasRows = Array.isArray(schedule.rows) && schedule.rows.length > 0;
    if (hasMonths === hasRows) {
      throw new BadRequestException({
        message: 'Provide exactly one schedule shape: {months, firstDueDate} or {rows: [...]}',
      });
    }
    if (hasMonths) {
      const errors: FieldError[] = [];
      const months = schedule.months;
      if (typeof months !== 'number' || !Number.isSafeInteger(months) || months < 1 || months > MAX_MONTHS) {
        errors.push({ field: 'schedule.months', message: `months must be a whole number 1–${MAX_MONTHS}` });
      }
      const firstDueDate = String(schedule.firstDueDate ?? '');
      if (!isIsoDate(firstDueDate)) {
        errors.push({ field: 'schedule.firstDueDate', message: 'firstDueDate must be YYYY-MM-DD' });
      }
      if (errors.length) throw new BadRequestException({ message: 'Validation failed', errors });
      return generateEqualMonthly(financedTzs, months as number, firstDueDate);
    }
    const { plan, errors } = validateCustomRows(financedTzs, schedule.rows ?? []);
    if (errors.length) throw new BadRequestException({ message: 'Validation failed', errors });
    return plan;
  }

  private async lockOrder(mgr: EntityManager, merchantId: string, orderId: string): Promise<SalesOrder> {
    const order = UUID_RE.test(orderId)
      ? await mgr
          .getRepository(SalesOrder)
          .createQueryBuilder('o')
          .setLock('pessimistic_write')
          .where('o.id = :orderId AND o.merchantId = :merchantId', { orderId, merchantId })
          .getOne()
      : null;
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
