import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import type { UnitStatus } from '@biashara/shared';
import { DATA_SOURCE } from '../db/tokens.js';
import { AuditService } from '../db/audit.service.js';
import { SerializedUnit } from '../db/entities/serialized-unit.entity.js';
import { assertTransition } from './unit-state.js';

/** Domain context stamped into the transition's audit trail (orderId etc.). */
export type TransitionContext = Record<string, string | number | null>;

/**
 * THE single door for serialized-unit status changes (T1.3). Every other
 * service calls transition(); nothing else may write `status`. The row is
 * locked (FOR UPDATE), the transition validated against the legal graph,
 * and the status change + actor-attributed audit event commit in ONE
 * transaction. An illegal transition throws and writes nothing.
 */
@Injectable()
export class UnitStateService {
  constructor(
    @Inject(DATA_SOURCE) private readonly ds: DataSource,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async transition(
    merchantId: string,
    unitId: string,
    to: UnitStatus,
    actorUserId: string,
    context: TransitionContext = {},
  ): Promise<SerializedUnit> {
    return this.ds.transaction(async (mgr) => {
      const unit = await mgr
        .getRepository(SerializedUnit)
        .createQueryBuilder('u')
        .setLock('pessimistic_write')
        .where('u.id = :unitId AND u.merchantId = :merchantId', { unitId, merchantId })
        .getOne();
      if (!unit) throw new NotFoundException('Serialized unit not found');

      const from = unit.status;
      assertTransition(unit.serial, from, to); // throws → transaction aborts, nothing logged

      unit.status = to;
      const saved = await mgr.getRepository(SerializedUnit).save(unit);

      await this.audit.record(
        {
          merchantId,
          actorUserId,
          entityType: 'SerializedUnit',
          entityId: unit.id,
          action: `UNIT_${to}`,
          before: { status: from },
          after: { status: to, serial: unit.serial, ...context },
        },
        mgr,
      );
      return saved;
    });
  }
}
