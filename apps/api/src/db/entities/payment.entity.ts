import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { PaymentMethod, Tzs } from '@biashara/shared';
import { SalesOrder } from './sales-order.entity.js';

/**
 * Money ledger (T2.3). APPEND-ONLY — a database trigger rejects UPDATE/DELETE.
 * Corrections are reversing entries (negative amount + reversesPaymentId),
 * never mutations. Fiscal receipts reference payments from their own table
 * (T2.4) so a payment row never needs updating.
 */
@Entity('payments')
@Index(['orderId'])
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => SalesOrder, (o) => o.payments)
  @JoinColumn({ name: 'orderId' })
  order!: SalesOrder;

  @Column({ type: 'varchar' })
  method!: PaymentMethod;

  /** Integer TZS. Negative = reversing entry. */
  @Column({ type: 'integer' })
  amountTzs!: Tzs;

  /** Set on reversing entries; UNIQUE — a payment reverses at most once. */
  @Column({ type: 'uuid', nullable: true })
  reversesPaymentId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  note!: string | null;

  @Column({ type: 'varchar' })
  recordedByUserId!: string;

  @CreateDateColumn()
  at!: Date;

  /** Monotonic insertion order (bigserial) — `at` is transaction-stable. */
  @Column({ type: 'bigint', insert: false, update: false, nullable: true })
  seq!: string;
}
