export type Localized = { fr: string; en: string };

/** Where a companion appears in the full list. */
export type CompanionSection = "caliphs" | "promised" | "mecca" | "medina" | "women";

/** Filters on the list; a companion can belong to several. */
export type CompanionGroup = "caliphs" | "promised" | "women" | "ansar" | "scholars";

export type CompanionFactKey = "name" | "kunya" | "tribe" | "islam" | "death";

export type CompanionQuote = {
  kind: "quran" | "hadith";
  /** Exact text of the official translation (Hamidullah / Saheeh) or of the collection's translation. */
  text: Localized;
  ref: Localized;
  grade?: Localized;
};

export type CompanionPeriod = {
  id: string;
  title: Localized;
  date?: Localized;
  paragraphs: Localized[];
  quotes?: CompanionQuote[];
  sources?: Localized[];
};

export type Companion = {
  id: string;
  section: CompanionSection;
  groups: CompanionGroup[];
  name: Localized;
  /** Name used in headers and on the caliph cards (« Abû Bakr », « Ibn ‘Abbâs »). */
  shortName: Localized;
  arabicName: string;
  arabicShort?: string;
  /** First letter of the Arabic name, shown instead of a portrait. */
  initial: string;
  shortTitle: Localized;
  /** Title or nickname (« as-Siddîq ») and what it means. */
  laqab?: Localized;
  laqabMeaning?: Localized;
  years?: Localized;
  summary: Localized;
  facts: { key: CompanionFactKey; value: Localized }[];
  periods: CompanionPeriod[];
  lessons: Localized[];
};
