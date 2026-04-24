import React, { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/theme/useColors';
import { radii, spacing, typography } from '@/theme';
import { Text } from './Text';

type Props = TextInputProps & {
  label?: string;
  helper?: string;
  error?: string | undefined;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  showPasswordToggle?: boolean;
};

export const TextField = forwardRef<TextInput, Props>(
  ({ label, helper, error, leadingIcon, trailingIcon, containerStyle, onFocus, onBlur, style, showPasswordToggle, secureTextEntry, ...rest }, ref) => {
    const colors = useColors();
    const [focused, setFocused] = useState(false);
    const [visible, setVisible] = useState(false);
    const hasError = !!error;

    const resolvedSecure = secureTextEntry && !visible;
    const trailing = showPasswordToggle && secureTextEntry ? (
      <Pressable onPress={() => setVisible(v => !v)} hitSlop={8}>
        <Feather name={visible ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
      </Pressable>
    ) : trailingIcon;

    return (
      <View style={[styles.wrapper, containerStyle]}>
        {label && (
          <Text variant="smallMedium" color={colors.text} style={styles.label}>
            {label}
          </Text>
        )}
        <View
          style={[
            styles.field,
            {
              backgroundColor: colors.surface,
              borderColor: hasError ? colors.error : focused ? colors.primary : colors.border,
            },
          ]}
        >
          {leadingIcon && <View style={styles.iconLeft}>{leadingIcon}</View>}
          <TextInput
            ref={ref}
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.text }, style]}
            secureTextEntry={resolvedSecure}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            {...rest}
          />
          {trailing && <View style={styles.iconRight}>{trailing}</View>}
        </View>
        {hasError ? (
          <Text variant="small" color={colors.error} style={styles.helper}>
            {error}
          </Text>
        ) : helper ? (
          <Text variant="small" color={colors.textMuted} style={styles.helper}>
            {helper}
          </Text>
        ) : null}
      </View>
    );
  }
);

TextField.displayName = 'TextField';

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: { marginBottom: 2 },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    minHeight: 48,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontFamily: typography.body.fontFamily,
    fontSize: typography.body.fontSize,
  },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
  helper: { marginTop: 2 },
});
