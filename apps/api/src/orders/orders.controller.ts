import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { DATA_SOURCE } from '../db/tokens.js';
import type { DataSource } from 'typeorm';
import { Merchant } from '../db/entities/merchant.entity.js';
import { OrdersService, formatOrderNumber, type CreateOrderInput } from './orders.service.js';
import { renderQuotePdf } from './quote-pdf.js';

/** Sales orders & quotes (T2.1). Owners and cashiers sell; delivery staff don't. */
@Roles('OWNER', 'CASHIER')
@Controller('orders')
export class OrdersController {
  // explicit tokens: vitest (esbuild) emits no design:paramtypes metadata
  constructor(
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
  ) {}

  @Post()
  create(@Req() req: AuthedRequest, @Body() body: CreateOrderInput) {
    return this.orders.create(req.auth.merchantId, req.auth.userId, body ?? {});
  }

  @Get()
  list(
    @Req() req: AuthedRequest,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.orders.list(req.auth.merchantId, {
      status,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get(':id')
  get(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.orders.getById(req.auth.merchantId, id);
  }

  /** Quote → order. */
  @Post(':id/confirm')
  @HttpCode(200)
  confirm(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.orders.transition(req.auth.merchantId, id, 'CONFIRMED', req.auth.userId);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.orders.transition(req.auth.merchantId, id, 'CANCELLED', req.auth.userId);
  }

  @Get(':id/quote.pdf')
  async quotePdf(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    const order = await this.orders.getById(req.auth.merchantId, id);
    const merchant = await this.ds
      .getRepository(Merchant)
      .findOneBy({ id: req.auth.merchantId });
    if (!merchant) throw new NotFoundException('Merchant not found');
    const pdf = await renderQuotePdf(merchant, order);
    res
      .status(200)
      .set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${formatOrderNumber(order.number)}-quote.pdf"`,
        'Content-Length': String(pdf.length),
      })
      .end(pdf);
  }
}
