import { BadRequestException, Controller, Get, Inject, Query, Req } from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { StockService } from './stock.service.js';

/**
 * Read-side inventory endpoints (T1.4). Open to any authenticated staff —
 * cashiers check stock and scan serials at the counter.
 */
@Controller()
export class StockController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(StockService) private readonly stockService: StockService) {}

  @Get('stock')
  stock(
    @Req() req: AuthedRequest,
    @Query('productId') productId?: string,
    @Query('locationId') locationId?: string,
    @Query('q') q?: string,
  ) {
    return this.stockService.stock(req.auth.merchantId, { productId, locationId, q });
  }

  /** Serial as a query param — serials may contain '/', spaces, etc. */
  @Get('units/lookup')
  lookup(@Req() req: AuthedRequest, @Query('serial') serial?: string) {
    const s = serial?.trim();
    if (!s) throw new BadRequestException({ message: 'serial query parameter is required' });
    return this.stockService.lookupBySerial(req.auth.merchantId, s);
  }
}
