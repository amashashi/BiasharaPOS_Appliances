import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import { createHmac } from 'node:crypto';
import type { PaymentConfirmation } from '@biashara/shared';
import { ClickPesaPaymentsService, clickPesaChecksum } from './clickpesa.payments.js';
import { MobileMoneyService } from '../../orders/mobile-money.service.js';

const CHECKSUM_KEY = 'test-checksum-secret';

/** Recreate ClickPesa's canonicalization independently to cross-check our impl. */
const refChecksum = (payload: Record<string, unknown>): string => {
  const canon = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(canon);
    if (v && typeof v === 'object') {
      return Object.keys(v as Record<string, unknown>)
        .filter((k) => k !== 'checksum' && k !== 'checksumMethod')
        .sort()
        .reduce<Record<string, unknown>>((a, k) => ((a[k] = canon((v as Record<string, unknown>)[k])), a), {});
    }
    return v;
  };
  return createHmac('sha256', CHECKSUM_KEY).update(JSON.stringify(canon(payload))).digest('hex');
};

/** Fake ClickPesa: /generate-token + /initiate-ussd-push-request that validates the checksum. */
let lastPush: { headers: Record<string, string | string[] | undefined>; body: Record<string, unknown> } | null = null;
const startFake = (): Promise<{ server: Server; url: string }> =>
  new Promise((resolve) => {
    const server = createServer((req, res) => {
      const send = (status: number, body: unknown): void => {
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(body));
      };
      if (req.method === 'POST' && req.url === '/third-parties/generate-token') {
        if (req.headers['client-id'] !== 'cid' || req.headers['api-key'] !== 'akey') {
          return send(401, { success: false });
        }
        return send(200, { success: true, token: 'Bearer FAKE.JWT.TOKEN' });
      }
      if (req.method === 'POST' && req.url === '/third-parties/payments/initiate-ussd-push-request') {
        if (req.headers.authorization !== 'Bearer FAKE.JWT.TOKEN') return send(403, { message: 'no auth' });
        let raw = '';
        req.on('data', (c: Buffer) => (raw += c.toString()));
        req.on('end', () => {
          const body = JSON.parse(raw) as Record<string, unknown>;
          const { checksum, ...rest } = body;
          if (checksum !== refChecksum(rest)) return send(400, { message: 'bad checksum' });
          lastPush = { headers: req.headers, body };
          send(200, { id: 'CP-98765', status: 'PROCESSING', orderReference: body.orderReference, channel: 'M-PESA' });
        });
        return;
      }
      send(404, { message: 'nope' });
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      resolve({ server, url: `http://127.0.0.1:${addr.port}` });
    });
  });

