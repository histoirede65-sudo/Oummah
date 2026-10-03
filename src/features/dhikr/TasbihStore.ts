import { storageService } from "../../core/storage";
import type { MosquePrayerSchedule } from "../mosques/data/mosquePrayerTimes";

const TASBIH_STATE_KEY = "oummah.tasbih.state.v1";
const TASBIH_SCHEDULE_KEY = "oummah.tasbih.prayer-schedule.v1";
const TASBIH_HISTORY_KEY = "oummah.tasbih.daily-history.v1";

export type TasbihDailyHistory = Record<string, number>;

export type TasbihState = {
  presetId: string;
  stepIndex: number;
  counts: Record<string, number>;
  totalToday: number;
  dayKey: string;
  prayerCycleKey?: string;
  updatedAt: number;
};

export function tasbihDayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export async function loadTasbihState() {
  return storageService.get<TasbihState>(TASBIH_STATE_KEY).catch(() => null);
}

export async function saveTasbihState(state: TasbihState) {
  const stored = await loadTasbihState();
  const totalToday = stored?.dayKey === state.dayKey
    ? Math.max(stored.totalToday, state.totalToday)
    : state.totalToday;
  await storageService.set(TASBIH_STATE_KEY, { ...state, totalToday });

  const history = (await storageService.get<TasbihDailyHistory>(TASBIH_HISTORY_KEY).catch(() => null)) ?? {};
  if (history[state.dayKey] !== totalToday) {
    await storageService.set(TASBIH_HISTORY_KEY, { ...history, [state.dayKey]: totalToday });
  }
}

export async function loadTasbihDailyHistory(): Promise<TasbihDailyHistory> {
  return (await storageService.get<TasbihDailyHistory>(TASBIH_HISTORY_KEY).catch(() => null)) ?? {};
}

let totalIncrementChain = Promise.resolve();

export function incrementTasbihTotalToday() {
  const operation = totalIncrementChain.then(async () => {
    const stored = await loadTasbihState();
    const today = tasbihDayKey();
    const nextTotal = stored?.dayKey === today ? stored.totalToday + 1 : 1;
    await saveTasbihState({
      presetId: stored?.presetId ?? "free-remembrance",
      stepIndex: stored?.stepIndex ?? 0,
      counts: stored?.dayKey === today ? stored.counts : {},
      totalToday: nextTotal,
      dayKey: today,
      prayerCycleKey: stored?.prayerCycleKey,
      updatedAt: Date.now(),
    });
    return nextTotal;
  });
  totalIncrementChain = operation.then(() => undefined, () => undefined);
  return operation;
}

export async function saveTasbihPrayerSchedule(schedule: MosquePrayerSchedule) {
  return storageService.set(TASBIH_SCHEDULE_KEY, schedule);
}

export async function loadTasbihPrayerSchedule() {
  return storageService.get<MosquePrayerSchedule>(TASBIH_SCHEDULE_KEY).catch(() => null);
}

export function tasbihPrayerCycleKey(schedule: MosquePrayerSchedule | null, now = new Date()) {
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (schedule?.dateKey !== day) return null;
  const latest = schedule.prayers.filter((prayer) => prayer.timestamp <= now.getTime()).at(-1);
  return latest ? `${day}:${latest.key}:${latest.timestamp}` : `${day}:before-fajr`;
}
