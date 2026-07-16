import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Merchant } from './merchant.entity.js';
import { Location } from './location.entity.js';
import { GrnLine } from './grn-line.entity.js';

/** Goods received note (T1.2): the receiving event serials enter stock through. */
@Entity('grns')
@Index(['merchantId', 'createdAt'])
export class Grn {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchantId' })
  merchant!: Merchant;

  @Column({ type: 'uuid' })
  locationId!: string;

  @ManyToOne(() => Location)
  @JoinColumn({ name: 'locationId' })
  location!: Location;

  @Column({ type: 'varchar', nullable: true })
  supplierName!: string | null;

  @Column({ type: 'varchar', nullable: true })
  note!: string | null;

  /** Platform user id (from the JWT) of whoever received the stock. */
  @Column({ type: 'varchar' })
  receivedByUserId!: string;

  @OneToMany(() => GrnLine, (l) => l.grn)
  lines!: GrnLine[];

  @CreateDateColumn()
  createdAt!: Date;
}
