import AsyncStorage from "@react-native-async-storage/async-storage";

import type { MosquePrayerKey } from "../mosques/data/mosquePrayerTimes";

export type AdhanAlertMode = "sound" | "vibration" | "silent";

export type AdhanPreferences = {
  enabled: boolean;
  prayers: Record<MosquePrayerKey, boolean>;
  mode: AdhanAlertMode;
  leadMinutes: number;
};

export const DEFAULT_ADHAN_PREFERENCES: AdhanPreferences = {
  enabled: true,
  prayers: {
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
  mode: "sound",
  leadMinutes: 0,
};

const STORAGE_KEY = "oumma:adhan-preferences:v1";

export async function loadAdhanPreferences(): Promise<AdhanPreferences> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY).catch(() => null);

  if (!stored) return DEFAULT_ADHAN_PREFERENCES;

  try {
    const parsed = JSON.parse(stored) as Partial<AdhanPreferences>;

    return {
      ...DEFAULT_ADHAN_PREFERENCES,
      ...parsed,
      prayers: {
        ...DEFAULT_ADHAN_PREFERENCES.prayers,
        ...parsed.prayers,
      },
    };
  } catch {
    return DEFAULT_ADHAN_PREFERENCES;
  }
}

export async function saveAdhanPreferences(preferences: AdhanPreferences) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}
