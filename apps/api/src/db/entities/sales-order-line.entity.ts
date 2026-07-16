import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Tzs } from '@biashara/shared';
import { SalesOrder } from './sales-order.entity.js';
import { Product } from './product.entity.js';

/** One product line on an order. Serial assignment arrives with reservations (T2.2). */
@Entity('sales_order_lines')
export class SalesOrderLine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => SalesOrder, (o) => o.lines)
  @JoinColumn({ name: 'orderId' })
  order!: SalesOrder;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'integer' })
  qty!: number;

  /** Agreed price per unit — captured at order time, independent of catalog drift. */
  @Column({ type: 'integer' })
  unitPriceTzs!: Tzs;
}
