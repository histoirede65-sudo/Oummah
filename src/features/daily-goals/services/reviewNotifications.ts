import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const OWNER = "oummah-goal-reviews";
const CHANNEL = "oummah-goal-reviews-v1";

function permissionGranted(status: Notifications.NotificationPermissionsStatus) {
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL || status.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL;
}

/**
 * Review reminders: Monday 9:00 (last week), the 1st of the month 9:30 (last month), 1 January 10:00 (the year).
 * Local notifications are written in advance, so they only announce the review; the figures are computed
 * when the screen opens. Never asks for permission itself.
 */
export async function syncGoalReviewNotifications() {
  const permission = await Notifications.getPermissionsAsync();
  if (!permissionGranted(permission)) return false;
  const channelId = Platform.OS === "android" ? CHANNEL : undefined;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: "Bilans", importance: Notifications.AndroidImportance.DEFAULT, sound: "default" });
  }
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((item) => item.content.data?.notificationOwner === OWNER)
      .map((item) => Notifications.cancelScheduledNotificationAsync(item.identifier)),
  );
  const content = (title: string, body: string, period: string) => ({
    title,
    body,
    sound: "default" as const,
    data: { notificationOwner: OWNER, route: `/bilans?period=${period}` },
  });
  await Notifications.scheduleNotificationAsync({
    content: content("Votre bilan de la semaine est prêt 🌙", "Vos jours actifs et vos objectifs de la semaine passée.", "week"),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 2, hour: 9, minute: 0, channelId },
  });
  await Notifications.scheduleNotificationAsync({
    content: content("Votre bilan du mois est prêt", "Votre régularité et ce que vous avez le mieux suivi le mois dernier.", "month"),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.MONTHLY, day: 1, hour: 9, minute: 30, channelId },
  });
  await Notifications.scheduleNotificationAsync({
    content: content("Votre année avec OUMMAH ✨", "Votre rétrospective de l’année est prête.", "year"),
    trigger: { type: Notifications.SchedulableTriggerInputTypes.YEARLY, month: 0, day: 1, hour: 10, minute: 0, channelId },
  });
  return true;
}
