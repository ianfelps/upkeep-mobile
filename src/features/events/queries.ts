import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import * as events from '@/db/repositories/routineEvents';
import { eventsQueryKeys } from './queryKeys';
import { expandRecurrence, groupByDay } from './selectors';
import type { EventsSection } from './types';

export function useEventsInRange(fromKey: string, toKey: string): UseQueryResult<EventsSection[]> {
  return useQuery({
    queryKey: eventsQueryKeys.range(fromKey, toKey),
    queryFn: async () => {
      const rows = await events.findInRange(fromKey, toKey);
      const occurrences = expandRecurrence(rows, fromKey, toKey);
      return groupByDay(occurrences);
    },
    staleTime: 10_000,
  });
}
