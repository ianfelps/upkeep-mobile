import type { LocalEvent } from '@/db/repositories/routineEvents';
import {
  expandRecurrence,
  groupByDay,
  resolveRange,
  shiftAnchor,
} from '@/features/events/selectors';

function makeEvent(overrides: Partial<LocalEvent>): LocalEvent {
  return {
    localId: 'l-' + (overrides.localId ?? Math.random().toString(36).slice(2)),
    remoteId: null,
    title: 'Título',
    description: null,
    startTime: '09:00:00',
    endTime: null,
    daysOfWeek: null,
    eventDate: null,
    eventType: 'once',
    isActive: true,
    userId: 'user-1',
    createdAt: '2026-04-21T00:00:00.000Z',
    updatedAt: '2026-04-21T00:00:00.000Z',
    syncStatus: 'synced',
    lastSyncedAt: null,
    syncError: null,
    syncAttempts: 0,
    daysOfWeekParsed: null,
    ...overrides,
  } as LocalEvent;
}

describe('expandRecurrence', () => {
  it('returns empty when no events match the range', () => {
    const out = expandRecurrence([], '2026-04-20', '2026-04-26');
    expect(out).toEqual([]);
  });

  it('emits a once event only within the range', () => {
    const e = makeEvent({
      localId: 'once-in',
      eventType: 'once',
      eventDate: '2026-04-22',
    });
    const outIn = expandRecurrence([e], '2026-04-20', '2026-04-26');
    expect(outIn).toHaveLength(1);
    expect(outIn[0]!.dateKey).toBe('2026-04-22');

    const outOut = expandRecurrence([e], '2026-05-01', '2026-05-07');
    expect(outOut).toHaveLength(0);
  });

  it('emits recurring event on each matching weekday in range', () => {
    const e = makeEvent({
      localId: 'rec',
      eventType: 'recurring',
      daysOfWeekParsed: [1, 3, 5], // seg, qua, sex
      startTime: '07:30:00',
    });
    // segunda 2026-04-20 → domingo 2026-04-26
    const out = expandRecurrence([e], '2026-04-20', '2026-04-26');
    expect(out.map((o) => o.dateKey)).toEqual(['2026-04-20', '2026-04-22', '2026-04-24']);
  });

  it('skips inactive events', () => {
    const e = makeEvent({
      localId: 'off',
      eventType: 'once',
      eventDate: '2026-04-22',
      isActive: false,
    });
    const out = expandRecurrence([e], '2026-04-20', '2026-04-26');
    expect(out).toHaveLength(0);
  });

  it('sorts by day, then startTime, then title', () => {
    const e1 = makeEvent({
      localId: 'a',
      eventType: 'once',
      eventDate: '2026-04-21',
      startTime: '10:00:00',
      title: 'Banco',
    });
    const e2 = makeEvent({
      localId: 'b',
      eventType: 'once',
      eventDate: '2026-04-21',
      startTime: '08:00:00',
      title: 'Academia',
    });
    const e3 = makeEvent({
      localId: 'c',
      eventType: 'once',
      eventDate: '2026-04-20',
      startTime: '22:00:00',
      title: 'Cinema',
    });
    const out = expandRecurrence([e1, e2, e3], '2026-04-19', '2026-04-22');
    expect(out.map((o) => o.localId)).toEqual(['c', 'b', 'a']);
  });

  it('handles crossing month boundaries for recurring events', () => {
    const e = makeEvent({
      localId: 'rec-cross',
      eventType: 'recurring',
      daysOfWeekParsed: [0, 6], // dom e sáb
    });
    const out = expandRecurrence([e], '2026-04-30', '2026-05-03');
    // 2026-04-30 qui, 2026-05-01 sex, 2026-05-02 sáb, 2026-05-03 dom
    expect(out.map((o) => o.dateKey)).toEqual(['2026-05-02', '2026-05-03']);
  });

  it('ignores recurring events with empty daysOfWeek', () => {
    const e = makeEvent({
      localId: 'bad',
      eventType: 'recurring',
      daysOfWeekParsed: [],
    });
    const out = expandRecurrence([e], '2026-04-20', '2026-04-26');
    expect(out).toHaveLength(0);
  });

  it('ignores once events without eventDate', () => {
    const e = makeEvent({
      localId: 'bad2',
      eventType: 'once',
      eventDate: null,
    });
    const out = expandRecurrence([e], '2026-04-20', '2026-04-26');
    expect(out).toHaveLength(0);
  });
});

describe('groupByDay', () => {
  it('groups occurrences into sections sorted by day', () => {
    const e1 = makeEvent({
      localId: 'a',
      eventType: 'once',
      eventDate: '2026-04-22',
      startTime: '09:00:00',
    });
    const e2 = makeEvent({
      localId: 'b',
      eventType: 'once',
      eventDate: '2026-04-21',
      startTime: '10:00:00',
    });
    const occs = expandRecurrence([e1, e2], '2026-04-20', '2026-04-26');
    const sections = groupByDay(occs);
    expect(sections.map((s) => s.dateKey)).toEqual(['2026-04-21', '2026-04-22']);
    expect(sections[0]!.data).toHaveLength(1);
    expect(sections[1]!.data).toHaveLength(1);
  });
});

describe('resolveRange', () => {
  it('day: anchor to anchor', () => {
    expect(resolveRange('day', '2026-04-21')).toEqual({
      fromKey: '2026-04-21',
      toKey: '2026-04-21',
    });
  });

  it('threeDays: anchor-1 to anchor+1', () => {
    expect(resolveRange('threeDays', '2026-04-21')).toEqual({
      fromKey: '2026-04-20',
      toKey: '2026-04-22',
    });
  });

  it('week: monday to sunday containing the anchor', () => {
    // 2026-04-21 is a Tuesday
    expect(resolveRange('week', '2026-04-21')).toEqual({
      fromKey: '2026-04-20',
      toKey: '2026-04-26',
    });
  });

  it('week: sunday anchor rolls back to previous Monday', () => {
    // 2026-04-26 is a Sunday
    expect(resolveRange('week', '2026-04-26')).toEqual({
      fromKey: '2026-04-20',
      toKey: '2026-04-26',
    });
  });

  it('month: first to last day of month', () => {
    expect(resolveRange('month', '2026-04-21')).toEqual({
      fromKey: '2026-04-01',
      toKey: '2026-04-30',
    });
  });
});

describe('shiftAnchor', () => {
  it('day +/- 1 day', () => {
    expect(shiftAnchor('day', '2026-04-21', 1)).toBe('2026-04-22');
    expect(shiftAnchor('day', '2026-04-21', -1)).toBe('2026-04-20');
  });
  it('threeDays +/- 3 days', () => {
    expect(shiftAnchor('threeDays', '2026-04-21', 1)).toBe('2026-04-24');
    expect(shiftAnchor('threeDays', '2026-04-21', -1)).toBe('2026-04-18');
  });
  it('week +/- 1 week', () => {
    expect(shiftAnchor('week', '2026-04-21', 1)).toBe('2026-04-28');
  });
  it('month +/- 1 month', () => {
    expect(shiftAnchor('month', '2026-04-21', 1)).toBe('2026-05-21');
  });
});
