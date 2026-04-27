import { and, asc, eq, inArray, ne, sql } from 'drizzle-orm';
import { getDatabase } from '../client';
import { habits, type HabitRow, type NewHabitRow } from '../schema';
import { newLocalId } from '@/utils/id';
import { nowIsoUtc } from '@/utils/date';
import type { HabitDto, HabitFrequencyDto } from '@/api/dto';

export type LocalHabit = HabitRow & {
  linkedRoutineEventIdsParsed: string[];
};

export type CreateLocalHabitInput = {
  title: string;
  description?: string | null;
  icon?: string | null;
  color: string;
  frequencyType: HabitFrequencyDto;
  targetValue: number;
  isActive?: boolean;
  linkedRoutineEventIds?: string[] | null;
  userId: string;
};

export type UpdateLocalHabitInput = Partial<Omit<CreateLocalHabitInput, 'userId'>>;

const FREQ_TO_DB: Record<HabitFrequencyDto, HabitRow['frequencyType']> = {
  Daily: 'daily',
  Weekly: 'weekly',
  Monthly: 'monthly',
};

const FREQ_TO_API: Record<HabitRow['frequencyType'], HabitFrequencyDto> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function frequencyDbToApi(freq: HabitRow['frequencyType']): HabitFrequencyDto {
  return FREQ_TO_API[freq];
}

export function frequencyApiToDb(freq: HabitFrequencyDto): HabitRow['frequencyType'] {
  return FREQ_TO_DB[freq];
}

function parseLinkedIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

function hydrate(row: HabitRow): LocalHabit {
  return { ...row, linkedRoutineEventIdsParsed: parseLinkedIds(row.linkedRoutineEventIds) };
}

export async function createLocal(input: CreateLocalHabitInput): Promise<LocalHabit> {
  const db = getDatabase();
  const now = nowIsoUtc();
  const linked = input.linkedRoutineEventIds ?? null;

  const row: NewHabitRow = {
    localId: newLocalId(),
    remoteId: null,
    title: input.title,
    description: input.description ?? null,
    icon: input.icon ?? '',
    color: input.color,
    frequencyType: FREQ_TO_DB[input.frequencyType],
    targetValue: input.targetValue,
    isActive: input.isActive ?? true,
    linkedRoutineEventIds: linked && linked.length > 0 ? JSON.stringify(linked) : null,
    userId: input.userId,
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending_create',
    lastSyncedAt: null,
    syncError: null,
    syncAttempts: 0,
  };

  const [inserted] = await db.insert(habits).values(row).returning();
  return hydrate(inserted!);
}

export async function updateLocal(
  localId: string,
  patch: UpdateLocalHabitInput
): Promise<LocalHabit | null> {
  const db = getDatabase();
  const existing = await getByLocalId(localId);
  if (!existing) return null;

  const linked =
    patch.linkedRoutineEventIds === undefined
      ? existing.linkedRoutineEventIdsParsed
      : (patch.linkedRoutineEventIds ?? []);

  const nextStatus: HabitRow['syncStatus'] =
    existing.syncStatus === 'pending_create' ? 'pending_create' : 'pending_update';

  const updates: Partial<NewHabitRow> = {
    title: patch.title ?? existing.title,
    description: patch.description === undefined ? existing.description : patch.description,
    icon: patch.icon === undefined ? existing.icon : (patch.icon ?? ''),
    color: patch.color ?? existing.color,
    frequencyType: patch.frequencyType
      ? FREQ_TO_DB[patch.frequencyType]
      : existing.frequencyType,
    targetValue: patch.targetValue ?? existing.targetValue,
    isActive: patch.isActive ?? existing.isActive,
    linkedRoutineEventIds: linked && linked.length > 0 ? JSON.stringify(linked) : null,
    updatedAt: nowIsoUtc(),
    syncStatus: nextStatus,
    syncError: null,
    syncAttempts: 0,
  };

  const [updated] = await db
    .update(habits)
    .set(updates)
    .where(eq(habits.localId, localId))
    .returning();

  return updated ? hydrate(updated) : null;
}

export async function deleteLocal(localId: string): Promise<void> {
  const db = getDatabase();
  const existing = await getByLocalId(localId);
  if (!existing) return;

  if (existing.syncStatus === 'pending_create') {
    await db.delete(habits).where(eq(habits.localId, localId));
    return;
  }

  await db
    .update(habits)
    .set({
      syncStatus: 'pending_delete',
      updatedAt: nowIsoUtc(),
      syncError: null,
      syncAttempts: 0,
    })
    .where(eq(habits.localId, localId));
}

