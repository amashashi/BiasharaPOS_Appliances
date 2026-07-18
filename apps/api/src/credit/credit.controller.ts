import { Body, Controller, Get, Inject, Param, Post, Req, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { CreditService, type CreateAgreementInput } from './credit.service.js';
import { renderStatementPdf } from './statement-pdf.js';
import { formatOrderNumber } from '../orders/orders.service.js';

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

  /** Customer statement (T3.5): printable/shareable A4 PDF — schedule, payments, balance. */
  @Get(':id/statement.pdf')
  async statement(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const data = await this.credit.statementData(req.auth.merchantId, id);
    const pdf = await renderStatementPdf(data);
    res
      .status(200)
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${formatOrderNumber(data.order.number)}-statement.pdf"`,
        'Content-Length': String(pdf.length),
      })
      .end(pdf);
  }
}
