import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getActiveLanguage, translate } from '../../i18n';
import { getValidSession } from '../auth/SupabaseAuthService';
import { resolveMosqueId } from './data/mosqueIdentity';
import { getMosquePosts } from './data/mosquePosts';

/**
 * Notifications liées à une mosquée, activées mosquée par mosquée :
 *  - Événements : rappel 2 h avant chaque événement validé.
 *  (« Partez maintenant » a été retiré : le trajet était calculé depuis la position du téléphone au moment
 *  de la programmation, jusqu'à 3 jours avant, et non depuis l'endroit où se trouve l'utilisateur.)
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
const EVENT_LEAD_MS = 2 * 60 * 60_000;
const MAX_NOTIFICATIONS = 40;
const IOS_MAX_NOTIFICATIONS = 6;

function timeLocale() {
  return getActiveLanguage() === 'fr' ? 'fr-FR' : 'en-GB';
}

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
  void syncPostSubscription(settings.mosque, settings.events);
  await refreshMosqueReminders(true);
  return { ok: true };
}

// ----- New announcements: server push --------------------------------------------------------
// Logged-in users subscribed to a mosque get a push as soon as an announcement or event is validated
// (sent by the database). Logged out, only the local 2 h reminder works.

async function syncPostSubscription(mosque: MosqueReminderSettings['mosque'], subscribed: boolean) {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/+$/, '');
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const session = await getValidSession().catch(() => null);
  if (!url || !key || !session?.accessToken) return;
  const mosqueId = await resolveMosqueId(mosque);
  if (!mosqueId) return;
  const headers = { apikey: key, Authorization: `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' };
  try {
    if (subscribed) {
      await fetch(`${url}/rest/v1/mosque_post_subscriptions?on_conflict=user_id,mosque_id`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'resolution=ignore-duplicates,return=minimal' },
        body: JSON.stringify({ mosque_id: mosqueId }),
      });
    } else {
      await fetch(`${url}/rest/v1/mosque_post_subscriptions?mosque_id=eq.${mosqueId}`, { method: 'DELETE', headers });
    }
  } catch {
    // Retried at the next refresh.
  }
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
  if (meters <= 2_500) return { minutes: Math.max(1, Math.round(meters / 80)), mode: 'walk' as const };
  return { minutes: Math.round(meters / 420) + 5, mode: 'car' as const };
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

async function plannedForMosque(settings: MosqueReminderSettings): Promise<Planned[]> {
  const { mosque } = settings;
  const route = mosqueRoute(mosque);
  const planned: Planned[] = [];
  const now = Date.now();

  if (settings.events) {
    const posts = await getMosquePosts(mosque.id);
    for (const post of posts) {
      if (post.kind !== 'event' || !post.startsAt) continue;
      const start = Date.parse(post.startsAt);
      const at = start - EVENT_LEAD_MS;
      if (at <= now || at > now + 14 * 86_400_000) continue;
      const time = new Date(start).toLocaleTimeString(timeLocale(), { hour: '2-digit', minute: '2-digit' });
      planned.push({
        at, route, key: `event-${post.id}`,
        title: translate('mosque.notifEventTitle', { title: post.title, time }),
        body: translate('mosque.notifEventBody', { mosque: mosque.name }),
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
      // Subscriptions made logged out (or offline) reach the account at the next refresh.
      for (const settings of all) if (settings.events) void syncPostSubscription(settings.mosque, true);
      const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
      await Promise.all(scheduled
        .filter((item) => (item.content.data as Record<string, unknown> | undefined)?.notificationOwner === OWNER)
        .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier).catch(() => undefined)));
      if (all.length === 0) return;
      if (!permissionGranted(await Notifications.getPermissionsAsync())) return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CHANNEL, {
          name: translate('mosques.myMosque'),
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 200, 100, 200],
          sound: 'default',
        });
      }

      const planned = (await Promise.all(all.map((settings) => plannedForMosque(settings).catch(() => []))))
        .flat()
        .sort((a, b) => a.at - b.at)
        // iOS keeps only 64 pending notifications for the whole app: the adhan comes first.
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
      // Reminders are best effort: next opening tries again.
    }
  });
  return refreshQueue;
}
