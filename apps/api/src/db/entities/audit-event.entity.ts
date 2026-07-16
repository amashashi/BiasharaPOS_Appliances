import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type AuditJson = Record<string, unknown> | null;

/**
 * Append-only audit log (T0.5). Every domain mutation lands here — the
 * platform's traceability backbone and the future collateral-registry data
 * asset (serial state transitions, payments, credit mutations).
 * Immutability is enforced in the DATABASE by a trigger (see migration);
 * application code cannot update or delete rows even by mistake.
 */
@Entity('audit_events')
@Index(['entityType', 'entityId'])
export class AuditEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  merchantId!: string | null;

  /** Platform user who caused the mutation; null for system/subscriber-recorded events. */
  @Column({ type: 'varchar', nullable: true })
  actorUserId!: string | null;

  @Column({ type: 'varchar' })
  entityType!: string;

  @Column({ type: 'varchar', nullable: true })
  entityId!: string | null;

  @Column({ type: 'varchar' })
  action!: string; // INSERT | UPDATE | REMOVE | domain verbs later (e.g. UNIT_SOLD)

  @Column({ type: 'jsonb', nullable: true })
  before!: AuditJson;

  @Column({ type: 'jsonb', nullable: true })
  after!: AuditJson;

  @CreateDateColumn()
  at!: Date;

  /**
   * Monotonic insertion order (bigserial, DB-assigned). `at` is
   * transaction-stable, so same-transaction events tie on it — always
   * sort history by seq. bigint arrives as a string via pg.
   */
  @Column({ type: 'bigint', insert: false, update: false, nullable: true })
  seq!: string;
}
