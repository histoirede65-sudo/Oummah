import type { EntityResolution } from "./EntityResolver.ts";
import type { KnowledgeDossier } from "./KnowledgeAggregator.ts";

export type WasilSkillId =
  | "quran"
  | "hadith"
  | "tafsir"
  | "companion"
  | "scholar"
  | "sirah"
  | "dua"
  | "fiqh"
  | "prayer"
  | "qibla"
  | "mosque"
  | "travel"
  | "goals"
  | "reminder"
  | "audio"
  | "progress";

export type PlannedSkill = {
  id: WasilSkillId;
  priority: number;
  reason: string;
  required: boolean;
};

export type SkillPlan = {
  intent:
    | "knowledge"
    | "explanation"
    | "biography"
    | "comparison"
    | "action"
    | "planning"
    | "unknown";
  skills: PlannedSkill[];
  canUseKnowledgeDossier: boolean;
  shouldAskClarification: boolean;
  confidence: number;
};

type PlannerInput = {
  question: string;
  entityResolution?: EntityResolution | null;
  knowledgeDossier?: KnowledgeDossier | null;
};

const RULES: Array<{
  skill: WasilSkillId;
  pattern: RegExp;
  reason: string;
  priority: number;
  required?: boolean;
}> = [
  { skill: "quran", pattern: /\b(?:coran|qur['’]?an|verset|ayah|sourate|surah)\b/iu, reason: "Référence explicite au Coran", priority: 100, required: true },
  { skill: "hadith", pattern: /\b(?:hadith|sunna|sunnah|recueil|bukhari|boukhari|muslim)\b/iu, reason: "Référence explicite aux hadiths", priority: 100, required: true },
  { skill: "tafsir", pattern: /\b(?:tafsir|ex[eé]g[eè]se|ibn kathir|sa['’]?di|tabari|explique.*(?:verset|sourate))\b/iu, reason: "Demande d’explication coranique", priority: 95 },
  { skill: "companion", pattern: /\b(?:compagnon|sahabi|sahabiyya)\b/iu, reason: "Sujet relatif aux compagnons", priority: 95 },
  { skill: "scholar", pattern: /\b(?:imam|savant|cheikh|shaykh)\b/iu, reason: "Sujet relatif à un savant", priority: 90 },
  { skill: "sirah", pattern: /\b(?:sira|sirah|proph[eè]te|messager|hijra|bataille|exp[eé]dition)\b/iu, reason: "Sujet relatif à la Sîra", priority: 90 },
  { skill: "dua", pattern: /\b(?:dou['’]?a|dua|invocation|invoquer)\b/iu, reason: "Demande d’invocation", priority: 90 },
  { skill: "fiqh", pattern: /\b(?:avis|madhhab|[eé]cole|hanafi|maliki|shafi|hanbali|halal|haram|licite|interdit|obligatoire)\b/iu, reason: "Question juridique ou comparative", priority: 90 },
  { skill: "prayer", pattern: /\b(?:pri[eè]re|salat|fajr|dhuhr|asr|maghrib|isha|joumou['’]?a)\b/iu, reason: "Besoin lié à la prière", priority: 90 },
  { skill: "qibla", pattern: /\b(?:qibla|direction de la mecque|direction.*mecque)\b/iu, reason: "Besoin de direction de la Qibla", priority: 90 },
  { skill: "mosque", pattern: /\b(?:mosqu[eé]e|masjid|joumou['’]?a.*(?:heure|lieu))\b/iu, reason: "Recherche de mosquée", priority: 85 },
  { skill: "travel", pattern: /\b(?:voyage|voyager|d[eé]part|avion|train|maroc|[eé]tranger|musafir)\b/iu, reason: "Contexte de voyage", priority: 85 },
  { skill: "goals", pattern: /\b(?:objectif|programme|plan d['’][eé]tude|m[eé]moriser|apprendre|routine)\b/iu, reason: "Demande de programme ou d’objectif", priority: 85 },
  { skill: "reminder", pattern: /\b(?:rappelle[- ]?moi|rappel|tous les jours|chaque soir|chaque matin)\b/iu, reason: "Demande de rappel", priority: 80 },
  { skill: "audio", pattern: /\b(?:audio|[eé]couter|r[eé]citation|r[eé]citateur|lis[- ]?moi)\b/iu, reason: "Besoin audio", priority: 80 },
  { skill: "progress", pattern: /\b(?:progression|suivi|r[eé]viser|r[eé]vision|niveau)\b/iu, reason: "Besoin de suivi", priority: 75 },
];


function explicitlyRequestsOnlyQuran(question: string): boolean {
  return /\b(?:uniquement|seulement|exclusivement)\s+(?:dans|selon)?\s*(?:le\s+)?(?:coran|qur[’']?an)|\bque dit (?:uniquement|seulement) le coran\b/iu.test(question);
}

function explicitlyRequestsOnlyHadith(question: string): boolean {
  return /\b(?:uniquement|seulement|exclusivement)\s+(?:dans|selon)?\s*(?:les?\s+)?(?:hadiths?|sunna|sunnah)|\bque dit (?:uniquement|seulement) la sunnah\b/iu.test(question);
}

function isDocumentaryReligiousQuestion(question: string): boolean {
  const normalized = question.toLocaleLowerCase("fr");
  if (/\b(?:qibla|mosqu[eé]e|ouvre|lance|programme|rappelle[- ]?moi|audio|r[eé]citateur)\b/iu.test(normalized)) return false;
  return /\b(?:islam|allah|foi|iman|ihsan|adoration|spirituel|p[eé]ch[eé]|repentir|tawba|patience|sabr|intention|niyya|col[eè]re|mis[eé]ricorde|pardon|sinc[eé]rit[eé]|ikhlas|comportement|adab|parents|mariage|[eé]preuve|tristesse|angoisse|justice|charit[eé]|aum[oô]ne|fraternit[eé]|jalousie|orgueil|humilit[eé]|pri[eè]re|je[uû]ne|zakat|hajj|ramadan|halal|haram|licite|interdit|obligatoire|conseil.*relig|que dit.*islam|selon.*islam)\b/iu.test(normalized);
}

function normalizeQuestion(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function detectIntent(question: string): SkillPlan["intent"] {
  if (/\b(?:compare|comparaison|diff[eé]rence|avis des quatre|selon les [eé]coles)\b/iu.test(question)) return "comparison";
  if (/\b(?:cr[eé]e|pr[eé]pare|organise|planifie|rappelle[- ]?moi|je veux m[eé]moriser|fais[- ]?moi un programme)\b/iu.test(question)) return "planning";
  if (/\b(?:ouvre|lance|montre[- ]?moi|trouve.*(?:mosqu[eé]e|qibla)|calcule)\b/iu.test(question)) return "action";
  if (/\b(?:qui est|qui [eé]tait|parle[- ]?moi de|biographie|raconte.*vie)\b/iu.test(question)) return "biography";
  if (/\b(?:explique|pourquoi|signification|tafsir|d[eé]taille)\b/iu.test(question)) return "explanation";
  if (question.length > 0) return "knowledge";
  return "unknown";
}

function addSkill(map: Map<WasilSkillId, PlannedSkill>, skill: PlannedSkill): void {
  const current = map.get(skill.id);
  if (!current || skill.priority > current.priority) map.set(skill.id, skill);
}

/**
 * Creates a deterministic, side-effect-free plan. It does not call external
 * services and never executes an app action. The plan is suitable for shadow
 * evaluation before any production routing is enabled.
 */
export function planWasilSkills(input: PlannerInput): SkillPlan {
  const question = normalizeQuestion(input.question);
  const intent = detectIntent(question);
  const selected = new Map<WasilSkillId, PlannedSkill>();

  for (const rule of RULES) {
    if (rule.pattern.test(question)) {
      addSkill(selected, {
        id: rule.skill,
        priority: rule.priority,
        reason: rule.reason,
        required: rule.required ?? false,
      });
    }
  }

  const entity = input.entityResolution?.candidate;
  if (entity?.kindHint === "companion") {
    addSkill(selected, { id: "companion", priority: 98, reason: "Entité reconnue comme compagnon", required: true });
  } else if (entity?.kindHint === "scholar") {
    addSkill(selected, { id: "scholar", priority: 98, reason: "Entité reconnue comme savant", required: true });
  } else if (entity?.kindHint === "prophet") {
    addSkill(selected, { id: "sirah", priority: 96, reason: "Entité reconnue comme prophète", required: true });
    addSkill(selected, { id: "quran", priority: 92, reason: "Les récits prophétiques doivent être vérifiés dans le Coran", required: false });
  } else if (entity?.kindHint === "surah") {
    addSkill(selected, { id: "quran", priority: 98, reason: "Entité reconnue comme sourate", required: true });
  }

  if (intent === "biography" && !selected.has("companion") && !selected.has("scholar") && !selected.has("sirah")) {
    addSkill(selected, { id: "sirah", priority: 70, reason: "Biographie islamique non catégorisée", required: false });
  }

  if (intent === "comparison") {
    addSkill(selected, { id: "fiqh", priority: 95, reason: "Une comparaison nécessite des avis structurés et sourcés", required: true });
  }

  // Documentary-by-default policy: for a substantive religious explanation,
  // Wasil checks both revelation sources before drafting. Explicit requests
  // limited to one corpus remain respected.
  if (isDocumentaryReligiousQuestion(question)) {
    if (!explicitlyRequestsOnlyHadith(question)) {
      addSkill(selected, {
        id: "quran",
        priority: 88,
        reason: "Toute réponse religieuse substantielle vérifie les preuves coraniques pertinentes",
        required: false,
      });
    }
    if (!explicitlyRequestsOnlyQuran(question)) {
      addSkill(selected, {
        id: "hadith",
        priority: 87,
        reason: "Toute réponse religieuse substantielle vérifie les preuves authentiques de la Sounnah pertinentes",
        required: false,
      });
    }
  }

  if (intent === "planning" && /\b(?:m[eé]moriser|apprendre|r[eé]viser)\b/iu.test(question)) {
    addSkill(selected, { id: "goals", priority: 95, reason: "Construction d’un parcours d’apprentissage", required: true });
    addSkill(selected, { id: "progress", priority: 82, reason: "Le parcours doit pouvoir être suivi", required: false });
  }

  if (selected.has("travel")) {
    addSkill(selected, { id: "dua", priority: 72, reason: "Le voyage peut nécessiter les invocations dédiées", required: false });
    addSkill(selected, { id: "prayer", priority: 70, reason: "Le voyage peut modifier les besoins liés aux prières", required: false });
    addSkill(selected, { id: "qibla", priority: 65, reason: "Le voyage peut nécessiter la direction de la Qibla", required: false });
  }

  const skills = [...selected.values()].sort((a, b) => b.priority - a.priority);
  const hasUsefulContext = Boolean(entity || input.knowledgeDossier || skills.length > 0);
  const shouldAskClarification =
    intent === "unknown" ||
    (!hasUsefulContext && question.split(" ").length <= 2);

  const signalCount = skills.length + (entity ? 1 : 0) + (input.knowledgeDossier ? 1 : 0);
  const confidence = Math.min(0.99, Math.max(0.35, 0.48 + signalCount * 0.08));

  return {
    intent,
    skills,
    canUseKnowledgeDossier: Boolean(input.knowledgeDossier),
    shouldAskClarification,
    confidence,
  };
}
