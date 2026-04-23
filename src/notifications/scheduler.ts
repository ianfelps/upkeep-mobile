import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { findInRange } from '@/db/repositories/routineEvents';
import { expandRecurrence } from '@/features/events/selectors';
import { dayjs } from '@/utils/date';
import { logger } from '@/utils/logger';
import { EVENTS_CHANNEL_ID, hasNotificationPermissions } from './permissions';

const NOTIFY_BEFORE_MIN = 15;
const SCHEDULE_DAYS_AHEAD = 7;
const NOTIF_PREFIX = 'ev-';

function notifId(localId: string, dateKey: string): string {
  return `${NOTIF_PREFIX}${localId}-${dateKey}`;
}

export async function rescheduleEventNotifications(): Promise<void> {
  try {
    const hasPerms = await hasNotificationPermissions();
    if (!hasPerms) return;

    const fromKey = dayjs().format('YYYY-MM-DD');
    const toKey = dayjs().add(SCHEDULE_DAYS_AHEAD, 'day').format('YYYY-MM-DD');

    const rows = await findInRange(fromKey, toKey);
    const occurrences = expandRecurrence(rows, fromKey, toKey);

    const now = new Date();
    const upcoming: Array<{ id: string; title: string; body: string; date: Date }> = [];

    for (const occ of occurrences) {
      const parts = occ.startTime.split(':');
      const h = parseInt(parts[0] ?? '0', 10);
      const m = parseInt(parts[1] ?? '0', 10);
      const triggerDate = dayjs(occ.dateKey)
        .hour(h)
        .minute(m)
        .second(0)
        .subtract(NOTIFY_BEFORE_MIN, 'minute')
        .toDate();

      if (triggerDate > now) {
        upcoming.push({
          id: notifId(occ.localId, occ.dateKey),
          title: occ.title,
          body: `Começa às ${occ.startTime.substring(0, 5)}`,
          date: triggerDate,
        });
      }
    }

    // Cancel all existing event notifications then reschedule fresh
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(NOTIF_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );

    for (const notif of upcoming) {
      await Notifications.scheduleNotificationAsync({
        identifier: notif.id,
        content: {
          title: notif.title,
          body: notif.body,
          sound: true,
          ...(Platform.OS === 'android' && { channelId: EVENTS_CHANNEL_ID }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: notif.date,
        },
      });
    }

    logger.info('[notifications] rescheduled', { count: upcoming.length });
  } catch (err) {
    logger.warn('[notifications] reschedule failed', { message: (err as Error).message });
  }
}

export async function cancelAllEventNotifications(): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith(NOTIF_PREFIX))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
    );
  } catch (err) {
    logger.warn('[notifications] cancel all failed', { message: (err as Error).message });
  }
}
