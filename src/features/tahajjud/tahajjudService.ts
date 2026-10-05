import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { goalProgressBridge } from '../daily-goals/services/goalProgressBridge';
import {
  loadTahajjudNights,
  loadTahajjudSettings,
  removeTahajjudNight,
  saveNightDetails,
  saveTahajjudNight,
  type TahajjudNights,
} from './TahajjudStore';
import { alarmTime, bedtimeSuggestions, clock, formatDuration, upcomingNights, type TahajjudNight } from './tahajjudNight';
import { loadTahajjudSchedule } from './tahajjudSchedule';
import { publishTahajjudWidget, refreshTahajjudWidgetValidation } from './tahajjudWidget';
import { shareValidationWithCommunity } from './tahajjudCommunity';
import { tx } from './tahajjudI18n';

// ----- Validation ----------------------------------------------------------------------------

/**
 * « J'ai prié Tahajjud » : one validation per night. Feeds the calendar, streak and statistics (local
 * store, also read by Ma progression), the central goals actions, and cancels the rest of the night's
 * reminders.
 */
export async function validateTahajjudNight(night: string, witr: boolean): Promise<TahajjudNights> {
  const nights = await loadTahajjudNights();
  if (nights[night]) return nights;
  const updated = await saveTahajjudNight(night, nights);
  await saveNightDetails(night, { witr });
  goalProgressBridge.record({ metric: 'tahajjud_night', amount: 1, evidenceId: `tahajjud:${night}` });
  void refreshTahajjudWidgetValidation();
  void refreshTahajjudNotifications(true);
  // « La Oummah cette nuit » : only for members who chose to appear.
  void shareValidationWithCommunity(night);
  return updated;
}

/** Undo a validation made by mistake. */
export async function cancelTahajjudNight(night: string): Promise<TahajjudNights> {
  const nights = await removeTahajjudNight(night);
  void refreshTahajjudWidgetValidation();
  void refreshTahajjudNotifications(true);
  return nights;
}

// ----- System alarm (Android Clock app) ------------------------------------------------------

type AlarmModule = { setSystemAlarm(hour: number, minute: number, message: string): Promise<boolean> };
const alarmModule = Platform.OS === 'android' ? requireOptionalNativeModule<AlarmModule>('TahajjudAlarm') : null;

/** True when the phone's own alarm can be set (Android, with the native module in this build). */
export const canSetSystemAlarm = Boolean(alarmModule);

export async function setSystemAlarm(timestamp: number): Promise<boolean> {
  if (!alarmModule) return false;
  const date = new Date(timestamp);
  return alarmModule.setSystemAlarm(date.getHours(), date.getMinutes(), tx('Qiyam al-Layl · OUMMAH')).catch(() => false);
}

// ----- Notifications -------------------------------------------------------------------------

const OWNER = 'oummah-tahajjud';
const CHANNEL = 'oummah-tahajjud-v1';
const NIGHTS_AHEAD = 7;
/** iOS keeps only 64 pending notifications for the whole app: the adhan comes first. */
const IOS_NOTIFIED_NIGHTS = 2;
const REFRESHED_AT_KEY = 'oummah.tahajjud.notifications.refreshed-at.v1';
const REFRESH_INTERVAL_MS = 3 * 60 * 60_000;

