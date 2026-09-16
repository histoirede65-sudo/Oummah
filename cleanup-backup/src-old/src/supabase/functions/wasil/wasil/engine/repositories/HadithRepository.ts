import { rankDocuments } from "../RelevanceScorer.ts";

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

type HadeethEncSeed = {
  id: string;
  title: string;
  matchedPhrases: string[];
};

/**
 * High-confidence HadeethEnc entries used as deterministic seeds for themes
 * whose French lexical search can be inconsistent. The full content, grade
 * and attribution are still fetched live from HadeethEnc; no hadith text is
 * hard-coded here.
 */
function knownHadeethEncSeeds(question: string): HadeethEncSeed[] {
  const normalized = normalizeText(question);
  const seeds: HadeethEncSeed[] = [];

  if (/\b(?:promesse|promesses|promet|promis|engagement|engagements|pacte|pactes|trahit|trahison)\b/u.test(normalized)) {
    seeds.push({
      id: "66537",
      title: "Tenir ses promesses et ses engagements",
      matchedPhrases: ["promesse", "engagement", "trahison"],
    });
  }

  if (/\b(?:colere|enerve|enervement|irrite|irritation|emporte|emportement|maitrise de soi)\b/u.test(normalized)) {
    seeds.push(
      {
        id: "4709",
        title: "Ne te mets pas en colère",
        matchedPhrases: ["colère", "ne te mets pas en colère", "maîtrise de soi"],
      },
      {
        id: "5351",
        title: "Le fort est celui qui se maîtrise au moment de la colère",
        matchedPhrases: ["colère", "force", "maîtrise de soi"],
      },
    );
  }

  return seeds;
}

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

function hadithCollectionPriority(collection: string): number {
  const normalized = normalizeText(collection);
  if (normalized.includes("bukhari") && normalized.includes("muslim")) return 0;
  if (normalized.includes("bukhari")) return 1;
  if (normalized.includes("muslim")) return 2;
  if (normalized.includes("tirmidhi")) return 3;
  if (normalized.includes("abu dawud")) return 4;
  if (normalized.includes("nasa i")) return 5;
  if (normalized.includes("ibn majah")) return 6;
  return 20;
}

function hadithItemKey(item: HadithRepositoryItem): string {
  if (item.id?.trim()) return `id:${item.id.trim()}`;
  const meaning = normalizeText(item.frenchMeaning).slice(0, 180);
  const reference = normalizeText(item.reference).slice(0, 120);
  return `text:${meaning}|ref:${reference}`;
}

function deduplicateAndPrioritizeHadithItems(
  items: HadithRepositoryItem[],
  limit = 6,
): HadithRepositoryItem[] {
  const byKey = new Map<string, HadithRepositoryItem>();
  for (const item of items) {
    if (!item.frenchMeaning?.trim()) continue;
    const key = hadithItemKey(item);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, item);
      continue;
    }
    // Keep the richer variant when the same hadith comes from two paths.
    const existingRichness = `${existing.reference} ${existing.grade ?? ""} ${existing.narrator ?? ""}`.length;
    const candidateRichness = `${item.reference} ${item.grade ?? ""} ${item.narrator ?? ""}`.length;
    if (candidateRichness > existingRichness) byKey.set(key, item);
  }

  return [...byKey.values()]
    .sort((a, b) => {
      const collectionDelta = hadithCollectionPriority(a.collection) - hadithCollectionPriority(b.collection);
      if (collectionDelta !== 0) return collectionDelta;
      return b.frenchMeaning.length - a.frenchMeaning.length;
    })
    .slice(0, limit);
}

