import { HTTPError } from 'ky';
import * as events from '@/db/repositories/routineEvents';
import * as habitsRepo from '@/db/repositories/habits';
import * as habitLogsRepo from '@/db/repositories/habitLogs';
import {
  createRoutineEvent,
  deleteRoutineEvent,
  updateRoutineEvent,
} from '@/api/endpoints/routineEvents';
import { createHabit, deleteHabit, updateHabit } from '@/api/endpoints/habits';
import {
  createHabitLog,
  deleteHabitLog,
  updateHabitLog,
} from '@/api/endpoints/habitLogs';
import type {
  CreateHabitLogPayload,
  CreateHabitPayload,
  CreateRoutineEventPayload,
} from '@/api/dto';
import { getErrorMessage, isApiError } from '@/api/errors';
import { logger } from '@/utils/logger';

export type PushOutcome = {
  pushed: number;
  errors: number;
  aborted: boolean;
};

function toEventPayload(row: events.LocalEvent): CreateRoutineEventPayload {
  return {
    title: row.title,
    description: row.description,
    startTime: row.startTime,
    endTime: row.endTime,
    daysOfWeek: row.daysOfWeekParsed,
    eventDate: row.eventDate,
    color: row.color,
  };
}

function toHabitPayload(row: habitsRepo.LocalHabit): CreateHabitPayload {
  return {
    title: row.title,
    description: row.description ?? '',
    icon: row.icon ?? '',
    color: row.color,
    frequencyType: habitsRepo.frequencyDbToApi(row.frequencyType),
    targetValue: row.targetValue,
    routineEventIds:
      row.linkedRoutineEventIdsParsed.length > 0 ? row.linkedRoutineEventIdsParsed : null,
  };
}

function toHabitLogPayload(row: habitLogsRepo.LocalHabitLog): CreateHabitLogPayload {
  return {
    targetDate: row.targetDate,
    status: habitLogsRepo.statusDbToApi(row.status),
    notes: row.notes ?? '',
    earnedXP: row.earnedXp,
  };
}

function getStatus(err: unknown): number | null {
  if (isApiError(err)) return err.status;
  if (err instanceof HTTPError) return err.response.status;
  return null;
}

type Aggregate = { pushed: number; errors: number; aborted: boolean; halt: boolean };

async function pushEvents(remaining: number, agg: Aggregate): Promise<void> {
  if (remaining <= 0 || agg.aborted || agg.halt) return;
  const pending = await events.findPending(remaining);

  for (const row of pending) {
    try {
      if (row.syncStatus === 'pending_create') {
        const dto = await createRoutineEvent(toEventPayload(row));
        await events.markSynced(row.localId, {
          remoteId: dto.id,
          createdAt: dto.createdAt,
          updatedAt: dto.updatedAt,
        });
        agg.pushed++;
      } else if (row.syncStatus === 'pending_update') {
        if (!row.remoteId) {
          const dto = await createRoutineEvent(toEventPayload(row));
          await events.markSynced(row.localId, {
            remoteId: dto.id,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
          });
        } else {
          const dto = await updateRoutineEvent(row.remoteId, toEventPayload(row));
          await events.markSynced(row.localId, {
            remoteId: dto.id,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
          });
        }
        agg.pushed++;
      } else if (row.syncStatus === 'pending_delete') {
        if (row.remoteId) {
          try {
            await deleteRoutineEvent(row.remoteId);
          } catch (err) {
            const status = getStatus(err);
            if (status !== 404) throw err;
          }
        }
        await events.purgeLocal(row.localId);
        agg.pushed++;
      }
    } catch (err) {
      const status = getStatus(err);
      const message = getErrorMessage(err);

      if (status === 401) {
        logger.warn('[push] events 401 — aborting tick', { localId: row.localId });
        agg.aborted = true;
        return;
      }
      if (status === 404 && row.syncStatus === 'pending_update') {
        logger.info('[push] events remote not found — purging', { localId: row.localId });
        await events.purgeLocal(row.localId);
        continue;
      }

      agg.errors++;
      await events.markSyncError(row.localId, message);

      if (status !== null && status >= 500) {
        agg.halt = true;
        return;
      }
      if (status === null) {
        agg.halt = true;
        return;
      }
    }
  }
}

