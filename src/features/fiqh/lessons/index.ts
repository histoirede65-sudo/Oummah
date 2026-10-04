import { FASTING_LESSONS } from "./fasting";
import { HAJJ_LESSONS } from "./hajj";
import { PRAYER_LESSONS } from "./prayer";
import { PURIFICATION_LESSONS } from "./purification";
import type { LessonEntry } from "./types";
import { ZAKAT_LESSONS } from "./zakat";

/** Hand-written lessons by topic id, one file per book. */
export const FIQH_LESSONS: Record<string, LessonEntry> = {
  ...PURIFICATION_LESSONS,
  ...PRAYER_LESSONS,
  ...FASTING_LESSONS,
  ...ZAKAT_LESSONS,
  ...HAJJ_LESSONS,
};
