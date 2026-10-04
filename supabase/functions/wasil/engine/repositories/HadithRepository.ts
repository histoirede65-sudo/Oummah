import { rankDocuments } from "../RelevanceScorer.ts";
import type { IslamicQueryExpansion } from "../IslamicQueryExpansion.ts";
import { buildHadithSearchTerms, extractIntentConcepts } from "../UniversalIntent.ts";
import { consumeWasilWebBudget, type WasilWebBudget } from "../DocumentaryRetriever.ts";
import { postOpenAiResponses, reasoningEffortFromEnv } from "../OpenAiRequest.ts";

export type HadithRepositoryReference = {
  title: string;
  url: string;
};

export type HadithRepositoryItem = {
  id: string | null;
  collection: string;
  reference: string;
  narrator: string | null;
  grade: string | null;
  arabicText: string | null;
  frenchMeaning: string;
  relevance: string;
  sourceUrl?: string;
};

export type HadithRepositoryRecord = {
  repository: "hadith";
  query: string;
  topic: string;
  items: HadithRepositoryItem[];
  cautions: string[];
  references: HadithRepositoryReference[];
  confidence: number;
  fetchedAt: string;
  cacheStatus: "hit" | "miss";
};

type CacheEntry = {
  expiresAt: number;
  value: Omit<HadithRepositoryRecord, "cacheStatus">;
};

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    action?: {
      sources?: Array<{ title?: string; url?: string }>;
    };
    content?: Array<{ type?: string; text?: string }>;
  }>;
};



type HadeethEncSummary = { id?: string | number; title?: string };
type HadeethEncSearchPayload = { data?: HadeethEncSummary[] } | HadeethEncSummary[];
type HadeethEncItem = {
  id?: string | number;
  title?: string;
  hadeeth?: string;
  hadeeth_ar?: string;
  attribution?: string;
  grade?: string;
  explanation?: string;
  reference?: string;
};


export type HadithRepositoryDebug = {
  expressionsExecuted: string[];
  resultsByExpression: Array<{ expression: string; resultCount: number }>;
  hadeethEncIds: string[];
};

const hadithRepositoryDebug = new Map<string, HadithRepositoryDebug>();

export function getHadithRepositoryDebug(
  question: string,
): HadithRepositoryDebug {
  return hadithRepositoryDebug.get(normalizeText(question)) ?? {
    expressionsExecuted: [],
    resultsByExpression: [],
    hadeethEncIds: [],
  };
}

const HADEETHENC_API_ROOT = "https://hadeethenc.com/api/v1";

function inferHadithCollection(value: string): string {
  const normalized = normalizeText(value);
  const labels: Array<[RegExp, string]> = [
    [/\b(?:al )?(?:bukhari|boukhari)\b/u, "Sahih al-Bukhari"],
    [/\bmuslim\b/u, "Sahih Muslim"],
    [/\b(?:abu dawud|abou dawoud)\b/u, "Sunan Abu Dawud"],
    [/\b(?:at )?tirmidhi\b/u, "Jami‘ at-Tirmidhi"],
    [/\b(?:an )?nasa i\b/u, "Sunan an-Nasa’i"],
    [/\bibn majah\b/u, "Sunan Ibn Majah"],
    [/\briyad(?: as)? salihin\b/u, "Riyad as-Salihin"],
  ];
  const matches = labels.filter(([pattern]) => pattern.test(normalized)).map(([, label]) => label);
  return matches.length ? matches.join(" et ") : "Hadith authentique";
}



function normalizedHadithFingerprint(item: HadithRepositoryItem): string {
  return normalizeText(item.frenchMeaning)
    .split(" ")
    .filter((token) => token.length >= 3)
    .slice(0, 42)
    .join(" ");
}

