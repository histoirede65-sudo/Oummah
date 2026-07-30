import { storageService } from "../../core/storage/StorageService";
import type { WasilReply } from "./WasilLocalResponder";

const STORAGE_KEY = "oummah.wasil.conversation_threads.v2";
const LEGACY_STORAGE_KEY = "oummah.wasil.conversations.v1";
const MAX_CONVERSATIONS = 30;
const MAX_MESSAGES_PER_CONVERSATION = 80;

export type WasilConversationMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  reply?: WasilReply;
  createdAt: number;
};

export type WasilConversationThread = {
  id: string;
  title: string;
  messages: WasilConversationMessage[];
  createdAt: number;
  updatedAt: number;
};

type LegacyWasilConversation = {
  id: string;
  question: string;
  reply: WasilReply;
  createdAt: number;
};

function identifier() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function cleanTitle(question: string) {
  const title = question.replace(/\s+/g, " ").trim();
  return title.length > 72 ? `${title.slice(0, 69)}…` : title;
}

function assistantText(reply: WasilReply) {
  return [reply.title, reply.body].filter(Boolean).join("\n\n");
}

function isThread(value: unknown): value is WasilConversationThread {
  if (!value || typeof value !== "object") return false;
  const thread = value as Partial<WasilConversationThread>;
  return (
    typeof thread.id === "string" &&
    typeof thread.title === "string" &&
    typeof thread.createdAt === "number" &&
    typeof thread.updatedAt === "number" &&
    Array.isArray(thread.messages)
  );
}

function isLegacyConversation(
  value: unknown,
): value is LegacyWasilConversation {
  if (!value || typeof value !== "object") return false;
  const conversation = value as Partial<LegacyWasilConversation>;
  return (
    typeof conversation.id === "string" &&
    typeof conversation.question === "string" &&
    typeof conversation.createdAt === "number" &&
    Boolean(conversation.reply)
  );
}

function migrateConversation(
  conversation: LegacyWasilConversation,
): WasilConversationThread {
  return {
    id: conversation.id,
    title: cleanTitle(conversation.question),
    createdAt: conversation.createdAt,
    updatedAt: conversation.createdAt,
    messages: [
      {
        id: `${conversation.id}-user`,
        role: "user",
        text: conversation.question,
        createdAt: conversation.createdAt,
      },
      {
        id: `${conversation.id}-assistant`,
        role: "assistant",
        text: assistantText(conversation.reply),
        reply: conversation.reply,
        createdAt: conversation.createdAt + 1,
      },
    ],
  };
}

export function createWasilConversationId() {
  return identifier();
}

export function appendWasilConversationTurn(
  conversations: readonly WasilConversationThread[],
  conversationId: string,
  question: string,
  reply: WasilReply,
  createdAt = Date.now(),
) {
  const current = conversations.find(
    (conversation) => conversation.id === conversationId,
  );
  const userMessage: WasilConversationMessage = {
    id: identifier(),
    role: "user",
    text: question,
    createdAt,
  };
  const assistantMessage: WasilConversationMessage = {
    id: identifier(),
    role: "assistant",
    text: assistantText(reply),
    reply,
    createdAt: createdAt + 1,
  };
  const conversation: WasilConversationThread = current
    ? {
        ...current,
        messages: [...current.messages, userMessage, assistantMessage].slice(
          -MAX_MESSAGES_PER_CONVERSATION,
        ),
        updatedAt: createdAt,
      }
    : {
        id: conversationId,
        title: cleanTitle(question),
        messages: [userMessage, assistantMessage],
        createdAt,
        updatedAt: createdAt,
      };
  const next = [
    conversation,
    ...conversations.filter((item) => item.id !== conversationId),
  ].slice(0, MAX_CONVERSATIONS);
  return { conversations: next, conversation };
}

export function mergeWasilConversations(
  local: readonly WasilConversationThread[],
  remote: readonly WasilConversationThread[],
) {
  const byId = new Map<string, WasilConversationThread>();
  for (const conversation of [...local, ...remote]) {
    const current = byId.get(conversation.id);
    if (!current) {
      byId.set(conversation.id, conversation);
      continue;
    }
    const messages = [...current.messages, ...conversation.messages]
      .reduce<WasilConversationMessage[]>((all, message) =>
        all.some((item) => item.id === message.id) ? all : [...all, message],
      )
      .sort((left, right) => left.createdAt - right.createdAt)
      .slice(-MAX_MESSAGES_PER_CONVERSATION);
    const newest = conversation.updatedAt >= current.updatedAt ? conversation : current;
    byId.set(conversation.id, {
      ...newest,
      createdAt: Math.min(current.createdAt, conversation.createdAt),
      updatedAt: Math.max(current.updatedAt, conversation.updatedAt),
      messages,
    });
  }
  return [...byId.values()]
    .sort((left, right) => right.updatedAt - left.updatedAt)
    .slice(0, MAX_CONVERSATIONS);
}

export async function loadWasilConversations() {
  const stored = await storageService
    .get<unknown[]>(STORAGE_KEY)
    .catch(() => null);
  if (Array.isArray(stored)) return stored.filter(isThread);

  const legacy = await storageService
    .get<unknown[]>(LEGACY_STORAGE_KEY)
    .catch(() => null);
  if (!Array.isArray(legacy)) return [];

  const migrated = legacy
    .filter(isLegacyConversation)
    .map(migrateConversation)
    .slice(0, MAX_CONVERSATIONS);
  await storageService.set(STORAGE_KEY, migrated).catch(() => undefined);
  return migrated;
}

export async function saveWasilConversations(
  conversations: readonly WasilConversationThread[],
) {
  const next = conversations.slice(0, MAX_CONVERSATIONS);
  await storageService.set(STORAGE_KEY, next);
  return next;
}
