import type { LocalEvent } from '@/db/repositories/routineEvents';

export type EventFilter = 'day' | 'week' | 'month';

export type EventOccurrence = {
  /** Composite key: `${localId}:${dateKey}` — stable for FlatList. */
  id: string;
  localId: string;
  remoteId: string | null;
  dateKey: string;
  startTime: string;
  endTime: string | null;
  title: string;
  description: string | null;
  eventType: 'once' | 'recurring';
  source: LocalEvent;
};

export type EventsSection = {
  dateKey: string;
  title: string;
  data: EventOccurrence[];
};
