import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/theme/useColors';
import { radii, spacing } from '@/theme';
import { HABIT_COLORS, type HabitColor } from '../constants';

type Props = {
  value: string;
  onChange: (color: HabitColor) => void;
};

export function ColorSwatchPicker({ value, onChange }: Props) {
  const colors = useColors();
  return (
    <View style={styles.row}>
      {HABIT_COLORS.map((c) => {
        const active = value === c;
        return (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            style={[
              styles.swatch,
              { backgroundColor: c },
              active && [styles.active, { borderColor: colors.text }],
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
          >
            {active && <Feather name="check" size={14} color="#fff" />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  active: {
    borderWidth: 3,
  },
});
