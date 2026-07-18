import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { Public } from '../auth/decorators.js';
import { MobileMoneyService } from './mobile-money.service.js';

/**
 * Payment rail callbacks (T2.5). @Public: the rail carries no user JWT — the
 * real adapter (ClickPesa, T5.3b) authenticates the callback by checksum inside
 * `handleWebhook`; the stub validates by intent correlation. Either way an
 * unknown reference is recorded as an orphan and 200'd, never 404-looped.
 */
@Controller('webhooks')
export class WebhooksController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(MobileMoneyService) private readonly mobileMoney: MobileMoneyService) {}

  @Public()
  @Post('payments')
  @HttpCode(200)
  paymentConfirmation(@Body() body: unknown) {
    return this.mobileMoney.handleWebhook(body ?? {});
  }
}
