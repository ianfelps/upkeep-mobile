import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Text } from '@/components';
import { useColors } from '@/theme/useColors';
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
  const colors = useColors();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [nowMin, setNowMin] = useState(getNowMinutes);
  const isToday = dateKey === todayKey();
  const eventsWidth = width - TIME_COL_WIDTH - RIGHT_PAD;
  const [startY] = useState(() => initialScrollY(dateKey));
  const translateX = useSharedValue(0);
  const prevDateKey = useRef(dateKey);
  const pendingEnter = useRef<-1 | 1 | 0>(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const easeOut = Easing.out(Easing.cubic);

  useEffect(() => {
    if (prevDateKey.current === dateKey) return;
    prevDateKey.current = dateKey;
    const dir = pendingEnter.current;
    pendingEnter.current = 0;
    if (dir === 0) {
      translateX.value = 0;
      return;
    }
    translateX.value = dir * width;
    translateX.value = withTiming(0, { duration: 240, easing: easeOut });
  }, [dateKey, width, translateX, easeOut]);

  const animateSwap = (direction: -1 | 1, cb: () => void) => {
    pendingEnter.current = (-direction) as -1 | 1;
    translateX.value = withTiming(
      direction * width,
      { duration: 200, easing: easeOut },
      (finished) => {
        if (finished) runOnJS(cb)();
      },
    );
  };

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
    .onUpdate(e => {
      translateX.value = e.translationX;
    })
    .onEnd(e => {
      const past = Math.abs(e.translationX) > SWIPE_THRESHOLD || Math.abs(e.velocityX) > 600;
      if (!past) {
        translateX.value = withTiming(0, { duration: 220, easing: easeOut });
        return;
      }
      const dir: -1 | 1 = e.translationX < 0 ? -1 : 1;
      animateSwap(dir, dir < 0 ? onSwipeLeft : onSwipeRight);
    });

  return (
    <GestureDetector gesture={pan}>
      <Animated.ScrollView
        ref={scrollRef as never}
        style={[styles.scroll, animatedStyle]}
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
              <View style={[styles.hourLine, { backgroundColor: colors.border }]} />
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
              <View style={[styles.nowDot, { backgroundColor: colors.primary }]} />
              <View style={[styles.nowBar, { backgroundColor: colors.primary }]} />
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: 30, paddingTop: 30 },
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
    paddingLeft: 6,
    textAlign: 'right',
    paddingRight: 6,
  },
  hourLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
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
    marginLeft: TIME_COL_WIDTH - 5,
  },
  nowBar: {
    flex: 1,
    height: 2,
  },
});
