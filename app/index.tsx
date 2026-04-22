import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/theme';
import { useAuthStore } from '@/features/auth/store';

export default function IndexRoute() {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return status === 'authenticated' ? <Redirect href="/(tabs)/eventos" /> : <Redirect href="/(auth)/login" />;
}
