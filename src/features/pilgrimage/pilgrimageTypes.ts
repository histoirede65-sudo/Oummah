export type Rite = "umrah" | "hajj";
export type HajjType = "tamattu" | "qiran" | "ifrad";
export type SourceKind = "QURAN" | "AUTHENTIC_HADITH" | "FIQH" | "JURISTIC_DIFFERENCE";
export type Importance = "PILIER" | "OBLIGATION" | "SUNNA" | "DIVERGENCE JURIDIQUE";
export type Source = { kind: SourceKind; reference: string };

/** One sourced statement of the book. */
export type Point = { text: string; sources?: Source[]; importance?: Importance };

export type JuristicView = { label: string; position: string; consequence?: string; evidences: Source[] };
export type JuristicDifference = { question: string; establishedPoint?: string; views: JuristicView[]; practicalNote?: string };

/** Drawing shown at the top of a page. */
export type Visual =
  | "preparation" | "miqat" | "ihram" | "talbiya" | "prohibitions" | "haram" | "tawaf" | "stone"
  | "prayer" | "zamzam" | "sai" | "hair" | "exit" | "done" | "types" | "mina" | "arafat"
  | "muzdalifa" | "jamarat" | "sacrifice" | "ifada" | "farewell"
  | "medina" | "rawda" | "salam" | "quba" | "baqi" | "uhud";

/** A companion tool the page can open (Mode Pèlerin). */
export type Tool = "tawaf" | "sai" | "jamarat" | "miqat";

export type Step = {
  id: string;
  title: string;
  arabic?: string;
  summary: string;
  visual: Visual;
  /** Numbered actions: what to do. */
  todo: Point[];
  /** Invocation ids (see pilgrimageInvocations). */
  say?: string[];
  /** Good to know: how, when, special cases. */
  notes?: Point[];
  men?: Point[];
  women?: Point[];
  avoid?: Point[];
  mistakes?: Point[];
  differences?: JuristicDifference[];
  tool?: Tool;
  /** Shows the « Mes dou‘as à faire » shortcut (places where pilgrims make their requests). */
  duas?: boolean;
  /** Hajj only: the types this page applies to (all when absent). */
  only?: HajjType[];
};

export type Chapter = {
  id: string;
  title: string;
  /** Short marker shown in the navigation (day, place). */
  marker: string;
  steps: Step[];
};

export type Book = { rite: Rite; title: string; arabic: string; chapters: Chapter[] };

export type InvocationStatus =
  | "SUNNA AUTHENTIQUE"
  | "HADITH HASAN"
  | "VERSET CORANIQUE"
  | "INVOCATION CORANIQUE GÉNÉRALE"
  | "INVOCATION LIBRE";

export type Invocation = {
  id: string;
  moment: string;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  context: string;
  status: InvocationStatus;
  sources: Source[];
};

export type ProblemCategory = "ihram" | "tawaf" | "health" | "women" | "hajj";

export type Problem = {
  id: string;
  category: ProblemCategory;
  question: string;
  whatToKnow: string;
  whatToDoNow: string;
};

export function sourceLabel(kind: SourceKind): string {
  switch (kind) {
    case "QURAN": return "Coran";
    case "AUTHENTIC_HADITH": return "Hadith";
    case "JURISTIC_DIFFERENCE": return "Divergence";
    default: return "Fiqh";
  }
}
