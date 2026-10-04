import AsyncStorage from "@react-native-async-storage/async-storage";

import type { GoalMetric } from "../domain/GoalCategory";

/**
 * Last time each kind of activity happened (dhikr, Coran, hadith…), even when no goal uses it today.
 * Lets other spaces (e.g. Qiyam al-Layl « Programme de la nuit ») know what was done since a moment.
 */
const KEY = "oumma:daily-goals:last-activity:v1";

type ActivityLog = Partial<Record<GoalMetric, string>>;

let chain = Promise.resolve();

export function markGoalActivity(metric: GoalMetric, at = new Date()) {
  chain = chain
    .then(async () => {
      const raw = await AsyncStorage.getItem(KEY).catch(() => null);
      let log: ActivityLog = {};
      try {
        log = raw ? (JSON.parse(raw) as ActivityLog) : {};
      } catch {
        log = {};
      }
      log[metric] = at.toISOString();
      await AsyncStorage.setItem(KEY, JSON.stringify(log));
    })
    .catch(() => undefined);
  return chain;
}

export async function readGoalActivity(): Promise<ActivityLog> {
  await chain;
  const raw = await AsyncStorage.getItem(KEY).catch(() => null);
  try {
    return raw ? (JSON.parse(raw) as ActivityLog) : {};
  } catch {
    return {};
  }
}
