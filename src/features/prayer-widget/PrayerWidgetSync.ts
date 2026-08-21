import { requireOptionalNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

import type { MosquePrayerTime } from "../mosques/data/mosquePrayerTimes";

type PrayerWidgetDay = {
  dateKey: string;
  startTimestamp: number;
  frenchDate: string;
  hijriDate: string;
  prayers: MosquePrayerTime[];
  sunrise: {
    label: string;
    time: string;
    timestamp: number;
  };
};

type PrayerWidgetPayload = {
  today: PrayerWidgetDay;
  tomorrow: PrayerWidgetDay;
};

type PrayerTimesWidgetModule = {
  publish(payload: string): Promise<void>;
};

const prayerTimesWidget = Platform.OS === "android" || Platform.OS === "ios"
  ? requireOptionalNativeModule<PrayerTimesWidgetModule>("PrayerTimesWidget")
  : null;

/** Copies the already-resolved prayer schedule to the platform widget storage. */
export async function syncPrayerTimesWidget(payload: PrayerWidgetPayload) {
  if ((Platform.OS !== "android" && Platform.OS !== "ios") || !prayerTimesWidget) return;
  await prayerTimesWidget.publish(JSON.stringify(payload)).catch(() => undefined);
}
