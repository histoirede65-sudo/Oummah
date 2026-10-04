export type FiqhSourceKind = "quran" | "hadith" | "fiqh-book" | "scholar";
export type FiqhSourceTarget = { type: "hadith"; hadithId: string };
export type FiqhBadge = "LARGEMENT ÉTABLI" | "REPÈRES ESSENTIELS" | "DIVERGENCE JURIDIQUE" | "CAS PERSONNEL";

export type FiqhSource = {
  id: string;
  kind: FiqhSourceKind;
  reference: string;
  canonicalReference?: string;
  author?: string;
  authenticity?: string;
  scope?: string;
  limits?: string;
  target?: FiqhSourceTarget;
};

export type FiqhChapter = {
  id: string;
  categoryId: string;
  title: string;
  description?: string;
  topicIds: string[];
};

export type FiqhPosition = {
  label: "Hanafite" | "Malikite" | "Shafi‘ite" | "Hanbalite" | "Avis documenté";
  position: string;
  consequence?: string;
  sourceIds: string[];
  verificationStatus?: "verified_primary" | "externally_verified_primary" | "partial";
};

/** A question on which the schools differ, with each school's documented position. */
export type FiqhDifference = {
  id?: string;
  question: string;
  established: string;
  positions: FiqhPosition[];
  practicalNote: string;
  introduction?: string;
  limits?: string[];
};

/** A point of a lesson, with the ids of the sources that support it. */
export type FiqhPoint = { text: string; ids?: string[] };
export type FiqhCase = { q: string; a: string; ids?: string[] };

/** Reading text of a lesson: short answer, rules, steps, frequent cases, mistakes, nuances. */
export type FiqhLesson = {
  short: string;
  rules: FiqhPoint[];
  steps?: FiqhPoint[];
  cases?: FiqhCase[];
  avoid?: string[];
  note?: string[];
  sourceIds?: string[];
};

export type FiqhTopic = {
  id: string;
  categoryId: string;
  title: string;
  arabicTerm?: string;
  summary: string;
  aliases: string[];
  badge: FiqhBadge;
  sensitive?: boolean;
  sourceIds: string[];
  differences: FiqhDifference[];
  link?: { label: string; route: string };
  lesson?: FiqhLesson;
};

export type FiqhCategory = {
  id: string;
  title: string;
  arabicTitle?: string;
  summary: string;
  topicIds: string[];
  chapters?: FiqhChapter[];
};
