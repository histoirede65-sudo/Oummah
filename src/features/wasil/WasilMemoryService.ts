import {
  clearWasilProfileMemories,
  deleteWasilProfileMemory,
  listWasilProfileMemories,
  setWasilProfileMemory,
  type WasilProfileMemoryKey,
} from "./WasilApiClient";
import type { WasilReply } from "./WasilLocalResponder";
import { preRouteWasilIntent } from "./WasilIntentPreRouter";
import { translate } from "../../i18n";

type ParsedMemory = {
  key: WasilProfileMemoryKey;
  label: string;
  value: string;
};

const MEMORY_VERBS = [
  "memorise",
  "memoriser",
  "souviens toi",
  "retiens",
  "retenir",
  "garde en memoire",
  "note que",
  "enregistre cette preference",
  "enregistre ma preference",
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

function cleanValue(value: string) {
  return value
    .replace(/\s+(?:s'il te pla[îi]t|stp|d'accord)$/iu, "")
    .replace(/^[\s:;,.-]+|[\s:;,.-]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function captured(value: string, patterns: readonly RegExp[]) {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    const result = cleanValue(match?.[1] ?? "");
    if (result) return result;
  }
  return "";
}

function memoryKeyForPrompt(value: string): WasilProfileMemoryKey | null {
  const normalized = normalize(value);
  if (normalized.includes("recitateur")) return "preferred_reciter";
  if (normalized.includes("traduction")) return "preferred_translation";
  if (normalized.includes("tafsir")) return "preferred_tafsir";
  if (
    normalized.includes("moment d etude") ||
    normalized.includes("moment pour etudier") ||
    normalized.includes("etudier plutot") ||
    normalized.includes("prefere etudier") ||
    normalized.includes("etudie mieux")
  ) {
    return "preferred_study_time";
  }
  if (
    normalized.includes("minutes par jour") ||
    normalized.includes("temps quotidien")
  ) {
    return "daily_time_minutes";
  }
  if (
    normalized.includes("objectif d apprentissage") ||
    normalized.includes("objectif de memorisation") ||
    normalized.includes("je veux memoriser") ||
    normalized.includes("je veux apprendre") ||
    normalized.includes("je veux reviser")
  ) {
    return "learning_goal";
  }
  if (
    normalized.includes("reponses simples") ||
    normalized.includes("reponses courtes") ||
    normalized.includes("reponses detaillees") ||
    normalized.includes("reponses approfondies") ||
    normalized.includes("niveau d explication")
  ) {
    return "answer_depth";
  }
  if (
    normalized.includes("langue preferee") ||
    normalized.includes("reponds moi en") ||
    normalized.includes("repondre en")
  ) {
    return "preferred_language";
  }
  return null;
}

function parseMemory(value: string): ParsedMemory | null {
  const normalized = normalize(value);
  const key = memoryKeyForPrompt(value);
  if (!key) return null;

  if (key === "preferred_reciter") {
    const reciter = captured(value, [
      /(?:récitateur|recitateur)(?:\s+préféré)?\s+(?:est\s+)?(.+)$/iu,
      /je\s+préfère\s+(.+?)\s+comme\s+(?:récitateur|recitateur)/iu,
    ]);
    return reciter
      ? { key, label: translate("wasil.memory.label.reciter"), value: reciter }
      : null;
  }

  if (key === "preferred_translation") {
    const translation = captured(value, [
      /(?:traduction)(?:\s+préférée)?\s+(?:est\s+)?(.+)$/iu,
      /je\s+préfère\s+(.+?)\s+comme\s+traduction/iu,
    ]);
    return translation
      ? { key, label: translate("wasil.memory.label.translation"), value: translation }
      : null;
  }

  if (key === "preferred_tafsir") {
    const tafsir = captured(value, [
      /(?:tafsir)(?:\s+préféré)?\s+(?:est\s+)?(.+)$/iu,
      /je\s+préfère\s+(.+?)\s+comme\s+tafsir/iu,
    ]);
    return tafsir ? { key, label: translate("wasil.memory.label.tafsir"), value: tafsir } : null;
  }

  if (key === "daily_time_minutes") {
    const minutes = Number(normalized.match(/\b(\d{1,3})\s+minutes?\b/)?.[1]);
    return minutes >= 1 && minutes <= 180
      ? {
          key,
          label: translate("wasil.memory.label.dailyTime"),
          value: translate("wasil.memory.minutesPerDay", { minutes }),
        }
      : null;
  }

  if (key === "learning_goal") {
    const goal = captured(value, [
      /(?:je\s+veux|mon\s+objectif\s+est\s+de)\s+((?:mémoriser|memoriser|apprendre|réviser|reviser|lire)\s+.+)$/iu,
      /(?:objectif\s+(?:d'apprentissage|d apprentissage|de\s+mémorisation|de\s+memorisation))\s+(?:est\s+)?(.+)$/iu,
    ]);
    return goal
      ? { key, label: translate("wasil.memory.label.learningGoal"), value: goal }
      : null;
  }

  if (key === "preferred_study_time") {
    const period = ["matin", "midi", "après-midi", "soir", "nuit"].find(
      (candidate) => normalized.includes(normalize(candidate)),
    );
    return period
      ? { key, label: translate("wasil.memory.label.studyTime"), value: period }
      : null;
  }

  if (key === "answer_depth") {
    const depth = normalized.includes("approfond")
      ? "approfondies"
      : normalized.includes("detail")
        ? "détaillées"
        : normalized.includes("court")
          ? "courtes"
          : "simples";
    return { key, label: translate("wasil.memory.label.answerStyle"), value: depth };
  }

  const language = ["français", "arabe", "anglais"].find((candidate) =>
    normalized.includes(normalize(candidate)),
  );
  return language ? { key, label: translate("wasil.memory.label.language"), value: language } : null;
}

function isListIntent(value: string) {
  const normalized = normalize(value);
  return [
    "que sais tu de moi",
    "qu est ce que tu sais de moi",
    "montre ta memoire",
    "affiche ta memoire",
    "quelles sont mes preferences",
    "mes preferences memorisees",
    "ce que tu as memorise",
  ].some((term) => normalized.includes(term));
}

function isClearIntent(value: string) {
  const normalized = normalize(value);
  return [
    "oublie tout ce que tu sais de moi",
    "efface tout ce que tu sais de moi",
    "efface toute ta memoire sur moi",
    "supprime toutes mes preferences memorisees",
  ].some((term) => normalized.includes(term));
}

function isDeleteIntent(value: string) {
  const normalized = normalize(value);
  return preRouteWasilIntent(value).explicitMemoryIntent &&
    /\b(?:oublie|efface|supprime)\b/u.test(normalized);
}

function isSetIntent(value: string) {
  const normalized = normalize(value);
  return MEMORY_VERBS.some((term) => normalized.includes(term));
}

export function isWasilMemoryIntent(value: string) {
  return preRouteWasilIntent(value).explicitMemoryIntent && (
    isListIntent(value) ||
    isClearIntent(value) ||
    isDeleteIntent(value) ||
    isSetIntent(value)
  );
}

function supportedMemoryReply(): WasilReply {
  return {
    kind: "unsupported-religious",
    title: translate("wasil.memory.unsupportedTitle"),
    body: translate("wasil.memory.unsupportedBody"),
  };
}

export async function manageWasilMemory(value: string): Promise<WasilReply> {
  if (isListIntent(value)) {
    const memories = await listWasilProfileMemories();
    if (!memories.length) {
      return {
        kind: "answer",
        title: translate("wasil.memory.emptyTitle"),
        body: translate("wasil.memory.emptyBody"),
      };
    }
    return {
      kind: "answer",
      title: translate("wasil.memory.listTitle"),
      body: `${memories
        .map((memory) => `• ${memory.display_label} : ${memory.memory_value}`)
        .join(
          "\n",
        )}\n\n${translate("wasil.memory.listFooter")}`,
    };
  }

  if (isClearIntent(value)) {
    const deletedCount = await clearWasilProfileMemories();
    return {
      kind: "answer",
      title: translate("wasil.memory.clearedTitle"),
      body: deletedCount
        ? deletedCount > 1
          ? translate("wasil.memory.clearedMany", { count: deletedCount })
          : translate("wasil.memory.clearedOne")
        : translate("wasil.memory.clearedNone"),
    };
  }

  if (isDeleteIntent(value)) {
    const key = memoryKeyForPrompt(value);
    if (!key) return supportedMemoryReply();
    const deleted = await deleteWasilProfileMemory(key);
    return {
      kind: "answer",
      title: deleted ? translate("wasil.memory.forgottenTitle") : translate("wasil.memory.nothingTitle"),
      body: deleted
        ? translate("wasil.memory.forgottenBody")
        : translate("wasil.memory.nothingBody"),
    };
  }

  const memory = parseMemory(value);
  if (!memory) return supportedMemoryReply();
  await setWasilProfileMemory(memory.key, memory.value, memory.label);
  return {
    kind: "answer",
    title: translate("wasil.memory.savedTitle"),
    body: translate("wasil.memory.savedBody", {
      label: memory.label.toLowerCase(),
      value: memory.value,
    }),
  };
}
