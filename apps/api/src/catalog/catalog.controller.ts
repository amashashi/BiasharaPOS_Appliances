import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { AuthedRequest } from '../auth/auth.guard.js';
import { Roles } from '../auth/decorators.js';
import { CatalogService, type ImportReport } from './catalog.service.js';
import type { Product } from '../db/entities/product.entity.js';

/**
 * Catalog CRUD + CSV import (T1.1). Reading is open to any authenticated
 * staff (cashiers browse the catalog); writing is OWNER-only.
 */
@Controller('catalog/products')
export class CatalogController {
  // explicit token: vitest (esbuild) emits no design:paramtypes metadata
  constructor(@Inject(CatalogService) private readonly catalog: CatalogService) {}

  @Roles('OWNER')
  @Post()
  create(@Req() req: AuthedRequest, @Body() body: Record<string, unknown>): Promise<Product> {
    return this.catalog.create(req.auth.merchantId, body ?? {});
  }

  @Get()
  list(
    @Req() req: AuthedRequest,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('includeArchived') includeArchived?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<{ items: Product[]; total: number }> {
    return this.catalog.list(req.auth.merchantId, {
      q,
      category,
      includeArchived: includeArchived === 'true',
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
  }

  @Get(':id')
  get(@Req() req: AuthedRequest, @Param('id') id: string): Promise<Product> {
    return this.catalog.getById(req.auth.merchantId, id);
  }

  @Roles('OWNER')
  @Patch(':id')
  update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ): Promise<Product> {
    return this.catalog.update(req.auth.merchantId, id, body ?? {});
  }

  @Roles('OWNER')
  @Delete(':id')
  @HttpCode(204)
  async archive(@Req() req: AuthedRequest, @Param('id') id: string): Promise<void> {
    await this.catalog.archive(req.auth.merchantId, id);
  }

  /** Body is `{ csv }` — clients read the file locally and post its text. */
  @Roles('OWNER')
  @Post('import')
  @HttpCode(200)
  import(@Req() req: AuthedRequest, @Body() body: { csv?: unknown }): Promise<ImportReport> {
    if (typeof body?.csv !== 'string' || body.csv.trim() === '') {
      throw new BadRequestException({ message: 'Body must be JSON { "csv": "<file contents>" }' });
    }
    return this.catalog.importCsv(req.auth.merchantId, body.csv);
  }
}
