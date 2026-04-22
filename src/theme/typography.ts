import type { TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

type Variant = TextStyle & { fontFamily: string };

export const typography = {
  display: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.2,
  },
  h2: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    lineHeight: 26,
  },
  body: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 22,
  },
  small: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  smallMedium: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
} satisfies Record<string, Variant>;

export type TypographyVariant = keyof typeof typography;
