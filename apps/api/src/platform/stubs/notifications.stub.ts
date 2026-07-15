import type { NotificationService } from '@biashara/shared';

export interface SentSms {
  msisdn: string;
  templateKey: string;
  params: Record<string, string>;
  at: string;
}

/** Stub SMS: records sends for assertion in tests and dev inspection. */
export class StubNotificationService implements NotificationService {
  readonly sent: SentSms[] = [];

  async sendSms(
    msisdn: string,
    templateKey: string,
    params: Record<string, string>,
  ): Promise<void> {
    if (!templateKey) throw new Error('STUB_SMS_MISSING_TEMPLATE');
    this.sent.push({ msisdn, templateKey, params, at: new Date().toISOString() });
  }
}
