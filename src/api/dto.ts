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

export const habitFrequencyEnum = z.enum(['Daily', 'Weekly', 'Monthly']);
export type HabitFrequencyDto = z.infer<typeof habitFrequencyEnum>;

export const habitSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().default(''),
  icon: z.string().default(''),
  color: z.string(),
  frequencyType: habitFrequencyEnum,
  targetValue: z.number().int().min(1),
  isActive: z.boolean(),
  userId: z.string(),
  linkedRoutineEventIds: z.array(z.string()).default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type HabitDto = z.infer<typeof habitSchema>;
export const habitListSchema = z.array(habitSchema);

export type CreateHabitPayload = {
  title: string;
  description?: string;
  icon?: string;
  color: string;
  frequencyType: HabitFrequencyDto;
  targetValue: number;
  routineEventIds?: string[] | null;
};

export type UpdateHabitPayload = CreateHabitPayload & { isActive?: boolean };

export const habitLogStatusEnum = z.enum(['Skipped', 'Missed', 'Completed']);
export type HabitLogStatusDto = z.infer<typeof habitLogStatusEnum>;

export const habitLogSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  targetDate: z.string(),
  status: habitLogStatusEnum,
  completedAt: z.string().nullable(),
  notes: z.string().nullable().default(''),
  earnedXP: z.number().int().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type HabitLogDto = z.infer<typeof habitLogSchema>;
export const habitLogListSchema = z.array(habitLogSchema);

export type CreateHabitLogPayload = {
  targetDate: string;
  status: HabitLogStatusDto;
  notes?: string;
  earnedXP?: number;
};

export type UpdateHabitLogPayload = CreateHabitLogPayload;
