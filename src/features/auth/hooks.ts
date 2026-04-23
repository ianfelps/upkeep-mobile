import { useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  loginUser,
  logoutSession,
  refreshSession,
  registerUser,
} from '@/api/endpoints/auth';
import { fetchMe } from '@/api/endpoints/users';
import { tokenStorage } from '@/utils/secureStore';
import * as events from '@/db/repositories/routineEvents';
import { kvDelete } from '@/db/repositories/kv';
import { cancelAllEventNotifications } from '@/notifications/scheduler';
import { useAuthStore } from './store';

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: loginUser,
    onSuccess: async (data) => {
      await tokenStorage.setRefreshToken(data.refreshToken);
      setSession({ user: data.user, accessToken: data.token });
    },
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: registerUser,
    onSuccess: async (data) => {
      await tokenStorage.setRefreshToken(data.refreshToken);
      setSession({ user: data.user, accessToken: data.token });
    },
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  return useMutation({
    mutationFn: async () => {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        await logoutSession(refreshToken).catch(() => {
          // best-effort: seguimos limpando mesmo se a API falhar
        });
      }
    },
    onSettled: async () => {
      await tokenStorage.clearRefreshToken();
      await events.wipeAll().catch(() => {});
      await cancelAllEventNotifications().catch(() => {});
      await kvDelete('sync.lastPulledAt').catch(() => {});
      await kvDelete('sync.lastFullReconcileAt').catch(() => {});
      await kvDelete('auth.userId').catch(() => {});
      clearSession();
    },
  });
}

export function useBootstrapSession() {
  const setStatus = useAuthStore((s) => s.setStatus);
  const setSession = useAuthStore((s) => s.setSession);
  const clearSession = useAuthStore((s) => s.clearSession);

  const run = useCallback(async () => {
    setStatus('loading');
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      clearSession();
      return;
    }
    try {
      const refreshed = await refreshSession(refreshToken);
      await tokenStorage.setRefreshToken(refreshed.refreshToken);
      // Opcional: força uma busca de /users/me para sincronizar dados frescos.
      let user = refreshed.user;
      try {
        user = await fetchMe();
      } catch {
        // se falhar, usa o user do refresh
      }
      setSession({ user, accessToken: refreshed.token });
    } catch {
      await tokenStorage.clearRefreshToken();
      clearSession();
    }
  }, [clearSession, setSession, setStatus]);

  useEffect(() => {
    void run();
  }, [run]);

  return run;
}
