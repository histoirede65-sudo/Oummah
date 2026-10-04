import * as Notifications from "expo-notifications";

import { storageService } from "../../core/storage/StorageService";
import {
  loadNotificationCenterPreferences,
  requestNotificationCenterPermission,
  type CenterAlertMode,
} from "../notifications/NotificationCenter";
import { alertSound, ensureReminderChannel, reminderChannelId, VIBRATION_PATTERN } from "../notifications/notificationChannels";
import { resolveWasilFreeAction } from "./WasilActionRouter";
import type { WasilReply } from "./WasilLocalResponder";
import { getActiveLanguage, translate } from "../../i18n";

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

const REMINDER_TIME_OR_DELIVERY = /\b(?:demain|aujourd hui|ce soir|ce matin|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|a\s+\d{1,2}|\d{1,2}\s*h|notification|notifie|previens|programme|planifie)\b/u;
const RELIGIOUS_CONTEXT = /\b(?:priere|salat|rakah|rakat|ablution|wudu|woudou|tayammum|hadith|coran|sourate|verset|ramadan|jeune|aube|qibla|repentir|istikhara)\b/u;

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
  const explicitPhrase = REMINDER_INTENTS.some((intent) => normalized.includes(intent));
  if (!explicitPhrase) return false;
  // "Rappelle-moi ce hadith" is conversational unless delivery/scheduling is
  // explicitly requested. A reminder intent needs a temporal or notification
  // commitment, not only the verb "rappelle".
  return REMINDER_TIME_OR_DELIVERY.test(normalized);
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
      title: missing === "time" ? translate("wasil.rem.whenTitle") : translate("wasil.rem.whatTitle"),
      body:
        missing === "time"
          ? translate("wasil.rem.whenBody")
          : translate("wasil.rem.whatBody"),
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
    !RELIGIOUS_CONTEXT.test(normalized) &&
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

function dateLocale() {
  return getActiveLanguage() === "en" ? "en-GB" : "fr-FR";
}

/** Weekday name in the app language (DAY_DEFINITIONS names are French input terms). */
function weekdayLabel(jsDay: number | undefined) {
  if (jsDay === undefined) return translate("wasil.rem.week");
  // 4 January 2026 is a Sunday.
  return new Date(2026, 0, 4 + jsDay).toLocaleDateString(dateLocale(), { weekday: "long" });
}

function formatTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function confirmationBody(request: WasilReminderRequest) {
  const time = formatTime(request.hour, request.minute);
  if (request.frequency === "daily") {
    return translate("wasil.rem.confirmDaily", { subject: request.subject, time });
  }
  if (request.frequency === "weekly") {
    const day = DAY_DEFINITIONS.find(
      (candidate) => candidate.expoWeekday === request.weekday,
    );
    return translate("wasil.rem.confirmWeekly", { subject: request.subject, day: weekdayLabel(day?.jsDay), time });
  }
  const date = request.scheduledAt ?? new Date();
  return translate("wasil.rem.confirmOnce", {
    subject: request.subject,
    date: date.toLocaleDateString(dateLocale(), {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    time,
  });
}

function notificationContent(
  request: WasilReminderRequest,
  mode: CenterAlertMode,
) {
  return {
    title: translate("wasil.rem.notificationTitle"),
    body: request.subject,
    data: { route: request.route, source: "wasil", notificationMode: mode, notificationChannel: reminderChannelId(mode) },
    sound: alertSound(mode),
    vibrate: mode === "silent" ? [] : VIBRATION_PATTERN,
    color: "#F2B53D",
  };
}

function notificationTrigger(
  request: WasilReminderRequest,
  mode: CenterAlertMode,
): Notifications.NotificationTriggerInput {
  const channelId = reminderChannelId(mode);
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

/**
 * Re-creates the reminders scheduled with another alert mode or on an old channel (the -v3
 * channels rang even in vibration / silent mode). Called at launch and when the mode changes.
 */
export async function resyncWasilReminders(mode?: CenterAlertMode) {
  const stored = await loadActiveReminders();
  if (!stored.length) return;
  const nextMode = mode ?? (await loadNotificationCenterPreferences()).mode;
  const expectedChannel = reminderChannelId(nextMode);
  const scheduled = new Map(
    (await Notifications.getAllScheduledNotificationsAsync().catch(() => []))
      .map((item) => [item.identifier, item] as const),
  );
  let changed = false;
  const updated: StoredWasilReminder[] = [];
  for (const reminder of stored) {
    const current = scheduled.get(reminder.notificationId);
    const data = current?.content.data as Record<string, unknown> | undefined;
    if (!current || (data?.notificationMode === nextMode && data?.notificationChannel === expectedChannel)) {
      updated.push(reminder);
      continue;
    }
    await ensureReminderChannel(nextMode);
    const notificationId = await scheduleNativeReminder({
      subject: reminder.subject,
      route: reminder.route,
      frequency: reminder.frequency,
      hour: reminder.hour,
      minute: reminder.minute,
      weekday: reminder.weekday,
      scheduledAt: reminder.scheduledAt ? new Date(reminder.scheduledAt) : undefined,
    }, nextMode).catch(() => null);
    if (!notificationId) {
      updated.push(reminder);
      continue;
    }
    await Notifications.cancelScheduledNotificationAsync(reminder.notificationId).catch(() => undefined);
    updated.push({ ...reminder, notificationId });
    changed = true;
  }
  if (changed) await storageService.set(STORAGE_KEY, updated);
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
      title: translate("wasil.rem.notificationsOffTitle"),
      body: translate("wasil.rem.notificationsOffCreate"),
      action: { label: translate("wasil.rem.openNotifications"), route: "/notifications" },
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
    title: translate("wasil.rem.createdTitle"),
    body: confirmationBody(request),
    action:
      request.route === "/"
        ? { label: translate("wasil.rem.openNotifications"), route: "/notifications" }
        : { label: translate("wasil.rem.openContent"), route: request.route },
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
  const mentionsReminder = /\b(?:rappel|rappels)\b/u.test(normalized);
  if (!mentionsReminder) return null;
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
  const normalized = normalize(value);
  return reminderManagementAction(value) !== null &&
    /\b(?:mon|mes|un|le|les|ce|ceux|rappel|rappels)\b/u.test(normalized);
}

export function isWasilReminderManagementFollowUp(
  value: string,
  missing: MissingReminderManagementDetail,
) {
  const normalized = normalize(value);
  if (!normalized || normalized.length > 100) return false;
  if (RELIGIOUS_CONTEXT.test(normalized)) return false;
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
  if (reminder.frequency === "daily") return translate("wasil.rem.descDaily", { time });
  if (reminder.frequency === "weekly") {
    const day = DAY_DEFINITIONS.find(
      (candidate) => candidate.expoWeekday === reminder.weekday,
    );
    return translate("wasil.rem.descWeekly", { day: weekdayLabel(day?.jsDay), time });
  }
  const scheduledAt = reminder.scheduledAt
    ? new Date(reminder.scheduledAt)
    : null;
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) return translate("wasil.rem.descAt", { time });
  return translate("wasil.rem.descOn", {
    date: scheduledAt.toLocaleDateString(dateLocale(), {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    time,
  });
}

function listReply(reminders: readonly StoredWasilReminder[]): WasilReply {
  if (!reminders.length) {
    return {
      kind: "answer",
      title: translate("wasil.rem.noneTitle"),
      body: translate("wasil.rem.noneBody"),
    };
  }
  return {
    kind: "answer",
    title: reminders.length === 1 ? translate("wasil.rem.listOne") : translate("wasil.rem.listMany"),
    body: `${reminders
      .map(
        (reminder) =>
          `• ${reminder.subject} — ${storedReminderDescription(reminder)}`,
      )
      .join("\n")}\n\n${translate("wasil.rem.listFooter")}`,
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
          ? translate("wasil.rem.newTimeTitle")
          : translate("wasil.rem.whichTitle"),
      body:
        missing === "time"
          ? translate("wasil.rem.newTimeBody")
          : `${reminders
              .map(
                (reminder) =>
                  `• ${reminder.subject} — ${storedReminderDescription(reminder)}`,
              )
              .join(
                "\n",
              )}\n\n${translate("wasil.rem.whichFooter")}`,
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
  let weekday: number | undefined = frequency === "weekly" ? day?.expoWeekday : undefined;

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
        title: translate("wasil.rem.unknownTitle"),
        body: translate("wasil.rem.unknownBody"),
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
        title: translate("wasil.rem.cancelledAllTitle"),
        body: reminders.length > 1
          ? translate("wasil.rem.cancelledAllMany", { count: reminders.length })
          : translate("wasil.rem.cancelledAllOne"),
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
        title: translate("wasil.rem.cancelledTitle"),
        body: translate("wasil.rem.cancelledBody", { subject: selected.subject }),
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
        title: translate("wasil.rem.notificationsOffTitle"),
        body: translate("wasil.rem.notificationsOffUpdate"),
        action: { label: translate("wasil.rem.openNotifications"), route: "/notifications" },
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
      title: translate("wasil.rem.updatedTitle"),
      body: translate("wasil.rem.updatedBody", {
        subject: selected.subject,
        description: storedReminderDescription(updated),
      }),
      action:
        selected.route === "/"
          ? undefined
          : { label: translate("wasil.rem.openContent"), route: selected.route },
    },
  };
}
