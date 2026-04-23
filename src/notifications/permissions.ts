import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const EVENTS_CHANNEL_ID = 'events';

export async function setupNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(EVENTS_CHANNEL_ID, {
    name: 'Eventos',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#EA580C',
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  await setupNotificationChannel();
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function hasNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}
