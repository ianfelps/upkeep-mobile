import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { colors, radii, shadows, spacing } from '@/theme';
import { Text } from './Text';

export type ToastTone = 'success' | 'error' | 'info';

type ToastItem = { id: number; message: string; tone: ToastTone };

type Listener = (item: ToastItem) => void;

let listener: Listener | null = null;
let idCounter = 0;

export const toast = {
  success(message: string) {
    listener?.({ id: ++idCounter, message, tone: 'success' });
  },
  error(message: string) {
    listener?.({ id: ++idCounter, message, tone: 'error' });
  },
  info(message: string) {
    listener?.({ id: ++idCounter, message, tone: 'info' });
  },
};

const toneMap: Record<ToastTone, { bg: string; fg: string; icon: keyof typeof Feather.glyphMap }> = {
  success: { bg: colors.success, fg: '#FFFFFF', icon: 'check-circle' },
  error: { bg: colors.error, fg: '#FFFFFF', icon: 'alert-octagon' },
  info: { bg: colors.text, fg: '#FFFFFF', icon: 'info' },
};

export function ToastHost() {
  const [current, setCurrent] = useState<ToastItem | null>(null);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    opacity.value = withTiming(0, { duration: 180 });
    translateY.value = withTiming(20, { duration: 180 });
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCurrent(null), 200);
  }, [opacity, translateY]);

  useEffect(() => {
    listener = (item) => {
      setCurrent(item);
      opacity.value = withTiming(1, { duration: 180 });
      translateY.value = withTiming(0, { duration: 220 });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(dismiss, 2600);
    };
    return () => {
      listener = null;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!current) return null;
  const palette = toneMap[current.tone];

  return (
    <Animated.View pointerEvents="none" style={[styles.wrapper, style]}>
      <View style={[styles.toast, { backgroundColor: palette.bg }]}>
        <Feather name={palette.icon} size={18} color={palette.fg} />
        <Text variant="bodyMedium" color={palette.fg} style={{ flex: 1 }}>
          {current.message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: spacing.base,
    right: spacing.base,
    bottom: spacing.xl,
    alignItems: 'center',
    zIndex: 1000,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.base,
    borderRadius: radii.md,
    maxWidth: 560,
    width: '100%',
    ...shadows.elevation2,
  },
});
