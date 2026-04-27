import { apiClient, safeJson } from '../client';
import {
  habitListSchema,
  habitSchema,
  type CreateHabitPayload,
  type HabitDto,
  type UpdateHabitPayload,
} from '../dto';

type ListParams = { updatedSince?: string } | undefined;

export async function listHabits(params?: ListParams): Promise<HabitDto[]> {
  const searchParams: Record<string, string> = {};
  if (params?.updatedSince) searchParams.updatedSince = params.updatedSince;
  const data = await safeJson<unknown>(apiClient.get('habits', { searchParams }));
  return habitListSchema.parse(data);
}

export async function getHabit(id: string): Promise<HabitDto> {
  const data = await safeJson<unknown>(apiClient.get(`habits/${id}`));
  return habitSchema.parse(data);
}

export async function createHabit(payload: CreateHabitPayload): Promise<HabitDto> {
  const data = await safeJson<unknown>(apiClient.post('habits', { json: payload }));
  return habitSchema.parse(data);
}

export async function updateHabit(id: string, payload: UpdateHabitPayload): Promise<HabitDto> {
  const data = await safeJson<unknown>(apiClient.put(`habits/${id}`, { json: payload }));
  return habitSchema.parse(data);
}

export async function deleteHabit(id: string): Promise<void> {
  await apiClient.delete(`habits/${id}`);
}