function deduplicateAndPrioritizeHadithItems(
  items: HadithRepositoryItem[],
  limit = 6,
): HadithRepositoryItem[] {
  const retained: HadithRepositoryItem[] = [];
  const indexById = new Map<string, number>();
  const indexByText = new Map<string, number>();

  for (const item of items) {
    if (!item.frenchMeaning?.trim()) continue;
    const idKey = item.id?.trim() ? `id:${item.id.trim()}` : "";
    const textKey = normalizedHadithFingerprint(item);
    const existingIndex = (idKey ? indexById.get(idKey) : undefined) ??
      (textKey ? indexByText.get(textKey) : undefined);

    if (existingIndex === undefined) {
      const index = retained.length;
      retained.push(item);
      if (idKey) indexById.set(idKey, index);
      if (textKey) indexByText.set(textKey, index);
      continue;
    }

    const existing = retained[existingIndex];
    const existingRichness = [
      existing.reference,
      existing.grade ?? "",
      existing.narrator ?? "",
      existing.sourceUrl ?? "",
    ].join(" ").length;
    const candidateRichness = [
      item.reference,
      item.grade ?? "",
      item.narrator ?? "",
      item.sourceUrl ?? "",
    ].join(" ").length;
    if (candidateRichness > existingRichness) retained[existingIndex] = item;
  }

  // Input order already comes from the relevance ranker. Preserve that order:
  // collection prestige is useful metadata, but it must never move a weakly
  // related narration ahead of a directly relevant hadith.
  return retained.slice(0, limit);
}

function hadithSearchPhrases(
  question: string,
  expansion?: IslamicQueryExpansion | null,
): string[] {
  const universalTerms = buildHadithSearchTerms(question);
  const normalized = normalizeText(question);
  const fallbackKeywords = normalized
    .split(" ")
    .filter((word) => word.length >= 5 && !new Set([
      "allah", "coran", "quran", "islam", "selon", "sunna", "sunnah",
      "hadith", "hadiths", "comment", "pourquoi", "quels", "quelles",
      "quelle", "donne", "conseils", "proteger", "maitriser",
    ]).has(word));

  // HadeethEnc's French search is lexical. Prefer concise French expressions;
  // Arabic terms remain useful for the documentary web fallback instead.
  const isIstikhara = /(?:priere\s+(?:de\s+)?(?:consultation|istikhara)|salat\s+al[- ]?istikhara|istikhara|صلاة\s+الاستخارة|الاستخارة)/iu.test(question);
  const canonicalIstikharaTerms = isIstikhara
    ? ["istikhara", "istikhâra", "prière de consultation", "Jabir", "enseigner l'istikhara"]
    : [];
  const priorityTerms = new Set(
    [...canonicalIstikharaTerms, ...(expansion?.evidenceTerms ?? [])]
      .map((phrase) => normalizeText(phrase))
      .filter(Boolean),
  );
  const candidates = [
    ...canonicalIstikharaTerms,
    ...(expansion?.evidenceTerms ?? []),
    ...(expansion?.hadithSearchTerms ?? []),
    ...(expansion?.aliases ?? []),
    ...universalTerms,
    // Standalone fallback words are kept only as secondary recall signals;
    // complete expressions from buildHadithSearchTerms remain first.
    ...fallbackKeywords.slice(0, 3).filter((word) => !/^\d+$/.test(word)),
  ]
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length >= 3 && !/[\u0600-\u06ff]/u.test(phrase));

  return [...new Set(candidates.map((phrase) => normalizeText(phrase)).filter(Boolean))]
    .sort((a, b) => {
      const priorityDelta = Number(priorityTerms.has(b)) - Number(priorityTerms.has(a));
      if (priorityDelta !== 0) return priorityDelta;
      const aWords = a.split(" ").length;
      const bWords = b.split(" ").length;
      // Multi-word concepts carry the religious relation better than isolated
      // fallback terms. Keep concise phrases first within the same specificity.
      const aSpecificity = aWords >= 2 ? 0 : 1;
      const bSpecificity = bWords >= 2 ? 0 : 1;
      if (aSpecificity !== bSpecificity) return aSpecificity - bSpecificity;
      if (aWords !== bWords) return aWords - bWords;
      return a.length - b.length;
    })
    .slice(0, isIstikhara ? 14 : 10);
}

