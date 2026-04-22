import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SegmentedControl, Text } from '@/components';
import { colors, radii, spacing } from '@/theme';
import { capitalize } from '@/utils/date';
import type { EventFilter } from '../types';
import { formatRangeLabel, shiftAnchor, todayKey } from '../selectors';

const options: { value: EventFilter; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'threeDays', label: '3 Dias' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
];

type Props = {
  filter: EventFilter;
  onFilterChange: (filter: EventFilter) => void;
  anchorKey: string;
  onAnchorChange: (anchorKey: string) => void;
};

export function FilterBar({ filter, onFilterChange, anchorKey, onAnchorChange }: Props) {
  const label = capitalize(formatRangeLabel(filter, anchorKey));
  const isToday = anchorKey === todayKey();

  return (
    <View style={styles.wrapper}>
      <SegmentedControl options={options} value={filter} onChange={onFilterChange} />
      <View style={styles.row}>
        <Pressable
          onPress={() => onAnchorChange(shiftAnchor(filter, anchorKey, -1))}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Período anterior"
          hitSlop={10}
        >
          <Feather name="chevron-left" size={20} color={colors.text} />
        </Pressable>

        <Pressable
          style={styles.center}
          onPress={() => onAnchorChange(todayKey())}
          accessibilityRole="button"
          accessibilityLabel="Voltar para hoje"
          hitSlop={10}
        >
          <Text variant="bodyMedium">{label}</Text>
          {!isToday && (
            <Text variant="caption" color={colors.primary}>
              Toque para ir a hoje
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => onAnchorChange(shiftAnchor(filter, anchorKey, 1))}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Próximo período"
          hitSlop={10}
        >
          <Feather name="chevron-right" size={20} color={colors.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
});
