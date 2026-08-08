import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import { Platform } from "react-native";

import type {
  MosquePrayerSchedule,
  MosquePrayerTime,
} from "../mosques/data/mosquePrayerTimes";
import { getNearbyMosques, type NearbyMosque } from "../mosques/data/nearbyMosques";
import { getMainMosque } from "../mosques/data/mosquePreferences";
import type { AdhanAlertMode, AdhanPreferences, AdhanVoice } from "./AdhanPreferences";

const SCHEDULED_IDS_KEY = "oumma:adhan-notification-ids:v1";
const NOTIFICATION_OWNER = "oummah-adhan";

function normalizedNotificationText(value: unknown) {
  return typeof value === "string" ? value.toLocaleLowerCase("fr-FR") : "";
}

function isLegacyPassedPrayerNotification(title: unknown, body: unknown) {
  const normalizedTitle = normalizedNotificationText(title);
  const normalizedBody = normalizedNotificationText(body);
  return (
    normalizedTitle.includes("est passée") ||
    normalizedTitle.includes("est passee") ||
    normalizedBody.includes("avez-vous accompli cette prière") ||
    normalizedBody.includes("avez-vous accompli cette priere") ||
    normalizedBody.includes("faire le point")
  );
}

function isAdhanScheduledNotification(notification: Notifications.NotificationRequest) {
  const data = notification.content.data as Record<string, unknown> | undefined;
  if (data?.notificationOwner === NOTIFICATION_OWNER) return true;
  if (typeof data?.prayer === "string" && data?.hadithReference) return true;
  if (isLegacyPassedPrayerNotification(notification.content.title, notification.content.body)) return true;

  const title = normalizedNotificationText(notification.content.title);
  return ["fajr", "dhuhr", "dohr", "asr", "maghrib", "isha"].some(
    (prayer) => title.startsWith(prayer) && (title.includes("heure de prière") || title.includes("dans ")),
  );
}

async function cleanupPresentedPrayerNotifications() {
  const presented = await Notifications.getPresentedNotificationsAsync().catch(() => []);
  const seen = new Set<string>();
  const idsToDismiss: string[] = [];

  for (const notification of presented) {
    const { title, body, data } = notification.request.content;
    const route = typeof data?.route === "string" ? data.route : "";
    const key = `${normalizedNotificationText(title)}|${normalizedNotificationText(body)}|${route}`;
    if (isLegacyPassedPrayerNotification(title, body) || seen.has(key)) {
      idsToDismiss.push(notification.request.identifier);
    } else {
      seen.add(key);
    }
  }

  await Promise.all(
    idsToDismiss.map((id) => Notifications.dismissNotificationAsync(id).catch(() => undefined)),
  );
}

function duplicateScheduledNotificationIds(
  scheduled: readonly Notifications.NotificationRequest[],
) {
  const seen = new Set<string>();
  const duplicateIds: string[] = [];

  for (const notification of scheduled) {
    const { title, body, data } = notification.content;
    const route = typeof data?.route === "string" ? data.route : "";
    const key = `${normalizedNotificationText(title)}|${normalizedNotificationText(body)}|${route}|${JSON.stringify(notification.trigger)}`;
    if (seen.has(key)) duplicateIds.push(notification.identifier);
    else seen.add(key);
  }

  return duplicateIds;
}
const NEARBY_MOSQUE_MAX_DISTANCE_METERS = 3_000;

const PRAYER_HADITHS: Record<
  MosquePrayerTime["key"],
  { text: string; reference: string }
