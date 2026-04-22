import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import weekday from 'dayjs/plugin/weekday';
import 'dayjs/locale/pt-br';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.extend(weekday);
dayjs.locale('pt-br');

export { dayjs };

export function nowIsoUtc(): string {
  return dayjs.utc().toISOString();
}

export function toDateKey(d: dayjs.Dayjs | Date | string): string {
  return dayjs(d).format('YYYY-MM-DD');
}

export function parseDateKey(key: string): dayjs.Dayjs {
  return dayjs(key, 'YYYY-MM-DD');
}

export function enumerateDays(fromKey: string, toKey: string): string[] {
  const out: string[] = [];
  let cursor = parseDateKey(fromKey);
  const end = parseDateKey(toKey);
  while (cursor.isSame(end) || cursor.isBefore(end)) {
    out.push(cursor.format('YYYY-MM-DD'));
    cursor = cursor.add(1, 'day');
  }
  return out;
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '';
  const [hh, mm] = value.split(':');
  return `${hh}:${mm}`;
}

export function formatDayHeader(key: string): string {
  const d = parseDateKey(key);
  const weekday = d.format('dddd');
  return `${capitalize(weekday)} · ${d.format('DD MMM')}`;
}

export function capitalize(s: string): string {
  return s.length > 0 ? s[0]!.toUpperCase() + s.slice(1) : s;
}
