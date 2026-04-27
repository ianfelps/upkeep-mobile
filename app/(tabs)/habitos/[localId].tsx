import { useLocalSearchParams } from 'expo-router';
import HabitDetailScreen from '@/features/habits/screens/HabitDetailScreen';

export default function HabitDetailRoute() {
  const { localId } = useLocalSearchParams<{ localId: string }>();
  return <HabitDetailScreen localId={localId ?? ''} />;
}
