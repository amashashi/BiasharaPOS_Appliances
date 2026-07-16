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
import { Customer } from './entities/customer.entity.js';
import { SalesOrder } from './entities/sales-order.entity.js';
import { SalesOrderLine } from './entities/sales-order-line.entity.js';
import { SalesOrderServiceLine } from './entities/sales-order-service-line.entity.js';
import { AuditSubscriber } from './audit.subscriber.js';
import { BaseEntities1784120000000 } from './migrations/1784120000000-base-entities.js';
import { AuditEvents1784130000000 } from './migrations/1784130000000-audit-events.js';
import { Products1784140000000 } from './migrations/1784140000000-products.js';
import { GrnSerializedUnits1784150000000 } from './migrations/1784150000000-grn-serialized-units.js';
import { NonSerialized1784160000000 } from './migrations/1784160000000-non-serialized.js';
import { SalesOrders1784170000000 } from './migrations/1784170000000-sales-orders.js';
import { UnitOrderLine1784180000000 } from './migrations/1784180000000-unit-order-line.js';
import { AuditSeq1784190000000 } from './migrations/1784190000000-audit-seq.js';

export const entities = [
  Merchant, Location, UserRef, AuditEvent, Product, Grn, GrnLine, SerializedUnit, StockLevel,
  Customer, SalesOrder, SalesOrderLine, SalesOrderServiceLine,
];
export const migrations = [
  BaseEntities1784120000000,
  AuditEvents1784130000000,
  Products1784140000000,
  GrnSerializedUnits1784150000000,
  NonSerialized1784160000000,
  SalesOrders1784170000000,
  UnitOrderLine1784180000000,
  AuditSeq1784190000000,
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
