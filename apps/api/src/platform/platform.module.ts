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
 * Platform adapter module (D-004). M0–M4 bound only stubs; T5.1 swapped
 * identity for the real adapter — T5.2–T5.4 swap the rest the same way.
 * Consumers inject by token and never notice.
 */
@Module({
  providers: [
    { provide: FISCAL_SERVICE, useClass: StubFiscalService },
    paymentsProvider,
    identityProvider,
    { provide: NOTIFICATION_SERVICE, useClass: StubNotificationService },
  ],
  exports: [FISCAL_SERVICE, PAYMENTS_SERVICE, IDENTITY_SERVICE, NOTIFICATION_SERVICE],
})
export class PlatformModule {}
