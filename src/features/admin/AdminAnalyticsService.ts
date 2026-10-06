import { adminRpc } from "./adminClient";

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


export async function getAdminAnalytics(
  days = 30,
): Promise<AnalyticsPayload> {
  const raw = (await adminRpc<unknown>("admin_get_analytics", { p_days: Math.min(90, Math.max(7, days)) })) as {
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
