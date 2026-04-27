import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/theme/useColors';
import { radii, spacing } from '@/theme';
import { FEATHER_ICON_OPTIONS, type HabitIcon } from '../constants';

type Props = {
  value: string;
  onChange: (icon: HabitIcon) => void;
  tint?: string;
};

export function IconPickerGrid({ value, onChange, tint }: Props) {
  const colors = useColors();
  const accent = tint ?? colors.primary;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {FEATHER_ICON_OPTIONS.map((icon) => {
        const active = icon === value;
        return (
          <Pressable
            key={icon}
            onPress={() => onChange(icon)}
            style={[
              styles.cell,
              {
                backgroundColor: active ? accent : colors.surfaceAlt,
                borderColor: active ? accent : colors.border,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            hitSlop={4}
          >
            <Feather
              name={icon as React.ComponentProps<typeof Feather>['name']}
              size={18}
              color={active ? '#fff' : colors.text}
            />
          </Pressable>
        );
      })}
      <View style={{ width: spacing.sm }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: 2,
  },
  cell: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
