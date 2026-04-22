import { EmptyState, Screen } from '@/components';

export default function ProgressoRoute() {
  return (
    <Screen padded>
      <EmptyState
        icon="trending-up"
        title="Em breve"
        subtitle="Aqui você acompanhará sua evolução com gráficos e métricas."
        style={{ flex: 1 }}
      />
    </Screen>
  );
}
