import type { EntityResolution } from "./EntityResolver.ts";
import type { CompanionRepositoryRecord } from "./repositories/CompanionRepository.ts";
import type { HadithRepositoryRecord } from "./repositories/HadithRepository.ts";
import type {
  QuranRepositoryPassage,
  QuranRepositoryRecord,
} from "./repositories/QuranRepository.ts";

export type AggregatedKnowledgeReference = {
  id: string;
  repository: "quran" | "companions" | "hadith";
  title: string;
  excerpt: string;
  reference: string;
  url?: string;
};

export type AggregatedKnowledgeFact = {
  repository: "quran" | "companions" | "hadith";
  text: string;
};

export type KnowledgeDossier = {
  version: "wasil-v4-shadow-1";
  subject: string | null;
  entityKind: string | null;
  repositoriesConsulted: Array<"quran" | "companions" | "hadith">;
  summaries: string[];
  facts: AggregatedKnowledgeFact[];
  quranPassages: QuranRepositoryPassage[];
  cautions: string[];
  references: AggregatedKnowledgeReference[];
  confidence: number;
  completeness: "empty" | "partial" | "substantial";
  generatedAt: string;
};

export type KnowledgeAggregatorInput = {
  entityResolution: EntityResolution | null;
  companionRecord: CompanionRepositoryRecord | null;
  quranRecord: QuranRepositoryRecord | null;
  hadithRecord: HadithRepositoryRecord | null;
};

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLocaleLowerCase("fr");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function referenceKey(reference: AggregatedKnowledgeReference): string {
  return [
    reference.repository,
    reference.reference,
    reference.url ?? "",
    reference.title,
  ].join("|").toLocaleLowerCase("fr");
}

function uniqueReferences(
  references: AggregatedKnowledgeReference[],
): AggregatedKnowledgeReference[] {
  const seen = new Set<string>();
  const result: AggregatedKnowledgeReference[] = [];

  for (const reference of references) {
    const key = referenceKey(reference);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(reference);
  }

  return result;
}

function computeCompleteness(
  facts: AggregatedKnowledgeFact[],
  quranPassages: QuranRepositoryPassage[],
  references: AggregatedKnowledgeReference[],
): KnowledgeDossier["completeness"] {
  const evidenceCount = facts.length + quranPassages.length + references.length;
  if (evidenceCount === 0) return "empty";
  if (evidenceCount >= 8 || references.length >= 4) return "substantial";
  return "partial";
}

/**
 * Pure aggregation layer for Wasil V4 shadow mode.
 * It never retrieves data, calls a model, or changes the production answer.
 * Repository outputs are normalized into one stable dossier contract.
 */
export function aggregateKnowledge(
  input: KnowledgeAggregatorInput,
): KnowledgeDossier {
  const repositoriesConsulted: KnowledgeDossier["repositoriesConsulted"] = [];
  const summaries: string[] = [];
  const facts: AggregatedKnowledgeFact[] = [];
  const quranPassages: QuranRepositoryPassage[] = [];
  const cautions: string[] = [];
  const references: AggregatedKnowledgeReference[] = [];
  const confidenceSignals: number[] = [];

  if (input.companionRecord) {
    repositoriesConsulted.push("companions");
    summaries.push(input.companionRecord.summary);
    confidenceSignals.push(clampConfidence(input.companionRecord.confidence));

    for (const fact of input.companionRecord.establishedFacts) {
      facts.push({ repository: "companions", text: fact });
    }

    cautions.push(...input.companionRecord.cautions);

    input.companionRecord.references.forEach((reference, index) => {
      references.push({
        id: `companions:${index + 1}`,
        repository: "companions",
        title: reference.title,
        excerpt: "",
        reference: reference.url,
        url: reference.url,
      });
    });
  }

  if (input.hadithRecord) {
    repositoriesConsulted.push("hadith");
    confidenceSignals.push(clampConfidence(input.hadithRecord.confidence));

    for (const item of input.hadithRecord.items) {
      facts.push({
        repository: "hadith",
        text: `${item.collection} — ${item.reference}: ${item.frenchMeaning}`,
      });
    }

    cautions.push(...input.hadithRecord.cautions);

    input.hadithRecord.references.forEach((reference, index) => {
      references.push({
        id: `hadith:${index + 1}`,
        repository: "hadith",
        title: reference.title,
        excerpt: "",
        reference: reference.url,
        url: reference.url,
      });
    });
  }

  if (input.quranRecord) {
    repositoriesConsulted.push("quran");
    quranPassages.push(...input.quranRecord.passages);

    input.quranRecord.passages.forEach((passage) => {
      references.push({
        id: passage.sourceId,
        repository: "quran",
        title: passage.title,
        excerpt: passage.excerpt,
        reference: passage.reference,
      });
    });

    confidenceSignals.push(input.quranRecord.passages.length > 0 ? 1 : 0);
  }

  const uniqueFacts = facts.filter((fact, index, all) => {
    const key = `${fact.repository}:${fact.text.trim().toLocaleLowerCase("fr")}`;
    return all.findIndex((candidate) =>
      `${candidate.repository}:${candidate.text.trim().toLocaleLowerCase("fr")}` === key
    ) === index;
  });
  const uniquePassages = input.quranRecord
    ? input.quranRecord.passages.filter((passage, index, all) =>
      all.findIndex((candidate) => candidate.sourceId === passage.sourceId) === index
    )
    : [];
  const uniqueReferenceList = uniqueReferences(references);

  const subject = input.companionRecord?.canonicalName
    ?? input.quranRecord?.canonicalName
    ?? input.hadithRecord?.topic
    ?? input.entityResolution?.candidate?.displayText
    ?? null;

  const confidence = confidenceSignals.length > 0
    ? confidenceSignals.reduce((sum, signal) => sum + signal, 0) /
      confidenceSignals.length
    : 0;

  return {
    version: "wasil-v4-shadow-1",
    subject,
    entityKind: input.entityResolution?.candidate?.kindHint ?? null,
    repositoriesConsulted: [...new Set(repositoriesConsulted)],
    summaries: uniqueStrings(summaries),
    facts: uniqueFacts,
    quranPassages: uniquePassages,
    cautions: uniqueStrings(cautions),
    references: uniqueReferenceList,
    confidence: clampConfidence(confidence),
    completeness: computeCompleteness(
      uniqueFacts,
      uniquePassages,
      uniqueReferenceList,
    ),
    generatedAt: new Date().toISOString(),
  };
}
