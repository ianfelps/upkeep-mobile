import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components';
import { colors, radii } from '@/theme';
import { formatTime } from '@/utils/date';
import { resolveEventBg, resolveEventColor } from '../constants';
import type { EventOccurrence } from '../types';

export const HOUR_HEIGHT = 64;
const MIN_DURATION_MIN = 45;
const BLOCK_GAP = 2;

type Props = {
  occurrence: EventOccurrence;
  startMin: number;
  endMin: number;
  col: number;
  totalCols: number;
  leftOffset: number;
  availableWidth: number;
  onPress?: (occ: EventOccurrence) => void;
};

export function TimelineEventBlock({
  occurrence,
  startMin,
  endMin,
  col,
  totalCols,
  leftOffset,
  availableWidth,
  onPress,
}: Props) {
  const duration = Math.max(endMin - startMin, MIN_DURATION_MIN);
  const top = (startMin / 60) * HOUR_HEIGHT;
  const height = (duration / 60) * HOUR_HEIGHT;

  const colWidth = availableWidth / totalCols;
  const left = leftOffset + col * colWidth + BLOCK_GAP;
  const width = colWidth - BLOCK_GAP * 2;

  const borderColor = resolveEventColor(occurrence.source.color);
  const bgColor = resolveEventBg(occurrence.source.color);

  return (
    <Pressable
      onPress={() => onPress?.(occurrence)}
      style={({ pressed }) => [
        styles.block,
        {
          top,
          height,
          left,
          width,
          borderLeftColor: borderColor,
          backgroundColor: pressed ? colors.surfaceAlt : bgColor,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${occurrence.title}, ${formatTime(occurrence.startTime)}`}
    >
      <Text variant="smallMedium" numberOfLines={height >= 48 ? 2 : 1} color={colors.text}>
        {occurrence.title}
      </Text>
      {height >= 36 && (
        <Text variant="caption" color={colors.textMuted} numberOfLines={1}>
          {formatTime(occurrence.startTime)}
          {occurrence.endTime ? ` – ${formatTime(occurrence.endTime)}` : ''}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  block: {
    position: 'absolute',
    borderRadius: radii.sm,
    borderLeftWidth: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
    overflow: 'hidden',
  },
});
