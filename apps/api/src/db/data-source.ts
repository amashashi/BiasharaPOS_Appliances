import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Merchant } from './entities/merchant.entity.js';
import { Location } from './entities/location.entity.js';
import { UserRef } from './entities/user-ref.entity.js';
import { AuditEvent } from './entities/audit-event.entity.js';
import { Product } from './entities/product.entity.js';
import { Grn } from './entities/grn.entity.js';
import { GrnLine } from './entities/grn-line.entity.js';
import { SerializedUnit } from './entities/serialized-unit.entity.js';
import { StockLevel } from './entities/stock-level.entity.js';
import { AuditSubscriber } from './audit.subscriber.js';
import { BaseEntities1784120000000 } from './migrations/1784120000000-base-entities.js';
import { AuditEvents1784130000000 } from './migrations/1784130000000-audit-events.js';
import { Products1784140000000 } from './migrations/1784140000000-products.js';
import { GrnSerializedUnits1784150000000 } from './migrations/1784150000000-grn-serialized-units.js';
import { NonSerialized1784160000000 } from './migrations/1784160000000-non-serialized.js';

export const entities = [
  Merchant, Location, UserRef, AuditEvent, Product, Grn, GrnLine, SerializedUnit, StockLevel,
];
export const migrations = [
  BaseEntities1784120000000,
  AuditEvents1784130000000,
  Products1784140000000,
  GrnSerializedUnits1784150000000,
  NonSerialized1784160000000,
];

export function createDataSource(url = process.env.DATABASE_URL): DataSource {
  if (!url) throw new Error('DATABASE_URL is not set');
  return new DataSource({
    type: 'postgres',
    url,
    entities,
    migrations,
    subscribers: [AuditSubscriber],
    synchronize: false, // schema changes ONLY via migrations
    logging: false,
  });
}
