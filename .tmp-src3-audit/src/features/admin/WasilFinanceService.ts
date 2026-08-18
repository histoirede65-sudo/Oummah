import { getValidSession } from "../auth/SupabaseAuthService";
import { isOummahAdminSession } from "../auth/AdminAccess";

export type WasilFinanceOverview = {
  questionsToday: number;
  questions30d: number;
  aiCostTodayUsd: number;
  aiCost30dUsd: number;
  aiCostLifetimeUsd: number;
  revenueTodayUsd: number;
  revenue30dUsd: number;
  revenueLifetimeUsd: number;
  refunds30dUsd: number;
  netMargin30dUsd: number;
  averageCostPerQuestionUsd: number;
  creditsAvailable: number;
  creditsSpent: number;
  creditPurchaseCount30d: number;
  profitability: "very_profitable" | "profitable" | "watch" | "loss";
};

export type WasilFinanceTopUser = {
  userId: string;
  email: string | null;
  balance: number;
  totalSpent: number;
  questions30d: number;
  estimatedCost30dUsd: number;
};

export type WasilFinanceDailyPoint = {
  day: string;
  questions: number;
  aiCostUsd: number;
  revenueUsd: number;
};

export type WasilFinanceProjection = {
  users: number;
  projectedQuestions: number;
  projectedAiCostUsd: number;
  projectedRevenueUsd: number;
  projectedMarginUsd: number;
};

export type WasilFinanceDashboard = {
  overview: WasilFinanceOverview;
  topUsers: WasilFinanceTopUser[];
  daily: WasilFinanceDailyPoint[];
  projections: WasilFinanceProjection[];
  diagnostics: string[];
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

  const text = await response.text().catch(() => "");

  if (!response.ok) {
    throw new Error(text || "ADMIN_WASIL_FINANCE_FAILED");
  }

  if (!text.trim()) {
    throw new Error("ADMIN_WASIL_FINANCE_EMPTY_RESPONSE");
  }

  return JSON.parse(text) as T;
}

export async function getWasilFinanceDashboard(): Promise<WasilFinanceDashboard> {
  const raw = await rpc<{
    overview?: Record<string, string | number>;
    top_users?: Array<Record<string, string | number | null>>;
    daily?: Array<Record<string, string | number>>;
    projections?: Array<Record<string, string | number>>;
    diagnostics?: string[];
  }>("admin_get_wasil_finance_dashboard");

  const overview = raw.overview ?? {};

  return {
    overview: {
      questionsToday: Number(overview.questions_today ?? 0),
      questions30d: Number(overview.questions_30d ?? 0),
      aiCostTodayUsd: Number(overview.ai_cost_today_usd ?? 0),
      aiCost30dUsd: Number(overview.ai_cost_30d_usd ?? 0),
      aiCostLifetimeUsd: Number(overview.ai_cost_lifetime_usd ?? 0),
      revenueTodayUsd: Number(overview.revenue_today_usd ?? 0),
      revenue30dUsd: Number(overview.revenue_30d_usd ?? 0),
      revenueLifetimeUsd: Number(overview.revenue_lifetime_usd ?? 0),
      refunds30dUsd: Number(overview.refunds_30d_usd ?? 0),
      netMargin30dUsd: Number(overview.net_margin_30d_usd ?? 0),
      averageCostPerQuestionUsd: Number(
        overview.average_cost_per_question_usd ?? 0,
      ),
      creditsAvailable: Number(overview.credits_available ?? 0),
      creditsSpent: Number(overview.credits_spent ?? 0),
      creditPurchaseCount30d: Number(
        overview.credit_purchase_count_30d ?? 0,
      ),
      profitability: String(
        overview.profitability ?? "watch",
      ) as WasilFinanceOverview["profitability"],
    },
    topUsers: (raw.top_users ?? []).map((row) => ({
      userId: String(row.user_id ?? ""),
      email: row.email ? String(row.email) : null,
      balance: Number(row.balance ?? 0),
      totalSpent: Number(row.total_spent ?? 0),
      questions30d: Number(row.questions_30d ?? 0),
      estimatedCost30dUsd: Number(row.estimated_cost_30d_usd ?? 0),
    })),
    daily: (raw.daily ?? []).map((row) => ({
      day: String(row.day),
      questions: Number(row.questions ?? 0),
      aiCostUsd: Number(row.ai_cost_usd ?? 0),
      revenueUsd: Number(row.revenue_usd ?? 0),
    })),
    projections: (raw.projections ?? []).map((row) => ({
      users: Number(row.users ?? 0),
      projectedQuestions: Number(row.projected_questions ?? 0),
      projectedAiCostUsd: Number(row.projected_ai_cost_usd ?? 0),
      projectedRevenueUsd: Number(row.projected_revenue_usd ?? 0),
      projectedMarginUsd: Number(row.projected_margin_usd ?? 0),
    })),
    diagnostics: raw.diagnostics ?? [],
  };
}
