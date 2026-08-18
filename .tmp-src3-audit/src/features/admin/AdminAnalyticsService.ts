import { getValidSession } from "../auth/SupabaseAuthService";
import { isOummahAdminSession } from "../auth/AdminAccess";

export type AnalyticsOverview = {
  usersTotal: number;
  newUsersToday: number;
  active1d: number;
  active7d: number;
  active30d: number;
  wasil1d: number;
  wasil7d: number;
  wasil30d: number;
  creditsSpentLifetime: number;
};

export type AnalyticsDailyPoint = {
  day: string;
  activeUsers: number;
  screenViews: number;
  wasilQuestions: number;
};

export type AnalyticsModuleRow = {
  module: string;
  opens: number;
  uniqueUsers: number;
};

export type AnalyticsPayload = {
  overview: AnalyticsOverview;
  daily: AnalyticsDailyPoint[];
  modules: AnalyticsModuleRow[];
};

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error("ADMIN_SUPABASE_NOT_CONFIGURED");
  }

  return { url, key };
}

export async function getAdminAnalytics(
  days = 30,
): Promise<AnalyticsPayload> {
  const session = await getValidSession(true);

  if (!isOummahAdminSession(session)) {
    throw new Error("ADMIN_FORBIDDEN");
  }

  const { url, key } = configuration();
  const response = await fetch(
    `${url}/rest/v1/rpc/admin_get_analytics`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${session!.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_days: Math.min(90, Math.max(7, days)),
      }),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || "ADMIN_ANALYTICS_FAILED");
  }

  const raw = (await response.json()) as {
    overview?: Record<string, number>;
    daily?: Array<Record<string, string | number>>;
    modules?: Array<Record<string, string | number>>;
  };

  return {
    overview: {
      usersTotal: Number(raw.overview?.users_total ?? 0),
      newUsersToday: Number(raw.overview?.new_users_today ?? 0),
      active1d: Number(raw.overview?.active_1d ?? 0),
      active7d: Number(raw.overview?.active_7d ?? 0),
      active30d: Number(raw.overview?.active_30d ?? 0),
      wasil1d: Number(raw.overview?.wasil_1d ?? 0),
      wasil7d: Number(raw.overview?.wasil_7d ?? 0),
      wasil30d: Number(raw.overview?.wasil_30d ?? 0),
      creditsSpentLifetime: Number(
        raw.overview?.credits_spent_lifetime ?? 0,
      ),
    },
    daily: (raw.daily ?? []).map((row) => ({
      day: String(row.day),
      activeUsers: Number(row.active_users ?? 0),
      screenViews: Number(row.screen_views ?? 0),
      wasilQuestions: Number(row.wasil_questions ?? 0),
    })),
    modules: (raw.modules ?? []).map((row) => ({
      module: String(row.module),
      opens: Number(row.opens ?? 0),
      uniqueUsers: Number(row.unique_users ?? 0),
    })),
  };
}
