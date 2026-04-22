import { HTTPError } from 'ky';
import * as events from '@/db/repositories/routineEvents';
import {
  createRoutineEvent,
  deleteRoutineEvent,
  updateRoutineEvent,
} from '@/api/endpoints/routineEvents';
import type { CreateRoutineEventPayload } from '@/api/dto';
import { getErrorMessage, isApiError } from '@/api/errors';
import { logger } from '@/utils/logger';

export type PushOutcome = {
  pushed: number;
  errors: number;
  aborted: boolean;
};

function toPayload(row: events.LocalEvent): CreateRoutineEventPayload {
  return {
    title: row.title,
    description: row.description,
    startTime: row.startTime,
    endTime: row.endTime,
    daysOfWeek: row.daysOfWeekParsed,
    eventDate: row.eventDate,
    isActive: row.isActive,
  };
}

function getStatus(err: unknown): number | null {
  if (isApiError(err)) return err.status;
  if (err instanceof HTTPError) return err.response.status;
  return null;
}

export async function runPushQueue(limit = 50): Promise<PushOutcome> {
  const pending = await events.findPending(limit);
  let pushed = 0;
  let errors = 0;

  for (const row of pending) {
    try {
      if (row.syncStatus === 'pending_create') {
        const dto = await createRoutineEvent(toPayload(row));
        await events.markSynced(row.localId, {
          remoteId: dto.id,
          createdAt: dto.createdAt,
          updatedAt: dto.updatedAt,
        });
        pushed++;
      } else if (row.syncStatus === 'pending_update') {
        if (!row.remoteId) {
          // Without remoteId we cannot update — reclassify as create.
          const dto = await createRoutineEvent(toPayload(row));
          await events.markSynced(row.localId, {
            remoteId: dto.id,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
          });
          pushed++;
        } else {
          const dto = await updateRoutineEvent(row.remoteId, toPayload(row));
          await events.markSynced(row.localId, {
            remoteId: dto.id,
            createdAt: dto.createdAt,
            updatedAt: dto.updatedAt,
          });
          pushed++;
        }
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
        pushed++;
      }
    } catch (err) {
      const status = getStatus(err);
      const message = getErrorMessage(err);

      if (status === 401) {
        logger.warn('[push] 401 after refresh attempt — aborting tick', { localId: row.localId });
        return { pushed, errors, aborted: true };
      }

      if (status === 404 && row.syncStatus === 'pending_update') {
        logger.info('[push] remote not found — purging local', { localId: row.localId });
        await events.purgeLocal(row.localId);
        continue;
      }

      errors++;
      await events.markSyncError(row.localId, message);

      if (status !== null && status >= 500) {
        logger.warn('[push] 5xx — exiting loop', { status, message });
        break;
      }
      if (status === null) {
        logger.warn('[push] network error — exiting loop', { message });
        break;
      }
      // 4xx (non-401/404) — keep looping, row stays pending with syncError logged
    }
  }

  return { pushed, errors, aborted: false };
}
