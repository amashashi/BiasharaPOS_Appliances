import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { DataSource, type EntityManager } from 'typeorm';
import type {
  MobileMoneyProvider,
  PaymentConfirmation,
  PaymentsService as PaymentsPort,
} from '@biashara/shared';
import { DATA_SOURCE } from '../db/tokens.js';
import { PAYMENTS_SERVICE } from '../platform/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { PaymentIntent } from '../db/entities/payment-intent.entity.js';
import { PaymentsService } from './payments.service.js';
import type { FieldError } from '../catalog/product.rules.js';

export interface InitiatePushInput {
  provider?: unknown;
  msisdn?: unknown;
  amountTzs?: unknown;
}

const PROVIDERS: readonly MobileMoneyProvider[] = ['MPESA', 'MIXX_BY_YAS', 'AIRTEL_MONEY'];
const MSISDN_RE = /^\+?255\d{9}$/;
const MAX_TZS = 2_000_000_000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** The webhook is the actor for platform-confirmed money. */
const WEBHOOK_ACTOR = 'platform:webhook';

/**
 * Mobile money at POS (T2.5): initiate an STK push through the PaymentsService
 * port, hold a PENDING intent, and let the platform's confirmation webhook
 * apply the money through the same single door cash uses (applyPayment) —
 * then fiscalize through the T2.4 queue.
 */
@Injectable()
export class MobileMoneyService implements OnModuleInit {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(PAYMENTS_SERVICE) private readonly rail: PaymentsPort,
    @Inject(PaymentsService) private readonly payments: PaymentsService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** Dev/stub loop: the stub delivers confirmations straight to us, platform-style (D-004). */
  onModuleInit(): void {
    const stub = this.rail as Partial<{
      onConfirmation: (h: (c: PaymentConfirmation) => Promise<void>) => void;
    }>;
    if (typeof stub.onConfirmation === 'function') {
      stub.onConfirmation((c) => this.processConfirmation(c).then(() => undefined));
    }
  }

