import { and, asc, eq, ne, or, inArray, sql } from 'drizzle-orm';
import { getDatabase } from '../client';
import { routineEvents, type NewRoutineEventRow, type RoutineEventRow } from '../schema';
import { newLocalId } from '@/utils/id';
import { nowIsoUtc } from '@/utils/date';
import type { RoutineEventDto } from '@/api/dto';

export type LocalEvent = RoutineEventRow & {
  daysOfWeekParsed: number[] | null;
};

export type CreateLocalEventInput = {
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  daysOfWeek?: number[] | null;
  eventDate?: string | null;
  isActive?: boolean;
  userId: string;
};

export type UpdateLocalEventInput = Partial<Omit<CreateLocalEventInput, 'userId'>>;

function parseDaysOfWeek(raw: string | null): number[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === 'number') : null;
  } catch {
    return null;
  }
}

function hydrate(row: RoutineEventRow): LocalEvent {
  return { ...row, daysOfWeekParsed: parseDaysOfWeek(row.daysOfWeek) };
}

function resolveEventType(
  daysOfWeek: number[] | null | undefined,
  eventDate: string | null | undefined
): 'once' | 'recurring' {
  if (daysOfWeek && daysOfWeek.length > 0) return 'recurring';
  if (eventDate) return 'once';
  throw new Error('Evento precisa de dias da semana OU data');
}

export async function createLocal(input: CreateLocalEventInput): Promise<LocalEvent> {
  const db = getDatabase();
  const now = nowIsoUtc();
  const daysOfWeek = input.daysOfWeek ?? null;
  const eventDate = input.eventDate ?? null;
  const eventType = resolveEventType(daysOfWeek, eventDate);

  const row: NewRoutineEventRow = {
    localId: newLocalId(),
    remoteId: null,
    title: input.title,
    description: input.description ?? null,
    startTime: input.startTime,
    endTime: input.endTime ?? null,
    daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : null,
    eventDate,
    eventType,
    isActive: input.isActive ?? true,
    userId: input.userId,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending_create',
    lastSyncedAt: null,
    syncError: null,
    syncAttempts: 0,
  };

  const [inserted] = await db.insert(routineEvents).values(row).returning();
  return hydrate(inserted!);
}

export async function updateLocal(
  localId: string,
  patch: UpdateLocalEventInput
): Promise<LocalEvent | null> {
  const db = getDatabase();
  const existing = await getByLocalId(localId);
  if (!existing) return null;

  const nextDays = patch.daysOfWeek === undefined ? existing.daysOfWeekParsed : patch.daysOfWeek;
  const nextDate = patch.eventDate === undefined ? existing.eventDate : patch.eventDate;
  const eventType = resolveEventType(nextDays, nextDate);

  const nextStatus: RoutineEventRow['syncStatus'] =
    existing.syncStatus === 'pending_create' ? 'pending_create' : 'pending_update';

  const updates: Partial<NewRoutineEventRow> = {
    title: patch.title ?? existing.title,
    description: patch.description === undefined ? existing.description : patch.description,
    startTime: patch.startTime ?? existing.startTime,
    endTime: patch.endTime === undefined ? existing.endTime : patch.endTime,
    daysOfWeek: nextDays ? JSON.stringify(nextDays) : null,
    eventDate: nextDate,
    eventType,
    isActive: patch.isActive ?? existing.isActive,
    updatedAt: nowIsoUtc(),
    syncStatus: nextStatus,
    syncError: null,
    syncAttempts: 0,
  };

  const [updated] = await db
    .update(routineEvents)
    .set(updates)
    .where(eq(routineEvents.localId, localId))
    .returning();

  return updated ? hydrate(updated) : null;
}

export async function deleteLocal(localId: string): Promise<void> {
  const db = getDatabase();
  const existing = await getByLocalId(localId);
  if (!existing) return;

  if (existing.syncStatus === 'pending_create') {
    // Nunca chegou ao servidor — deleta fisicamente.
    await db.delete(routineEvents).where(eq(routineEvents.localId, localId));
    return;
  }

  await db
    .update(routineEvents)
    .set({
      syncStatus: 'pending_delete',
      updatedAt: nowIsoUtc(),
      syncError: null,
      syncAttempts: 0,
    })
    .where(eq(routineEvents.localId, localId));
}

