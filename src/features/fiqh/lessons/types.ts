import type { FiqhCase, FiqhLesson, FiqhPoint } from "../fiqhTypes";

/** A hand-written lesson. With `chapter` and `title`, it also creates a new topic in that chapter. */
export type LessonEntry = FiqhLesson & {
  title?: string;
  arabic?: string;
  summary?: string;
  chapter?: string;
  aliases?: string[];
  sensitive?: boolean;
};

/** A point backed by sources: p("texte", "bukhari-159", "quran-5-6"). */
export const p = (text: string, ...ids: string[]): FiqhPoint => ({ text, ids });
/** A frequent case: c("question ?", "réponse.", ...sources). */
export const c = (q: string, a: string, ...ids: string[]): FiqhCase => ({ q, a, ids });
