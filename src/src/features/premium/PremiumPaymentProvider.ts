export type PremiumPaymentOperationResult =
  | { status: "synchronized" }
  | { status: "no-purchases" }
  | { status: "not-configured" }
  | { status: "failed"; error: string };

export type PremiumPaymentContext = {
  userId: string;
};

export interface PremiumPaymentProvider {
  readonly id: string;
  isConfigured(): boolean;
  synchronize(
    context: PremiumPaymentContext,
  ): Promise<PremiumPaymentOperationResult>;
  restorePurchases(
    context: PremiumPaymentContext,
  ): Promise<PremiumPaymentOperationResult>;
}

export const unconfiguredPremiumPaymentProvider: PremiumPaymentProvider = {
  id: "unconfigured",
  isConfigured: () => false,
  synchronize: async () => ({ status: "not-configured" }),
  restorePurchases: async () => ({ status: "not-configured" }),
};
