import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components';
import { spacing } from '@/theme';
import { useColors } from '@/theme/useColors';
import { dayjs, parseDateKey, toDateKey } from '@/utils/date';
import { resolveHabitColor } from '../constants';
import type { HeatmapCell } from '../types';

const CELL = 12;
const GAP = 3;
const RADIUS = 2;

type Props = {
  cells: HeatmapCell[];
  color: string;
  onCellPress?: (cell: HeatmapCell) => void;
  showMonthLabels?: boolean;
};

function intensityToOpacity(i: HeatmapCell['intensity']): number {
  return [0, 0.25, 0.5, 0.75, 1][i] ?? 0;
}

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

export function HabitsHeatmap({ cells, color, onCellPress, showMonthLabels = true }: Props) {
  const colors = useColors();
  const baseColor = resolveHabitColor(color);
  const scrollRef = useRef<ScrollView>(null);

  const weeks = useMemo(() => {
    if (cells.length === 0) return [] as (HeatmapCell | null)[][];
    const first = parseDateKey(cells[0]!.dateKey);
    const startOffset = first.day();
    const padded: (HeatmapCell | null)[] = Array(startOffset).fill(null);
    padded.push(...cells);
    while (padded.length % 7 !== 0) padded.push(null);
    const out: (HeatmapCell | null)[][] = [];
    for (let i = 0; i < padded.length; i += 7) {
      out.push(padded.slice(i, i + 7));
    }
    return out;
  }, [cells]);

  const monthLabels = useMemo(() => {
    if (!showMonthLabels) return [];
    return weeks.map((week, idx) => {
      const firstCell = week.find((c) => c !== null) as HeatmapCell | undefined;
      if (!firstCell) return '';
      const d = parseDateKey(firstCell.dateKey);
      if (idx === 0 || d.date() <= 7) return d.format('MMM');
      return '';
    });
  }, [weeks, showMonthLabels]);

  // Auto-scroll para o final (dias mais recentes)
  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    }, 50);
    return () => clearTimeout(t);
  }, [weeks.length]);

  const todayKey = toDateKey(dayjs());

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.wrapper}>
        {showMonthLabels && (
          <View style={styles.monthRow}>
            {monthLabels.map((label, idx) => (
              <View key={idx} style={[styles.monthCell, { width: CELL + GAP }]}>
                <Text variant="caption" color={colors.textMuted}>
                  {label}
                </Text>
              </View>
            ))}
          </View>
        )}
        <View style={styles.grid}>
          {weeks.map((week, wIdx) => (
            <View key={wIdx} style={styles.column}>
              {week.map((cell, dIdx) => {
                if (!cell) {
                  return <View key={dIdx} style={[styles.cell, { backgroundColor: 'transparent' }]} />;
                }
                const isToday = cell.dateKey === todayKey;
                const bg =
                  cell.intensity === 0
                    ? colors.surfaceAlt
                    : hexWithAlpha(baseColor, intensityToOpacity(cell.intensity));
                const node = (
                  <View
                    style={[
                      styles.cell,
                      {
                        backgroundColor: bg,
                        borderColor: isToday ? colors.text : 'transparent',
                        borderWidth: isToday ? 1 : 0,
                      },
                    ]}
                  />
                );
                if (onCellPress) {
                  return (
                    <Pressable
                      key={dIdx}
                      onPress={() => onCellPress(cell)}
                      hitSlop={2}
                      accessibilityLabel={`Dia ${cell.dateKey}`}
                    >
                      {node}
                    </Pressable>
                  );
                }
                return <React.Fragment key={dIdx}>{node}</React.Fragment>;
              })}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingVertical: spacing.xs },
  monthRow: { flexDirection: 'row', marginBottom: 2 },
  monthCell: { height: 14 },
  grid: { flexDirection: 'row', gap: GAP },
  column: { gap: GAP },
  cell: { width: CELL, height: CELL, borderRadius: RADIUS },
});
