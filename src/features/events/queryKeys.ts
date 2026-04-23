export const eventsQueryKeys = {
  all: ['events'] as const,
  range: (from: string, to: string) => ['events', 'range', from, to] as const,
  day: (dateKey: string) => ['events', 'timeline', dateKey] as const,
};
