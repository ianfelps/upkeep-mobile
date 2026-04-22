import { useMutation } from '@tanstack/react-query';
import { changePassword, deleteMe, updateMe } from '@/api/endpoints/users';
import { tokenStorage } from '@/utils/secureStore';
import { useAuthStore } from '@/features/auth/store';
import { logoutSession } from '@/api/endpoints/auth';
import * as events from '@/db/repositories/routineEvents';
import { kvDelete } from '@/db/repositories/kv';
import { toast } from '@/components';

export function useUpdateProfile() {
  const patchUser = useAuthStore((s) => s.patchUser);
  return useMutation({
    mutationFn: updateMe,
    onSuccess: (user) => {
      patchUser({ name: user.name, email: user.email, updatedAt: user.updatedAt });
      toast.success('Perfil atualizado');
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => toast.success('Senha alterada'),
  });
}

async function wipeLocalSession() {
  const refreshToken = await tokenStorage.getRefreshToken();
  if (refreshToken) {
    await logoutSession(refreshToken).catch(() => {});
  }
  await tokenStorage.clearRefreshToken();
  await events.wipeAll();
  await kvDelete('sync.lastPulledAt');
  await kvDelete('sync.lastFullReconcileAt');
  await kvDelete('auth.userId');
  useAuthStore.getState().clearSession();
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      await deleteMe();
    },
    onSuccess: async () => {
      await wipeLocalSession();
    },
  });
}
