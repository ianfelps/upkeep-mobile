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

export const DEFAULT_EVENT_COLOR = EVENT_COLORS[0]!;

export function resolveEventColor(color: string | null | undefined): string {
  return color ?? DEFAULT_EVENT_COLOR;
}

export function resolveEventBg(color: string | null | undefined): string {
  const c = resolveEventColor(color);
  return BG_MAP[c] ?? '#FFF7ED';
}