> = {
  Fajr: {
    text: "Celui qui accomplit la prière du Fajr est sous la protection d’Allah.",
    reference: "Sahih Muslim, 657",
  },
  Dhuhr: {
    text: "Parmi les œuvres les plus aimées d’Allah : la prière accomplie à son heure.",
    reference: "Sahih al-Bukhari, 527",
  },
  Asr: {
    text: "Celui qui délaisse la prière du ‘Asr voit ses œuvres annulées.",
    reference: "Sahih al-Bukhari, 553",
  },
  Maghrib: {
    text: "Les cinq prières effacent les fautes comme l’eau enlève les impuretés.",
    reference: "Sahih al-Bukhari, 528",
  },
  Isha: {
    text: "Celui qui accomplit ‘Isha en groupe est comme s’il avait prié la moitié de la nuit.",
    reference: "Sahih Muslim, 656",
  },
};

type NotificationMosque = Pick<
  NearbyMosque,
  "id" | "name" | "latitude" | "longitude" | "distanceMeters"
>;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function isGranted(status: Notifications.NotificationPermissionsStatus) {
  if (Platform.OS !== "ios") return status.granted;

  return (
    status.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    status.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

async function configureAndroidChannels() {
  if (Platform.OS !== "android") return;

  await Promise.all([
    ...(["makkah", "madinah", "egypt"] as const).map((voice) =>
      Notifications.setNotificationChannelAsync(`adhan-sound-${voice}`, {
      name: `Adhan — ${voice === "makkah" ? "La Mecque" : voice === "madinah" ? "Médine" : "Égypte"}`,
      importance: Notifications.AndroidImportance.HIGH,
      sound: `adhan_${voice}.mp3`,
      vibrationPattern: [0, 280, 160, 280],
      lightColor: "#F2B53D",
      }),
    ),
    Notifications.setNotificationChannelAsync("adhan-notification", {
      name: "Notification Adhan",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 280, 160, 280],
      lightColor: "#F2B53D",
    }),
    Notifications.setNotificationChannelAsync("adhan-vibration", {
      name: "Adhan avec vibration",
      importance: Notifications.AndroidImportance.HIGH,
      sound: undefined,
      vibrationPattern: [0, 350, 180, 350],
      lightColor: "#F2B53D",
    }),
    Notifications.setNotificationChannelAsync("adhan-silent", {
      name: "Adhan silencieux",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: undefined,
      vibrationPattern: [],
      lightColor: "#F2B53D",
    }),
  ]);
}

export async function requestAdhanNotificationPermission() {
  await configureAndroidChannels();

  const existing = await Notifications.getPermissionsAsync();
  if (isGranted(existing)) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });

  return isGranted(requested);
}

async function cancelAdhanNotifications() {
  const rawIds = await AsyncStorage.getItem(SCHEDULED_IDS_KEY).catch(() => null);
  let storedIds: string[] = [];
  if (rawIds) {
    try {
      const parsed = JSON.parse(rawIds);
      storedIds = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
    } catch {
      storedIds = [];
    }
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  const discoveredIds = scheduled
    .filter(isAdhanScheduledNotification)
    .map((notification) => notification.identifier);
  const duplicateIds = duplicateScheduledNotificationIds(scheduled);
  const ids = [...new Set([...storedIds, ...discoveredIds, ...duplicateIds])];

  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)),
  );
  await AsyncStorage.removeItem(SCHEDULED_IDS_KEY);
  await cleanupPresentedPrayerNotifications();
}

function channelIdFor(mode: AdhanAlertMode, voice: AdhanVoice) {
  return mode === "adhan" ? `adhan-sound-${voice}` : mode === "notification" ? "adhan-notification" : `adhan-${mode}`;
}

