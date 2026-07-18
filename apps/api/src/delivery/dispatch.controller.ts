import { Controller, Get, HttpCode, Inject, Param, Post, Query, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { DeliveryService } from './delivery.service.js';

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
}
