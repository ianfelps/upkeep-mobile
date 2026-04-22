import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as events from '@/db/repositories/routineEvents';
import type {
  CreateLocalEventInput,
  LocalEvent,
  UpdateLocalEventInput,
} from '@/db/repositories/routineEvents';
import { useAuthStore } from '@/features/auth/store';
import { schedulePostMutationSync } from '@/sync/triggers';
import { toast } from '@/components';
import { getErrorMessage } from '@/api/errors';
import { eventsQueryKeys } from './queryKeys';

export type CreateEventInput = Omit<CreateLocalEventInput, 'userId'>;

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation<LocalEvent, Error, CreateEventInput>({
    mutationFn: async (input) => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Usuário não autenticado');
      return events.createLocal({ ...input, userId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.all });
      schedulePostMutationSync();
      toast.success('Evento criado');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export type UpdateEventInput = {
  localId: string;
  patch: UpdateLocalEventInput;
};

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation<LocalEvent | null, Error, UpdateEventInput>({
    mutationFn: async ({ localId, patch }) => events.updateLocal(localId, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.all });
      schedulePostMutationSync();
      toast.success('Evento atualizado');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: async (localId) => events.deleteLocal(localId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventsQueryKeys.all });
      schedulePostMutationSync();
      toast.success('Evento excluído');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });
}
