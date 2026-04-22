import { z } from 'zod';

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const DayOfWeek = z.number().int().min(0).max(6);

export const eventFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Informe um título')
      .max(120, 'Máximo de 120 caracteres'),
    description: z
      .string()
      .trim()
      .max(500, 'Máximo de 500 caracteres')
      .optional()
      .or(z.literal('')),
    startTime: z.string().regex(TIME_REGEX, 'Horário inválido'),
    endTime: z
      .union([z.string().regex(TIME_REGEX, 'Horário inválido'), z.literal(''), z.null()])
      .optional(),
    mode: z.enum(['once', 'recurring']),
    eventDate: z
      .union([z.string().regex(DATE_REGEX, 'Data inválida'), z.literal(''), z.null()])
      .optional(),
    daysOfWeek: z.array(DayOfWeek).optional(),
    isActive: z.boolean(),
  })
  .superRefine((val, ctx) => {
    if (val.mode === 'once') {
      if (!val.eventDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['eventDate'],
          message: 'Selecione a data',
        });
      }
    } else {
      if (!val.daysOfWeek || val.daysOfWeek.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['daysOfWeek'],
          message: 'Selecione ao menos um dia da semana',
        });
      }
    }
    if (val.endTime && val.endTime.length > 0 && val.endTime <= val.startTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endTime'],
        message: 'Horário de término deve ser após o início',
      });
    }
  });

export type EventFormValues = z.infer<typeof eventFormSchema>;
