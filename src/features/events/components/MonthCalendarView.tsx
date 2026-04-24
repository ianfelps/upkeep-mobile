import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components';
import { useColors } from '@/theme/useColors';
import { radii, spacing } from '@/theme';
import { parseDateKey } from '@/utils/date';
import { resolveEventColor } from '../constants';
import { todayKey } from '../selectors';
import type { EventOccurrence, EventsSection } from '../types';

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MAX_ONCE_CHIPS = 2;
const MAX_RECURRING_DOTS = 4;

type DayCell = {
  dateKey: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
};

function buildGrid(anchorKey: string): DayCell[][] {
  const anchor = parseDateKey(anchorKey);
  const monthStart = anchor.startOf('month');
  const monthEnd = anchor.endOf('month');
  const today = todayKey();

  const firstDow = monthStart.day();
  const paddingBefore = firstDow === 0 ? 6 : firstDow - 1;

  const cells: DayCell[] = [];

  for (let i = paddingBefore - 1; i >= 0; i--) {
    const d = monthStart.subtract(i + 1, 'day');
    cells.push({ dateKey: d.format('YYYY-MM-DD'), day: d.date(), isCurrentMonth: false, isToday: false });
  }

  const daysInMonth = monthEnd.date();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = monthStart.date(d);
    const dateKey = date.format('YYYY-MM-DD');
    cells.push({ dateKey, day: d, isCurrentMonth: true, isToday: dateKey === today });
  }

  const remainder = cells.length % 7;
  if (remainder > 0) {
    const fill = 7 - remainder;
    for (let i = 1; i <= fill; i++) {
      const d = monthEnd.add(i, 'day');
      cells.push({ dateKey: d.format('YYYY-MM-DD'), day: d.date(), isCurrentMonth: false, isToday: false });
    }
  }

  const rows: DayCell[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }
  return rows;
}

type Props = {
  sections: EventsSection[];
  anchorKey: string;
  onDayPress: (dateKey: string) => void;
};

export function MonthCalendarView({ sections, anchorKey, onDayPress }: Props) {
  const colors = useColors();

  const eventMap = useMemo(() => {
    const map = new Map<string, EventOccurrence[]>();
    for (const section of sections) {
      map.set(section.dateKey, section.data);
    }
    return map;
  }, [sections]);

  const rows = useMemo(() => buildGrid(anchorKey), [anchorKey]);

  return (
    <View style={styles.container}>
      <View style={[styles.weekHeader, { borderBottomColor: colors.border }]}>
        {WEEKDAYS.map((wd) => (
          <Text key={wd} variant="caption" color={colors.textMuted} style={styles.weekdayLabel}>
            {wd}
          </Text>
        ))}
      </View>

      {rows.map((row, rowIdx) => (
        <View key={rowIdx} style={[styles.row, { borderBottomColor: colors.border }]}>
          {row.map((cell) => {
            const occs = eventMap.get(cell.dateKey) ?? [];
            const onceOccs = occs.filter((o) => o.eventType === 'once');
            const recurringOccs = occs.filter((o) => o.eventType === 'recurring');

            const visibleOnce = onceOccs.slice(0, MAX_ONCE_CHIPS);
            const overflowCount = onceOccs.length - visibleOnce.length;
            const visibleRecurring = recurringOccs.slice(0, MAX_RECURRING_DOTS);

            return (
              <Pressable
                key={cell.dateKey}
                style={({ pressed }) => [
                  styles.cell,
                  { borderRightColor: colors.border },
                  !cell.isCurrentMonth && { backgroundColor: colors.background },
                  pressed && { backgroundColor: colors.surfaceAlt },
                ]}
                onPress={() => onDayPress(cell.dateKey)}
                accessibilityRole="button"
                accessibilityLabel={`Dia ${cell.day}, ${occs.length} eventos`}
              >
                <View style={[styles.dayNumWrap, cell.isToday && { backgroundColor: colors.primary }]}>
                  <Text
                    variant="smallMedium"
                    color={
                      cell.isToday
                        ? colors.primaryContrast
                        : cell.isCurrentMonth
                        ? colors.text
                        : colors.textMuted
                    }
                  >
                    {cell.day}
                  </Text>
                </View>

                <View style={styles.eventsArea}>
                  {visibleOnce.map((occ) => (
                    <View
                      key={occ.id}
                      style={[styles.chip, { backgroundColor: resolveEventColor(occ.source.color) }]}
                    >
                      <Text variant="caption" color="#fff" numberOfLines={1} style={styles.chipText}>
                        {occ.title}
                      </Text>
                    </View>
                  ))}

                  {overflowCount > 0 && (
                    <Text variant="caption" color={colors.textMuted} style={styles.overflow}>
                      +{overflowCount} mais
                    </Text>
                  )}

                  {visibleRecurring.length > 0 && (
                    <View style={styles.dotsRow}>
                      {visibleRecurring.map((occ) => (
                        <View
                          key={occ.id}
                          style={[
                            styles.dot,
                            { backgroundColor: resolveEventColor(occ.source.color) },
                          ]}
                        />
                      ))}
                      {recurringOccs.length > MAX_RECURRING_DOTS && (
                        <Text variant="caption" color={colors.textMuted} style={{ fontSize: 8 }}>
                          +{recurringOccs.length - MAX_RECURRING_DOTS}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  weekHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cell: {
    flex: 1,
    paddingTop: spacing.xs,
    paddingHorizontal: 2,
    borderRightWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  dayNumWrap: {
    alignSelf: 'center',
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsArea: {
    flex: 1,
    gap: 2,
    paddingBottom: spacing.xs,
  },
  chip: {
    borderRadius: radii.sm,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  chipText: {
    fontSize: 10,
    lineHeight: 14,
  },
  overflow: {
    fontSize: 9,
    paddingHorizontal: 2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
});
