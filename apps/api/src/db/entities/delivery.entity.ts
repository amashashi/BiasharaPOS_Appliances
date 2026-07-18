import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { DeliveryStatus } from '@biashara/shared';
import { SalesOrder } from './sales-order.entity.js';

/**
 * Scheduled fulfillment for an order (T4.1). `status` starts PLANNED; dispatch
 * (T4.2) and proof-of-delivery (T4.3) drive it onward. At most one non-FAILED
 * delivery per order (partial unique index) — a failed one may be rescheduled.
 */
@Entity('deliveries')
@Index(['orderId'])
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => SalesOrder)
  @JoinColumn({ name: 'orderId' })
  order!: SalesOrder;

  /** Delivery day as YYYY-MM-DD (Postgres `date` — no timezone drift). */
  @Column({ type: 'date' })
  scheduledDate!: string;

  /** Free-text time window, e.g. "09:00–12:00" or "Asubuhi / Morning". */
  @Column({ type: 'varchar', nullable: true })
  window!: string | null;

  @Column({ type: 'varchar' })
  addressText!: string;

  /** Platform user id of the delivery staffer (assigned now or later). */
  @Column({ type: 'varchar', nullable: true })
  assigneeUserId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  note!: string | null;

  @Column({ type: 'varchar', default: 'PLANNED' })
  status!: DeliveryStatus;

  @Column({ type: 'varchar' })
  scheduledByUserId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
