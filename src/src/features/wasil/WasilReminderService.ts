import * as Notifications from "expo-notifications";

import { storageService } from "../../core/storage/StorageService";
import {
  loadNotificationCenterPreferences,
  requestNotificationCenterPermission,
  type CenterAlertMode,
} from "../notifications/NotificationCenter";
import { resolveWasilFreeAction } from "./WasilActionRouter";
import type { WasilReply } from "./WasilLocalResponder";

const STORAGE_KEY = "oummah.wasil.reminders.v1";

type ReminderFrequency = "once" | "daily" | "weekly";
type MissingReminderDetail = "time" | "subject";
type MissingReminderManagementDetail = "time" | "target";

export type PendingWasilReminder = {
  prompt: string;
  missing: MissingReminderDetail;
};

export type PendingWasilReminderManagement = {
  prompt: string;
  missing: MissingReminderManagementDetail;
};

type WasilReminderRequest = {
  subject: string;
  route: string;
  frequency: ReminderFrequency;
  hour: number;
  minute: number;
  weekday?: number;
  scheduledAt?: Date;
};

type StoredWasilReminder = {
  id: string;
  notificationId: string;
  subject: string;
  route: string;
  frequency: ReminderFrequency;
  hour: number;
  minute: number;
  weekday?: number;
  scheduledAt?: string;
  createdAt: string;
};

export type WasilReminderResolution =
  | { kind: "not-reminder" }
  | {
      kind: "clarification";
      pending: PendingWasilReminder;
      reply: WasilReply;
    }
  | { kind: "ready"; request: WasilReminderRequest };

const REMINDER_INTENTS = [
  "rappelle moi",
  "rappel moi",
  "cree un rappel",
  "creer un rappel",
  "programme un rappel",
  "programmer un rappel",
  "programme moi",
  "previens moi",
  "notifie moi",
];

const DAY_DEFINITIONS = [
  { names: ["dimanche"], expoWeekday: 1, jsDay: 0 },
  { names: ["lundi"], expoWeekday: 2, jsDay: 1 },
  { names: ["mardi"], expoWeekday: 3, jsDay: 2 },
  { names: ["mercredi"], expoWeekday: 4, jsDay: 3 },
  { names: ["jeudi"], expoWeekday: 5, jsDay: 4 },
  { names: ["vendredi"], expoWeekday: 6, jsDay: 5 },
  { names: ["samedi"], expoWeekday: 7, jsDay: 6 },
] as const;

