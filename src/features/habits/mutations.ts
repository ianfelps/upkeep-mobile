import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as habitsRepo from '@/db/repositories/habits';
import * as habitLogsRepo from '@/db/repositories/habitLogs';
import type {
  CreateLocalHabitInput,
  LocalHabit,
  UpdateLocalHabitInput,
} from '@/db/repositories/habits';
import type {
  CreateLocalHabitLogInput,
  LocalHabitLog,
  UpdateLocalHabitLogInput,
} from '@/db/repositories/habitLogs';
import { useAuthStore } from '@/features/auth/store';
import { schedulePostMutationSync } from '@/sync/triggers';
import { toast } from '@/components';
import { getErrorMessage } from '@/api/errors';
import { dayjs, toDateKey } from '@/utils/date';
import { habitsQueryKeys } from './queryKeys';

export type CreateHabitInput = Omit<CreateLocalHabitInput, 'userId'>;

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation<LocalHabit, Error, CreateHabitInput>({
    mutationFn: async (input) => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Usuário não autenticado');
      return habitsRepo.createLocal({ ...input, userId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsQueryKeys.all });
      schedulePostMutationSync();
      toast.success('Hábito criado');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation<LocalHabit | null, Error, { localId: string; patch: UpdateLocalHabitInput }>({
    mutationFn: ({ localId, patch }) => habitsRepo.updateLocal(localId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsQueryKeys.all });
      schedulePostMutationSync();
      toast.success('Hábito atualizado');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (localId) => habitsRepo.deleteLocal(localId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsQueryKeys.all });
      schedulePostMutationSync();
      toast.success('Hábito excluído');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

const COMPLETED_XP = 10;

export function useToggleHabitToday() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { habitLocalId: string }>({
    mutationFn: async ({ habitLocalId }) => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Usuário não autenticado');
      const todayKey = toDateKey(dayjs());
      const existing = await habitLogsRepo.findForHabitOnDate(habitLocalId, todayKey);
      if (existing && existing.status === 'completed') {
        await habitLogsRepo.deleteLocal(existing.localId);
        return;
      }
      if (existing) {
        await habitLogsRepo.updateLocal(existing.localId, {
          status: 'Completed',
          earnedXp: COMPLETED_XP,
        });
        return;
      }
      const habit = await habitsRepo.getByLocalId(habitLocalId);
      await habitLogsRepo.createLocal({
        habitLocalId,
        habitRemoteId: habit?.remoteId ?? null,
        targetDate: todayKey,
        status: 'Completed',
        earnedXp: COMPLETED_XP,
        userId: user.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsQueryKeys.all });
      schedulePostMutationSync();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export type UpsertHabitLogInput = {
  habitLocalId: string;
  targetDate: string;
  status: 'Completed' | 'Skipped' | 'Missed';
  notes?: string;
};

export function useUpsertHabitLog() {
  const queryClient = useQueryClient();
  return useMutation<LocalHabitLog, Error, UpsertHabitLogInput>({
    mutationFn: async ({ habitLocalId, targetDate, status, notes }) => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Usuário não autenticado');
      const existing = await habitLogsRepo.findForHabitOnDate(habitLocalId, targetDate);
      if (existing) {
        const updated = await habitLogsRepo.updateLocal(existing.localId, {
          status,
          notes: notes ?? null,
          earnedXp: status === 'Completed' ? COMPLETED_XP : 0,
        });
        if (!updated) throw new Error('Falha ao atualizar log');
        return updated;
      }
      const habit = await habitsRepo.getByLocalId(habitLocalId);
      const input: CreateLocalHabitLogInput = {
        habitLocalId,
        habitRemoteId: habit?.remoteId ?? null,
        targetDate,
        status,
        notes: notes ?? null,
        earnedXp: status === 'Completed' ? COMPLETED_XP : 0,
        userId: user.id,
      };
      return habitLogsRepo.createLocal(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsQueryKeys.all });
      schedulePostMutationSync();
      toast.success('Registro salvo');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteHabitLog() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (logLocalId) => habitLogsRepo.deleteLocal(logLocalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitsQueryKeys.all });
      schedulePostMutationSync();
      toast.success('Registro removido');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

// Avoid TS warning about unused import when re-exporting type only
export type _UpdateHabitLogInputType = UpdateLocalHabitLogInput;
