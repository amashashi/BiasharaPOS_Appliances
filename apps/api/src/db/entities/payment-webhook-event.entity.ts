import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import type { MobileMoneyProvider, Tzs } from '@biashara/shared';

/** UNMATCHED = no intent for the ref; UNAPPLIED_BALANCE = confirmed but didn't fit (D-027). */
export type WebhookReason = 'UNMATCHED' | 'UNAPPLIED_BALANCE';

/**
 * A payment webhook that did not cleanly apply (T5.3a) — the reconciliation
 * queue. Recorded instead of dropped so a real aggregator's retries don't loop
 * and a human can resolve (refund / apply elsewhere). One open row per matched
 * intent (partial unique index, see the migration).
 */
@Entity('payment_webhook_events')
@Index(['merchantId'])
export class PaymentWebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Null when UNMATCHED — money we can't attribute to a merchant. */
  @Column({ type: 'uuid', nullable: true })
  merchantId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  matchedIntentId!: string | null;

  /** The order/intent reference the webhook carried (our correlation key). */
  @Column({ type: 'varchar' })
  intentRef!: string;

  @Column({ type: 'varchar', nullable: true })
  provider!: MobileMoneyProvider | null;

  @Column({ type: 'varchar', nullable: true })
  providerRef!: string | null;

  @Column({ type: 'integer', nullable: true })
  amountTzs!: Tzs | null;

  @Column({ type: 'varchar' })
  status!: string;

  @Column({ type: 'varchar' })
  reason!: WebhookReason;

  @Column({ type: 'jsonb' })
  rawPayload!: Record<string, unknown>;

  @CreateDateColumn()
  receivedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @Column({ type: 'varchar', nullable: true })
  resolvedByUserId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  resolutionNote!: string | null;
}
