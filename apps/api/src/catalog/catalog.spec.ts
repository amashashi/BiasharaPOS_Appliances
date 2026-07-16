import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { INestApplication, Module } from '@nestjs/common';
import { APP_GUARD, NestFactory } from '@nestjs/core';
import request from 'supertest';
import { createDataSource } from '../db/data-source.js';
import { Merchant } from '../db/entities/merchant.entity.js';
import { DbModule } from '../db/db.module.js';
import { PlatformModule } from '../platform/platform.module.js';
import { StubIdentityService } from '../platform/stubs/identity.stub.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { CatalogModule } from './catalog.module.js';

process.env.DATABASE_URL ??= 'postgres://biashara:biashara@localhost:5432/biashara_appliances';

// vitest runs with cwd = apps/api (workspace scripts)
const FIXTURE_50 = resolve(process.cwd(), 'test/fixtures/products-sample-50.csv');

@Module({
  imports: [DbModule, PlatformModule, CatalogModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
class TestModule {}

describe('Catalog module (T1.1, real Postgres)', () => {
  let app: INestApplication;
  let http: ReturnType<INestApplication['getHttpServer']>;
  let ownerToken: string;
  let cashierToken: string;
  let otherOwnerToken: string;

  beforeAll(async () => {
    // migrations already applied by test/global-setup.ts
    const ds = createDataSource();
    await ds.initialize();
    const merchants = ds.getRepository(Merchant);
    const shop = await merchants.save(
      merchants.create({ name: `Catalog Spec ${Date.now()}`, tin: null, phone: null }),
    );
    const other = await merchants.save(
      merchants.create({ name: `Catalog Spec other ${Date.now()}`, tin: null, phone: null }),
    );
    await ds.destroy();

    const mint = new StubIdentityService();
    ownerToken = mint.sign({ sub: 'u-owner', mid: shop.id, name: 'Asha', roles: ['OWNER'] });
    cashierToken = mint.sign({ sub: 'u-cash', mid: shop.id, name: 'Juma', roles: ['CASHIER'] });
    otherOwnerToken = mint.sign({ sub: 'u-o2', mid: other.id, name: 'Neema', roles: ['OWNER'] });

    app = await NestFactory.create(TestModule, { logger: false });
    await app.init();
    http = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  const asOwner = (r: request.Test) => r.set('Authorization', `Bearer ${ownerToken}`);

  describe('CRUD', () => {
    it('OWNER creates a product; payload is normalized', async () => {
      const res = await asOwner(request(http).post('/catalog/products'))
        .send({ brand: '  Samsung ', model: 'RB31 Fridge', category: 'Refrigerator', priceTzs: 1250000 })
        .expect(201);
      expect(res.body.id).toMatch(/^[0-9a-f-]{36}$/);
      expect(res.body.brand).toBe('Samsung');
      expect(res.body.taxCode).toBe('A'); // defaulted
      expect(res.body.active).toBe(true);
    });

    it('rejects invalid payloads with per-field errors', async () => {
      const res = await asOwner(request(http).post('/catalog/products'))
        .send({ brand: '', model: 'X', category: 'TV', priceTzs: 12.5, taxCode: 'Z' })
        .expect(400);
      const fields = res.body.errors.map((e: { field: string }) => e.field).sort();
      expect(fields).toEqual(['brand', 'priceTzs', 'taxCode']);
    });

    it('CASHIER can read but not write', async () => {
      await request(http)
        .get('/catalog/products')
        .set('Authorization', `Bearer ${cashierToken}`)
        .expect(200);
      await request(http)
        .post('/catalog/products')
        .set('Authorization', `Bearer ${cashierToken}`)
        .send({ brand: 'LG', model: 'M1', category: 'TV', priceTzs: 100000 })
        .expect(403);
    });

    it('GET/PATCH are merchant-scoped; other merchants get 404', async () => {
      const created = await asOwner(request(http).post('/catalog/products'))
        .send({ brand: 'LG', model: 'Scoped TV', category: 'TV', priceTzs: 500000 })
        .expect(201);
      await asOwner(request(http).get(`/catalog/products/${created.body.id}`)).expect(200);
      await request(http)
        .get(`/catalog/products/${created.body.id}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .expect(404);

      const patched = await asOwner(request(http).patch(`/catalog/products/${created.body.id}`))
        .send({ priceTzs: 550000 })
        .expect(200);
      expect(patched.body.priceTzs).toBe(550000);
      expect(patched.body.model).toBe('Scoped TV'); // untouched fields survive PATCH
    });

    it('duplicate sku within a merchant is rejected; same sku ok for another merchant', async () => {
      await asOwner(request(http).post('/catalog/products'))
        .send({ sku: 'DUP-1', brand: 'Von', model: 'K1', category: 'Kettle', priceTzs: 40000 })
        .expect(201);
      const dup = await asOwner(request(http).post('/catalog/products'))
        .send({ sku: 'DUP-1', brand: 'Von', model: 'K2', category: 'Kettle', priceTzs: 45000 })
        .expect(400);
      expect(dup.body.errors[0].field).toBe('sku');
      await request(http)
        .post('/catalog/products')
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({ sku: 'DUP-1', brand: 'Von', model: 'K1', category: 'Kettle', priceTzs: 40000 })
        .expect(201);
    });

    it('DELETE archives: hidden from default list, visible with includeArchived', async () => {
      const created = await asOwner(request(http).post('/catalog/products'))
        .send({ brand: 'Sayona', model: 'Archive Me', category: 'Fan', priceTzs: 60000 })
        .expect(201);
      await asOwner(request(http).delete(`/catalog/products/${created.body.id}`)).expect(204);

      const active = await asOwner(request(http).get('/catalog/products?q=Archive Me')).expect(200);
      expect(active.body.items).toHaveLength(0);
      const all = await asOwner(
        request(http).get('/catalog/products?q=Archive Me&includeArchived=true'),
      ).expect(200);
      expect(all.body.items).toHaveLength(1);
      expect(all.body.items[0].active).toBe(false);
    });
  });

  describe('CSV import', () => {
    it('imports the 50-product sample file with zero errors', async () => {
      const csv = readFileSync(FIXTURE_50, 'utf8');
      const res = await asOwner(request(http).post('/catalog/products/import'))
        .send({ csv })
        .expect(200);
      expect(res.body).toMatchObject({ totalRows: 50, imported: 50, errors: [] });

      const list = await asOwner(
        request(http).get('/catalog/products?q=SKU-011&includeArchived=true'),
      ).expect(200);
      expect(list.body.items[0].model).toBe('REF 296DR 296L, Double Door'); // quoted comma survived
      expect(list.body.items[0].priceTzs).toBe(1050000);
    });

    it('reports validation errors per row with file line numbers, imports the rest', async () => {
      const csv = [
        'sku,brand,model,category,taxCode,priceTzs,costTzs',
        'OK-1,LG,Good Row,TV,A,100000,80000', // line 2: fine
        ',,No Brand,TV,A,100000,', // line 3: missing brand
        'BAD-P,Sony,Bad Price,TV,A,99.99,', // line 4: decimal price
        'BAD-T,Sony,Bad Tax,TV,X,100000,', // line 5: bad taxCode
        'OK-1,LG,Dup In File,TV,A,100000,', // line 6: sku dupe of line 2
        'SKU-001,Samsung,Already In Db,TV,A,100000,', // line 7: sku exists (from 50-file)
        'OK-2,Hisense,Another Good,TV,,120000,90000', // line 8: fine, blank taxCode
      ].join('\n');
      const res = await asOwner(request(http).post('/catalog/products/import'))
        .send({ csv })
        .expect(200);

      expect(res.body.totalRows).toBe(7);
      expect(res.body.imported).toBe(2);
      const byLine = Object.fromEntries(
        res.body.errors.map((e: { line: number; errors: { field: string }[] }) => [
          e.line,
          e.errors.map((x) => x.field),
        ]),
      );
      expect(byLine).toEqual({
        3: ['brand'],
        4: ['priceTzs'],
        5: ['taxCode'],
        6: ['sku'],
        7: ['sku'],
      });
    });

    it('rejects a file with missing required header columns', async () => {
      const res = await asOwner(request(http).post('/catalog/products/import'))
        .send({ csv: 'brand,model\nLG,X' })
        .expect(400);
      expect(res.body.message).toMatch(/missing required columns.*category.*priceTzs/);
    });

    it('rejects a body without csv text', async () => {
      await asOwner(request(http).post('/catalog/products/import')).send({}).expect(400);
    });
  });
});
