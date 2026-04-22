import { apiClient, safeJson } from '../client';
import {
  routineEventListSchema,
  routineEventSchema,
  type CreateRoutineEventPayload,
  type RoutineEventDto,
  type UpdateRoutineEventPayload,
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

export async function listRoutineEvents(params: ListParams): Promise<RoutineEventDto[]> {
  const searchParams = buildQuery(params);
  const data = await safeJson<unknown>(
    apiClient.get('routine-events', { searchParams })
  );
  return routineEventListSchema.parse(data);
}

export async function createRoutineEvent(
  payload: CreateRoutineEventPayload
): Promise<RoutineEventDto> {
  const data = await safeJson<unknown>(
    apiClient.post('routine-events', { json: payload })
  );
  return routineEventSchema.parse(data);
}

export async function updateRoutineEvent(
  id: string,
  payload: UpdateRoutineEventPayload
): Promise<RoutineEventDto> {
  const data = await safeJson<unknown>(
    apiClient.put(`routine-events/${id}`, { json: payload })
  );
  return routineEventSchema.parse(data);
}

export async function deleteRoutineEvent(id: string): Promise<void> {
  await apiClient.delete(`routine-events/${id}`);
}
