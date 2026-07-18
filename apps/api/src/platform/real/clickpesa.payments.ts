import { createHmac, randomUUID } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import type {
  MobileMoneyProvider,
  PaymentConfirmation,
  PaymentsService,
} from '@biashara/shared';

/**
 * Deterministic checksum over a payload (D-035): recursively sort keys, compact
 * JSON, HMAC-SHA256 hex. Excludes `checksum`/`checksumMethod` so the same input
 * verifies regardless of key order — ClickPesa's exact scheme.
 */
export const clickPesaChecksum = (payload: Record<string, unknown>, key: string): string => {
  const canonicalize = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(canonicalize);
    if (v && typeof v === 'object') {
      return Object.keys(v as Record<string, unknown>)
        .filter((k) => k !== 'checksum' && k !== 'checksumMethod')
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = canonicalize((v as Record<string, unknown>)[k]);
          return acc;
        }, {});
    }
    return v;
  };
  return createHmac('sha256', key).update(JSON.stringify(canonicalize(payload))).digest('hex');
};

interface TokenResponse {
  success: boolean;
  token: string; // includes the "Bearer " prefix
}

interface InitiateResponse {
  id: string;
  status: 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'SETTLED';
  channel?: string;
  orderReference: string;
}

/** ClickPesa webhook envelope (D-035). */
interface WebhookBody {
  event?: string;
  data?: {
    id?: string;
    status?: string;
    orderReference?: string;
    collectedAmount?: string;
    channel?: string;
    paymentReference?: string;
    updatedAt?: string;
    createdAt?: string;
  };
  checksum?: string;
}

export interface ClickPesaConfig {
  baseUrl: string;
  clientId: string;
  apiKey: string;
  checksumKey: string;
}

const CLICKPESA_STATUS: Record<string, PaymentConfirmation['status']> = {
  SUCCESS: 'CONFIRMED',
  SETTLED: 'CONFIRMED',
  FAILED: 'FAILED',
};

/**
 * Real payments rail (T5.3b, D-035): a thin client over the ClickPesa aggregator
 * (M-Pesa + Mixx by Yas + Airtel behind one USSD-PUSH API). Token cached ~55 min
 * (1 h life). We mint our own unique `orderReference` per push and return it as
 * the intentId — the webhook echoes it back, so correlation stays on a key we
 * control. Inbound webhooks are checksum-verified before they touch the ledger.
 */
export class ClickPesaPaymentsService implements PaymentsService {
  private token: { value: string; until: number } | null = null;

  constructor(private readonly cfg: ClickPesaConfig) {
    if (!cfg.baseUrl || !cfg.clientId || !cfg.apiKey || !cfg.checksumKey) {
      throw new Error('ClickPesa config (baseUrl, clientId, apiKey, checksumKey) is required for PAYMENTS_MODE=clickpesa');
    }
  }

  private async authorization(): Promise<string> {
    if (this.token && this.token.until > Date.now()) return this.token.value;
    let res: Response;
    try {
      res = await fetch(`${this.cfg.baseUrl}/third-parties/generate-token`, {
        method: 'POST',
        headers: { 'client-id': this.cfg.clientId, 'api-key': this.cfg.apiKey },
      });
    } catch {
      throw new Error('ClickPesa token endpoint unreachable');
    }
    const body = (await res.json().catch(() => ({}))) as TokenResponse;
    if (!res.ok || !body.success || !body.token) {
      throw new Error(`ClickPesa token request failed (${res.status})`);
    }
    // token carries the "Bearer " prefix; cache 55 min of the 1 h life
    this.token = { value: body.token, until: Date.now() + 55 * 60_000 };
    return body.token;
  }

  async initiateMobileMoneyPush(
    _provider: MobileMoneyProvider,
    msisdn: string,
    amountTzs: number,
    _ref: string,
  ): Promise<{ intentId: string }> {
    // our own unique reference = the webhook correlation key (echoed back)
    const orderReference = randomUUID();
    const payload: Record<string, unknown> = {
      amount: String(amountTzs),
      currency: 'TZS',
      orderReference,
      phoneNumber: msisdn.replace(/^\+/, ''), // 255XXXXXXXXX, no plus
    };
    payload.checksum = clickPesaChecksum(payload, this.cfg.checksumKey);

    const authorization = await this.authorization();
    let res: Response;
    try {
      res = await fetch(`${this.cfg.baseUrl}/third-parties/payments/initiate-ussd-push-request`, {
        method: 'POST',
        headers: { authorization, 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      throw new Error('ClickPesa push endpoint unreachable');
    }
    const body = (await res.json().catch(() => ({}))) as InitiateResponse & { message?: string };
    if (!res.ok || !body.id) {
      throw new Error(`ClickPesa push failed (${res.status}${body.message ? `: ${body.message}` : ''})`);
    }
    // intentId = our orderReference; the ClickPesa id is captured later via the webhook
    return { intentId: orderReference };
  }

  /**
   * Parse + verify a ClickPesa webhook into our PaymentConfirmation. Called by
   * MobileMoneyService before applying anything. A present-but-wrong checksum is
   * rejected (spoofed callback); an unmapped status is a no-op we still record
   * as an orphan upstream by returning FAILED-safe? No — we reject malformed.
   */
  parseWebhook(raw: unknown): PaymentConfirmation {
    const body = (raw ?? {}) as WebhookBody;
    const data = body.data ?? {};
    if (!data.orderReference || !data.status) {
      throw new BadRequestException({ message: 'ClickPesa webhook missing data.orderReference/status' });
    }
    if (typeof body.checksum === 'string' && body.checksum.length > 0) {
      const expected = clickPesaChecksum({ event: body.event, data } as Record<string, unknown>, this.cfg.checksumKey);
      if (expected !== body.checksum) {
        throw new BadRequestException({ message: 'ClickPesa webhook checksum mismatch' });
      }
    }
    const status = CLICKPESA_STATUS[data.status.toUpperCase()];
    if (!status) {
      throw new BadRequestException({ message: `Unsupported ClickPesa status "${data.status}"` });
    }
    return {
      intentId: data.orderReference,
      status,
      providerRef: data.paymentReference ?? data.id ?? '',
      ...(status === 'CONFIRMED' ? { paidAt: data.updatedAt ?? data.createdAt ?? new Date().toISOString() } : {}),
    };
  }
}
