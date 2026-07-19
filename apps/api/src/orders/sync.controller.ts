import { Body, Controller, Get, HttpCode, Inject, Param, Post, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { SyncService } from './sync.service.js';
import { SyncExceptionService, type ResolveInput } from './sync-exception.service.js';

/**
 * Offline outbox sync (T5.5) + conflict exception queue (T5.6). Replaying a
 * queued sale is CASHIER/OWNER (they ring up sales); reviewing and resolving the
 * conflicts a replay flagged is OWNER-only (an inventory/money decision).
 */
@Roles('OWNER', 'CASHIER')
@Controller('sync')
export class SyncController {
  // explicit tokens: vitest (esbuild) emits no design:paramtypes metadata
  constructor(
    @Inject(SyncService) private readonly sync: SyncService,
    @Inject(SyncExceptionService) private readonly exceptions: SyncExceptionService,
  ) {}

  @Post('outbox')
  @HttpCode(200)
  outbox(@Req() req: AuthedRequest, @Body() body: { operations?: unknown }) {
    return this.sync.replay(req.auth.merchantId, req.auth.userId, body?.operations);
  }

  @Roles('OWNER')
  @Get('exceptions')
  listExceptions(@Req() req: AuthedRequest) {
    return this.exceptions.list(req.auth.merchantId);
  }

  @Roles('OWNER')
  @Post('exceptions/:id/resolve')
  @HttpCode(200)
  resolveException(@Req() req: AuthedRequest, @Param('id') id: string, @Body() body: ResolveInput) {
    return this.exceptions.resolve(req.auth.merchantId, id, req.auth.userId, body ?? {});
  }
}
