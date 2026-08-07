export type EntityKindHint =
  | "person"
  | "prophet"
  | "companion"
  | "scholar"
  | "surah"
  | "place"
  | "event"
  | "topic"
  | "unknown";

export type EntityExtractionMethod =
  | "direct_question"
  | "typed_question"
  | "bare_entity";

export type EntityCandidate = {
  rawText: string;
  displayText: string;
  normalizedText: string;
  lookupKeys: string[];
  kindHint: EntityKindHint;
  confidence: number;
  extractionMethod: EntityExtractionMethod;
};

export type EntityResolution = {
  status: "resolved_candidate" | "no_candidate";
  candidate: EntityCandidate | null;
};

const QUESTION_PREFIXES: Array<{
  pattern: RegExp;
  method: EntityExtractionMethod;
  baseConfidence: number;
}> = [
  {
    pattern: /^(?:qui\s+(?:est|etait|était|fut)|peux[- ]?tu\s+me\s+dire\s+qui\s+(?:est|etait|était))\s+(.+)$/iu,
    method: "direct_question",
    baseConfidence: 0.94,
  },
  {
    pattern: /^(?:parle[- ]?moi\s+de|raconte[- ]?moi\s+(?:la\s+vie|l['’]histoire)\s+de|presente[- ]?moi|présente[- ]?moi)\s+(.+)$/iu,
    method: "direct_question",
    baseConfidence: 0.91,
  },
  {
    pattern: /^(?:que\s+sais[- ]?tu\s+sur|donne[- ]?moi\s+des\s+informations\s+sur|explique[- ]?moi\s+qui\s+(?:est|etait|était))\s+(.+)$/iu,
    method: "direct_question",
    baseConfidence: 0.89,
  },
  {
    pattern: /^(?:qui\s+est\s+le|qui\s+est\s+la|quel\s+est\s+le|quelle\s+est\s+la)\s+(proph[eè]te|compagnon|imam|savant|calife|sourate|ville|lieu|bataille|exp[eé]dition|th[eè]me)\s+(.+)$/iu,
    method: "typed_question",
    baseConfidence: 0.88,
  },
];

const KIND_PATTERNS: Array<{ kind: EntityKindHint; pattern: RegExp }> = [
  { kind: "prophet", pattern: /\bproph[eè]te\b/iu },
  { kind: "companion", pattern: /\b(?:compagnon|sahabi|sahabiyy?a)\b/iu },
  { kind: "scholar", pattern: /\b(?:imam|savant|cheikh|shaykh)\b/iu },
  { kind: "surah", pattern: /\b(?:sourate|surah)\b/iu },
  { kind: "place", pattern: /\b(?:ville|pays|lieu|mosqu[eé]e|montagne)\b/iu },
  { kind: "event", pattern: /\b(?:bataille|exp[eé]dition|hijra|migration|trait[eé])\b/iu },
  { kind: "topic", pattern: /\b(?:th[eè]me|notion|concept|sujet)\b/iu },
];

const LEADING_TITLES = /^(?:(?:le|la|l['’])\s+)?(?:proph[eè]te|compagnon|imam|savant|cheikh|shaykh|calife|sourate|surah)\s+/iu;
const TRAILING_HONORIFICS = /(?:\s*[,(]?\s*(?:رضي الله عنه|رضي الله عنها|عليه السلام|ﷺ|sallallahu alayhi wa sallam|paix sur lui|qu['’]allah soit satisfait de lui|qu['’]allah soit satisfaite d['’]elle)\s*[)]?\s*)+$/iu;

export function normalizeEntityText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`´]/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cleanCandidate(value: string): string {
  return value
    .replace(/^[\s:,-]+|[\s?.!,:;-]+$/g, "")
    .replace(TRAILING_HONORIFICS, "")
    .replace(LEADING_TITLES, "")
    .replace(/\s+/g, " ")
    .trim();
}

function inferKindHint(question: string): EntityKindHint {
  for (const entry of KIND_PATTERNS) {
    if (entry.pattern.test(question)) return entry.kind;
  }
  return "unknown";
}

function makeLookupKeys(rawText: string): string[] {
  const normalized = normalizeEntityText(rawText);
  const keys = new Set<string>();
  if (normalized) keys.add(normalized);

  // Repository-friendly variants. These are linguistic transformations,
  // not a manually maintained catalogue of Islamic personalities.
  const compactHyphens = normalized.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  if (compactHyphens) keys.add(compactHyphens);

  const lineageNormalized = compactHyphens
    .replace(/\b(?:ibn|bin|ben)\b/g, "ibn")
    .replace(/\b(?:bint|bent)\b/g, "bint")
    .replace(/\b(?:abou|abu|abo)\b/g, "abu")
    .replace(/\b(?:oum|umm|om)\b/g, "umm")
    .replace(/\s+/g, " ")
    .trim();
  if (lineageNormalized) keys.add(lineageNormalized);

  const withoutArticles = lineageNormalized
    .replace(/\b(?:al|el)\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (withoutArticles && withoutArticles !== lineageNormalized) keys.add(withoutArticles);

  return [...keys];
}

function buildCandidate(
  rawValue: string,
  question: string,
  extractionMethod: EntityExtractionMethod,
  confidence: number,
): EntityResolution {
  const displayText = cleanCandidate(rawValue);
  const normalizedText = normalizeEntityText(displayText);
  if (displayText.length < 2 || normalizedText.length < 2) {
    return { status: "no_candidate", candidate: null };
  }

  return {
    status: "resolved_candidate",
    candidate: {
      rawText: rawValue.trim(),
      displayText,
      normalizedText,
      lookupKeys: makeLookupKeys(displayText),
      kindHint: inferKindHint(question),
      confidence,
      extractionMethod,
    },
  };
}

/**
 * Extracts a repository-ready entity candidate without containing a catalogue
 * of prophets, companions or scholars. Canonical identity and final type are
 * intentionally deferred to the future repositories.
 */
export function resolveEntityCandidate(question: string): EntityResolution {
  const compact = question.replace(/\s+/g, " ").trim();
  if (!compact) return { status: "no_candidate", candidate: null };

  for (const extractor of QUESTION_PREFIXES) {
    const match = compact.match(extractor.pattern);
    if (!match) continue;

    const rawValue = extractor.method === "typed_question" ? match[2] : match[1];
    if (rawValue) {
      return buildCandidate(
        rawValue,
        compact,
        extractor.method,
        extractor.baseConfidence,
      );
    }
  }

  const words = compact.split(" ");
  const looksLikeBareEntity =
    words.length >= 1 &&
    words.length <= 8 &&
    !/[?]/.test(compact) &&
    words.every((word) => /^[\p{L}\p{N}][\p{L}\p{N}’'`´.-]*$/u.test(word));

  if (looksLikeBareEntity) {
    return buildCandidate(compact, compact, "bare_entity", 0.58);
  }

  return { status: "no_candidate", candidate: null };
}
