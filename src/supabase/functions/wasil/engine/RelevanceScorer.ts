import { extractSalientTerms } from "./UniversalIntent.ts";

export type ScoredDocument<T> = {
  item: T;
  score: number;
  matchedTerms: string[];
};

export type ScoreOptions = {
  canonicalName?: string | null;
  /** Broad retrieval terms. They improve recall but must not be enough alone. */
  queryTerms?: string[];
  /** Terms that express the exact target of the question. */
  evidenceTerms?: string[];
  /** Adjacent notions that may support, but never prove, relevance alone. */
  relatedTerms?: string[];
  reference?: string;
  text: string;
  kind?: "quran" | "hadith" | "other";
  /** Number of independent search expressions that returned the candidate. */
  retrievalHits?: number;
};

const STOP_WORDS = new Set([
  "allah", "coran", "quran", "islam", "selon", "sunna", "sunnah",
  "hadith", "hadiths", "quels", "quelles", "quel", "quelle", "donne",
  "explique", "conseil", "conseils", "avec", "dans", "pour", "leur",
  "leurs", "entre", "comme", "plus", "sont", "etre", "faire", "comment",
  "pourquoi", "peut", "doit", "doivent", "principal", "principales",
  "important", "importants", "verset", "versets", "sourate", "source",
  "sources", "preuve", "preuves", "religion", "musulman", "musulmane",
  "cette", "cela", "ceux", "celle", "elles", "nous", "vous", "mais",
  "sans", "tout", "toute", "place", "sujet", "propos", "parle", "dit",
  "dire", "developper", "debarrasser", "proteger", "maitriser", "remede",
]);

const GENERIC_RELIGIOUS_TERMS = new Set([
  "allah", "foi", "croyant", "croyants", "islam", "religion", "bien",
  "mal", "peche", "pardon", "paradis", "enfer", "prophete", "messager",
  "adoration", "oeuvre", "oeuvres", "coeur", "coeurs",
]);

const NARRATIVE_MARKERS = [
  "raconte", "raconta", "relate", "histoire de", "lorsqu il", "expedition",
  "bataille", "partit", "revint", "peuple de", "trois compagnons",
  "devint aveugle", "guide de", "tabuk", "voyagea", "rencontra",
  "fut envoye", "un jour", "il arriva", "il demanda alors", "voyage",
  "compagnon raconta", "recit relate", "histoire ancienne", "longue histoire",
];

const DIRECTIVE_MARKERS = [
  "ordonne", "interdit", "ne faites pas", "ne soyez pas", "ecartez vous",
  "prenez garde", "respectez", "accomplissez", "dites", "pardonnez",
  "rendez", "devez", "il est interdit", "quiconque", "celui qui",
  "ne vous", "ne te", "fait partie", "signe de", "meilleur d entre vous",
  "il incombe", "obligatoire", "licite", "illicite", "evitez", "tenez",
];

export function normalizeRelevanceText(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\u0600-\u06ff:]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function normalizedValues(values: Array<string | null | undefined>): string[] {
  return unique(values.map((value) => normalizeRelevanceText(value ?? "")).filter(Boolean));
}

function tokens(values: string[]): string[] {
  return unique(
    values
      .flatMap((value) => normalizeRelevanceText(value).split(" "))
      .filter((term) => term.length >= 4 && !STOP_WORDS.has(term)),
  );
}

function phrases(values: string[]): string[] {
  return unique(
    values
      .map(normalizeRelevanceText)
      .filter((value) => value.length >= 7 && value.split(" ").length >= 2),
  );
}

function frenchStem(token: string): string {
  let value = normalizeRelevanceText(token);
  if (value.length < 5) return value;

  // Lightweight, deterministic stemming for French inflections. It is used
  // only for recall; the semantic verifier remains the second-stage judge.
  const suffixes = [
    "issements", "issement", "atrices", "ateurs", "ations", "ements",
    "atrice", "ateur", "ation", "ement", "euses", "euse", "iques",
    "ique", "eries", "erie", "issant", "issante", "ants", "antes",
    "ent", "ons", "ez", "er", "ir", "re", "ees", "ee", "es", "s",
  ];
  for (const suffix of suffixes) {
    if (value.endsWith(suffix) && value.length - suffix.length >= 4) {
      value = value.slice(0, -suffix.length);
      break;
    }
  }
  return value;
}

