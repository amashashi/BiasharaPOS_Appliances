import { Body, Controller, HttpCode, Inject, Post, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { SyncService } from './sync.service.js';

/**
 * Offline outbox sync (T5.5). The POS replays queued cash sales here on
 * reconnect; the endpoint is idempotent by clientRef (exactly-once). CASHIER or
 * OWNER — the same roles that ring up a sale.
 */
@Roles('OWNER', 'CASHIER')
@Controller('sync')
export class SyncController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(SyncService) private readonly sync: SyncService) {}

  @Post('outbox')
  @HttpCode(200)
  outbox(@Req() req: AuthedRequest, @Body() body: { operations?: unknown }) {
    return this.sync.replay(req.auth.merchantId, req.auth.userId, body?.operations);
  }
}
