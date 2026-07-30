import AsyncStorage from "@react-native-async-storage/async-storage";

import { getValidSession } from "../auth/SupabaseAuthService";

const CACHE_KEY = "oumma:premium-access:v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export type PremiumAccessReason =
  | "active"
  | "free"
  | "signed-out"
  | "unavailable";

export type PremiumAccess = {
  isPremium: boolean;
  tier: "free" | "premium";
  reason: PremiumAccessReason;
  currentPeriodEnd?: string;
  checkedAt: string;
};

type CachedPremiumAccess = PremiumAccess & {
  userId: string;
};

type PremiumEntitlementRow = {
  is_premium?: boolean;
  tier?: string | null;
  status?: string | null;
  current_period_end?: string | null;
};

function publicConfiguration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) return null;
  return { url, key };
}

function access(
  reason: PremiumAccessReason,
  values: Partial<PremiumAccess> = {},
): PremiumAccess {
  return {
    isPremium: reason === "active",
    tier: reason === "active" ? "premium" : "free",
    reason,
    checkedAt: new Date().toISOString(),
    ...values,
  };
}

async function readCached(userId: string) {
  const raw = await AsyncStorage.getItem(CACHE_KEY).catch(() => null);
  if (!raw) return null;

  try {
    const cached = JSON.parse(raw) as CachedPremiumAccess;
    if (cached.userId !== userId) return null;
    const age = Date.now() - new Date(cached.checkedAt).getTime();
    if (!Number.isFinite(age) || age > CACHE_TTL_MS) return null;
    return cached;
  } catch {
    return null;
  }
}

async function writeCached(userId: string, value: PremiumAccess) {
  const cached: CachedPremiumAccess = { ...value, userId };
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cached)).catch(
    () => undefined,
  );
}

function firstRow(value: unknown): PremiumEntitlementRow | null {
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === "object"
      ? (first as PremiumEntitlementRow)
      : null;
  }
  return value && typeof value === "object"
    ? (value as PremiumEntitlementRow)
    : null;
}

async function fetchRemotePremiumAccess(): Promise<PremiumAccess> {
  const session = await getValidSession();
  if (!session) return access("signed-out");

  const configuration = publicConfiguration();
  if (!configuration) {
    const cached = await readCached(session.user.id);
    return cached ?? access("unavailable");
  }

  try {
    const response = await fetch(
      `${configuration.url}/rest/v1/rpc/get_my_premium_entitlement`,
      {
        method: "POST",
        headers: {
          apikey: configuration.key,
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    if (!response.ok) throw new Error("premium-entitlement-unavailable");

    const row = firstRow(await response.json());
    const premium = Boolean(row?.is_premium);
    const result = access(premium ? "active" : "free", {
      isPremium: premium,
      tier: premium ? "premium" : "free",
      currentPeriodEnd: row?.current_period_end ?? undefined,
    });
    await writeCached(session.user.id, result);
    return result;
  } catch {
    const cached = await readCached(session.user.id);
    return cached ?? access("unavailable");
  }
}

export async function getPremiumAccess() {
  return fetchRemotePremiumAccess();
}

export async function clearPremiumAccessCache() {
  await AsyncStorage.removeItem(CACHE_KEY).catch(() => undefined);
}
