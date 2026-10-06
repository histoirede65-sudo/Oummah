import { adminRpc } from "./adminClient";

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

// Every call goes through the shared admin client (session, retry, readable errors).
function rpc<T>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  return adminRpc<T>(name, body);
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
