import {
  quranTopics,
  quranTopicSources,
  type QuranTopic,
  type QuranTopicSource,
} from "../knowledge/quranTopics.ts";

export type QuranDirectLookupAnswer = {
  topicId: string;
  canonicalName: string;
  title: string;
  body: string;
  sourceIds: string[];
  sources: Record<string, QuranTopicSource>;
};

function normalize(value: string): string {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\u0600-\u06ff\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsAlias(question: string, alias: string): boolean {
  const normalizedAlias = normalize(alias);
  if (!normalizedAlias) return false;
  const escaped = normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`).test(question);
}

/**
 * Fast path only for short, explicit requests asking for a Quran verse/passage.
 * Explanations, tafsir, fiqh and personal applications keep the full Wasil pipeline.
 */
export function isSimpleQuranVerseLookup(question: string): boolean {
  const normalized = normalize(question);
  if (!normalized || normalized.length > 220) return false;

  if (
    /\b(?:explique|expliquer|tafsir|interpretation|interpreter|pourquoi|comment|avis|fatwa|halal|haram|licite|interdit|obligatoire|regle|appliquer|application|mon cas|ma situation)\b/u
      .test(normalized)
  ) {
    return false;
  }

  const asksForQuranEvidence =
    /\b(?:verset|versets|passage|passages|sourate|coran|quran)\b/u.test(normalized);
  const lookupShape =
    /\b(?:quel|quelle|quels|quelles|donne|trouve|cherche|cite|citation|sur|concernant|propos|parle)\b/u
      .test(normalized);

  return asksForQuranEvidence && lookupShape;
}

export function findQuranDirectLookupTopic(question: string): QuranTopic | null {
  if (!isSimpleQuranVerseLookup(question)) return null;
  const normalized = normalize(question);
  return quranTopics.find((topic) =>
    Boolean(topic.quickAnswer) &&
    topic.aliases.some((alias) => containsAlias(normalized, alias))
  ) ?? null;
}

export function getQuranDirectLookupAnswer(
  question: string,
): QuranDirectLookupAnswer | null {
  const topic = findQuranDirectLookupTopic(question);
  const quickAnswer = topic?.quickAnswer;
  if (!topic || !quickAnswer) return null;

  const sourceIds = quickAnswer.sourceIds.filter((sourceId) =>
    Boolean(quranTopicSources[sourceId])
  );
  if (sourceIds.length === 0) return null;

  const sources = Object.fromEntries(
    sourceIds.map((sourceId) => [sourceId, quranTopicSources[sourceId]]),
  );

  return {
    topicId: topic.id,
    canonicalName: topic.canonicalName,
    title: quickAnswer.title,
    body: quickAnswer.body,
    sourceIds,
    sources,
  };
}
