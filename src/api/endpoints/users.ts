import { apiClient, safeJson } from '../client';
import { userSchema, type UserDto } from '../dto';

export async function fetchMe(): Promise<UserDto> {
  const data = await safeJson<unknown>(apiClient.get('users/me'));
  return userSchema.parse(data);
}

export async function updateMe(payload: { name: string; email: string }): Promise<UserDto> {
  const data = await safeJson<unknown>(apiClient.put('users/me', { json: payload }));
  return userSchema.parse(data);
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiClient.patch('users/me/password', { json: payload });
}

export async function deleteMe(): Promise<void> {
  await apiClient.delete('users/me');
}