function granted(status: Notifications.NotificationPermissionsStatus) {
  return status.granted
    || status.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
    || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function ensureTahajjudNotificationPermission() {
  let permission = await Notifications.getPermissionsAsync();
  if (!granted(permission)) permission = await Notifications.requestPermissionsAsync();
  return granted(permission);
}

type Planned = { at: number; title: string; body: string; kind: string; night: string };

function planNight(night: TahajjudNight, settings: Awaited<ReturnType<typeof loadTahajjudSettings>>): Planned[] {
  const planned: Planned[] = [];
  const range = `${clock(night.lastThirdStart)} → ${clock(night.fajr)}`;
  const { notifications, alarm } = settings;
  if (notifications.evening) {
    planned.push({
      at: night.isha + 45 * 60_000, kind: 'evening', night: night.key,
      title: tx('Ce soir, Qiyam al-Layl 🌙'),
      body: tx("Dernier tiers de {0}. Une intention, un réveil, et Allah fait le reste.", [range]),
    });
  }
  if (notifications.soon) {
    planned.push({
      at: night.lastThirdStart - 15 * 60_000, kind: 'soon', night: night.key,
      title: tx('Le dernier tiers commence bientôt'),
      body: tx("Dans 15 minutes, à {0}.", [clock(night.lastThirdStart)]),
    });
  }
  const wakeUp = alarm.enabled ? alarmTime(night, alarm.mode, alarm.customTime) : null;
  if (notifications.bedtime) {
    // The chosen number of sleep cycles, or the longest that still fits after ‘Isha.
    const target = wakeUp ?? night.lastThirdStart;
    const options = bedtimeSuggestions(night, target);
    const choice = options.find((item) => item.cycles === settings.bedtimeCycles)
      ?? [...options].reverse().find((item) => item.cycles <= settings.bedtimeCycles)
      ?? options[0];
    if (choice) {
      planned.push({
        at: choice.at, kind: 'bedtime', night: night.key,
        title: tx('Il est l’heure de dormir 🌙'),
        body: tx("Couché maintenant : {0} de sommeil avant {1} à {2}.", [formatDuration(choice.sleep), wakeUp ? tx('votre réveil') : tx('le dernier tiers'), clock(target)]),
      });
    }
  }
  if (wakeUp !== null) {
    planned.push({
      at: wakeUp, kind: 'alarm', night: night.key,
      title: tx('C’est l’heure de prier la nuit'),
      body: tx("Le Seigneur descend au ciel de ce bas monde. Fajr à {0} · {1} devant soi.", [clock(night.fajr), formatDuration(night.fajr - wakeUp)]),
    });
  }
  if (notifications.start && (wakeUp === null || Math.abs(wakeUp - night.lastThirdStart) > 60_000)) {
    planned.push({
      at: night.lastThirdStart, kind: 'start', night: night.key,
      title: tx('Le dernier tiers commence maintenant'),
      body: tx("« Qui M’invoque, que Je lui réponde ? » Jusqu’à Fajr, {0}.", [clock(night.fajr)]),
    });
  }
  if (notifications.fajr) {
    planned.push({
      at: night.fajr - 30 * 60_000, kind: 'fajr', night: night.key,
      title: tx('Fajr approche'),
      body: tx("Fajr à {0} : encore 30 minutes pour le Witr et les invocations.", [clock(night.fajr)]),
    });
  }
  return planned;
}

/** These notifications open the guided « Je suis debout » mode. */
const WAKE_KINDS = new Set(['alarm', 'start', 'soon']);

let queue: Promise<void> = Promise.resolve();

/**
 * Reschedules Tahajjud notifications (7 nights ahead). Only notifications marked OWNER are touched.
 * Without `force`, runs at most every 3 hours. Never throws.
 */
export function refreshTahajjudNotifications(force = false): Promise<void> {
  queue = queue.then(async () => {
    try {
      const last = Number(await AsyncStorage.getItem(REFRESHED_AT_KEY).catch(() => null)) || 0;
      if (!force && Date.now() - last < REFRESH_INTERVAL_MS) return;
      await AsyncStorage.setItem(REFRESHED_AT_KEY, String(Date.now())).catch(() => undefined);

      const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
      await Promise.all(scheduled
        .filter((item) => (item.content.data as Record<string, unknown> | undefined)?.notificationOwner === OWNER)
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier).catch(() => undefined)));

      // 8 days of prayer times: also feeds the widget / lock screen.
      const schedule = await loadTahajjudSchedule(NIGHTS_AHEAD + 1, false);
      void publishTahajjudWidget(schedule);

      const settings = await loadTahajjudSettings();
      const anyEnabled = settings.alarm.enabled || Object.values(settings.notifications).some(Boolean);
      if (!anyEnabled || !granted(await Notifications.getPermissionsAsync())) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL, {
          name: tx('Qiyam al-Layl'),
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 400, 200, 400, 200, 600],
          sound: 'default',
          bypassDnd: false,
        });
      }

      const nights = await loadTahajjudNights();
      const now = Date.now();
      const planned = upcomingNights(schedule)
        .slice(0, Platform.OS === 'ios' ? IOS_NOTIFIED_NIGHTS : NIGHTS_AHEAD)
        // A validated night needs no more reminders.
        .flatMap((night) => nights[night.key] ? [] : planNight(night, settings))
        .filter((item) => item.at > now + 30_000)
        .sort((a, b) => a.at - b.at);

      for (const item of planned) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: item.title,
            body: item.body,
            sound: 'default',
            data: { notificationOwner: OWNER, route: WAKE_KINDS.has(item.kind) ? '/tahajjud/awake' : '/tahajjud', kind: item.kind, night: item.night },
            ...(Platform.OS === 'ios' && item.kind === 'alarm' ? { interruptionLevel: 'timeSensitive' as const } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(item.at),
            ...(Platform.OS === 'android' ? { channelId: CHANNEL } : {}),
          },
        }).catch(() => undefined);
      }
    } catch {
      // Best effort: the next opening tries again.
    }
  });
  return queue;
}