  async initiate(merchantId: string, orderId: string, actorUserId: string, input: InitiatePushInput) {
    const errors: FieldError[] = [];
    const provider = String(input.provider ?? '').trim().toUpperCase() as MobileMoneyProvider;
    if (!PROVIDERS.includes(provider)) {
      errors.push({ field: 'provider', message: `provider must be one of ${PROVIDERS.join(', ')}` });
    }
    const msisdn = String(input.msisdn ?? '').trim();
    if (!MSISDN_RE.test(msisdn)) {
      errors.push({ field: 'msisdn', message: 'msisdn must be a Tanzanian number (+255XXXXXXXXX)' });
    }
    const amountTzs = typeof input.amountTzs === 'number' ? input.amountTzs : NaN;
    if (!Number.isSafeInteger(amountTzs) || amountTzs <= 0 || amountTzs > MAX_TZS) {
      errors.push({ field: 'amountTzs', message: 'amountTzs must be a positive whole number of TZS' });
    }
    if (errors.length) throw new BadRequestException({ message: 'Validation failed', errors });

    // validate against the live balance BEFORE pushing to the customer's phone
    const order = await this.getOrder(merchantId, orderId);
    this.payments.assertPayable(order);
    const { totalTzs, paidTzs } = await this.payments.orderSummary(this.ds.manager, order);
    if (amountTzs > totalTzs - paidTzs) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: [{
          field: 'amountTzs',
          message: `push of TZS ${amountTzs.toLocaleString('en-US')} exceeds the balance of TZS ${(totalTzs - paidTzs).toLocaleString('en-US')}`,
        }],
      });
    }

    const { intentId } = await this.rail.initiateMobileMoneyPush(provider, msisdn, amountTzs, order.id);
    const intent = await this.ds.getRepository(PaymentIntent).save(
      this.ds.getRepository(PaymentIntent).create({
        merchantId,
        orderId: order.id,
        provider,
        msisdn,
        amountTzs,
        intentId,
        status: 'PENDING',
        providerRef: null,
        appliedPaymentId: null,
        initiatedByUserId: actorUserId,
        resolvedAt: null,
      }),
    );
    await this.audit.record({
      merchantId,
      actorUserId,
      entityType: 'PaymentIntent',
      entityId: intent.id,
      action: 'MM_PUSH_INITIATED',
      after: { orderId: order.id, provider, msisdn, amountTzs, intentId },
    });
    return intent;
  }

  /**
   * Platform webhook entry (idempotent by intent). CONFIRMED money applies
   * through applyPayment when it still fits the balance; when it no longer
   * fits (e.g. cash settled the order while the push was pending), the
   * intent stays CONFIRMED with no applied payment — the T5.3
   * reconciliation queue's case — and NOTHING is silently dropped.
   */
  async processConfirmation(confirmation: PaymentConfirmation) {
    const { intentId, status, providerRef } = confirmation;
    if (!intentId || (status !== 'CONFIRMED' && status !== 'FAILED')) {
      throw new BadRequestException({ message: 'intentId and status CONFIRMED|FAILED are required' });
    }

    const result = await this.ds.transaction(async (mgr) => {
      const intent = await mgr
        .getRepository(PaymentIntent)
        .createQueryBuilder('i')
        .setLock('pessimistic_write')
        .where('i.intentId = :intentId', { intentId })
        .getOne();
      if (!intent) throw new NotFoundException(`Unknown payment intent "${intentId}"`);
      if (intent.status !== 'PENDING') {
        return { intent, replay: true, paymentId: intent.appliedPaymentId }; // idempotent replay
      }

      intent.status = status;
      intent.providerRef = providerRef ?? null;
      intent.resolvedAt = new Date();

      if (status === 'FAILED') {
        await mgr.getRepository(PaymentIntent).save(intent);
        await this.audit.record(
          {
            merchantId: intent.merchantId,
            actorUserId: WEBHOOK_ACTOR,
            entityType: 'PaymentIntent',
            entityId: intent.id,
            action: 'MM_PUSH_FAILED',
            after: { orderId: intent.orderId, intentId, providerRef },
          },
          mgr,
        );
        return { intent, replay: false, paymentId: null };
      }

      const order = await this.lockOrder(mgr, intent.merchantId, intent.orderId);
      const { totalTzs, paidTzs } = await this.payments.orderSummary(mgr, order);
      if (intent.amountTzs <= totalTzs - paidTzs) {
        const applied = await this.payments.applyPayment(mgr, order, {
          method: 'MOBILE_MONEY',
          amountTzs: intent.amountTzs,
          note: `${intent.provider} ${providerRef ?? ''}`.trim(),
          actorUserId: WEBHOOK_ACTOR,
          recordedByUserId: WEBHOOK_ACTOR,
        });
        intent.appliedPaymentId = applied.payment.id;
        await mgr.getRepository(PaymentIntent).save(intent);
        return { intent, replay: false, paymentId: applied.payment.id };
      }

      // money confirmed but the balance moved — keep it visible, apply nothing
      await mgr.getRepository(PaymentIntent).save(intent);
      await this.audit.record(
        {
          merchantId: intent.merchantId,
          actorUserId: WEBHOOK_ACTOR,
          entityType: 'PaymentIntent',
          entityId: intent.id,
          action: 'MM_CONFIRMED_UNAPPLIED',
          after: {
            orderId: intent.orderId,
            intentId,
            amountTzs: intent.amountTzs,
            balanceTzs: totalTzs - paidTzs,
            providerRef,
          },
        },
        mgr,
      );
      return { intent, replay: false, paymentId: null };
    });

    // fiscalize the applied payment (after commit), exactly like cash
    if (!result.replay && result.paymentId) {
      await this.payments.enqueueFiscal(result.intent.merchantId, WEBHOOK_ACTOR, result.paymentId);
    }
    return {
      intentId,
      status: result.intent.status,
      appliedPaymentId: result.intent.appliedPaymentId,
      replay: result.replay,
    };
  }

  async listForOrder(merchantId: string, orderId: string) {
    const order = await this.getOrder(merchantId, orderId);
    const items = await this.ds
      .getRepository(PaymentIntent)
      .find({ where: { orderId: order.id }, order: { createdAt: 'ASC' } });
    return { items };
  }

  private async getOrder(merchantId: string, orderId: string): Promise<SalesOrder> {
    const order = UUID_RE.test(orderId)
      ? await this.ds.getRepository(SalesOrder).findOneBy({ id: orderId, merchantId })
      : null;
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  private async lockOrder(mgr: EntityManager, merchantId: string, orderId: string): Promise<SalesOrder> {
    const order = await mgr
      .getRepository(SalesOrder)
      .createQueryBuilder('o')
      .setLock('pessimistic_write')
      .where('o.id = :orderId AND o.merchantId = :merchantId', { orderId, merchantId })
      .getOne();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }
}
