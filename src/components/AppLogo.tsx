import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { colors, radii } from '@/theme';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { box: number; icon: number; radius: number }> = {
  sm: { box: 44, icon: 22, radius: 12 },
  md: { box: 64, icon: 32, radius: 16 },
  lg: { box: 88, icon: 44, radius: 22 },
};

type Props = { size?: Size };

export function AppLogo({ size = 'md' }: Props) {
  const { box, icon, radius } = SIZES[size];
  return (
    <View style={[styles.box, { width: box, height: box, borderRadius: radius }]}>
      <Octicons name="sparkle" size={icon} color={colors.primaryContrast} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
