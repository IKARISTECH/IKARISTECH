import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const applyTheme = (isDark) => {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
};

export const useThemeStore = create(
  persist(
    (set, get) => ({
      isDark: false,

      toggle: () => {
        const next = !get().isDark;
        applyTheme(next);
        set({ isDark: next });
      },

      init: () => {
        applyTheme(get().isDark);
      },
    }),
    {
      name: 'ikaris-theme',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.isDark);
      },
    }
  )
);