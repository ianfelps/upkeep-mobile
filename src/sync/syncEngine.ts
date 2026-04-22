import { useAuthStore } from '@/features/auth/store';
import { nowIsoUtc } from '@/utils/date';
import { logger } from '@/utils/logger';
import { runPushQueue } from './pushQueue';
import { runPullDelta } from './pullDelta';
import type { SyncReason, SyncResult } from './types';

type Listener = (result: SyncResult) => void;

let tickInFlight: Promise<SyncResult> | null = null;
const listeners = new Set<Listener>();

function emit(result: SyncResult) {
  for (const l of listeners) {
    try {
      l(result);
    } catch (err) {
      logger.warn('[sync] listener threw', { message: (err as Error).message });
    }
  }
}

export function onSyncResult(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

async function performTick(reason: SyncReason): Promise<SyncResult> {
  const startedAt = nowIsoUtc();
  const status = useAuthStore.getState().status;

  if (status !== 'authenticated') {
    const finishedAt = nowIsoUtc();
    return {
      reason,
      outcome: 'skipped',
      pushed: 0,
      pulled: 0,
      errors: 0,
      startedAt,
      finishedAt,
      message: 'not authenticated',
    };
  }

  logger.info('[sync] tick start', { reason });

  const push = await runPushQueue();
  if (push.aborted) {
    const finishedAt = nowIsoUtc();
    return {
      reason,
      outcome: 'aborted',
      pushed: push.pushed,
      pulled: 0,
      errors: push.errors,
      startedAt,
      finishedAt,
      message: 'push aborted',
    };
  }

  const pull = await runPullDelta();
  const errors = push.errors + pull.errors;
  const outcome: SyncResult['outcome'] = errors > 0 ? 'partial' : 'ok';
  const finishedAt = nowIsoUtc();

  logger.info('[sync] tick done', {
    reason,
    pushed: push.pushed,
    pulled: pull.pulled,
    errors,
  });

  return {
    reason,
    outcome,
    pushed: push.pushed,
    pulled: pull.pulled,
    errors,
    startedAt,
    finishedAt,
  };
}

async function tick(reason: SyncReason): Promise<SyncResult> {
  if (tickInFlight) return tickInFlight;

  tickInFlight = (async () => {
    try {
      const result = await performTick(reason);
      emit(result);
      return result;
    } finally {
      tickInFlight = null;
    }
  })();

  return tickInFlight;
}

export const syncEngine = {
  tick,
  onResult: onSyncResult,
};
