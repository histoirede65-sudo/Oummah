import { getQuranFoundationSdk } from "../../_shared/quranFoundation.ts";
import type { IslamicQueryExpansion } from "./IslamicQueryExpansion.ts";
import { rankDocuments } from "./RelevanceScorer.ts";
import { buildQuranSearchTerms, extractIntentConcepts } from "./UniversalIntent.ts";
import {
  quranTopics,
  quranTopicSources,
  type QuranTopicSource,
} from "../knowledge/quranTopics.ts";

export type QuranKnowledgeResult = {
  topicId: string;
  canonicalName: string;
  queryTerms: string[];
  sources: Record<string, QuranTopicSource>;
  retrievalMode: "curated" | "quran-foundation" | "hybrid";
} | null;

type EntityLexiconEntry = {
  id: string;
  canonicalName: string;
  aliases: string[];
  searchTerms: string[];
};

const entityLexicon: EntityLexiconEntry[] = [
  { id: "adam", canonicalName: "Âdam", aliases: ["adam", "âdam"], searchTerms: ["آدم", "Adam"] },
  { id: "idris", canonicalName: "Idrîs", aliases: ["idris", "idriss", "idrîs"], searchTerms: ["إدريس", "Idris"] },
  { id: "nuh", canonicalName: "Nûh", aliases: ["nouh", "nuh", "noe", "noé"], searchTerms: ["نوح", "Noé", "Nuh"] },
  { id: "hud", canonicalName: "Hûd", aliases: ["houd", "hud", "hûd"], searchTerms: ["هود", "Hud"] },
  { id: "salih", canonicalName: "Sâlih", aliases: ["salih", "saleh", "sâlih"], searchTerms: ["صالح", "Salih"] },
  { id: "ibrahim", canonicalName: "Ibrâhîm", aliases: ["ibrahim", "ibrâhîm", "abraham"], searchTerms: ["إبراهيم", "Abraham", "Ibrahim"] },
  { id: "lut", canonicalName: "Lût", aliases: ["lout", "lut", "loth", "lût"], searchTerms: ["لوط", "Loth", "Lut"] },
  { id: "ismail", canonicalName: "Ismâ‘îl", aliases: ["ismail", "ismael", "ismaël", "ismâ‘îl"], searchTerms: ["إسماعيل", "Ismaël", "Ismail"] },
  { id: "ishaq", canonicalName: "Ishâq", aliases: ["ishaq", "ishak", "isaac", "ishâq"], searchTerms: ["إسحاق", "Isaac", "Ishaq"] },
  { id: "yaqub", canonicalName: "Ya‘qûb", aliases: ["yaqub", "yacoub", "jacob", "ya‘qûb"], searchTerms: ["يعقوب", "Jacob", "Yaqub"] },
  { id: "yusuf", canonicalName: "Yûsuf", aliases: ["yusuf", "youssouf", "joseph", "yûsuf"], searchTerms: ["يوسف", "Joseph", "Yusuf"] },
  { id: "shuayb", canonicalName: "Shu‘ayb", aliases: ["chouayb", "shuayb", "shuaib"], searchTerms: ["شعيب", "Shuayb"] },
  { id: "ayyub", canonicalName: "Ayyûb", aliases: ["ayoub", "ayyub", "job", "ayyûb"], searchTerms: ["أيوب", "Job", "Ayyub"] },
  { id: "dhulkifl", canonicalName: "Dhûl-Kifl", aliases: ["dhu al kifl", "dhul kifl", "doul kifl"], searchTerms: ["ذو الكفل", "Dhul-Kifl"] },
  { id: "musa", canonicalName: "Mûsâ", aliases: ["moussa", "musa", "moise", "moïse", "mûsâ"], searchTerms: ["موسى", "Moïse", "Musa"] },
  { id: "harun", canonicalName: "Hârûn", aliases: ["haroun", "harun", "aaron", "hârûn"], searchTerms: ["هارون", "Aaron", "Harun"] },
  { id: "dawud", canonicalName: "Dâwûd", aliases: ["daoud", "dawud", "david", "dâwûd"], searchTerms: ["داود", "David", "Dawud"] },
  { id: "sulayman", canonicalName: "Sulaymân", aliases: ["souleymane", "souleiman", "suleyman", "sulayman", "salomon"], searchTerms: ["سليمان", "Salomon", "Sulayman"] },
  { id: "ilyas", canonicalName: "Ilyâs", aliases: ["ilyas", "elias", "élie", "ilyâs"], searchTerms: ["إلياس", "Élie", "Ilyas"] },
  { id: "alyasa", canonicalName: "Al-Yasa‘", aliases: ["alyasa", "al yasa", "elisee", "élisée"], searchTerms: ["اليسع", "Élisée", "Al-Yasa"] },
  { id: "yunus", canonicalName: "Yûnus", aliases: ["younes", "yunus", "jonas", "yûnus"], searchTerms: ["يونس", "Jonas", "Yunus"] },
  { id: "zakariya", canonicalName: "Zakariyyâ", aliases: ["zakaria", "zakariya", "zacharie"], searchTerms: ["زكريا", "Zacharie", "Zakariya"] },
  { id: "yahya", canonicalName: "Yahyâ", aliases: ["yahya", "yahia", "jean baptiste", "jean-baptiste"], searchTerms: ["يحيى", "Jean-Baptiste", "Yahya"] },
  { id: "isa", canonicalName: "‘Îsâ", aliases: ["issa", "isa", "jesus", "jésus", "‘îsâ"], searchTerms: ["عيسى", "Jésus", "Isa"] },
  { id: "muhammad", canonicalName: "Muhammad ﷺ", aliases: ["muhammad", "mohammed", "mohamed", "prophète muhammad"], searchTerms: ["محمد", "Muhammad"] },
  { id: "maryam", canonicalName: "Maryam", aliases: ["maryam", "marie"], searchTerms: ["مريم", "Marie", "Maryam"] },
  { id: "firawn", canonicalName: "Pharaon", aliases: ["pharaon", "firaoun", "firawn"], searchTerms: ["فرعون", "Pharaon"] },
];

