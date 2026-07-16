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
import type { TaxCode, Tzs } from '@biashara/shared';
import { Merchant } from './merchant.entity.js';

/** Catalog product (T1.1). Serial logic lives in inventory, never here. */
@Entity('products')
@Index(['merchantId', 'brand', 'model'])
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchantId' })
  merchant!: Merchant;

  /** Merchant-assigned code; unique per merchant when present (partial index in migration). */
  @Column({ type: 'varchar', nullable: true })
  sku!: string | null;

  @Column({ type: 'varchar' })
  brand!: string;

  @Column({ type: 'varchar' })
  model!: string;

  @Column({ type: 'varchar' })
  category!: string;

  @Column({ type: 'varchar', default: 'A' })
  taxCode!: TaxCode;

  /** Selling price, integer TZS. */
  @Column({ type: 'integer' })
  priceTzs!: Tzs;

  /** Default cost, integer TZS; per-unit cost is captured at GRN time (T1.2). */
  @Column({ type: 'integer', nullable: true })
  costTzs!: Tzs | null;

  /**
   * Serialized products are tracked unit-by-unit (serialized_units, T1.2);
   * non-serialized (accessories, cables) by quantity (stock_levels, T1.5).
   * Immutable once the product has any stock — the two models don't convert.
   */
  @Column({ type: 'boolean', default: true })
  isSerialized!: boolean;

  /** Soft archive: products referenced by units/orders are never hard-deleted. */
  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
