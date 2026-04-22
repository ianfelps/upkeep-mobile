import { apiClient, safeJson } from '../client';
import { authResponseSchema, type AuthResponseDto } from '../dto';

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponseDto> {
  const data = await safeJson<unknown>(
    apiClient.post('auth/register', { json: payload })
  );
  return authResponseSchema.parse(data);
}

export async function loginUser(payload: {
  email: string;
  password: string;
}): Promise<AuthResponseDto> {
  const data = await safeJson<unknown>(apiClient.post('auth/login', { json: payload }));
  return authResponseSchema.parse(data);
}

export async function refreshSession(refreshToken: string): Promise<AuthResponseDto> {
  const data = await safeJson<unknown>(
    apiClient.post('auth/refresh', { json: { refreshToken } })
  );
  return authResponseSchema.parse(data);
}

export async function logoutSession(refreshToken: string): Promise<void> {
  await apiClient.post('auth/logout', { json: { refreshToken } });
}
