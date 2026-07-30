import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Hadith } from "../domain/Hadith";

export type HadithLearningCadence = "daily" | "three-weekly" | "weekly";
export type HadithReviewRating = "again" | "hard" | "good" | "easy";

export type HadithLearningProgram = {
  id: string;
  title: string;
  description: string;
  query: string;
  cadence: HadithLearningCadence;
  targetCount: number;
  createdAt: number;
};

export type HadithReview = {
  hadithId: string;
  title: string;
  stage: number;
  repetitions: number;
  nextReviewAt: number;
  lastRating: HadithReviewRating;
  updatedAt: number;
};

export type HadithLearningState = {
  version: 1;
  activeProgram: HadithLearningProgram | null;
  reviews: HadithReview[];
  completedSessions: number;
  memorizedIds: string[];
  streak: number;
  lastSessionDate?: string;
};

const KEY = "oumma:hadith:learning:v1";
const DAY = 86400000;

export const HADITH_PROGRAM_TEMPLATES = [
  { id: "one-day", title: "1 hadith par jour", description: "Un rythme doux et régulier.", query: "comportement", cadence: "daily", targetCount: 30 },
  { id: "three-week", title: "3 par semaine", description: "Approfondir sans se presser.", query: "foi", cadence: "three-weekly", targetCount: 24 },
  { id: "nawawi", title: "Les 40 Nawawi", description: "Un parcours parmi les fondements essentiels.", query: "An-Nawawî", cadence: "daily", targetCount: 40 },
  { id: "character", title: "Beau comportement", description: "Patience, douceur, vérité et fraternité.", query: "bon comportement", cadence: "three-weekly", targetCount: 30 },
] satisfies readonly Omit<HadithLearningProgram, "createdAt">[];

const DEFAULT_STATE: HadithLearningState = { version: 1, activeProgram: null, reviews: [], completedSessions: 0, memorizedIds: [], streak: 0 };

function dateKey(date = new Date()) { return date.toISOString().slice(0, 10); }

export async function loadHadithLearningState(): Promise<HadithLearningState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const stored = JSON.parse(raw) as Partial<HadithLearningState>;
    return { ...DEFAULT_STATE, ...stored, reviews: stored.reviews ?? [], memorizedIds: stored.memorizedIds ?? [] };
  } catch { return DEFAULT_STATE; }
}

export function saveHadithLearningState(state: HadithLearningState) { return AsyncStorage.setItem(KEY, JSON.stringify(state)); }

export async function activateHadithProgram(template: Omit<HadithLearningProgram, "createdAt">) {
  const state = await loadHadithLearningState();
  const next = { ...state, activeProgram: { ...template, createdAt: Date.now() } };
  await saveHadithLearningState(next);
  return next;
}

export function dueHadithReviews(state: HadithLearningState, now = Date.now()) { return state.reviews.filter((review) => review.nextReviewAt <= now).sort((a, b) => a.nextReviewAt - b.nextReviewAt); }

export async function recordHadithReview(hadith: Hadith, rating: HadithReviewRating) {
  const state = await loadHadithLearningState();
  const current = state.reviews.find((item) => item.hadithId === hadith.id);
  const previousStage = current?.stage ?? 0;
  const stage = rating === "again" ? 0 : rating === "hard" ? Math.max(1, previousStage) : rating === "good" ? previousStage + 1 : previousStage + 2;
  const intervals = [0.02, 1, 3, 7, 14, 30, 60, 120];
  const factor = rating === "hard" ? 0.6 : rating === "easy" ? 1.35 : 1;
  const nextReviewAt = Date.now() + Math.max(10 * 60 * 1000, (intervals[Math.min(stage, intervals.length - 1)] ?? 120) * factor * DAY);
  const today = dateKey();
  const yesterday = dateKey(new Date(Date.now() - DAY));
  const streak = state.lastSessionDate === today ? state.streak : state.lastSessionDate === yesterday ? state.streak + 1 : 1;
  const review: HadithReview = { hadithId: hadith.id, title: hadith.title, stage, repetitions: (current?.repetitions ?? 0) + 1, nextReviewAt, lastRating: rating, updatedAt: Date.now() };
  const memorized = stage >= 5;
  const next: HadithLearningState = {
    ...state,
    reviews: [review, ...state.reviews.filter((item) => item.hadithId !== hadith.id)],
    completedSessions: state.completedSessions + 1,
    memorizedIds: memorized ? Array.from(new Set([...state.memorizedIds, hadith.id])) : state.memorizedIds,
    streak,
    lastSessionDate: today,
  };
  await saveHadithLearningState(next);
  return next;
}

