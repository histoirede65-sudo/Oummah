/**
 * Topic-agnostic lexical fallback used when semantic query expansion is
 * unavailable or when a repository needs a few extra recall-oriented terms.
 *
 * This module deliberately contains no per-topic source mapping, hadith id or
 * Quran reference. The semantic expansion and the documentary verifier remain
 * authoritative; these helpers only extract useful words and short phrases
 * from the user's own question.
 */
export type IntentConcept = {
  id: string;
  label: string;
  aliases: string[];
  expansions: string[];
  quranTerms: string[];
  hadithTerms: string[];
};

const STOP_WORDS = new Set([
  "allah", "islam", "musulman", "musulmane", "religion", "religieux",
  "coran", "quran", "sunna", "sunnah", "sounna", "hadith", "hadiths",
  "selon", "comment", "pourquoi", "quelle", "quelles", "quels", "quel",
  "explique", "expliquer", "donne", "donner", "parle", "parler", "dit",
  "dire", "propos", "sujet", "place", "conseil", "conseils", "aider",
  "aide", "developper", "debarrasser", "proteger", "maitriser", "lutter",
  "contre", "dans", "avec", "pour", "sans", "entre", "envers", "chez",
  "que", "sur", "sous", "fait", "faits", "ce", "se", "y", "en",
  "etre", "faire", "avoir", "peut", "doit", "faut", "sont", "est",
  "des", "les", "une", "un", "du", "de", "la", "le", "aux", "au",
  "mes", "ses", "son", "leur", "leurs", "notre", "votre", "cette",
  "cela", "ceci", "ceux", "elles", "nous", "vous", "moi", "tres",
  "plus", "moins", "aussi", "ainsi", "vraiment", "general", "generale",
  "principales", "principaux", "important", "importante", "pratique",
  "pratiques", "maniere", "façon", "façons", "quoi", "quand", "ou",
]);

export function normalizeIntentText(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[], limit: number): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
    .slice(0, limit);
}

function meaningfulTokens(question: string): string[] {
  return normalizeIntentText(question)
    .split(" ")
    .filter((token) => {
      if (!token) return false;
      if (/^[\u0600-\u06ff]{2,}$/u.test(token)) return true;
      return token.length >= 3 && !STOP_WORDS.has(token) && !/^\d+$/.test(token);
    });
}

function lexicalPhrases(tokens: string[]): string[] {
  const phrases: string[] = [];
  // Consecutive bigrams/trigrams preserve the user's own intent without
  // introducing a manually curated interpretation of the theme.
  for (let size = Math.min(3, tokens.length); size >= 2; size -= 1) {
    for (let index = 0; index + size <= tokens.length; index += 1) {
      phrases.push(tokens.slice(index, index + size).join(" "));
    }
  }
  return unique(phrases, 10);
}

export function extractSalientTerms(question: string): string[] {
  const tokens = meaningfulTokens(question);
  const phrases = lexicalPhrases(tokens);
  // Multi-word expressions are more precise for documentary search; isolated
  // tokens remain available as a resilient fallback.
  return unique([...phrases, ...tokens], 16);
}

export function extractIntentConcepts(question: string): IntentConcept[] {
  const terms = extractSalientTerms(question);
  if (!terms.length) return [];
  const phrase = terms.find((term) => term.includes(" ")) ?? terms[0];
  const aliases = unique(terms, 12);
  return [{
    id: `lexical:${normalizeIntentText(phrase).replace(/\s+/g, "-").slice(0, 80)}`,
    label: phrase,
    aliases,
    expansions: [],
    quranTerms: aliases.slice(0, 10),
    hadithTerms: aliases.slice(0, 10),
  }];
}

export function buildQuranSearchTerms(question: string): string[] {
  return extractSalientTerms(question).slice(0, 10);
}

export function buildHadithSearchTerms(question: string): string[] {
  const normalized = normalizeIntentText(question);
  const tokens = normalized.split(" ").filter(Boolean);
  const generic = new Set([
    "comment", "faire", "que", "dois", "doit", "pendant", "dans", "pour",
    "une", "un", "la", "le", "les", "des", "priere", "prieres",
  ]);
  const numbers = tokens.filter((token) => /^\d+$/.test(token));
  const phrases: string[] = [];

  // Preserve the user's complete semantic units. Single numbers and generic
  // verbs are never emitted as strong Hadith queries by themselves.
  for (let size = Math.min(4, tokens.length); size >= 2; size -= 1) {
    for (let index = 0; index + size <= tokens.length; index += 1) {
      const part = tokens.slice(index, index + size);
      const substantive = part.filter((token) =>
        !generic.has(token) && !/^\d+$/.test(token)
      );
      if (substantive.length >= 2 || (numbers.length > 0 && substantive.length >= 1)) {
        phrases.push(part.join(" "));
      }
    }
  }

  const salient = extractSalientTerms(question).filter((term) =>
    term.includes(" ") || (!/^\d+$/.test(term) && term.length >= 5)
  );

  return [...new Set([
    ...phrases,
    ...salient,
  ])].filter((term) => term.length >= 5).slice(0, 14);
}
