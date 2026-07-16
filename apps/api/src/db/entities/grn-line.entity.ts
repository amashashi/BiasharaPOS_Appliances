import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Tzs } from '@biashara/shared';
import { Grn } from './grn.entity.js';
import { Product } from './product.entity.js';

/** One product line on a GRN. For serialized products qty === serials received. */
@Entity('grn_lines')
export class GrnLine {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  grnId!: string;

  @ManyToOne(() => Grn, (g) => g.lines)
  @JoinColumn({ name: 'grnId' })
  grn!: Grn;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'integer' })
  qty!: number;

  /** Cost per unit on this receipt, integer TZS; null = not recorded. */
  @Column({ type: 'integer', nullable: true })
  unitCostTzs!: Tzs | null;
}
