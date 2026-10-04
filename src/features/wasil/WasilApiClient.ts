import * as Application from "expo-application";
import { fetch as streamingFetch } from "expo/fetch";
import { Platform } from "react-native";
import { getValidSession } from "../auth/SupabaseAuthService";
import { storageService } from "../../core/storage/StorageService";
import type { WasilReply } from "./WasilLocalResponder";
import type { WasilConversationThread } from "./WasilConversationStore";
import { trackAnalyticsEvent } from "../analytics/AnalyticsService";
import { translate } from "../../i18n";

const WELCOME_CREDIT_CLAIM_KEY = "oummah:wasil:welcome-credit-claimed:v1";

async function installationDeviceId() {
  if (Platform.OS === "android") {
    const androidId = Application.getAndroidId();
    return androidId ? `android:${androidId}` : null;
  }
  if (Platform.OS === "ios") {
    const iosId = await Application.getIosIdForVendorAsync().catch(() => null);
    return iosId ? `ios:${iosId}` : null;
  }
  return null;
}

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

export type WasilLocationContext = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  mosques?: Array<{
    name: string;
    address: string;
    distanceMeters: number;
    distanceLabel: string;
    walkingTimeLabel: string;
    latitude: number;
    longitude: number;
  }>;
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
      translate("wasil.err.notConfigured"),
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
      translate("wasil.err.connectToAsk"),
    );
  const { url, key } = configuration();
  const deviceId = await installationDeviceId();
  const welcomeCreditClaimed = await storageService
    .get<boolean>(WELCOME_CREDIT_CLAIM_KEY)
    .catch(() => true);
  const requestBody = {
    ...body,
    installationDeviceId: deviceId,
    welcomeCreditsEligible: welcomeCreditClaimed !== true,
  };
  if (welcomeCreditClaimed !== true) {
    await storageService.set(WELCOME_CREDIT_CLAIM_KEY, true).catch(() => undefined);
  }
  const send = (accessToken: string) =>
    fetch(`${url}/functions/v1/wasil`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

  let response = await send(session.accessToken);
  if (response.status === 401) {
    session = await getValidSession(true);
    if (!session) {
      throw new WasilApiError(
        "AUTH_REQUIRED",
        translate("wasil.err.sessionExpired"),
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
      payload.message ?? translate("wasil.err.unavailable"),
      payload.balance,
    );
  }
  return payload;
}

export type WasilStreamHandlers = {
  /** New characters of the answer while Wasil writes it. */
  onDelta?: (text: string) => void;
  /** The text received so far must be discarded. */
  onReset?: () => void;
  /** A server stage, e.g. "web_search". */
  onStage?: (name: string) => void;
};

/**
 * Same request as invoke(), answered as server-sent events: the answer text
 * arrives while it is written, then a "final" event carries the usual payload.
 */
async function invokeStream(
  body: Record<string, unknown>,
  handlers: WasilStreamHandlers,
) {
  let session = await getValidSession();
  if (!session)
    throw new WasilApiError(
      "AUTH_REQUIRED",
      translate("wasil.err.connectToAsk"),
    );
  const { url, key } = configuration();
  const deviceId = await installationDeviceId();
  const welcomeCreditClaimed = await storageService
    .get<boolean>(WELCOME_CREDIT_CLAIM_KEY)
    .catch(() => true);
  const requestBody = {
    ...body,
    stream: true,
    installationDeviceId: deviceId,
    welcomeCreditsEligible: welcomeCreditClaimed !== true,
  };
  if (welcomeCreditClaimed !== true) {
    await storageService.set(WELCOME_CREDIT_CLAIM_KEY, true).catch(() => undefined);
  }

  const send = async (accessToken: string) => {
    const response = await streamingFetch(`${url}/functions/v1/wasil`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(requestBody),
    });
    // Errors raised before the stream starts (gateway, JWT) stay plain JSON.
    if (!response.headers.get("content-type")?.includes("text/event-stream")) {
      const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
      return { status: response.status, payload };
    }
    if (!response.body) throw new WasilApiError("NETWORK_ERROR", translate("wasil.err.unavailable"));

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let final: { status: number; payload: Record<string, unknown> } | null = null;
    const handleBlock = (block: string) => {
      const event = /^event: (.*)$/m.exec(block)?.[1];
      const data = /^data: (.*)$/m.exec(block)?.[1];
      if (!event || !data) return;
      const parsed = JSON.parse(data) as Record<string, unknown>;
      if (event === "delta" && typeof parsed.text === "string") handlers.onDelta?.(parsed.text);
      else if (event === "reset") handlers.onReset?.();
      else if (event === "stage" && typeof parsed.name === "string") handlers.onStage?.(parsed.name);
      else if (event === "final") {
        final = {
          status: Number(parsed.status ?? 500),
          payload: (parsed.payload ?? {}) as Record<string, unknown>,
        };
      }
    };
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
      let separator = buffer.indexOf("\n\n");
      while (separator !== -1) {
        handleBlock(buffer.slice(0, separator));
        buffer = buffer.slice(separator + 2);
        separator = buffer.indexOf("\n\n");
      }
    }
    if (buffer.trim()) handleBlock(buffer);
    if (!final) throw new WasilApiError("NETWORK_ERROR", translate("wasil.err.unavailable"));
    return final as { status: number; payload: Record<string, unknown> };
  };

  let result = await send(session.accessToken);
  if (result.status === 401) {
    session = await getValidSession(true);
    if (!session) {
      throw new WasilApiError(
        "AUTH_REQUIRED",
        translate("wasil.err.sessionExpired"),
      );
    }
    handlers.onReset?.();
    result = await send(session.accessToken);
  }

  const payload = result.payload as {
    code?: string;
    message?: string;
    balance?: number;
  } & Partial<WasilResponse>;
  if (result.status < 200 || result.status >= 300) {
    throw new WasilApiError(
      payload.code ?? "NETWORK_ERROR",
      payload.message ?? translate("wasil.err.unavailable"),
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
      translate("wasil.err.invalidConversation"),
    );
  }

  let session = await getValidSession();
  if (!session) {
    throw new WasilApiError(
      "AUTH_REQUIRED",
      translate("wasil.err.connectToDelete"),
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
        translate("wasil.err.sessionExpired"),
      );
    }
    response = await send(session.accessToken, session.user.id);
  }

  if (!response.ok) {
    throw new WasilApiError(
      "CONVERSATION_DELETE_FAILED",
      translate("wasil.err.deleteFailed"),
    );
  }
}

