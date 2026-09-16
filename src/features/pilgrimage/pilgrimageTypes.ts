export type Mode = "umrah" | "hajj";
export type HajjType = "tamattu" | "qiran" | "ifrad";
export type SourceKind = "QURAN" | "AUTHENTIC_HADITH" | "FIQH" | "JURISTIC_DIFFERENCE";
export type Importance = "PILIER" | "OBLIGATION" | "RECOMMANDÉ" | "DIVERGENCE JURIDIQUE";
export type Source = { kind: SourceKind; reference: string };
export type Assertion = { id: string; text: string; importance?: Importance; sources: Source[] };
export type JuristicView = { label: string; position: string; consequence?: string; evidences: Source[] };
export type JuristicDifference = { question: string; establishedPoint?: string; views: JuristicView[]; practicalNote?: string };
export type Step = { id: string; title: string; summary: string; do: Assertion[]; say?: Assertion[]; avoid?: Assertion[]; ifProblem?: Assertion[]; whatToDo?: Assertion[]; when?: Assertion[]; how?: Assertion[]; whatToSay?: Assertion[]; men?: Assertion[]; women?: Assertion[]; commonMistakes?: Assertion[]; specialCases?: Assertion[]; evidences?: Source[]; juristicDifferences?: JuristicDifference[] };
export type Invocation = { id: string; arabic: string; transliteration: string; translation: string; context: string; status: "SUNNAH AUTHENTIQUE" | "INVOCATION CORANIQUE GÉNÉRALE" | "VERSET CORANIQUE" | "INVOCATION GÉNÉRALE" | "INVOCATION LIBRE"; sources: Source[] };
export type Problem = { id: string; question: string; answer: string; sources: Source[]; difference?: string; situation?: string; shortAnswer?: string; whatToKnow?: string; whatToDoNow?: string; differences?: JuristicDifference[]; whenToSeekHelp?: string; evidences?: Source[] };
export type Progress = { mode: Mode; hajjType?: HajjType; stepId: string; tawafCount: number; sayCount: number };

export function sourceLabel(kind: SourceKind): string {
  switch (kind) {
    case "QURAN": return "CORAN";
    case "AUTHENTIC_HADITH": return "HADITH AUTHENTIQUE";
    case "JURISTIC_DIFFERENCE": return "DIVERGENCE JURIDIQUE";
    default: return "FIQH";
  }
}