type HadithConceptProfile = {
  uncertainty: string[];
  practice: string[];
  quantity: string[];
  correction: string[];
};

function buildHadithConceptProfile(question: string): HadithConceptProfile {
  const normalized = normalizeText(question);
  const groups = {
    uncertainty: ["doute", "incertitude", "oublie", "oubli", "ne sais plus", "hesite"],
    practice: ["priere", "rakah", "rakaat", "unite", "unites", "salat"],
    quantity: ["nombre", "trois", "quatre", "deux", "premiere", "seconde"],
    correction: ["sahw", "oubli", "prosternation", "prosternations", "corriger", "completer"],
  };
  return Object.fromEntries(
    Object.entries(groups).map(([key, terms]) => [
      key,
      terms.filter((term) => normalized.includes(term)),
    ])
  ) as HadithConceptProfile;
}

function applyHadithConceptReranking(
  rankedItems: Array<{ item: HadithRepositoryItem; score: number; matchedTerms: string[] }>,
  question: string,
): Array<{ item: HadithRepositoryItem; score: number; matchedTerms: string[] }> {
  const profile = buildHadithConceptProfile(question);
  const activeGroups = Object.values(profile).filter((terms) => terms.length > 0).length;
  if (activeGroups < 2) return rankedItems;

  return rankedItems.map((entry) => {
    const text = normalizeText(`${entry.item.frenchMeaning} ${entry.item.relevance}`);
    const matchedGroups = Object.values(profile).filter((terms) =>
      terms.some((term) => text.includes(term))
    ).length;
    const hasConceptRelation =
      profile.uncertainty.some((term) => text.includes(term)) &&
      profile.practice.some((term) => text.includes(term));
    let adjustment = 0;
    if (matchedGroups < 2) adjustment -= 0.24;
    if (activeGroups >= 3 && matchedGroups < 3) adjustment -= 0.18;
    if (!hasConceptRelation && profile.uncertainty.length > 0 && profile.practice.length > 0) {
      adjustment -= 0.16;
    }
    return { ...entry, score: entry.score + adjustment };
  }).sort((a, b) => b.score - a.score);
}

