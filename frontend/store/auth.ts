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

  setAuth: (user: AuthUser, accessToken?: string | null, refreshToken?: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      setAuth: (user, accessToken, refreshToken) => {
        if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") {
          const token = accessToken || "mock-access-token";
          if (typeof window !== "undefined") {
            document.cookie = `access_token=${token}; path=/; max-age=86400; SameSite=Lax`;
          }
        }
        set({ user, isAuthenticated: true });
      },

      clearAuth: () => {
        if (process.env.NEXT_PUBLIC_MOCK_MODE === "true") {
          if (typeof window !== "undefined") {
            document.cookie = `access_token=; path=/; max-age=0; SameSite=Lax`;
          }
        }
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'forgeflow-auth',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
