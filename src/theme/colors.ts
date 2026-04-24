export const lightColors = {
  primary: '#EA580C',
  primaryDark: '#C2410C',
  primaryMuted: '#FFF7ED',
  primaryContrast: '#FFFFFF',
  accent: '#0F766E',
  background: '#FAFAF9',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F5F4',
  border: '#E7E5E4',
  borderStrong: '#D6D3D1',
  text: '#1C1917',
  textMuted: '#78716C',
  textInverse: '#FAFAF9',
  success: '#16A34A',
  successMuted: '#F0FDF4',
  warn: '#CA8A04',
  warnMuted: '#FEFCE8',
  error: '#DC2626',
  errorMuted: '#FEF2F2',
  overlay: 'rgba(28, 25, 23, 0.45)',
} as const;

export const darkColors = {
  primary: '#EA580C',
  primaryDark: '#C2410C',
  primaryMuted: '#431407',
  primaryContrast: '#FFFFFF',
  accent: '#14B8A6',
  background: '#0C0A09',
  surface: '#1C1917',
  surfaceAlt: '#292524',
  border: '#292524',
  borderStrong: '#44403C',
  text: '#FAFAF9',
  textMuted: '#A8A29E',
  textInverse: '#1C1917',
  success: '#22C55E',
  successMuted: '#052E16',
  warn: '#EAB308',
  warnMuted: '#1C1400',
  error: '#EF4444',
  errorMuted: '#450A0A',
  overlay: 'rgba(0, 0, 0, 0.65)',
} as const;

// backward-compat alias (static, light-only — use useColors() in components)
export const colors = lightColors;

export type AppColors = typeof lightColors;
export type ColorName = keyof typeof lightColors;
