import React from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { useColors } from '@/theme/useColors';
import { radii, spacing } from '@/theme';
import { Text } from './Text';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'primary';
  style?: ViewStyle;
  disabled?: boolean;
};

export function Chip({ label, selected, onPress, tone = 'primary', style, disabled }: Props) {
  const colors = useColors();

  const bg = selected
    ? tone === 'primary'
      ? colors.primary
      : colors.text
    : colors.surfaceAlt;
  const fg = selected
    ? tone === 'primary'
      ? colors.primaryContrast
      : colors.textInverse
    : colors.text;
  const border = selected ? bg : colors.border;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: bg, borderColor: border },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected, disabled: !!disabled }}
    >
      <Text variant="smallMedium" color={fg}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    minHeight: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.4 },
});
