import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Merchant } from './entities/merchant.entity.js';
import { Location } from './entities/location.entity.js';
import { UserRef } from './entities/user-ref.entity.js';
import { BaseEntities1784120000000 } from './migrations/1784120000000-base-entities.js';

export const entities = [Merchant, Location, UserRef];
export const migrations = [BaseEntities1784120000000];

export function createDataSource(url = process.env.DATABASE_URL): DataSource {
  if (!url) throw new Error('DATABASE_URL is not set');
  return new DataSource({
    type: 'postgres',
    url,
    entities,
    migrations,
    synchronize: false, // schema changes ONLY via migrations
    logging: false,
  });
}
