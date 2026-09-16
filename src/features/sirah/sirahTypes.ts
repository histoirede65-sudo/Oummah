export type SirahCertainty =
  | "QURAN"
  | "AUTHENTIC_HADITH"
  | "SIRA"
  | "HISTORY"
  | "DISCUSSED"
  | "NOT_ESTABLISHED";

export type SirahSource = { kind: SirahCertainty; label: string; reference: string };
export type SirahAssertion = { id: string; text: string; certainty: SirahCertainty; sources: SirahSource[] };
export type SirahChapter = { id: string; title: string; importance?: "major" | "ordinary"; assertions: SirahAssertion[]; lessons: string[] };
export type SirahPeriod = { id: string; title: string; subtitle: string; era: string; chapters: SirahChapter[] };
