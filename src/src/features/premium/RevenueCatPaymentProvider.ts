import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import type {
  CustomerInfo,
  CustomerInfoUpdateListener,
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases";

import type {
  PremiumPaymentContext,
  PremiumPaymentOperationResult,
  PremiumPaymentProvider,
} from "./PremiumPaymentProvider";

export const PREMIUM_ENTITLEMENT_ID = "premium" as const;

export type RevenueCatProviderErrorCode =
  | "not-configured"
  | "expo-go-unavailable"
  | "unsupported-platform"
  | "purchase-cancelled"
  | "sdk-error";

export type RevenueCatProviderError = {
  code: RevenueCatProviderErrorCode;
  message: string;
};

export type RevenueCatResult<T> =
  | { status: "success"; value: T }
  | { status: "unavailable"; error: RevenueCatProviderError };

export type RevenueCatCustomerStatus = {
  customerInfo: CustomerInfo;
  isPremium: boolean;
};

function unavailable(
  code: RevenueCatProviderErrorCode,
  message: string,
): RevenueCatResult<never> {
  return { status: "unavailable", error: { code, message } };
}

function sdkError(error: unknown): RevenueCatResult<never> {
  const purchaseError = error as {
    code?: unknown;
    userCancelled?: unknown;
  };
  if (purchaseError.code === "1" || purchaseError.userCancelled === true) {
    return unavailable("purchase-cancelled", "Purchase cancelled.");
  }
  return unavailable(
    "sdk-error",
    error instanceof Error ? error.message : "RevenueCat SDK error",
  );
}

function publicApiKey() {
  const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY?.trim();
  if (__DEV__ && testKey) return testKey;
  if (Platform.OS === "ios") {
    return process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY?.trim();
  }
  if (Platform.OS === "android") {
    return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY?.trim();
  }
  return undefined;
}

class RevenueCatPaymentProvider implements PremiumPaymentProvider {
  readonly id = "revenuecat";

  private initialized = false;
  private sdk: typeof import("react-native-purchases").default | null = null;
  private currentUserId: string | null = null;
  private latestCustomerInfo: CustomerInfo | null = null;

  isConfigured() {
    return Boolean(
      publicApiKey() &&
        (Platform.OS === "ios" || Platform.OS === "android") &&
        Constants.executionEnvironment !== ExecutionEnvironment.StoreClient,
    );
  }

  async initialize(appUserId?: string): Promise<RevenueCatResult<void>> {
    if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
      return unavailable(
        "expo-go-unavailable",
        "RevenueCat purchases require an Expo development build.",
      );
    }
    if (Platform.OS !== "ios" && Platform.OS !== "android") {
      return unavailable(
        "unsupported-platform",
        "RevenueCat purchases are only configured for iOS and Android.",
      );
    }
    const apiKey = publicApiKey();
    if (!apiKey) {
      return unavailable(
        "not-configured",
        "No public RevenueCat SDK key is configured.",
      );
    }

    try {
      const module = await import("react-native-purchases");
      const purchases = module.default;
      this.sdk = purchases;
      if (!this.initialized && !(await purchases.isConfigured())) {
        if (__DEV__) purchases.setLogLevel(module.LOG_LEVEL.DEBUG);
        purchases.configure({ apiKey, appUserID: appUserId });
      }
      this.initialized = true;
      if (appUserId) this.currentUserId = appUserId;
      return { status: "success", value: undefined };
    } catch (error) {
      return sdkError(error);
    }
  }

  async getOfferings(): Promise<RevenueCatResult<PurchasesOfferings>> {
    const initialized = await this.initialize(this.currentUserId ?? undefined);
    if (initialized.status !== "success") return initialized;
    try {
      return { status: "success", value: await this.sdk!.getOfferings() };
    } catch (error) {
      return sdkError(error);
    }
  }

  async getCustomerInfo(): Promise<RevenueCatResult<CustomerInfo>> {
    const initialized = await this.initialize(this.currentUserId ?? undefined);
    if (initialized.status !== "success") return initialized;
    try {
      const customerInfo = await this.sdk!.getCustomerInfo();
      this.latestCustomerInfo = customerInfo;
      return { status: "success", value: customerInfo };
    } catch (error) {
      return sdkError(error);
    }
  }

  hasPremiumEntitlement(customerInfo = this.latestCustomerInfo) {
    return Boolean(customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT_ID]);
  }

  async getCustomerStatus(): Promise<RevenueCatResult<RevenueCatCustomerStatus>> {
    const result = await this.getCustomerInfo();
    if (result.status !== "success") return result;
    return {
      status: "success",
      value: {
        customerInfo: result.value,
        isPremium: this.hasPremiumEntitlement(result.value),
      },
    };
  }

  async purchasePackage(
    purchasePackage: PurchasesPackage,
  ): Promise<RevenueCatResult<RevenueCatCustomerStatus>> {
    const initialized = await this.initialize(this.currentUserId ?? undefined);
    if (initialized.status !== "success") return initialized;
    try {
      const { customerInfo } = await this.sdk!.purchasePackage(purchasePackage);
      this.latestCustomerInfo = customerInfo;
      return {
        status: "success",
        value: {
          customerInfo,
          isPremium: this.hasPremiumEntitlement(customerInfo),
        },
      };
    } catch (error) {
      return sdkError(error);
    }
  }

  async logIn(userId: string): Promise<RevenueCatResult<RevenueCatCustomerStatus>> {
    const initialized = await this.initialize();
    if (initialized.status !== "success") return initialized;
    try {
      const { customerInfo } = await this.sdk!.logIn(userId);
      this.currentUserId = userId;
      this.latestCustomerInfo = customerInfo;
      return {
        status: "success",
        value: {
          customerInfo,
          isPremium: this.hasPremiumEntitlement(customerInfo),
        },
      };
    } catch (error) {
      return sdkError(error);
    }
  }

  async logOut(): Promise<RevenueCatResult<void>> {
    this.currentUserId = null;
    this.latestCustomerInfo = null;
    if (!this.isConfigured() || !this.initialized) {
      return { status: "success", value: undefined };
    }
    try {
      await this.sdk!.logOut();
      return { status: "success", value: undefined };
    } catch (error) {
      return sdkError(error);
    }
  }

  async addCustomerInfoUpdateListener(
    listener: CustomerInfoUpdateListener,
  ): Promise<RevenueCatResult<() => void>> {
    const initialized = await this.initialize(this.currentUserId ?? undefined);
    if (initialized.status !== "success") return initialized;
    const wrappedListener: CustomerInfoUpdateListener = (customerInfo) => {
      this.latestCustomerInfo = customerInfo;
      listener(customerInfo);
    };
    this.sdk!.addCustomerInfoUpdateListener(wrappedListener);
    return {
      status: "success",
      value: () => this.sdk!.removeCustomerInfoUpdateListener(wrappedListener),
    };
  }

  async synchronize(
    context: PremiumPaymentContext,
  ): Promise<PremiumPaymentOperationResult> {
    const result = await this.logIn(context.userId);
    if (result.status === "success") return { status: "synchronized" };
    if (
      result.error.code === "not-configured" ||
      result.error.code === "expo-go-unavailable"
    ) {
      return { status: "not-configured" };
    }
    return { status: "failed", error: result.error.message };
  }

  async restorePurchases(
    context: PremiumPaymentContext,
  ): Promise<PremiumPaymentOperationResult> {
    const loggedIn = await this.logIn(context.userId);
    if (loggedIn.status !== "success") {
      return loggedIn.error.code === "not-configured" ||
        loggedIn.error.code === "expo-go-unavailable"
        ? { status: "not-configured" }
        : { status: "failed", error: loggedIn.error.message };
    }
    try {
      const customerInfo = await this.sdk!.restorePurchases();
      this.latestCustomerInfo = customerInfo;
      return this.hasPremiumEntitlement(customerInfo)
        ? { status: "synchronized" }
        : { status: "no-purchases" };
    } catch (error) {
      return {
        status: "failed",
        error: error instanceof Error ? error.message : "RevenueCat SDK error",
      };
    }
  }
}

export const revenueCatPaymentProvider = new RevenueCatPaymentProvider();
