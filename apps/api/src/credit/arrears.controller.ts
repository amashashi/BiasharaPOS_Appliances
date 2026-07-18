import { BadRequestException, Body, Controller, Get, Inject, Put, Query, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { ArrearsService, todayIso, type ArrearsSort } from './arrears.service.js';
import { RemindersService } from './reminders.service.js';
import { isIsoDate } from './schedule.js';

/** Credit-risk management views (T3.3 arrears, T3.4 reminder policy) — OWNER only. */
@Roles('OWNER')
@Controller('credit')
export class ArrearsController {
  // explicit tokens: vitest (esbuild) emits no design:paramtypes metadata
  constructor(
    @Inject(ArrearsService) private readonly arrears: ArrearsService,
    @Inject(RemindersService) private readonly reminders: RemindersService,
  ) {}

  @Get('reminder-policy')
  policy(@Req() req: AuthedRequest) {
    return this.reminders.getPolicy(req.auth.merchantId);
  }

  @Put('reminder-policy')
  setPolicy(@Req() req: AuthedRequest, @Body() body: { offsetsDays?: unknown }) {
    return this.reminders.setPolicy(req.auth.merchantId, req.auth.userId, body?.offsetsDays);
  }

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
