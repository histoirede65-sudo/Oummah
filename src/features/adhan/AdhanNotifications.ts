import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import Constants, { AppOwnership } from "expo-constants";
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
const PRAYER_NOTIFICATION_PREFIX = "prayer:";
const IS_EXPO_GO = Constants.appOwnership === AppOwnership.Expo;
export const ADHAN_NOTIFICATION_CATEGORY = "adhan_control";
export const STOP_ADHAN_ACTION = "stop_adhan";

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

function scheduledTriggerTimestamp(notification: Notifications.NotificationRequest) {
  const trigger = notification.trigger as { date?: Date | number | string } | null;
  if (!trigger?.date) return null;
  const timestamp = trigger.date instanceof Date
    ? trigger.date.getTime()
    : new Date(trigger.date).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function prayerDateKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function prayerNotificationKey(prayer: MosquePrayerTime) {
  return `${PRAYER_NOTIFICATION_PREFIX}${prayerDateKey(prayer.timestamp)}:${prayer.key.toLowerCase()}`;
}
const NEARBY_MOSQUE_MAX_DISTANCE_METERS = 3_000;

const PRAYER_HADITHS: Record<
  MosquePrayerTime["key"],
  ReadonlyArray<{ text: string; reference: string }>
> = {
  Fajr: [
    { text: "Celui qui accomplit la prière du Fajr est sous la protection d’Allah.", reference: "Sahih Muslim, 657" },
    { text: "Celui qui accomplit les prières de l’aube et de l’après-midi entrera au Paradis.", reference: "Sahih al-Bukhari, 574" },
    { text: "La prière est une lumière.", reference: "Sahih Muslim, 223" },
  ],
  Dhuhr: [
    { text: "Parmi les œuvres les plus aimées d’Allah : la prière accomplie à son heure.", reference: "Sahih al-Bukhari, 527" },
    { text: "Les cinq prières effacent les fautes comme l’eau enlève les impuretés.", reference: "Sahih al-Bukhari, 528" },
    { text: "La prière est une lumière.", reference: "Sahih Muslim, 223" },
  ],
  Asr: [
    { text: "Celui qui délaisse la prière du ‘Asr voit ses œuvres annulées.", reference: "Sahih al-Bukhari, 553" },
    { text: "Celui qui accomplit les prières de l’aube et de l’après-midi entrera au Paradis.", reference: "Sahih al-Bukhari, 574" },
    { text: "Parmi les œuvres les plus aimées d’Allah : la prière accomplie à son heure.", reference: "Sahih al-Bukhari, 527" },
  ],
  Maghrib: [
    { text: "Les cinq prières effacent les fautes comme l’eau enlève les impuretés.", reference: "Sahih al-Bukhari, 528" },
    { text: "La prière est une lumière.", reference: "Sahih Muslim, 223" },
    { text: "Parmi les œuvres les plus aimées d’Allah : la prière accomplie à son heure.", reference: "Sahih al-Bukhari, 527" },
  ],
  Isha: [
    { text: "Celui qui accomplit ‘Isha en groupe est comme s’il avait prié la moitié de la nuit.", reference: "Sahih Muslim, 656" },
    { text: "Si les gens savaient ce qu’il y a dans les prières de l’‘Isha et du Fajr, ils y viendraient même en rampant.", reference: "Sahih al-Bukhari, 721" },
    { text: "La prière est une lumière.", reference: "Sahih Muslim, 223" },
  ],
};

function hadithForPrayer(prayer: MosquePrayerTime) {
  const hadiths = PRAYER_HADITHS[prayer.key];
  const dayNumber = Math.floor(prayer.timestamp / (24 * 60 * 60 * 1_000));
  return hadiths[dayNumber % hadiths.length];
}

type NotificationMosque = Pick<
  NearbyMosque,
  "id" | "name" | "latitude" | "longitude" | "distanceMeters"
>;

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data as Record<string, unknown> | undefined;
    const mode = data?.notificationMode;
    return {
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound:
      mode === "adhan" ||
      mode === "notification" ||
      mode === "sound" ||
      mode === undefined,
    shouldSetBadge: false,
    };
  },
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

  if (IS_EXPO_GO) {
    await Notifications.setNotificationChannelAsync("adhan-notification-v3", {
      name: "Notification Adhan",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 280, 160, 280],
      lightColor: "#F2B53D",
    });
    return;
  }

  await Promise.all([
    ...(["makkah", "madinah", "egypt", "birds"] as const).map((voice) =>
      Notifications.setNotificationChannelAsync(`adhan-sound-${voice}-v5`, {
      name: `Adhan — ${voice === "makkah" ? "La Mecque" : voice === "madinah" ? "Médine" : voice === "egypt" ? "Égypte" : "Oiseaux apaisants"}`,
      importance: Notifications.AndroidImportance.HIGH,
        sound: `adhan_${voice}_notification.wav`,
      vibrationPattern: [0, 280, 160, 280],
      lightColor: "#F2B53D",
      }),
    ),
    Notifications.setNotificationChannelAsync("adhan-notification-v3", {
      name: "Notification Adhan",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 280, 160, 280],
      lightColor: "#F2B53D",
    }),
    Notifications.setNotificationChannelAsync("adhan-vibration-v3", {
      name: "Adhan avec vibration",
      importance: Notifications.AndroidImportance.HIGH,
      sound: undefined,
      vibrationPattern: [0, 350, 180, 350],
      lightColor: "#F2B53D",
    }),
    Notifications.setNotificationChannelAsync("adhan-silent-v3", {
      name: "Adhan silencieux",
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: undefined,
      vibrationPattern: [],
      lightColor: "#F2B53D",
    }),
  ]);
}

