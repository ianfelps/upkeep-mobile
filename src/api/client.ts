import ky, { HTTPError, type KyInstance } from 'ky';
import { router } from 'expo-router';
import { env } from '@/utils/env';
import { tokenStorage } from '@/utils/secureStore';
import { useAuthStore } from '@/features/auth/store';
import { authResponseSchema } from './dto';
import { ApiError, parseApiError } from './errors';

type RefreshResult = { accessToken: string } | null;

let refreshInFlight: Promise<RefreshResult> | null = null;
let onSessionExpired: (() => void) | null = null;

export function registerSessionExpiredHandler(cb: () => void) {
  onSessionExpired = cb;
}

function isAuthRoute(url: string): boolean {
  return url.includes('/auth/');
}

async function performRefresh(): Promise<RefreshResult> {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${env.apiBaseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const parsed = authResponseSchema.parse(data);
    await tokenStorage.setRefreshToken(parsed.refreshToken);
    useAuthStore.getState().setSession({
      user: parsed.user,
      accessToken: parsed.token,
    });
    return { accessToken: parsed.token };
  } catch {
    return null;
  }
}

function ensureRefresh(): Promise<RefreshResult> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

async function handleSessionExpired(): Promise<void> {
  useAuthStore.getState().clearSession();
  await tokenStorage.clearRefreshToken();
  onSessionExpired?.();
  try {
    router.replace('/(auth)/login');
  } catch {
    // router may not be ready during bootstrap
  }
}

export const apiClient: KyInstance = ky.create({
  prefixUrl: env.apiBaseUrl,
  timeout: 20_000,
  retry: 0,
  hooks: {
    beforeRequest: [
      (request) => {
        const url = request.url;
        if (!isAuthRoute(url)) {
          const token = useAuthStore.getState().accessToken;
          if (token) request.headers.set('Authorization', `Bearer ${token}`);
        }
        request.headers.set('Accept', 'application/json');
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status !== 401 || isAuthRoute(request.url)) return response;

        const result = await ensureRefresh();
        if (!result) {
          await handleSessionExpired();
          return response;
        }

        request.headers.set('Authorization', `Bearer ${result.accessToken}`);
        return ky(request);
      },
    ],
    beforeError: [
      async (error: HTTPError) => {
        const apiErr = await parseApiError(error.response.clone());
        (error as HTTPError & { apiError?: ApiError }).apiError = apiErr;
        error.message = apiErr.message;
        return error;
      },
    ],
  },
});

export async function safeJson<T>(promise: Promise<Response>): Promise<T> {
  try {
    const res = await promise;
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof HTTPError) {
      const attached = (err as HTTPError & { apiError?: ApiError }).apiError;
      if (attached) throw attached;
      throw await parseApiError(err.response);
    }
    throw err;
  }
}
