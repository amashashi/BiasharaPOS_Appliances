import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Tzs } from '@biashara/shared';
import { CreditAgreement } from './credit-agreement.entity.js';
import { CreditScheduleRow } from './credit-schedule-row.entity.js';

export type ReminderStatus = 'PENDING' | 'SENT' | 'FAILED';

/**
 * One reminder SMS per schedule row per policy offset (T3.4) — the UNIQUE
 * (scheduleRowId, offsetDays) claim makes dispatch idempotent: reruns and
 * restarts can never double-text a customer. Rows are claimed PENDING, then
 * marked SENT/FAILED after the NotificationService call.
 */
@Entity('reminder_logs')
@Index(['scheduleRowId', 'offsetDays'], { unique: true })
@Index(['agreementId'])
export class ReminderLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @Column({ type: 'uuid' })
  agreementId!: string;

  @ManyToOne(() => CreditAgreement)
  @JoinColumn({ name: 'agreementId' })
  agreement!: CreditAgreement;

  @Column({ type: 'uuid' })
  scheduleRowId!: string;

  @ManyToOne(() => CreditScheduleRow)
  @JoinColumn({ name: 'scheduleRowId' })
  scheduleRow!: CreditScheduleRow;

  /** Policy offset that fired: negative = before due, 0 = due day, positive = overdue. */
  @Column({ type: 'integer' })
  offsetDays!: number;

  @Column({ type: 'date' })
  dueDate!: string;

  @Column({ type: 'varchar' })
  msisdn!: string;

  @Column({ type: 'varchar' })
  templateKey!: string;

  /** Outstanding amount on the row at dispatch time, integer TZS. */
  @Column({ type: 'integer' })
  amountTzs!: Tzs;

  @Column({ type: 'varchar', default: 'PENDING' })
  status!: ReminderStatus;

  @Column({ type: 'varchar', nullable: true })
  error!: string | null;

  @CreateDateColumn({ name: 'sentAt' })
  sentAt!: Date;
}
