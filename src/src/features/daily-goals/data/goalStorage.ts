import AsyncStorage from "@react-native-async-storage/async-storage";

import { getValidSession } from "../../auth/SupabaseAuthService";
import type { DailyPlan, DailyGoalSettings } from "../domain/DailyPlan";

const PLAN_PREFIX = "oumma:daily-goals:plan:v2:";
const SETTINGS_PREFIX = "oumma:daily-goals:settings:v2:";

async function currentOwnerKey() {
  const session = await getValidSession().catch(() => null);
  return session?.user.id ? `user:${session.user.id}` : "guest";
}

async function planStorageKey(dateKey: string) {
  return `${PLAN_PREFIX}${await currentOwnerKey()}:${dateKey}`;
}

async function settingsStorageKey() {
  return `${SETTINGS_PREFIX}${await currentOwnerKey()}`;
}

export const DEFAULT_DAILY_GOAL_SETTINGS: DailyGoalSettings = {
  dailyMinutes: 10,
  focus: ["quran", "dhikr", "hifz", "dua", "hadith"],
  onboardingComplete: false,
};

export function dailyGoalDateKey(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export async function readDailyPlan(dateKey: string) {
  const raw = await AsyncStorage.getItem(await planStorageKey(dateKey)).catch(
    () => null,
  );
  if (!raw) return null;
  try {
    return JSON.parse(raw) as DailyPlan;
  } catch {
    return null;
  }
}

export async function writeDailyPlan(plan: DailyPlan) {
  await AsyncStorage.setItem(await planStorageKey(plan.dateKey), JSON.stringify(plan));
}

export async function readDailyGoalSettings() {
  const raw = await AsyncStorage.getItem(await settingsStorageKey()).catch(() => null);
  if (!raw) return DEFAULT_DAILY_GOAL_SETTINGS;
  try {
    const parsed = JSON.parse(raw) as Partial<DailyGoalSettings>;
    const focus = parsed.onboardingComplete
      ? parsed.focus
      : [
          ...new Set([
            ...DEFAULT_DAILY_GOAL_SETTINGS.focus,
            ...(parsed.focus ?? []),
          ]),
        ];
    return {
      ...DEFAULT_DAILY_GOAL_SETTINGS,
      ...parsed,
      focus: focus ?? DEFAULT_DAILY_GOAL_SETTINGS.focus,
    };
  } catch {
    return DEFAULT_DAILY_GOAL_SETTINGS;
  }
}

export async function writeDailyGoalSettings(settings: DailyGoalSettings) {
  await AsyncStorage.setItem(await settingsStorageKey(), JSON.stringify(settings));
}

export async function readRecentDailyPlans(days = 7) {
  const dates = Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return dailyGoalDateKey(date);
  });
  const plans = await Promise.all(dates.map(readDailyPlan));
  return plans.filter((plan): plan is DailyPlan => Boolean(plan));
}
