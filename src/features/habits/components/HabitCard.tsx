import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card, Text } from '@/components';
import { useColors } from '@/theme/useColors';
import { radii, spacing } from '@/theme';
import { resolveHabitBg, resolveHabitColor, resolveHabitIcon } from '../constants';
import type { HabitWithTodayLog } from '../types';
import { useToggleHabitToday } from '../mutations';

type Props = {
  item: HabitWithTodayLog;
  onPress?: (item: HabitWithTodayLog) => void;
};

const FREQ_LABEL: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
};

export function HabitCard({ item, onPress }: Props) {
  const colors = useColors();
  const toggle = useToggleHabitToday();
  const habit = item.habit;
  const tint = resolveHabitColor(habit.color);
  const tintBg = resolveHabitBg(habit.color);
  const iconName = resolveHabitIcon(habit.icon);

  const onToggle = () => {
    if (toggle.isPending) return;
    toggle.mutate({ habitLocalId: habit.localId });
  };

  const pending = habit.syncStatus !== 'synced';

  return (
    <Card onPress={() => onPress?.(item)} padding="md">
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: tintBg }]}>
          <Feather
            name={iconName as React.ComponentProps<typeof Feather>['name']}
            size={22}
            color={tint}
          />
        </View>
        <View style={styles.body}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {habit.title}
          </Text>
          <Text variant="caption" color={colors.textMuted}>
            {FREQ_LABEL[habit.frequencyType] ?? habit.frequencyType}
            {habit.targetValue > 1 ? ` · meta ${habit.targetValue}` : ''}
            {pending ? ' · pendente' : ''}
          </Text>
        </View>
        <Pressable
          onPress={onToggle}
          disabled={toggle.isPending}
          style={[
            styles.toggle,
            {
              backgroundColor: item.completedToday ? tint : 'transparent',
              borderColor: tint,
            },
          ]}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={item.completedToday ? 'Desmarcar conclusão' : 'Marcar como concluído'}
          accessibilityState={{ checked: item.completedToday }}
        >
          <Feather
            name="check"
            size={20}
            color={item.completedToday ? '#fff' : tint}
          />
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  toggle: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
