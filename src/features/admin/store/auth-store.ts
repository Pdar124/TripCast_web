import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type AuthSession = {
  token: string | null;
  username: string | null;
};

type AuthStore = AuthSession & {
  setSession: (session: { token: string; username: string }) => void;
  clearSession: () => void;
};

const emptySession: AuthSession = {
  token: null,
  username: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...emptySession,
      setSession: (session) => set(session),
      clearSession: () => set(emptySession),
    }),
    {
      name: 'tripcast.admin.session',
      partialize: ({ token, username }) => ({ token, username }),
    },
  ),
);
