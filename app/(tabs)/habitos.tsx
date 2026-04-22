import { EmptyState, Screen } from '@/components';

export default function HabitosRoute() {
  return (
    <Screen padded>
      <EmptyState
        icon="repeat"
        title="Em breve"
        subtitle="O módulo de hábitos está sendo construído e chegará em uma próxima atualização."
        style={{ flex: 1 }}
      />
    </Screen>
  );
}
