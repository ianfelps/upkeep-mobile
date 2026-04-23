import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Text } from '@/components';
import { colors } from '@/theme';
import { dayjs } from '@/utils/date';
import type { EventOccurrence } from '../types';
import { todayKey } from '../selectors';
import { HOUR_HEIGHT, TimelineEventBlock } from './TimelineEventBlock';

const TIME_COL_WIDTH = 56;
const RIGHT_PAD = 8;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TOTAL_HEIGHT = HOUR_HEIGHT * 24;
const MIN_DURATION_MIN = 45;
const SWIPE_THRESHOLD = 50;

function timeToMinutes(time: string): number {
  const parts = time.split(':');
  return parseInt(parts[0] ?? '0', 10) * 60 + parseInt(parts[1] ?? '0', 10);
}

type LayoutItem = {
  occ: EventOccurrence;
  startMin: number;
  endMin: number;
  col: number;
  totalCols: number;
};

function layoutEvents(occs: EventOccurrence[]): LayoutItem[] {
  if (occs.length === 0) return [];

  const items: LayoutItem[] = occs.map(occ => ({
    occ,
    startMin: timeToMinutes(occ.startTime),
    endMin: occ.endTime
      ? timeToMinutes(occ.endTime)
      : timeToMinutes(occ.startTime) + MIN_DURATION_MIN,
    col: 0,
    totalCols: 1,
  }));

  items.sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  const laneEnds: number[] = [];
  for (const item of items) {
    let lane = laneEnds.findIndex(end => end <= item.startMin);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.endMin);
    } else {
      laneEnds[lane] = item.endMin;
    }
    item.col = lane;
  }

  for (const item of items) {
    let maxCol = item.col;
    for (const other of items) {
      if (other === item) continue;
      if (other.startMin < item.endMin && other.endMin > item.startMin) {
        maxCol = Math.max(maxCol, other.col);
      }
    }
    item.totalCols = maxCol + 1;
  }

  return items;
}

function getNowMinutes(): number {
  const n = dayjs();
  return n.hour() * 60 + n.minute();
}

type Props = {
  occurrences: EventOccurrence[];
  dateKey: string;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onEventPress?: (occ: EventOccurrence) => void;
};

function initialScrollY(dateKey: string): number {
  const targetMin = dateKey === todayKey() ? getNowMinutes() : 8 * 60;
  return Math.max(0, (targetMin / 60) * HOUR_HEIGHT - 200);
}

export function TimelineView({ occurrences, dateKey, onSwipeLeft, onSwipeRight, onEventPress }: Props) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [nowMin, setNowMin] = useState(getNowMinutes);
  const isToday = dateKey === todayKey();
  const eventsWidth = width - TIME_COL_WIDTH - RIGHT_PAD;
  const [startY] = useState(() => initialScrollY(dateKey));

  useEffect(() => {
    const targetMin = isToday ? nowMin : 8 * 60;
    const y = Math.max(0, (targetMin / 60) * HOUR_HEIGHT - 200);
    const t = setTimeout(() => scrollRef.current?.scrollTo({ y, animated: false }), 80);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  useEffect(() => {
    if (!isToday) return;
    const id = setInterval(() => setNowMin(getNowMinutes()), 60_000);
    return () => clearInterval(id);
  }, [isToday]);

  const layoutItems = layoutEvents(occurrences);
  const nowTop = (nowMin / 60) * HOUR_HEIGHT;

  const pan = Gesture.Pan()
    .activeOffsetX([-40, 40])
    .failOffsetY([-15, 15])
    .runOnJS(true)
    .onEnd(e => {
      if (Math.abs(e.translationX) < SWIPE_THRESHOLD) return;
      if (e.translationX < 0) onSwipeLeft();
      else onSwipeRight();
    });

  return (
    <GestureDetector gesture={pan}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        contentOffset={{ x: 0, y: startY }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <View style={styles.canvas}>
          {HOURS.map(hour => (
            <View key={hour} style={[styles.hourRow, { top: hour * HOUR_HEIGHT }]}>
              <Text variant="caption" color={colors.textMuted} style={styles.hourLabel}>
                {String(hour).padStart(2, '0')}:00
              </Text>
              <View style={styles.hourLine} />
            </View>
          ))}

          {layoutItems.map(item => (
            <TimelineEventBlock
              key={item.occ.id}
              occurrence={item.occ}
              startMin={item.startMin}
              endMin={item.endMin}
              col={item.col}
              totalCols={item.totalCols}
              leftOffset={TIME_COL_WIDTH}
              availableWidth={eventsWidth}
              onPress={onEventPress}
            />
          ))}

          {isToday && (
            <View style={[styles.nowLine, { top: nowTop }]} pointerEvents="none">
              <View style={styles.nowDot} />
              <View style={styles.nowBar} />
            </View>
          )}
        </View>
      </ScrollView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 96 },
  canvas: {
    height: TOTAL_HEIGHT,
  },
  hourRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  hourLabel: {
    width: TIME_COL_WIDTH,
    paddingLeft: 8,
    textAlign: 'right',
    paddingRight: 8,
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  nowLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  nowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: TIME_COL_WIDTH - 5,
  },
  nowBar: {
    flex: 1,
    height: 2,
    backgroundColor: colors.primary,
  },
});
