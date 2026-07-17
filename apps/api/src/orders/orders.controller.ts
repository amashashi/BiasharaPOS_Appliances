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
import {
  FulfillmentService,
  type FulfillInput,
  type ReserveInput,
} from './fulfillment.service.js';
import { PaymentsService, type RecordPaymentInput } from './payments.service.js';
import { MobileMoneyService, type InitiatePushInput } from './mobile-money.service.js';
import { FiscalReceipt } from '../db/entities/fiscal-receipt.entity.js';
import { Payment } from '../db/entities/payment.entity.js';
import { SalesOrder } from '../db/entities/sales-order.entity.js';
import { renderReceiptHtml } from '../fiscal/receipt-html.js';
import { renderQuotePdf } from './quote-pdf.js';

/** Sales orders & quotes (T2.1). Owners and cashiers sell; delivery staff don't. */
@Roles('OWNER', 'CASHIER')
@Controller('orders')
export class OrdersController {
  // explicit tokens: vitest (esbuild) emits no design:paramtypes metadata
  constructor(
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(FulfillmentService) private readonly fulfillment: FulfillmentService,
    @Inject(PaymentsService) private readonly payments: PaymentsService,
    @Inject(MobileMoneyService) private readonly mobileMoney: MobileMoneyService,
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

  /** Cancel; any reserved units are released back to stock (T2.2). */
  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.fulfillment.cancel(req.auth.merchantId, id, req.auth.userId);
  }

  /** Reserve specific serials against one line of a CONFIRMED order. */
  @Post(':id/reserve')
  @HttpCode(200)
  reserve(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: ReserveInput) {
    return this.fulfillment.reserve(req.auth.merchantId, id, req.auth.userId, body ?? {});
  }

  /** Fulfill: reserved units + picks → SOLD; qty lines decrement stock; order → FULFILLED. */
  @Post(':id/fulfill')
  @HttpCode(200)
  fulfill(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: FulfillInput) {
    return this.fulfillment.fulfill(req.auth.merchantId, id, req.auth.userId, body ?? {});
  }

  /** Record a CASH payment (deposit or full settlement — the ledger decides). */
  @Post(':id/payments')
  recordPayment(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: RecordPaymentInput,
  ) {
    return this.payments.record(req.auth.merchantId, id, req.auth.userId, body ?? {});
  }

  @Get(':id/payments')
  listPayments(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.payments.listForOrder(req.auth.merchantId, id);
  }

  /** Correction: creates a reversing entry — the original row is never touched. */
  @Post(':id/payments/:paymentId/reverse')
  @HttpCode(200)
  reversePayment(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Body() body: { reason?: unknown },
  ) {
    return this.payments.reverse(req.auth.merchantId, id, paymentId, req.auth.userId, body?.reason);
  }

  /** STK push to the customer's phone; money applies when the webhook confirms. */
  @Post(':id/mobile-money')
  initiateMobileMoney(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: InitiatePushInput,
  ) {
    return this.mobileMoney.initiate(req.auth.merchantId, id, req.auth.userId, body ?? {});
  }

  /** Push intents for an order (pending/confirmed/failed — POS shows the pending state). */
  @Get(':id/mobile-money')
  listMobileMoney(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.mobileMoney.listForOrder(req.auth.merchantId, id);
  }

  /** Fiscal receipt as printable 80mm HTML. Rerun anytime — reprint is a read. */
  @Get(':id/payments/:paymentId/receipt')
  async paymentReceipt(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Param('paymentId') paymentId: string,
    @Res() res: Response,
  ): Promise<void> {
    const merchantId = req.auth.merchantId;
    const payment = /^[0-9a-f-]{36}$/i.test(paymentId)
      ? await this.ds.getRepository(Payment).findOneBy({ id: paymentId, orderId: id, merchantId })
      : null;
    if (!payment) throw new NotFoundException('Payment not found on this order');
    const fiscal = await this.ds.getRepository(FiscalReceipt).findOneBy({ paymentId: payment.id });
    if (!fiscal) {
      throw new NotFoundException(
        'No fiscal receipt yet for this payment — it may still be in the fiscal queue',
      );
    }
    const order = await this.ds.getRepository(SalesOrder).findOneOrFail({
      where: { id: payment.orderId },
      relations: { lines: { product: true }, serviceLines: true, customer: true, location: true },
    });
    const merchant = await this.ds.getRepository(Merchant).findOneByOrFail({ id: merchantId });
    const html = await renderReceiptHtml(merchant, order, payment, fiscal);
    res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).send(html);
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
