import {
  retrieveQuranKnowledge,
  type QuranKnowledgeResult,
} from "../QuranKnowledgeEngine.ts";
import {
  buildProphetBiographyExpansion,
  expandIslamicQuery,
  type IslamicQueryExpansion,
} from "../IslamicQueryExpansion.ts";
import type { QuranTopicSource } from "../../knowledge/quranTopics.ts";

export type QuranRepositoryPassage = {
  sourceId: string;
  title: string;
  excerpt: string;
  reference: string;
};

export type QuranRepositoryRecord = {
  repository: "quran";
  topicId: string;
  canonicalName: string;
  queryTerms: string[];
  passages: QuranRepositoryPassage[];
  retrievalMode: "curated" | "quran-foundation" | "hybrid";
  fetchedAt: string;
  cacheStatus: "hit" | "miss";
};

type CacheEntry = {
  expiresAt: number;
  value: Omit<QuranRepositoryRecord, "cacheStatus">;
};

const CACHE_TTL_MS = 30 * 60 * 1000;
const quranCache = new Map<string, CacheEntry>();

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCacheKey(question: string): string {
  return normalize(question).slice(0, 240);
}

function readCache(key: string): QuranRepositoryRecord | null {
  const entry = quranCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    quranCache.delete(key);
    return null;
  }
  return { ...entry.value, cacheStatus: "hit" };
}

function writeCache(
  key: string,
  value: Omit<QuranRepositoryRecord, "cacheStatus">,
): void {
  quranCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });
}

function toPassage(sourceId: string, source: QuranTopicSource): QuranRepositoryPassage {
  return {
    sourceId,
    title: source.title,
    excerpt: source.body,
    reference: source.reference,
  };
}

function toRecord(
  result: Exclude<QuranKnowledgeResult, null>,
): Omit<QuranRepositoryRecord, "cacheStatus"> {
  return {
    repository: "quran",
    topicId: result.topicId,
    canonicalName: result.canonicalName,
    queryTerms: result.queryTerms,
    passages: Object.entries(result.sources)
      .map(([sourceId, source]) => toPassage(sourceId, source)),
    retrievalMode: result.retrievalMode,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Experimental Quran repository used only by the V4 shadow pipeline.
 * It delegates retrieval to the existing Quran knowledge engine, converts its
 * output into a stable repository contract and caches successful dossiers.
 * It never throws: an unavailable Quran Foundation token simply returns null.
 */
export async function searchQuranRepository(
  question: string,
  expansion?: IslamicQueryExpansion | null,
): Promise<QuranRepositoryRecord | null> {
  const key = buildCacheKey(question);
  if (!key) return null;

  const cached = readCache(key);
  if (cached) return cached;

  try {
    const resolvedExpansion = expansion ??
      buildProphetBiographyExpansion(question) ??
      await expandIslamicQuery(question);
    const result = await retrieveQuranKnowledge(question, resolvedExpansion);
    if (!result) return null;

    const value = toRecord(result);
    writeCache(key, value);
    return { ...value, cacheStatus: "miss" };
  } catch (error) {
    console.warn("WASIL_V4_QURAN_REPOSITORY_FAILURE", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
