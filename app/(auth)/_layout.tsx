import { Redirect, Stack } from 'expo-router';
import { useColors } from '@/theme/useColors';
import { useAuthStore } from '@/features/auth/store';

export default function AuthLayout() {
  const colors = useColors();
  const status = useAuthStore((s) => s.status);

  if (status === 'authenticated') {
    return <Redirect href="/(tabs)/eventos" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    />
  );
}