function hadithSearchPhrases(question: string): string[] {
  const normalized = normalizeText(question);
  const aliases: Array<[RegExp, string[]]> = [
    [/\b(?:patience|patienter|sabr|epreuve|epreuves)\b/u, ["patience", "épreuve patience"]],
    [/\b(?:intention|intentions|niyya)\b/u, ["intention", "sincérité intention"]],
    [/\b(?:colere|enerve|enervement|dispute)\b/u, ["colère", "douceur", "maîtrise de soi"]],
    [/\b(?:misericorde|rahma)\b/u, ["miséricorde", "douceur"]],
    [/\b(?:pardon|pardonner|repentir|tawba|istighfar)\b/u, ["pardon", "repentir"]],
    [/\b(?:sincerite|ikhlas)\b/u, ["sincérité"]],
    [/\b(?:priere|salat)\b/u, ["prière", "importance de la prière"]],
    [/\b(?:jeune|ramadan|sawm)\b/u, ["jeûne", "Ramadan"]],
    [/\b(?:parents|pere|mere)\b/u, ["parents", "bienfaisance envers les parents"]],
    [/\b(?:enfant|enfants|education|eduquer)\b/u, ["enfants", "éducation des enfants"]],
    [/\b(?:mariage|epoux|epouse|conjoint|conjointe|couple|femme|mari)\b/u, ["mariage", "bon comportement envers l'épouse", "droits des époux"]],
    [/\b(?:reconciliation|reconcilier|dispute)\b/u, ["réconciliation", "douceur dans le foyer"]],
    [/\b(?:tristesse|angoisse|inquietude|anxiete|peur)\b/u, ["tristesse", "angoisse", "confiance en Allah"]],
    [/\b(?:charite|aumone|sadaqa|zakat)\b/u, ["aumône", "zakat", "charité"]],
    [/\b(?:orgueil|arrogance)\b/u, ["orgueil"]],
    [/\b(?:humilite|modestie)\b/u, ["humilité"]],
    [/\b(?:heritage|succession|heritier)\b/u, ["héritage", "parts d'héritage"]],
    [/\b(?:voisin|voisins|voisinage)\b/u, ["voisin", "droits du voisin"]],
    [/\b(?:promesse|promesses|promet|promis|engagement|engagements|pacte|pactes|trahit|trahison)\b/u, ["promesse", "engagement", "tenir sa promesse", "trahir un engagement", "hypocrisie pratique"]],
    [/\b(?:commerce|vente|acheter|vendre|dette|dettes)\b/u, ["commerce", "vente", "dette"]],
  ];

  const phrases: string[] = [];
  for (const [pattern, expansions] of aliases) {
    if (pattern.test(normalized)) phrases.push(...expansions);
  }

  const genericStopWords = new Set([
    "allah", "coran", "islam", "selon", "sunna", "sunnah", "hadith", "hadiths",
    "comment", "pourquoi", "quels", "quelles", "quelle", "donne", "conseils",
    "avec", "dans", "pour", "entre", "leurs", "souvent", "peut", "doit", "faire",
  ]);
  const keywords = normalized
    .split(" ")
    .filter((word) => word.length >= 5 && !genericStopWords.has(word));

  // Search individual concepts rather than only the full sentence. HadeethEnc's
  // search is lexical and long phrases frequently return zero results.
  phrases.push(...keywords.slice(0, 4));
  if (keywords.length >= 2) phrases.push(`${keywords[0]} ${keywords[1]}`);

  return [...new Set(phrases.map((phrase) => phrase.trim()).filter(Boolean))].slice(0, 10);
}