describe('ClickPesa payments adapter (T5.3b, fake aggregator server)', () => {
  let fake: { server: Server; url: string };
  let svc: ClickPesaPaymentsService;

  beforeAll(async () => {
    fake = await startFake();
    svc = new ClickPesaPaymentsService({ baseUrl: fake.url, clientId: 'cid', apiKey: 'akey', checksumKey: CHECKSUM_KEY });
  });
  afterAll(async () => {
    await new Promise((r) => fake.server.close(r));
  });

  it('checksum is deterministic, key-order independent, and excludes checksum fields', () => {
    const a = clickPesaChecksum({ b: '2', a: '1', nested: { y: 9, x: 8 } }, CHECKSUM_KEY);
    const b = clickPesaChecksum({ nested: { x: 8, y: 9 }, a: '1', b: '2' }, CHECKSUM_KEY);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
    // a stray checksum/checksumMethod must not change the result
    const c = clickPesaChecksum({ a: '1', b: '2', nested: { x: 8, y: 9 }, checksum: 'zzz', checksumMethod: 'HMAC' }, CHECKSUM_KEY);
    expect(c).toBe(a);
  });

  it('initiate: fetches a token, sends a correctly-shaped signed push, returns our orderReference as intentId', async () => {
    const { intentId } = await svc.initiateMobileMoneyPush('MPESA', '+255712345678', 50000, 'order-xyz');
    expect(intentId).toMatch(/^[0-9a-f-]{36}$/); // our generated orderReference (uuid)
    expect(lastPush).toBeTruthy();
    expect(lastPush!.body).toMatchObject({
      amount: '50000', // string, not number
      currency: 'TZS',
      phoneNumber: '255712345678', // no leading +
      orderReference: intentId,
    });
    expect(typeof lastPush!.body.checksum).toBe('string');
    // token is reused across pushes (cached), so a second push still works
    await svc.initiateMobileMoneyPush('AIRTEL_MONEY', '255755000111', 1000, 'order-2');
    expect(lastPush!.body.phoneNumber).toBe('255755000111');
  });

  it('parseWebhook: maps a valid signed ClickPesa callback to our PaymentConfirmation', () => {
    const data = {
      id: 'CP-98765', status: 'SUCCESS', orderReference: 'ord-abc',
      collectedAmount: '50000', channel: 'M-PESA', paymentReference: 'MPESA-XYZ99', updatedAt: '2026-07-18T10:00:00.000Z',
    };
    const body = { event: 'PAYMENT RECEIVED', data, checksum: refChecksum({ event: 'PAYMENT RECEIVED', data }) };
    const conf = svc.parseWebhook(body);
    expect(conf).toEqual({
      intentId: 'ord-abc',
      status: 'CONFIRMED',
      providerRef: 'MPESA-XYZ99',
      paidAt: '2026-07-18T10:00:00.000Z',
    });
  });

  it('parseWebhook: FAILED maps without paidAt; checksum is optional when absent', () => {
    const conf = svc.parseWebhook({ event: 'PAYMENT FAILED', data: { orderReference: 'ord-x', status: 'FAILED', id: 'CP-1' } });
    expect(conf.status).toBe('FAILED');
    expect(conf.providerRef).toBe('CP-1');
    expect('paidAt' in conf).toBe(false);
  });

  it('parseWebhook rejects a spoofed checksum, missing fields, and unsupported statuses', () => {
    const data = { orderReference: 'ord-abc', status: 'SUCCESS' };
    expect(() => svc.parseWebhook({ event: 'PAYMENT RECEIVED', data, checksum: 'deadbeef' })).toThrow(/checksum mismatch/);
    expect(() => svc.parseWebhook({ data: { status: 'SUCCESS' } })).toThrow(/orderReference/);
    expect(() => svc.parseWebhook({ data: { orderReference: 'x', status: 'PENDING' } })).toThrow(/Unsupported/);
  });

  it('refuses to construct without full config', () => {
    expect(() => new ClickPesaPaymentsService({ baseUrl: '', clientId: 'a', apiKey: 'b', checksumKey: 'c' })).toThrow(/ClickPesa config/);
  });

  it('MobileMoneyService.handleWebhook delegates parsing to a rail that provides parseWebhook', async () => {
    const parsed: PaymentConfirmation = { intentId: 'ord-abc', status: 'CONFIRMED', providerRef: 'REF' };
    const railWithParse = { parseWebhook: vi.fn(() => parsed) };
    const mm = new MobileMoneyService({} as never, railWithParse as never, {} as never, {} as never);
    const spy = vi.spyOn(mm, 'processConfirmation').mockResolvedValue({ intentId: 'ord-abc', status: 'CONFIRMED', appliedPaymentId: null, replay: false } as never);
    await mm.handleWebhook({ event: 'PAYMENT RECEIVED', data: {} });
    expect(railWithParse.parseWebhook).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith(parsed);

    // a stub rail (no parseWebhook) passes the body straight through
    const stubRail = {};
    const mm2 = new MobileMoneyService({} as never, stubRail as never, {} as never, {} as never);
    const spy2 = vi.spyOn(mm2, 'processConfirmation').mockResolvedValue({} as never);
    const raw = { intentId: 'i-1', status: 'CONFIRMED' };
    await mm2.handleWebhook(raw);
    expect(spy2).toHaveBeenCalledWith(raw);
  });
});