export async function getByLocalId(localId: string): Promise<LocalHabit | null> {
  const db = getDatabase();
  const rows = await db.select().from(habits).where(eq(habits.localId, localId)).limit(1);
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function getByRemoteId(remoteId: string): Promise<LocalHabit | null> {
  const db = getDatabase();
  const rows = await db.select().from(habits).where(eq(habits.remoteId, remoteId)).limit(1);
  return rows[0] ? hydrate(rows[0]) : null;
}

export async function findAll(): Promise<LocalHabit[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(habits)
    .where(ne(habits.syncStatus, 'pending_delete'))
    .orderBy(asc(habits.createdAt));
  return rows.map(hydrate);
}

export async function findByLinkedEventRemoteId(eventRemoteId: string): Promise<LocalHabit[]> {
  const all = await findAll();
  return all.filter((h) => h.linkedRoutineEventIdsParsed.includes(eventRemoteId));
}

export async function findActive(): Promise<LocalHabit[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(habits)
    .where(and(ne(habits.syncStatus, 'pending_delete'), eq(habits.isActive, true)))
    .orderBy(asc(habits.createdAt));
  return rows.map(hydrate);
}

export async function findPending(limit = 50): Promise<LocalHabit[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(habits)
    .where(inArray(habits.syncStatus, ['pending_create', 'pending_update', 'pending_delete']))
    .orderBy(asc(habits.updatedAt))
    .limit(limit);
  return rows.map(hydrate);
}

export async function markSynced(
  localId: string,
  values: { remoteId: string; createdAt: string; updatedAt: string }
): Promise<void> {
  const db = getDatabase();
  await db
    .update(habits)
    .set({
      remoteId: values.remoteId,
      syncStatus: 'synced',
      createdAt: values.createdAt,
      updatedAt: values.updatedAt,
      lastSyncedAt: nowIsoUtc(),
      syncError: null,
      syncAttempts: 0,
    })
    .where(eq(habits.localId, localId));
}

export async function markSyncError(localId: string, message: string): Promise<void> {
  const db = getDatabase();
  const row = await getByLocalId(localId);
  if (!row) return;
  await db
    .update(habits)
    .set({
      syncError: message,
      syncAttempts: (row.syncAttempts ?? 0) + 1,
    })
    .where(eq(habits.localId, localId));
}

export async function purgeLocal(localId: string): Promise<void> {
  const db = getDatabase();
  await db.delete(habits).where(eq(habits.localId, localId));
}

export async function upsertFromServer(dto: HabitDto): Promise<void> {
  const db = getDatabase();
  const existing = await getByRemoteId(dto.id);

  const linked = dto.linkedRoutineEventIds ?? [];
  const serverRow: NewHabitRow = {
    localId: existing?.localId ?? newLocalId(),
    remoteId: dto.id,
    title: dto.title,
    description: dto.description ?? null,
    icon: dto.icon ?? '',
    color: dto.color,
    frequencyType: FREQ_TO_DB[dto.frequencyType],
    targetValue: dto.targetValue,
    isActive: dto.isActive,
    linkedRoutineEventIds: linked.length > 0 ? JSON.stringify(linked) : null,
    userId: dto.userId,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    syncStatus: 'synced',
    lastSyncedAt: nowIsoUtc(),
    syncError: null,
    syncAttempts: 0,
  };

  if (!existing) {
    await db.insert(habits).values(serverRow);
    return;
  }

  if (existing.syncStatus !== 'synced') {
    if (dto.updatedAt <= existing.updatedAt) return;
  }

  await db.update(habits).set(serverRow).where(eq(habits.localId, existing.localId));
}

export async function countWithSyncError(): Promise<number> {
  const db = getDatabase();
  const rows = await db
    .select({ localId: habits.localId })
    .from(habits)
    .where(sql`${habits.syncError} IS NOT NULL`);
  return rows.length;
}

export async function findWithSyncError(): Promise<LocalHabit[]> {
  const db = getDatabase();
  const rows = await db
    .select()
    .from(habits)
    .where(sql`${habits.syncError} IS NOT NULL`)
    .orderBy(asc(habits.updatedAt));
  return rows.map(hydrate);
}

export async function wipeAll(): Promise<void> {
  const db = getDatabase();
  await db.delete(habits);
}
