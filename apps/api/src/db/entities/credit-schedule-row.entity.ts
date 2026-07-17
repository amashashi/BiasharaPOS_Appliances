import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { ScheduleRowStatus, Tzs } from '@biashara/shared';
import { CreditAgreement } from './credit-agreement.entity.js';

/**
 * One planned repayment (T3.1). Payments apply oldest-due-first (T3.2) and
 * update paidTzs/status; the arrears engine (T3.3) flips overdue rows.
 */
@Entity('credit_schedule_rows')
@Index(['agreementId', 'seq'], { unique: true })
@Index(['dueDate'])
export class CreditScheduleRow {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  agreementId!: string;

  @ManyToOne(() => CreditAgreement, (a) => a.schedule)
  @JoinColumn({ name: 'agreementId' })
  agreement!: CreditAgreement;

  @Column({ type: 'integer' })
  seq!: number;

  /** Due date as YYYY-MM-DD (Postgres `date` — no timezone games with due days). */
  @Column({ type: 'date' })
  dueDate!: string;

  @Column({ type: 'integer' })
  amountTzs!: Tzs;

  @Column({ type: 'integer', default: 0 })
  paidTzs!: Tzs;

  @Column({ type: 'varchar', default: 'PENDING' })
  status!: ScheduleRowStatus;
}
