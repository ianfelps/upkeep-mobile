import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { AppLogo } from '@/components/AppLogo';
import { useColors } from '@/theme/useColors';
import { spacing } from '@/theme';
import { useAuthStore } from '@/features/auth/store';

export default function IndexRoute() {
  const colors = useColors();
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.brand}>
          <AppLogo size="lg" />
          <Text variant="display" style={styles.appName}>Upkeep</Text>
          <Text variant="body" color={colors.textMuted}>
            Organize sua rotina, um dia de cada vez.
          </Text>
        </View>
        <ActivityIndicator color={colors.primary} style={styles.indicator} />
      </View>
    );
  }

  return status === 'authenticated'
    ? <Redirect href="/(tabs)/eventos" />
    : <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.md,
  },
  appName: {
    marginTop: spacing.sm,
  },
  indicator: {
    position: 'absolute',
    bottom: 64,
  },
});
