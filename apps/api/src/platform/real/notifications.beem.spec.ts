import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { BeemNotificationService } from './notifications.beem.js';
import { renderSms } from './sms-templates.js';

const REMINDER_PARAMS = {
  customerName: 'Mama Fatuma',
  merchantName: 'Demo Electronics Ltd',
  orderNumber: 'SO-000004',
  amountTzs: '765,000',
  dueDate: '05/08/2026',
  daysOverdue: '3',
};

/** Fake Beem: captures the last request; togglable to fail. */
let lastReq: { auth: string | undefined; body: Record<string, unknown> } | null = null;
let mode: 'ok' | 'reject' = 'ok';
const startFake = (): Promise<{ server: Server; url: string }> =>
  new Promise((resolve) => {
    const server = createServer((req, res) => {
      let raw = '';
      req.on('data', (c: Buffer) => (raw += c.toString()));
      req.on('end', () => {
        res.setHeader('content-type', 'application/json');
        if (req.method !== 'POST' || req.url !== '/v1/send') {
          res.writeHead(404);
          return res.end('{}');
        }
        lastReq = { auth: req.headers.authorization, body: JSON.parse(raw) as Record<string, unknown> };
        if (mode === 'reject') {
          res.writeHead(200);
          return res.end(JSON.stringify({ successful: false, code: 103, message: 'Invalid Sender Id' }));
        }
        res.writeHead(200);
        res.end(JSON.stringify({ successful: true, request_id: 9988, code: 100, message: 'Message Submitted Successfully', valid: 1, invalid: 0 }));
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      resolve({ server, url: `http://127.0.0.1:${addr.port}` });
    });
  });

describe('Beem SMS adapter (T5.4, fake provider server)', () => {
  let fake: { server: Server; url: string };
  let svc: BeemNotificationService;

  beforeAll(async () => {
    fake = await startFake();
    svc = new BeemNotificationService({ baseUrl: fake.url, apiKey: 'ak', secretKey: 'sk', senderId: 'BIASHARA', locale: 'sw' });
  });
  afterAll(async () => {
    await new Promise((r) => fake.server.close(r));
  });

  it('renders the three reminder templates in both languages; unknown template throws', () => {
    expect(renderSms('reminder.upcoming', REMINDER_PARAMS, 'sw')).toContain('yanatarajiwa tarehe 05/08/2026');
    expect(renderSms('reminder.due', REMINDER_PARAMS, 'sw')).toContain('LEO');
    expect(renderSms('reminder.overdue', REMINDER_PARAMS, 'sw')).toContain('siku 3');
    expect(renderSms('reminder.overdue', REMINDER_PARAMS, 'en')).toContain('3 day(s) overdue');
    // every rendered body names the order, amount, and merchant
    for (const key of ['reminder.upcoming', 'reminder.due', 'reminder.overdue'] as const) {
      const body = renderSms(key, REMINDER_PARAMS, 'sw');
      expect(body).toContain('SO-000004');
      expect(body).toContain('765,000');
      expect(body).toContain('Demo Electronics Ltd');
    }
    expect(() => renderSms('reminder.nope', REMINDER_PARAMS, 'sw')).toThrow(/Unknown SMS template/);
  });

  it('sends a rendered, Basic-authed request with a +-stripped dest_addr and the sender id', async () => {
    await svc.sendSms('+255712000111', 'reminder.due', REMINDER_PARAMS);
    expect(lastReq).toBeTruthy();
    expect(lastReq!.auth).toBe(`Basic ${Buffer.from('ak:sk').toString('base64')}`);
    expect(lastReq!.body).toMatchObject({ source_addr: 'BIASHARA', encoding: 0 });
    expect(String(lastReq!.body.message)).toContain('LEO'); // the sw 'due' template
    expect(lastReq!.body.recipients).toEqual([{ recipient_id: 1, dest_addr: '255712000111' }]); // no leading +
  });

  it('throws on a provider rejection (unregistered sender, no credit, …) so the caller logs FAILED', async () => {
    mode = 'reject';
    await expect(svc.sendSms('255712000111', 'reminder.due', REMINDER_PARAMS)).rejects.toThrow(/Beem SMS failed.*code 103/);
    mode = 'ok';
  });

  it('throws when the endpoint is unreachable', async () => {
    const dead = new BeemNotificationService({ baseUrl: 'http://127.0.0.1:1', apiKey: 'ak', secretKey: 'sk', senderId: 'X', locale: 'sw' });
    await expect(dead.sendSms('255712000111', 'reminder.due', REMINDER_PARAMS)).rejects.toThrow(/unreachable/);
  });

  it('refuses to construct without full config', () => {
    expect(() => new BeemNotificationService({ baseUrl: 'x', apiKey: '', secretKey: 's', senderId: 'S', locale: 'sw' })).toThrow(/Beem config/);
  });
});
