import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { OrderStatus } from '@biashara/shared';
import { Merchant } from './merchant.entity.js';
import { Location } from './location.entity.js';
import { Customer } from './customer.entity.js';
import { SalesOrderLine } from './sales-order-line.entity.js';
import { SalesOrderServiceLine } from './sales-order-service-line.entity.js';
import { Payment } from './payment.entity.js';

/**
 * Sales order / quote (T2.1). `status` changes only through OrdersService's
 * transition door (same discipline as serialized units, T1.3).
 * Totals are computed from lines — never stored, never drift.
 */
@Entity('sales_orders')
@Index(['merchantId', 'number'], { unique: true })
@Index(['merchantId', 'status'])
export class SalesOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchantId' })
  merchant!: Merchant;

  /** Human-friendly per-merchant sequence (1, 2, 3 …) shown as SO-000001. */
  @Column({ type: 'integer' })
  number!: number;

  @Column({ type: 'varchar', default: 'QUOTE' })
  status!: OrderStatus;

  @Column({ type: 'uuid', nullable: true })
  customerId!: string | null;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customerId' })
  customer!: Customer | null;

  /** Selling location. */
  @Column({ type: 'uuid' })
  locationId!: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location!: Location;

  @Column({ type: 'varchar', nullable: true })
  note!: string | null;

  @Column({ type: 'varchar' })
  createdByUserId!: string;

  @OneToMany(() => SalesOrderLine, (l) => l.order)
  lines!: SalesOrderLine[];

  @OneToMany(() => SalesOrderServiceLine, (l) => l.order)
  serviceLines!: SalesOrderServiceLine[];

  @OneToMany(() => Payment, (p) => p.order)
  payments!: Payment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
