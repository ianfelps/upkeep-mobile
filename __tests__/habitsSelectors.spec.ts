import {
  buildGlobalHeatmap,
  buildHabitHeatmap,
  computeStats,
  decorateHabitsWithToday,
  intensityFromCounts,
} from '@/features/habits/selectors';
import type { LocalHabit } from '@/db/repositories/habits';
import type { LocalHabitLog } from '@/db/repositories/habitLogs';
import { dayjs, toDateKey } from '@/utils/date';

function makeLog(overrides: Partial<LocalHabitLog>): LocalHabitLog {
  return {
    localId: overrides.localId ?? 'l-' + Math.random().toString(36).slice(2),
    remoteId: null,
    habitLocalId: 'habit-1',
    habitRemoteId: null,
    targetDate: '2026-04-26',
    status: 'completed',
    completedAt: '2026-04-26T10:00:00.000Z',
    notes: null,
    earnedXp: 10,
    userId: 'user-1',
    createdAt: '2026-04-26T10:00:00.000Z',
    updatedAt: '2026-04-26T10:00:00.000Z',
    syncStatus: 'synced',
    lastSyncedAt: null,
    syncError: null,
    syncAttempts: 0,
    ...overrides,
  } as LocalHabitLog;
}

function makeHabit(overrides: Partial<LocalHabit>): LocalHabit {
  return {
    localId: overrides.localId ?? 'h-' + Math.random().toString(36).slice(2),
    remoteId: null,
    title: 'Hábito',
    description: null,
    icon: 'target',
    color: '#EA580C',
    frequencyType: 'daily',
    targetValue: 1,
    isActive: true,
    linkedRoutineEventIds: null,
    userId: 'user-1',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-04-01T00:00:00.000Z',
    syncStatus: 'synced',
    lastSyncedAt: null,
    syncError: null,
    syncAttempts: 0,
    linkedRoutineEventIdsParsed: [],
    ...overrides,
  } as LocalHabit;
}

describe('intensityFromCounts', () => {
  it('returns 0 for empty', () => {
    expect(intensityFromCounts(0, 5)).toBe(0);
    expect(intensityFromCounts(2, 0)).toBe(0);
  });
  it('scales with ratio', () => {
    expect(intensityFromCounts(5, 5)).toBe(4);
    expect(intensityFromCounts(4, 5)).toBe(3);
    expect(intensityFromCounts(2, 5)).toBe(2);
    expect(intensityFromCounts(1, 5)).toBe(1);
  });
});

describe('buildGlobalHeatmap', () => {
  it('counts completed logs per date', () => {
    const logs = [
      makeLog({ targetDate: '2026-04-25', status: 'completed', habitLocalId: 'h1' }),
      makeLog({ targetDate: '2026-04-25', status: 'completed', habitLocalId: 'h2' }),
      makeLog({ targetDate: '2026-04-25', status: 'skipped', habitLocalId: 'h3' }),
      makeLog({ targetDate: '2026-04-26', status: 'completed', habitLocalId: 'h1' }),
    ];
    const cells = buildGlobalHeatmap(logs, 3, '2026-04-25', '2026-04-26');
    expect(cells).toHaveLength(2);
    expect(cells[0]!.completedCount).toBe(2);
    expect(cells[0]!.intensity).toBe(3); // 2/3 = 0.66
    expect(cells[1]!.completedCount).toBe(1);
    expect(cells[1]!.intensity).toBe(2); // 1/3 = 0.33
  });
});

describe('buildHabitHeatmap', () => {
  it('marks completed/skipped/empty per day', () => {
    const logs = [
      makeLog({ targetDate: '2026-04-25', status: 'completed' }),
      makeLog({ targetDate: '2026-04-26', status: 'skipped' }),
    ];
    const cells = buildHabitHeatmap(logs, '2026-04-25', '2026-04-27');
    expect(cells[0]!.intensity).toBe(4);
    expect(cells[1]!.intensity).toBe(1);
    expect(cells[2]!.intensity).toBe(0);
  });
});

describe('computeStats', () => {
  it('handles empty logs', () => {
    const s = computeStats([]);
    expect(s.totalCompleted).toBe(0);
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(0);
  });

  it('computes longestStreak across runs', () => {
    const logs = [
      makeLog({ targetDate: '2026-01-01', status: 'completed' }),
      makeLog({ targetDate: '2026-01-02', status: 'completed' }),
      makeLog({ targetDate: '2026-01-03', status: 'completed' }),
      makeLog({ targetDate: '2026-01-10', status: 'completed' }),
    ];
    const s = computeStats(logs);
    expect(s.totalCompleted).toBe(4);
    expect(s.longestStreak).toBe(3);
  });

  it('currentStreak ends today or yesterday only', () => {
    const today = toDateKey(dayjs());
    const yesterday = toDateKey(dayjs().subtract(1, 'day'));
    const logs = [
      makeLog({ targetDate: yesterday, status: 'completed' }),
      makeLog({ targetDate: today, status: 'completed' }),
    ];
    const s = computeStats(logs);
    expect(s.currentStreak).toBe(2);
  });

  it('currentStreak is 0 if last completion is older than yesterday', () => {
    const old = toDateKey(dayjs().subtract(7, 'day'));
    const logs = [makeLog({ targetDate: old, status: 'completed' })];
    expect(computeStats(logs).currentStreak).toBe(0);
  });
});

describe('decorateHabitsWithToday', () => {
  it('flags completedToday correctly', () => {
    const habits = [makeHabit({ localId: 'h1' }), makeHabit({ localId: 'h2' })];
    const logs = [makeLog({ habitLocalId: 'h1', status: 'completed' })];
    const decorated = decorateHabitsWithToday(habits, logs);
    expect(decorated[0]!.completedToday).toBe(true);
    expect(decorated[1]!.completedToday).toBe(false);
  });

  it('does not flag completedToday for non-completed log', () => {
    const habits = [makeHabit({ localId: 'h1' })];
    const logs = [makeLog({ habitLocalId: 'h1', status: 'skipped' })];
    const decorated = decorateHabitsWithToday(habits, logs);
    expect(decorated[0]!.completedToday).toBe(false);
    expect(decorated[0]!.todayLog).not.toBeNull();
  });
});
