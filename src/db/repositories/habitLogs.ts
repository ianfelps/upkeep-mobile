import { and, asc, eq, gte, inArray, lte, ne, sql } from 'drizzle-orm';
import { getDatabase } from '../client';
import { habitLogs, type HabitLogRow, type NewHabitLogRow } from '../schema';
import { newLocalId } from '@/utils/id';
import { nowIsoUtc } from '@/utils/date';
import type { HabitLogDto, HabitLogStatusDto } from '@/api/dto';
import { getByRemoteId as getHabitByRemoteId } from './habits';

export type LocalHabitLog = HabitLogRow;

export type CreateLocalHabitLogInput = {
  habitLocalId: string;
  habitRemoteId?: string | null;
  targetDate: string;
  status: HabitLogStatusDto;
  notes?: string | null;
  earnedXp?: number;
  userId: string;
};

export type UpdateLocalHabitLogInput = Partial<
  Omit<CreateLocalHabitLogInput, 'userId' | 'habitLocalId'>
>;

const STATUS_TO_DB: Record<HabitLogStatusDto, HabitLogRow['status']> = {
  Completed: 'completed',
  Skipped: 'skipped',
  Missed: 'missed',
};

const STATUS_TO_API: Record<HabitLogRow['status'], HabitLogStatusDto> = {
  completed: 'Completed',
  skipped: 'Skipped',
  missed: 'Missed',
};

export function statusDbToApi(s: HabitLogRow['status']): HabitLogStatusDto {
  return STATUS_TO_API[s];
}

export function statusApiToDb(s: HabitLogStatusDto): HabitLogRow['status'] {
  return STATUS_TO_DB[s];
}

export async function createLocal(input: CreateLocalHabitLogInput): Promise<LocalHabitLog> {
  const db = getDatabase();
  const now = nowIsoUtc();
  const status = STATUS_TO_DB[input.status];

  const row: NewHabitLogRow = {
    localId: newLocalId(),
    remoteId: null,
    habitLocalId: input.habitLocalId,
    habitRemoteId: input.habitRemoteId ?? null,
    targetDate: input.targetDate,
    status,
    completedAt: status === 'completed' ? now : null,
    notes: input.notes ?? null,
    earnedXp: input.earnedXp ?? 0,
    userId: input.userId,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending_create',
    lastSyncedAt: null,
    syncError: null,
    syncAttempts: 0,
  };

  const [inserted] = await db.insert(habitLogs).values(row).returning();
  return inserted!;
}

export async function updateLocal(
  localId: string,
  patch: UpdateLocalHabitLogInput
): Promise<LocalHabitLog | null> {
  const db = getDatabase();
  const existing = await getByLocalId(localId);
  if (!existing) return null;

  const newStatus = patch.status ? STATUS_TO_DB[patch.status] : existing.status;
  const completedAt =
    newStatus === 'completed'
      ? (existing.completedAt ?? nowIsoUtc())
      : null;

  const nextSyncStatus: HabitLogRow['syncStatus'] =
    existing.syncStatus === 'pending_create' ? 'pending_create' : 'pending_update';

  const updates: Partial<NewHabitLogRow> = {
    targetDate: patch.targetDate ?? existing.targetDate,
    status: newStatus,
    completedAt,
    notes: patch.notes === undefined ? existing.notes : patch.notes,
    earnedXp: patch.earnedXp ?? existing.earnedXp,
    habitRemoteId:
      patch.habitRemoteId === undefined ? existing.habitRemoteId : patch.habitRemoteId,
    updatedAt: nowIsoUtc(),
    syncStatus: nextSyncStatus,
    syncError: null,
    syncAttempts: 0,
  };

  const [updated] = await db
    .update(habitLogs)
    .set(updates)
    .where(eq(habitLogs.localId, localId))
    .returning();

  return updated ?? null;
}

export async function deleteLocal(localId: string): Promise<void> {
  const db = getDatabase();
  const existing = await getByLocalId(localId);
  if (!existing) return;

  if (existing.syncStatus === 'pending_create') {
    await db.delete(habitLogs).where(eq(habitLogs.localId, localId));
    return;
  }

  await db
    .update(habitLogs)
    .set({
      syncStatus: 'pending_delete',
      updatedAt: nowIsoUtc(),
      syncError: null,
      syncAttempts: 0,
    })
    .where(eq(habitLogs.localId, localId));
}

export async function getByLocalId(localId: string): Promise<LocalHabitLog | null> {
  const db = getDatabase();
  const rows = await db.select().from(habitLogs).where(eq(habitLogs.localId, localId)).limit(1);
  return rows[0] ?? null;
}

export async function getByRemoteId(remoteId: string): Promise<LocalHabitLog | null> {
  const db = getDatabase();
  const rows = await db.select().from(habitLogs).where(eq(habitLogs.remoteId, remoteId)).limit(1);
  return rows[0] ?? null;
}

