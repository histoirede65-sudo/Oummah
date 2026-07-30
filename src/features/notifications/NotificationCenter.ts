import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { HifzState } from "../hifz/HifzStore";
import type {
  MosquePrayerKey,
  MosquePrayerSchedule,
} from "../mosques/data/mosquePrayerTimes";

export type CenterReminderId =
  | "passed-prayers"
  | "morning-dua"
  | "leave-home-dua"
  | "before-meal-dua"
  | "enter-home-dua"
  | "evening-dua"
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
  { id: "passed-prayers", title: "Suivi des prières", description: "Rappel après chaque prière passée", section: "Prières" },
  { id: "jummah", title: "Préparer Joumou‘a", description: "Le vendredi avant l’heure de votre mosquée", section: "Prières" },
  { id: "morning-dua", title: "Dou‘as du matin", description: "Commencer la journée par les adhkār", section: "Dou‘as", time: "07:00" },
  { id: "leave-home-dua", title: "En sortant de chez soi", description: "Au début des horaires de bureau", section: "Dou‘as", time: "08:00" },
  { id: "before-meal-dua", title: "Avant de manger", description: "Rappel autour de la pause du midi", section: "Dou‘as", time: "12:15" },
  { id: "enter-home-dua", title: "En rentrant chez soi", description: "À la fin des horaires de bureau", section: "Dou‘as", time: "18:30" },
  { id: "evening-dua", title: "Dou‘as du soir", description: "Terminer la journée par les adhkār", section: "Dou‘as", time: "20:30" },
  { id: "hifz", title: "Objectif mémorisation", description: "Versets restant à apprendre aujourd’hui", section: "Apprentissage", time: "18:00" },
  { id: "verse-of-day", title: "Verset du jour", description: "S’il n’a pas encore été consulté", section: "Inspiration", time: "13:00" },
  { id: "hadith-of-day", title: "Hadith du jour", description: "Un rappel authentique chaque soir", section: "Inspiration", time: "21:00" },
];

export const DEFAULT_NOTIFICATION_CENTER_PREFERENCES: NotificationCenterPreferences = {
  systemEnabled: false,
  mode: "sound",
  reminders: {
    "passed-prayers": true,
    "morning-dua": true,
    "leave-home-dua": true,
    "before-meal-dua": true,
    "enter-home-dua": true,
    "evening-dua": true,
    hifz: true,
    "verse-of-day": true,
    "hadith-of-day": true,
    jummah: true,
  },
};

const PREFERENCES_KEY = "oumma:notification-center-preferences:v1";
const READ_IDS_KEY = "oumma:notification-center-read:v1";
const SCHEDULED_IDS_KEY = "oumma:notification-center-scheduled:v1";

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

  if (enabled["passed-prayers"] && schedule) {
    schedule.prayers
      .filter((prayer) => prayer.timestamp <= now.getTime())
      .slice(-2)
      .reverse()
      .forEach((prayer) => {
        items.push({
          id: `${day}:prayer:${prayer.key}`,
          reminderId: "passed-prayers",
          category: "prayer",
          title: `${prayer.label} est passée`,
          body: "Avez-vous accompli cette prière ? Prenez un instant pour faire le point.",
          timeLabel: prayer.time,
          route: "/",
          icon: "moon-outline",
          accent: "#E7AE43",
        });
      });
  }

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
    { id: "morning-dua", time: "07:00", title: "Dou‘as du matin", body: "Commencez la journée avec les adhkār authentiques du matin.", route: "/dua", category: "dua", icon: "sunny-outline", accent: "#F4C95D" },
    { id: "leave-home-dua", time: "08:00", title: "Avant de sortir", body: "Pensez à l’invocation en sortant de chez vous.", route: "/dua", category: "dua", icon: "exit-outline", accent: "#E3A85F" },
    { id: "before-meal-dua", time: "12:15", title: "Avant de manger", body: "Un rappel simple : prononcez le nom d’Allah avant votre repas.", route: "/dua", category: "dua", icon: "restaurant-outline", accent: "#CF9561" },
    { id: "verse-of-day", time: "13:00", title: "Votre verset du jour vous attend", body: "Quelques minutes de lecture peuvent éclairer toute votre journée.", route: "/quran", category: "inspiration", icon: "book-outline", accent: "#A878D0" },
    { id: "hifz", time: "18:00", title: "Objectif Hifz", body: "Reprenez votre mémorisation là où vous l’avez laissée.", route: "/hifz", category: "learning", icon: "school-outline", accent: "#6BBCA8" },
    { id: "enter-home-dua", time: "18:30", title: "En rentrant chez vous", body: "Pensez à l’invocation en entrant dans votre foyer.", route: "/dua", category: "dua", icon: "home-outline", accent: "#D8A767" },
    { id: "evening-dua", time: "20:30", title: "Dou‘as du soir", body: "Prenez un moment pour les adhkār authentiques du soir.", route: "/dua", category: "dua", icon: "moon-outline", accent: "#8D78CB" },
    { id: "hadith-of-day", time: "21:00", title: "Hadith du jour", body: "Votre rappel du jour n’a pas encore été consulté.", route: "/", category: "inspiration", icon: "chatbubble-ellipses-outline", accent: "#C98CBA" },
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
  const ids = raw ? (JSON.parse(raw) as string[]) : [];
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined)),
  );
  await AsyncStorage.removeItem(SCHEDULED_IDS_KEY);
}

function notificationContent(title: string, body: string, mode: CenterAlertMode, route: string) {
  return {
    title,
    body,
    data: { route },
    sound: mode === "sound" ? "default" : false,
    vibrate: mode === "vibration" ? [0, 300, 180, 300] : [],
    color: "#F2B53D",
  };
}

export async function syncNotificationCenterSchedule(
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
        content: notificationContent(reminder.title, reminder.description, preferences.mode, reminder.id.includes("dua") ? "/dua" : reminder.id === "hifz" ? "/hifz" : "/"),
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId,
        },
      }),
    );
  }

  if (preferences.reminders["passed-prayers"] && schedule) {
    for (const prayer of schedule.prayers) {
      const triggerAt = prayer.timestamp + 15 * 60 * 1_000;
      if (triggerAt <= Date.now()) continue;
      ids.push(
        await Notifications.scheduleNotificationAsync({
          content: notificationContent(`${prayer.label} est passée`, "Avez-vous accompli cette prière ?", preferences.mode, "/"),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(triggerAt),
            channelId,
          },
        }),
      );
    }
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

