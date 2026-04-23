import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import * as events from '@/db/repositories/routineEvents';
import { eventsQueryKeys } from './queryKeys';
import { expandRecurrence, groupByDay } from './selectors';
import type { EventOccurrence, EventsSection } from './types';

export function useEventsInRange(
  fromKey: string,
  toKey: string,
  options?: { enabled?: boolean },
): UseQueryResult<EventsSection[]> {
  return useQuery({
    queryKey: eventsQueryKeys.range(fromKey, toKey),
    queryFn: async () => {
      const rows = await events.findInRange(fromKey, toKey);
      const occurrences = expandRecurrence(rows, fromKey, toKey);
      return groupByDay(occurrences);
    },
    staleTime: 10_000,
    enabled: options?.enabled ?? true,
  });
}

export function useEventsForDay(
  dateKey: string,
  options?: { enabled?: boolean },
): UseQueryResult<EventOccurrence[]> {
  return useQuery({
    queryKey: eventsQueryKeys.day(dateKey),
    queryFn: async () => {
      const rows = await events.findInRange(dateKey, dateKey);
      return expandRecurrence(rows, dateKey, dateKey);
    },
    staleTime: 10_000,
    enabled: options?.enabled ?? true,
  });
}
