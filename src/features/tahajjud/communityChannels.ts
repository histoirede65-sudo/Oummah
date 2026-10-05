import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { tx } from './tahajjudI18n';

/** Messages (private + groups): own channel with the OUMMAH sound, like a messaging app. */
export const MESSAGES_CHANNEL = 'oummah-messages-v1';
const TAHAJJUD_CHANNEL = 'oummah-tahajjud-v1';

/**
 * Created at startup so push notifications (messages, friend requests, encouragements, group
 * reminders) land in the right channel even if Tahajjud reminders were never turned on.
 */
export async function ensureCommunityChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(MESSAGES_CHANNEL, {
    name: tx('Messages OUMMAH'),
    description: tx('Messages privés et de groupe, rappels de groupe.'),
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'oummah_message.wav',
    vibrationPattern: [0, 120, 80, 120],
    lightColor: '#E3B55A',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  }).catch(() => undefined);
  const existing = await Notifications.getNotificationChannelAsync(TAHAJJUD_CHANNEL).catch(() => null);
  if (!existing) {
    await Notifications.setNotificationChannelAsync(TAHAJJUD_CHANNEL, {
      name: tx('Qiyam al-Layl'),
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400, 200, 600],
      sound: 'default',
      bypassDnd: false,
    }).catch(() => undefined);
  }
}
