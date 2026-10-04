import { requireOptionalNativeModule } from "expo-modules-core";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

/**
 * What can stop an alert from arriving on time, beyond the notification permission itself:
 * - Android 12+: « Alarmes et rappels » refused → alerts become inexact (minutes late in sleep);
 * - Android: battery optimisation → some brands delay or drop alerts;
 * - iOS: sounds turned off for OUMMAH in the phone settings.
 */

type ReliabilityModule = {
  canScheduleExactAlarms?: () => boolean;
  openExactAlarmSettings?: () => Promise<boolean>;
  isIgnoringBatteryOptimizations?: () => boolean;
  openBatteryOptimizationSettings?: () => Promise<boolean>;
};

const native = Platform.OS === "android"
  ? requireOptionalNativeModule<ReliabilityModule>("TahajjudAlarm")
  : null;

export type NotificationReliability = {
  exactAlarms: boolean;
  batteryUnrestricted: boolean;
  soundAllowed: boolean;
};

export async function getNotificationReliability(): Promise<NotificationReliability> {
  const permission = await Notifications.getPermissionsAsync().catch(() => null);
  const safe = (read?: () => boolean) => {
    try {
      return read ? read() : true;
    } catch {
      return true;
    }
  };
  return {
    exactAlarms: safe(native?.canScheduleExactAlarms),
    batteryUnrestricted: safe(native?.isIgnoringBatteryOptimizations),
    soundAllowed: Platform.OS !== "ios" || permission?.ios?.allowsSound !== false,
  };
}

export const openExactAlarmSettings = () =>
  native?.openExactAlarmSettings?.().catch(() => false) ?? Promise.resolve(false);

export const openBatteryOptimizationSettings = () =>
  native?.openBatteryOptimizationSettings?.().catch(() => false) ?? Promise.resolve(false);
