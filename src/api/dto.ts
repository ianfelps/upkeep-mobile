import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserDto = z.infer<typeof userSchema>;

export const authResponseSchema = z.object({
  token: z.string(),
  tokenExpiresAt: z.string(),
  refreshToken: z.string(),
  refreshTokenExpiresAt: z.string(),
  user: userSchema,
});
export type AuthResponseDto = z.infer<typeof authResponseSchema>;

export const routineEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string().nullable(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).nullable(),
  eventDate: z.string().nullable(),
  eventType: z.enum(['once', 'recurring']),
  color: z.string().nullable(),
  userId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type RoutineEventDto = z.infer<typeof routineEventSchema>;

export const routineEventListSchema = z.array(routineEventSchema);

export type CreateRoutineEventPayload = {
  title: string;
  description?: string | null;
  startTime: string;
  endTime?: string | null;
  daysOfWeek?: number[] | null;
  eventDate?: string | null;
  color?: string | null;
};

export type UpdateRoutineEventPayload = CreateRoutineEventPayload;
