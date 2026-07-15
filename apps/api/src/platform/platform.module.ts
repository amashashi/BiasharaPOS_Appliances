import { Module } from '@nestjs/common';
import { FISCAL_SERVICE, IDENTITY_SERVICE, NOTIFICATION_SERVICE, PAYMENTS_SERVICE } from './tokens.js';
import { StubFiscalService } from './stubs/fiscal.stub.js';
import { StubPaymentsService } from './stubs/payments.stub.js';
import { StubIdentityService } from './stubs/identity.stub.js';
import { StubNotificationService } from './stubs/notifications.stub.js';

/**
 * Platform adapter module (D-004). M0–M4 bind the stub implementations;
 * T5.1–T5.4 swap each provider for the real platform API client — consumers
 * inject by token and never notice.
 */
@Module({
  providers: [
    { provide: FISCAL_SERVICE, useClass: StubFiscalService },
    { provide: PAYMENTS_SERVICE, useClass: StubPaymentsService },
    { provide: IDENTITY_SERVICE, useClass: StubIdentityService },
    { provide: NOTIFICATION_SERVICE, useClass: StubNotificationService },
  ],
  exports: [FISCAL_SERVICE, PAYMENTS_SERVICE, IDENTITY_SERVICE, NOTIFICATION_SERVICE],
})
export class PlatformModule {}
