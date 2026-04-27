import { apiClient, safeJson } from '../client';
import {
  habitLogListSchema,
  habitLogSchema,
  type CreateHabitLogPayload,
  type HabitLogDto,
  type UpdateHabitLogPayload,
} from '../dto';

type ListParams =
  | { updatedSince: string }
  | { from?: string; to?: string }
  | undefined;

function buildQuery(params: ListParams): Record<string, string> {
  if (!params) return {};
  if ('updatedSince' in params) return { updatedSince: params.updatedSince };
  const q: Record<string, string> = {};
  if (params.from) q.from = params.from;
  if (params.to) q.to = params.to;
  return q;
}

export async function listHabitLogs(habitId: string, params?: ListParams): Promise<HabitLogDto[]> {
  const data = await safeJson<unknown>(
    apiClient.get(`habits/${habitId}/logs`, { searchParams: buildQuery(params) })
  );
  return habitLogListSchema.parse(data);
}

export async function createHabitLog(
  habitId: string,
  payload: CreateHabitLogPayload
): Promise<HabitLogDto> {
  const data = await safeJson<unknown>(
    apiClient.post(`habits/${habitId}/logs`, { json: payload })
  );
  return habitLogSchema.parse(data);
}

export async function updateHabitLog(
  habitId: string,
  logId: string,
  payload: UpdateHabitLogPayload
): Promise<HabitLogDto> {
  const data = await safeJson<unknown>(
    apiClient.put(`habits/${habitId}/logs/${logId}`, { json: payload })
  );
  return habitLogSchema.parse(data);
}

export async function deleteHabitLog(habitId: string, logId: string): Promise<void> {
  await apiClient.delete(`habits/${habitId}/logs/${logId}`);
}
