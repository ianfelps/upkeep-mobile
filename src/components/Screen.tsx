import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useColors } from '@/theme/useColors';
import { spacing } from '@/theme';

type Props = {
  children: React.ReactNode;
  padded?: boolean;
  edges?: Edge[];
  style?: ViewStyle;
  background?: string;
};

export function Screen({
  children,
  padded = false,
  edges = ['top', 'left', 'right'],
  style,
  background,
}: Props) {
  const colors = useColors();
  return (
    <SafeAreaView edges={edges} style={[styles.container, { backgroundColor: background ?? colors.background }]}>
      <View style={[styles.inner, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1 },
  padded: { paddingHorizontal: spacing.base },
});
