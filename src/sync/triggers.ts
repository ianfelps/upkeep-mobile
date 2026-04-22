import { AppState, type AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncEngine } from './syncEngine';
import { useAuthStore } from '@/features/auth/store';
import { logger } from '@/utils/logger';

let unsubscribeAppState: (() => void) | null = null;
let unsubscribeNetInfo: (() => void) | null = null;
let unsubscribeAuth: (() => void) | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastAppState: AppStateStatus = AppState.currentState;
let wasOnline: boolean | null = null;

export function schedulePostMutationSync(delayMs = 300): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncEngine.tick('postMutation').catch((err) => {
      logger.warn('[sync] post-mutation tick failed', { message: (err as Error).message });
    });
  }, delayMs);
}

export function registerSyncTriggers(): () => void {
  if (unsubscribeAppState || unsubscribeNetInfo || unsubscribeAuth) {
    return cleanupSyncTriggers;
  }

  const appStateSub = AppState.addEventListener('change', (state) => {
    if (lastAppState !== 'active' && state === 'active') {
      void syncEngine.tick('appForeground').catch(() => {});
    }
    lastAppState = state;
  });
  unsubscribeAppState = () => appStateSub.remove();

  const netInfoSub = NetInfo.addEventListener((state) => {
    const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
    if (wasOnline === false && isOnline) {
      void syncEngine.tick('networkOnline').catch(() => {});
    }
    wasOnline = isOnline;
  });
  unsubscribeNetInfo = netInfoSub;

  let previousStatus = useAuthStore.getState().status;
  unsubscribeAuth = useAuthStore.subscribe((state) => {
    if (previousStatus !== 'authenticated' && state.status === 'authenticated') {
      void syncEngine.tick('login').catch(() => {});
    }
    previousStatus = state.status;
  });

  return cleanupSyncTriggers;
}

export function cleanupSyncTriggers(): void {
  unsubscribeAppState?.();
  unsubscribeNetInfo?.();
  unsubscribeAuth?.();
  unsubscribeAppState = null;
  unsubscribeNetInfo = null;
  unsubscribeAuth = null;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
}
