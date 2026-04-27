import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import * as habitsRepo from '@/db/repositories/habits';
import * as habitLogsRepo from '@/db/repositories/habitLogs';
import { dayjs, toDateKey } from '@/utils/date';
import { habitsQueryKeys } from './queryKeys';
import {
  buildGlobalHeatmap,
  buildHabitHeatmap,
  computeStats,
  decorateHabitsWithToday,
} from './selectors';
import type { HabitStats, HabitWithTodayLog, HeatmapCell } from './types';

export function useHabitsList(): UseQueryResult<HabitWithTodayLog[]> {
  return useQuery({
    queryKey: habitsQueryKeys.list(),
    queryFn: async () => {
      const habits = await habitsRepo.findAll();
      const todayKey = toDateKey(dayjs());
      const logs = await habitLogsRepo.findAllInRange(todayKey, todayKey);
      return decorateHabitsWithToday(habits, logs);
    },
    staleTime: 5_000,
  });
}

export function useHabitDetail(localId: string): UseQueryResult<{
  habit: habitsRepo.LocalHabit;
  logs: habitLogsRepo.LocalHabitLog[];
  stats: HabitStats;
}> {
  return useQuery({
    queryKey: habitsQueryKeys.detail(localId),
    queryFn: async () => {
      const habit = await habitsRepo.getByLocalId(localId);
      if (!habit) throw new Error('Hábito não encontrado');
      const from = toDateKey(dayjs().subtract(364, 'day'));
      const to = toDateKey(dayjs());
      const logs = await habitLogsRepo.findByHabit(localId, { from, to });
      const stats = computeStats(logs);
      return { habit, logs, stats };
    },
    staleTime: 5_000,
    enabled: !!localId,
  });
}

export function useHabitHeatmap(
  habitLocalId: string,
  from: string,
  to: string
): UseQueryResult<HeatmapCell[]> {
  return useQuery({
    queryKey: habitsQueryKeys.heatmapByHabit(habitLocalId, from, to),
    queryFn: async () => {
      const logs = await habitLogsRepo.findByHabit(habitLocalId, { from, to });
      return buildHabitHeatmap(logs, from, to);
    },
    staleTime: 5_000,
    enabled: !!habitLocalId,
  });
}

export function useGlobalHeatmap(from: string, to: string): UseQueryResult<HeatmapCell[]> {
  return useQuery({
    queryKey: habitsQueryKeys.heatmapGlobal(from, to),
    queryFn: async () => {
      const [logs, activeHabits] = await Promise.all([
        habitLogsRepo.findAllInRange(from, to),
        habitsRepo.findActive(),
      ]);
      return buildGlobalHeatmap(logs, activeHabits.length, from, to);
    },
    staleTime: 5_000,
  });
}
