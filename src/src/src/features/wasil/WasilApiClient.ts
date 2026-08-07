import { getValidSession } from "../auth/SupabaseAuthService";
import type { WasilReply } from "./WasilLocalResponder";
import type { WasilConversationThread } from "./WasilConversationStore";
import { trackAnalyticsEvent } from "../analytics/AnalyticsService";

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
  const clientStartedAt = Date.now();
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

  void trackAnalyticsEvent({
    eventName: "wasil_question",
    module: "wasil",
    route: "/dalil",
    metadata: {
      mode,
      creditsCharged: Number(payload.creditsCharged ?? 0),
      classification: payload.classification ?? null,
      clientLatencyMs: Math.max(0, Date.now() - clientStartedAt),
    },
  });

  return payload as WasilResponse;
}

export type WasilStreamCallbacks = {
  onTextDelta?: (delta: string) => void;
  onReady?: () => void;
};

type WasilSseEnvelope = {
  status?: number;
  payload?: ({
    code?: string;
    message?: string;
    balance?: number;
  } & Partial<WasilResponse>);
};

function parseSseBlocks(
  text: string,
  startOffset: number,
  onEvent: (event: string, data: unknown) => void,
) {
  let cursor = startOffset;
  while (cursor < text.length) {
    const match = /\r?\n\r?\n/g.exec(text.slice(cursor));
    if (!match) break;
    const end = cursor + match.index;
    const block = text.slice(cursor, end);
    cursor = end + match[0].length;
    let event = "message";
    const dataLines: string[] = [];
    for (const line of block.split(/\r?\n/)) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (!dataLines.length) continue;
    const raw = dataLines.join("\n");
    try {
      onEvent(event, JSON.parse(raw));
    } catch {
      onEvent(event, raw);
    }
  }
  return cursor;
}

export async function askWasilStream(
  question: string,
  localContext: WasilReply,
  mode: "standard" | "deep" = "standard",
  clarificationOf?: string,
  conversationHistory: readonly WasilConversationContextMessage[] = [],
  callbacks: WasilStreamCallbacks = {},
): Promise<WasilResponse> {
  const clientStartedAt = Date.now();
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
  const requestBody = {
    operation: "ask_stream",
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
  };

  const run = async (forceRefresh = false): Promise<WasilResponse> => {
    const session = await getValidSession(forceRefresh);
    if (!session) {
      throw new WasilApiError(
        "AUTH_REQUIRED",
        "Connectez votre profil pour interroger Wasil.",
      );
    }
    const { url, key } = configuration();
    return await new Promise<WasilResponse>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      let parsedOffset = 0;
      let settled = false;
      let completedPayload: WasilResponse | null = null;

      const consume = () => {
        const available = xhr.responseText ?? "";
        parsedOffset = parseSseBlocks(
          available,
          parsedOffset,
          (event, value) => {
            if (event === "ready") callbacks.onReady?.();
            if (event === "delta") {
              const delta =
                value && typeof value === "object" && "text" in value
                  ? String((value as { text?: unknown }).text ?? "")
                  : "";
              if (delta) callbacks.onTextDelta?.(delta);
              return;
            }
            if (event !== "complete" && event !== "error") return;
            const envelope = value as WasilSseEnvelope;
            const payload = envelope?.payload ?? {};
            if (event === "error" || Number(envelope?.status ?? 500) >= 400) {
              settled = true;
              reject(
                new WasilApiError(
                  payload.code ?? "NETWORK_ERROR",
                  payload.message ?? "Wasil est momentanément indisponible.",
                  payload.balance,
                ),
              );
              return;
            }
            if (!payload.reply) {
              settled = true;
              reject(
                new WasilApiError(
                  "INVALID_RESPONSE",
                  "Réponse Wasil invalide.",
                ),
              );
              return;
            }
            completedPayload = payload as WasilResponse;
          },
        );
      };

      xhr.open("POST", `${url}/functions/v1/wasil`, true);
      xhr.setRequestHeader("apikey", key);
      xhr.setRequestHeader("Authorization", `Bearer ${session.accessToken}`);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.setRequestHeader("Accept", "text/event-stream");
      xhr.onprogress = consume;
      xhr.onerror = () => {
        if (!settled) {
          settled = true;
          reject(
            new WasilApiError(
              "NETWORK_ERROR",
              "Wasil est momentanément indisponible.",
            ),
          );
        }
      };
      xhr.onload = () => {
        consume();
        if (settled) return;
        if (xhr.status === 401 && !forceRefresh) {
          settled = true;
          void run(true).then(resolve, reject);
          return;
        }
        if (completedPayload) {
          settled = true;
          resolve(completedPayload);
          return;
        }
        settled = true;
        reject(
          new WasilApiError(
            "INVALID_STREAM",
            "Le flux de réponse Wasil s’est interrompu.",
          ),
        );
      };
      xhr.send(JSON.stringify(requestBody));
    });
  };

  const payload = await run();
  void trackAnalyticsEvent({
    eventName: "wasil_question",
    module: "wasil",
    route: "/dalil",
    metadata: {
      mode,
      streaming: true,
      creditsCharged: Number(payload.creditsCharged ?? 0),
      classification: payload.classification ?? null,
      clientLatencyMs: Math.max(0, Date.now() - clientStartedAt),
    },
  });
  return payload;
}
