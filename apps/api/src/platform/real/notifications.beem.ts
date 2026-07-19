import type { NotificationService } from '@biashara/shared';
import { renderSms, type SmsLocale } from './sms-templates.js';

interface BeemResponse {
  successful?: boolean;
  request_id?: number;
  code?: number;
  message?: string;
  valid?: number;
  invalid?: number;
}

export interface BeemConfig {
  baseUrl: string;
  apiKey: string;
  secretKey: string;
  /** Registered Beem sender ID (source_addr), e.g. "BIASHARA". */
  senderId: string;
  locale: SmsLocale;
}

/**
 * Real SMS rail (T5.4): a thin client over Beem Africa's SMS API — the leading
 * Tanzanian provider. The NotificationService port carries a templateKey +
 * params, so we render the bilingual body here (sms-templates.ts) then send.
 * Isolated behind the port, so swapping to Twilio/AfricasTalking is one file.
 * `sendSms` throws on any provider failure — the reminder dispatcher records
 * that as FAILED and never silently drops a reminder.
 */
export class BeemNotificationService implements NotificationService {
  private readonly auth: string;

  constructor(private readonly cfg: BeemConfig) {
    if (!cfg.baseUrl || !cfg.apiKey || !cfg.secretKey || !cfg.senderId) {
      throw new Error('Beem config (baseUrl, apiKey, secretKey, senderId) is required for NOTIFICATION_MODE=beem');
    }
    this.auth = `Basic ${Buffer.from(`${cfg.apiKey}:${cfg.secretKey}`).toString('base64')}`;
  }

  async sendSms(msisdn: string, templateKey: string, params: Record<string, string>): Promise<void> {
    const message = renderSms(templateKey, params, this.cfg.locale); // throws on unknown template
    const destAddr = msisdn.replace(/^\+/, ''); // Beem wants 255XXXXXXXXX, no plus

    let res: Response;
    try {
      res = await fetch(`${this.cfg.baseUrl}/v1/send`, {
        method: 'POST',
        headers: { authorization: this.auth, 'content-type': 'application/json' },
        body: JSON.stringify({
          source_addr: this.cfg.senderId,
          encoding: 0,
          message,
          recipients: [{ recipient_id: 1, dest_addr: destAddr }],
        }),
      });
    } catch {
      throw new Error('Beem SMS endpoint unreachable');
    }
    const body = (await res.json().catch(() => ({}))) as BeemResponse;
    // Beem signals success by `successful: true` (code 100). Anything else — a bad
    // request, unregistered sender, no credit — is a hard failure the caller logs.
    const ok = res.ok && (body.successful === true || body.code === 100);
    if (!ok) {
      throw new Error(`Beem SMS failed (${res.status}${body.code ? ` code ${body.code}` : ''}${body.message ? `: ${body.message}` : ''})`);
    }
  }
}
