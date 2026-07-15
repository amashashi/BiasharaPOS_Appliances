import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Location } from './location.entity.js';
import { UserRef } from './user-ref.entity.js';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  /** TRA taxpayer identification number */
  @Column({ type: 'varchar', nullable: true })
  tin!: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Location, (l) => l.merchant)
  locations!: Location[];

  @OneToMany(() => UserRef, (u) => u.merchant)
  users!: UserRef[];
}