export async function findForHabitOnDate(
  habitLocalId: string,
  targetDate: string
): Promise<LocalHabitLog | null> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(habitLogs)
    .where(
      and(
        eq(habitLogs.habitLocalId, habitLocalId),
        eq(habitLogs.targetDate, targetDate),
        ne(habitLogs.syncStatus, 'pending_delete')
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

export async function findByHabit(
  habitLocalId: string,
  opts?: { from?: string; to?: string }
): Promise<LocalHabitLog[]> {
  const db = getDatabase();
  const conditions = [
    eq(habitLogs.habitLocalId, habitLocalId),
    ne(habitLogs.syncStatus, 'pending_delete'),
  ];
  if (opts?.from) conditions.push(gte(habitLogs.targetDate, opts.from));
  if (opts?.to) conditions.push(lte(habitLogs.targetDate, opts.to));
  const rows = await db
    .select()
    .from(habitLogs)
    .where(and(...conditions))
    .orderBy(asc(habitLogs.targetDate));
  return rows;
}

export async function findAllInRange(from: string, to: string): Promise<LocalHabitLog[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(habitLogs)
    .where(
      and(
        gte(habitLogs.targetDate, from),
        lte(habitLogs.targetDate, to),
        ne(habitLogs.syncStatus, 'pending_delete')
      )
    )
    .orderBy(asc(habitLogs.targetDate));
  return rows;
}

export async function findPending(limit = 50): Promise<LocalHabitLog[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(habitLogs)
    .where(inArray(habitLogs.syncStatus, ['pending_create', 'pending_update', 'pending_delete']))
    .orderBy(asc(habitLogs.updatedAt))
    .limit(limit);
  return rows;
}

export async function markSynced(
  localId: string,
  values: { remoteId: string; habitRemoteId: string; createdAt: string; updatedAt: string }
): Promise<void> {
  const db = getDatabase();
  await db
    .update(habitLogs)
    .set({
      remoteId: values.remoteId,
      habitRemoteId: values.habitRemoteId,
      syncStatus: 'synced',
      createdAt: values.createdAt,
      updatedAt: values.updatedAt,
      lastSyncedAt: nowIsoUtc(),
      syncError: null,
      syncAttempts: 0,
    })
    .where(eq(habitLogs.localId, localId));
}

export async function markSyncError(localId: string, message: string): Promise<void> {
  const db = getDatabase();
  const row = await getByLocalId(localId);
  if (!row) return;
  await db
    .update(habitLogs)
    .set({
      syncError: message,
      syncAttempts: (row.syncAttempts ?? 0) + 1,
    })
    .where(eq(habitLogs.localId, localId));
}

export async function purgeLocal(localId: string): Promise<void> {
  const db = getDatabase();
  await db.delete(habitLogs).where(eq(habitLogs.localId, localId));
}

export async function purgeByHabitLocalId(habitLocalId: string): Promise<void> {
  const db = getDatabase();
  await db.delete(habitLogs).where(eq(habitLogs.habitLocalId, habitLocalId));
}

export async function upsertFromServer(dto: HabitLogDto): Promise<'ok' | 'orphan'> {
  const db = getDatabase();
  const habit = await getHabitByRemoteId(dto.habitId);
  if (!habit) return 'orphan';

  const existing = await getByRemoteId(dto.id);
  const status = STATUS_TO_DB[dto.status];

  const serverRow: NewHabitLogRow = {
    localId: existing?.localId ?? newLocalId(),
    remoteId: dto.id,
    habitLocalId: habit.localId,
    habitRemoteId: dto.habitId,
    targetDate: dto.targetDate,
    status,
    completedAt: dto.completedAt ?? null,
    notes: dto.notes ?? null,
    earnedXp: dto.earnedXP ?? 0,
    userId: habit.userId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    syncStatus: 'synced',
    lastSyncedAt: nowIsoUtc(),
    syncError: null,
    syncAttempts: 0,
  };

  if (!existing) {
    await db.insert(habitLogs).values(serverRow);
    return 'ok';
  }

  if (existing.syncStatus !== 'synced') {
    if (dto.updatedAt <= existing.updatedAt) return 'ok';
  }

  await db.update(habitLogs).set(serverRow).where(eq(habitLogs.localId, existing.localId));
  return 'ok';
}

export async function countWithSyncError(): Promise<number> {
  const db = getDatabase();
  const rows = await db
    .select({ localId: habitLogs.localId })
    .from(habitLogs)
    .where(sql`${habitLogs.syncError} IS NOT NULL`);
  return rows.length;
}

export async function findWithSyncError(): Promise<LocalHabitLog[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(habitLogs)
    .where(sql`${habitLogs.syncError} IS NOT NULL`)
    .orderBy(asc(habitLogs.updatedAt));
  return rows;
}

export async function wipeAll(): Promise<void> {
  const db = getDatabase();
  await db.delete(habitLogs);
}
