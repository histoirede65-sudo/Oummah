import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

import type { HifzState } from "../hifz/HifzStore";
import type {
  MosquePrayerKey,
  MosquePrayerSchedule,
} from "../mosques/data/mosquePrayerTimes";
import { isGoalComplete, type DailyGoal } from "../daily-goals/domain/DailyGoal";
import { goalRepository } from "../daily-goals/data/goalRepository";
import { goalProgressBridge } from "../daily-goals/services/goalProgressBridge";
import { alertSound, ensureReminderChannel, reminderChannelId, VIBRATION_PATTERN } from "./notificationChannels";
import { isNotificationPermissionGranted } from "./NotificationPermissions";
import { translate, type TranslationKey } from "../../i18n";
import { goalTitle } from "../daily-goals/presentation/goalText";

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
  | "daily-goals"
  | "jummah";

export type CenterAlertMode = "sound" | "vibration" | "silent";

export type NotificationCenterPreferences = {
  systemEnabled: boolean;
  mode: CenterAlertMode;
  reminders: Record<CenterReminderId, boolean>;
  reminderTimes?: Partial<Record<CenterReminderId, string>>;
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
  title: TranslationKey;
  description: TranslationKey;
  section: "Prières" | "Dou‘as" | "Apprentissage" | "Inspiration" | "Objectifs";
  time?: string;
}> = [
  { id: "jummah", title: "notif.jummah", description: "notif.jummahDesc", section: "Prières" },
  { id: "morning-dua", title: "notif.morning", description: "notif.morningDesc", section: "Dou‘as", time: "07:00" },
  { id: "leave-home-dua", title: "notif.leaveHome", description: "notif.leaveHomeDesc", section: "Dou‘as", time: "08:00" },
  { id: "before-meal-dua", title: "notif.meal", description: "notif.mealDesc", section: "Dou‘as", time: "12:15" },
  { id: "enter-home-dua", title: "notif.enterHome", description: "notif.enterHomeDesc", section: "Dou‘as", time: "18:30" },
  { id: "evening-dua", title: "notif.evening", description: "notif.eveningDesc", section: "Dou‘as", time: "20:30" },
  { id: "wake-up-dua", title: "notif.wake", description: "notif.wakeDesc", section: "Dou‘as", time: "06:45" },
  { id: "sleep-dua", title: "notif.sleep", description: "notif.sleepDesc", section: "Dou‘as", time: "22:30" },
  { id: "hifz", title: "notif.hifz", description: "notif.hifzDesc", section: "Apprentissage", time: "18:00" },
  { id: "verse-of-day", title: "notif.verse", description: "notif.verseDesc", section: "Inspiration", time: "13:00" },
  { id: "hadith-of-day", title: "notif.hadith", description: "notif.hadithDesc", section: "Inspiration", time: "21:00" },
  { id: "daily-goals", title: "notif.goals", description: "notif.goalsDesc", section: "Objectifs", time: "20:00" },
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
    "daily-goals": false,
    jummah: true,
  },
  reminderTimes: {
    "morning-dua": "07:00",
    "leave-home-dua": "08:00",
    "before-meal-dua": "12:15",
    "enter-home-dua": "18:30",
    "evening-dua": "20:30",
    "wake-up-dua": "06:45",
    "sleep-dua": "22:30",
  },
};

