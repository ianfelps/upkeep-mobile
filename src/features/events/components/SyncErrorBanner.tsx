import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Banner } from '@/components';
import { countWithSyncError } from '@/db/repositories/routineEvents';
import { syncEngine } from '@/sync/syncEngine';

export function SyncErrorBanner() {
  const query = useQuery({
    queryKey: ['events', 'syncErrorCount'],
    queryFn: countWithSyncError,
    staleTime: 5_000,
  });

  useEffect(() => {
    return syncEngine.onResult(() => {
      query.refetch();
    });
  }, [query]);

  const count = query.data ?? 0;
  if (count === 0) return null;

  return (
    <Banner
      tone="error"
      title={count === 1 ? '1 evento com erro de sincronização' : `${count} eventos com erro de sincronização`}
      message="Algumas alterações não foram enviadas ao servidor. Tentaremos novamente."
    />
  );
}
