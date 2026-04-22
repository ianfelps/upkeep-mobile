import type { LocalEvent } from '@/db/repositories/routineEvents';

export type EventFilter = 'day' | 'threeDays' | 'week' | 'month';

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
  isActive: boolean;
  source: LocalEvent;
};

export type EventsSection = {
  dateKey: string;
  title: string;
  data: EventOccurrence[];
};
