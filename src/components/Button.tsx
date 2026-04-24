import React, { forwardRef } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { useColors } from '@/theme/useColors';
import { radii, spacing, typography } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'ghost' | 'destructive' | 'link';
type Size = 'md' | 'lg';

type Props = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
};

export const Button = forwardRef<React.ComponentRef<typeof Pressable>, Props>((
  {
    label,
    variant = 'primary',
    size = 'md',
    loading,
    leadingIcon,
    trailingIcon,
    style,
    fullWidth,
    disabled,
    ...rest
  },
  ref
) => {
  const colors = useColors();
  const isDisabled = disabled || loading;

  const variantStyles = {
    primary: {
      container: { backgroundColor: colors.primary },
      pressed: { backgroundColor: colors.primaryDark },
      text: { color: colors.primaryContrast, fontFamily: typography.bodyMedium.fontFamily },
    },
    ghost: {
      container: { backgroundColor: 'transparent' as const, borderWidth: 1, borderColor: colors.border },
      pressed: { backgroundColor: colors.surfaceAlt },
      text: { color: colors.text, fontFamily: typography.bodyMedium.fontFamily },
    },
    destructive: {
      container: { backgroundColor: colors.error },
      pressed: { backgroundColor: '#B91C1C' },
      text: { color: '#FFFFFF', fontFamily: typography.bodyMedium.fontFamily },
    },
    link: {
      container: { backgroundColor: 'transparent' as const, minHeight: 0 as const, paddingVertical: 4 },
      pressed: { opacity: 0.6 },
      text: { color: colors.primary, fontFamily: typography.bodyMedium.fontFamily },
    },
  } as const;

  return (
    <Pressable
      ref={ref}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        size === 'lg' ? styles.sizeLg : styles.sizeMd,
        variantStyles[variant].container,
        fullWidth && styles.fullWidth,
        pressed && !isDisabled && variantStyles[variant].pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      hitSlop={8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles[variant].text.color} size="small" />
      ) : (
        <View style={styles.content}>
          {leadingIcon}
          <Text variant="bodyMedium" style={variantStyles[variant].text}>
            {label}
          </Text>
          {trailingIcon}
        </View>
      )}
    </Pressable>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  sizeMd: {
    paddingVertical: 10,
    paddingHorizontal: spacing.base,
    minHeight: 44,
  },
  sizeLg: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.5 },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
