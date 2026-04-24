import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/theme/useColors';
import { shadows } from '@/theme';

type Props = {
  onPress?: () => void;
  icon?: keyof typeof Feather.glyphMap;
  accessibilityLabel?: string;
};

export function FAB({ onPress, icon = 'plus', accessibilityLabel = 'Adicionar' }: Props) {
  const colors = useColors();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => (scale.value = withSpring(0.92, { damping: 15, stiffness: 300 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 15, stiffness: 300 }))}
        style={[styles.button, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={8}
      >
        <Feather name={icon} size={24} color={colors.primaryContrast} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    ...shadows.elevation2,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
