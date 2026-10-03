import type { MosquePrayerKey } from "../mosques/data/mosquePrayerTimes";
import { storageService } from "../../core/storage/StorageService";

export const REQUIRED_PRAYERS: readonly MosquePrayerKey[] = [
  "Fajr",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
];

type StoredPrayerCompletions = {
  dateKey: string;
  completed: MosquePrayerKey[];
};

const KEY = "oummah.prayer-completions.v1";
const HISTORY_KEY = "oummah.prayer-completions.daily-history.v1";

export type PrayerCompletionHistory = Record<string, MosquePrayerKey[]>;

export type PrayerValidationEvent = {
  dateKey: string;
  prayer: MosquePrayerKey;
};

type PrayerValidationListener = (event: PrayerValidationEvent) => void;

const validationListeners = new Set<PrayerValidationListener>();

export function subscribePrayerValidation(listener: PrayerValidationListener) {
  validationListeners.add(listener);
  return () => {
    validationListeners.delete(listener);
  };
}

export async function loadPrayerCompletions(dateKey: string) {
  const stored = await storageService.get<StoredPrayerCompletions>(KEY).catch(() => null);
  if (!stored || stored.dateKey !== dateKey) return [] as MosquePrayerKey[];
  return stored.completed.filter((key) => REQUIRED_PRAYERS.includes(key));
}

export async function togglePrayerCompletion(
  dateKey: string,
  prayer: MosquePrayerKey,
) {
  const current = await loadPrayerCompletions(dateKey);
  const completed = current.includes(prayer)
    ? current.filter((key) => key !== prayer)
    : [...current, prayer];
  await storageService.set(KEY, { dateKey, completed });
  const history = (await storageService.get<PrayerCompletionHistory>(HISTORY_KEY).catch(() => null)) ?? {};
  await storageService.set(HISTORY_KEY, { ...history, [dateKey]: completed });

  if (!current.includes(prayer)) {
    const event = { dateKey, prayer } satisfies PrayerValidationEvent;
    validationListeners.forEach((listener) => {
      try {
        listener(event);
      } catch {
        // A celebration listener must never prevent prayer validation from completing.
      }
    });
  }

  return completed;
}

export async function loadPrayerCompletionHistory(): Promise<PrayerCompletionHistory> {
  const history = (await storageService.get<PrayerCompletionHistory>(HISTORY_KEY).catch(() => null)) ?? {};
  return Object.fromEntries(
    Object.entries(history).map(([dateKey, prayers]) => [
      dateKey,
      prayers.filter((prayer) => REQUIRED_PRAYERS.includes(prayer)),
    ]),
  );
}
