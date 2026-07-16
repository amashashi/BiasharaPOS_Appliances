import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Payment } from './payment.entity.js';

/**
 * TRA VFD receipt for one payment (T2.4, per-payment fiscalization D-008).
 * References the append-only payments ledger (D-025) — one receipt per
 * payment, enforced by the DB.
 */
@Entity('fiscal_receipts')
@Index(['paymentId'], { unique: true })
export class FiscalReceipt {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @Column({ type: 'uuid' })
  paymentId!: string;

  @ManyToOne(() => Payment)
  @JoinColumn({ name: 'paymentId' })
  payment!: Payment;

  @Column({ type: 'varchar' })
  vfdNumber!: string;

  @Column({ type: 'varchar' })
  verificationCode!: string;

  @Column({ type: 'varchar' })
  qrUrl!: string;

  @Column({ type: 'timestamptz' })
  issuedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
