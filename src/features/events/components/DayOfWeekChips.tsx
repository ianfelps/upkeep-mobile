import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from '@/components';
import { spacing } from '@/theme';

const DAYS: { value: number; label: string }[] = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

type Props = {
  value: number[];
  onChange: (next: number[]) => void;
};

export function DayOfWeekChips({ value, onChange }: Props) {
  const toggle = (day: number) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort((a, b) => a - b));
    }
  };

  return (
    <View style={styles.row}>
      {DAYS.map((d) => (
        <Chip
          key={d.value}
          label={d.label}
          selected={value.includes(d.value)}
          onPress={() => toggle(d.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
