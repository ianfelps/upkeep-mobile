import React from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type ViewStyle } from 'react-native';
import { colors, radii, shadows, spacing } from '@/theme';

type Props = {
  children: React.ReactNode;
  onPress?: PressableProps['onPress'];
  style?: ViewStyle;
  padding?: keyof typeof spacing;
  elevated?: boolean;
};

export function Card({ children, onPress, style, padding = 'base', elevated = false }: Props) {
  const content = (
    <View
      style={[
        styles.card,
        { padding: spacing[padding] },
        elevated && shadows.elevation1,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => pressed && styles.pressed}
      >
        {content}
      </Pressable>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.7 },
});
