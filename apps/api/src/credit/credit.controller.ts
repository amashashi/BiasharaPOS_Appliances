import { Body, Controller, Get, Inject, Param, Post, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { CreditService, type CreateAgreementInput } from './credit.service.js';

/** Credit agreements attach to orders (ARCHITECTURE API surface). Staff who sell can extend credit. */
@Roles('OWNER', 'CASHIER')
@Controller('orders')
export class CreditController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(CreditService) private readonly credit: CreditService) {}

  @Post(':id/credit-agreement')
  create(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: CreateAgreementInput) {
    return this.credit.create(req.auth.merchantId, id, req.auth.userId, body ?? {});
  }

  @Get(':id/credit-agreement')
  get(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.credit.getForOrder(req.auth.merchantId, id);
  }
}
