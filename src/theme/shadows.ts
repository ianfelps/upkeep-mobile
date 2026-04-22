import { Platform, type ViewStyle } from 'react-native';

export const shadows = {
  elevation1: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1C1917',
      shadowOpacity: 0.06,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
    },
    android: { elevation: 1 },
    default: {},
  })!,
  elevation2: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1C1917',
      shadowOpacity: 0.12,
      shadowOffset: { width: 0, height: 6 },
      shadowRadius: 14,
    },
    android: { elevation: 6 },
    default: {},
  })!,
} as const;
