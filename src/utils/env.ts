import { Platform } from 'react-native';
import Constants from 'expo-constants';

function normalizeBaseUrl(raw: string | undefined): string {
  const fallback = 'http://localhost:5003';
  const base = (raw ?? fallback).replace(/\/+$/, '');

  if (Platform.OS === 'android') {
    return base
      .replace('://localhost', '://10.0.2.2')
      .replace('://127.0.0.1', '://10.0.2.2');
  }
  return base;
}

const rawBase =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl;

export const env = {
  apiBaseUrl: normalizeBaseUrl(rawBase),
  isDev: __DEV__,
} as const;
