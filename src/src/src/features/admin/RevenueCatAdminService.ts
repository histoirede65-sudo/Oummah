import { getValidSession } from "../auth/SupabaseAuthService";
import { isOummahAdminSession } from "../auth/AdminAccess";

export type RevenueOverview = {
  activeSubscriptions: number;
  trialsActive: number;
  revenueTodayUsd: number;
  revenue7dUsd: number;
  revenue30dUsd: number;
  revenueLifetimeUsd: number;
  refunds30dUsd: number;
  refundEvents30d: number;
  billingIssuesActive: number;
  events30d: number;
};

export type RevenueProductRow = {
  productId: string;
  activeSubscribers: number;
  revenue30dUsd: number;
  revenueLifetimeUsd: number;
};

export type RevenueStoreRow = {
  store: string;
  activeSubscribers: number;
  revenue30dUsd: number;
};

export type RevenueSubscriberRow = {
  appUserId: string;
  userEmail: string | null;
  productId: string;
  store: string;
  environment: string;
  active: boolean;
  willRenew: boolean | null;
  isTrial: boolean;
  expirationAt: string | null;
  latestEventType: string;
  updatedAt: string;
};

export type WasilRiskRow = {
  userId: string;
  email: string | null;
  questions10m: number;
  questions1h: number;
  questions24h: number;
  riskLevel: "medium" | "high" | "critical";
};

export type RevenueDashboard = {
  overview: RevenueOverview;
  products: RevenueProductRow[];
  stores: RevenueStoreRow[];
  subscribers: RevenueSubscriberRow[];
  wasilRisk: WasilRiskRow[];
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

  if (!isOummahAdminSession(session)) {
    throw new Error("ADMIN_FORBIDDEN");
  }

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
    const detail = await response.text().catch(() => "");
    throw new Error(detail || "ADMIN_REVENUE_REQUEST_FAILED");
  }

  return (await response.json()) as T;
}

export async function getRevenueDashboard(): Promise<RevenueDashboard> {
  const raw = await rpc<{
    overview?: Record<string, number>;
    products?: Array<Record<string, string | number>>;
    stores?: Array<Record<string, string | number>>;
    subscribers?: Array<Record<string, string | boolean | null>>;
    wasil_risk?: Array<Record<string, string | number | null>>;
  }>("admin_get_revenuecat_finance_dashboard");

  return {
    overview: {
      activeSubscriptions: Number(raw.overview?.active_subscriptions ?? 0),
      trialsActive: Number(raw.overview?.trials_active ?? 0),
      revenueTodayUsd: Number(raw.overview?.revenue_today_usd ?? 0),
      revenue7dUsd: Number(raw.overview?.revenue_7d_usd ?? 0),
      revenue30dUsd: Number(raw.overview?.revenue_30d_usd ?? 0),
      revenueLifetimeUsd: Number(raw.overview?.revenue_lifetime_usd ?? 0),
      refunds30dUsd: Number(raw.overview?.refunds_30d_usd ?? 0),
      refundEvents30d: Number(raw.overview?.refund_events_30d ?? 0),
      billingIssuesActive: Number(raw.overview?.billing_issues_active ?? 0),
      events30d: Number(raw.overview?.events_30d ?? 0),
    },
    products: (raw.products ?? []).map((row) => ({
      productId: String(row.product_id ?? "inconnu"),
      activeSubscribers: Number(row.active_subscribers ?? 0),
      revenue30dUsd: Number(row.revenue_30d_usd ?? 0),
      revenueLifetimeUsd: Number(row.revenue_lifetime_usd ?? 0),
    })),
    stores: (raw.stores ?? []).map((row) => ({
      store: String(row.store ?? "UNKNOWN"),
      activeSubscribers: Number(row.active_subscribers ?? 0),
      revenue30dUsd: Number(row.revenue_30d_usd ?? 0),
    })),
    subscribers: (raw.subscribers ?? []).map((row) => ({
      appUserId: String(row.app_user_id ?? ""),
      userEmail: row.user_email ? String(row.user_email) : null,
      productId: String(row.product_id ?? "inconnu"),
      store: String(row.store ?? "UNKNOWN"),
      environment: String(row.environment ?? "UNKNOWN"),
      active: Boolean(row.active),
      willRenew:
        row.will_renew === null || row.will_renew === undefined
          ? null
          : Boolean(row.will_renew),
      isTrial: Boolean(row.is_trial),
      expirationAt: row.expiration_at ? String(row.expiration_at) : null,
      latestEventType: String(row.latest_event_type ?? "UNKNOWN"),
      updatedAt: String(row.updated_at ?? ""),
    })),
    wasilRisk: (raw.wasil_risk ?? []).map((row) => ({
      userId: String(row.user_id ?? ""),
      email: row.email ? String(row.email) : null,
      questions10m: Number(row.questions_10m ?? 0),
      questions1h: Number(row.questions_1h ?? 0),
      questions24h: Number(row.questions_24h ?? 0),
      riskLevel: String(row.risk_level ?? "medium") as WasilRiskRow["riskLevel"],
    })),
  };
}
