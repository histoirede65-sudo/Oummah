import {
  quranTopics,
  quranTopicSources,
  type QuranTopicSource,
} from "../knowledge/quranTopics.ts";

export type QuranTopicRetrieval = {
  topicId: string;
  canonicalName: string;
  sources: Record<string, QuranTopicSource>;
} | null;

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
  const normalizedAlias = normalize(alias);
  return new RegExp(`(?:^|\\s)${normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|\\s)`).test(
    question,
  );
}

export function retrieveQuranTopic(question: string): QuranTopicRetrieval {
  const normalizedQuestion = normalize(question);
  const topic = quranTopics.find((candidate) =>
    candidate.aliases.some((alias) => containsAlias(normalizedQuestion, alias)),
  );
  if (!topic) return null;

  const sources = Object.fromEntries(
    topic.sourceIds
      .map((sourceId) => [sourceId, quranTopicSources[sourceId]] as const)
      .filter((entry): entry is readonly [string, QuranTopicSource] => Boolean(entry[1])),
  );

  return {
    topicId: topic.id,
    canonicalName: topic.canonicalName,
    sources,
  };
}