const PREFERENCES_KEY = "oumma:notification-center-preferences:v1";
const READ_IDS_KEY = "oumma:notification-center-read:v1";
const SCHEDULED_IDS_KEY = "oumma:notification-center-scheduled:v1";
const NOTIFICATION_OWNER = "oummah-notification-center";
const DAILY_GOALS_OWNER = "oummah-daily-goals-reminder";
const DAILY_GOALS_SCHEDULED_KEY = "oumma:daily-goals-reminder-scheduled:v1";
const readStatusListeners = new Set<() => void>();
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
  if (data?.notificationOwner === DAILY_GOALS_OWNER) return false;
  if (data?.notificationOwner === NOTIFICATION_OWNER) return true;
  if (typeof data?.reminderId === "string" && CENTER_REMINDERS.some((item) => item.id === data.reminderId)) return true;

  const title = normalizedNotificationText(notification.content.title);
  const route = typeof data?.route === "string" ? data.route : "";
  return (
    CENTER_REMINDERS.some((item) => normalizedNotificationText(translate(item.title)) === title) ||
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

export function notificationCenterReadId(
  reminderId: unknown,
  date = new Date(),
) {
  if (
    typeof reminderId !== "string" ||
    !CENTER_REMINDERS.some((reminder) => reminder.id === reminderId)
  ) {
    return null;
  }

  return `${localDateKey(date)}:${reminderId}`;
}

// Older notifications (including Joumou'a) do not always carry reminderId.
export function notificationResponseReadId(notification: Notifications.Notification) {
  const data = notification.request.content.data;
  const date = new Date(notification.date);
  const explicitId = notificationCenterReadId(data?.reminderId, date);
  if (explicitId) return explicitId;
  if (data?.notificationOwner === "oummah-jumuah") {
    return notificationCenterReadId("jummah", date);
  }
  const route = typeof data?.route === "string" ? data.route.trim() : "";
  const remindersByRoute: Record<string, CenterReminderId> = {
    "/jumuah": "jummah",
    "/verse-of-day": "verse-of-day",
    "/hadiths?open=daily": "hadith-of-day",
    "/hifz": "hifz",
    "/dua?section=morning": "morning-dua",
    "/dua?section=evening": "evening-dua",
    "/dua?section=sleep&focus=wake-up": "wake-up-dua",
    "/dua?section=sleep&focus=bedtime": "sleep-dua",
    "/dua?section=food&focus=before-meal": "before-meal-dua",
    "/dua?section=home&focus=leave": "leave-home-dua",
    "/dua?section=home&focus=enter": "enter-home-dua",
  };
  return notificationCenterReadId(remindersByRoute[route], date);
}

export function subscribeNotificationReadStatus(listener: () => void) {
  readStatusListeners.add(listener);
  return () => readStatusListeners.delete(listener);
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
      reminderTimes: {
        ...DEFAULT_NOTIFICATION_CENTER_PREFERENCES.reminderTimes,
        ...(stored.reminderTimes ?? {}),
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
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [] as string[];
  }
}

let readStatusQueue: Promise<void> = Promise.resolve();

export function saveReadNotificationIds(ids: readonly string[]) {
  const addedIds = [...ids];
  const save = async () => {
    // Merge inside the queue so simultaneous taps cannot overwrite one another.
    const current = await loadReadNotificationIds();
    const merged = [...new Set([...current, ...addedIds])].slice(-100);
    await AsyncStorage.setItem(READ_IDS_KEY, JSON.stringify(merged));
    readStatusListeners.forEach((listener) => listener());
  };
  readStatusQueue = readStatusQueue.then(save, save);
  return readStatusQueue;
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
    { id: "wake-up-dua", time: "06:45", title: translate("notif.wake"), body: translate("notif.wakeBody"), route: "/dua?section=sleep&focus=wake-up", category: "dua", icon: "sunny-outline", accent: "#F4C95D" },
    { id: "morning-dua", time: "07:00", title: translate("notif.morning"), body: translate("notif.morningBody"), route: "/dua?section=morning", category: "dua", icon: "sunny-outline", accent: "#F4C95D" },
    { id: "leave-home-dua", time: "08:00", title: translate("notif.beforeLeaving"), body: translate("notif.leaveHomeBody"), route: "/dua?section=home&focus=leave", category: "dua", icon: "exit-outline", accent: "#E3A85F" },
    { id: "before-meal-dua", time: "12:15", title: translate("notif.meal"), body: translate("notif.mealBody"), route: "/dua?section=food&focus=before-meal", category: "dua", icon: "restaurant-outline", accent: "#CF9561" },
    { id: "verse-of-day", time: "13:00", title: translate("notif.verseTitle"), body: dailyVerseReference ? translate("notif.verseBody", { verse: `${dailyVerseReference[1]}:${dailyVerseReference[2]}` }) : translate("notif.verseFallback"), route: dailyVerseRoute, category: "inspiration", icon: "book-outline", accent: "#A878D0" },
    { id: "hifz", time: "18:00", title: translate("notif.hifzTitle"), body: translate("notif.hifzBody"), route: "/hifz", category: "learning", icon: "school-outline", accent: "#6BBCA8" },
    { id: "enter-home-dua", time: "18:30", title: translate("notif.enterHomeTitle"), body: translate("notif.enterHomeBody"), route: "/dua?section=home&focus=enter", category: "dua", icon: "home-outline", accent: "#D8A767" },
    { id: "evening-dua", time: "20:30", title: translate("notif.evening"), body: translate("notif.eveningBody"), route: "/dua?section=evening", category: "dua", icon: "moon-outline", accent: "#8D78CB" },
    { id: "hadith-of-day", time: "21:00", title: translate("notif.hadith"), body: translate("notif.hadithBody"), route: "/hadiths?open=daily", category: "inspiration", icon: "chatbubble-ellipses-outline", accent: "#C98CBA" },
    { id: "sleep-dua", time: "22:30", title: translate("notif.sleep"), body: translate("notif.sleepBody"), route: "/dua?section=sleep&focus=bedtime", category: "dua", icon: "bed-outline", accent: "#7D70BC" },
  ];

  timedItems.forEach((item) => {
    const itemTime = preferences.reminderTimes?.[item.id] ?? item.time;
    if (!enabled[item.id] || !timeReached(itemTime, now)) return;
    const remaining = item.id === "hifz" ? hifzRemaining(hifzState, now) : null;
    if (item.id === "hifz" && remaining === 0) return;
    items.push({
      id: `${day}:${item.id}`,
      reminderId: item.id,
      category: item.category,
      title: item.title,
      body:
        item.id === "hifz" && remaining
          ? translate(remaining > 1 ? "notif.hifzRemainingMany" : "notif.hifzRemainingOne", { count: remaining })
          : item.body,
      timeLabel: itemTime,
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
      title: translate("notif.jummahToday"),
      body: mosqueName
        ? translate("notif.jummahAt", { mosque: mosqueName })
        : translate("notif.jummahBody"),
      timeLabel: dhuhr?.time ?? translate("notif.friday"),
      route: "/mosques",
      icon: "business-outline",
      accent: "#E8B84E",
    });
  }

  return items;
}

function configureChannel(mode: CenterAlertMode) {
  return ensureReminderChannel(mode);
}

export async function requestNotificationCenterPermission(mode: CenterAlertMode) {
  await configureChannel(mode);
  const current = await Notifications.getPermissionsAsync();
  if (isNotificationPermissionGranted(current)) return true;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: true },
  });
  return isNotificationPermissionGranted(requested);
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
    data: { route, reminderId, notificationOwner: NOTIFICATION_OWNER, notificationMode: mode },
    sound: alertSound(mode),
    vibrate: mode === "silent" ? [] : VIBRATION_PATTERN,
    color: "#F2B53D",
  };
}

