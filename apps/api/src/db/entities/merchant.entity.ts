import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Location } from './location.entity.js';
import { UserRef } from './user-ref.entity.js';

@Entity('merchants')
export class Merchant {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  name!: string;

  /** TRA taxpayer identification number */
  @Column({ type: 'varchar', nullable: true })
  tin!: string | null;

  @Column({ type: 'varchar', nullable: true })
  phone!: string | null;

  /** Reminder policy (T3.4): day offsets vs. due date, e.g. [-2, 0, 3]. */
  @Column({ type: 'jsonb', default: () => `'[-2,0,3]'` })
  reminderOffsetsDays!: number[];

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Location, (l) => l.merchant)
  locations!: Location[];

  @OneToMany(() => UserRef, (u) => u.merchant)
  users!: UserRef[];
}