function containsWholeTerm(searchable: string, term: string): boolean {
  if ((` ${searchable} `).includes(` ${term} `)) return true;
  const target = frenchStem(term);
  if (target.length < 4) return false;
  return searchable.split(" ").some((token) => {
    const candidate = frenchStem(token);
    if (candidate.length < 4) return false;
    return candidate === target ||
      (Math.min(candidate.length, target.length) >= 5 &&
        (candidate.startsWith(target) || target.startsWith(candidate)));
  });
}

function containsFlexiblePhrase(searchable: string, phrase: string): boolean {
  if (searchable.includes(phrase)) return true;
  const meaningful = phrase
    .split(" ")
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));
  return meaningful.length >= 2 &&
    meaningful.every((token) => containsWholeTerm(searchable, token));
}

function countMarkerHits(searchable: string, markers: string[]): number {
  return markers.filter((marker) => searchable.includes(marker)).length;
}

function parseRangeSpan(reference: string): number | null {
  const match = reference.match(/(?:^|[^0-9])(\d{1,3}):(\d{1,3})-(\d{1,3})(?:$|[^0-9])/);
  if (!match) return null;
  const start = Number(match[2]);
  const end = Number(match[3]);
  if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) return null;
  return end - start + 1;
}

function coverage(matches: string[], all: string[]): number {
  return all.length > 0 ? matches.length / all.length : 0;
}

/**
 * High-recall, topic-agnostic first-stage scorer.
 *
 * The exact target (`evidenceTerms`) is deliberately separated from broader
 * search vocabulary. A source cannot rank highly merely because it discusses
 * a neighbouring virtue, the opposite notion, or a story containing generic
 * religious vocabulary.
 */