function normalize(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAlias(question: string, alias: string) {
  const escaped = normalize(alias).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`).test(question);
}

function extractGenericSearchTerm(question: string) {
  return normalize(question)
    .replace(/\b(qui est|que dit le coran sur|que dit le coran de|parle moi de|parle-moi de|raconte moi|raconte-moi|dans le coran|selon le coran|explique moi|explique-moi|quel est|quels sont|quelles sont)\b/g, " ")
    .replace(/\b(le|la|les|un|une|des|du|de|d|sur|au|aux|a|à|ce|cet|cette|ces|moi|nous)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseVerseKey(value: unknown): { chapter: number; verse: number } | null {
  const text = String(value ?? "");
  const match = text.match(/^(\d{1,3}):(\d{1,3})$/);
  if (!match) return null;
  const chapter = Number(match[1]);
  const verse = Number(match[2]);
  if (chapter < 1 || chapter > 114 || verse < 1) return null;
  return { chapter, verse };
}

function curatedRetrieval(question: string) {
  const normalizedQuestion = normalize(question);
  const topic = quranTopics.find((candidate) =>
    candidate.aliases.some((alias) => containsAlias(normalizedQuestion, alias)),
  );
  if (!topic) return null;

  return {
    topicId: topic.id,
    canonicalName: topic.canonicalName,
    sources: Object.fromEntries(
      topic.sourceIds
        .map((sourceId) => [sourceId, quranTopicSources[sourceId]] as const)
        .filter((entry): entry is readonly [string, QuranTopicSource] => Boolean(entry[1])),
    ),
  };
}

function identifyEntity(question: string) {
  const normalizedQuestion = normalize(question);
  return entityLexicon.find((entry) =>
    entry.aliases.some((alias) => containsAlias(normalizedQuestion, alias)),
  ) ?? null;
}

async function searchQuranTerms(
  terms: string[],
  canonicalName?: string | null,
  evidenceTerms: string[] = [],
  relatedTerms: string[] = [],
) {
  const sdk = getQuranFoundationSdk();
  const collected = new Map<
    string,
    { source: QuranTopicSource; matchedQueries: Set<string> }
  >();

  const limitedTerms = terms.slice(0, 10);

  const searchOneTerm = async (term: string): Promise<"ok" | "auth_failed" | "failed"> => {
    try {
      const response = await sdk.search.search(term, {
        mode: "quick" as never,
        language: "fr" as never,
        getText: "1",
        highlight: "0",
        navigationalResultsNumber: 0,
        versesResultsNumber: 20,
        size: 20,
      });
      const results = response.result?.verses ?? [];
      for (const result of results) {
        const parsed = parseVerseKey(result.key);
        if (!parsed) continue;
        const id = `quran-search:${parsed.chapter}:${parsed.verse}`;
        const existing = collected.get(id);
        if (existing) {
          existing.matchedQueries.add(term);
          continue;
        }
        collected.set(id, {
          source: {
            title: `Passage coranique ${parsed.chapter}:${parsed.verse}`,
            body: String(result.name ?? "Passage identifié dans le Coran par le moteur OUMMAH.")
              .replace(/<[^>]+>/g, " ")
              .replace(/\s+/g, " ")
              .trim()
              .slice(0, 1200),
            reference: `Coran ${parsed.chapter}:${parsed.verse}`,
          },
          matchedQueries: new Set([term]),
        });
      }
      return "ok";
    } catch (error) {
      const errorRecord =
        typeof error === "object" && error !== null
          ? error as Record<string, unknown>
          : null;
      const message = error instanceof Error ? error.message : String(error);

      console.warn("QURAN_KNOWLEDGE_SEARCH_TERM_FAILED", {
        term,
        name: error instanceof Error ? error.name : null,
        message,
        stack: error instanceof Error ? error.stack : null,
        cause: error instanceof Error ? error.cause : errorRecord?.cause ?? null,
        status: errorRecord?.status ?? errorRecord?.statusCode ?? null,
        code: errorRecord?.code ?? null,
        response: errorRecord?.response ?? null,
        details: errorRecord?.details ?? null,
        rawKeys: errorRecord ? Object.keys(errorRecord) : [],
      });

      return /token request failed:\s*400\b/i.test(message)
        ? "auth_failed"
        : "failed";
    }
  };

  // Validate authentication with one term first. When Quran.Foundation rejects
  // the application token, avoid launching nine identical failing requests.
  // Once access works, all remaining semantic terms are still searched in
  // parallel, so source coverage is preserved.
  if (limitedTerms.length > 0) {
    const firstResult = await searchOneTerm(limitedTerms[0]);
    if (firstResult !== "auth_failed") {
      await Promise.all(limitedTerms.slice(1).map((term) => searchOneTerm(term)));
    } else {
      console.warn("QURAN_KNOWLEDGE_AUTH_FAILURE_FAST_FAIL", {
        skippedTermCount: Math.max(0, limitedTerms.length - 1),
      });
    }
  }

  const ranked = rankDocuments(
    [...collected.entries()],
    ([, candidate]) => ({
      canonicalName,
      queryTerms: terms,
      evidenceTerms,
      relatedTerms,
      reference: candidate.source.reference,
      text: `${candidate.source.title} ${candidate.source.body}`,
      kind: "quran",
      retrievalHits: candidate.matchedQueries.size,
    }),
    0.18,
    12,
    false,
  );

  console.log("WASIL_QURAN_RELEVANCE_RANKING", {
    candidateCount: collected.size,
    retainedCount: ranked.length,
    retained: ranked.map(({ item: [id, candidate], score, matchedTerms }) => ({
      id,
      reference: candidate.source.reference,
      retrievalHits: candidate.matchedQueries.size,
      score: Number(score.toFixed(3)),
      matchedTerms: matchedTerms.slice(0, 8),
    })),
  });

  return Object.fromEntries(
    ranked.map(({ item: [id, candidate] }) => [id, candidate.source]),
  );
}

export async function retrieveQuranKnowledge(
  question: string,
  expansion?: IslamicQueryExpansion | null,
): Promise<QuranKnowledgeResult> {
  const curated = curatedRetrieval(question);
  const entity = identifyEntity(question);
  const genericTerm = extractGenericSearchTerm(question);
  const universalTerms = buildQuranSearchTerms(question);
  const queryTerms = expansion?.quranSearchTerms?.length
    ? [...new Set([
        ...expansion.quranSearchTerms,
        ...expansion.evidenceTerms,
        ...universalTerms,
      ])]
    : entity
    ? [...new Set([...entity.searchTerms, ...entity.aliases.slice(0, 2), ...universalTerms])]
    : universalTerms.length > 0
    ? universalTerms
    : genericTerm.length >= 3
    ? [genericTerm]
    : [];

  let dynamicSources: Record<string, QuranTopicSource> = {};
  if (queryTerms.length > 0) {
    try {
      dynamicSources = await searchQuranTerms(
        [...new Set(queryTerms)],
        expansion?.canonicalName ?? curated?.canonicalName ?? entity?.canonicalName ?? extractIntentConcepts(question).map((c) => c.label).join(" ") ?? genericTerm,
        expansion?.evidenceTerms ?? buildQuranSearchTerms(question),
        expansion?.relatedTerms ?? [],
      );
    } catch (error) {
      console.warn("QURAN_KNOWLEDGE_SEARCH_FAILED", {
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const mergedSources = {
    ...(curated?.sources ?? {}),
    ...dynamicSources,
  };
  if (Object.keys(mergedSources).length === 0) return null;

  // Rank the final merged set as well. Previously, curated sources bypassed the
  // relevance filter, which could reintroduce unrelated verses after a good
  // dynamic search.
  const finalRanked = rankDocuments(
    Object.entries(mergedSources),
    ([, source]) => ({
      canonicalName: expansion?.canonicalName ?? curated?.canonicalName ?? entity?.canonicalName ?? extractIntentConcepts(question).map((c) => c.label).join(" ") ?? genericTerm,
      queryTerms: [...queryTerms, question],
      evidenceTerms: expansion?.evidenceTerms ?? buildQuranSearchTerms(question),
      relatedTerms: expansion?.relatedTerms ?? [],
      reference: source.reference,
      text: `${source.title} ${source.body}`,
      kind: "quran",
    }),
    0.34,
    8,
    false,
  );
  const sources = Object.fromEntries(finalRanked.map(({ item }) => item));
  if (Object.keys(sources).length === 0) return null;

  console.log("WASIL_QURAN_FINAL_RELEVANCE_RANKING", {
    candidateCount: Object.keys(mergedSources).length,
    retainedCount: finalRanked.length,
    retained: finalRanked.map(({ item: [id, source], score, matchedTerms }) => ({
      id,
      reference: source.reference,
      score: Number(score.toFixed(3)),
      matchedTerms: matchedTerms.slice(0, 8),
    })),
  });

  return {
    topicId: curated?.topicId ?? entity?.id ?? `search:${normalize(expansion?.canonicalName || genericTerm || "quran")}`,
    canonicalName: curated?.canonicalName ?? expansion?.canonicalName ?? entity?.canonicalName ?? genericTerm,
    queryTerms,
    sources,
    retrievalMode: curated && Object.keys(dynamicSources).length > 0
      ? "hybrid"
      : curated
      ? "curated"
      : "quran-foundation",
  };
}
