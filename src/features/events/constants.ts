export const EVENT_COLORS = [
  '#EA580C', // laranja
  '#0F766E', // teal
  '#2563EB', // azul
  '#7C3AED', // violeta
  '#DB2777', // rosa
  '#16A34A', // verde
  '#CA8A04', // âmbar
  '#64748B', // ardósia
] as const;

export type EventColor = (typeof EVENT_COLORS)[number];

const BG_MAP: Record<string, string> = {
  '#EA580C': '#FFF7ED',
  '#0F766E': '#F0FDFA',
  '#2563EB': '#EFF6FF',
  '#7C3AED': '#F5F3FF',
  '#DB2777': '#FDF2F8',
  '#16A34A': '#F0FDF4',
  '#CA8A04': '#FEFCE8',
  '#64748B': '#F8FAFC',
};

const BG_MAP_DARK: Record<string, string> = {
  '#EA580C': '#431407',
  '#0F766E': '#042f2e',
  '#2563EB': '#1e3a8a',
  '#7C3AED': '#2e1065',
  '#DB2777': '#500724',
  '#16A34A': '#052e16',
  '#CA8A04': '#1c1400',
  '#64748B': '#0f172a',
};

export const DEFAULT_EVENT_COLOR = EVENT_COLORS[0]!;

export function resolveEventColor(color: string | null | undefined): string {
  return color ?? DEFAULT_EVENT_COLOR;
}

export function resolveEventBg(color: string | null | undefined, dark = false): string {
  const c = resolveEventColor(color);
  const map = dark ? BG_MAP_DARK : BG_MAP;
  return map[c] ?? (dark ? '#431407' : '#FFF7ED');
}
