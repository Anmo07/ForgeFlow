import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  accessToken: string | null;

  setAuth: (user: AuthUser, accessToken?: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,

      setAuth: (user, accessToken) => {
        if (typeof window !== "undefined" && accessToken) {
          document.cookie = `access_token=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
        }
        set({ user, isAuthenticated: true, accessToken: accessToken || null });
      },

      clearAuth: () => {
        if (typeof window !== "undefined") {
          document.cookie = `access_token=; path=/; max-age=0; SameSite=Lax`;
        }
        set({ user: null, isAuthenticated: false, accessToken: null });
      },
    }),
    {
      name: 'forgeflow-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
      }),
      skipHydration: true,
    }
  )
);
