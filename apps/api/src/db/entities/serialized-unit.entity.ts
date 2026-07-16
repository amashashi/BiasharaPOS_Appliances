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
import type { Tzs, UnitStatus } from '@biashara/shared';
import { Product } from './product.entity.js';
import { Location } from './location.entity.js';
import { Grn } from './grn.entity.js';

/**
 * One physical serialized unit (T1.2). Serial is unique per merchant.
 * `status` changes ONLY through the state machine (T1.3) — services must
 * never set it directly after creation.
 */
@Entity('serialized_units')
@Index(['merchantId', 'serial'], { unique: true })
@Index(['merchantId', 'productId', 'status'])
export class SerializedUnit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @Column({ type: 'uuid' })
  productId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'varchar' })
  serial!: string;

  @Column({ type: 'varchar', default: 'IN_STOCK' })
  status!: UnitStatus;

  @Column({ type: 'uuid' })
  locationId!: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location!: Location;

  /** Receiving provenance — every unit enters stock through a GRN. */
  @Column({ type: 'uuid' })
  grnId!: string;

  @ManyToOne(() => Grn)
  @JoinColumn({ name: 'grnId' })
  grn!: Grn;

  /** Landed cost for THIS unit, integer TZS; null = not recorded at receiving. */
  @Column({ type: 'integer', nullable: true })
  costTzs!: Tzs | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
