import { useThemeStore } from '../store/themeStore';

// Hook que devuelve isDark reactivo — se actualiza al cambiar tema
export function useTheme() {
  const isDark = useThemeStore((s) => s.isDark);
  return { isDark };
}