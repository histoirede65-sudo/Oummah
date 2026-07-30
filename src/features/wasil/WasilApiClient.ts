import { getValidSession } from "../auth/SupabaseAuthService";
import type { WasilReply } from "./WasilLocalResponder";
import type { WasilConversationThread } from "./WasilConversationStore";

export class WasilApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly balance?: number,
  ) {
    super(message);
  }
}

type WasilResponse = {
  reply: WasilReply;
  balance: number;
  creditsCharged: number;
  classification?:
    | "answered"
    | "clarification"
    | "out_of_scope"
    | "insufficient_sources"
    | "urgent_support";
};

export type WasilProfileMemoryKey =
  | "preferred_reciter"
  | "preferred_translation"
  | "preferred_tafsir"
  | "preferred_study_time"
  | "daily_time_minutes"
  | "learning_goal"
  | "answer_depth"
  | "preferred_language";

export type WasilProfileMemory = {
  memory_key: WasilProfileMemoryKey;
  memory_value: string;
  display_label: string;
  updated_at?: string;
};

export type WasilConversationContextMessage = {
  role: "user" | "assistant";
  content: string;
};

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();
  if (!url || !key)
    throw new WasilApiError(
      "NOT_CONFIGURED",
      "Wasil n’est pas encore configuré.",
    );
  return { url, key };
}

function requestId() {
  const random = () =>
    Math.floor(Math.random() * 0x10000)
      .toString(16)
      .padStart(4, "0");
  return `${random()}${random()}-${random()}-4${random().slice(1)}-a${random().slice(1)}-${random()}${random()}${random()}`;
}

async function invoke(body: Record<string, unknown>) {
  let session = await getValidSession();
  if (!session)
    throw new WasilApiError(
      "AUTH_REQUIRED",
      "Connectez votre profil pour interroger Wasil.",
    );
  const { url, key } = configuration();
  const send = (accessToken: string) =>
    fetch(`${url}/functions/v1/wasil`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

  let response = await send(session.accessToken);
  if (response.status === 401) {
    session = await getValidSession(true);
    if (!session) {
      throw new WasilApiError(
        "AUTH_REQUIRED",
        "Votre session a expiré. Reconnectez votre profil.",
      );
    }
    response = await send(session.accessToken);
  }

  const payload = (await response.json()) as {
    code?: string;
    message?: string;
    balance?: number;
  } & Partial<WasilResponse>;
  if (!response.ok) {
    throw new WasilApiError(
      payload.code ?? "NETWORK_ERROR",
      payload.message ?? "Wasil est momentanément indisponible.",
      payload.balance,
    );
  }
  return payload;
}

export async function getWasilBalance() {
  const payload = await invoke({ operation: "balance" });
  return payload.balance ?? 0;
}

export async function listWasilProfileMemories() {
  const payload = (await invoke({ operation: "memory_list" })) as Partial<
    WasilResponse & { memories: WasilProfileMemory[] }
  >;
  return Array.isArray(payload.memories) ? payload.memories : [];
}

export async function setWasilProfileMemory(
  memoryKey: WasilProfileMemoryKey,
  memoryValue: string,
  memoryLabel: string,
) {
  await invoke({
    operation: "memory_set",
    memoryKey,
    memoryValue,
    memoryLabel,
  });
}

export async function deleteWasilProfileMemory(
  memoryKey: WasilProfileMemoryKey,
) {
  const payload = (await invoke({
    operation: "memory_delete",
    memoryKey,
  })) as Partial<WasilResponse & { deleted: boolean }>;
  return payload.deleted === true;
}

export async function clearWasilProfileMemories() {
  const payload = (await invoke({
    operation: "memory_clear",
  })) as Partial<WasilResponse & { deletedCount: number }>;
  return Number(payload.deletedCount ?? 0);
}

export async function syncWasilConversations(
  conversations: readonly WasilConversationThread[],
) {
  const payload = (await invoke({
    operation: "conversation_sync",
    conversations,
  })) as Partial<WasilResponse & { conversations: WasilConversationThread[] }>;
  return Array.isArray(payload.conversations) ? payload.conversations : [];
}

export async function deleteWasilConversation(conversationId: string) {
  const normalizedConversationId = conversationId.trim();
  if (!normalizedConversationId) {
    throw new WasilApiError(
      "INVALID_CONVERSATION_ID",
      "La conversation Ã  supprimer nâ€™est pas valide.",
    );
  }

  let session = await getValidSession();
  if (!session) {
    throw new WasilApiError(
      "AUTH_REQUIRED",
      "Connectez votre profil pour supprimer cette conversation.",
    );
  }
  const { url, key } = configuration();
  const send = (accessToken: string, userId: string) =>
    fetch(
      `${url}/rest/v1/wasil_conversations?user_id=eq.${encodeURIComponent(userId)}&conversation_id=eq.${encodeURIComponent(normalizedConversationId)}`,
      {
        method: "DELETE",
        headers: {
          apikey: key,
          Authorization: `Bearer ${accessToken}`,
          Prefer: "return=minimal",
        },
      },
    );

  let response = await send(session.accessToken, session.user.id);
  if (response.status === 401) {
    session = await getValidSession(true);
    if (!session) {
      throw new WasilApiError(
        "AUTH_REQUIRED",
        "Votre session a expirÃ©. Reconnectez votre profil.",
      );
    }
    response = await send(session.accessToken, session.user.id);
  }

  if (!response.ok) {
    throw new WasilApiError(
      "CONVERSATION_DELETE_FAILED",
      "La conversation nâ€™a pas pu Ãªtre supprimÃ©e.",
    );
  }
}

export async function askWasil(
  question: string,
  localContext: WasilReply,
  mode: "standard" | "deep" = "standard",
  clarificationOf?: string,
  conversationHistory: readonly WasilConversationContextMessage[] = [],
) {
  const recentConversation = conversationHistory
    .filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        message.content.trim(),
    )
    .slice(-12)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 1200),
    }));
  const payload = await invoke({
    operation: "ask",
    requestId: requestId(),
    question,
    mode,
    clarificationOf,
    conversationHistory: recentConversation,
    localContext: {
      kind: localContext.kind,
      sourceId: localContext.sourceId,
      action: localContext.action,
    },
  });
  if (!payload.reply)
    throw new WasilApiError("INVALID_RESPONSE", "Réponse Wasil invalide.");
  return payload as WasilResponse;
}
