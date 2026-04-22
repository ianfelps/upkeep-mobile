import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radii, spacing } from '@/theme';
import { Text } from './Text';

type Tone = 'info' | 'warn' | 'error' | 'success';

type Props = {
  tone?: Tone;
  title?: string;
  message: string;
  icon?: keyof typeof Feather.glyphMap;
  style?: ViewStyle;
};

const toneMap: Record<Tone, { bg: string; border: string; fg: string; icon: keyof typeof Feather.glyphMap }> = {
  info: { bg: colors.surfaceAlt, border: colors.border, fg: colors.text, icon: 'info' },
  warn: { bg: colors.warnMuted, border: colors.warn, fg: colors.warn, icon: 'alert-triangle' },
  error: { bg: colors.errorMuted, border: colors.error, fg: colors.error, icon: 'alert-octagon' },
  success: { bg: colors.successMuted, border: colors.success, fg: colors.success, icon: 'check-circle' },
};

export function Banner({ tone = 'info', title, message, icon, style }: Props) {
  const palette = toneMap[tone];
  return (
    <View
      style={[
        styles.wrapper,
        { backgroundColor: palette.bg, borderColor: palette.border },
        style,
      ]}
    >
      <Feather name={icon ?? palette.icon} size={18} color={palette.fg} />
      <View style={styles.content}>
        {title && (
          <Text variant="smallMedium" color={palette.fg}>
            {title}
          </Text>
        )}
        <Text variant="small" color={palette.fg}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  content: { flex: 1, gap: 2 },
});
