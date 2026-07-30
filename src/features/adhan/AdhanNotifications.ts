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
import type { AdhanAlertMode, AdhanPreferences } from "./AdhanPreferences";

const SCHEDULED_IDS_KEY = "oumma:adhan-notification-ids:v1";
const NEARBY_MOSQUE_MAX_DISTANCE_METERS = 3_000;

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
    Notifications.setNotificationChannelAsync("adhan-sound", {
      name: "Adhan avec son",
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
  const ids = rawIds ? (JSON.parse(rawIds) as string[]) : [];

  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)),
  );
  await AsyncStorage.removeItem(SCHEDULED_IDS_KEY);
}

function channelIdFor(mode: AdhanAlertMode) {
  return `adhan-${mode}`;
}

function contentFor(
  prayer: MosquePrayerTime,
  preferences: AdhanPreferences,
  mosque?: NotificationMosque,
) {
  const isAdvanceReminder = preferences.leadMinutes > 0;
  const mosqueText = mosque
    ? `Mosquée ${mosque.name} à environ ${Math.round(mosque.distanceMeters)} m de votre position.`
    : undefined;

  return {
    title: isAdvanceReminder
      ? `${prayer.label} dans ${preferences.leadMinutes} min`
      : `${prayer.label} — heure de prière`,
    body: mosqueText ?? (isAdvanceReminder
      ? "Préparez-vous pour la prière."
      : "L’adhan commence maintenant."
    ),
    data: {
      route: "/",
      prayer: prayer.key,
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
    sound: preferences.mode === "sound" ? "default" : false,
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

export async function syncAdhanNotifications(
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
  const prayers = [...schedule.prayers, schedule.tomorrowFajr].filter(
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
          channelId: channelIdFor(preferences.mode),
        },
      }),
    ),
  );

  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(ids));
}
