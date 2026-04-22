import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Banner } from '@/components';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setOffline(!online);
    });
    NetInfo.fetch().then((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setOffline(!online);
    });
    return unsub;
  }, []);

  if (!offline) return null;
  return (
    <Banner
      tone="warn"
      icon="wifi-off"
      title="Sem conexão"
      message="Suas alterações serão sincronizadas quando voltar online."
    />
  );
}