const NAMED_TIMES = [
  { terms: ["avant de dormir", "au coucher"], hour: 22, minute: 30 },
  { terms: ["matin", "matinee"], hour: 7, minute: 0 },
  { terms: ["midi", "pause dejeuner"], hour: 12, minute: 15 },
  { terms: ["apres midi"], hour: 16, minute: 0 },
  { terms: ["soir", "soiree"], hour: 20, minute: 30 },
  { terms: ["nuit"], hour: 22, minute: 0 },
] as const;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/-/g, " ")
    .replace(/[^a-z0-9:\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isReminderIntent(value: string) {
  const normalized = normalize(value);
  return REMINDER_INTENTS.some((intent) => normalized.includes(intent));
}

function parseTime(value: string) {
  const normalized = normalize(value);
  const withMarker = normalized.match(
    /\b(?:a|vers|pour)\s+(\d{1,2})(?:\s*(?:h|:)\s*(\d{1,2}))?\b/,
  );
  const hourNotation = normalized.match(/\b(\d{1,2})\s*h\s*(\d{0,2})\b/);
  const colonNotation = normalized.match(/\b(\d{1,2}):(\d{2})\b/);
  const match = withMarker ?? hourNotation ?? colonNotation;

  if (match) {
    const hour = Number(match[1]);
    const minute = Number(match[2] || 0);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  return NAMED_TIMES.find((period) =>
    period.terms.some((term) => normalized.includes(term)),
  );
}

function parseDay(value: string) {
  const normalized = normalize(value);
  return DAY_DEFINITIONS.find((day) =>
    day.names.some((name) => normalized.includes(name)),
  );
}

function parseFrequency(value: string): ReminderFrequency {
  const normalized = normalize(value);
  const day = parseDay(normalized);
  if (
    day &&
    (normalized.includes(`chaque ${day.names[0]}`) ||
      normalized.includes(`tous les ${day.names[0]}`))
  ) {
    return "weekly";
  }
  if (
    [
      "tous les jours",
      "chaque jour",
      "tous les matins",
      "chaque matin",
      "tous les soirs",
      "chaque soir",
      "quotidien",
    ].some((term) => normalized.includes(term))
  ) {
    return "daily";
  }
  return "once";
}

function nextOccurrence(
  now: Date,
  hour: number,
  minute: number,
  targetJsDay?: number,
) {
  const date = new Date(now);
  date.setSeconds(0, 0);
  date.setHours(hour, minute, 0, 0);

  if (typeof targetJsDay === "number") {
    let daysToAdd = (targetJsDay - now.getDay() + 7) % 7;
    if (daysToAdd === 0 && date.getTime() <= now.getTime()) daysToAdd = 7;
    date.setDate(date.getDate() + daysToAdd);
    return date;
  }

  if (date.getTime() <= now.getTime()) date.setDate(date.getDate() + 1);
  return date;
}

function cleanSubject(value: string) {
  return value
    .replace(
      /\b(rappelle[- ]?moi|rappel[- ]?moi|cr[ée]e?r? un rappel|programme(?:r)? un rappel|programme[- ]?moi|pr[ée]viens[- ]?moi|notifie[- ]?moi)\b/giu,
      " ",
    )
    .replace(/\bun rappel\b/giu, " ")
    .replace(/\bdemain\s+(?:matin|midi|apr[èe]s-midi|soir|nuit)\b/giu, " ")
    .replace(/\b(demain|aujourd'hui|ce soir|ce matin)\b/giu, " ")
    .replace(
      /\b(tous les jours|chaque jour|tous les matins|chaque matin|tous les soirs|chaque soir|chaque (?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)|tous les (?:lundis|mardis|mercredis|jeudis|vendredis|samedis|dimanches))\b/giu,
      " ",
    )
    .replace(/(?:à|a|vers)\s+\d{1,2}(?:\s*(?:h|:)\s*\d{0,2})?\b/giu, " ")
    .replace(/\b\d{1,2}\s*h\s*\d{0,2}\b/giu, " ")
    .replace(
      /\b(?:avant de dormir|au coucher|le matin|le midi|l'après-midi|le soir|la nuit)\b/giu,
      " ",
    )
    .replace(/\b(de|pour)\b(?=\s)/giu, " ")
    .replace(/\s+/g, " ")
    .replace(/^[,.;:\s-]+|[,.;:\s-]+$/g, "")
    .trim();
}

function routeForSubject(subject: string) {
  return (
    resolveWasilFreeAction(subject)?.href ??
    resolveWasilFreeAction(`ouvre ${subject}`)?.href ??
    "/"
  );
}

function clarification(
  prompt: string,
  missing: MissingReminderDetail,
): WasilReminderResolution {
  return {
    kind: "clarification",
    pending: { prompt, missing },
    reply: {
      kind: "unsupported-religious",
      title: missing === "time" ? "À quel moment ?" : "Que dois-je rappeler ?",
      body:
        missing === "time"
          ? "Indiquez une heure ou un moment, par exemple « à 20h30 », « demain matin » ou « tous les soirs ». Aucun crédit ne sera utilisé."
          : "Indiquez simplement l’action à vous rappeler. Aucun crédit ne sera utilisé.",
    },
  };
}

export function isWasilReminderFollowUp(
  value: string,
  missing: MissingReminderDetail,
) {
  const normalized = normalize(value);
  if (missing === "time") {
    return (
      normalized.length <= 45 &&
      !/^(qui|que|quoi|comment|pourquoi|est ce que)\b/.test(normalized) &&
      Boolean(parseTime(value))
    );
  }
  return (
    normalized.length > 0 &&
    normalized.length <= 100 &&
    !/^(qui|que|quoi|comment|pourquoi|est ce que)\b/.test(normalized)
  );
}

export function resolveWasilReminder(
  rawPrompt: string,
  now = new Date(),
): WasilReminderResolution {
  if (!isReminderIntent(rawPrompt)) return { kind: "not-reminder" };

  const time = parseTime(rawPrompt);
  if (!time) return clarification(rawPrompt, "time");

  const subject = cleanSubject(rawPrompt);
  if (!subject) return clarification(rawPrompt, "subject");

  const frequency = parseFrequency(rawPrompt);
  const day = parseDay(rawPrompt);
  const normalized = normalize(rawPrompt);
  let scheduledAt: Date | undefined;

  if (frequency === "once") {
    scheduledAt = nextOccurrence(
      now,
      time.hour,
      time.minute,
      normalized.includes("demain") ? (now.getDay() + 1) % 7 : day?.jsDay,
    );
  }

  return {
    kind: "ready",
    request: {
      subject,
      route: routeForSubject(subject),
      frequency,
      hour: time.hour,
      minute: time.minute,
      weekday: frequency === "weekly" ? day?.expoWeekday : undefined,
      scheduledAt,
    },
  };
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function confirmationBody(request: WasilReminderRequest) {
  const time = formatTime(request.hour, request.minute);
  if (request.frequency === "daily") {
    return `Je vous rappellerai « ${request.subject} » chaque jour à ${time}. Cette action n’a utilisé aucun crédit.`;
  }
  if (request.frequency === "weekly") {
    const day = DAY_DEFINITIONS.find(
      (candidate) => candidate.expoWeekday === request.weekday,
    );
    return `Je vous rappellerai « ${request.subject} » chaque ${day?.names[0] ?? "semaine"} à ${time}. Cette action n’a utilisé aucun crédit.`;
  }
  const date = request.scheduledAt ?? new Date();
  return `Je vous rappellerai « ${request.subject} » le ${date.toLocaleDateString(
    "fr-FR",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    },
  )} à ${time}. Cette action n’a utilisé aucun crédit.`;
}

function notificationContent(
  request: WasilReminderRequest,
  mode: CenterAlertMode,
) {
  return {
    title: "Wasil · Votre rappel",
    body: request.subject,
    data: { route: request.route, source: "wasil" },
    sound: mode === "sound" ? "default" : false,
    vibrate: mode === "vibration" ? [0, 300, 180, 300] : [],
    color: "#F2B53D",
  };
}

function notificationTrigger(
  request: WasilReminderRequest,
  mode: CenterAlertMode,
): Notifications.NotificationTriggerInput {
  const channelId = `oummah-reminders-${mode}`;
  if (request.frequency === "daily") {
    return {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: request.hour,
      minute: request.minute,
      channelId,
    };
  }
  if (request.frequency === "weekly" && request.weekday) {
    return {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: request.weekday,
      hour: request.hour,
      minute: request.minute,
      channelId,
    };
  }
  return {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date:
      request.scheduledAt ??
      nextOccurrence(new Date(), request.hour, request.minute),
    channelId,
  };
}

async function scheduleNativeReminder(
  request: WasilReminderRequest,
  mode: CenterAlertMode,
) {
  return Notifications.scheduleNotificationAsync({
    content: notificationContent(request, mode),
    trigger: notificationTrigger(request, mode),
  });
}

async function loadStoredReminders() {
  return (
    (await storageService
      .get<StoredWasilReminder[]>(STORAGE_KEY)
      .catch(() => null)) ?? []
  );
}

export async function scheduleWasilReminder(
  request: WasilReminderRequest,
): Promise<WasilReply> {
  const preferences = await loadNotificationCenterPreferences();
  const allowed = await requestNotificationCenterPermission(preferences.mode);
  if (!allowed) {
    return {
      kind: "unsupported-religious",
      title: "Notifications désactivées",
      body: "Autorisez les notifications pour que Wasil puisse créer ce rappel. Aucun crédit n’a été utilisé.",
      action: { label: "Ouvrir mes notifications", route: "/notifications" },
    };
  }

  const notificationId = await scheduleNativeReminder(
    request,
    preferences.mode,
  );
  const stored = await loadStoredReminders();
  const reminder: StoredWasilReminder = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    notificationId,
    subject: request.subject,
    route: request.route,
    frequency: request.frequency,
    hour: request.hour,
    minute: request.minute,
    weekday: request.weekday,
    scheduledAt: request.scheduledAt?.toISOString(),
    createdAt: new Date().toISOString(),
  };
  await storageService.set(STORAGE_KEY, [reminder, ...stored].slice(0, 100));

  return {
    kind: "answer",
    title: "Rappel créé",
    body: confirmationBody(request),
    action:
      request.route === "/"
        ? { label: "Ouvrir mes notifications", route: "/notifications" }
        : { label: "Ouvrir le contenu", route: request.route },
  };
}

type ReminderManagementAction = "list" | "cancel" | "update";

export type WasilReminderManagementResult = {
  reply: WasilReply;
  pending?: PendingWasilReminderManagement;
};

function reminderManagementAction(
  value: string,
): ReminderManagementAction | null {
  const normalized = normalize(value);
  const mentionsReminder = normalized.includes("rappel");
  if (
    mentionsReminder &&
    ["annule", "annuler", "supprime", "supprimer", "efface", "retire"].some(
      (term) => normalized.includes(term),
    )
  ) {
    return "cancel";
  }
  if (
    mentionsReminder &&
    [
      "modifie",
      "modifier",
      "change",
      "changer",
      "decale",
      "decaler",
      "deplace",
      "deplacer",
    ].some((term) => normalized.includes(term))
  ) {
    return "update";
  }
  if (
    normalized.includes("mes rappels") ||
    (mentionsReminder &&
      ["liste", "affiche", "montre", "quels", "voir"].some((term) =>
        normalized.includes(term),
      ))
  ) {
    return "list";
  }
  return null;
}

export function isWasilReminderManagementIntent(value: string) {
  return reminderManagementAction(value) !== null;
}

export function isWasilReminderManagementFollowUp(
  value: string,
  missing: MissingReminderManagementDetail,
) {
  const normalized = normalize(value);
  if (!normalized || normalized.length > 100) return false;
  if (/^(qui|que|quoi|comment|pourquoi|est ce que)\b/.test(normalized)) {
    return false;
  }
  if (
    /^(ouvre|ouvrir|lance|ecoute|ecouter|explique|rappelle|cree|programme|affiche|montre)\b/.test(
      normalized,
    )
  ) {
    return false;
  }
  return missing === "time" ? Boolean(parseTime(value)) : true;
}

async function loadActiveReminders(now = new Date()) {
  const stored = await loadStoredReminders();
  const active = stored.filter((reminder) => {
    if (reminder.frequency !== "once") return true;
    if (!reminder.scheduledAt) return true;
    return new Date(reminder.scheduledAt).getTime() > now.getTime();
  });
  if (active.length !== stored.length) {
    await storageService.set(STORAGE_KEY, active);
  }
  return active;
}

function reminderPeriod(reminder: StoredWasilReminder) {
  if (reminder.hour < 11) return "matin";
  if (reminder.hour < 14) return "midi";
  if (reminder.hour < 18) return "apres midi";
  if (reminder.hour < 22) return "soir";
  return "nuit coucher";
}

function storedReminderDescription(reminder: StoredWasilReminder) {
  const time = formatTime(reminder.hour, reminder.minute);
  if (reminder.frequency === "daily") return `chaque jour à ${time}`;
  if (reminder.frequency === "weekly") {
    const day = DAY_DEFINITIONS.find(
      (candidate) => candidate.expoWeekday === reminder.weekday,
    );
    return `chaque ${day?.names[0] ?? "semaine"} à ${time}`;
  }
  const scheduledAt = reminder.scheduledAt
    ? new Date(reminder.scheduledAt)
    : null;
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) return `à ${time}`;
  return `${scheduledAt.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })} à ${time}`;
}

function listReply(reminders: readonly StoredWasilReminder[]): WasilReply {
  if (!reminders.length) {
    return {
      kind: "answer",
      title: "Aucun rappel Wasil",
      body: "Vous n’avez aucun rappel actif créé par Wasil. Cette consultation n’a utilisé aucun crédit.",
    };
  }
  return {
    kind: "answer",
    title: reminders.length === 1 ? "Votre rappel" : "Vos rappels",
    body: `${reminders
      .map(
        (reminder) =>
          `• ${reminder.subject} — ${storedReminderDescription(reminder)}`,
      )
      .join("\n")}\n\nCette consultation n’a utilisé aucun crédit.`,
  };
}

function cleanManagementTarget(value: string) {
  return value
    .replace(
      /\b(annule(?:r)?|supprime(?:r)?|efface(?:r)?|retire(?:r)?|modifie(?:r)?|change(?:r)?|d[ée]cale(?:r)?|d[ée]place(?:r)?|liste(?:r)?|affiche(?:r)?|montre(?:r)?|voir|quels?)\b/giu,
      " ",
    )
    .replace(/\b(tous|mes|mon|le|la|les|un|des|rappels?)\b/giu, " ")
    .replace(/(?:à|a|vers|pour)\s+\d{1,2}(?:\s*(?:h|:)\s*\d{0,2})?\b/giu, " ")
    .replace(/\b\d{1,2}\s*h\s*\d{0,2}\b/giu, " ")
    .replace(
      /\b(tous les jours|chaque jour|tous les matins|chaque matin|tous les soirs|chaque soir|chaque (?:lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche)|tous les (?:lundis|mardis|mercredis|jeudis|vendredis|samedis|dimanches))\b/giu,
      " ",
    )
    .replace(/\b(de|du|pour|celui|celle)\b/giu, " ")
    .replace(/\s+/g, " ")
    .replace(/^[,.;:\s-]+|[,.;:\s-]+$/g, "")
    .trim();
}

const TARGET_STOP_WORDS = new Set([
  "a",
  "al",
  "au",
  "aux",
  "chaque",
  "de",
  "des",
  "du",
  "la",
  "le",
  "les",
  "mon",
  "mes",
  "pour",
  "rappel",
  "rappels",
  "tous",
  "un",
  "une",
]);

function targetTokens(value: string) {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length >= 2 && !TARGET_STOP_WORDS.has(token));
}

function reminderSearchText(reminder: StoredWasilReminder) {
  const day = DAY_DEFINITIONS.find(
    (candidate) => candidate.expoWeekday === reminder.weekday,
  );
  const time = formatTime(reminder.hour, reminder.minute);
  return normalize(
    `${reminder.subject} ${time} ${reminder.hour}h${String(reminder.minute).padStart(2, "0")} ${day?.names[0] ?? ""} ${reminderPeriod(reminder)}`,
  );
}

function matchingReminders(
  reminders: readonly StoredWasilReminder[],
  target: string,
) {
  const tokens = targetTokens(target);
  if (!tokens.length) return [];
  const scored = reminders
    .map((reminder) => {
      const haystack = reminderSearchText(reminder);
      const score = tokens.reduce(
        (total, token) => total + (haystack.includes(token) ? token.length : 0),
        0,
      );
      return { reminder, score };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);
  if (!scored.length) return [];
  const bestScore = scored[0].score;
  return scored
    .filter((candidate) => candidate.score === bestScore)
    .map((candidate) => candidate.reminder);
}

function managementClarification(
  prompt: string,
  missing: MissingReminderManagementDetail,
  reminders: readonly StoredWasilReminder[],
): WasilReminderManagementResult {
  return {
    pending: { prompt, missing },
    reply: {
      kind: "unsupported-religious",
      title:
        missing === "time"
          ? "À quelle nouvelle heure ?"
          : "Quel rappel est concerné ?",
      body:
        missing === "time"
          ? "Indiquez simplement la nouvelle heure, par exemple « à 21h ». Aucun crédit ne sera utilisé."
          : `${reminders
              .map(
                (reminder) =>
                  `• ${reminder.subject} — ${storedReminderDescription(reminder)}`,
              )
              .join(
                "\n",
              )}\n\nIndiquez le rappel concerné. Aucun crédit ne sera utilisé.`,
    },
  };
}

function hasExplicitRecurrence(value: string) {
  const normalized = normalize(value);
  return (
    normalized.includes("demain") ||
    normalized.includes("tous les jours") ||
    normalized.includes("chaque jour") ||
    normalized.includes("tous les matins") ||
    normalized.includes("chaque matin") ||
    normalized.includes("tous les soirs") ||
    normalized.includes("chaque soir") ||
    DAY_DEFINITIONS.some((day) =>
      day.names.some((name) => normalized.includes(name)),
    )
  );
}

function updatedReminderRequest(
  reminder: StoredWasilReminder,
  prompt: string,
  now = new Date(),
): WasilReminderRequest | null {
  const time = parseTime(prompt);
  if (!time) return null;
  const normalized = normalize(prompt);
  const day = parseDay(prompt);
  const changesRecurrence = hasExplicitRecurrence(prompt);
  const frequency = changesRecurrence
    ? parseFrequency(prompt)
    : reminder.frequency;
  let scheduledAt: Date | undefined;
  let weekday = frequency === "weekly" ? day?.expoWeekday : undefined;

  if (frequency === "weekly" && !weekday) weekday = reminder.weekday;
  if (frequency === "once") {
    if (changesRecurrence) {
      scheduledAt = nextOccurrence(
        now,
        time.hour,
        time.minute,
        normalized.includes("demain") ? (now.getDay() + 1) % 7 : day?.jsDay,
      );
    } else {
      const existing = reminder.scheduledAt
        ? new Date(reminder.scheduledAt)
        : new Date(now);
      existing.setHours(time.hour, time.minute, 0, 0);
      if (existing.getTime() <= now.getTime()) {
        existing.setDate(existing.getDate() + 1);
      }
      scheduledAt = existing;
    }
  }

  return {
    subject: reminder.subject,
    route: reminder.route,
    frequency,
    hour: time.hour,
    minute: time.minute,
    weekday,
    scheduledAt,
  };
}

export async function manageWasilReminders(
  prompt: string,
): Promise<WasilReminderManagementResult> {
  const action = reminderManagementAction(prompt);
  const reminders = await loadActiveReminders();
  if (action === "list") return { reply: listReply(reminders) };
  if (!action) {
    return {
      reply: {
        kind: "unsupported-religious",
        title: "Commande de rappel non reconnue",
        body: "Précisez si vous souhaitez afficher, modifier ou annuler un rappel. Aucun crédit n’a été utilisé.",
      },
    };
  }
  if (!reminders.length) return { reply: listReply(reminders) };

  const normalized = normalize(prompt);
  if (
    action === "cancel" &&
    (normalized.includes("tous mes rappels") ||
      normalized.includes("tous les rappels"))
  ) {
    await Promise.all(
      reminders.map((reminder) =>
        Notifications.cancelScheduledNotificationAsync(
          reminder.notificationId,
        ).catch(() => undefined),
      ),
    );
    await storageService.set(STORAGE_KEY, []);
    return {
      reply: {
        kind: "answer",
        title: "Rappels annulés",
        body: `${reminders.length} rappel${reminders.length > 1 ? "s ont" : " a"} été annulé${reminders.length > 1 ? "s" : ""}. Aucun crédit n’a été utilisé.`,
      },
    };
  }

  const target = cleanManagementTarget(prompt);
  let matches = matchingReminders(reminders, target);
  if (!target && reminders.length === 1) matches = [reminders[0]];

  if (action === "cancel" && !target) {
    const time = parseTime(prompt);
    if (time) {
      matches = reminders.filter(
        (reminder) =>
          reminder.hour === time.hour && reminder.minute === time.minute,
      );
    }
  }

  if (matches.length !== 1) {
    return managementClarification(prompt, "target", reminders);
  }
  const selected = matches[0];

  if (action === "cancel") {
    await Notifications.cancelScheduledNotificationAsync(
      selected.notificationId,
    ).catch(() => undefined);
    await storageService.set(
      STORAGE_KEY,
      reminders.filter((reminder) => reminder.id !== selected.id),
    );
    return {
      reply: {
        kind: "answer",
        title: "Rappel annulé",
        body: `Le rappel « ${selected.subject} » a été annulé. Aucun crédit n’a été utilisé.`,
      },
    };
  }

  const request = updatedReminderRequest(selected, prompt);
  if (!request) return managementClarification(prompt, "time", reminders);

  const preferences = await loadNotificationCenterPreferences();
  const allowed = await requestNotificationCenterPermission(preferences.mode);
  if (!allowed) {
    return {
      reply: {
        kind: "unsupported-religious",
        title: "Notifications désactivées",
        body: "Autorisez les notifications pour modifier ce rappel. Le rappel actuel est conservé et aucun crédit n’a été utilisé.",
        action: { label: "Ouvrir mes notifications", route: "/notifications" },
      },
    };
  }

  const notificationId = await scheduleNativeReminder(
    request,
    preferences.mode,
  );
  await Notifications.cancelScheduledNotificationAsync(
    selected.notificationId,
  ).catch(() => undefined);
  const updated: StoredWasilReminder = {
    ...selected,
    notificationId,
    frequency: request.frequency,
    hour: request.hour,
    minute: request.minute,
    weekday: request.weekday,
    scheduledAt: request.scheduledAt?.toISOString(),
  };
  await storageService.set(
    STORAGE_KEY,
    reminders.map((reminder) =>
      reminder.id === selected.id ? updated : reminder,
    ),
  );

  return {
    reply: {
      kind: "answer",
      title: "Rappel modifié",
      body: `Le rappel « ${selected.subject} » est maintenant prévu ${storedReminderDescription(updated)}. Aucun crédit n’a été utilisé.`,
      action:
        selected.route === "/"
          ? undefined
          : { label: "Ouvrir le contenu", route: selected.route },
    },
  };
}
