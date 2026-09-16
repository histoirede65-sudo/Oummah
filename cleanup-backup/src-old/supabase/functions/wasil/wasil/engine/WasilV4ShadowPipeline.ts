import { buildWasilBrainPlan, type WasilBrainPlan } from "./Brain.ts";
import { resolveEntityCandidate, type EntityResolution } from "./EntityResolver.ts";
import { executeWasilBrainPlan, type WasilExecutionResult } from "./Executor.ts";
import { getWasilFeatureFlags } from "./FeatureFlags.ts";
import {
  buildWasilPromptPackage,
  type WasilPromptPackage,
} from "./PromptBuilder.ts";
import {
  aggregateKnowledge,
  type KnowledgeDossier,
} from "./KnowledgeAggregator.ts";
import {
  searchCompanionRepository,
  type CompanionRepositoryRecord,
} from "./repositories/CompanionRepository.ts";
import { planWasilSkills, type SkillPlan } from "./SkillPlanner.ts";
import {
  searchHadithRepository,
  type HadithRepositoryRecord,
} from "./repositories/HadithRepository.ts";
import {
  searchQuranRepository,
  type QuranRepositoryRecord,
} from "./repositories/QuranRepository.ts";

export type WasilV4ShadowResult = {
  entityResolution: EntityResolution | null;
  companionRecord: CompanionRepositoryRecord | null;
  quranRecord: QuranRepositoryRecord | null;
  hadithRecord: HadithRepositoryRecord | null;
  knowledgeDossier: KnowledgeDossier | null;
  skillPlan: SkillPlan | null;
  brainPlan: WasilBrainPlan | null;
  executionResult: WasilExecutionResult | null;
  promptPackage: WasilPromptPackage | null;
};

/**
 * Runs experimental V4 analysis without influencing the production answer.
 * Every failure is swallowed and logged. This function must never throw.
 */