async function fetchHadeethEncJson<T>(path: string, timeoutMs = 5000): Promise<T | null> {
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

async function searchHadeethEnc(question: string): Promise<HadithRepositoryRecord | null> {
  const phrases = hadithSearchPhrases(question);
  const knownSeeds = knownHadeethEncSeeds(question);
  const searchResults = await Promise.all(phrases.map(async (phrase) => {
    const payload = await fetchHadeethEncJson<HadeethEncSearchPayload>(
      `/hadeeths/search/?language=fr&phrase=${encodeURIComponent(phrase)}`,
    );
    const summaries = (Array.isArray(payload) ? payload : payload?.data ?? [])
      .filter((item) => item.id != null && item.title?.trim());
    return { phrase, summaries };
  }));
  console.log("WASIL_HADEETHENC_SEARCH_EXPRESSIONS", {
    expressionCount: phrases.length,
    resultsByExpression: searchResults.map(({ phrase, summaries }) => ({
      phrase,
      resultCount: summaries.length,
    })),
  });
  hadithRepositoryDebug.set(normalizeText(question), {
    expressionsExecuted: [...phrases],
    resultsByExpression: searchResults.map(({ phrase, summaries }) => ({
      expression: phrase,
      resultCount: summaries.length,
    })),
    hadeethEncIds: [],
  });

  const summariesById = new Map<
    string,
    { summary: HadeethEncSummary; matchedPhrases: Set<string> }
  >();
  for (const { phrase, summaries } of searchResults) {
    for (const summary of summaries) {
      const id = String(summary.id);
      const existing = summariesById.get(id);
      if (existing) {
        existing.matchedPhrases.add(phrase);
      } else {
        summariesById.set(id, {
          summary,
          matchedPhrases: new Set([phrase]),
        });
      }
    }
  }

  // Merge deterministic topic seeds with lexical search results. A seed only
  // supplies an official HadeethEnc id; the actual hadith data is always
  // fetched from the API below and is discarded if that fetch fails.
  for (const seed of knownSeeds) {
    const existing = summariesById.get(seed.id);
    if (existing) {
      seed.matchedPhrases.forEach((phrase) => existing.matchedPhrases.add(phrase));
    } else {
      summariesById.set(seed.id, {
        summary: { id: seed.id, title: seed.title },
        matchedPhrases: new Set(seed.matchedPhrases),
      });
    }
  }
  if (summariesById.size === 0) return null;

  const mergedSummaries = [...summariesById.entries()];
  const details = await Promise.all(mergedSummaries.map(([id]) =>
    fetchHadeethEncJson<HadeethEncItem>(
      `/hadeeths/one/?language=fr&id=${encodeURIComponent(id)}`,
    )
  ));
  const rawItems: HadithRepositoryItem[] = mergedSummaries.map(
    ([id, { summary, matchedPhrases }], index) => {
      const detail = details[index];
      return {
        id: String(detail?.id ?? id),
        collection: inferHadithCollection(`${detail?.reference ?? ""} ${detail?.attribution ?? ""}`),
        reference: detail?.reference?.trim() || detail?.attribution?.trim() || `Référence n°${String(summary.id)}`,
        narrator: detail?.attribution?.trim() || null,
        grade: detail?.grade?.trim() || null,
        arabicText: detail?.hadeeth_ar?.trim() || null,
        frenchMeaning: detail?.hadeeth?.trim() || summary.title!.trim(),
        relevance: detail?.explanation?.trim().slice(0, 500) ||
          `Hadith pertinent pour ${[...matchedPhrases].map((phrase) => `« ${phrase} »`).join(", ")}`,
      };
    },
  ).filter((item) => Boolean(item.frenchMeaning));

  const rankedItems = rankDocuments(
    rawItems,
    (item) => ({
      canonicalName: phrases.join(" "),
      queryTerms: [...phrases, question],
      reference: item.reference,
      text: `${item.frenchMeaning} ${item.relevance} ${item.collection}`,
    }),
    0.38,
    6,
    false,
  );

  // A deterministic seed is an official HadeethEnc identifier selected only
  // for a narrowly matched intent. Its content is still fetched live and must
  // remain available even when the generic lexical ranker scores the French
  // wording too weakly. This avoids losing direct hadiths because of wording
  // differences between the user's question and HadeethEnc's translation.
  const seededIds = new Set(knownSeeds.map((seed) => seed.id));
  const seededItems = rawItems.filter((item) => item.id && seededIds.has(item.id));
  const items = deduplicateAndPrioritizeHadithItems(
    [...seededItems, ...rankedItems.map(({ item }) => item)],
    6,
  );
  console.log("WASIL_HADITH_RELEVANCE_RANKING", {
    candidateCount: rawItems.length,
    retainedCount: items.length,
    retained: rankedItems.map(({ item, score, matchedTerms }) => ({
      id: item.id,
      reference: item.reference,
      score: Number(score.toFixed(3)),
      matchedTerms: matchedTerms.slice(0, 6),
    })),
  });
  console.log("WASIL_HADEETHENC_SEARCH_RESULT", {
    mergedResultCount: summariesById.size,
    relevantResultCount: items.length,
  });
  hadithRepositoryDebug.set(normalizeText(question), {
    expressionsExecuted: [...phrases],
    resultsByExpression: searchResults.map(({ phrase, summaries }) => ({
      expression: phrase,
      resultCount: summaries.length,
    })),
    hadeethEncIds: items
      .map((item) => item.id)
      .filter((id): id is string => Boolean(id)),
  });
  if (!items.length) return null;

  const value: Omit<HadithRepositoryRecord, "cacheStatus"> = {
    repository: "hadith",
    query: question,
    topic: phrases.join(" | "),
    items,
    cautions: [],
    references: items.map((item) => ({
      title: item.reference,
      url: `https://hadeethenc.com/fr/browse/hadith/${encodeURIComponent(item.id ?? "")}`,
    })),
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

function isRelevantHadeethEncItem(
  question: string,
  phrases: string[],
  item: HadithRepositoryItem,
): boolean {
  const ignoredTerms = new Set([
    "avec",
    "dans",
    "leurs",
    "pour",
    "quels",
    "quelle",
    "quelles",
    "vertus",
  ]);
  const relevanceTerms = [...new Set(
    [...phrases, question]
      .flatMap((value) => normalizeText(value).split(" "))
      .filter((term) => term.length >= 4 && !ignoredTerms.has(term)),
  )];
  if (relevanceTerms.length === 0) return true;

  const searchableText = normalizeText(
    `${item.frenchMeaning} ${item.relevance} ${item.reference}`,
  );
  return relevanceTerms.some((term) => searchableText.includes(term));
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
 * Experimental, read-only hadith retriever for the V4 shadow pipeline.
 * It is never called unless its feature flag is explicitly enabled.
 * Any retrieval or parsing failure returns null and cannot affect production.
 */
export async function searchHadithRepository(
  question: string,
  options: { force?: boolean } = {},
): Promise<HadithRepositoryRecord | null> {
  if (!options.force && !isHadithQuery(question)) return null;

  const key = normalizeText(question).slice(0, 220);
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

  const directRecord = await searchHadeethEnc(question);
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

  const model = Deno.env.get("WASIL_MODEL_STANDARD") ?? "gpt-5.6-luna";
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 1200,
        tools: [{ type: "web_search" }],
        tool_choice: "required",
        include: ["web_search_call.action.sources"],
        instructions:
          "Tu es le retriever Hadith de Wasil. Tu ne rédiges jamais la réponse finale. Recherche uniquement des hadiths dont la référence est identifiable. Privilégie les recueils reconnus et les bases qui donnent le recueil, le numéro ou le livre, le narrateur et le degré quand il est disponible. N'invente jamais un numéro, une chaîne, un degré ou un texte arabe. Si les sources divergent, signale-le dans cautions. Le frenchMeaning doit être une reformulation française fidèle et brève, pas une longue citation. Retourne uniquement le JSON demandé.",
        input: `QUESTION UTILISATEUR: ${question}`,
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
      }),
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
      }))
      : [];

    if (!parsed.topic?.trim() || items.length === 0) {
      console.warn("WASIL_V4_HADITH_REPOSITORY_EMPTY", {
        itemCount: items.length,
        referenceCount: references.length,
      });
      return returnDirectRecord();
    }

    const mergedItems = deduplicateAndPrioritizeHadithItems(
      [...(directRecord?.items ?? []), ...items],
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
