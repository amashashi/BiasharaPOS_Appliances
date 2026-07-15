import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Role } from '@biashara/shared';
import { Merchant } from './merchant.entity.js';

/**
 * Local reference for users known via the platform Identity service (D-004).
 * Credentials/profile live in the platform; we store the mapping + role.
 */
@Entity('user_refs')
@Index(['merchantId', 'platformUserId'], { unique: true })
export class UserRef {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  merchantId!: string;

  @ManyToOne(() => Merchant, (m) => m.users)
  @JoinColumn({ name: 'merchantId' })
  merchant!: Merchant;

  @Column()
  platformUserId!: string;

  @Column()
  displayName!: string;

  @Column({ type: 'varchar' })
  role!: Role;

  @CreateDateColumn()
  createdAt!: Date;
}