function dailyGoalsNotificationCopy(remainingGoals: DailyGoal[]) {
  const labels = remainingGoals.slice(0, 2).map((goal) => goalTitle(goal, translate)).join(", ");
  const extra = remainingGoals.length > 2
    ? translate("notif.goalsMore", { count: remainingGoals.length - 2 })
    : "";
  return {
    title: remainingGoals.length === 1 ? translate("notif.goalsLast") : translate("notif.goalsTitle"),
    body: translate("notif.goalsBody", { goals: `${labels}${extra}` }),
  };
}

async function cancelDailyGoalsReminder() {
  const raw = await AsyncStorage.getItem(DAILY_GOALS_SCHEDULED_KEY).catch(() => null);
  let storedIds: string[] = [];
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      storedIds = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
    } catch {
      storedIds = [];
    }
  }

  const discoveredIds = (await Notifications.getAllScheduledNotificationsAsync().catch(() => []))
    .filter((notification) => {
      const data = notification.content.data as Record<string, unknown> | undefined;
      return data?.notificationOwner === DAILY_GOALS_OWNER;
    })
    .map((notification) => notification.identifier);

  await Promise.all(
    [...new Set([...storedIds, ...discoveredIds])].map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );
  await AsyncStorage.removeItem(DAILY_GOALS_SCHEDULED_KEY);
}

let dailyGoalsReminderSyncQueue: Promise<void> = Promise.resolve();

