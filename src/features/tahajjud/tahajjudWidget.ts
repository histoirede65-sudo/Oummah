import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import { loadTahajjudNights } from './TahajjudStore';
import { getNightState, upcomingNights, type NightSchedule } from './tahajjudNight';

/**
 * Tahajjud widget / lock screen: the app sends the nights it has already computed (no second engine
 * in the widget), plus the validated ones. Android: TahajjudAlarm module; iOS: OUMMAH widget extension.
 */

type WidgetNight = { key: string; isha: number; lastThirdStart: number; fajr: number };

const NIGHTS_KEY = 'oummah.tahajjud.widget.nights.v1';

const android = Platform.OS === 'android'
  ? requireOptionalNativeModule<{ publishWidget(payload: string): Promise<void> }>('TahajjudAlarm')
  : null;
const ios = Platform.OS === 'ios'
  ? requireOptionalNativeModule<{ publishTahajjud?(payload: string): Promise<void> }>('PrayerTimesWidget')
  : null;

async function publish(nights: WidgetNight[]) {
  if (!android && !ios?.publishTahajjud) return;
  const validated = Object.keys(await loadTahajjudNights()).sort().slice(-14);
  const payload = JSON.stringify({ nights, validated, updatedAt: Date.now() });
  await (android ? android.publishWidget(payload) : ios!.publishTahajjud!(payload)).catch(() => undefined);
}

/** Publishes the nights of a schedule (last night included after midnight). */
export async function publishTahajjudWidget(schedule: NightSchedule) {
  const state = getNightState(schedule, Date.now());
  const all = [...(state ? [state.night] : []), ...upcomingNights(schedule)];
  const unique = new Map<string, WidgetNight>();
  for (const night of all) {
    unique.set(night.key, { key: night.key, isha: night.isha, lastThirdStart: night.lastThirdStart, fajr: night.fajr });
  }
  const nights = [...unique.values()].sort((a, b) => a.isha - b.isha);
  await AsyncStorage.setItem(NIGHTS_KEY, JSON.stringify(nights)).catch(() => undefined);
  await publish(nights);
}

/** After a validation (or its undo): same nights, new « Nuit accomplie » state. */
export async function refreshTahajjudWidgetValidation() {
  try {
    const nights = JSON.parse((await AsyncStorage.getItem(NIGHTS_KEY)) ?? '[]') as WidgetNight[];
    if (Array.isArray(nights) && nights.length) await publish(nights);
  } catch {
    // The next publication fixes it.
  }
}
