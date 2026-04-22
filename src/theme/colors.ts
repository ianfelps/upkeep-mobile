export const colors = {
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

export type ColorName = keyof typeof colors;
