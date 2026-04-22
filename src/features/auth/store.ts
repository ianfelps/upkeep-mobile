import { create } from 'zustand';

export type UserSession = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  user: UserSession | null;
  accessToken: string | null;
  setSession: (payload: { user: UserSession; accessToken: string }) => void;
  clearSession: () => void;
  setStatus: (status: AuthStatus) => void;
  patchUser: (partial: Partial<UserSession>) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  accessToken: null,
  setSession: ({ user, accessToken }) =>
    set({ user, accessToken, status: 'authenticated' }),
  clearSession: () =>
    set({ user: null, accessToken: null, status: 'unauthenticated' }),
  setStatus: (status) => set({ status }),
  patchUser: (partial) =>
    set((state) => (state.user ? { user: { ...state.user, ...partial } } : state)),
}));
