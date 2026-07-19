import { Module } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { FISCAL_SERVICE, IDENTITY_SERVICE, NOTIFICATION_SERVICE, PAYMENTS_SERVICE } from './tokens.js';
import { DATA_SOURCE } from '../db/tokens.js';
import { StubFiscalService } from './stubs/fiscal.stub.js';
import { StubPaymentsService } from './stubs/payments.stub.js';
import { StubIdentityService } from './stubs/identity.stub.js';
import { StubNotificationService } from './stubs/notifications.stub.js';
import { PlatformIdentityService } from './real/identity.platform.js';
import { ClickPesaPaymentsService } from './real/clickpesa.payments.js';
import { BeemNotificationService } from './real/notifications.beem.js';
import type { SmsLocale } from './real/sms-templates.js';

/**
 * Identity went real in T5.1 (D-034): IDENTITY_MODE=platform binds the thin
 * client over the BiasharaPOS platform auth API (needs the global DATA_SOURCE
 * for merchant linkage). Anything else — including tests, which never read
 * .env — keeps the stub, so PlatformModule stays bootable without a DB.
 * Branching happens at module-definition time so the stub binding never
 * declares the DATA_SOURCE dependency at all.
 */
const identityProvider =
  process.env.IDENTITY_MODE === 'platform'
    ? {
        provide: IDENTITY_SERVICE,
        useFactory: (ds: DataSource) => new PlatformIdentityService(ds),
        inject: [DATA_SOURCE],
      }
    : { provide: IDENTITY_SERVICE, useClass: StubIdentityService };

/**
 * Payments went real in T5.3b (D-035): PAYMENTS_MODE=clickpesa binds the
 * ClickPesa aggregator adapter (the platform has no push API). Anything else —
 * including tests — keeps the in-memory stub, so the payment specs and dev flows
 * work without a live rail or credentials.
 */
const paymentsProvider =
  process.env.PAYMENTS_MODE === 'clickpesa'
    ? {
        provide: PAYMENTS_SERVICE,
        useFactory: () =>
          new ClickPesaPaymentsService({
            baseUrl: process.env.CLICKPESA_BASE_URL ?? '',
            clientId: process.env.CLICKPESA_CLIENT_ID ?? '',
            apiKey: process.env.CLICKPESA_API_KEY ?? '',
            checksumKey: process.env.CLICKPESA_CHECKSUM_KEY ?? '',
          }),
      }
    : { provide: PAYMENTS_SERVICE, useClass: StubPaymentsService };

/**
 * SMS went real in T5.4 (D-039): NOTIFICATION_MODE=beem binds the Beem Africa
 * adapter (the platform has no SMS API, only an internal Twilio client).
 * Anything else — including tests — keeps the recording stub.
 */
const notificationProvider =
  process.env.NOTIFICATION_MODE === 'beem'
    ? {
        provide: NOTIFICATION_SERVICE,
        useFactory: () =>
          new BeemNotificationService({
            baseUrl: process.env.BEEM_BASE_URL ?? 'https://apisms.beem.africa',
            apiKey: process.env.BEEM_API_KEY ?? '',
            secretKey: process.env.BEEM_SECRET_KEY ?? '',
            senderId: process.env.BEEM_SENDER_ID ?? '',
            locale: (process.env.NOTIFICATION_LOCALE as SmsLocale) === 'en' ? 'en' : 'sw',
          }),
      }
    : { provide: NOTIFICATION_SERVICE, useClass: StubNotificationService };

/**
 * Platform adapter module (D-004). M0–M4 bound only stubs; T5.1–T5.4 swapped
 * identity, payments, and SMS for real adapters. Consumers inject by token and
 * never notice.
 */
@Module({
  providers: [
    { provide: FISCAL_SERVICE, useClass: StubFiscalService },
    paymentsProvider,
    identityProvider,
    notificationProvider,
  ],
  exports: [FISCAL_SERVICE, PAYMENTS_SERVICE, IDENTITY_SERVICE, NOTIFICATION_SERVICE],
})
export class PlatformModule {}
