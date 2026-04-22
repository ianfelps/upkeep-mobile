import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';
import { Text } from './Text';

type Props = {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  style?: ViewStyle;
};

export function EmptyState({ icon = 'inbox', title, subtitle, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconWrapper}>
        <Feather name={icon} size={28} color={colors.textMuted} />
      </View>
      <Text variant="h2" align="center" style={styles.title}>
        {title}
      </Text>
      {subtitle && (
        <Text variant="body" color={colors.textMuted} align="center">
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: { marginTop: spacing.xs },
});
