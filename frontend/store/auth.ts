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
  refreshToken: string | null;

  setAuth: (user: AuthUser, accessToken?: string | null, refreshToken?: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      refreshToken: null,

      setAuth: (user, accessToken, refreshToken) => {
        const token = accessToken || "mock-access-token";
        if (typeof window !== "undefined") {
          document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        }
        set({ user, isAuthenticated: true, refreshToken: refreshToken || null });
      },

      clearAuth: () => {
        if (typeof window !== "undefined") {
          document.cookie = `access_token=; path=/; max-age=0; SameSite=Lax`;
        }
        set({ user: null, isAuthenticated: false, refreshToken: null });
      },
    }),
    {
      name: 'forgeflow-auth',
    }
  )
);
