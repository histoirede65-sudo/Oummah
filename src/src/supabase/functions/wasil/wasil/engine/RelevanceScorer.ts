export type ScoredDocument<T> = {
  item: T;
  score: number;
  matchedTerms: string[];
};

type ScoreOptions = {
  canonicalName?: string | null;
  queryTerms?: string[];
  reference?: string;
  text: string;
};

const STOP_WORDS = new Set([
  "allah", "coran", "islam", "selon", "sunna", "sunnah", "hadith", "hadiths",
  "quels", "quelles", "quel", "quelle", "donne", "explique", "conseil", "conseils",
  "avec", "dans", "pour", "leur", "leurs", "entre", "comme", "plus", "sont", "etre",
  "faire", "comment", "pourquoi", "peut", "doit", "doivent", "principales", "principal",
  "important", "importants", "importante", "importantes", "verset", "versets", "sourate",
  "source", "sources", "preuve", "preuves", "religion", "musulman", "musulmane",
  "cette", "cela", "ceux", "celle", "elles", "nous", "vous", "mais", "sans", "tout",
]);

const TOPIC_PROFILES: Array<{
  pattern: RegExp;
  anchors: string[];
  preferredReferences?: string[];
  discouragedReferences?: string[];
}> = [
  {
    pattern: /(?:mariage|epoux|epouse|conjugal|couple|nikah|dispute|reconciliation|زوج|زواج)/u,
    anchors: [
      "epoux", "epouse", "mari", "femme", "mariage", "conjugal", "couple", "foyer",
      "bienveillance", "affection", "misericorde", "entretien", "logement", "divorce",
      "reconciliation", "arbitrage", "douceur", "colere", "dispute", "زوج", "ازواج",
      "الزوج", "النساء", "بالمعروف", "مودة", "رحمة", "لباس",
    ],
    preferredReferences: [
      "2:187", "2:228", "2:229", "2:231", "2:233", "4:19", "4:34", "4:35",
      "24:32", "30:21", "33:35", "65:6", "65:7",
    ],
  },
  {
    pattern: /(?:patience|epreuve|sabr|endurance|صبر)/u,
    anchors: ["patience", "patient", "epreuve", "endurance", "perseverance", "sabr", "صبر", "الصابرين", "ابتلاء"],
  },
  {
    pattern: /(?:priere|salat|prostern|صلاة)/u,
    anchors: ["priere", "salat", "prostern", "inclinez", " الصلاة", "اقيموا", "الصلوات"],
  },
  {
    pattern: /(?:repentir|tawba|istighfar|pardon|توبة|استغفار)/u,
    anchors: ["repentir", "repentez", "pardon", "pardonne", "tawba", "istighfar", "توبة", "استغفار", "غفور"],
  },
  {
    pattern: /(?:parent|pere|mere|education|enfant|والدين|والد)/u,
    anchors: ["parents", "pere", "mere", "enfant", "education", "obeissance", "bienfaisance", "والدين", "والد", "بر"],
  },
  {
    pattern: /(?:zakat|aumone|sadaqa|charite|زكاة|صدقة)/u,
    anchors: ["zakat", "aumone", "sadaqa", "charite", "pauvres", "necessiteux", "زكاة", "صدقة", "الفقراء", "المساكين"],
  },
  {
    pattern: /(?:jeune|ramadan|sawm|صيام|رمضان)/u,
    anchors: ["jeune", "ramadan", "sawm", "abstention", "rompre", "صيام", "رمضان", "الصائمين"],
  },
  {
    pattern: /(?:angoisse|anxiete|tristesse|peur|tawakkul|confiance|حزن|خوف|توكل)/u,
    anchors: ["angoisse", "anxiete", "tristesse", "peur", "confiance", "tawakkul", "rappel", "coeur", "حزن", "خوف", "توكل", "قلوب"],
  },
  {
    pattern: /(?:heritage|succession|heriter|ميراث|ورث)/u,
    anchors: ["heritage", "succession", "heriter", "heritier", "part", "parts", "ميراث", "ورث", "نصيب"],
    preferredReferences: ["4:7", "4:11", "4:12", "4:176"],
  },
  {
    pattern: /(?:promesse|promet|engagement|pacte|trahison|trahit)/u,
    anchors: [
      "promesse", "promet", "engagement", "pacte", "trahison", "trahit",
      "hypocrite", "hypocrisie", "fidelite", "tenir",
    ],
    // These passages are the strongest Quranic anchors for promises and
    // covenants. Giving them an explicit boost prevents the strict topical
    // filter from discarding them when the French search snippet uses a
    // synonym that is absent from the user question.
    preferredReferences: ["5:1", "16:91", "17:34", "23:8"],
    // At-Tawba 9:117-119 is a valuable narrative about truthfulness and
    // repentance, but it is only an indirect illustration for a general
    // question about promises and covenants. It must not outrank the direct
    // normative passages above.
    discouragedReferences: ["9:117-119", "9:117", "9:118", "9:119"],
  },
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

function tokenize(values: string[]): string[] {
  return [...new Set(
    values
      .flatMap((value) => normalizeRelevanceText(value).split(" "))
      .filter((term) => term.length >= 4 && !STOP_WORDS.has(term)),
  )];
}

function containsWholeTerm(searchable: string, term: string): boolean {
  return (` ${searchable} `).includes(` ${term} `) || searchable.includes(term);
}

export function scoreDocumentRelevance<T>(
  item: T,
  options: ScoreOptions,
): ScoredDocument<T> {
  const canonical = normalizeRelevanceText(options.canonicalName ?? "");
  const queryValues = [options.canonicalName ?? "", ...(options.queryTerms ?? [])];
  const terms = tokenize(queryValues);
  const searchable = normalizeRelevanceText(`${options.text} ${options.reference ?? ""}`);
  const reference = normalizeRelevanceText(options.reference ?? "");
  const intentText = normalizeRelevanceText(queryValues.join(" "));
  const profile = TOPIC_PROFILES.find(({ pattern }) => pattern.test(intentText));

  const matchedTerms = terms.filter((term) => containsWholeTerm(searchable, term));
  const coverage = terms.length > 0 ? matchedTerms.length / terms.length : 0;
  let score = Math.min(0.48, matchedTerms.length * 0.10) + Math.min(0.22, coverage * 0.22);

  if (canonical.length >= 5 && searchable.includes(canonical)) score += 0.22;

  // Multi-word query phrases are a much stronger signal than an isolated word.
  const phrases = queryValues
    .map(normalizeRelevanceText)
    .filter((value) => value.split(" ").length >= 2 && value.length >= 8);
  if (phrases.some((phrase) => searchable.includes(phrase))) score += 0.24;

  if (profile) {
    const matchedAnchors = profile.anchors
      .map(normalizeRelevanceText)
      .filter((anchor) => anchor.length >= 3 && searchable.includes(anchor));
    score += Math.min(0.44, matchedAnchors.length * 0.11);
    matchedTerms.push(...matchedAnchors);

    const preferredReference = profile.preferredReferences?.some((candidate) => {
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|[^0-9])${escaped}(?:$|[^0-9])`).test(reference);
    }) ?? false;
    if (preferredReference) score += 0.62;

    const discouragedReference = profile.discouragedReferences?.some((candidate) => {
      const escaped = candidate.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(?:^|[^0-9])${escaped}(?:$|[^0-9])`).test(reference);
    }) ?? false;
    if (discouragedReference && !preferredReference) score -= 0.58;

    // Broad narrative ranges are weaker evidence than a direct normative verse
    // when the user asks for a general rule. This prevents long historical
    // passages from replacing an exact command merely because they contain
    // words such as truthfulness or repentance.
    const rangeMatch = reference.match(/(?:^|[^0-9])(\d{1,3}):(\d{1,3})-(\d{1,3})(?:$|[^0-9])/);
    if (rangeMatch && !preferredReference) {
      const span = Number(rangeMatch[3]) - Number(rangeMatch[2]) + 1;
      if (span >= 3) score -= 0.16;
    }

    // For a recognised topic, a result must contain at least one real topic anchor
    // or a known strong reference. Generic word overlap is not enough.
    if (matchedAnchors.length === 0 && !preferredReference) score -= 0.62;
  } else if (matchedTerms.length === 0) {
    score -= 0.40;
  }

  // One weak overlap among many query terms is generally a false positive.
  if (terms.length >= 4 && matchedTerms.length <= 1) score -= 0.22;

  return {
    item,
    score: Math.max(0, Math.min(1, score)),
    matchedTerms: [...new Set(matchedTerms)],
  };
}

export function rankDocuments<T>(
  items: T[],
  getOptions: (item: T) => ScoreOptions,
  minimumScore = 0.38,
  maximumItems = 6,
  allowFallback = false,
): ScoredDocument<T>[] {
  const scored = items
    .map((item) => scoreDocumentRelevance(item, getOptions(item)))
    .sort((a, b) => b.score - a.score);

  const retained = scored.filter((entry) => entry.score >= minimumScore);
  if (retained.length > 0) return retained.slice(0, maximumItems);
  return allowFallback ? scored.slice(0, Math.min(2, maximumItems)) : [];
}
