import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import type { PaymentConfirmation } from '@biashara/shared';
import { Public } from '../auth/decorators.js';
import { MobileMoneyService } from './mobile-money.service.js';

/**
 * Platform callbacks (T2.5). @Public: the platform doesn't carry a user JWT —
 * in M5 the real integration authenticates these by signature (T5.3); the
 * stub era validates by intent correlation (unknown intentId → 404).
 */
@Controller('webhooks')
export class WebhooksController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(MobileMoneyService) private readonly mobileMoney: MobileMoneyService) {}

  @Public()
  @Post('payments')
  @HttpCode(200)
  paymentConfirmation(@Body() body: PaymentConfirmation) {
    return this.mobileMoney.processConfirmation(body ?? ({} as PaymentConfirmation));
  }
}
