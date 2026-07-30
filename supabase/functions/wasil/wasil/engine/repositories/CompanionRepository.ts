import type { EntityCandidate } from "../EntityResolver.ts";
import {
  retrieveDocumentaryKnowledge,
  type DocumentaryReference,
} from "../DocumentaryRetriever.ts";

export type CompanionRepositoryRecord = {
  repository: "companions";
  entityId: string;
  canonicalName: string;
  aliases: string[];
  summary: string;
  establishedFacts: string[];
  cautions: string[];
  references: DocumentaryReference[];
  confidence: number;
  fetchedAt: string;
  cacheStatus: "hit" | "miss";
};

type CacheEntry = {
  expiresAt: number;
  value: Omit<CompanionRepositoryRecord, "cacheStatus">;
};

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const companionCache = new Map<string, CacheEntry>();

function slug(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "unknown";
}

function cacheKey(candidate: EntityCandidate): string {
  return candidate.lookupKeys[0] ?? candidate.normalizedText;
}

function readCache(key: string): CompanionRepositoryRecord | null {
  const entry = companionCache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    companionCache.delete(key);
    return null;
  }
  return { ...entry.value, cacheStatus: "hit" };
}

function writeCache(key: string, value: Omit<CompanionRepositoryRecord, "cacheStatus">): void {
  companionCache.set(key, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    value,
  });
}

/**
 * Experimental repository used only by the V4 shadow pipeline.
 * It never contains a hand-written catalogue of companions. The resolver
 * supplies search keys and the documentary retriever builds the factual record.
 */
export async function searchCompanionRepository(
  question: string,
  candidate: EntityCandidate,
): Promise<CompanionRepositoryRecord | null> {
  if (candidate.kindHint !== "companion") return null;

  const key = cacheKey(candidate);
  const cached = readCache(key);
  if (cached) return cached;

  const dossier = await retrieveDocumentaryKnowledge(question, {
    isIslamicEntity: true,
    entityType: "companion",
    canonicalName: candidate.displayText,
    aliases: candidate.lookupKeys,
  });

  if (!dossier) return null;

  const value: Omit<CompanionRepositoryRecord, "cacheStatus"> = {
    repository: "companions",
    entityId: `companion:${slug(dossier.canonicalName)}`,
    canonicalName: dossier.canonicalName,
    aliases: candidate.lookupKeys,
    summary: dossier.summary,
    establishedFacts: dossier.establishedFacts,
    cautions: dossier.cautions,
    references: dossier.references,
    confidence: candidate.confidence,
    fetchedAt: new Date().toISOString(),
  };

  writeCache(key, value);
  return { ...value, cacheStatus: "miss" };
}