async function configureAdhanNotificationCategory() {
  await Notifications.setNotificationCategoryAsync(
    ADHAN_NOTIFICATION_CATEGORY,
    [
      {
        identifier: STOP_ADHAN_ACTION,
        buttonTitle: "Arrêter l’adhan",
        options: {
          opensAppToForeground: true,
          isAuthenticationRequired: false,
          isDestructive: false,
        },
      },
    ],
  );
}

export async function requestAdhanNotificationPermission() {
  await Promise.all([
    configureAndroidChannels(),
    configureAdhanNotificationCategory(),
  ]);

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
  if (IS_EXPO_GO && mode === "adhan") return "adhan-notification-v3";
  return mode === "adhan" ? `adhan-sound-${voice}-v5` : mode === "notification" ? "adhan-notification-v3" : `adhan-${mode}-v3`;
}

function adhanSoundFor(mode: AdhanAlertMode, voice: AdhanVoice) {
  if (mode === "adhan") return `adhan_${voice}_notification.wav`;
  if (mode === "notification") return "default";
  return false;
}

export async function getAdhanNotificationDiagnostics() {
  const [permission, scheduled, channels] = await Promise.all([
    Notifications.getPermissionsAsync(),
    Notifications.getAllScheduledNotificationsAsync().catch(() => []),
    Platform.OS === "android"
      ? Notifications.getNotificationChannelsAsync().catch(() => [])
      : Promise.resolve([]),
  ]);

  const adhanScheduled = scheduled
    .filter(isAdhanScheduledNotification)
    .filter((notification) => {
      const data = notification.content.data as Record<string, unknown> | undefined;
      return data?.notificationTest !== true;
    })
    .map((notification) => {
      const data = notification.content.data as Record<string, unknown> | undefined;
      const trigger = notification.trigger as {
        date?: Date | number | string;
        channelId?: string;
      } | null;
      return {
        id: notification.identifier,
        prayer: typeof data?.prayer === "string" ? data.prayer : "?",
        dateKey: typeof data?.notificationDateKey === "string" ? data.notificationDateKey : null,
        triggerTimestamp: scheduledTriggerTimestamp(notification),
        trigger:
          trigger?.date instanceof Date
            ? trigger.date.toLocaleString()
            : trigger?.date
              ? new Date(trigger.date).toLocaleString()
              : "?",
        // Le readback natif peut exposer `custom` ou null au lieu du nom du
        // fichier. On affiche donc séparément la valeur demandée et le retour natif.
        sound: data?.notificationSound ?? null,
        nativeSound: notification.content.sound ?? null,
        channelId: trigger?.channelId ?? "?",
      };
    });

  const coverageByDate = new Map<string, Set<string>>();
  for (const notification of adhanScheduled) {
    const dateKey = typeof notification.dateKey === "string"
      ? notification.dateKey
      : notification.triggerTimestamp === null
        ? "?"
        : prayerDateKey(notification.triggerTimestamp);
    const prayers = coverageByDate.get(dateKey) ?? new Set<string>();
    prayers.add(notification.prayer.toLowerCase());
    coverageByDate.set(dateKey, prayers);
  }
  const coverage = [...coverageByDate.entries()]
    .filter(([dateKey]) => dateKey !== "?")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([dateKey, prayers]) => ({ dateKey, count: prayers.size, prayers: [...prayers].sort() }));
  const scheduledTimestamps = adhanScheduled
    .map((notification) => notification.triggerTimestamp)
    .filter((timestamp): timestamp is number => timestamp !== null)
    .sort((left, right) => left - right);

  return {
    permission: {
      status: permission.status,
      granted: permission.granted,
      iosStatus: permission.ios?.status ?? null,
      iosAllowsSound: permission.ios?.allowsSound ?? null,
    },
    isExpoGo: IS_EXPO_GO,
    scheduled: adhanScheduled,
    coverage,
    firstScheduledAt: scheduledTimestamps[0] ?? null,
    lastScheduledAt: scheduledTimestamps[scheduledTimestamps.length - 1] ?? null,
    scheduledCount: adhanScheduled.length,
    duplicateCount: duplicateScheduledNotificationIds(
      scheduled
        .filter(isAdhanScheduledNotification)
        .filter((notification) => {
          const data = notification.content.data as Record<string, unknown> | undefined;
          return data?.notificationTest !== true;
        }),
    ).length,
    channels: channels.map((channel) => ({
      id: channel.id,
      name: channel.name,
      importance: channel.importance,
      sound: channel.sound ?? null,
      vibrationEnabled: channel.enableVibrate,
    })),
  };
}

