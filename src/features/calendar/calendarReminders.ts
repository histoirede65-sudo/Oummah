import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { translate } from '../../i18n';
import type { CalendarSettings } from './CalendarStore';
import {
  addDays,
  fromDateKey,
  getEventsForDate,
  getHijriDate,
  hijriMonthName,
  isRecommendedFastDay,
  localizeEvent,
  toDateKey,
} from './IslamicCalendar';

/**
 * Notifications du calendrier, toutes locales :
 *  - événements suivis : 3 jours avant ou la veille à 20 h, ou le matin même à 8 h ;
 *  - jours blancs : la veille des 13, 14 et 15 à 20 h ;
 *  - vendredi : sourate Al-Kahf à 9 h ;
 *  - lundi et jeudi : la veille à 20 h, seulement si le jeûne est permis ce jour-là ;
 *  - rappels personnels : le jour choisi à 9 h.
 * Reprogrammées à chaque changement de réglage et à l'ouverture (10 jours d'avance). Seules les
 * notifications marquées OWNER sont annulées.
 */

const OWNER = 'oummah-calendar';
const CHANNEL = 'oummah-calendar-v1';
const DAYS_AHEAD = 10;
const MAX_NOTIFICATIONS = 30;
// iOS garde 64 notifications en attente pour toute l'app : l'adhan passe en premier.
const IOS_MAX_NOTIFICATIONS = 6;
const REFRESHED_AT_KEY = 'oummah.calendar.reminders.refreshed-at.v1';
const REFRESH_INTERVAL_MS = 3 * 60 * 60_000;

type Planned = { at: number; title: string; body: string; route: string; key: string };

function at(date: Date, hours: number) {
  const moment = new Date(date);
  moment.setHours(hours, 0, 0, 0);
  return moment.getTime();
}

function hasAnyReminder(settings: CalendarSettings) {
  return settings.whiteDaysReminder
    || settings.fridayReminder
    || settings.mondayThursdayReminder
    || settings.personalReminders.length > 0
    || Object.keys(settings.eventReminders).length > 0;
}

function plan(settings: CalendarSettings): Planned[] {
  const hijriOf = (date: Date) => getHijriDate(date, settings.method, settings.adjustment, settings.country);
  const now = Date.now();
  const horizon = now + DAYS_AHEAD * 86_400_000;
  const today = new Date();
  const planned: Planned[] = [];
  const push = (item: Planned) => {
    if (item.at > now && item.at <= horizon) planned.push(item);
  };

  // Jusqu'à 3 jours après l'horizon, pour les rappels « 3 jours avant ».
  for (let offset = 0; offset <= DAYS_AHEAD + 3; offset += 1) {
    const day = addDays(today, offset);
    const hijri = hijriOf(day);
    const dayKey = toDateKey(day);

    for (const event of getEventsForDate(hijri)) {
      const timing = settings.eventReminders[event.id];
      if (!timing) continue;
      const { shortTitle } = localizeEvent(event);
      const route = `/calendar/event/${event.id}?date=${dayKey}`;
      if (timing === 'morning') {
        push({ at: at(day, 8), route, key: `event-${event.id}-${dayKey}`, title: translate('calendar.notifEventToday', { event: shortTitle }), body: translate('calendar.notifEventBody') });
      } else {
        const days = timing === 'eve' ? 1 : 3;
        push({
          at: at(addDays(day, -days), 20), route, key: `event-${event.id}-${dayKey}`,
          title: translate(days === 1 ? 'calendar.notifEventTomorrow' : 'calendar.notifEventInDays', { event: shortTitle, count: days }),
          body: translate('calendar.notifEventBody'),
        });
      }
    }

    const eve = addDays(day, -1);
    const fastAllowed = isRecommendedFastDay(day, hijri);
    if (settings.whiteDaysReminder && hijri.day >= 13 && hijri.day <= 15 && fastAllowed) {
      push({
        at: at(eve, 20), route: '/calendar', key: `white-${dayKey}`,
        title: translate('calendar.notifWhiteTitle', { day: hijri.day, month: hijriMonthName(hijri.month) }),
        body: translate('calendar.notifWhiteBody'),
      });
    }
    const weekday = day.getDay();
    if (settings.mondayThursdayReminder && (weekday === 1 || weekday === 4) && fastAllowed) {
      push({
        at: at(eve, 20), route: '/calendar', key: `fast-${dayKey}`,
        title: translate(weekday === 1 ? 'calendar.notifMondayTitle' : 'calendar.notifThursdayTitle'),
        body: translate('calendar.notifFastBody'),
      });
    }
    if (settings.fridayReminder && weekday === 5) {
      push({ at: at(day, 9), route: '/calendar', key: `kahf-${dayKey}`, title: translate('calendar.notifKahfTitle'), body: translate('calendar.notifKahfBody') });
    }
  }

  for (const reminder of settings.personalReminders) {
    push({ at: at(fromDateKey(reminder.dateKey), 9), route: '/calendar', key: `personal-${reminder.id}`, title: reminder.title, body: translate('calendar.notifPersonalBody') });
  }
  return planned;
}

function permissionGranted(status: Notifications.NotificationPermissionsStatus) {
  return status.granted
    || status.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
    || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

let queue: Promise<void> = Promise.resolve();

/**
 * Reprogramme les notifications du calendrier. Sans `force`, au plus toutes les 3 heures.
 * Avec `askPermission`, demande l'autorisation si un rappel est actif. Ne lève jamais d'erreur.
 */
export function refreshCalendarReminders(
  settings: CalendarSettings,
  { force = false, askPermission = false }: { force?: boolean; askPermission?: boolean } = {},
): Promise<void> {
  queue = queue.then(async () => {
    try {
      const last = Number(await AsyncStorage.getItem(REFRESHED_AT_KEY).catch(() => null)) || 0;
      if (!force && Date.now() - last < REFRESH_INTERVAL_MS) return;
      await AsyncStorage.setItem(REFRESHED_AT_KEY, String(Date.now())).catch(() => undefined);

      const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
      await Promise.all(scheduled
        .filter((item) => (item.content.data as Record<string, unknown> | undefined)?.notificationOwner === OWNER)
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier).catch(() => undefined)));
      if (!hasAnyReminder(settings)) return;

      let permission = await Notifications.getPermissionsAsync();
      if (!permissionGranted(permission) && askPermission && permission.canAskAgain) {
        permission = await Notifications.requestPermissionsAsync();
      }
      if (!permissionGranted(permission)) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL, {
          name: translate('calendar.title'),
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        });
      }

      const planned = plan(settings)
        .sort((a, b) => a.at - b.at)
        .slice(0, Platform.OS === 'ios' ? IOS_MAX_NOTIFICATIONS : MAX_NOTIFICATIONS);
      for (const item of planned) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: item.title,
            body: item.body,
            sound: 'default',
            data: { notificationOwner: OWNER, route: item.route, reminderKey: item.key },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(item.at),
            ...(Platform.OS === 'android' ? { channelId: CHANNEL } : {}),
          },
        }).catch(() => undefined);
      }
    } catch {
      // Au mieux : la prochaine ouverture réessaie.
    }
  });
  return queue;
}
