import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/themeStore';
import { lightColors, darkColors, type AppColors } from './colors';

export type { AppColors };

export function useIsDark(): boolean {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();
  return mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
}

export function useColors(): AppColors {
  const isDark = useIsDark();
  return isDark ? darkColors : lightColors;
}
