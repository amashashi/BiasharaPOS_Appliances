import { Body, Controller, Get, HttpCode, Inject, Param, Post, Query, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { DeliveryService, type ConfirmDeliveryInput } from './delivery.service.js';

/**
 * Dispatch list for delivery staff (T4.2). DELIVERY users see only their own
 * assigned jobs; OWNERs see all (planning oversight). Mobile-friendly page
 * consumes these two endpoints.
 */
@Roles('OWNER', 'DELIVERY')
@Controller('deliveries')
export class DispatchController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(DeliveryService) private readonly deliveries: DeliveryService) {}

  @Get('dispatch')
  dispatch(@Req() req: AuthedRequest, @Query('date') date?: string) {
    return this.deliveries.dispatchList(
      req.auth.merchantId,
      { userId: req.auth.userId, roles: req.auth.roles },
      date ?? '',
    );
  }

  @Post(':id/dispatch')
  @HttpCode(200)
  markDispatched(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.deliveries.markDispatched(req.auth.merchantId, id, {
      userId: req.auth.userId,
      roles: req.auth.roles,
    });
  }

  /** Proof of delivery: confirm serials + proof → units DELIVERED, delivery DELIVERED. */
  @Post(':id/confirm')
  @HttpCode(200)
  confirm(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: ConfirmDeliveryInput) {
    return this.deliveries.confirm(req.auth.merchantId, id, {
      userId: req.auth.userId,
      roles: req.auth.roles,
    }, body ?? {});
  }

  /** Failed handover: mark FAILED with a reason; the order can then be rescheduled. */
  @Post(':id/fail')
  @HttpCode(200)
  fail(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: { reason?: unknown }) {
    return this.deliveries.fail(
      req.auth.merchantId,
      id,
      { userId: req.auth.userId, roles: req.auth.roles },
      body?.reason,
    );
  }
}
