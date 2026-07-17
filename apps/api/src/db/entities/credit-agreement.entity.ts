import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { CreditAgreementStatus, CreditAgreementType, Tzs } from '@biashara/shared';
import { SalesOrder } from './sales-order.entity.js';
import { Customer } from './customer.entity.js';
import { CreditScheduleRow } from './credit-schedule-row.entity.js';

/**
 * The digitized mali-kauli notebook (T3.1, D-009: retailer-carried credit only).
 * One agreement per order. INSTALLMENT releases goods at handover; LAYAWAY
 * holds units RESERVED until SETTLED (enforced in FulfillmentService).
 * principal = order total at creation; deposit = what was already paid then;
 * the schedule finances the difference.
 */
@Entity('credit_agreements')
@Index(['orderId'], { unique: true })
@Index(['merchantId', 'status'])
export class CreditAgreement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => SalesOrder)
  @JoinColumn({ name: 'orderId' })
  order!: SalesOrder;

  @Column({ type: 'uuid' })
  customerId!: string;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer;

  @Column({ type: 'varchar' })
  type!: CreditAgreementType;

  /** Order total at agreement creation, integer TZS. */
  @Column({ type: 'integer' })
  principalTzs!: Tzs;

  /** Paid on the order at agreement creation (the upfront deposit), integer TZS. */
  @Column({ type: 'integer' })
  depositTzs!: Tzs;

  @Column({ type: 'varchar', default: 'ACTIVE' })
  status!: CreditAgreementStatus;

  @OneToMany(() => CreditScheduleRow, (r) => r.agreement)
  schedule!: CreditScheduleRow[];

  @Column({ type: 'varchar' })
  createdByUserId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  settledAt!: Date | null;
}
