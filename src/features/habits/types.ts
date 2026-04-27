import type { LocalHabit } from '@/db/repositories/habits';
import type { LocalHabitLog } from '@/db/repositories/habitLogs';

export type HabitWithTodayLog = {
  habit: LocalHabit;
  todayLog: LocalHabitLog | null;
  completedToday: boolean;
};

export type HeatmapCell = {
  dateKey: string;
  intensity: 0 | 1 | 2 | 3 | 4;
  completedCount: number;
  totalHabits: number;
};

export type HeatmapRange = 'month' | '6months' | 'year';

export type HabitStats = {
  totalCompleted: number;
  currentStreak: number;
  longestStreak: number;
  completionRate30d: number;
};
