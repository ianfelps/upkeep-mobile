import { EVENT_COLORS, resolveEventBg, resolveEventColor } from '@/features/events/constants';

export const HABIT_COLORS = EVENT_COLORS;
export type HabitColor = (typeof HABIT_COLORS)[number];
export const DEFAULT_HABIT_COLOR = HABIT_COLORS[0]!;

export const resolveHabitColor = resolveEventColor;
export const resolveHabitBg = resolveEventBg;

export const FEATHER_ICON_OPTIONS = [
  'target',
  'check-circle',
  'book',
  'book-open',
  'droplet',
  'activity',
  'heart',
  'sun',
  'moon',
  'coffee',
  'code',
  'music',
  'feather',
  'edit-3',
  'smile',
  'trending-up',
  'zap',
  'wind',
  'star',
  'award',
  'clock',
  'phone',
  'globe',
  'compass',
] as const;

export type HabitIcon = (typeof FEATHER_ICON_OPTIONS)[number];
export const DEFAULT_HABIT_ICON: HabitIcon = 'target';

export function resolveHabitIcon(icon: string | null | undefined): string {
  if (icon && (FEATHER_ICON_OPTIONS as readonly string[]).includes(icon)) return icon;
  return DEFAULT_HABIT_ICON;
}

export const HEATMAP_INTENSITY_OPACITY = [0, 0.25, 0.5, 0.75, 1] as const;