async function pushHabits(remaining: number, agg: Aggregate): Promise<void> {
  if (remaining <= 0 || agg.aborted || agg.halt) return;
  const pending = await habitsRepo.findPending(remaining);

  for (const row of pending) {
    try {
      if (row.syncStatus === 'pending_create') {
        const dto = await createHabit(toHabitPayload(row));
        await habitsRepo.markSynced(row.localId, {
          remoteId: dto.id,
          createdAt: dto.createdAt,
          updatedAt: dto.updatedAt,
        });
        agg.pushed++;
      } else if (row.syncStatus === 'pending_update') {
        if (!row.remoteId) {
          const dto = await createHabit(toHabitPayload(row));
          await habitsRepo.markSynced(row.localId, {
            remoteId: dto.id,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
          });
        } else {
          const dto = await updateHabit(row.remoteId, {
            ...toHabitPayload(row),
            isActive: row.isActive,
          });
          await habitsRepo.markSynced(row.localId, {
            remoteId: dto.id,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
          });
        }
        agg.pushed++;
      } else if (row.syncStatus === 'pending_delete') {
        if (row.remoteId) {
          try {
            await deleteHabit(row.remoteId);
          } catch (err) {
            const status = getStatus(err);
            if (status !== 404) throw err;
          }
        }
        await habitsRepo.purgeLocal(row.localId);
        // Logs órfãos cascateados
        await habitLogsRepo.purgeByHabitLocalId(row.localId);
        agg.pushed++;
      }
    } catch (err) {
      const status = getStatus(err);
      const message = getErrorMessage(err);

      if (status === 401) {
        logger.warn('[push] habits 401 — aborting tick', { localId: row.localId });
        agg.aborted = true;
        return;
      }
      if (status === 404 && row.syncStatus === 'pending_update') {
        await habitsRepo.purgeLocal(row.localId);
        continue;
      }

      agg.errors++;
      await habitsRepo.markSyncError(row.localId, message);

      if (status !== null && status >= 500) {
        agg.halt = true;
        return;
      }
      if (status === null) {
        agg.halt = true;
        return;
      }
    }
  }
}

async function pushHabitLogs(remaining: number, agg: Aggregate): Promise<void> {
  if (remaining <= 0 || agg.aborted || agg.halt) return;
  const pending = await habitLogsRepo.findPending(remaining);

  for (const row of pending) {
    try {
      // Resolve habitRemoteId on demand if not yet stored
      let habitRemoteId = row.habitRemoteId;
      if (!habitRemoteId) {
        const habit = await habitsRepo.getByLocalId(row.habitLocalId);
        habitRemoteId = habit?.remoteId ?? null;
      }
      if (!habitRemoteId) {
        // Habit not yet synced — defer this log to a future tick
        logger.info('[push] log waiting for habit remoteId', { localId: row.localId });
        continue;
      }

      if (row.syncStatus === 'pending_create') {
        const dto = await createHabitLog(habitRemoteId, toHabitLogPayload(row));
        await habitLogsRepo.markSynced(row.localId, {
          remoteId: dto.id,
          habitRemoteId,
          createdAt: dto.createdAt,
          updatedAt: dto.updatedAt,
        });
        agg.pushed++;
      } else if (row.syncStatus === 'pending_update') {
        if (!row.remoteId) {
          const dto = await createHabitLog(habitRemoteId, toHabitLogPayload(row));
          await habitLogsRepo.markSynced(row.localId, {
            remoteId: dto.id,
            habitRemoteId,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
          });
        } else {
          const dto = await updateHabitLog(habitRemoteId, row.remoteId, toHabitLogPayload(row));
          await habitLogsRepo.markSynced(row.localId, {
            remoteId: dto.id,
            habitRemoteId,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
          });
        }
        agg.pushed++;
      } else if (row.syncStatus === 'pending_delete') {
        if (row.remoteId) {
          try {
            await deleteHabitLog(habitRemoteId, row.remoteId);
          } catch (err) {
            const status = getStatus(err);
            if (status !== 404) throw err;
          }
        }
        await habitLogsRepo.purgeLocal(row.localId);
        agg.pushed++;
      }
    } catch (err) {
      const status = getStatus(err);
      const message = getErrorMessage(err);

      if (status === 401) {
        agg.aborted = true;
        return;
      }
      if (status === 404 && row.syncStatus === 'pending_update') {
        await habitLogsRepo.purgeLocal(row.localId);
        continue;
      }

      agg.errors++;
      await habitLogsRepo.markSyncError(row.localId, message);

      if (status !== null && status >= 500) {
        agg.halt = true;
        return;
      }
      if (status === null) {
        agg.halt = true;
        return;
      }
    }
  }
}

export async function runPushQueue(limit = 50): Promise<PushOutcome> {
  const agg: Aggregate = { pushed: 0, errors: 0, aborted: false, halt: false };

  await pushEvents(limit, agg);
  await pushHabits(limit, agg);
  await pushHabitLogs(limit, agg);

  return { pushed: agg.pushed, errors: agg.errors, aborted: agg.aborted };
}
