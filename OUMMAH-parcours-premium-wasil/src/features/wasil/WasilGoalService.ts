import { goalRepository } from "../daily-goals/data/goalRepository";
import type { DailyGoalSettings } from "../daily-goals/domain/DailyPlan";
import { goalProgressBridge } from "../daily-goals/services/goalProgressBridge";
import { progressivePathRepository } from "../progressive-paths/data/progressivePathRepository";
import { progressivePathProgress } from "../progressive-paths/domain/ProgressivePath";
import type { WasilReply } from "./WasilLocalResponder";

type SupportedFocus = DailyGoalSettings["focus"][number];

export type PendingWasilGoalAction = {
  prompt: string;
  missing: "subject";
};

export type WasilGoalActionResult = {
  reply: WasilReply;
  pending?: PendingWasilGoalAction;
};

const AVAILABLE_PACES: DailyGoalSettings["dailyMinutes"][] = [5, 10, 20, 30];
const AUTOMATIC_FOCUSES: SupportedFocus[] = [
  "quran",
  "dhikr",
  "hifz",
  "dua",
  "hadith",
];

const FOCUS_DEFINITIONS: ReadonlyArray<{
  id: SupportedFocus;
  label: string;
  terms: string[];
}> = [
  {
    id: "quran",
    label: "Coran",
    terms: ["coran", "quran", "lecture coranique"],
  },
  {
    id: "dhikr",
    label: "Dhikr",
    terms: ["dhikr", "istighfar", "salawat", "tasbih"],
  },
  {
    id: "hifz",
    label: "Mémorisation",
    terms: ["memorisation", "memoriser", "hifz", "apprendre une sourate"],
  },
  {
    id: "dua",
    label: "Dou‘as",
    terms: ["doua", "dou a", "dua", "invocation"],
  },
  { id: "hadith", label: "Hadith", terms: ["hadith", "hadiths"] },
  {
    id: "prayer",
    label: "Prière",
    terms: ["priere", "salat", "salah"],
  },
  {
    id: "character",
    label: "Bon comportement",
    terms: ["bon comportement", "bonne action", "comportement"],
  },
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/-/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isPersonalGoalIntent(value: string) {
  const normalized = normalize(value);
  const mentionsGoal =
    normalized.includes("objectif") || normalized.includes("objectifs");
  const asksToAdd = ["ajoute", "ajouter", "cree", "creer", "mets"].some(
    (term) => normalized.includes(term),
  );
  return mentionsGoal && asksToAdd && !normalized.includes("programme");
}

function isProgramIntent(value: string) {
  const normalized = normalize(value);
  if (
    normalized.includes("ouvre mes objectifs") ||
    normalized.includes("affiche mes objectifs") ||
    normalized.includes("montre mes objectifs")
  ) {
    return false;
  }
  return (
    normalized.includes("programme spirituel") ||
    normalized.includes("mon programme") ||
    normalized.includes("un programme") ||
    (normalized.includes("mes objectifs") &&
      ["adapte", "allege", "prepare", "organise", "construis"].some((term) =>
        normalized.includes(term),
      )) ||
    normalized.includes("organise ma journee") ||
    normalized.includes("organiser ma journee") ||
    normalized.includes("je veux progresser")
  );
}


function isProgressivePathIntent(value: string) {
  const normalized = normalize(value);
  const mentionsMemorization = [
    "memoriser",
    "memorisation",
    "apprendre",
    "hifz",
  ].some((term) => normalized.includes(term));
  const mentionsKahf = ["al kahf", "kahf", "la caverne", "sourate 18"].some(
    (term) => normalized.includes(term),
  );
  return mentionsMemorization && mentionsKahf;
}

export function isWasilGoalActionIntent(value: string) {
  return isProgressivePathIntent(value) || isPersonalGoalIntent(value) || isProgramIntent(value);
}

export function isWasilGoalActionFollowUp(value: string) {
  const normalized = normalize(value);
  return (
    normalized.length > 0 &&
    normalized.length <= 120 &&
    !/^(qui|que|quoi|comment|pourquoi|est ce que|ouvre|lance|ecoute)\b/.test(
      normalized,
    )
  );
}

function parseRequestedMinuteValue(value: string) {
  const match = normalize(value).match(
    /\b(\d{1,2})\s*(?:min|minute|minutes)\b/,
  );
  return match ? Number(match[1]) : null;
}

function parseRequestedMinutes(value: string) {
  const requested = parseRequestedMinuteValue(value);
  if (requested === null) return null;
  return AVAILABLE_PACES.reduce((closest, pace) =>
    Math.abs(pace - requested) < Math.abs(closest - requested) ? pace : closest,
  );
}

function parseFocuses(value: string) {
  const normalized = normalize(value);
  return FOCUS_DEFINITIONS.filter((focus) =>
    focus.terms.some((term) => normalized.includes(term)),
  ).map((focus) => focus.id);
}

function focusCost(
  focus: SupportedFocus,
  minutes: DailyGoalSettings["dailyMinutes"],
) {
  if (focus === "quran") return minutes >= 20 ? 16 : minutes <= 5 ? 2 : 3;
  if (focus === "dhikr") return minutes <= 5 ? 2 : 4;
  if (focus === "hifz") return 3;
  if (focus === "dua" || focus === "hadith") return 2;
  return 3;
}

function fitFocusesToPace(
  focuses: readonly SupportedFocus[],
  minutes: DailyGoalSettings["dailyMinutes"],
) {
  const automatic = focuses.filter((focus) =>
    AUTOMATIC_FOCUSES.includes(focus),
  );
  const selected: SupportedFocus[] = [];
  let usedMinutes = 0;
  for (const focus of automatic) {
    const cost = focusCost(focus, minutes);
    if (selected.length && usedMinutes + cost > minutes) continue;
    selected.push(focus);
    usedMinutes += cost;
  }
  return selected.length ? selected : (["quran"] as SupportedFocus[]);
}

function cleanPersonalGoal(value: string) {
  return value
    .replace(/\b(ajoute(?:r)?|cr[ée]e?r?|mets?)\b(?:\s+moi)?/giu, " ")
    .replace(/(?:à|a|dans)\s+mes\s+objectifs?\b/giu, " ")
    .replace(/\b(un|une|mon|mes|l')?\s*objectifs?\b/giu, " ")
    .replace(/^[\s:;,.-]+|[\s:;,.-]+$/g, "")
    .replace(/^de\s+/iu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function focusLabel(focus: SupportedFocus) {
  return FOCUS_DEFINITIONS.find((definition) => definition.id === focus)?.label;
}

async function ensurePersonalGoal(title: string, estimatedMinutes = 3) {
  const plan = await goalRepository.getToday();
  const normalizedTitle = normalize(title);
  if (
    plan.goals.some(
      (goal) => goal.personal && normalize(goal.title) === normalizedTitle,
    )
  ) {
    return plan;
  }
  return goalRepository.addPersonal(title, estimatedMinutes);
}

async function addPersonalGoal(prompt: string): Promise<WasilGoalActionResult> {
  const title = cleanPersonalGoal(prompt);
  if (!title) {
    return {
      pending: { prompt, missing: "subject" },
      reply: {
        kind: "unsupported-religious",
        title: "Quel objectif souhaitez-vous ajouter ?",
        body: "Indiquez simplement l’action, par exemple « appeler mes parents ». Aucun crédit ne sera utilisé.",
      },
    };
  }
  const estimatedMinutes = Math.min(
    60,
    Math.max(1, parseRequestedMinuteValue(prompt) ?? 5),
  );
  const plan = await ensurePersonalGoal(title, estimatedMinutes);
  goalProgressBridge.notify(plan);
  return {
    reply: {
      kind: "answer",
      title: "Objectif ajouté",
      body: `« ${title} » a été ajouté à vos objectifs d’aujourd’hui. Cette action n’a utilisé aucun crédit.`,
      action: { label: "Ouvrir mes objectifs", route: "/daily-goals" },
    },
  };
}

async function updateProgram(prompt: string): Promise<WasilGoalActionResult> {
  const current = await goalRepository.readSettings();
  const normalized = normalize(prompt);
  const requestedMinutes = parseRequestedMinutes(prompt);
  const requestedMinuteValue = parseRequestedMinuteValue(prompt);
  const minutes = normalized.includes("allege")
    ? 5
    : (requestedMinutes ?? current.dailyMinutes);
  const requestedFocuses = parseFocuses(prompt);
  const explicitlyAdds =
    normalized.includes("ajoute") && normalized.includes("programme");
  const currentAutomatic = current.focus.filter((focus) =>
    AUTOMATIC_FOCUSES.includes(focus),
  );
  const requestedAutomatic = requestedFocuses.filter((focus) =>
    AUTOMATIC_FOCUSES.includes(focus),
  );
  const candidates = requestedFocuses.length
    ? requestedAutomatic.length
      ? explicitlyAdds
        ? [...new Set([...currentAutomatic, ...requestedAutomatic])]
        : requestedAutomatic
      : []
    : currentAutomatic.length
      ? currentAutomatic
      : AUTOMATIC_FOCUSES;
  const focus = fitFocusesToPace(candidates, minutes);
  const settings: DailyGoalSettings = {
    dailyMinutes: minutes,
    focus,
    onboardingComplete: true,
  };
  let plan = await goalRepository.updateProgram(settings);

  const specialFocuses = requestedFocuses.filter(
    (item) => item === "prayer" || item === "character",
  );
  if (specialFocuses.includes("prayer")) {
    plan = await ensurePersonalGoal("Préparer ma prochaine prière", 3);
  }
  if (specialFocuses.includes("character")) {
    plan = await ensurePersonalGoal("Accomplir une bonne action discrète", 3);
  }
  goalProgressBridge.notify(plan);

  const labels = focus.map(focusLabel).filter(Boolean).join(" · ");
  const addedSpecials = specialFocuses
    .map(focusLabel)
    .filter(Boolean)
    .join(" · ");
  const nearestPaceNotice =
    requestedMinuteValue !== null && requestedMinuteValue !== minutes
      ? ` Le rythme disponible le plus proche est ${minutes} minutes.`
      : "";
  return {
    reply: {
      kind: "answer",
      title: "Programme adapté",
      body: `Votre programme est réglé sur ${minutes} minutes : ${labels}.${
        addedSpecials
          ? ` Un objectif sobre a aussi été ajouté pour : ${addedSpecials}.`
          : ""
      }${nearestPaceNotice} Cette action n’a utilisé aucun crédit.`,
      action: { label: "Voir mon programme", route: "/daily-goals" },
    },
  };
}


async function createProgressivePath(prompt: string): Promise<WasilGoalActionResult> {
  const settings = await goalRepository.readSettings();
  const path = await progressivePathRepository.createKahfPath(settings.dailyMinutes);
  const progress = progressivePathProgress(path);
  const next = path.sessions.find((session) => session.status !== "completed");
  return {
    reply: {
      kind: "answer",
      title: "Parcours Premium préparé",
      body: `Votre parcours « ${path.title} » est prêt : ${progress.total} séances avec apprentissage, révisions régulières et consolidation finale. Le rythme est réglé sur ${path.dailyMinutes} minutes par jour.${
        next ? ` Première séance : ${next.title}.` : ""
      } L’accès sera relié au statut Premium lors du branchement du paiement.`,
      action: { label: "Voir mon parcours", route: "/daily-goals" },
    },
  };
}

export async function manageWasilGoals(
  prompt: string,
): Promise<WasilGoalActionResult> {
  if (isProgressivePathIntent(prompt)) return createProgressivePath(prompt);
  if (isPersonalGoalIntent(prompt)) return addPersonalGoal(prompt);
  return updateProgram(prompt);
}
