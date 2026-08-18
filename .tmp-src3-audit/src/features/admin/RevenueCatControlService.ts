import { getValidSession } from "../auth/SupabaseAuthService";
import { isOummahAdminSession } from "../auth/AdminAccess";

export type RevenueCatControlSummary = {
  events24h: number;
  productionEvents24h: number;
  sandboxEvents24h: number;
  testEvents24h: number;
  unlinkedSubscriptions: number;
  staleSubscriptions: number;
};

export type RevenueCatControlEvent = {
  eventId: string;
  eventType: string;
  appUserId: string | null;
  productId: string | null;
  store: string | null;
  environment: string | null;
  priceUsd: number;
  receivedAt: string;
};

export type RevenueCatUnlinkedSubscription = {
  appUserId: string;
  productId: string;
  store: string | null;
  environment: string | null;
  latestEventType: string;
  expirationAt: string | null;
  updatedAt: string;
  suggestedEmail: string | null;
};

export type RevenueCatControlPayload = {
  summary: RevenueCatControlSummary;
  events: RevenueCatControlEvent[];
  unlinked: RevenueCatUnlinkedSubscription[];
};

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) throw new Error("ADMIN_SUPABASE_NOT_CONFIGURED");
  return { url, key };
}

async function rpc<T>(
  name: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const session = await getValidSession(true);
  if (!isOummahAdminSession(session)) throw new Error("ADMIN_FORBIDDEN");

  const { url, key } = configuration();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session!.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      (await response.text().catch(() => "")) ||
        "ADMIN_REVENUECAT_CONTROL_FAILED",
    );
  }

  return (await response.json()) as T;
}

export async function getRevenueCatControl(): Promise<RevenueCatControlPayload> {
  const raw = await rpc<{
    summary?: Record<string, number>;
    events?: Array<Record<string, string | number | null>>;
    unlinked?: Array<Record<string, string | null>>;
  }>("admin_get_revenuecat_control");

  return {
    summary: {
      events24h: Number(raw.summary?.events_24h ?? 0),
      productionEvents24h: Number(raw.summary?.production_events_24h ?? 0),
      sandboxEvents24h: Number(raw.summary?.sandbox_events_24h ?? 0),
      testEvents24h: Number(raw.summary?.test_events_24h ?? 0),
      unlinkedSubscriptions: Number(raw.summary?.unlinked_subscriptions ?? 0),
      staleSubscriptions: Number(raw.summary?.stale_subscriptions ?? 0),
    },
    events: (raw.events ?? []).map((row) => ({
      eventId: String(row.event_id ?? ""),
      eventType: String(row.event_type ?? "UNKNOWN"),
      appUserId: row.app_user_id ? String(row.app_user_id) : null,
      productId: row.product_id ? String(row.product_id) : null,
      store: row.store ? String(row.store) : null,
      environment: row.environment ? String(row.environment) : null,
      priceUsd: Number(row.price_usd ?? 0),
      receivedAt: String(row.received_at ?? ""),
    })),
    unlinked: (raw.unlinked ?? []).map((row) => ({
      appUserId: String(row.app_user_id ?? ""),
      productId: String(row.product_id ?? ""),
      store: row.store ? String(row.store) : null,
      environment: row.environment ? String(row.environment) : null,
      latestEventType: String(row.latest_event_type ?? "UNKNOWN"),
      expirationAt: row.expiration_at ? String(row.expiration_at) : null,
      updatedAt: String(row.updated_at ?? ""),
      suggestedEmail: row.suggested_email ? String(row.suggested_email) : null,
    })),
  };
}

export async function reconcileRevenueCatSubscription(
  appUserId: string,
  productId: string,
  email: string,
): Promise<void> {
  await rpc("admin_reconcile_revenuecat_subscription", {
    p_app_user_id: appUserId,
    p_product_id: productId,
    p_email: email.trim().toLowerCase(),
  });
}
