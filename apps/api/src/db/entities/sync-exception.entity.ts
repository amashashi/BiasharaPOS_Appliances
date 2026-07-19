import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

export type SyncExceptionKind = 'SERIAL_CONFLICT' | 'STALE_PRICE';

/**
 * A conflict found while replaying an offline sale (T5.6). The order was still
 * created (the sale happened, cash collected); this row flags what didn't line
 * up with authoritative state so an OWNER can resolve it. One OPEN row per
 * (order, kind, serial) — replay is idempotent (see the migration's partial
 * unique index).
 */
@Entity('sync_exceptions')
@Index(['merchantId'])
export class SyncException {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  merchantId!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @Column({ type: 'uuid' })
  clientRef!: string;

  @Column({ type: 'varchar' })
  kind!: SyncExceptionKind;

  /**
   * SERIAL_CONFLICT: { productId, lineId, serial, foundStatus }.
   * STALE_PRICE:     { productId, lineId, offeredTzs, catalogTzs }.
   */
  @Column({ type: 'jsonb' })
  detail!: Record<string, unknown>;

  @Column({ type: 'varchar', default: 'OPEN' })
  status!: 'OPEN' | 'RESOLVED';

  @Column({ type: 'varchar', nullable: true })
  resolutionNote!: string | null;

  @Column({ type: 'varchar', nullable: true })
  resolvedByUserId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;
}
