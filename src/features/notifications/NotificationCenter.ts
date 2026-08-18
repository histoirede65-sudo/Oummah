import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { HifzState } from "../hifz/HifzStore";
import type {
  MosquePrayerKey,
  MosquePrayerSchedule,
} from "../mosques/data/mosquePrayerTimes";

export type CenterReminderId =
  | "morning-dua"
  | "leave-home-dua"
  | "before-meal-dua"
  | "enter-home-dua"
  | "evening-dua"
  | "wake-up-dua"
  | "sleep-dua"
  | "hifz"
  | "verse-of-day"
  | "hadith-of-day"
  | "jummah";

export type CenterAlertMode = "sound" | "vibration" | "silent";

export type NotificationCenterPreferences = {
  systemEnabled: boolean;
  mode: CenterAlertMode;
  reminders: Record<CenterReminderId, boolean>;
};

export type NotificationCenterItem = {
  id: string;
  reminderId: CenterReminderId;
  category: "prayer" | "dua" | "learning" | "inspiration";
  title: string;
  body: string;
  timeLabel: string;
  route: string;
  icon: string;
  accent: string;
};

export const CENTER_REMINDERS: ReadonlyArray<{
  id: CenterReminderId;
  title: string;
  description: string;
  section: "Prières" | "Dou‘as" | "Apprentissage" | "Inspiration";
  time?: string;
}> = [
  { id: "jummah", title: "Préparer Joumou‘a", description: "Le vendredi avant l’heure de votre mosquée", section: "Prières" },
  { id: "morning-dua", title: "Dou‘as du matin", description: "Commencer la journée par les adhkār", section: "Dou‘as", time: "07:00" },
  { id: "leave-home-dua", title: "En sortant de chez soi", description: "Au début des horaires de bureau", section: "Dou‘as", time: "08:00" },
  { id: "before-meal-dua", title: "Avant de manger", description: "Rappel autour de la pause du midi", section: "Dou‘as", time: "12:15" },
  { id: "enter-home-dua", title: "En rentrant chez soi", description: "À la fin des horaires de bureau", section: "Dou‘as", time: "18:30" },
  { id: "evening-dua", title: "Dou‘as du soir", description: "Terminer la journée par les adhkār", section: "Dou‘as", time: "20:30" },
  { id: "wake-up-dua", title: "Au réveil", description: "L’invocation authentique du réveil", section: "Dou‘as", time: "06:45" },
  { id: "sleep-dua", title: "Avant de dormir", description: "L’invocation authentique avant le coucher", section: "Dou‘as", time: "22:30" },
  { id: "hifz", title: "Objectif mémorisation", description: "Versets restant à apprendre aujourd’hui", section: "Apprentissage", time: "18:00" },
  { id: "verse-of-day", title: "Verset du jour", description: "S’il n’a pas encore été consulté", section: "Inspiration", time: "13:00" },
  { id: "hadith-of-day", title: "Hadith du jour", description: "Un rappel authentique chaque soir", section: "Inspiration", time: "21:00" },
];

export const DEFAULT_NOTIFICATION_CENTER_PREFERENCES: NotificationCenterPreferences = {
  systemEnabled: false,
  mode: "sound",
  reminders: {
    "morning-dua": true,
    "leave-home-dua": true,
    "before-meal-dua": true,
    "enter-home-dua": true,
    "evening-dua": true,
    "wake-up-dua": false,
    "sleep-dua": false,
    hifz: true,
    "verse-of-day": true,
    "hadith-of-day": true,
    jummah: true,
  },
};

