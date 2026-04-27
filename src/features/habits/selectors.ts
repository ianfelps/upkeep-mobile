import { dayjs, enumerateDays, parseDateKey, toDateKey } from '@/utils/date';
import type { LocalHabit } from '@/db/repositories/habits';
import type { LocalHabitLog } from '@/db/repositories/habitLogs';
import type { HabitStats, HeatmapCell } from './types';

export function intensityFromCounts(completed: number, total: number): 0 | 1 | 2 | 3 | 4 {
  if (total <= 0 || completed <= 0) return 0;
  const ratio = completed / total;
  if (ratio >= 1) return 4;
  if (ratio >= 0.66) return 3;
  if (ratio >= 0.33) return 2;
  return 1;
}

export function buildGlobalHeatmap(
  logs: LocalHabitLog[],
  totalActiveHabits: number,
  fromKey: string,
  toKey: string
): HeatmapCell[] {
  const completedByDate = new Map<string, number>();
  for (const log of logs) {
    if (log.status !== 'completed') continue;
    completedByDate.set(log.targetDate, (completedByDate.get(log.targetDate) ?? 0) + 1);
  }

  return enumerateDays(fromKey, toKey).map((dateKey) => {
    const completed = completedByDate.get(dateKey) ?? 0;
    return {
      dateKey,
      intensity: intensityFromCounts(completed, totalActiveHabits),
      completedCount: completed,
      totalHabits: totalActiveHabits,
    };
  });
}

export function buildHabitHeatmap(
  logs: LocalHabitLog[],
  fromKey: string,
  toKey: string
): HeatmapCell[] {
  const byDate = new Map<string, LocalHabitLog>();
  for (const log of logs) byDate.set(log.targetDate, log);

  return enumerateDays(fromKey, toKey).map((dateKey) => {
    const log = byDate.get(dateKey);
    let intensity: HeatmapCell['intensity'] = 0;
    let completed = 0;
    if (log) {
      if (log.status === 'completed') {
        intensity = 4;
        completed = 1;
      } else if (log.status === 'skipped') {
        intensity = 1;
      }
    }
    return { dateKey, intensity, completedCount: completed, totalHabits: 1 };
  });
}

export function computeStats(logs: LocalHabitLog[]): HabitStats {
  const completedDates = logs
    .filter((l) => l.status === 'completed')
    .map((l) => l.targetDate)
    .sort();

  const totalCompleted = completedDates.length;

  // streaks
  let longestStreak = 0;
  let currentStreak = 0;
  let runStreak = 0;
  let prev: string | null = null;
  for (const date of completedDates) {
    if (prev && parseDateKey(date).diff(parseDateKey(prev), 'day') === 1) {
      runStreak++;
    } else {
      runStreak = 1;
    }
    if (runStreak > longestStreak) longestStreak = runStreak;
    prev = date;
  }

  // currentStreak: ends today or yesterday
  if (completedDates.length > 0) {
    const today = toDateKey(dayjs());
    const yesterday = toDateKey(dayjs().subtract(1, 'day'));
    const last = completedDates[completedDates.length - 1]!;
    if (last === today || last === yesterday) {
      currentStreak = 1;
      for (let i = completedDates.length - 2; i >= 0; i--) {
        if (parseDateKey(completedDates[i + 1]!).diff(parseDateKey(completedDates[i]!), 'day') === 1) {
          currentStreak++;
        } else break;
      }
    }
  }

  // completion rate last 30 days
  const today = dayjs();
  const from = toDateKey(today.subtract(29, 'day'));
  const to = toDateKey(today);
  const completedInRange = completedDates.filter((d) => d >= from && d <= to).length;
  const completionRate30d = completedInRange / 30;

  return { totalCompleted, currentStreak, longestStreak, completionRate30d };
}

export function decorateHabitsWithToday(
  habits: LocalHabit[],
  todayLogs: LocalHabitLog[]
) {
  const byHabit = new Map<string, LocalHabitLog>();
  for (const log of todayLogs) byHabit.set(log.habitLocalId, log);
  return habits.map((habit) => {
    const todayLog = byHabit.get(habit.localId) ?? null;
    return {
      habit,
      todayLog,
      completedToday: todayLog?.status === 'completed',
    };
  });
}
