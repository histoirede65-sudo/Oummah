import { PRAYER_LESSONS } from "./prayer";
import { PURIFICATION_LESSONS } from "./purification";
import type { LessonEntry } from "./types";

/** Hand-written lessons by topic id, one file per book. */
export const FIQH_LESSONS: Record<string, LessonEntry> = {
  ...PURIFICATION_LESSONS,
  ...PRAYER_LESSONS,
};
