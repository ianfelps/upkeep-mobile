import type { LocalEvent } from '@/db/repositories/routineEvents';
import { dayjs, enumerateDays, formatDayHeader, parseDateKey } from '@/utils/date';
import type { EventFilter, EventOccurrence, EventsSection } from './types';

export type DateRange = { fromKey: string; toKey: string };

export function resolveRange(filter: EventFilter, anchorKey: string): DateRange {
  const anchor = parseDateKey(anchorKey);
  switch (filter) {
    case 'day':
      return { fromKey: anchor.format('YYYY-MM-DD'), toKey: anchor.format('YYYY-MM-DD') };
    case 'week': {
      const dow = anchor.day();
      const deltaToMon = dow === 0 ? -6 : 1 - dow;
      const monday = anchor.add(deltaToMon, 'day');
      const sunday = monday.add(6, 'day');
      return { fromKey: monday.format('YYYY-MM-DD'), toKey: sunday.format('YYYY-MM-DD') };
    }
    case 'month':
      return {
        fromKey: anchor.startOf('month').format('YYYY-MM-DD'),
        toKey: anchor.endOf('month').format('YYYY-MM-DD'),
      };
  }
}

export function formatRangeLabel(filter: EventFilter, anchorKey: string): string {
  const anchor = parseDateKey(anchorKey);
  switch (filter) {
    case 'day':
      return anchor.format('dddd · DD [de] MMM');
    case 'week': {
      const { fromKey, toKey } = resolveRange('week', anchorKey);
      return `${parseDateKey(fromKey).format('DD MMM')} – ${parseDateKey(toKey).format('DD MMM')}`;
    }
    case 'month':
      return anchor.format('MMMM [de] YYYY');
  }
}

export function shiftAnchor(filter: EventFilter, anchorKey: string, direction: 1 | -1): string {
  const anchor = parseDateKey(anchorKey);
  switch (filter) {
    case 'day':
      return anchor.add(direction, 'day').format('YYYY-MM-DD');
    case 'week':
      return anchor.add(direction, 'week').format('YYYY-MM-DD');
    case 'month':
      return anchor.add(direction, 'month').format('YYYY-MM-DD');
  }
}

function occurrenceId(localId: string, dateKey: string): string {
  return `${localId}:${dateKey}`;
}

function buildOccurrence(event: LocalEvent, dateKey: string): EventOccurrence {
  return {
    id: occurrenceId(event.localId, dateKey),
    localId: event.localId,
    remoteId: event.remoteId,
    dateKey,
    startTime: event.startTime,
    endTime: event.endTime,
    title: event.title,
    description: event.description,
    eventType: event.eventType,
    source: event,
  };
}

export function expandRecurrence(
  events: LocalEvent[],
  fromKey: string,
  toKey: string
): EventOccurrence[] {
  const days = enumerateDays(fromKey, toKey);
  const out: EventOccurrence[] = [];

  for (const event of events) {
    if (event.eventType === 'once') {
      if (!event.eventDate) continue;
      if (event.eventDate >= fromKey && event.eventDate <= toKey) {
        out.push(buildOccurrence(event, event.eventDate));
      }
      continue;
    }

    // recurring
    const daysOfWeek = event.daysOfWeekParsed;
    if (!daysOfWeek || daysOfWeek.length === 0) continue;
    const wanted = new Set(daysOfWeek);
    for (const dayKey of days) {
      const weekday = parseDateKey(dayKey).day();
      if (wanted.has(weekday)) {
        out.push(buildOccurrence(event, dayKey));
      }
    }
  }

  out.sort((a, b) => {
    if (a.dateKey !== b.dateKey) return a.dateKey < b.dateKey ? -1 : 1;
    if (a.startTime !== b.startTime) return a.startTime < b.startTime ? -1 : 1;
    return a.title.localeCompare(b.title, 'pt-BR');
  });

  return out;
}

export function groupByDay(occurrences: EventOccurrence[]): EventsSection[] {
  const map = new Map<string, EventOccurrence[]>();
  for (const occ of occurrences) {
    const bucket = map.get(occ.dateKey);
    if (bucket) bucket.push(occ);
    else map.set(occ.dateKey, [occ]);
  }

  const keys = Array.from(map.keys()).sort();
  return keys.map((dateKey) => ({
    dateKey,
    title: formatDayHeader(dateKey),
    data: map.get(dateKey)!,
  }));
}

export function todayKey(): string {
  return dayjs().format('YYYY-MM-DD');
}
