export type Localized = { fr: string; en: string };

export type SirahEraId = "before" | "mecca" | "hijra" | "medina" | "final" | "portrait";

export type SirahEra = { id: SirahEraId; title: Localized; years: Localized; subtitle: Localized };

export type SirahBlock =
  | { type: "text"; text: Localized }
  | {
      type: "quran" | "hadith";
      /** Exact official translation (Hamidullah / Saheeh) or exact excerpt of the collection's translation. */
      text: Localized;
      ref: Localized;
      grade?: Localized;
    };

export type SirahChapter = {
  id: string;
  era: SirahEraId;
  year: Localized;
  yearNote?: Localized;
  place?: Localized;
  title: Localized;
  body: SirahBlock[];
  /** What is uncertain or debated about the chapter, gathered in one place. */
  note?: Localized;
  lessons: Localized[];
  sources?: Localized[];
  minutes: number;
};
