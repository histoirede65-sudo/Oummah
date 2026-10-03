import { loadTasbihDailyHistory, loadTasbihState, tasbihDayKey } from "../dhikr/TasbihStore";
import { loadHifzState } from "../hifz/HifzStore";
import { loadPrayerCompletionHistory, loadPrayerCompletions, type PrayerCompletionHistory } from "../prayers/PrayerCompletionStore";
import { hasReadConfirmationsForDate, loadReadConfirmationsForDate } from "../reading-progress/ReadingValidationStore";
import { loadTahajjudNights } from "../tahajjud/TahajjudStore";
import { isGoalComplete } from "../daily-goals/domain/DailyGoal";
import type { DailyPlan } from "../daily-goals/domain/DailyPlan";
import { dailyGoalDateKey, readDailyPlan } from "../daily-goals/data/goalStorage";
import type { MosquePrayerKey } from "../mosques/data/mosquePrayerTimes";

export type LocalDateInput = string | Date;

export type DailySnapshot = {
  dateKey: string;
  plan: DailyPlan | null;
  quranVerseIds: string[];
  quranDataAvailable: boolean;
  dhikrTotal: number | null;
  dhikrDataAvailable: boolean;
  prayerCompletions: MosquePrayerKey[];
  prayerDataAvailable: boolean;
  hifzReviewsCompleted: number;
  hifzDataAvailable: boolean;
  tahajjudValidated: boolean;
  tahajjudDataAvailable: boolean;
  hasData: boolean;
};

function toLocalDateKey(value: LocalDateInput) {
  return typeof value === "string" ? value : dailyGoalDateKey(value);
}

function shiftLocalDate(dateKey: string, amount: number) {
  const date = new Date(`${dateKey}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return dailyGoalDateKey(date);
}

function enumerateDates(startDate: string, endDate: string) {
  const dates: string[] = [];
  for (let current = startDate; current <= endDate; current = shiftLocalDate(current, 1)) {
    dates.push(current);
  }
  return dates;
}

async function readDhikrTotal(dateKey: string) {
  const history = await loadTasbihDailyHistory();
  if (Object.prototype.hasOwnProperty.call(history, dateKey)) {
    return { value: history[dateKey], available: true };
  }
  if (dateKey !== tasbihDayKey()) return { value: null, available: false };
  const current = await loadTasbihState();
  return current?.dayKey === dateKey
    ? { value: current.totalToday, available: true }
    : { value: null, available: false };
}

async function readPrayerCompletions(dateKey: string, history?: PrayerCompletionHistory) {
  if (history && Object.prototype.hasOwnProperty.call(history, dateKey)) return history[dateKey] ?? [];
  if (dateKey !== dailyGoalDateKey()) return [];
  return loadPrayerCompletions(dateKey);
}

export async function getDhikrTotal(date: LocalDateInput) {
  return (await readDhikrTotal(toLocalDateKey(date))).value;
}

export async function getPrayerCompletions(date: LocalDateInput) {
  return readPrayerCompletions(toLocalDateKey(date), await loadPrayerCompletionHistory());
}

export async function getDailySnapshot(date: LocalDateInput): Promise<DailySnapshot> {
  const dateKey = toLocalDateKey(date);
  const [plan, quranResult, dhikrData, prayerHistory, hifz, tahajjud] = await Promise.all([
    readDailyPlan(dateKey),
    Promise.all([
      loadReadConfirmationsForDate("quran", dateKey),
      hasReadConfirmationsForDate("quran", dateKey),
    ]),
    readDhikrTotal(dateKey),
    loadPrayerCompletionHistory(),
    loadHifzState(),
    loadTahajjudNights(),
  ]);
  const [quranVerseIds, quranDataAvailable] = quranResult;
  const hifzSessions = hifz.sessions.filter((session) => session.date === dateKey);
  const hifzReviewsCompleted = hifzSessions.filter(
    (session) => session.date === dateKey && session.completed === true,
  ).length;
  const prayerCompletions = await readPrayerCompletions(dateKey, prayerHistory);
  const prayerDataAvailable = Object.prototype.hasOwnProperty.call(prayerHistory, dateKey);
  const tahajjudDataAvailable = Object.prototype.hasOwnProperty.call(tahajjud, dateKey);
  const hasData = Boolean(
    plan || quranVerseIds.size || dhikrData.available || prayerDataAvailable ||
    hifzSessions.length || tahajjudDataAvailable,
  );
  return {
    dateKey,
    plan,
    quranVerseIds: [...quranVerseIds],
    quranDataAvailable,
    dhikrTotal: dhikrData.value,
    dhikrDataAvailable: dhikrData.available,
    prayerCompletions,
    prayerDataAvailable,
    hifzReviewsCompleted,
    hifzDataAvailable: hifzSessions.length > 0,
    tahajjudValidated: Boolean(tahajjud[dateKey]),
    tahajjudDataAvailable,
    hasData,
  };
}

export async function getRange(startDate: LocalDateInput, endDate: LocalDateInput) {
  const start = toLocalDateKey(startDate);
  const end = toLocalDateKey(endDate);
  return Promise.all(enumerateDates(start, end).map(getDailySnapshot));
}

export function isSuccessfulDay(snapshot: DailySnapshot) {
  const plan = snapshot.plan;
  return Boolean(plan?.goals.length) && Boolean(plan?.goals.every(isGoalComplete));
}

export function calculateCurrentStreak(snapshots: readonly DailySnapshot[], today = dailyGoalDateKey()) {
  const byDate = new Map(snapshots.map((snapshot) => [snapshot.dateKey, snapshot]));
  let current = shiftLocalDate(today, -1);
  const todaySnapshot = byDate.get(today);
  if (todaySnapshot?.plan && isSuccessfulDay(todaySnapshot)) current = today;
  let streak = 0;
  while (true) {
    const snapshot = byDate.get(current);
    if (!snapshot?.hasData || !isSuccessfulDay(snapshot)) break;
    streak += 1;
    current = shiftLocalDate(current, -1);
  }
  return streak;
}

export function calculateBestStreak(snapshots: readonly DailySnapshot[]) {
  let best = 0;
  let current = 0;
  for (const snapshot of [...snapshots].sort((left, right) => left.dateKey.localeCompare(right.dateKey))) {
    if (snapshot.hasData && isSuccessfulDay(snapshot)) {
      current += 1;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

export const progressionRepository = {
  getDailySnapshot,
  getRange,
  getDhikrTotal,
  getPrayerCompletions,
  isSuccessfulDay,
  calculateCurrentStreak,
  calculateBestStreak,
};
