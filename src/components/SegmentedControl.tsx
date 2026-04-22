import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radii, spacing } from '@/theme';
import { Text } from './Text';

type Props<T extends string> = {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const [trackWidth, setTrackWidth] = React.useState(0);
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const translateX = useSharedValue(0);
  const segWidth = trackWidth > 0 ? trackWidth / options.length : 0;

  React.useEffect(() => {
    translateX.value = withSpring(index * segWidth, {
      damping: 20,
      stiffness: 220,
      mass: 0.6,
    });
  }, [index, segWidth, translateX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    width: segWidth,
  }));

  return (
    <View
      style={styles.track}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width - 4)}
    >
      {trackWidth > 0 && <Animated.View style={[styles.thumb, thumbStyle]} />}
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={styles.segment}
            onPress={() => onChange(opt.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text
              variant="smallMedium"
              color={active ? colors.text : colors.textMuted}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.md,
    padding: 2,
    position: 'relative',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    zIndex: 2,
  },
  thumb: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 2,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    zIndex: 1,
  },
});