export async function runWasilV4ShadowPipeline(
  question: string,
  requestId: string,
): Promise<WasilV4ShadowResult | null> {
  const flags = getWasilFeatureFlags();
  if (!flags.v4ShadowPipeline) return null;

  try {
    const entityResolution = flags.v4EntityResolver
      ? resolveEntityCandidate(question)
      : null;

    // A first deterministic plan decides which repositories must be checked.
    // It runs before retrieval and is recomputed afterwards with the dossier.
    const preliminarySkillPlan = flags.v4SkillPlanner
      ? planWasilSkills({ question, entityResolution, knowledgeDossier: null })
      : null;
    const preliminarySkills = new Set(
      preliminarySkillPlan?.skills.map((skill) => skill.id) ?? [],
    );

    const productionDocumentaryMode =
      flags.v4ExecutionPlan || flags.v4ProductionBrainGuidance;
    const [quranRecord, hadithRecord] = await Promise.all([
      (flags.v4QuranRepository || productionDocumentaryMode) &&
          preliminarySkills.has("quran")
        ? searchQuranRepository(question)
        : Promise.resolve(null),
      (flags.v4HadithRepository || productionDocumentaryMode) &&
          preliminarySkills.has("hadith")
        ? searchHadithRepository(question, { force: true })
        : Promise.resolve(null),
    ]);

    const companionRecord =
      flags.v4CompanionRepository && entityResolution?.candidate
        ? await searchCompanionRepository(question, entityResolution.candidate)
        : null;

    const knowledgeDossier = flags.v4KnowledgeAggregator
      ? aggregateKnowledge({ entityResolution, companionRecord, quranRecord, hadithRecord })
      : null;

    const skillPlan = flags.v4SkillPlanner
      ? planWasilSkills({ question, entityResolution, knowledgeDossier })
      : null;

    const brainPlan = flags.v4Brain
      ? buildWasilBrainPlan({
          question,
          entityResolution,
          knowledgeDossier,
          skillPlan,
        })
      : null;

    const executionResult = flags.v4Executor
      ? executeWasilBrainPlan({ brainPlan, knowledgeDossier })
      : null;

    const promptPackage = flags.v4PromptBuilder
      ? buildWasilPromptPackage({
          question,
          brainPlan,
          executionResult,
        })
      : null;

    console.log("WASIL_V4_SHADOW_RESULT", {
      requestId,
      entityStatus: entityResolution?.status ?? "disabled",
      entityCandidate: entityResolution?.candidate?.normalizedText ?? null,
      entityDisplayText: entityResolution?.candidate?.displayText ?? null,
      entityKindHint: entityResolution?.candidate?.kindHint ?? null,
      entityLookupKeys: entityResolution?.candidate?.lookupKeys ?? [],
      entityConfidence: entityResolution?.candidate?.confidence ?? null,
      entityExtractionMethod: entityResolution?.candidate?.extractionMethod ?? null,
      companionRepositoryStatus: flags.v4CompanionRepository
        ? companionRecord
          ? "resolved"
          : "no_result"
        : "disabled",
      companionEntityId: companionRecord?.entityId ?? null,
      companionFactCount: companionRecord?.establishedFacts.length ?? 0,
      companionReferenceCount: companionRecord?.references.length ?? 0,
      companionCacheStatus: companionRecord?.cacheStatus ?? null,
      quranRepositoryStatus: flags.v4QuranRepository
        ? quranRecord
          ? "resolved"
          : "no_result"
        : "disabled",
      quranTopicId: quranRecord?.topicId ?? null,
      quranCanonicalName: quranRecord?.canonicalName ?? null,
      quranPassageCount: quranRecord?.passages.length ?? 0,
      quranRetrievalMode: quranRecord?.retrievalMode ?? null,
      quranCacheStatus: quranRecord?.cacheStatus ?? null,
      hadithRepositoryStatus: flags.v4HadithRepository
        ? hadithRecord
          ? "resolved"
          : "no_result"
        : "disabled",
      hadithTopic: hadithRecord?.topic ?? null,
      hadithItemCount: hadithRecord?.items.length ?? 0,
      hadithReferenceCount: hadithRecord?.references.length ?? 0,
      hadithCacheStatus: hadithRecord?.cacheStatus ?? null,
      knowledgeAggregatorStatus: flags.v4KnowledgeAggregator
        ? knowledgeDossier
          ? "aggregated"
          : "no_result"
        : "disabled",
      knowledgeRepositories: knowledgeDossier?.repositoriesConsulted ?? [],
      knowledgeFactCount: knowledgeDossier?.facts.length ?? 0,
      knowledgePassageCount: knowledgeDossier?.quranPassages.length ?? 0,
      knowledgeReferenceCount: knowledgeDossier?.references.length ?? 0,
      knowledgeCompleteness: knowledgeDossier?.completeness ?? null,
      knowledgeConfidence: knowledgeDossier?.confidence ?? null,
      skillPlannerStatus: flags.v4SkillPlanner ? "planned" : "disabled",
      skillIntent: skillPlan?.intent ?? null,
      plannedSkills: skillPlan?.skills.map((skill) => ({
        id: skill.id,
        priority: skill.priority,
        required: skill.required,
      })) ?? [],
      skillPlanConfidence: skillPlan?.confidence ?? null,
      skillPlanNeedsClarification: skillPlan?.shouldAskClarification ?? null,
      brainStatus: flags.v4Brain
        ? brainPlan
          ? "planned"
          : "no_plan"
        : "disabled",
      brainResponseStyle: brainPlan?.responseStyle ?? null,
      brainEvidencePolicy: brainPlan?.evidencePolicy ?? null,
      brainCanAnswerLocally: brainPlan?.canAnswerFromLocalKnowledge ?? null,
      brainNeedsClarification: brainPlan?.shouldAskClarification ?? null,
      brainRequiresProfessionalCaution:
        brainPlan?.requiresHumanOrProfessionalCaution ?? null,
      brainConfidence: brainPlan?.confidence ?? null,
      brainExecutionSteps: brainPlan?.executionSteps.map((step) => ({
        order: step.order,
        skill: step.skill,
        required: step.required,
      })) ?? [],
      executorStatus: flags.v4Executor
        ? executionResult?.status ?? "no_execution"
        : "disabled",
      executorRequiredSkillsSatisfied:
        executionResult?.requiredSkillsSatisfied ?? null,
      executorShouldUseWeb: executionResult?.shouldUseWeb ?? null,
      executorShouldAskClarification:
        executionResult?.shouldAskClarification ?? null,
      executorParallelGroups: executionResult?.parallelGroups ?? [],
      promptBuilderStatus: flags.v4PromptBuilder
        ? promptPackage
          ? "built"
          : "no_prompt"
        : "disabled",
      promptMessageCount: promptPackage?.messages.length ?? 0,
      promptEstimatedCharacters: promptPackage?.estimatedCharacters ?? 0,
      promptMetadata: promptPackage?.metadata ?? null,
      executorSteps: executionResult?.executedSteps.map((step) => ({
        order: step.order,
        skill: step.skill,
        status: step.status,
        required: step.required,
        evidenceCount: step.evidenceCount,
      })) ?? [],
    });

    return {
      entityResolution,
      companionRecord,
      quranRecord,
      hadithRecord,
      knowledgeDossier,
      skillPlan,
      brainPlan,
      executionResult,
      promptPackage,
    };
  } catch (error) {
    console.warn("WASIL_V4_SHADOW_FAILURE", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
