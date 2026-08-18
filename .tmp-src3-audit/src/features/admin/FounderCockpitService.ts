import { getValidSession } from "../auth/SupabaseAuthService";
import { isOummahAdminSession } from "../auth/AdminAccess";

export type FounderCockpitStatus =
  | "growth"
  | "stable"
  | "watch"
  | "critical";

export type FounderCockpit = {
  status: FounderCockpitStatus;
  statusLabel: string;
  generatedAt: string;
  users: {
    total: number;
    newToday: number;
    active1d: number;
    active7d: number;
    active30d: number;
  };
  premium: {
    activeRevenueCat: number;
    activeManual: number;
    trials: number;
    conversionRate: number;
  };
  finance: {
    revenueTodayUsd: number;
    revenue30dUsd: number;
    aiCostTodayUsd: number;
    aiCost30dUsd: number;
    marginTodayUsd: number;
    margin30dUsd: number;
    projectedMonthRevenueUsd: number;
    projectedMonthCostUsd: number;
    projectedMonthMarginUsd: number;
  };
  wasil: {
    questionsToday: number;
    questions7d: number;
    questions30d: number;
    averageCostPerQuestionUsd: number;
    creditsAvailable: number;
    creditsSpent: number;
  };
  operations: {
    openAlerts: number;
    criticalAlerts: number;
    openSupport: number;
    urgentSupport: number;
    pendingMosques: number;
    pendingMosqueReports: number;
  };
  system: {
    health: "healthy" | "warning" | "critical" | "never_run";
    cronEnabled: boolean;
    lastMonitorRunAt: string | null;
    failures24h: number;
  };
  trends: Array<{
    day: string;
    activeUsers: number;
    wasilQuestions: number;
    revenueUsd: number;
    aiCostUsd: number;
  }>;
  priorities: Array<{
    severity: "info" | "warning" | "critical";
    title: string;
    description: string;
    route: string;
  }>;
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

export async function getFounderCockpit(): Promise<FounderCockpit> {
  const session = await getValidSession(true);
  if (!isOummahAdminSession(session)) {
    throw new Error("ADMIN_FORBIDDEN");
  }

  const { url, key } = configuration();
  const response = await fetch(
    `${url}/rest/v1/rpc/admin_get_founder_cockpit`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${session!.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    },
  );

  const text = await response.text().catch(() => "");
  if (!response.ok) {
    throw new Error(text || "ADMIN_FOUNDER_COCKPIT_FAILED");
  }
  if (!text.trim()) {
    throw new Error("ADMIN_FOUNDER_COCKPIT_EMPTY_RESPONSE");
  }

  const raw = JSON.parse(text) as Record<string, unknown>;
  const users = (raw.users ?? {}) as Record<string, number>;
  const premium = (raw.premium ?? {}) as Record<string, number>;
  const finance = (raw.finance ?? {}) as Record<string, number>;
  const wasil = (raw.wasil ?? {}) as Record<string, number>;
  const operations = (raw.operations ?? {}) as Record<string, number>;
  const system = (raw.system ?? {}) as Record<string, unknown>;

  return {
    status: String(raw.status ?? "stable") as FounderCockpitStatus,
    statusLabel: String(raw.status_label ?? "OUMMAH stable"),
    generatedAt: String(raw.generated_at ?? new Date().toISOString()),
    users: {
      total: Number(users.total ?? 0),
      newToday: Number(users.new_today ?? 0),
      active1d: Number(users.active_1d ?? 0),
      active7d: Number(users.active_7d ?? 0),
      active30d: Number(users.active_30d ?? 0),
    },
    premium: {
      activeRevenueCat: Number(premium.active_revenuecat ?? 0),
      activeManual: Number(premium.active_manual ?? 0),
      trials: Number(premium.trials ?? 0),
      conversionRate: Number(premium.conversion_rate ?? 0),
    },
    finance: {
      revenueTodayUsd: Number(finance.revenue_today_usd ?? 0),
      revenue30dUsd: Number(finance.revenue_30d_usd ?? 0),
      aiCostTodayUsd: Number(finance.ai_cost_today_usd ?? 0),
      aiCost30dUsd: Number(finance.ai_cost_30d_usd ?? 0),
      marginTodayUsd: Number(finance.margin_today_usd ?? 0),
      margin30dUsd: Number(finance.margin_30d_usd ?? 0),
      projectedMonthRevenueUsd: Number(
        finance.projected_month_revenue_usd ?? 0,
      ),
      projectedMonthCostUsd: Number(
        finance.projected_month_cost_usd ?? 0,
      ),
      projectedMonthMarginUsd: Number(
        finance.projected_month_margin_usd ?? 0,
      ),
    },
    wasil: {
      questionsToday: Number(wasil.questions_today ?? 0),
      questions7d: Number(wasil.questions_7d ?? 0),
      questions30d: Number(wasil.questions_30d ?? 0),
      averageCostPerQuestionUsd: Number(
        wasil.average_cost_per_question_usd ?? 0,
      ),
      creditsAvailable: Number(wasil.credits_available ?? 0),
      creditsSpent: Number(wasil.credits_spent ?? 0),
    },
    operations: {
      openAlerts: Number(operations.open_alerts ?? 0),
      criticalAlerts: Number(operations.critical_alerts ?? 0),
      openSupport: Number(operations.open_support ?? 0),
      urgentSupport: Number(operations.urgent_support ?? 0),
      pendingMosques: Number(operations.pending_mosques ?? 0),
      pendingMosqueReports: Number(
        operations.pending_mosque_reports ?? 0,
      ),
    },
    system: {
      health: String(system.health ?? "never_run") as FounderCockpit["system"]["health"],
      cronEnabled: Boolean(system.cron_enabled),
      lastMonitorRunAt: system.last_monitor_run_at
        ? String(system.last_monitor_run_at)
        : null,
      failures24h: Number(system.failures_24h ?? 0),
    },
    trends: ((raw.trends ?? []) as Array<Record<string, string | number>>).map(
      (row) => ({
        day: String(row.day),
        activeUsers: Number(row.active_users ?? 0),
        wasilQuestions: Number(row.wasil_questions ?? 0),
        revenueUsd: Number(row.revenue_usd ?? 0),
        aiCostUsd: Number(row.ai_cost_usd ?? 0),
      }),
    ),
    priorities: ((raw.priorities ?? []) as Array<Record<string, string>>).map(
      (row) => ({
        severity: String(row.severity ?? "info") as
          | "info"
          | "warning"
          | "critical",
        title: String(row.title ?? ""),
        description: String(row.description ?? ""),
        route: String(row.route ?? "/admin"),
      }),
    ),
  };
}
