import { z } from 'zod';
import { HABIT_COLORS } from './constants';

export const habitFormSchema = z.object({
  title: z.string().trim().min(1, 'O título é obrigatório').max(100, 'Máximo de 100 caracteres'),
  description: z.string().max(500, 'Máximo de 500 caracteres').optional().default(''),
  icon: z.string().min(1, 'Escolha um ícone').max(50),
  color: z.enum(HABIT_COLORS),
  frequencyType: z.enum(['Daily', 'Weekly', 'Monthly']),
  targetValue: z.number().int().min(1, 'Mínimo 1').max(99),
  linkedRoutineEventIds: z.array(z.string()).default([]),
});

export type HabitFormValues = z.infer<typeof habitFormSchema>;

export const logFormSchema = z.object({
  status: z.enum(['Completed', 'Skipped', 'Missed']),
  notes: z.string().max(500).optional().default(''),
});

export type LogFormValues = z.infer<typeof logFormSchema>;
