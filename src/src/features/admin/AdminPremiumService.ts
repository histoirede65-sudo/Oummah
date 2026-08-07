import { getValidSession } from "../auth/SupabaseAuthService";
import { isOummahAdminSession } from "../auth/AdminAccess";

export type AdminPremiumOverview = {
  totalUsers: number;
  activeManualPremium: number;
  expiring7d: number;
  walletsTotal: number;
  creditsAvailable: number;
  creditsSpent: number;
  creditPurchaseCount: number;
  estimatedGrossCents: number;
  estimatedAiCostUsd: number;
};

export type AdminPremiumUser = {
  userId: string;
  email: string;
  createdAt: string;
  balance: number;
  totalSpent: number;
  manualPremiumActive: boolean;
  manualPremiumStartsAt: string | null;
  manualPremiumEndsAt: string | null;
  manualPremiumReason: string | null;
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

async function rpc<T>(
  name: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const session = await getValidSession(true);

  if (!isOummahAdminSession(session)) {
    throw new Error("ADMIN_FORBIDDEN");
  }

  const { url, key } = configuration();

  const response = await fetch(
    `${url}/rest/v1/rpc/${name}`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${session!.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || "ADMIN_PREMIUM_REQUEST_FAILED");
  }

  return (await response.json()) as T;
}

export async function getAdminPremiumOverview(): Promise<AdminPremiumOverview> {
  const raw = await rpc<{
    total_users?: number;
    active_manual_premium?: number;
    expiring_7d?: number;
    wallets_total?: number;
    credits_available?: number;
    credits_spent?: number;
    credit_purchase_count?: number;
    estimated_gross_cents?: number;
    estimated_ai_cost_usd?: number;
  }>("admin_get_premium_wasil_overview");

  return {
    totalUsers: Number(raw.total_users ?? 0),
    activeManualPremium: Number(raw.active_manual_premium ?? 0),
    expiring7d: Number(raw.expiring_7d ?? 0),
    walletsTotal: Number(raw.wallets_total ?? 0),
    creditsAvailable: Number(raw.credits_available ?? 0),
    creditsSpent: Number(raw.credits_spent ?? 0),
    creditPurchaseCount: Number(raw.credit_purchase_count ?? 0),
    estimatedGrossCents: Number(raw.estimated_gross_cents ?? 0),
    estimatedAiCostUsd: Number(raw.estimated_ai_cost_usd ?? 0),
  };
}

export async function getAdminPremiumUsers(
  search = "",
  limit = 100,
): Promise<AdminPremiumUser[]> {
  const rows = await rpc<Array<{
    user_id: string;
    email: string | null;
    created_at: string;
    balance: number | null;
    total_spent: number | null;
    manual_premium_active: boolean | null;
    manual_premium_starts_at: string | null;
    manual_premium_ends_at: string | null;
    manual_premium_reason: string | null;
  }>>("admin_list_premium_users", {
    p_search: search.trim() || null,
    p_limit: Math.min(200, Math.max(1, limit)),
  });

  return rows.map((row) => ({
    userId: row.user_id,
    email: row.email ?? "Adresse inconnue",
    createdAt: row.created_at,
    balance: Number(row.balance ?? 0),
    totalSpent: Number(row.total_spent ?? 0),
    manualPremiumActive: Boolean(row.manual_premium_active),
    manualPremiumStartsAt: row.manual_premium_starts_at,
    manualPremiumEndsAt: row.manual_premium_ends_at,
    manualPremiumReason: row.manual_premium_reason,
  }));
}

export async function grantManualPremium(
  userId: string,
  months: number,
  reason: string,
): Promise<void> {
  await rpc("admin_grant_manual_premium", {
    p_user_id: userId,
    p_months: months,
    p_reason: reason.trim() || "Premium offert par OUMMAH",
  });
}

export async function revokeManualPremium(
  userId: string,
  reason: string,
): Promise<void> {
  await rpc("admin_revoke_manual_premium", {
    p_user_id: userId,
    p_reason: reason.trim() || "Premium retiré par OUMMAH",
  });
}
