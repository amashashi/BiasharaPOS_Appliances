import { Body, Controller, Get, Inject, Param, Post, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { DeliveryService, type ScheduleDeliveryInput } from './delivery.service.js';

/**
 * Delivery scheduling (T4.1). Owners and cashiers schedule fulfillment at or
 * after the sale; the dispatch list for delivery staff arrives in T4.2.
 */
@Roles('OWNER', 'CASHIER')
@Controller('orders')
export class DeliveryController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(DeliveryService) private readonly deliveries: DeliveryService) {}

  @Post(':id/delivery')
  schedule(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: ScheduleDeliveryInput) {
    return this.deliveries.schedule(req.auth.merchantId, id, req.auth.userId, body ?? {});
  }

  @Get(':id/delivery')
  get(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.deliveries.forOrder(req.auth.merchantId, id);
  }
}
