import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Text } from '@/components';
import { useColors } from '@/theme/useColors';
import { radii, spacing } from '@/theme';
import type { LocalHabit } from '@/db/repositories/habits';
import { resolveHabitBg, resolveHabitColor, resolveHabitIcon } from '../constants';
import type { HabitStats } from '../types';

const FREQ_LABEL: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

export function HabitDetailHeader({
  habit,
  stats,
}: {
  habit: LocalHabit;
  stats: HabitStats;
}) {
  const colors = useColors();
  const tint = resolveHabitColor(habit.color);
  const tintBg = resolveHabitBg(habit.color);
  const iconName = resolveHabitIcon(habit.icon);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: tintBg }]}>
          <Feather
            name={iconName as React.ComponentProps<typeof Feather>['name']}
            size={32}
            color={tint}
          />
        </View>
        <View style={styles.body}>
          <Text variant="h2">{habit.title}</Text>
          <Text variant="caption" color={colors.textMuted}>
            {FREQ_LABEL[habit.frequencyType] ?? habit.frequencyType}
            {habit.targetValue > 1 ? ` · meta ${habit.targetValue}` : ''}
          </Text>
        </View>
      </View>
      {habit.description ? (
        <Text variant="body" color={colors.textMuted}>
          {habit.description}
        </Text>
      ) : null}
      <View style={styles.statsRow}>
        <Stat label="Sequência" value={`${stats.currentStreak}d`} />
        <Stat label="Recorde" value={`${stats.longestStreak}d`} />
        <Stat label="Total" value={`${stats.totalCompleted}`} />
        <Stat label="30d" value={`${Math.round(stats.completionRate30d * 100)}%`} />
      </View>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[styles.stat, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
      <Text variant="bodyMedium">{value}</Text>
      <Text variant="caption" color={colors.textMuted}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stat: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
});
