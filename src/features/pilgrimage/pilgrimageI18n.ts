import { useMemo } from "react";

import { useI18n, type LanguageCode } from "../../i18n";
import { BOOKS, HAJJ_TYPE_LABELS, hajjTypeGuidance } from "./pilgrimageBook";
import { BOOK_TITLES_EN, CHAPTERS_EN, HAJJ_TYPE_GUIDANCE_EN, HAJJ_TYPE_LABELS_EN, STEPS_EN, type StepText } from "./pilgrimageBook.en";
import { INVOCATIONS } from "./pilgrimageInvocations";
import { INVOCATIONS_EN } from "./pilgrimageInvocations.en";
import type { Book, HajjType, Importance, Invocation, InvocationStatus, Point, Rite, Source, SourceKind, Step } from "./pilgrimageTypes";

/**
 * The module is written in French; English replaces the sentences one by one, never the structure
 * (order, sources, importance, tools). A missing English sentence falls back to French.
 */

const FIQH_REFERENCES_EN: Record<string, string> = {
  "Fiqh : détails selon les écoles": "Fiqh: details vary by school",
  "Divergence juridique : purification du Tawâf": "Juristic difference: purity for the Tawaf",
  "Al-Nawawî, Al-Majmû‘, chapitre du Tawâf": "Al-Nawawi, Al-Majmu‘, chapter on Tawaf",
  "Ibn Qudâma, Al-Mughnî, chapitre du Tawâf": "Ibn Qudamah, Al-Mughni, chapter on Tawaf",
  "Fiqh : conditions d’application": "Fiqh: when it applies",
  "Fiqh : statut de la visite de Médine": "Fiqh: status of the visit to Medina",
  "Pratique rapportée d’Ibn ‘Umar — Muwatta’ Mâlik": "Practice reported from Ibn ‘Umar — Muwatta’ Malik",
  "Hady du Tamattu‘ et du Qirân : divergence juridique": "Hady for Tamattu‘ and Qiran: juristic difference",
  "Fiqh : moment du Sa‘y du Hajj": "Fiqh: when to perform the Sa‘y of Hajj",
  "Fiqh : limites de ‘Arafât": "Fiqh: boundaries of ‘Arafat",
  "Ordre des rites du 10 Dhul-Hijjah : divergence juridique": "Order of the rites of 10 Dhul-Hijjah: juristic difference",
  "Fiqh : première et seconde désacralisation": "Fiqh: first and second release from ihram",
  "Départ anticipé : fiqh comparé": "Early departure: comparative fiqh",
  "Exemptions : divergence juridique": "Exemptions: juristic difference",
};

const COLLECTIONS_EN: [RegExp, string][] = [
  [/^Coran /, "Quran "],
  [/^Sahîh al-Bukhârî /, "Sahih al-Bukhari "],
  [/^Sahîh Muslim /, "Sahih Muslim "],
  [/^Sunan Abî Dâwûd /, "Sunan Abi Dawud "],
  [/^Sunan Ibn Mâjah /, "Sunan Ibn Majah "],
  [/^Sunan at-Tirmidhî /, "Jami‘ at-Tirmidhi "],
];

export function sourceReference(reference: string, language: LanguageCode): string {
  if (language === "fr") return reference;
  if (FIQH_REFERENCES_EN[reference]) return FIQH_REFERENCES_EN[reference];
  for (const [pattern, english] of COLLECTIONS_EN) {
    if (pattern.test(reference)) return reference.replace(pattern, english);
  }
  return reference;
}

/** Chip label, without the « Coran » / « Quran » prefix the chip already shows. */
export function sourceChipReference(reference: string, language: LanguageCode): string {
  return sourceReference(reference, language).replace(/^(Coran|Quran) /, "");
}

const SOURCE_KIND_LABELS: Record<LanguageCode, Record<SourceKind, string>> = {
  fr: { QURAN: "Coran", AUTHENTIC_HADITH: "Hadith", JURISTIC_DIFFERENCE: "Divergence", FIQH: "Fiqh" },
  en: { QURAN: "Quran", AUTHENTIC_HADITH: "Hadith", JURISTIC_DIFFERENCE: "Difference", FIQH: "Fiqh" },
};

export function sourceKindLabel(kind: SourceKind, language: LanguageCode): string {
  return SOURCE_KIND_LABELS[language][kind];
}

const IMPORTANCE_EN: Record<Importance, string> = {
  PILIER: "PILLAR",
  OBLIGATION: "OBLIGATION",
  SUNNA: "SUNNAH",
  "DIVERGENCE JURIDIQUE": "JURISTIC DIFFERENCE",
};

