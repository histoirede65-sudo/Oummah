import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { storageService } from "../../core/storage/StorageService";

const OWNER = "oummah-jumuah";
const CHANNEL = "oummah-jumuah-v2";
export const JUMUAH_ROUTE = "/jumuah";

function permissionGranted(status: Notifications.NotificationPermissionsStatus) {
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL || status.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL;
}

export async function syncJumuahNotification() {
  let permission = await Notifications.getPermissionsAsync();
  if (!permissionGranted(permission)) permission = await Notifications.requestPermissionsAsync();
  if (!permissionGranted(permission)) return false;
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync(CHANNEL, { name: "Djoumou’a", importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 180, 90, 180], sound: "default" });
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(scheduled.filter((item) => item.content.data?.notificationOwner === OWNER).map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)));
  await Notifications.scheduleNotificationAsync({
    content: { title: "C’est vendredi 🤍 Prépare ta Djoumou’a", body: "Ouvre OUMMAH, une surprise t’attend.", sound: "default", data: { notificationOwner: OWNER, route: JUMUAH_ROUTE } },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 6, hour: 10, minute: 0, channelId: Platform.OS === "android" ? CHANNEL : undefined },
  });
  return true;
}

export function fridayKey(date = new Date()) { const d = new Date(date); const delta = (d.getDay() - 5 + 7) % 7; d.setDate(d.getDate() - delta); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
export function isFriday(date = new Date()) { return date.getDay() === 5; }
export type JumuahProgress = { week: string; completed: string[] };
const PROGRESS_KEY = "jumuah.progress.v1";
export async function loadJumuahProgress(): Promise<JumuahProgress> { const week = fridayKey(); const stored = await storageService.get<JumuahProgress>(PROGRESS_KEY).catch(() => null); return !stored || stored.week !== week ? { week, completed: [] } : stored; }
export async function saveJumuahProgress(completed: string[]) { const value = { week: fridayKey(), completed }; await storageService.set(PROGRESS_KEY, value); return value; }
