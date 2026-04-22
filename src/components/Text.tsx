import React from 'react';
import { Text as RNText, type TextProps, type TextStyle } from 'react-native';
import { colors, typography, type TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  color?: string;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  align?: TextStyle['textAlign'];
};

export function Text({
  variant = 'body',
  color = colors.text,
  weight,
  align,
  style,
  ...rest
}: Props) {
  const baseStyle = typography[variant];
  const weightMap: Record<string, string> = {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semibold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  };
  const fontFamily = weight ? weightMap[weight] : baseStyle.fontFamily;
  return (
    <RNText
      style={[baseStyle, { color, fontFamily, textAlign: align }, style]}
      {...rest}
    />
  );
}
