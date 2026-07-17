import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      toggleTheme: () => {
        const current = get().theme;
        const next: Theme = current === 'light' ? 'dark' : 'light';
        set({ theme: next });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', next === 'dark');
        }
      },
    }),
    {
      name: 'forgeflow-theme',
      skipHydration: true,
    }
  )
);