async function fetchHadeethEncJson<T>(path: string, timeoutMs = 4000): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${HADEETHENC_API_ROOT}${path}`, { signal: controller.signal });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function searchHadeethEnc(
  question: string,
  expansion?: IslamicQueryExpansion | null,
): Promise<HadithRepositoryRecord | null> {
  const phrases = hadithSearchPhrases(question, expansion);
  const searchResults = await Promise.all(phrases.map(async (phrase) => {
    const payload = await fetchHadeethEncJson<HadeethEncSearchPayload>(
      `/hadeeths/search/?language=fr&phrase=${encodeURIComponent(phrase)}`,
    );
    const summaries = (Array.isArray(payload) ? payload : payload?.data ?? [])
      .filter((item) => item.id != null && item.title?.trim())
      .slice(0, 30);
    return { phrase, summaries };
  }));

  console.log("WASIL_HADEETHENC_SEARCH_EXPRESSIONS", {
    expressionCount: phrases.length,
    resultsByExpression: searchResults.map(({ phrase, summaries }) => ({
      phrase,
      resultCount: summaries.length,
    })),
  });

  const summariesById = new Map<
    string,
    { summary: HadeethEncSummary; matchedPhrases: Set<string> }
  >();
  for (const { phrase, summaries } of searchResults) {
    for (const summary of summaries) {
      const id = String(summary.id);
      const existing = summariesById.get(id);
      if (existing) existing.matchedPhrases.add(phrase);
      else {
        summariesById.set(id, {
          summary,
          matchedPhrases: new Set([phrase]),
        });
      }
    }
  }

  hadithRepositoryDebug.set(normalizeText(question), {
    expressionsExecuted: [...phrases],
    resultsByExpression: searchResults.map(({ phrase, summaries }) => ({
      expression: phrase,
      resultCount: summaries.length,
    })),
    hadeethEncIds: [],
  });

  if (summariesById.size === 0) return null;

  // Avoid fetching hundreds of detail records. Candidates returned by several
  // independent expressions are fetched first, then the closest summary titles.
  const primaryTerms = expansion?.evidenceTerms ?? buildHadithSearchTerms(question);
  const normalizedPrimaryTerms = primaryTerms
    .map((term) => normalizeText(term))
    .filter(Boolean);
  const summaryCandidates = [...summariesById.entries()]
    .map(([id, candidate]) => {
      const matchedPhraseText = normalizeText([...candidate.matchedPhrases].join(" "));
      const exactEvidenceHits = normalizedPrimaryTerms.filter((term) =>
        matchedPhraseText.includes(term)
      ).length;
      return {
        id,
        candidate,
        exactEvidenceHits,
        score: rankDocuments(
          [[id, candidate]] as Array<[string, typeof candidate]>,
          ([, value]) => ({
            canonicalName: expansion?.canonicalName ?? question,
            queryTerms: [...phrases, question],
            evidenceTerms: primaryTerms,
            relatedTerms: expansion?.relatedTerms ?? [],
            text: `${value.summary.title ?? ""} ${[...value.matchedPhrases].join(" ")}`,
            kind: "hadith",
            retrievalHits: value.matchedPhrases.size,
          }),
          0,
          1,
          true,
        )[0]?.score ?? 0,
      };
    })
    .sort((a, b) => {
      const evidenceDelta = b.exactEvidenceHits - a.exactEvidenceHits;
      if (evidenceDelta !== 0) return evidenceDelta;
      const hitDelta = b.candidate.matchedPhrases.size - a.candidate.matchedPhrases.size;
      return hitDelta !== 0 ? hitDelta : b.score - a.score;
    })
    // The final dossier keeps at most six hadiths. Fetching 18 full HadeethEnc
    // records was mostly wasted latency; twelve candidates preserve recall
    // while reducing detail requests on cache misses.
    .slice(0, 18);

  const details = await Promise.all(summaryCandidates.map(({ id }) =>
    fetchHadeethEncJson<HadeethEncItem>(
      `/hadeeths/one/?language=fr&id=${encodeURIComponent(id)}`,
    )
  ));

  const rawItems: HadithRepositoryItem[] = summaryCandidates.map(
    ({ id, candidate }, index) => {
      const detail = details[index];
      const sourceUrl = `https://hadeethenc.com/fr/browse/hadith/${encodeURIComponent(id)}`;
      const matchedPhraseContext = [...candidate.matchedPhrases]
        .map((phrase) => `« ${phrase} »`)
        .join(", ");
      return {
        id: String(detail?.id ?? id),
        collection: inferHadithCollection(`${detail?.reference ?? ""} ${detail?.attribution ?? ""}`),
        reference: detail?.reference?.trim() || detail?.attribution?.trim() || `Référence n°${id}`,
        narrator: detail?.attribution?.trim() || null,
        grade: detail?.grade?.trim() || null,
        arabicText: detail?.hadeeth_ar?.trim() || null,
        frenchMeaning: detail?.hadeeth?.trim() || candidate.summary.title!.trim(),
        relevance: [
          detail?.explanation?.trim().slice(0, 700),
          matchedPhraseContext
            ? `Expressions de recherche correspondantes : ${matchedPhraseContext}`
            : "",
        ].filter(Boolean).join("\n"),
        sourceUrl,
      };
    },
  ).filter((item) => Boolean(item.frenchMeaning));

  const rankedItems = rankDocuments(
    rawItems,
    (item) => {
      const matchedSearchPhrases = [
        ...(summaryCandidates.find((entry) => entry.id === item.id)
          ?.candidate.matchedPhrases ?? []),
      ];
      return {
        canonicalName: expansion?.canonicalName ?? (extractIntentConcepts(question).map((c) => c.label).join(" ") || phrases.join(" ")),
        queryTerms: [...phrases, question, ...(expansion?.hadithSearchTerms ?? [])],
        evidenceTerms: primaryTerms,
        relatedTerms: expansion?.relatedTerms ?? [],
        reference: item.reference,
        text: `${item.frenchMeaning} ${item.relevance} ${item.collection} ${matchedSearchPhrases.join(" ")}`,
        kind: "hadith",
        retrievalHits: matchedSearchPhrases.length || 1,
      };
    },
    0.18,
    14,
    false,
  );

  const conceptRankedItems = applyHadithConceptReranking(rankedItems, question);
  const items = deduplicateAndPrioritizeHadithItems(
    conceptRankedItems.map(({ item }) => item),
    6,
  );

  console.log("WASIL_HADITH_RELEVANCE_RANKING", {
    candidateCount: rawItems.length,
    retainedCount: items.length,
    retained: conceptRankedItems.map(({ item, score, matchedTerms }) => ({
      id: item.id,
      reference: item.reference,
      score: Number(score.toFixed(3)),
      matchedTerms: matchedTerms.slice(0, 8),
    })),
  });

  hadithRepositoryDebug.set(normalizeText(question), {
    expressionsExecuted: [...phrases],
    resultsByExpression: searchResults.map(({ phrase, summaries }) => ({
      expression: phrase,
      resultCount: summaries.length,
    })),
    hadeethEncIds: items.map((item) => item.id).filter((id): id is string => Boolean(id)),
  });

  if (!items.length) return null;

  const value: Omit<HadithRepositoryRecord, "cacheStatus"> = {
    repository: "hadith",
    query: question,
    topic: expansion?.canonicalName || phrases.join(" | "),
    items,
    cautions: [],
    references: items
      .filter((item) => item.sourceUrl)
      .map((item) => ({ title: item.reference, url: item.sourceUrl! })),
    confidence: 0.92,
    fetchedAt: new Date().toISOString(),
  };
  return { ...value, cacheStatus: "miss" };
}

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const hadithCache = new Map<string, CacheEntry>();

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


