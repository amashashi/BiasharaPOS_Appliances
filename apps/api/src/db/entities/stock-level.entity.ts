import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity.js';
import { Location } from './location.entity.js';

/**
 * Quantity-on-hand for NON-serialized products (T1.5) — accessories, cables.
 * One row per merchant × product × location; receipts add to qty.
 * Serialized stock is never counted here (it is the unit rows themselves).
 */
@Entity('stock_levels')
@Index(['merchantId', 'productId', 'locationId'], { unique: true })
export class StockLevel {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'uuid' })
  locationId!: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location!: Location;

  @Column({ type: 'integer', default: 0 })
  qty!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
