import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getMosquePosts } from './data/mosquePosts';
import { getMosquePrayerSchedule, loadPrayerCalculationSettings } from './data/mosquePrayerTimes';
import {
  applyApprovedMosquePrayerTimes,
  getApprovedMosquePrayerTimes,
  getIqamaTime,
} from './data/mosquePrayerUpdates';

/**
 * Notifications liées à une mosquée, activées mosquée par mosquée :
 *  - Événements : rappel 2 h avant chaque événement validé.
 *  - « Pars maintenant » : pour les prières choisies, au moment de partir pour arriver 5 min avant
 *    l'iqama (ou l'adhan si l'iqama n'est pas connue), selon le temps de trajet depuis la position du
 *    téléphone.
 * Notifications locales, reprogrammées à chaque ouverture (3 jours d'avance). Seules les notifications
 * marquées OWNER sont annulées : celles des autres fonctions de l'app ne sont jamais touchées.
 */

export type ReminderPrayer = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha' | 'jumuah';

export type MosqueReminderSettings = {
  mosque: { id: string; name: string; address?: string; latitude: number; longitude: number };
  events: boolean;
  leaveNow: ReminderPrayer[];
};

const SETTINGS_KEY = 'oummah.mosques.reminders.v1';
const ORIGIN_KEY = 'oummah.mosques.reminders.origin.v1';
const OWNER = 'oummah-mosque';
const CHANNEL = 'oummah-mosque-v1';
const DAYS_AHEAD = 3;
const EVENT_LEAD_MS = 2 * 60 * 60_000;
const ARRIVAL_MARGIN_MIN = 5;
const MAX_NOTIFICATIONS = 40;

const PRAYER_LABELS: Record<ReminderPrayer, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha', jumuah: 'Joumou’a',
};

// ----- Settings ------------------------------------------------------------------------------

async function readAll(): Promise<Record<string, MosqueReminderSettings>> {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(SETTINGS_KEY)) ?? '{}') as unknown;
    return parsed && typeof parsed === 'object' ? parsed as Record<string, MosqueReminderSettings> : {};
  } catch {
    return {};
  }
}

export async function getMosqueReminderSettings(mosqueId: string): Promise<MosqueReminderSettings | null> {
  return (await readAll())[mosqueId] ?? null;
}

/**
 * Saves the reminders of one mosque, then reschedules. Returns false when notifications (or the
 * position needed for « Pars maintenant ») are not allowed.
 */
export async function saveMosqueReminderSettings(settings: MosqueReminderSettings): Promise<{ ok: boolean; reason?: 'notifications' | 'location' }> {
  const enabling = settings.events || settings.leaveNow.length > 0;
  if (enabling && !(await ensureNotificationPermission())) return { ok: false, reason: 'notifications' };
  if (settings.leaveNow.length > 0 && !(await refreshOrigin(true))) return { ok: false, reason: 'location' };
  const all = await readAll();
  if (enabling) all[settings.mosque.id] = settings;
  else delete all[settings.mosque.id];
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(all));
  await refreshMosqueReminders(true);
  return { ok: true };
}

// ----- Permissions and position --------------------------------------------------------------

function permissionGranted(status: Notifications.NotificationPermissionsStatus) {
  return status.granted
    || status.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED
    || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function ensureNotificationPermission() {
  let permission = await Notifications.getPermissionsAsync();
  if (!permissionGranted(permission)) permission = await Notifications.requestPermissionsAsync();
  return permissionGranted(permission);
}

type Origin = { latitude: number; longitude: number };

/** Last known position of the phone, kept so reminders can be scheduled without asking again. */
async function refreshOrigin(ask: boolean): Promise<Origin | null> {
  try {
    let permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted && ask) permission = await Location.requestForegroundPermissionsAsync();
    if (permission.granted) {
      const position = await Location.getLastKnownPositionAsync({ maxAge: 6 * 60 * 60_000 })
        ?? (ask ? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }) : null);
      if (position) {
        const origin = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        await AsyncStorage.setItem(ORIGIN_KEY, JSON.stringify(origin));
        return origin;
      }
    }
  } catch {
    // Falls back to the saved position.
  }
  try {
    const saved = JSON.parse((await AsyncStorage.getItem(ORIGIN_KEY)) ?? 'null') as Origin | null;
    return saved && Number.isFinite(saved.latitude) && Number.isFinite(saved.longitude) ? saved : null;
  } catch {
    return null;
  }
}

function distanceMeters(a: Origin, b: Origin) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.asin(Math.sqrt(h));
}

/** Travel estimate: on foot up to 2.5 km (streets ≈ 1.3 × straight line, 80 m/min), else by car. */
export function estimateTravel(origin: Origin, mosque: Origin) {
  const meters = distanceMeters(origin, mosque) * 1.3;
  if (meters <= 2_500) return { minutes: Math.max(1, Math.round(meters / 80)), mode: 'à pied' as const };
  return { minutes: Math.round(meters / 420) + 5, mode: 'en voiture' as const };
}

// ----- Scheduling ----------------------------------------------------------------------------

function mosqueRoute(mosque: MosqueReminderSettings['mosque']) {
  const query = [
    ['name', mosque.name], ['address', mosque.address ?? ''],
    ['latitude', String(mosque.latitude)], ['longitude', String(mosque.longitude)],
  ].map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&');
  return `/mosque/${encodeURIComponent(mosque.id)}?${query}`;
}

