import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { MobileMoneyProvider, Tzs } from '@biashara/shared';
import { SalesOrder } from './sales-order.entity.js';

export type IntentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

/**
 * Mobile-money push intent (T2.5): PENDING until the platform webhook
 * resolves it. A CONFIRMED intent normally points at the ledger payment it
 * applied; CONFIRMED with a null appliedPaymentId means money arrived that
 * no longer fits the order balance — the T5.3 reconciliation view's queue.
 */
@Entity('payment_intents')
@Index(['intentId'], { unique: true })
@Index(['orderId'])
export class PaymentIntent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => SalesOrder)
  @JoinColumn({ name: 'orderId' })
  order!: SalesOrder;

  @Column({ type: 'varchar' })
  provider!: MobileMoneyProvider;

  @Column({ type: 'varchar' })
  msisdn!: string;

  @Column({ type: 'integer' })
  amountTzs!: Tzs;

  /** The platform rail's intent id — webhook correlation key. */
  @Column({ type: 'varchar' })
  intentId!: string;

  @Column({ type: 'varchar', default: 'PENDING' })
  status!: IntentStatus;

  @Column({ type: 'varchar', nullable: true })
  providerRef!: string | null;

  @Column({ type: 'uuid', nullable: true })
  appliedPaymentId!: string | null;

  @Column({ type: 'varchar' })
  initiatedByUserId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;
}
