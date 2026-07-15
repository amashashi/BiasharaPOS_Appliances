import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Merchant } from './merchant.entity.js';

export type LocationKind = 'SHOP' | 'WAREHOUSE';

@Entity('locations')
@Index(['merchantId', 'name'], { unique: true })
export class Location {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @ManyToOne(() => Merchant, (m) => m.locations)
  @JoinColumn({ name: 'merchantId' })
  merchant!: Merchant;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', default: 'SHOP' })
  kind!: LocationKind;

  @CreateDateColumn()
  createdAt!: Date;
}
