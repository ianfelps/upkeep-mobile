import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components';
import { colors, radii, spacing } from '@/theme';
import { formatTime } from '@/utils/date';
import { resolveEventColor } from '../constants';
import type { EventOccurrence } from '../types';

type Props = {
  occurrence: EventOccurrence;
  onPress?: (occurrence: EventOccurrence) => void;
};

export function EventRow({ occurrence, onPress }: Props) {
  const dotColor = resolveEventColor(occurrence.source.color);
  const pending = occurrence.source.syncStatus !== 'synced';

  return (
    <Pressable
      onPress={() => onPress?.(occurrence)}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${occurrence.title}, ${formatTime(occurrence.startTime)}`}
    >
      <View style={styles.timeCol}>
        <Text variant="bodyMedium">{formatTime(occurrence.startTime)}</Text>
        {occurrence.endTime && (
          <Text variant="caption" color={colors.textMuted}>
            {formatTime(occurrence.endTime)}
          </Text>
        )}
      </View>

      <View style={[styles.dot, { backgroundColor: dotColor }]} />

      <View style={styles.body}>
        <Text variant="bodyMedium" numberOfLines={1}>
          {occurrence.title}
        </Text>
        {occurrence.description ? (
          <Text variant="small" color={colors.textMuted} numberOfLines={2}>
            {occurrence.description}
          </Text>
        ) : null}
        {pending && (
          <Text variant="caption" color={colors.warn}>
            Aguardando sincronização
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.base,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  timeCol: {
    width: 56,
    alignItems: 'flex-start',
    gap: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  body: { flex: 1, gap: 2 },
});