const PREFERENCES_KEY = "oumma:notification-center-preferences:v1";
const READ_IDS_KEY = "oumma:notification-center-read:v1";
const SCHEDULED_IDS_KEY = "oumma:notification-center-scheduled:v1";
const NOTIFICATION_OWNER = "oummah-notification-center";
const LEGACY_PRAYER_TITLES = ["fajr", "dhuhr", "dohr", "asr", "maghrib", "isha"] as const;
const DAILY_VERSE_SELECTION = [
  { surahId: 1, verse: 5 },
  { surahId: 2, verse: 286 },
  { surahId: 2, verse: 45 },
  { surahId: 2, verse: 153 },
  { surahId: 2, verse: 186 },
  { surahId: 2, verse: 201 },
  { surahId: 2, verse: 255 },
  { surahId: 2, verse: 261 },
  { surahId: 3, verse: 139 },
  { surahId: 3, verse: 8 },
  { surahId: 3, verse: 26 },
  { surahId: 3, verse: 103 },
  { surahId: 3, verse: 159 },
  { surahId: 3, verse: 173 },
  { surahId: 3, verse: 200 },
  { surahId: 4, verse: 110 },
  { surahId: 4, verse: 36 },
  { surahId: 4, verse: 40 },
  { surahId: 4, verse: 86 },
  { surahId: 5, verse: 8 },
  { surahId: 5, verse: 2 },
  { surahId: 5, verse: 32 },
  { surahId: 5, verse: 100 },
  { surahId: 6, verse: 160 },
  { surahId: 6, verse: 54 },
  { surahId: 6, verse: 59 },
  { surahId: 6, verse: 162 },
  { surahId: 7, verse: 56 },
  { surahId: 7, verse: 31 },
  { surahId: 7, verse: 156 },
  { surahId: 8, verse: 46 },
  { surahId: 8, verse: 2 },
  { surahId: 9, verse: 51 },
  { surahId: 9, verse: 40 },
  { surahId: 9, verse: 71 },
  { surahId: 10, verse: 62 },
  { surahId: 10, verse: 57 },
  { surahId: 11, verse: 115 },
  { surahId: 11, verse: 6 },
  { surahId: 12, verse: 87 },
  { surahId: 12, verse: 18 },
  { surahId: 12, verse: 86 },
  { surahId: 12, verse: 90 },
  { surahId: 12, verse: 92 },
  { surahId: 13, verse: 28 },
  { surahId: 13, verse: 11 },
  { surahId: 14, verse: 7 },
  { surahId: 14, verse: 40 },
  { surahId: 15, verse: 49 },
  { surahId: 16, verse: 97 },
  { surahId: 16, verse: 90 },
  { surahId: 17, verse: 70 },
  { surahId: 17, verse: 23 },
  { surahId: 18, verse: 10 },
  { surahId: 18, verse: 46 },
  { surahId: 19, verse: 96 },
  { surahId: 20, verse: 46 },
  { surahId: 20, verse: 114 },
  { surahId: 21, verse: 83 },
  { surahId: 21, verse: 87 },
  { surahId: 23, verse: 1 },
  { surahId: 24, verse: 35 },
  { surahId: 25, verse: 63 },
  { surahId: 26, verse: 62 },
  { surahId: 27, verse: 19 },
  { surahId: 28, verse: 24 },
  { surahId: 29, verse: 69 },
  { surahId: 30, verse: 21 },
  { surahId: 31, verse: 17 },
  { surahId: 33, verse: 35 },
  { surahId: 35, verse: 34 },
  { surahId: 36, verse: 58 },
  { surahId: 39, verse: 53 },
  { surahId: 40, verse: 60 },
  { surahId: 41, verse: 30 },
  { surahId: 47, verse: 7 },
  { surahId: 48, verse: 4 },
  { surahId: 49, verse: 13 },
  { surahId: 50, verse: 16 },
  { surahId: 53, verse: 39 },
  { surahId: 55, verse: 60 },
  { surahId: 57, verse: 4 },
  { surahId: 58, verse: 11 },
  { surahId: 59, verse: 18 },
  { surahId: 64, verse: 16 },
  { surahId: 65, verse: 3 },
  { surahId: 67, verse: 2 },
  { surahId: 68, verse: 4 },
  { surahId: 73, verse: 8 },
  { surahId: 89, verse: 27 },
  { surahId: 90, verse: 17 },
  { surahId: 91, verse: 9 },
  { surahId: 92, verse: 5 },
  { surahId: 93, verse: 3 },
  { surahId: 94, verse: 5 },
  { surahId: 95, verse: 4 },
  { surahId: 96, verse: 1 },
  { surahId: 97, verse: 3 },
  { surahId: 98, verse: 7 },
  { surahId: 103, verse: 3 },
] as const;

