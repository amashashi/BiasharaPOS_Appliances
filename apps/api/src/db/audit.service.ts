import { Inject, Injectable } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { DATA_SOURCE } from './tokens.js';
import { AuditEvent, type AuditJson } from './entities/audit-event.entity.js';

export interface AuditEntry {
  merchantId: string | null;
  actorUserId: string | null;
  entityType: string;
  entityId: string | null;
  /** Domain verb, e.g. 'UNIT_SOLD', 'PAYMENT_RECORDED', 'AGREEMENT_SETTLED' */
  action: string;
  before?: unknown;
  after?: unknown;
}

/** Explicit, actor-attributed audit writes for domain services (T0.5). */
@Injectable()
export class AuditService {
  constructor(@Inject(DATA_SOURCE) private readonly ds: DataSource) {}

  async record(entry: AuditEntry): Promise<void> {
    const repo = this.ds.getRepository(AuditEvent);
    await repo.save(
      repo.create({
        ...entry,
        before: (entry.before ?? null) as AuditJson,
        after: (entry.after ?? null) as AuditJson,
      }),
    );
  }
}
