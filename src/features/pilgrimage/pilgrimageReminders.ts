import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { translate } from "../../i18n";
import { getHijriDate } from "../calendar/IslamicCalendar";
import { ensureReminderChannel, reminderChannelId } from "../notifications/notificationChannels";
import { isNotificationPermissionGranted } from "../notifications/NotificationPermissions";

/**
 * Notifications of the Hajj days, 8 → 13 Dhul-Hijja, at Mecca time.
 * Dates follow the Saudi calendar (Umm al-Qura), which sets the Hajj; prayer times come from the
 * Umm al-Qura method for Mecca. Scheduled only in the 30 days before ‘Arafa (iOS keeps 64 pending
 * notifications for the whole app), and refreshed each time the pilgrimage screen opens.
 */

const OWNER = "oummah-pilgrimage";
const MECCA = { latitude: 21.4225, longitude: 39.8262 };
const WINDOW_DAYS = 30;
const DAY = 86_400_000;

export type HajjReminderStatus =
  | { kind: "off" }
  | { kind: "denied" }
  | { kind: "waiting"; days: number }
  | { kind: "scheduled"; count: number; approximate: boolean };

/** Gregorian date (local noon) of 9 Dhul-Hijja in the Saudi calendar, within the next 400 days. */
export function saudiArafaDate(now = new Date()): Date | null {
  const date = new Date(now);
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - 13);
  for (let days = -13; days <= 400; days += 1) {
    const hijri = getHijriDate(date, "country", 0, "saudi-arabia");
    if (hijri.month === 12 && hijri.day === 9) return new Date(date);
    date.setDate(date.getDate() + 1);
  }
  return null;
}

type Clock = { h: number; m: number };

/** Mecca prayer times for a day (Umm al-Qura), or null offline. */
async function meccaTimes(date: Date): Promise<{ dhuhr: Clock; maghrib: Clock } | null> {
  const key = `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
  try {
    const response = await fetch(`https://api.aladhan.com/v1/timings/${key}?latitude=${MECCA.latitude}&longitude=${MECCA.longitude}&method=4`);
    if (!response.ok) return null;
    const json = await response.json() as { data?: { timings?: Record<string, string> } };
    const parse = (value?: string): Clock | null => {
      const match = value?.match(/(\d{1,2}):(\d{2})/);
      return match ? { h: Number(match[1]), m: Number(match[2]) } : null;
    };
    const dhuhr = parse(json.data?.timings?.Dhuhr);
    const maghrib = parse(json.data?.timings?.Maghrib);
    return dhuhr && maghrib ? { dhuhr, maghrib } : null;
  } catch {
    return null;
  }
}

/** Absolute timestamp of a Mecca clock time (UTC+3, no daylight saving). */
function atMecca(day: Date, clock: Clock, plusMinutes = 0) {
  return Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), clock.h - 3, clock.m + plusMinutes);
}

const label = (clock: Clock) => `${String(clock.h).padStart(2, "0")}:${String(clock.m).padStart(2, "0")}`;

async function cancelHajjReminders() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync().catch(() => []);
  await Promise.all(scheduled
    .filter((item) => (item.content.data as Record<string, unknown> | undefined)?.notificationOwner === OWNER)
    .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier).catch(() => undefined)));
}

let queue: Promise<HajjReminderStatus> = Promise.resolve({ kind: "off" });

export function syncHajjReminders(enabled: boolean, askPermission = false): Promise<HajjReminderStatus> {
  const run = async (): Promise<HajjReminderStatus> => {
    await cancelHajjReminders();
    if (!enabled) return { kind: "off" };

    let permission = await Notifications.getPermissionsAsync();
    if (!isNotificationPermissionGranted(permission) && askPermission) permission = await Notifications.requestPermissionsAsync();
    if (!isNotificationPermissionGranted(permission)) return { kind: "denied" };

    const arafa = saudiArafaDate();
    if (!arafa) return { kind: "waiting", days: 0 };
    const daysLeft = Math.round((arafa.getTime() - Date.now()) / DAY);
    if (daysLeft > WINDOW_DAYS) return { kind: "waiting", days: daysLeft - WINDOW_DAYS };

    const day = (dhulHijja: number) => new Date(arafa.getTime() + (dhulHijja - 9) * DAY);
    const times = await Promise.all([9, 11, 12, 13].map((value) => meccaTimes(day(value))));
    const approximate = times.some((value) => !value);
    // Offline: typical Mecca times in the Hajj season, without printing them.
    const fallback = { dhuhr: { h: 12, m: 20 }, maghrib: { h: 18, m: 50 } };
    const [t9, t11, t12, t13] = times.map((value) => value ?? fallback);

    const book = (step: string) => `/pilgrimage/book?rite=hajj&step=${step}`;
    const items = [
      { at: atMecca(day(8), { h: 7, m: 0 }), title: translate("pilgrimage.reminder.tarwiyaTitle"), body: translate("pilgrimage.reminder.tarwiyaBody"), route: book("mina-8") },
      { at: atMecca(day(9), { h: 6, m: 30 }), title: translate("pilgrimage.reminder.arafaTitle"), body: approximate ? translate("pilgrimage.reminder.arafaBodyApprox") : translate("pilgrimage.reminder.arafaBody", { time: label(t9.dhuhr) }), route: book("arafat-9") },
      { at: atMecca(day(9), t9.maghrib, -60), title: translate("pilgrimage.reminder.lastHourTitle"), body: translate("pilgrimage.reminder.lastHourBody"), route: "/pilgrimage/duas" },
      { at: atMecca(day(9), t9.maghrib, 5), title: translate("pilgrimage.reminder.sunsetTitle"), body: translate("pilgrimage.reminder.sunsetBody"), route: book("muzdalifah") },
      { at: atMecca(day(10), { h: 6, m: 30 }), title: translate("pilgrimage.reminder.nahrTitle"), body: translate("pilgrimage.reminder.nahrBody"), route: book("nahr-10") },
      { at: atMecca(day(11), t11.dhuhr, 10), title: translate("pilgrimage.reminder.j11Title"), body: translate("pilgrimage.reminder.j11Body"), route: book("tashriq-11") },
      { at: atMecca(day(12), t12.dhuhr, 10), title: translate("pilgrimage.reminder.j12Title"), body: translate("pilgrimage.reminder.j12Body"), route: book("tashriq-12") },
      { at: atMecca(day(13), t13.dhuhr, 10), title: translate("pilgrimage.reminder.j13Title"), body: translate("pilgrimage.reminder.j13Body"), route: book("tashriq-13") },
    ].filter((item) => item.at > Date.now() + 60_000);

    await ensureReminderChannel("sound");
    for (const item of items) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: item.title,
          body: item.body,
          sound: "default",
          data: { notificationOwner: OWNER, route: item.route },
          ...(Platform.OS === "ios" ? { interruptionLevel: "timeSensitive" as const } : {}),
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(item.at), channelId: reminderChannelId("sound") },
      }).catch(() => undefined);
    }
    return { kind: "scheduled", count: items.length, approximate };
  };
  queue = queue.then(run, run);
  return queue;
}