function versesAreConsecutive(
  first: (typeof DAILY_VERSE_SELECTION)[number],
  second: (typeof DAILY_VERSE_SELECTION)[number],
) {
  return (
    first.surahId === second.surahId &&
    Math.abs(first.verse - second.verse) <= 1
  );
}

function dailyVerseIndex(dayNumber: number) {
  let value = (dayNumber ^ 0x9e3779b9) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 0x21f0aaad) >>> 0;
  value = Math.imul(value ^ (value >>> 15), 0x735a2d97) >>> 0;
  return (value ^ (value >>> 15)) >>> 0;
}

export function verseOfDay(date = new Date()) {
  const dayNumber = Math.floor(Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  ) / 86_400_000);
  const todayIndex = dailyVerseIndex(dayNumber) % DAILY_VERSE_SELECTION.length;
  const yesterdayIndex =
    dailyVerseIndex(dayNumber - 1) % DAILY_VERSE_SELECTION.length;
  const yesterdayVerse = DAILY_VERSE_SELECTION[yesterdayIndex];
  let selectedIndex = todayIndex;
  while (
    versesAreConsecutive(
      DAILY_VERSE_SELECTION[selectedIndex],
      yesterdayVerse,
    )
  ) {
    selectedIndex = (selectedIndex + 1) % DAILY_VERSE_SELECTION.length;
  }

  return DAILY_VERSE_SELECTION[selectedIndex];
}

export function verseOfDayRoute(date = new Date()) {
  const dailyVerse = verseOfDay(date);
  return `/surah/${dailyVerse.surahId}?verse=${dailyVerse.verse}&direct=1`;
}

function normalizedNotificationText(value: unknown) {
  return typeof value === "string" ? value.toLocaleLowerCase("fr-FR") : "";
}

function isLegacyPassedPrayerNotification(title: unknown, body: unknown) {
  const normalizedTitle = normalizedNotificationText(title);
  const normalizedBody = normalizedNotificationText(body);
  const mentionsPrayer = LEGACY_PRAYER_TITLES.some((prayer) => normalizedTitle.includes(prayer));
  return (
    (mentionsPrayer && (normalizedTitle.includes("passée") || normalizedTitle.includes("passee"))) ||
    normalizedBody.includes("avez-vous accompli cette prière") ||
    normalizedBody.includes("avez-vous accompli cette priere") ||
    normalizedBody.includes("faire le point")
  );
}

function isCenterScheduledNotification(notification: Notifications.NotificationRequest) {
  const data = notification.content.data as Record<string, unknown> | undefined;
  if (data?.notificationOwner === NOTIFICATION_OWNER) return true;
  if (typeof data?.reminderId === "string" && CENTER_REMINDERS.some((item) => item.id === data.reminderId)) return true;

  const title = normalizedNotificationText(notification.content.title);
  const route = typeof data?.route === "string" ? data.route : "";
  return (
    CENTER_REMINDERS.some((item) => normalizedNotificationText(item.title) === title) ||
    route.includes("open=daily") ||
    route.includes("section=morning") ||
    route.includes("section=evening") ||
    isLegacyPassedPrayerNotification(notification.content.title, notification.content.body)
  );
}

