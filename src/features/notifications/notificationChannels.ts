import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { ensureCommunityChannels } from "../tahajjud/communityChannels";
import { translate, type TranslationKey } from "../../i18n";

/**
 * Sound / vibration rules shared by every local notification.
 *
 * Android: sound and vibration belong to the channel and can never be changed once the channel
 * exists. A channel created without an explicit `sound: null` gets the default ringtone, which is
 * why the old « vibreur » / « silencieux » channels rang: they are replaced by -v4 channels.
 *
 * iOS: a notification without sound never vibrates. Vibration mode therefore plays a silent file,
 * which makes the phone vibrate (according to the user's haptics settings) without any sound.
 */

export type AlertMode = "sound" | "vibration" | "silent";

export const SILENT_VIBRATION_SOUND = "oummah_vibrate.wav";

/** Content `sound` for a mode (`sound` = the file to play in sound mode). */
export function alertSound(mode: AlertMode, sound = "default") {
  if (mode === "sound") return sound;
  if (mode === "vibration" && Platform.OS === "ios") return SILENT_VIBRATION_SOUND;
  return false;
}

export const VIBRATION_PATTERN = [0, 300, 180, 300];

export const reminderChannelId = (mode: AlertMode) => `oummah-reminders-${mode}-v4`;

const REMINDER_CHANNEL_NAMES: Record<AlertMode, TranslationKey> = {
  sound: "channel.reminders",
  vibration: "channel.remindersVibrate",
  silent: "channel.remindersSilent",
};

export async function ensureReminderChannel(mode: AlertMode) {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(reminderChannelId(mode), {
    name: translate(REMINDER_CHANNEL_NAMES[mode]),
    importance: mode === "silent" ? Notifications.AndroidImportance.DEFAULT : Notifications.AndroidImportance.HIGH,
    sound: mode === "sound" ? "default" : null,
    ...(mode === "silent" ? {} : { vibrationPattern: VIBRATION_PATTERN }),
    enableVibrate: mode !== "silent",
    lightColor: "#F2B53D",
  });
}

/** Channels whose sound settings were wrong (they rang in vibration / silent mode). */
const LEGACY_CHANNELS = [
  "oummah-reminders-sound-v3",
  "oummah-reminders-vibration-v3",
  "oummah-reminders-silent-v3",
  "adhan-vibration-v3",
  "adhan-silent-v3",
];

/** Channels targeted by server pushes (`channelId` in the Expo push payload). */
async function ensurePushChannels() {
  const admin = {
    name: translate("notifScreen.announcements"),
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 140, 250],
    lightColor: "#F1BC4F",
  };
  await Promise.all([
    // Support replies and admin alerts are sent on "oummah-admin".
    Notifications.setNotificationChannelAsync("oummah-admin", admin),
    Notifications.setNotificationChannelAsync("oummah-admin-v2", admin),
    Notifications.setNotificationChannelAsync("oummah-mosque-v1", {
      name: translate("channel.myMosque"),
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
      sound: "default",
    }),
    ensureCommunityChannels(),
  ]);
}

let ensured: Promise<void> | null = null;

/**
 * Creates every channel a push can target (so none lands in « Divers ») and removes the legacy
 * channels. Safe to call often: runs once per launch.
 */
export function ensureAppNotificationChannels() {
  if (Platform.OS !== "android") return Promise.resolve();
  ensured ??= (async () => {
    await ensurePushChannels();
    await Promise.all(
      LEGACY_CHANNELS.map((id) => Notifications.deleteNotificationChannelAsync(id).catch(() => undefined)),
    );
  })().catch(() => {
    ensured = null;
  });
  return ensured;
}