export async function askWasil(
  question: string,
  localContext: WasilReply,
  mode: "standard" | "deep" = "standard",
  clarificationOf?: string,
  conversationHistory: readonly WasilConversationContextMessage[] = [],
  locationContext?: WasilLocationContext,
  streamHandlers?: WasilStreamHandlers,
  language?: string,
) {
  const clientStartedAt = Date.now();
  let firstTextAt: number | null = null;
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
  const body = {
    operation: "ask",
    requestId: requestId(),
    question,
    language,
    mode,
    clarificationOf,
    conversationHistory: recentConversation,
    localContext: {
      kind: localContext.kind,
      sourceId: localContext.sourceId,
      action: localContext.action,
    },
    locationContext,
  };
  const payload = streamHandlers
    ? await invokeStream(body, {
        ...streamHandlers,
        onDelta: (text) => {
          firstTextAt ??= Date.now();
          streamHandlers.onDelta?.(text);
        },
      })
    : await invoke(body);
  if (!payload.reply)
    throw new WasilApiError("INVALID_RESPONSE", translate("wasil.err.invalidResponse"));

  void trackAnalyticsEvent({
    eventName: "wasil_question",
    module: "wasil",
    route: "/dalil",
    metadata: {
      mode,
      creditsCharged: Number(payload.creditsCharged ?? 0),
      classification: payload.classification ?? null,
      clientLatencyMs: Math.max(0, Date.now() - clientStartedAt),
      firstTextLatencyMs: firstTextAt === null ? null : firstTextAt - clientStartedAt,
      streamed: Boolean(streamHandlers),
    },
  });

  return payload as WasilResponse;
}