export async function getByLocalId(localId: string): Promise<LocalEvent | null> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(routineEvents)
    .where(eq(routineEvents.localId, localId))
    .limit(1);
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function getByRemoteId(remoteId: string): Promise<LocalEvent | null> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(routineEvents)
    .where(eq(routineEvents.remoteId, remoteId))
    .limit(1);
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function findInRange(fromKey: string, toKey: string): Promise<LocalEvent[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(routineEvents)
    .where(
      and(
        ne(routineEvents.syncStatus, 'pending_delete'),
        eq(routineEvents.isActive, true),
        or(
          eq(routineEvents.eventType, 'recurring'),
          and(
            eq(routineEvents.eventType, 'once'),
            sql`${routineEvents.eventDate} BETWEEN ${fromKey} AND ${toKey}`
          )
        )
      )
    )
    .orderBy(asc(routineEvents.startTime));
  return rows.map(hydrate);
}

export async function findPending(limit = 50): Promise<LocalEvent[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(routineEvents)
    .where(
      inArray(routineEvents.syncStatus, ['pending_create', 'pending_update', 'pending_delete'])
    )
    .orderBy(asc(routineEvents.updatedAt))
    .limit(limit);
  return rows.map(hydrate);
}

export async function markSynced(
  localId: string,
  values: { remoteId: string; createdAt: string; updatedAt: string }
): Promise<void> {
  const db = getDatabase();
  await db
    .update(routineEvents)
    .set({
      remoteId: values.remoteId,
      syncStatus: 'synced',
      createdAt: values.createdAt,
      updatedAt: values.updatedAt,
      lastSyncedAt: nowIsoUtc(),
      syncError: null,
      syncAttempts: 0,
    })
    .where(eq(routineEvents.localId, localId));
}

export async function markSyncError(localId: string, message: string): Promise<void> {
  const db = getDatabase();
  const row = await getByLocalId(localId);
  if (!row) return;
  await db
    .update(routineEvents)
    .set({
      syncError: message,
      syncAttempts: (row.syncAttempts ?? 0) + 1,
    })
    .where(eq(routineEvents.localId, localId));
}

export async function purgeLocal(localId: string): Promise<void> {
  const db = getDatabase();
  await db.delete(routineEvents).where(eq(routineEvents.localId, localId));
}

export async function upsertFromServer(dto: RoutineEventDto): Promise<void> {
  const db = getDatabase();
  const existing = await getByRemoteId(dto.id);

  const serverRow: NewRoutineEventRow = {
    localId: existing?.localId ?? newLocalId(),
    remoteId: dto.id,
    title: dto.title,
    description: dto.description ?? null,
    startTime: dto.startTime,
    endTime: dto.endTime ?? null,
    daysOfWeek: dto.daysOfWeek ? JSON.stringify(dto.daysOfWeek) : null,
    eventDate: dto.eventDate ?? null,
    eventType: dto.eventType,
    isActive: dto.isActive,
    userId: dto.userId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    syncStatus: 'synced',
    lastSyncedAt: nowIsoUtc(),
    syncError: null,
    syncAttempts: 0,
  };

  if (!existing) {
    await db.insert(routineEvents).values(serverRow);
    return;
  }

  // Last-write-wins: só sobrescreve se o servidor for mais recente.
  const pendingLocal = existing.syncStatus !== 'synced';
  if (pendingLocal) {
    const serverNewer = dto.updatedAt > existing.updatedAt;
    if (!serverNewer) return; // mantém a versão local pendente
  }

  await db
    .update(routineEvents)
    .set(serverRow)
    .where(eq(routineEvents.localId, existing.localId));
}

export async function countWithSyncError(): Promise<number> {
  const db = getDatabase();
  const rows = await db
    .select({ localId: routineEvents.localId })
    .from(routineEvents)
    .where(sql`${routineEvents.syncError} IS NOT NULL`);
  return rows.length;
}

export async function wipeAll(): Promise<void> {
  const db = getDatabase();
  await db.delete(routineEvents);
}