async function syncDailyGoalsReminderInternal(preferences: NotificationCenterPreferences) {
  await cancelDailyGoalsReminder();
  if (!preferences.systemEnabled || !preferences.reminders["daily-goals"]) return;

  const permission = await Notifications.getPermissionsAsync();
  if (!isNotificationPermissionGranted(permission)) return;

  const plan = await goalRepository.getToday();
  const remainingGoals = plan.goals.filter((goal) => !isGoalComplete(goal));
  if (!remainingGoals.length) return;

  const reminder = CENTER_REMINDERS.find((item) => item.id === "daily-goals");
  if (!reminder) return;
  const [hour, minute] = (preferences.reminderTimes?.["daily-goals"] ?? reminder.time ?? "20:00")
    .split(":")
    .map(Number);
  const now = new Date();
  const fireAt = new Date(now);
  fireAt.setHours(Number.isFinite(hour) ? hour : 20, Number.isFinite(minute) ? minute : 0, 0, 0);
  if (fireAt <= now) fireAt.setDate(fireAt.getDate() + 1);

  await configureChannel(preferences.mode);
  const copy = dailyGoalsNotificationCopy(remainingGoals);
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: copy.title,
      body: copy.body,
      data: {
        route: "/daily-goals",
        reminderId: "daily-goals",
        notificationOwner: DAILY_GOALS_OWNER,
        notificationMode: preferences.mode,
        dateKey: localDateKey(fireAt),
      },
      sound: alertSound(preferences.mode),
      vibrate: preferences.mode === "silent" ? [] : VIBRATION_PATTERN,
      color: "#F2B53D",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      channelId: reminderChannelId(preferences.mode),
    },
  });
  await AsyncStorage.setItem(DAILY_GOALS_SCHEDULED_KEY, JSON.stringify([id]));
}

export function syncDailyGoalsReminder(preferences?: NotificationCenterPreferences) {
  const run = async () => {
    const nextPreferences = preferences ?? await loadNotificationCenterPreferences();
    await syncDailyGoalsReminderInternal(nextPreferences);
  };
  dailyGoalsReminderSyncQueue = dailyGoalsReminderSyncQueue.then(run, run);
  return dailyGoalsReminderSyncQueue;
}

async function syncNotificationCenterScheduleInternal(
  preferences: NotificationCenterPreferences,
  schedule: MosquePrayerSchedule | null,
  mosqueName?: string,
  hifzState: HifzState | null = null,
) {
  await cancelScheduledCenterNotifications();
  await syncDailyGoalsReminder(preferences);
  if (!preferences.systemEnabled) return;

  const permission = await Notifications.getPermissionsAsync();
  if (!isNotificationPermissionGranted(permission)) return;
  await configureChannel(preferences.mode);
  const channelId = reminderChannelId(preferences.mode);
  const ids: string[] = [];

  for (const reminder of CENTER_REMINDERS) {
    if (reminder.id === "daily-goals") continue;
    if (!preferences.reminders[reminder.id] || !reminder.time) continue;
    if (reminder.id === "hifz" && hifzRemaining(hifzState, new Date()) === 0) continue;
    const [hour, minute] = (preferences.reminderTimes?.[reminder.id] ?? reminder.time).split(":").map(Number);
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content: notificationContent(
          translate(reminder.title),
          translate(reminder.description),
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


  // Joumou'a est programmée globalement par JumuahService.
  // Ne pas la reprogrammer ici : cela évite les doublons et la dépendance à une mosquée.


  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(ids));
}


let notificationCenterSyncQueue: Promise<void> = Promise.resolve();

export function syncNotificationCenterSchedule(
  preferences: NotificationCenterPreferences,
  schedule: MosquePrayerSchedule | null,
  mosqueName?: string,
  hifzState: HifzState | null = null,
) {
  const run = () => syncNotificationCenterScheduleInternal(preferences, schedule, mosqueName, hifzState);
  notificationCenterSyncQueue = notificationCenterSyncQueue.then(run, run);
  return notificationCenterSyncQueue;
}

goalProgressBridge.subscribe(() => {
  void syncDailyGoalsReminder().catch(() => undefined);
});
