import { Stack } from 'expo-router';
import { useColors } from '@/theme/useColors';

export default function HabitosLayout() {
  const colors = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
