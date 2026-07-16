import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Tzs } from '@biashara/shared';
import { SalesOrder } from './sales-order.entity.js';

export type ServiceKind = 'DELIVERY' | 'INSTALLATION';

/** Delivery / installation charge attached to an order (T2.1). */
@Entity('sales_order_service_lines')
export class SalesOrderServiceLine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => SalesOrder, (o) => o.serviceLines)
  @JoinColumn({ name: 'orderId' })
  order!: SalesOrder;

  @Column({ type: 'varchar' })
  kind!: ServiceKind;

  @Column({ type: 'integer' })
  priceTzs!: Tzs;

  @Column({ type: 'varchar', nullable: true })
  note!: string | null;
}