export function importanceLabel(importance: Importance, language: LanguageCode): string {
  return language === "fr" ? importance : IMPORTANCE_EN[importance];
}

const STATUS_EN: Record<InvocationStatus, string> = {
  "SUNNA AUTHENTIQUE": "AUTHENTIC SUNNAH",
  "HADITH HASAN": "HASAN HADITH",
  "VERSET CORANIQUE": "QURANIC VERSE",
  "INVOCATION CORANIQUE GÉNÉRALE": "GENERAL QURANIC SUPPLICATION",
  "INVOCATION LIBRE": "YOUR OWN SUPPLICATION",
};

export function invocationStatusLabel(status: InvocationStatus, language: LanguageCode): string {
  return language === "fr" ? status : STATUS_EN[status];
}

// ----- Books ---------------------------------------------------------------------------------

function points(french: Point[] | undefined, english: string[] | undefined): Point[] | undefined {
  if (!french) return undefined;
  return french.map((point, index) => ({ ...point, text: english?.[index] ?? point.text }));
}

function localizeStep(step: Step, rite: Rite): Step {
  const base = STEPS_EN[step.id] as Partial<StepText> | undefined;
  const text: Partial<StepText> = { ...base, ...(rite === "hajj" ? STEPS_EN[`hajj:${step.id}`] : undefined) };
  return {
    ...step,
    title: text.title ?? step.title,
    summary: text.summary ?? step.summary,
    todo: points(step.todo, text.todo) ?? [],
    notes: points(step.notes, text.notes),
    men: points(step.men, text.men),
    women: points(step.women, text.women),
    avoid: points(step.avoid, text.avoid),
    mistakes: points(step.mistakes, text.mistakes),
    differences: step.differences?.map((difference, index) => {
      const english = text.differences?.[index];
      return {
        ...difference,
        question: english?.question ?? difference.question,
        establishedPoint: english?.establishedPoint ?? difference.establishedPoint,
        practicalNote: english?.practicalNote ?? difference.practicalNote,
        views: difference.views.map((view, viewIndex) => ({
          ...view,
          label: english?.views[viewIndex]?.label ?? view.label,
          position: english?.views[viewIndex]?.position ?? view.position,
          consequence: english?.views[viewIndex]?.consequence ?? view.consequence,
        })),
      };
    }),
  };
}

function localizeBook(book: Book): Book {
  return {
    ...book,
    title: BOOK_TITLES_EN[book.rite],
    chapters: book.chapters.map((chapter) => ({
      ...chapter,
      title: CHAPTERS_EN[chapter.id]?.title ?? chapter.title,
      marker: CHAPTERS_EN[chapter.id]?.marker ?? chapter.marker,
      steps: chapter.steps.map((step) => localizeStep(step, book.rite)),
    })),
  };
}

let englishBooks: Record<Rite, Book> | null = null;

export function getBooks(language: LanguageCode): Record<Rite, Book> {
  if (language === "fr") return BOOKS;
  englishBooks ??= { umrah: localizeBook(BOOKS.umrah), hajj: localizeBook(BOOKS.hajj) };
  return englishBooks;
}

export function hajjTypeLabel(type: HajjType, language: LanguageCode) {
  const french = HAJJ_TYPE_LABELS[type];
  return language === "fr" ? french : { ...french, ...HAJJ_TYPE_LABELS_EN[type] };
}

export function hajjTypeText(type: HajjType, language: LanguageCode): string {
  return language === "fr" ? hajjTypeGuidance(type) : HAJJ_TYPE_GUIDANCE_EN[type];
}

// ----- Invocations ---------------------------------------------------------------------------

let englishInvocations: Invocation[] | null = null;

export function getInvocations(language: LanguageCode): Invocation[] {
  if (language === "fr") return INVOCATIONS;
  englishInvocations ??= INVOCATIONS.map((invocation) => ({ ...invocation, ...INVOCATIONS_EN[invocation.id] }));
  return englishInvocations;
}

/** Books, invocations and labels in the reader's language. */
export function usePilgrimageContent() {
  const { language } = useI18n();
  return useMemo(() => {
    const invocations = getInvocations(language);
    return {
      language,
      books: getBooks(language),
      invocations,
      invocationsById: Object.fromEntries(invocations.map((item) => [item.id, item])) as Record<string, Invocation>,
      typeLabel: (type: HajjType) => hajjTypeLabel(type, language),
      typeText: (type: HajjType) => hajjTypeText(type, language),
      reference: (source: Source) => sourceReference(source.reference, language),
    };
  }, [language]);
}