export function scoreDocumentRelevance<T>(
  item: T,
  options: ScoreOptions,
): ScoredDocument<T> {
  const canonicalValues = normalizedValues([options.canonicalName]);
  const primaryValues = normalizedValues([
    ...(options.evidenceTerms ?? []),
    ...canonicalValues,
  ]);
  const broadValues = normalizedValues(options.queryTerms ?? []);
  const relatedValues = normalizedValues(options.relatedTerms ?? []);

  const searchable = normalizeRelevanceText(
    `${options.text} ${options.reference ?? ""}`,
  );

  const primaryTokens = tokens(primaryValues);
  const broadTokens = tokens([
    ...broadValues,
    ...extractSalientTerms(broadValues.join(" ")),
  ]);
  const relatedTokens = tokens(relatedValues);
  const primaryPhrases = phrases(primaryValues);
  const broadPhrases = phrases(broadValues);

  const matchedPrimaryTokens = primaryTokens.filter((term) => containsWholeTerm(searchable, term));
  const matchedBroadTokens = broadTokens.filter((term) => containsWholeTerm(searchable, term));
  const matchedRelatedTokens = relatedTokens.filter((term) => containsWholeTerm(searchable, term));
  const matchedPrimaryPhrases = primaryPhrases.filter((phrase) =>
    containsFlexiblePhrase(searchable, phrase)
  );
  const matchedBroadPhrases = broadPhrases.filter((phrase) =>
    containsFlexiblePhrase(searchable, phrase)
  );

  const primaryCoverage = coverage(matchedPrimaryTokens, primaryTokens);
  const broadCoverage = coverage(matchedBroadTokens, broadTokens);
  const relatedCoverage = coverage(matchedRelatedTokens, relatedTokens);

  let score = 0;

  // Exact-target evidence dominates the score.
  score += Math.min(0.42, matchedPrimaryTokens.length * 0.105);
  score += Math.min(0.24, primaryCoverage * 0.30);
  score += Math.min(0.34, matchedPrimaryPhrases.length * 0.17);

  // Broad retrieval vocabulary is useful for recall, but cannot dominate.
  score += Math.min(0.18, matchedBroadTokens.length * 0.035);
  score += Math.min(0.12, broadCoverage * 0.14);
  score += Math.min(0.14, matchedBroadPhrases.length * 0.07);

  // Related notions are only a weak supporting signal.
  score += Math.min(0.07, relatedCoverage * 0.08);

  const canonical = canonicalValues[0] ?? "";
  if (canonical.length >= 5 && searchable.includes(canonical)) score += 0.16;

  const explicitImperative = /\b(?:ne\s+[a-z]{3,}|faites|soyez|rendez|evitez|respectez|preservez|accomplissez|ecrivez|accordez|remboursez|reconciliez|temoignez|remerciez|choisissez|baissez)\b/u.test(searchable);
  const directiveHits = countMarkerHits(searchable, DIRECTIVE_MARKERS) +
    (explicitImperative ? 1 : 0);
  const narrativeHits = countMarkerHits(searchable, NARRATIVE_MARKERS);
  score += Math.min(0.18, directiveHits * 0.055);

  const retrievalHits = Math.max(0, Math.min(6, options.retrievalHits ?? 0));
  score += Math.min(0.10, retrievalHits * 0.025);

  const hasPrimaryMatch = matchedPrimaryTokens.length > 0 || matchedPrimaryPhrases.length > 0;
  const hasOnlyRelatedMatch = !hasPrimaryMatch && matchedRelatedTokens.length > 0;

  if (narrativeHits >= 1 && directiveHits === 0) {
    score -= hasPrimaryMatch ? 0.18 : 0.30;
  }
  if (hasOnlyRelatedMatch) score -= 0.26;

  const rangeSpan = parseRangeSpan(normalizeRelevanceText(options.reference ?? ""));
  if (rangeSpan !== null) {
    if (rangeSpan >= 4 && matchedPrimaryPhrases.length === 0) score -= 0.12;
    if (rangeSpan >= 10 && matchedPrimaryTokens.length < 2) score -= 0.20;
  }

  const allMatchedSubstantive = unique([
    ...matchedPrimaryTokens,
    ...matchedBroadTokens,
  ]).filter((term) => !GENERIC_RELIGIOUS_TERMS.has(term));
  if (allMatchedSubstantive.length === 0) score -= 0.32;

  const onlyGenericBroadMatches = matchedBroadTokens.length > 0 && matchedBroadTokens.every((term) =>
    GENERIC_RELIGIOUS_TERMS.has(term)
  );
  if (onlyGenericBroadMatches && !hasPrimaryMatch) score -= 0.25;

  // When an exact evidence profile exists, adjacent vocabulary alone must not
  // allow a source to become a primary proof.
  if (primaryTokens.length > 0 && !hasPrimaryMatch) {
    score -= 0.24;
    score = Math.min(score, 0.34);
  }

  if (
    matchedPrimaryTokens.length === 0 &&
    matchedBroadTokens.length === 0 &&
    matchedPrimaryPhrases.length === 0 &&
    matchedBroadPhrases.length === 0
  ) {
    score -= 0.38;
  }

  return {
    item,
    score: Math.max(0, Math.min(1, score)),
    matchedTerms: unique([
      ...matchedPrimaryPhrases,
      ...matchedPrimaryTokens,
      ...matchedBroadPhrases,
      ...matchedBroadTokens,
      ...matchedRelatedTokens,
    ]),
  };
}

export function rankDocuments<T>(
  items: T[],
  getOptions: (item: T) => ScoreOptions,
  minimumScore = 0.34,
  maximumItems = 10,
  allowFallback = false,
): ScoredDocument<T>[] {
  const scored = items
    .map((item) => scoreDocumentRelevance(item, getOptions(item)))
    .sort((a, b) => b.score - a.score);

  const retained = scored.filter((entry) => entry.score >= minimumScore);
  if (retained.length > 0) return retained.slice(0, maximumItems);
  return allowFallback ? scored.slice(0, Math.min(2, maximumItems)) : [];
}
