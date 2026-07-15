import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { AuditEvent, type AuditJson } from './entities/audit-event.entity.js';

const entityName = (event: { metadata: { name: string } }): string => event.metadata.name;

/**
 * Safety-net auditor (T0.5): EVERY entity insert/update/remove is recorded in
 * audit_events within the same transaction. Domain services additionally write
 * actor-attributed events via AuditService; this subscriber guarantees nothing
 * escapes the log even if a service forgets.
 */
@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  async afterInsert(event: InsertEvent<Record<string, unknown>>): Promise<void> {
    if (event.entity instanceof AuditEvent) return; // no recursion
    await event.manager.save(AuditEvent, event.manager.create(AuditEvent, {
      merchantId: (event.entity?.merchantId as string) ?? null,
      actorUserId: null,
      entityType: entityName(event),
      entityId: (event.entity?.id as string) ?? null,
      action: 'INSERT',
      before: null,
      after: (event.entity ?? null) as AuditJson,
    }));
  }

  async afterUpdate(event: UpdateEvent<Record<string, unknown>>): Promise<void> {
    if (event.entity instanceof AuditEvent) return;
    await event.manager.save(AuditEvent, event.manager.create(AuditEvent, {
      merchantId: (event.entity?.merchantId as string) ?? null,
      actorUserId: null,
      entityType: entityName(event),
      entityId: (event.entity?.id as string) ?? (event.databaseEntity?.id as string) ?? null,
      action: 'UPDATE',
      before: (event.databaseEntity ?? null) as AuditJson,
      after: (event.entity ?? null) as AuditJson,
    }));
  }

  async beforeRemove(event: RemoveEvent<Record<string, unknown>>): Promise<void> {
    if (event.entity instanceof AuditEvent) return;
    await event.manager.save(AuditEvent, event.manager.create(AuditEvent, {
      merchantId: (event.databaseEntity?.merchantId as string) ?? null,
      actorUserId: null,
      entityType: entityName(event),
      entityId: (event.entityId as string) ?? (event.databaseEntity?.id as string) ?? null,
      action: 'REMOVE',
      before: (event.databaseEntity ?? null) as AuditJson,
      after: null,
    }));
  }
}
