import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Merchant } from './merchant.entity.js';

/**
 * Retail customer (T2.1). Name + phone is the identity dealers actually use —
 * the phone number is how mali-kauli customers are reached (reminders, M3).
 */
@Entity('customers')
@Index(['merchantId', 'phone'])
export class Customer {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @ManyToOne(() => Merchant)
  @JoinColumn({ name: 'merchantId' })
  merchant!: Merchant;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  /** TRA TIN for customers who want fiscal receipts in their name. */
  @Column({ type: 'varchar', nullable: true })
  tin!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
