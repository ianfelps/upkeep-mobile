export const habitsQueryKeys = {
  all: ['habits'] as const,
  list: () => ['habits', 'list'] as const,
  detail: (localId: string) => ['habits', 'detail', localId] as const,
  logs: (habitLocalId: string, from: string, to: string) =>
    ['habits', 'logs', habitLocalId, from, to] as const,
  heatmapGlobal: (from: string, to: string) => ['habits', 'heatmap', 'global', from, to] as const,
  heatmapByHabit: (habitLocalId: string, from: string, to: string) =>
    ['habits', 'heatmap', 'byHabit', habitLocalId, from, to] as const,
};