async function cleanupPresentedNotificationDuplicates() {
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

function localDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export async function loadNotificationCenterPreferences() {
  const raw = await AsyncStorage.getItem(PREFERENCES_KEY).catch(() => null);
  if (!raw) return DEFAULT_NOTIFICATION_CENTER_PREFERENCES;

  try {
    const stored = JSON.parse(raw) as Partial<NotificationCenterPreferences>;
    return {
      ...DEFAULT_NOTIFICATION_CENTER_PREFERENCES,
      ...stored,
      reminders: {
        ...DEFAULT_NOTIFICATION_CENTER_PREFERENCES.reminders,
        ...stored.reminders,
      },
    };
  } catch {
    return DEFAULT_NOTIFICATION_CENTER_PREFERENCES;
  }
}

export function saveNotificationCenterPreferences(
  preferences: NotificationCenterPreferences,
) {
  return AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function loadReadNotificationIds() {
  const raw = await AsyncStorage.getItem(READ_IDS_KEY).catch(() => null);
  if (!raw) return [] as string[];
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [] as string[];
  }
}

export function saveReadNotificationIds(ids: readonly string[]) {
  return AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify(ids.slice(-100)));
}

function hifzRemaining(state: HifzState | null, now: Date) {
  if (!state) return null;
  const today = localDateKey(now);
  const learnedToday = state.sessions
    .filter((session) => session.date === today)
    .reduce((sum, session) => sum + session.learned, 0);
  return Math.max(0, state.dailyTarget - learnedToday);
}

function timeReached(time: string, now: Date) {
  const [hours, minutes] = time.split(":").map(Number);
  return now.getHours() * 60 + now.getMinutes() >= hours * 60 + minutes;
}