function contentFor(
  prayer: MosquePrayerTime,
  preferences: AdhanPreferences,
  mosque?: NotificationMosque,
) {
  const isAdvanceReminder = preferences.leadMinutes > 0;
  const hadith = PRAYER_HADITHS[prayer.key];

  return {
    title: isAdvanceReminder
      ? `${prayer.label} dans ${preferences.leadMinutes} min`
      : `${prayer.label} — heure de prière`,
    body: `« ${hadith.text} » — ${hadith.reference}`,
    data: {
      route: "/",
      prayer: prayer.key,
      notificationOwner: NOTIFICATION_OWNER,
      notificationKey: `adhan:${prayer.key}:${prayer.timestamp}:${preferences.leadMinutes}`,
      hadithText: hadith.text,
      hadithReference: hadith.reference,
      ...(mosque
        ? {
            mosqueName: mosque.name,
            ...(mosque.id ? { mosqueId: mosque.id } : {}),
            mosqueLatitude: mosque.latitude,
            mosqueLongitude: mosque.longitude,
            mosqueDistanceMeters: Math.round(mosque.distanceMeters),
          }
        : {}),
    },
    sound:
      preferences.mode === "adhan"
        ? `adhan_${preferences.voice}.mp3`
        : preferences.mode === "notification"
          ? "default"
          : false,
    vibrate: preferences.mode === "vibration" ? [0, 350, 180, 350] : [],
    color: "#F2B53D",
  };
}

async function findNearbyNotificationMosque(): Promise<NotificationMosque | undefined> {
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (permission.status !== Location.PermissionStatus.GRANTED) return undefined;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const [nearbyMosques, favorite] = await Promise.all([
      getNearbyMosques(position.coords.latitude, position.coords.longitude),
      getMainMosque().catch(() => null),
    ]);
    const reliableMosques = nearbyMosques.filter(
      (mosque) =>
        mosque.source === "openstreetmap" &&
        Number.isFinite(mosque.distanceMeters) &&
        mosque.distanceMeters <= NEARBY_MOSQUE_MAX_DISTANCE_METERS &&
        Number.isFinite(mosque.latitude) &&
        Number.isFinite(mosque.longitude),
    );
    if (reliableMosques.length === 0) return undefined;

    const selected =
      (favorite ? reliableMosques.find((mosque) => mosque.id === favorite.id) : undefined) ??
      [...reliableMosques].sort((left, right) => left.distanceMeters - right.distanceMeters)[0];
    if (!selected) return undefined;

    return {
      id: selected.id,
      name: selected.name,
      latitude: selected.latitude,
      longitude: selected.longitude,
      distanceMeters: selected.distanceMeters,
    };
  } catch {
    return undefined;
  }
}

async function syncAdhanNotificationsInternal(
  schedule: MosquePrayerSchedule,
  preferences: AdhanPreferences,
) {
  await cancelAdhanNotifications();

  if (!preferences.enabled) return;

  const permission = await Notifications.getPermissionsAsync();
  if (!isGranted(permission)) return;

  await configureAndroidChannels();

  const nearbyMosque = await Promise.race([
    findNearbyNotificationMosque(),
    new Promise<NotificationMosque | undefined>((resolve) =>
      setTimeout(() => resolve(undefined), 2_500),
    ),
  ]);

  const leadMilliseconds = preferences.leadMinutes * 60 * 1_000;
  const prayers = [
    ...schedule.prayers,
    schedule.tomorrowFajr,
    ...(schedule.futurePrayers ?? []).filter(
      (prayer) => prayer.timestamp !== schedule.tomorrowFajr.timestamp,
    ),
  ].filter(
    (prayer) =>
      preferences.prayers[prayer.key] && prayer.timestamp - leadMilliseconds > Date.now(),
  );

  const ids = await Promise.all(
    prayers.map((prayer) =>
      Notifications.scheduleNotificationAsync({
        content: contentFor(prayer, preferences, nearbyMosque),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(prayer.timestamp - leadMilliseconds),
          channelId: channelIdFor(preferences.mode, preferences.voice),
        },
      }),
    ),
  );

  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(ids));
}

let adhanSyncQueue: Promise<void> = Promise.resolve();

export function syncAdhanNotifications(
  schedule: MosquePrayerSchedule,
  preferences: AdhanPreferences,
) {
  const run = () => syncAdhanNotificationsInternal(schedule, preferences);
  adhanSyncQueue = adhanSyncQueue.then(run, run);
  return adhanSyncQueue;
}
