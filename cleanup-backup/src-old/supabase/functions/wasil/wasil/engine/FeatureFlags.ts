export type WasilFeatureFlags = {
  v4ShadowPipeline: boolean;
  v4EntityResolver: boolean;
  v4CompanionRepository: boolean;
  v4QuranRepository: boolean;
  v4KnowledgeAggregator: boolean;
  v4SkillPlanner: boolean;
  v4HadithRepository: boolean;
  v4Brain: boolean;
  v4Executor: boolean;
  v4PromptBuilder: boolean;
  v4ProductionPromptBuilder: boolean;
  v4ProductionBrainGuidance: boolean;
  v4ExecutionPlan: boolean;
};

function envFlag(name: string, defaultValue = false): boolean {
  const raw = Deno.env.get(name)?.trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on";
}

/**
 * Experimental Wasil V4 features are opt-in only.
 * Their default state is disabled so production behaviour cannot change
 * merely because the new files are deployed.
 */
export function getWasilFeatureFlags(): WasilFeatureFlags {
  return {
    v4ShadowPipeline: envFlag("WASIL_V4_SHADOW_PIPELINE", false),
    v4EntityResolver: envFlag("WASIL_V4_ENTITY_RESOLVER", false),
    v4CompanionRepository: envFlag("WASIL_V4_COMPANION_REPOSITORY", false),
    v4QuranRepository: envFlag("WASIL_V4_QURAN_REPOSITORY", false),
    v4KnowledgeAggregator: envFlag("WASIL_V4_KNOWLEDGE_AGGREGATOR", false),
    v4SkillPlanner: envFlag("WASIL_V4_SKILL_PLANNER", false),
    v4HadithRepository: envFlag("WASIL_V4_HADITH_REPOSITORY", false),
    v4Brain: envFlag("WASIL_V4_BRAIN", false),
    v4Executor: envFlag("WASIL_V4_EXECUTOR", false),
    v4PromptBuilder: envFlag("WASIL_V4_PROMPT_BUILDER", false),
    v4ProductionPromptBuilder: envFlag("WASIL_V4_PRODUCTION_PROMPT_BUILDER", false),
    v4ProductionBrainGuidance: envFlag("WASIL_V4_PRODUCTION_BRAIN_GUIDANCE", false),
    v4ExecutionPlan: envFlag("WASIL_V4_EXECUTION_PLAN", false),
  };
}
