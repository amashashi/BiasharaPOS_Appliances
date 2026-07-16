import { Body, Controller, Get, Inject, Param, Post, Query, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { GrnService, type ReceiveGrnInput } from './grn.service.js';

/** Receiving endpoints (T1.2). Stock intake is an OWNER action in V1. */
@Roles('OWNER')
@Controller('grns')
export class GrnController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(GrnService) private readonly grns: GrnService) {}

  @Post()
  receive(@Req() req: AuthedRequest, @Body() body: ReceiveGrnInput) {
    return this.grns.receive(req.auth.merchantId, req.auth.userId, body ?? {});
  }

  @Get()
  list(
    @Req() req: AuthedRequest,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.grns.list(
      req.auth.merchantId,
      limit ? Number(limit) : undefined,
      offset ? Number(offset) : undefined,
    );
  }

  @Get(':id')
  get(@Req() req: AuthedRequest, @Param('id') id: string) {
    return this.grns.getById(req.auth.merchantId, id);
  }
}
