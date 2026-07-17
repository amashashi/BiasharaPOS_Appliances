import { BadRequestException, Controller, Get, Inject, Query, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { ArrearsService, todayIso, type ArrearsSort } from './arrears.service.js';
import { isIsoDate } from './schedule.js';

/** Arrears dashboard (T3.3). A credit-risk management view — OWNER only. */
@Roles('OWNER')
@Controller('credit')
export class ArrearsController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(ArrearsService) private readonly arrears: ArrearsService) {}

  @Get('arrears')
  dashboard(
    @Req() req: AuthedRequest,
    @Query('asOf') asOf?: string,
    @Query('sort') sort?: string,
  ) {
    const at = asOf?.trim() || todayIso();
    if (!isIsoDate(at)) throw new BadRequestException({ message: 'asOf must be YYYY-MM-DD' });
    const order: ArrearsSort = sort === 'amount' ? 'amount' : 'days';
    return this.arrears.dashboard(req.auth.merchantId, at, order);
  }
}
