import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import { getValidSession } from "../auth/SupabaseAuthService";
import {
  type PremiumPaymentOperationResult,
  type PremiumPaymentProvider,
} from "./PremiumPaymentProvider";
import {
  PREMIUM_ENTITLEMENT_ID,
  revenueCatPaymentProvider,
} from "./RevenueCatPaymentProvider";
import type {
  PremiumPurchasePlatform,
  PremiumSubscription,
  PremiumSubscriptionStatus,
  PremiumTier,
} from "./PremiumSubscription";

const CACHE_KEY = "oumma:premium-access:v1";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export type PremiumAccessReason =
  | "active"
  | "free"
  | "signed-out"
  | "unavailable";

export type PremiumAccess = {
  isPremium: boolean;
  tier: PremiumTier;
  reason: PremiumAccessReason;
  currentPeriodEnd?: string;
  subscription?: PremiumSubscription;
  checkedAt: string;
};

type CachedPremiumAccess = PremiumAccess & {
  userId: string;
};

type PremiumEntitlementRow = {
  is_premium?: boolean;
  tier?: string | null;
  status?: string | null;
  source?: string | null;
  provider?: string | null;
  started_at?: string | null;
  current_period_end?: string | null;
  auto_renew?: boolean | null;
};

function subscriptionStatus(value: string | null | undefined) {
  const supported: PremiumSubscriptionStatus[] = [
    "active",
    "expired",
    "canceled",
    "trialing",
    "pending",
  ];
  return supported.includes(value as PremiumSubscriptionStatus)
    ? (value as PremiumSubscriptionStatus)
    : "expired";
}

function purchasePlatform(value: string | null | undefined) {
  const platforms: Record<string, PremiumPurchasePlatform> = {
    apple: "ios",
    google: "android",
    manual: "manual",
  };
  return platforms[value ?? ""] ?? "manual";
}

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
    const tier: PremiumTier = premium ? "premium" : "free";
    const result = access(premium ? "active" : "free", {
      isPremium: premium,
      tier,
      currentPeriodEnd: row?.current_period_end ?? undefined,
      subscription: row
        ? {
            tier,
            status: subscriptionStatus(row.status),
            purchasePlatform: purchasePlatform(row.source),
            startedAt: row.started_at ?? undefined,
            expiresAt: row.current_period_end ?? undefined,
            autoRenew: Boolean(row.auto_renew),
            provider: row.provider ?? undefined,
          }
        : undefined,
    });
    await writeCached(session.user.id, result);
    return result;
  } catch {
    const cached = await readCached(session.user.id);
    return cached ?? access("unavailable");
  }
}

export async function getPremiumAccess() {
  await synchronizePremiumSubscription(revenueCatPaymentProvider);
  const supabaseAccess = await fetchRemotePremiumAccess();
  if (supabaseAccess.isPremium || supabaseAccess.reason === "signed-out") {
    return supabaseAccess;
  }

  const revenueCatStatus = await revenueCatPaymentProvider.getCustomerStatus();
  if (
    revenueCatStatus.status !== "success" ||
    !revenueCatStatus.value.isPremium
  ) {
    return supabaseAccess;
  }

  const entitlement =
    revenueCatStatus.value.customerInfo.entitlements.active[
      PREMIUM_ENTITLEMENT_ID
    ];
  const purchasePlatform: PremiumPurchasePlatform =
    entitlement.store === "APP_STORE" || entitlement.store === "MAC_APP_STORE"
      ? "ios"
      : entitlement.store === "PLAY_STORE"
        ? "android"
        : Platform.OS === "ios" || Platform.OS === "android"
          ? Platform.OS
          : "manual";

  return access("active", {
    isPremium: true,
    tier: "premium",
    currentPeriodEnd: entitlement.expirationDate ?? undefined,
    subscription: {
      tier: "premium",
      status:
        entitlement.periodType.toUpperCase() === "TRIAL"
          ? "trialing"
          : "active",
      purchasePlatform,
      startedAt: entitlement.latestPurchaseDate,
      expiresAt: entitlement.expirationDate ?? undefined,
      autoRenew: entitlement.willRenew,
      provider: revenueCatPaymentProvider.id,
    },
  });
}

export async function clearPremiumAccessCache() {
  await AsyncStorage.removeItem(CACHE_KEY).catch(() => undefined);
}

async function runPaymentOperation(
  operation: "synchronize" | "restorePurchases",
  provider: PremiumPaymentProvider,
): Promise<PremiumPaymentOperationResult> {
  const session = await getValidSession();
  if (!session || !provider.isConfigured()) return { status: "not-configured" };

  const result = await provider[operation]({ userId: session.user.id }).catch(
    (error: unknown) => ({
      status: "failed" as const,
      error: error instanceof Error ? error.message : "payment-provider-failed",
    }),
  );
  if (result.status === "synchronized") await clearPremiumAccessCache();
  return result;
}

export function synchronizePremiumSubscription(
  provider = revenueCatPaymentProvider,
) {
  return runPaymentOperation("synchronize", provider);
}

export function restorePremiumPurchases(
  provider = revenueCatPaymentProvider,
) {
  return runPaymentOperation("restorePurchases", provider);
}
