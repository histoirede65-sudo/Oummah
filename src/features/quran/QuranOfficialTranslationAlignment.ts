import { sanitizeTranslationText } from "./TranslationText";

export type VerifiedTranslationRange = {
  start: number;
  end: number;
};

type CuratedPhrase = {
  phrase: string;
  occurrence?: number;
};

const FATIHA_ALIGNMENT: Record<string, Record<number, CuratedPhrase>> = {
  "1:1": {
    1: { phrase: "Au nom" },
    2: { phrase: "d’Allah" },
    3: { phrase: "le Tout Miséricordieux" },
    4: { phrase: "le Très Miséricordieux" },
  },
  "1:2": {
    1: { phrase: "Louange" },
    2: { phrase: "à Allah" },
    3: { phrase: "Seigneur" },
    4: { phrase: "l’Univers" },
  },
  "1:3": {
    1: { phrase: "Le Tout Miséricordieux" },
    2: { phrase: "le Très Miséricordieux" },
  },
  "1:4": {
    1: { phrase: "Maître" },
    2: { phrase: "du Jour" },
    3: { phrase: "de la Rétribution" },
  },
  "1:5": {
    1: { phrase: "C’est Toi [Seul]", occurrence: 1 },
    2: { phrase: "nous adorons" },
    3: { phrase: "c’est Toi [Seul]", occurrence: 2 },
    4: { phrase: "implorons secours" },
  },
  "1:6": {
    1: { phrase: "Guide-nous" },
    2: { phrase: "dans le droit chemin" },
    3: { phrase: "droit chemin" },
  },
  "1:7": {
    1: { phrase: "Le chemin" },
    2: { phrase: "ceux que Tu as comblés de faveurs" },
    3: { phrase: "ceux que Tu as comblés de faveurs" },
    4: { phrase: "ceux que Tu as comblés de faveurs" },
    5: { phrase: "non pas" },
    6: { phrase: "ceux qui ont encouru Ta colère" },
    7: { phrase: "ceux qui ont encouru Ta colère" },
    8: { phrase: "ni" },
    9: { phrase: "des égarés" },
  },
};

const STOP_WORDS = new Set([
  "a",
  "au",
  "aux",
  "ce",
  "ces",
  "de",
  "des",
  "du",
  "en",
  "et",
  "la",
  "le",
  "les",
  "ou",
  "par",
  "pour",
  "que",
  "qui",
  "sur",
  "un",
  "une",
]);

function comparable(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[’‘`]/gu, "'")
    .toLocaleLowerCase("fr");
}

function findOccurrence(
  officialTranslation: string,
  phrase: string,
  occurrence = 1,
): VerifiedTranslationRange | null {
  const source = comparable(officialTranslation);
  const target = comparable(phrase);
  let from = 0;
  let index = -1;

  for (let current = 0; current < occurrence; current += 1) {
    index = source.indexOf(target, from);
    if (index < 0) return null;
    from = index + target.length;
  }
  return { start: index, end: index + target.length };
}

type Token = {
  normalized: string;
  start: number;
  end: number;
};

function tokens(value: string): Token[] {
  const result: Token[] = [];
  for (const match of value.matchAll(/[\p{L}\p{N}]+/gu)) {
    const text = match[0];
    const start = match.index ?? 0;
    result.push({ normalized: comparable(text), start, end: start + text.length });
  }
  return result;
}

function findExactSharedPhrase(
  officialTranslation: string,
  wordGloss: string,
): VerifiedTranslationRange | null {
  const officialTokens = tokens(officialTranslation);
  const glossTokens = tokens(sanitizeTranslationText(wordGloss));
  let bestLength = 0;
  let bestRanges: Array<{ start: number; end: number; length: number }> = [];

  for (let officialIndex = 0; officialIndex < officialTokens.length; officialIndex += 1) {
    for (let glossIndex = 0; glossIndex < glossTokens.length; glossIndex += 1) {
      let length = 0;
      while (
        officialTokens[officialIndex + length]?.normalized ===
        glossTokens[glossIndex + length]?.normalized
      ) {
        length += 1;
      }
      if (!length || length < bestLength) continue;
      const first = officialTokens[officialIndex];
      const last = officialTokens[officialIndex + length - 1];
      const range = { start: first.start, end: last.end, length };
      if (length > bestLength) {
        bestLength = length;
        bestRanges = [range];
      } else if (
        !bestRanges.some(
          (candidate) =>
            candidate.start === range.start && candidate.end === range.end,
        )
      ) {
        bestRanges.push(range);
      }
    }
  }

  // A repeated phrase cannot be assigned to one Arabic word with certainty.
  const [best] = bestRanges;
  if (!best || bestRanges.length !== 1) return null;
  if (best.length >= 2) return { start: best.start, end: best.end };

  const onlyToken = comparable(officialTranslation.slice(best.start, best.end));
  const meaningfulGlossTokens = glossTokens.filter(
    (token) => token.normalized.length >= 3 && !STOP_WORDS.has(token.normalized),
  );
  if (
    onlyToken.length >= 4 &&
    !STOP_WORDS.has(onlyToken) &&
    meaningfulGlossTokens.length <= 2
  ) {
    return { start: best.start, end: best.end };
  }
  return null;
}

/**
 * Returns a range only when it is curated or textually exact. It deliberately
 * refuses semantic guessing between two different French translations.
 */
export function getVerifiedOfficialTranslationRange({
  verseKey,
  wordPosition,
  officialTranslation,
  wordGloss,
}: {
  verseKey: string;
  wordPosition: number;
  officialTranslation: string;
  wordGloss: string;
}): VerifiedTranslationRange | null {
  const curated = FATIHA_ALIGNMENT[verseKey]?.[wordPosition];
  if (curated) {
    return findOccurrence(
      officialTranslation,
      curated.phrase,
      curated.occurrence,
    );
  }
  return findExactSharedPhrase(officialTranslation, wordGloss);
}