function isHadithQuery(question: string): boolean {
  const normalized = normalizeText(question);
  return /\b(hadith|hadiths|sunna|sunnah|tradition|recit rapporte|rapporte par|boukhari|bukhari|muslim|tirmidhi|abou dawoud|abu dawud|nasa i|ibn majah|riyad)\b/.test(
    normalized,
  );
}

function readCache(key: string): HadithRepositoryRecord | null {
  const entry = hadithCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    hadithCache.delete(key);
    return null;
  }
  return { ...entry.value, cacheStatus: "hit" };
}

function writeCache(
  key: string,
  value: Omit<HadithRepositoryRecord, "cacheStatus">,
): void {
  hadithCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });
}

function normalizeUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.search = "";
    url.pathname = url.pathname.replace(/\/$/, "") || "/";
    return url.toString();
  } catch {
    return "";
  }
}

function outputText(payload: OpenAIResponse): string {
  if (payload.output_text?.trim()) return payload.output_text.trim();
  for (const item of payload.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && part.text?.trim()) {
        return part.text.trim();
      }
    }
  }
  return "";
}

function consultedSources(payload: OpenAIResponse): HadithRepositoryReference[] {
  const result = new Map<string, HadithRepositoryReference>();

  for (const item of payload.output ?? []) {
    if (item.type !== "web_search_call") continue;
    for (const raw of item.action?.sources ?? []) {
      if (!raw.url) continue;
      const url = normalizeUrl(raw.url);
      if (!url) continue;
      const host = new URL(url).hostname.replace(/^www\./, "");
      result.set(url, {
        title: raw.title?.trim() || host,
        url,
      });
    }
  }

  return [...result.values()].slice(0, 8);
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

/**
 * Production Hadith retriever.
 * HadeethEnc is queried first; the domain-restricted web fallback only
 * supplements a thin result. Every fallback URL must have been consulted by
 * the web-search tool and must belong to HadeethEnc or Sunnah.com.
 */
export async function searchHadithRepository(
  question: string,
  options: { force?: boolean; expansion?: IslamicQueryExpansion | null; budget?: WasilWebBudget } = {},
): Promise<HadithRepositoryRecord | null> {
  if (!options.force && !isHadithQuery(question)) return null;

  const key = normalizeText([
    question,
    options.expansion?.canonicalName ?? "",
    ...(options.expansion?.evidenceTerms ?? []),
  ].join(" ")).slice(0, 300);
  hadithRepositoryDebug.set(normalizeText(question), {
    expressionsExecuted: [],
    resultsByExpression: [],
    hadeethEncIds: [],
  });
  const cached = readCache(key);
  if (cached) {
    hadithRepositoryDebug.set(normalizeText(question), {
      expressionsExecuted: [],
      resultsByExpression: [],
      hadeethEncIds: cached.items
        .map((item) => item.id)
        .filter((id): id is string => Boolean(id)),
    });
    return cached;
  }

  const directRecord = await searchHadeethEnc(question, options.expansion);
  const returnDirectRecord = (): HadithRepositoryRecord | null => {
    if (!directRecord) return null;
    const { cacheStatus: _cacheStatus, ...cacheValue } = directRecord;
    writeCache(key, cacheValue);
    return directRecord;
  };

  // HadeethEnc remains the preferred source. When it returns several distinct
  // hadiths, avoid a second model call. When it returns only one or two, keep
  // them and use the documentary fallback only to supplement the corpus.
  if (directRecord && directRecord.items.length >= 3) {
    const { cacheStatus: _cacheStatus, ...cacheValue } = directRecord;
    writeCache(key, cacheValue);
    return directRecord;
  }

  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return returnDirectRecord();
  if (options.budget && !consumeWasilWebBudget(options.budget, "hadith")) {
    console.log("WASIL_WEB_BUDGET_EXHAUSTED", { kind: "hadith" });
    return returnDirectRecord();
  }

  const model = Deno.env.get("WASIL_MODEL_RETRIEVAL") ??
    Deno.env.get("WASIL_MODEL_STANDARD") ?? "gpt-5.6-luna";
  const controller = new AbortController();
  const supplementalTimeoutMs = directRecord ? 2_500 : 6_500;
  const timeout = setTimeout(() => controller.abort(), supplementalTimeoutMs);

  try {
    const response = await postOpenAiResponses({
        model,
        store: false,
        max_output_tokens: 1200,
        max_tool_calls: 1,
        tools: [{
          type: "web_search",
          search_context_size: "low",
          filters: { allowed_domains: ["hadeethenc.com", "sunnah.com"] },
        }],
        tool_choice: "required",
        include: ["web_search_call.action.sources"],
        instructions:
          "Tu es le retriever Hadith de Wasil. Tu ne rédiges jamais la réponse finale. Recherche uniquement sur HadeethEnc et Sunnah.com des hadiths directement liés à la cible exacte. Une histoire contenant seulement un mot voisin, un thème secondaire ou le contraire de la notion demandée n'est pas une preuve directe. N'invente jamais un numéro, une chaîne, un degré, une collection, un texte arabe ou une URL. sourceUrl doit être une page réellement consultée. Le frenchMeaning doit être une reformulation française fidèle et brève. Retourne uniquement le JSON demandé.",
        input: `QUESTION UTILISATEUR: ${question}\nTHÈME NORMALISÉ: ${options.expansion?.canonicalName ?? "non disponible"}\nPREUVE DIRECTE ATTENDUE: ${options.expansion?.directEvidenceDescription ?? "un hadith qui traite directement de la question"}\nTERMES HADITH: ${(options.expansion?.hadithSearchTerms ?? buildHadithSearchTerms(question)).join(", ")}\nTERMES EXACTS: ${(options.expansion?.evidenceTerms ?? []).join(", ")}`,
        text: {
          format: {
            type: "json_schema",
            name: "wasil_hadith_repository_record",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                topic: { type: "string" },
                items: {
                  type: "array",
                  minItems: 1,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      id: { type: ["string", "null"] },
                      collection: { type: "string" },
                      reference: { type: "string" },
                      narrator: { type: ["string", "null"] },
                      grade: { type: ["string", "null"] },
                      arabicText: { type: ["string", "null"] },
                      frenchMeaning: { type: "string" },
                      relevance: { type: "string" },
                      sourceUrl: { type: "string" },
                    },
                    required: [
                      "id",
                      "collection",
                      "reference",
                      "narrator",
                      "grade",
                      "arabicText",
                      "frenchMeaning",
                      "relevance",
                      "sourceUrl",
                    ],
                  },
                },
                cautions: {
                  type: "array",
                  maxItems: 4,
                  items: { type: "string" },
                },
                confidence: { type: "number", minimum: 0, maximum: 1 },
              },
              required: ["topic", "items", "cautions", "confidence"],
            },
          },
        },
      }, {
      apiKey,
      effort: reasoningEffortFromEnv("WASIL_REASONING_EFFORT_RETRIEVAL", "low"),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn(
        "WASIL_V4_HADITH_REPOSITORY_HTTP_FAILURE",
        response.status,
        (await response.text()).slice(0, 600),
      );
      return returnDirectRecord();
    }

    const payload = await response.json() as OpenAIResponse;
    const references = consultedSources(payload);
    const rawText = outputText(payload);
    if (!rawText) return returnDirectRecord();

    const parsed = JSON.parse(rawText) as {
      topic: string;
      items: HadithRepositoryItem[];
      cautions: string[];
      confidence: number;
    };

    const items = Array.isArray(parsed.items)
      ? parsed.items.filter((item) =>
        item?.collection?.trim() &&
        item?.reference?.trim() &&
        item?.frenchMeaning?.trim()
      ).map((item) => ({
        id: item.id?.trim() || null,
        collection: item.collection.trim(),
        reference: item.reference.trim(),
        narrator: item.narrator?.trim() || null,
        grade: item.grade?.trim() || null,
        arabicText: item.arabicText?.trim() || null,
        frenchMeaning: item.frenchMeaning.trim(),
        relevance: item.relevance?.trim() || "",
        sourceUrl: item.sourceUrl?.trim() || undefined,
      }))
      : [];

    const consultedUrls = new Set(references.map((reference) => normalizeUrl(reference.url)));
    const verifiedItems = items.filter((item) => {
      if (!item.sourceUrl) return false;
      const normalizedUrl = normalizeUrl(item.sourceUrl);
      if (!normalizedUrl || !consultedUrls.has(normalizedUrl)) return false;
      const host = new URL(normalizedUrl).hostname.replace(/^www\./, "");
      return host === "hadeethenc.com" || host === "sunnah.com";
    });

    if (!parsed.topic?.trim() || verifiedItems.length === 0) {
      console.warn("WASIL_V4_HADITH_REPOSITORY_EMPTY", {
        itemCount: verifiedItems.length,
        referenceCount: references.length,
      });
      return returnDirectRecord();
    }

    const mergedItems = deduplicateAndPrioritizeHadithItems(
      [...(directRecord?.items ?? []), ...verifiedItems],
      6,
    );
    const mergedReferences = [...new Map(
      [
        ...(directRecord?.references ?? []),
        ...references,
      ].map((reference) => [normalizeUrl(reference.url) || reference.title, reference]),
    ).values()].slice(0, 8);

    const value: Omit<HadithRepositoryRecord, "cacheStatus"> = {
      repository: "hadith",
      query: question,
      topic: parsed.topic.trim() || directRecord?.topic || question,
      items: mergedItems,
      cautions: (parsed.cautions ?? []).map((item) => item.trim()).filter(Boolean),
      references: mergedReferences,
      confidence: Math.max(directRecord?.confidence ?? 0, clampConfidence(parsed.confidence)),
      fetchedAt: new Date().toISOString(),
    };

    writeCache(key, value);
    return { ...value, cacheStatus: "miss" };
  } catch (error) {
    console.warn("WASIL_V4_HADITH_REPOSITORY_FAILURE", {
      message: error instanceof Error ? error.message : String(error),
    });
    return returnDirectRecord();
  } finally {
    clearTimeout(timeout);
  }
}
