import { describe, expect, it } from 'vitest';
import type { FiscalReceiptDraft, PaymentConfirmation } from '@biashara/shared';
import { StubFiscalService } from './fiscal.stub.js';
import { StubPaymentsService } from './payments.stub.js';
import { StubIdentityService } from './identity.stub.js';
import { StubNotificationService } from './notifications.stub.js';

const draft = (key: string, amount = 100_000): FiscalReceiptDraft => ({
  merchantTin: '123-456-789',
  items: [{ description: 'Friji LG 260L', quantity: 1, unitPriceTzs: amount, taxCode: 'A' }],
  payment: { method: 'CASH', amountTzs: amount },
  idempotencyKey: key,
});

describe('FiscalService contract (stub)', () => {
  it('issues receipts with VFD number, verification code, QR url', async () => {
    const fiscal = new StubFiscalService();
    const r = await fiscal.issueReceipt(draft('k1'));
    expect(r.vfdNumber).toMatch(/^STUB-VFD-\d{8}$/);
    expect(r.verificationCode).toBeTruthy();
    expect(r.qrUrl).toContain('verify.tra.go.tz');
    expect(new Date(r.issuedAt).getTime()).not.toBeNaN();
  });

  it('is idempotent by idempotencyKey (offline replay safety)', async () => {
    const fiscal = new StubFiscalService();
    const a = await fiscal.issueReceipt(draft('same-key'));
    const b = await fiscal.issueReceipt(draft('same-key'));
    expect(b.vfdNumber).toBe(a.vfdNumber);
    const c = await fiscal.issueReceipt(draft('other-key'));
    expect(c.vfdNumber).not.toBe(a.vfdNumber);
  });

  it('rejects amount mismatch and simulates outages for retry tests', async () => {
    const fiscal = new StubFiscalService();
    await expect(
      fiscal.issueReceipt({ ...draft('bad'), payment: { method: 'CASH', amountTzs: 1 } }),
    ).rejects.toThrow('STUB_VFD_AMOUNT_MISMATCH');
    fiscal.failNext(1);
    await expect(fiscal.issueReceipt(draft('k2'))).rejects.toThrow('STUB_VFD_UNAVAILABLE');
    await expect(fiscal.issueReceipt(draft('k2'))).resolves.toBeTruthy(); // retry succeeds
  });
});

describe('PaymentsService contract (stub)', () => {
  it('initiates a push and resolves it through the webhook handler', async () => {
    const pay = new StubPaymentsService();
    const received: PaymentConfirmation[] = [];
    pay.onConfirmation(async (c) => {
      received.push(c);
    });
    const { intentId } = await pay.initiateMobileMoneyPush('MIXX_BY_YAS', '+255712345678', 250_000, 'order-42');
    expect(pay.getIntent(intentId)?.status).toBe('PENDING');
    await pay.confirm(intentId);
    expect(pay.getIntent(intentId)?.status).toBe('CONFIRMED');
    expect(received).toHaveLength(1);
    expect(received[0]).toMatchObject({ intentId, status: 'CONFIRMED' });
    expect(received[0].paidAt).toBeTruthy();
  });

  it('validates msisdn and integer amounts; blocks double resolution', async () => {
    const pay = new StubPaymentsService();
    await expect(pay.initiateMobileMoneyPush('MPESA', '0712', 1000, 'r')).rejects.toThrow('STUB_PAY_BAD_MSISDN');
    await expect(pay.initiateMobileMoneyPush('MPESA', '+255712345678', 10.5, 'r')).rejects.toThrow('STUB_PAY_BAD_AMOUNT');
    const { intentId } = await pay.initiateMobileMoneyPush('AIRTEL_MONEY', '255712345678', 1000, 'r');
    await pay.fail(intentId);
    await expect(pay.confirm(intentId)).rejects.toThrow('STUB_PAY_UNKNOWN_OR_RESOLVED');
  });
});

describe('IdentityService contract (stub)', () => {
  it('verifies a signed token into an AuthContext', async () => {
    const id = new StubIdentityService('test-secret');
    const token = id.sign({ sub: 'u1', mid: 'm1', name: 'Asha', roles: ['OWNER'] });
    const ctx = await id.verifyToken(token);
    expect(ctx).toEqual({ userId: 'u1', merchantId: 'm1', displayName: 'Asha', roles: ['OWNER'] });
  });

  it('rejects tampered and expired tokens', async () => {
    const id = new StubIdentityService('test-secret');
    const token = id.sign({ sub: 'u1', mid: 'm1', name: 'Asha', roles: ['CASHIER'] });
    const [h, p] = token.split('.');
    const forged = `${h}.${p}.AAAA${'B'.repeat(39)}`;
    await expect(id.verifyToken(forged)).rejects.toThrow();
    const expired = id.sign({ sub: 'u1', mid: 'm1', name: 'A', roles: ['CASHIER'], exp: 1 });
    await expect(id.verifyToken(expired)).rejects.toThrow('STUB_AUTH_EXPIRED');
    const wrongSecret = new StubIdentityService('other-secret').sign({ sub: 'u', mid: 'm', name: 'x', roles: ['OWNER'] });
    await expect(id.verifyToken(wrongSecret)).rejects.toThrow('STUB_AUTH_BAD_SIGNATURE');
  });
});

describe('NotificationService contract (stub)', () => {
  it('records templated sends', async () => {
    const sms = new StubNotificationService();
    await sms.sendSms('+255712345678', 'installment_reminder_sw', { name: 'Juma', amount: 'TZS 50,000' });
    expect(sms.sent).toHaveLength(1);
    expect(sms.sent[0].templateKey).toBe('installment_reminder_sw');
    await expect(sms.sendSms('+255712345678', '', {})).rejects.toThrow('STUB_SMS_MISSING_TEMPLATE');
  });
});