export async function scheduleAdhanTestNotification() {
  const preferences = await loadAdhanPreferences();
  const permission = await Notifications.getPermissionsAsync();
  if (!isGranted(permission)) throw new Error("Notifications non autorisées");

  await configureAndroidChannels();
  await configureAdhanNotificationCategory();

  const fireAt = new Date(Date.now() + 18_000);
  const testPrayer: MosquePrayerTime = {
    key: "Fajr",
    label: "Test Adhan",
    time: fireAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    timestamp: fireAt.getTime(),
  };
  const id = await Notifications.scheduleNotificationAsync({
    content: contentFor(testPrayer, preferences, undefined, true),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: channelIdFor(preferences.mode, preferences.voice),
    },
  });

  return {
    id,
    fireAt: fireAt.toLocaleString(),
    sound: contentFor(testPrayer, preferences, undefined, true).sound,
    channelId: channelIdFor(preferences.mode, preferences.voice),
  };
}

function contentFor(
  prayer: MosquePrayerTime,
  preferences: AdhanPreferences,
  mosque?: NotificationMosque,
  isTest = false,
) {
  const isAdvanceReminder = preferences.leadMinutes > 0;
  const hadith = hadithForPrayer(prayer);
  const requestedSound = adhanSoundFor(preferences.mode, preferences.voice);
  const runtimeSound = IS_EXPO_GO && typeof requestedSound === "string" ? "default" : requestedSound;

  return {
    title: isAdvanceReminder
      ? `${prayer.label} dans ${preferences.leadMinutes} min`
      : `C’est l’heure de ${prayer.label}`,
    body: `« ${hadith.text} » — ${hadith.reference}`,
    categoryIdentifier: ADHAN_NOTIFICATION_CATEGORY,
    data: {
      route: "/",
      prayer: prayer.key,
      notificationOwner: NOTIFICATION_OWNER,
      notificationKey: prayerNotificationKey(prayer),
      notificationDateKey: prayerDateKey(prayer.timestamp),
      notificationMode: preferences.mode,
      notificationVoice: preferences.voice,
      notificationSound: requestedSound,
      notificationRuntimeSound: runtimeSound,
      ...(isTest ? { notificationTest: true } : {}),
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
    sound: runtimeSound,
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
  if (!preferences.enabled) {
    await cancelAdhanNotifications();
    return;
  }

  const permission = await Notifications.getPermissionsAsync();
  if (!isGranted(permission)) return;

  await configureAndroidChannels();
  await configureAdhanNotificationCategory();

  const nearbyMosque = await Promise.race([
    findNearbyNotificationMosque(),
    new Promise<NotificationMosque | undefined>((resolve) =>
      setTimeout(() => resolve(undefined), 2_500),
    ),
  ]);

  const leadMilliseconds = preferences.leadMinutes * 60 * 1_000;
  const prayers = [
    ...schedule.prayers,
    ...schedule.tomorrowPrayers,
    ...(schedule.futurePrayers ?? []).filter(
      (prayer) => prayer.timestamp !== schedule.tomorrowFajr.timestamp
    ),
  ].filter(
    (prayer) =>
      preferences.prayers[prayer.key] && prayer.timestamp - leadMilliseconds > Date.now(),
  );

  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  const existingPrayerNotifications = scheduled.filter(isAdhanScheduledNotification);
  const desiredByKey = new Map(prayers.map((prayer) => [prayerNotificationKey(prayer), prayer]));
  const retainedIds = new Set<string>();
  const retainedNotificationIds = new Set<string>();
  const idsToCancel = new Set<string>();

  for (const notification of existingPrayerNotifications) {
    const data = notification.content.data as Record<string, unknown> | undefined;
    const key = typeof data?.notificationKey === "string" ? data.notificationKey : null;
    const prayer = key ? desiredByKey.get(key) : undefined;
    const expectedTimestamp = prayer ? prayer.timestamp - leadMilliseconds : null;
    const actualTimestamp = scheduledTriggerTimestamp(notification);
    const unchanged = Boolean(
      prayer &&
      actualTimestamp !== null &&
      Math.abs(actualTimestamp - expectedTimestamp!) < 1_000 &&
      data?.notificationMode === preferences.mode &&
      data?.notificationVoice === preferences.voice &&
      data?.notificationSound === adhanSoundFor(preferences.mode, preferences.voice) &&
      (typeof data?.mosqueId === "string" ? data.mosqueId : null) === (nearbyMosque?.id ?? null),
    );

    if (unchanged && !retainedIds.has(key!)) {
      retainedIds.add(key!);
      retainedNotificationIds.add(notification.identifier);
    }
    else idsToCancel.add(notification.identifier);
  }

  await Promise.all(
    [...idsToCancel].map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );

  const ids = await Promise.all(
    prayers
      .filter((prayer) => !retainedIds.has(prayerNotificationKey(prayer)))
      .map((prayer) =>
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

  await AsyncStorage.setItem(
    SCHEDULED_IDS_KEY,
    JSON.stringify([...retainedNotificationIds, ...ids]),
  );
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
