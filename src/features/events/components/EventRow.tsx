import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components';
import { useColors } from '@/theme/useColors';
import { radii, spacing } from '@/theme';
import { formatTime } from '@/utils/date';
import { resolveEventColor } from '../constants';
import type { EventOccurrence } from '../types';
import { EventLinkedHabits } from '@/features/habits/components/EventLinkedHabits';

type Props = {
  occurrence: EventOccurrence;
  onPress?: (occurrence: EventOccurrence) => void;
};

export function EventRow({ occurrence, onPress }: Props) {
  const colors = useColors();
  const dotColor = resolveEventColor(occurrence.source.color);
  const pending = occurrence.source.syncStatus !== 'synced';

  return (
    <Pressable
      onPress={() => onPress?.(occurrence)}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
          borderColor: colors.border,
        },
      ]}
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
        <EventLinkedHabits eventRemoteId={occurrence.remoteId} dateKey={occurrence.dateKey} />
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
    borderRadius: radii.md,
    borderWidth: 1,
    gap: spacing.base,
  },
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
