import { storageService } from "../../core/storage";

export type HifzLevel = "new" | "learning" | "review" | "mastered";

export type HifzSurahProgress = {
  surahId: number;
  learnedVerses: number[];
  difficultVerses: number[];
  lastStudiedAt?: string;
  nextReviewAt?: string;
  reviewCount: number;
};

export type HifzSession = {
  date: string;
  minutes: number;
  learned: number;
  reviewed: number;
  surahIds: number[];
};

export type HifzState = {
  version: 2;
  dailyTarget: number;
  annualTarget: number;
  progress: HifzSurahProgress[];
  sessions: HifzSession[];
  streak: number;
  plannedRanges?: { surahId: number; startVerse: number; endVerse: number }[];
};

const KEY = "oummah.hifz.v1";

export const DEFAULT_HIFZ_STATE: HifzState = {
  version: 2,
  dailyTarget: 3,
  annualTarget: 180,
  progress: [],
  sessions: [],
  streak: 0,
  plannedRanges: [],
};

export async function loadHifzState(): Promise<HifzState> {
  const stored = await storageService.get<HifzState>(KEY).catch(() => null);
  if (!stored || stored.version !== 2) return DEFAULT_HIFZ_STATE;
  return {
    ...DEFAULT_HIFZ_STATE,
    ...stored,
    progress: stored.progress ?? [],
    sessions: stored.sessions ?? [],
    plannedRanges: stored.plannedRanges ?? [],
  };
}

export function saveHifzState(state: HifzState) {
  return storageService.set(KEY, state);
}

export function dateKey(value = new Date()) {
  return value.toISOString().slice(0, 10);
}

export function upsertHifzProgress(
  state: HifzState,
  surahId: number,
  update: (current: HifzSurahProgress) => HifzSurahProgress,
): HifzState {
  const existing = state.progress.find((item) => item.surahId === surahId) ?? {
    surahId,
    learnedVerses: [],
    difficultVerses: [],
    reviewCount: 0,
  };
  const next = update(existing);
  return {
    ...state,
    progress: [
      ...state.progress.filter((item) => item.surahId !== surahId),
      next,
    ],
  };
}

export function hifzLevel(learned: number, total: number): HifzLevel {
  if (learned === 0) return "new";
  if (learned >= total) return "mastered";
  if (learned / total >= 0.55) return "review";
  return "learning";
}

export function reviewDue(state: HifzState, now = new Date()) {
  const time = now.getTime();
  return state.progress
    .filter(
      (item) =>
        item.learnedVerses.length > 0 &&
        (!item.nextReviewAt || new Date(item.nextReviewAt).getTime() <= time),
    )
    .sort((left, right) => right.difficultVerses.length - left.difficultVerses.length);
}
