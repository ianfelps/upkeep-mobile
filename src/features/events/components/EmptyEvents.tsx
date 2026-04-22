import React from 'react';
import { EmptyState } from '@/components';

export function EmptyEvents({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <EmptyState
        icon="calendar"
        title="Sem eventos neste dia"
        subtitle=""
      />
    );
  }
  return (
    <EmptyState
      icon="calendar"
      title="Nenhum evento neste período"
      subtitle="Toque no botão + para criar um evento ou ajuste o filtro acima."
      style={{ flex: 1 }}
    />
  );
}