export function buildNotificationCenterItems({
  preferences,
  schedule,
  hifzState,
  mosqueName,
  now = new Date(),
}: {
  preferences: NotificationCenterPreferences;
  schedule: MosquePrayerSchedule | null;
  hifzState: HifzState | null;
  mosqueName?: string;
  now?: Date;
}) {
  const items: NotificationCenterItem[] = [];
  const day = localDateKey(now);
  const enabled = preferences.reminders;
  const dailyVerseRoute = verseOfDayRoute(now);
  const dailyVerseReference = dailyVerseRoute.match(/surah\/(\d+)\?verse=(\d+)/);


  const timedItems: ReadonlyArray<{
    id: CenterReminderId;
    time: string;
    title: string;
    body: string;
    route: string;
    category: NotificationCenterItem["category"];
    icon: string;
    accent: string;
  }> = [
    { id: "wake-up-dua", time: "06:45", title: "Au réveil", body: "Commencez votre journée avec l’invocation authentique du réveil.", route: "/dua?section=sleep&focus=wake-up", category: "dua", icon: "sunny-outline", accent: "#F4C95D" },
    { id: "morning-dua", time: "07:00", title: "Dou‘as du matin", body: "Commencez la journée avec les adhkār authentiques du matin.", route: "/dua?section=morning", category: "dua", icon: "sunny-outline", accent: "#F4C95D" },
    { id: "leave-home-dua", time: "08:00", title: "Avant de sortir", body: "Pensez à l’invocation en sortant de chez vous.", route: "/dua?section=home&focus=leave", category: "dua", icon: "exit-outline", accent: "#E3A85F" },
    { id: "before-meal-dua", time: "12:15", title: "Avant de manger", body: "Un rappel simple : prononcez le nom d’Allah avant votre repas.", route: "/dua?section=food&focus=before-meal", category: "dua", icon: "restaurant-outline", accent: "#CF9561" },
    { id: "verse-of-day", time: "13:00", title: "Votre verset du jour vous attend", body: dailyVerseReference ? `Découvrez aujourd’hui le verset ${dailyVerseReference[1]}:${dailyVerseReference[2]}.` : "Quelques minutes de lecture peuvent éclairer toute votre journée.", route: dailyVerseRoute, category: "inspiration", icon: "book-outline", accent: "#A878D0" },
    { id: "hifz", time: "18:00", title: "Objectif Hifz", body: "Reprenez votre mémorisation là où vous l’avez laissée.", route: "/hifz", category: "learning", icon: "school-outline", accent: "#6BBCA8" },
    { id: "enter-home-dua", time: "18:30", title: "En rentrant chez vous", body: "Pensez à l’invocation en entrant dans votre foyer.", route: "/dua?section=home&focus=enter", category: "dua", icon: "home-outline", accent: "#D8A767" },
    { id: "evening-dua", time: "20:30", title: "Dou‘as du soir", body: "Prenez un moment pour les adhkār authentiques du soir.", route: "/dua?section=evening", category: "dua", icon: "moon-outline", accent: "#8D78CB" },
    { id: "hadith-of-day", time: "21:00", title: "Hadith du jour", body: "Votre rappel du jour n’a pas encore été consulté.", route: "/hadiths?open=daily", category: "inspiration", icon: "chatbubble-ellipses-outline", accent: "#C98CBA" },
    { id: "sleep-dua", time: "22:30", title: "Avant de dormir", body: "Terminez la journée avec l’invocation authentique du coucher.", route: "/dua?section=sleep&focus=bedtime", category: "dua", icon: "bed-outline", accent: "#7D70BC" },
  ];

  timedItems.forEach((item) => {
    if (!enabled[item.id] || !timeReached(item.time, now)) return;
    const remaining = item.id === "hifz" ? hifzRemaining(hifzState, now) : null;
    if (item.id === "hifz" && remaining === 0) return;
    items.push({
      id: `${day}:${item.id}`,
      reminderId: item.id,
      category: item.category,
      title: item.title,
      body:
        item.id === "hifz" && remaining
          ? `Il vous reste ${remaining} verset${remaining > 1 ? "s" : ""} pour atteindre votre objectif du jour.`
          : item.body,
      timeLabel: item.time,
      route: item.route,
      icon: item.icon,
      accent: item.accent,
    });
  });

  if (enabled.jummah && now.getDay() === 5) {
    const dhuhr = schedule?.prayers.find((prayer) => prayer.key === "Dhuhr");
    items.unshift({
      id: `${day}:jummah`,
      reminderId: "jummah",
      category: "prayer",
      title: "Joumou‘a aujourd’hui",
      body: mosqueName
        ? `Préparez-vous pour la prière du vendredi à ${mosqueName}.`
        : "Préparez-vous pour la prière du vendredi et ses bienfaits.",
      timeLabel: dhuhr?.time ?? "Vendredi",
      route: "/mosques",
      icon: "business-outline",
      accent: "#E8B84E",
    });
  }

  return items;
}

function isPermissionGranted(status: Notifications.NotificationPermissionsStatus) {
  if (Platform.OS !== "ios") return status.granted;
  return (
    status.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    status.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

async function configureChannel(mode: CenterAlertMode) {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(`oummah-reminders-${mode}`, {
    name: "Rappels OUMMAH",
    importance:
      mode === "silent"
        ? Notifications.AndroidImportance.DEFAULT
        : Notifications.AndroidImportance.HIGH,
    sound: mode === "sound" ? "default" : undefined,
    vibrationPattern: mode === "vibration" ? [0, 300, 180, 300] : [],
    lightColor: "#F2B53D",
  });
}

export async function requestNotificationCenterPermission(mode: CenterAlertMode) {
  await configureChannel(mode);
  const current = await Notifications.getPermissionsAsync();
  if (isPermissionGranted(current)) return true;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: true },
  });
  return isPermissionGranted(requested);
}

