import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { NotificationService } from '@biashara/shared';
import { formatDate } from '@biashara/ui/i18n';
import { DATA_SOURCE } from '../db/tokens.js';
import { NOTIFICATION_SERVICE } from '../platform/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { ReminderLog } from '../db/entities/reminder-log.entity.js';
import { formatOrderNumber } from '../orders/orders.service.js';
import { todayIso } from './arrears.service.js';

/** Offsets must stay within a sane collections window. */
const OFFSET_MIN = -30;
const OFFSET_MAX = 60;
const MAX_OFFSETS = 6;

interface DueReminder {
  scheduleRowId: string;
  agreementId: string;
  merchantId: string;
  merchantName: string;
  offsetDays: number;
  dueDate: string;
  msisdn: string;
  customerName: string;
  orderNumber: number;
  outstandingTzs: number;
}

export interface DispatchSummary {
  asOf: string;
  candidates: number;
  sent: number;
  failed: number;
  alreadySent: number;
}

const templateFor = (offset: number): string =>
  offset < 0 ? 'reminder.upcoming' : offset === 0 ? 'reminder.due' : 'reminder.overdue';

/**
 * Payment reminders (T3.4). Policy = per-merchant day offsets vs. due date
 * (default [-2, 0, 3]). dispatchDue(asOf) finds every unpaid schedule row of
 * an ACTIVE agreement whose customer has a phone and where (asOf − dueDate)
 * matches a policy offset, then sends through the NotificationService port.
 * The UNIQUE(scheduleRowId, offsetDays) claim makes reruns idempotent —
 * a customer is never double-texted. Explicit asOf → fake-clock testable.
 */
@Injectable()
export class RemindersService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(NOTIFICATION_SERVICE) private readonly sms: NotificationService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async dispatchDue(asOf: string = todayIso()): Promise<DispatchSummary> {
    const due = (await this.ds.query(
      `SELECT r."id"           AS "scheduleRowId",
              a."id"           AS "agreementId",
              a."merchantId"   AS "merchantId",
              m."name"         AS "merchantName",
              ($1::date - r."dueDate")::int AS "offsetDays",
              r."dueDate"::text AS "dueDate",
              c."phone"        AS "msisdn",
              c."name"         AS "customerName",
              o."number"       AS "orderNumber",
              (r."amountTzs" - r."paidTzs")::int AS "outstandingTzs"
         FROM credit_schedule_rows r
         JOIN credit_agreements a ON a."id" = r."agreementId" AND a."status" = 'ACTIVE'
         JOIN merchants m         ON m."id" = a."merchantId"
         JOIN customers c         ON c."id" = a."customerId" AND c."phone" IS NOT NULL
         JOIN sales_orders o      ON o."id" = a."orderId"
        WHERE r."status" <> 'PAID'
          AND ($1::date - r."dueDate")::int IN (
                SELECT jsonb_array_elements_text(m."reminderOffsetsDays")::int
              )
        ORDER BY a."merchantId", r."dueDate", r."id"`,
      [asOf],
    )) as DueReminder[];

    const summary: DispatchSummary = {
      asOf,
      candidates: due.length,
      sent: 0,
      failed: 0,
      alreadySent: 0,
    };

    for (const item of due) {
      // claim first — at-most-once even across crashes and reruns
      const claimed = (await this.ds.query(
        `INSERT INTO reminder_logs
           ("merchantId", "agreementId", "scheduleRowId", "offsetDays", "dueDate",
            "msisdn", "templateKey", "amountTzs", "status")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING')
         ON CONFLICT ("scheduleRowId", "offsetDays") DO NOTHING
         RETURNING "id"`,
        [
          item.merchantId,
          item.agreementId,
          item.scheduleRowId,
          item.offsetDays,
          item.dueDate,
          item.msisdn,
          templateFor(item.offsetDays),
          item.outstandingTzs,
        ],
      )) as Array<{ id: string }>;
      if (claimed.length === 0) {
        summary.alreadySent += 1;
        continue;
      }

      try {
        await this.sms.sendSms(item.msisdn, templateFor(item.offsetDays), {
          customerName: item.customerName,
          merchantName: item.merchantName,
          orderNumber: formatOrderNumber(item.orderNumber),
          amountTzs: item.outstandingTzs.toLocaleString('en-US'),
          dueDate: formatDate(item.dueDate),
          ...(item.offsetDays > 0 ? { daysOverdue: String(item.offsetDays) } : {}),
        });
        await this.ds
          .getRepository(ReminderLog)
          .update(claimed[0].id, { status: 'SENT', error: null });
        summary.sent += 1;
      } catch (e) {
        await this.ds
          .getRepository(ReminderLog)
          .update(claimed[0].id, { status: 'FAILED', error: (e as Error).message.slice(0, 500) });
        summary.failed += 1;
      }
    }

    await this.audit.record({
      merchantId: null,
      actorUserId: null, // system job
      entityType: 'ReminderRun',
      entityId: asOf,
      action: 'REMINDERS_DISPATCHED',
      after: { ...summary },
    });
    return summary;
  }

  async getPolicy(merchantId: string): Promise<{ offsetsDays: number[] }> {
    const merchant = await this.ds.getRepository(Merchant).findOneByOrFail({ id: merchantId });
    return { offsetsDays: merchant.reminderOffsetsDays };
  }

  async setPolicy(
    merchantId: string,
    actorUserId: string,
    offsets: unknown,
  ): Promise<{ offsetsDays: number[] }> {
    if (
      !Array.isArray(offsets) ||
      offsets.length === 0 ||
      offsets.length > MAX_OFFSETS ||
      offsets.some((o) => !Number.isSafeInteger(o) || o < OFFSET_MIN || o > OFFSET_MAX) ||
      new Set(offsets).size !== offsets.length
    ) {
      throw new BadRequestException({
        message: `offsetsDays must be 1–${MAX_OFFSETS} unique whole days between ${OFFSET_MIN} and ${OFFSET_MAX} (negative = before due date)`,
      });
    }
    const sorted = [...(offsets as number[])].sort((a, b) => a - b);
    const before = await this.getPolicy(merchantId);
    await this.ds.getRepository(Merchant).update(merchantId, { reminderOffsetsDays: sorted });
    await this.audit.record({
      merchantId,
      actorUserId,
      entityType: 'Merchant',
      entityId: merchantId,
      action: 'REMINDER_POLICY_CHANGED',
      before: { offsetsDays: before.offsetsDays },
      after: { offsetsDays: sorted },
    });
    return { offsetsDays: sorted };
  }

  /** Per-agreement reminder log (newest first) — the agreement screen's data. */
  async logForAgreement(merchantId: string, agreementId: string): Promise<ReminderLog[]> {
    return this.ds.getRepository(ReminderLog).find({
      where: { merchantId, agreementId },
      order: { sentAt: 'DESC' },
    });
  }
}
