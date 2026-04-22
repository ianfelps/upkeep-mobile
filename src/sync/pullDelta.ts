import { listRoutineEvents } from '@/api/endpoints/routineEvents';
import * as events from '@/db/repositories/routineEvents';
import { kvGet, kvSet } from '@/db/repositories/kv';
import { logger } from '@/utils/logger';

const EPOCH_ISO = '1970-01-01T00:00:00.000Z';

export type PullOutcome = {
  pulled: number;
  errors: number;
  aborted: boolean;
};

export async function runPullDelta(): Promise<PullOutcome> {
  const lastPulledAt = (await kvGet('sync.lastPulledAt')) ?? EPOCH_ISO;

  try {
    const dtos = await listRoutineEvents({ updatedSince: lastPulledAt });

    let maxUpdatedAt = lastPulledAt;
    for (const dto of dtos) {
      await events.upsertFromServer(dto);
      if (dto.updatedAt > maxUpdatedAt) maxUpdatedAt = dto.updatedAt;
    }

    if (maxUpdatedAt !== lastPulledAt) {
      await kvSet('sync.lastPulledAt', maxUpdatedAt);
    }

    return { pulled: dtos.length, errors: 0, aborted: false };
  } catch (err) {
    logger.warn('[pull] failed', { message: (err as Error).message });
    return { pulled: 0, errors: 1, aborted: false };
  }
}