type Planned = { at: number; title: string; body: string; route: string; key: string };

async function plannedForMosque(settings: MosqueReminderSettings, origin: Origin | null): Promise<Planned[]> {
  const { mosque } = settings;
  const route = mosqueRoute(mosque);
  const planned: Planned[] = [];
  const now = Date.now();
  const horizon = now + DAYS_AHEAD * 86_400_000;

  if (settings.events) {
    const posts = await getMosquePosts(mosque.id);
    for (const post of posts) {
      if (post.kind !== 'event' || !post.startsAt) continue;
      const start = Date.parse(post.startsAt);
      const at = start - EVENT_LEAD_MS;
      if (at <= now || at > now + 14 * 86_400_000) continue;
      const time = new Date(start).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      planned.push({ at, route, key: `event-${post.id}`, title: `${post.title} à ${time}`, body: `${mosque.name} · dans 2 heures.` });
    }
  }

  if (settings.leaveNow.length > 0 && origin) {
    const calculation = await loadPrayerCalculationSettings();
    const [calculated, approved] = await Promise.all([
      getMosquePrayerSchedule(mosque.latitude, mosque.longitude, undefined, calculation, DAYS_AHEAD + 1),
      getApprovedMosquePrayerTimes(mosque.id).catch(() => null),
    ]);
    const schedule = applyApprovedMosquePrayerTimes(calculated, approved);
    const travel = estimateTravel(origin, mosque);
    const prayers = [...schedule.prayers, ...schedule.tomorrowPrayers, ...(schedule.futurePrayers ?? [])];
    const seen = new Set<number>();
    const jumuah = approved?.jumuahTimes?.[0]?.time;

    for (const prayer of prayers) {
      if (seen.has(prayer.timestamp)) continue;
      seen.add(prayer.timestamp);
      const key = prayer.key.toLowerCase() as Exclude<ReminderPrayer, 'jumuah'>;
      const day = new Date(prayer.timestamp);
      const isFridayDhuhr = key === 'dhuhr' && day.getDay() === 5;

      let label: ReminderPrayer = key;
      let target = prayer.timestamp;
      let targetLabel = `adhan à ${prayer.time}`;
      if (isFridayDhuhr && settings.leaveNow.includes('jumuah') && jumuah) {
        const [hours, minutes] = jumuah.split(':').map(Number);
        const friday = new Date(day);
        friday.setHours(hours, minutes, 0, 0);
        label = 'jumuah';
        target = friday.getTime();
        targetLabel = `Joumou’a à ${jumuah}`;
      } else {
        if (!settings.leaveNow.includes(key)) continue;
        const iqama = getIqamaTime(approved?.iqama?.[key], prayer, schedule.timezone);
        if (iqama) {
          const [hours, minutes] = iqama.split(':').map(Number);
          const iqamaDate = new Date(day);
          iqamaDate.setHours(hours, minutes, 0, 0);
          target = iqamaDate.getTime();
          targetLabel = `iqama à ${iqama}`;
        }
      }

      const at = target - (travel.minutes + ARRIVAL_MARGIN_MIN) * 60_000;
      if (at <= now || at > horizon) continue;
      planned.push({
        at, route, key: `leave-${label}-${target}`,
        title: `Pars maintenant pour ${PRAYER_LABELS[label]}`,
        body: `${mosque.name} · ${travel.minutes} min ${travel.mode}, ${targetLabel}.`,
      });
    }
  }
  return planned;
}

let refreshQueue: Promise<void> = Promise.resolve();
const REFRESHED_AT_KEY = 'oummah.mosques.reminders.refreshed-at.v1';
const REFRESH_INTERVAL_MS = 3 * 60 * 60_000;

/**
 * Reschedules every mosque reminder. Safe to call often (queued, never throws): without `force`,
 * it runs at most every 3 hours.
 */
export function refreshMosqueReminders(force = false): Promise<void> {
  refreshQueue = refreshQueue.then(async () => {
    try {
      const last = Number(await AsyncStorage.getItem(REFRESHED_AT_KEY).catch(() => null)) || 0;
      if (!force && Date.now() - last < REFRESH_INTERVAL_MS) return;
      await AsyncStorage.setItem(REFRESHED_AT_KEY, String(Date.now())).catch(() => undefined);
      const all = Object.values(await readAll());
      const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
      await Promise.all(scheduled
        .filter((item) => (item.content.data as Record<string, unknown> | undefined)?.notificationOwner === OWNER)
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier).catch(() => undefined)));
      if (all.length === 0) return;
      if (!permissionGranted(await Notifications.getPermissionsAsync())) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL, {
          name: 'Ma mosquée',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 200, 100, 200],
          sound: 'default',
        });
      }

      const origin = all.some((settings) => settings.leaveNow.length > 0) ? await refreshOrigin(false) : null;
      const planned = (await Promise.all(all.map((settings) => plannedForMosque(settings, origin).catch(() => []))))
        .flat()
        .sort((a, b) => a.at - b.at)
        .slice(0, MAX_NOTIFICATIONS);

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
      // Reminders are best effort: next opening tries again.
    }
  });
  return refreshQueue;
}
