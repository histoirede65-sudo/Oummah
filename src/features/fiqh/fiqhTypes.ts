export type FiqhSourceKind = "quran" | "hadith" | "fiqh-book" | "scholar";
export type FiqhPublicationStatus = "published" | "limited" | "coming_soon" | "blocked";
export type FiqhLocalizedText = { fr: string; ar?: string };
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

export type FiqhEvidence = { text: string; evidenceIds: string[] };
export type FiqhClaim = { text: string; evidenceIds: string[] };
export type FiqhTopicContent = {
  introduction?: string;
  definition?: FiqhClaim[];
  ceQuiEstEtabli?: FiqhClaim[];
  pratique?: FiqhClaim[];
  enseignements?: FiqhClaim[];
  limites?: string[];
  divergences?: FiqhClaim[];
  casPersonnel?: string;
  questions?: FiqhQuestion[];
};

export type FiqhQuestion = {
  id: string;
  question: string;
  answer: FiqhClaim[];
};

export type FiqhSectionData = {
  id: string;
  title: string;
  claims?: FiqhClaim[];
  questionIds?: string[];
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

/** Clear reading version of a lesson: short answer, rules, steps, frequent cases, mistakes, nuances. */
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
  lesson?: FiqhLesson;
  categoryId: string;
  title: string;
  arabicTerm?: string;
  summary: string;
  aliases: string[];
  badge: FiqhBadge;
  publicationStatus?: FiqhPublicationStatus;
  established: string[];
  proofs: string[];
  evidence?: FiqhEvidence[];
  content?: FiqhTopicContent;
  howTo: string[];
  conditions: string[];
  invalidators: string[];
  commonMistakes: string[];
  specialCases: string[];
  differences: FiqhDifference[];
  takeaway: string[];
  sourceIds: string[];
  sensitive?: boolean;
  link?: { label: string; route: string };
};

export type FiqhCategory = {
  id: string;
  title: string;
  arabicTitle?: string;
  summary: string;
  topicIds: string[];
  chapters?: FiqhChapter[];
};
