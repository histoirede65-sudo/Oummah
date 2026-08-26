export type CompanionCategory = "all" | "caliphs" | "promised";

export type CompanionCalloutKind =
  | "AUTHENTIC_HADITH"
  | "PROPHET_WORD"
  | "ESTABLISHED_FACT"
  | "HISTORICAL_MARKER"
  | "SOURCE_NOTE"
  | "DISPUTED_ACCOUNT";

export type CompanionSource = {
  label: string;
  reference: string;
  kind: "QURAN" | "HADITH" | "SIRA" | "HISTORY";
  grade?: string;
  note?: string;
};

export type CompanionCallout = {
  kind: CompanionCalloutKind;
  text: string;
  source?: CompanionSource;
};

export type CompanionPeriod = {
  id: string;
  title: string;
  dateLabel?: string;
  paragraphs: string[];
  callouts?: CompanionCallout[];
  sources?: CompanionSource[];
};

export type Companion = {
  id: string;
  name: string;
  arabicName: string;
  shortTitle: string;
  categories: CompanionCategory[];
  summary: string;
  periods: CompanionPeriod[];
};
