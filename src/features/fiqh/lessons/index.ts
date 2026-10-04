import { FAMILY_LESSONS, FUNERAL_LESSONS } from "./family";
import { FASTING_LESSONS } from "./fasting";
import { HAJJ_LESSONS } from "./hajj";
import { ANIMAL_LESSONS, CLOTHING_LESSONS, DAILY_LESSONS, FOOD_LESSONS, INHERITANCE_LESSONS, JUSTICE_LESSONS, OATH_LESSONS, SIYAR_LESSONS, TRANSACTION_LESSONS } from "./life";
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
  ...FUNERAL_LESSONS,
  ...FAMILY_LESSONS,
  ...TRANSACTION_LESSONS,
  ...FOOD_LESSONS,
  ...OATH_LESSONS,
  ...CLOTHING_LESSONS,
  ...DAILY_LESSONS,
  ...JUSTICE_LESSONS,
  ...INHERITANCE_LESSONS,
  ...ANIMAL_LESSONS,
  ...SIYAR_LESSONS,
};