async function cancelScheduledCenterNotifications() {
  const raw = await AsyncStorage.getItem(SCHEDULED_IDS_KEY).catch(() => null);
  let storedIds: string[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      storedIds = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
    } catch {
      storedIds = [];
    }
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  const discoveredIds = scheduled
    .filter(isCenterScheduledNotification)
    .map((notification) => notification.identifier);
  const ids = [...new Set([...storedIds, ...discoveredIds])];

  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)),
  );
  await AsyncStorage.removeItem(SCHEDULED_IDS_KEY);
  await cleanupPresentedNotificationDuplicates();
}

function notificationContent(
  title: string,
  body: string,
  mode: CenterAlertMode,
  route: string,
  reminderId: CenterReminderId,
) {
  return {
    title,
    body,
    data: { route, reminderId, notificationOwner: NOTIFICATION_OWNER },
    sound: mode === "sound" ? "default" : false,
    vibrate: mode === "vibration" ? [0, 300, 180, 300] : [],
    color: "#F2B53D",
  };
}

async function syncNotificationCenterScheduleInternal(
  preferences: NotificationCenterPreferences,
  schedule: MosquePrayerSchedule | null,
  mosqueName?: string,
) {
  await cancelScheduledCenterNotifications();
  if (!preferences.systemEnabled) return;

  const permission = await Notifications.getPermissionsAsync();
  if (!isPermissionGranted(permission)) return;
  await configureChannel(preferences.mode);
  const channelId = `oummah-reminders-${preferences.mode}`;
  const ids: string[] = [];

  for (const reminder of CENTER_REMINDERS) {
    if (!preferences.reminders[reminder.id] || !reminder.time) continue;
    const [hour, minute] = reminder.time.split(":").map(Number);
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content: notificationContent(
          reminder.title,
          reminder.description,
          preferences.mode,
          reminder.id === "verse-of-day"
            ? "/verse-of-day"
            : reminder.id === "hadith-of-day"
              ? "/hadiths?open=daily"
              : reminder.id === "hifz"
                ? "/hifz"
                : reminder.id === "morning-dua"
                  ? "/dua?section=morning"
                  : reminder.id === "evening-dua"
                    ? "/dua?section=evening"
                    : reminder.id === "wake-up-dua"
                      ? "/dua?section=sleep&focus=wake-up"
                      : reminder.id === "sleep-dua"
                        ? "/dua?section=sleep&focus=bedtime"
                        : reminder.id === "before-meal-dua"
                          ? "/dua?section=food&focus=before-meal"
                          : reminder.id === "leave-home-dua"
                            ? "/dua?section=home&focus=leave"
                            : reminder.id === "enter-home-dua"
                              ? "/dua?section=home&focus=enter"
                              : "/dua",
          reminder.id,
        ),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId,
        },
      }),
    );
  }


  if (preferences.reminders.jummah && schedule) {
    const dhuhr = schedule.prayers.find((prayer) => prayer.key === ("Dhuhr" as MosquePrayerKey));
    if (dhuhr) {
      const prayerDate = new Date(dhuhr.timestamp);
      let hour = prayerDate.getHours() - 1;
      if (hour < 0) hour = 0;
      ids.push(
        await Notifications.scheduleNotificationAsync({
          content: notificationContent(
            "Préparez Joumou‘a",
            mosqueName ? `La prière du vendredi approche à ${mosqueName}.` : "La prière du vendredi approche.",
            preferences.mode,
            "/mosques",
            "jummah",
          ),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: 6,
            hour,
            minute: prayerDate.getMinutes(),
            channelId,
          },
        }),
      );
    }
  }

  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(ids));
}


let notificationCenterSyncQueue: Promise<void> = Promise.resolve();

export function syncNotificationCenterSchedule(
  preferences: NotificationCenterPreferences,
  schedule: MosquePrayerSchedule | null,
  mosqueName?: string,
) {
  const run = () => syncNotificationCenterScheduleInternal(preferences, schedule, mosqueName);
  notificationCenterSyncQueue = notificationCenterSyncQueue.then(run, run);
  return notificationCenterSyncQueue;
}
