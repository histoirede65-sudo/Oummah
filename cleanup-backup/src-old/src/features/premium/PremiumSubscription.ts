export type PremiumTier = "free" | "premium";

export type PremiumPurchasePlatform = "ios" | "android" | "manual";

export type PremiumSubscriptionStatus =
  | "active"
  | "expired"
  | "canceled"
  | "trialing"
  | "pending";

export type PremiumSubscription = {
  tier: PremiumTier;
  status: PremiumSubscriptionStatus;
  purchasePlatform: PremiumPurchasePlatform;
  startedAt?: string;
  expiresAt?: string;
  autoRenew: boolean;
  provider?: string;
};
