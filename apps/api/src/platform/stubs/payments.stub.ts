import { randomUUID } from 'node:crypto';
import type {
  MobileMoneyProvider,
  PaymentConfirmation,
  PaymentIntent,
  PaymentsService,
} from '@biashara/shared';

/**
 * Stub mobile-money rail: records intents; tests (and the dev webhook route)
 * resolve them via `confirm()`/`fail()`, which invokes the registered webhook
 * handler exactly like the platform's callback would.
 */
export class StubPaymentsService implements PaymentsService {
  private readonly intents = new Map<string, PaymentIntent>();
  private webhookHandler: ((c: PaymentConfirmation) => Promise<void>) | null = null;

  onConfirmation(handler: (c: PaymentConfirmation) => Promise<void>): void {
    this.webhookHandler = handler;
  }

  async initiateMobileMoneyPush(
    provider: MobileMoneyProvider,
    msisdn: string,
    amountTzs: number,
    ref: string,
  ): Promise<{ intentId: string }> {
    if (!/^\+?255\d{9}$/.test(msisdn)) throw new Error('STUB_PAY_BAD_MSISDN');
    if (!Number.isInteger(amountTzs) || amountTzs <= 0) throw new Error('STUB_PAY_BAD_AMOUNT');
    const intentId = randomUUID();
    this.intents.set(intentId, { intentId, provider, msisdn, amountTzs, ref, status: 'PENDING' });
    return { intentId };
  }

  getIntent(intentId: string): PaymentIntent | undefined {
    return this.intents.get(intentId);
  }

  /** Test/dev helper: resolve a pending intent as the platform webhook would. */
  async confirm(intentId: string): Promise<void> {
    await this.resolve(intentId, 'CONFIRMED');
  }

  async fail(intentId: string): Promise<void> {
    await this.resolve(intentId, 'FAILED');
  }

  private async resolve(intentId: string, status: 'CONFIRMED' | 'FAILED'): Promise<void> {
    const intent = this.intents.get(intentId);
    if (!intent || intent.status !== 'PENDING') throw new Error('STUB_PAY_UNKNOWN_OR_RESOLVED');
    intent.status = status;
    const confirmation: PaymentConfirmation = {
      intentId,
      status,
      providerRef: `STUB-${intent.provider}-${intentId.slice(0, 8)}`,
      ...(status === 'CONFIRMED' ? { paidAt: new Date().toISOString() } : {}),
    };
    if (this.webhookHandler) await this.webhookHandler(confirmation);
  }
}
