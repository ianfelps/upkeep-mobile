import { listRoutineEvents } from '@/api/endpoints/routineEvents';
import { listHabits } from '@/api/endpoints/habits';
import { listHabitLogs } from '@/api/endpoints/habitLogs';
import * as events from '@/db/repositories/routineEvents';
import * as habitsRepo from '@/db/repositories/habits';
import * as habitLogsRepo from '@/db/repositories/habitLogs';
import { kvDelete, kvGet, kvSet, type KvKey } from '@/db/repositories/kv';
import { logger } from '@/utils/logger';

const EPOCH_ISO = '1970-01-01T00:00:00.000Z';

export type PullOutcome = {
  pulled: number;
  errors: number;
  aborted: boolean;
};

async function migrateLegacyEventsKey(): Promise<void> {
  const legacy = await kvGet('sync.lastPulledAt');
  if (!legacy) return;
  const current = await kvGet('sync.lastPulledAt.events');
  if (!current) await kvSet('sync.lastPulledAt.events', legacy);
  await kvDelete('sync.lastPulledAt');
}

async function pullResource(
  cursorKey: KvKey,
  fetcher: (since: string) => Promise<{ updatedAt: string }[]>,
  applier: (dto: never) => Promise<unknown>
): Promise<{ pulled: number; errors: number }> {
  const lastPulledAt = (await kvGet(cursorKey)) ?? EPOCH_ISO;
  try {
    const dtos = await fetcher(lastPulledAt);
    let maxUpdatedAt = lastPulledAt;
    for (const dto of dtos) {
      await applier(dto as never);
      if (dto.updatedAt > maxUpdatedAt) maxUpdatedAt = dto.updatedAt;
    }
    if (maxUpdatedAt !== lastPulledAt) await kvSet(cursorKey, maxUpdatedAt);
    return { pulled: dtos.length, errors: 0 };
  } catch (err) {
    logger.warn(`[pull] ${cursorKey} failed`, { message: (err as Error).message });
    return { pulled: 0, errors: 1 };
  }
}

export async function runPullDelta(): Promise<PullOutcome> {
  await migrateLegacyEventsKey();

  let pulled = 0;
  let errors = 0;

  const evRes = await pullResource(
    'sync.lastPulledAt.events',
    (since) => listRoutineEvents({ updatedSince: since }),
    (dto) => events.upsertFromServer(dto)
  );
  pulled += evRes.pulled;
  errors += evRes.errors;

  const habitsRes = await pullResource(
    'sync.lastPulledAt.habits',
    (since) => listHabits({ updatedSince: since }),
    (dto) => habitsRepo.upsertFromServer(dto)
  );
  pulled += habitsRes.pulled;
  errors += habitsRes.errors;

  // Habit logs: 1 call per active habit with remoteId.
  const lastLogsAt = (await kvGet('sync.lastPulledAt.habitLogs')) ?? EPOCH_ISO;
  let maxLogsAt = lastLogsAt;
  let logsPulled = 0;
  let logsErrors = 0;
  try {
    const allHabits = await habitsRepo.findAll();
    for (const h of allHabits) {
      if (!h.remoteId) continue;
      try {
        const dtos = await listHabitLogs(h.remoteId, { updatedSince: lastLogsAt });
        for (const dto of dtos) {
          const result = await habitLogsRepo.upsertFromServer(dto);
          if (result === 'orphan') {
            logger.warn('[pull] orphan log — habit not in local DB', { logId: dto.id });
            continue;
          }
          if (dto.updatedAt > maxLogsAt) maxLogsAt = dto.updatedAt;
          logsPulled++;
        }
      } catch (err) {
        logsErrors++;
        logger.warn('[pull] habit logs failed', {
          habit: h.remoteId,
          message: (err as Error).message,
        });
      }
    }
    if (maxLogsAt !== lastLogsAt) await kvSet('sync.lastPulledAt.habitLogs', maxLogsAt);
  } catch (err) {
    logsErrors++;
    logger.warn('[pull] habit logs sweep failed', { message: (err as Error).message });
  }
  pulled += logsPulled;
  errors += logsErrors;

  return { pulled, errors, aborted: false };
}
