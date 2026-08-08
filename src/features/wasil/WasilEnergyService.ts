import type { PurchasesOfferings, PurchasesPackage } from "react-native-purchases";

import { getValidSession } from "../auth/SupabaseAuthService";
import { revenueCatPaymentProvider } from "../premium/RevenueCatPaymentProvider";
import { getWasilBalance } from "./WasilApiClient";

export const WASIL_ENERGY_OFFERING_ID = "wasil_energy" as const;

const ENERGY_PACKAGE_IDS = [
  "energy_25",
  "energy_75",
  "energy_180",
  "energy_400",
] as const;

export type WasilEnergyPackageId = (typeof ENERGY_PACKAGE_IDS)[number];

export type WasilEnergyPack = {
  identifier: WasilEnergyPackageId;
  productIdentifier: string;
  price: string;
  revenueCatPackage: PurchasesPackage;
};

export type WasilEnergyLoadResult =
  | { status: "success"; packs: WasilEnergyPack[] }
  | { status: "error"; code: WasilEnergyErrorCode; message: string };

export type WasilEnergyPurchaseResult =
  | {
      status: "completed" | "pending";
      balance: number;
      refreshed: boolean;
    }
  | { status: "cancelled" }
  | { status: "error"; code: WasilEnergyErrorCode; message: string };

export type WasilEnergyErrorCode =
  | "not-connected"
  | "expo-go-unavailable"
  | "not-configured"
  | "offering-unavailable"
  | "package-unavailable"
  | "purchase-failed"
  | "balance-unavailable";

function providerError(code: string): WasilEnergyErrorCode {
  if (code === "expo-go-unavailable") return code;
  if (code === "not-configured") return code;
  return "purchase-failed";
}

function errorResult(code: WasilEnergyErrorCode, message: string): WasilEnergyLoadResult {
  return { status: "error", code, message };
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
}

function findEnergyOffering(offerings: PurchasesOfferings) {
  return offerings.all[WASIL_ENERGY_OFFERING_ID] ??
    (offerings.current?.identifier === WASIL_ENERGY_OFFERING_ID
      ? offerings.current
      : null);
}

export async function loadWasilEnergyPacks(): Promise<WasilEnergyLoadResult> {
  const session = await getValidSession().catch(() => null);
  if (!session) {
    return errorResult("not-connected", "Connectez-vous pour acheter de l’énergie Wasil.");
  }

  const result = await revenueCatPaymentProvider.getOfferings();
  if (result.status !== "success") {
    return errorResult(
      providerError(result.error.code),
      result.error.code === "expo-go-unavailable"
        ? "Les achats d’énergie nécessitent un development build."
        : "Les packs d’énergie Wasil sont momentanément indisponibles.",
    );
  }

  const offering = findEnergyOffering(result.value);
  if (!offering) {
    return errorResult("offering-unavailable", "L’offre Énergie Wasil est momentanément indisponible.");
  }

  const expectedProducts: Record<WasilEnergyPackageId, string> = {
    energy_25: "oummah.wasil.credits25",
    energy_75: "oummah.wasil.credits75",
    energy_180: "oummah.wasil.credits180",
    energy_400: "oummah.wasil.credits400",
  };
  const packs: WasilEnergyPack[] = [];

  for (const identifier of ENERGY_PACKAGE_IDS) {
    const expectedProductIdentifier = expectedProducts[identifier];
    const revenueCatPackage = offering.availablePackages.find(
      (item) => item.identifier === identifier,
    );

    if (!revenueCatPackage || revenueCatPackage.product.identifier !== expectedProductIdentifier) {
      if (__DEV__) {
        console.warn(
          `[Wasil] Package ${identifier} ignoré : ` +
            (!revenueCatPackage
              ? "package absent dans l’offering wasil_energy"
              : `produit associé ${revenueCatPackage.product.identifier} au lieu de ${expectedProductIdentifier}`),
        );
      }
      continue;
    }

    packs.push({
      identifier,
      productIdentifier: revenueCatPackage.product.identifier,
      price: revenueCatPackage.product.priceString,
      revenueCatPackage,
    });
  }

  if (packs.length === 0) {
    return errorResult("package-unavailable", "Un ou plusieurs packs d’énergie sont indisponibles.");
  }

  return { status: "success", packs };
}

export async function purchaseWasilEnergy(
  pack: WasilEnergyPack,
  balanceBefore: number,
): Promise<WasilEnergyPurchaseResult> {
  const result = await revenueCatPaymentProvider.purchasePackage(pack.revenueCatPackage);
  if (result.status !== "success") {
    if (result.error.code === "purchase-cancelled") return { status: "cancelled" };
    return {
      status: "error",
      code: providerError(result.error.code),
      message: "L’achat n’a pas pu être finalisé.",
    };
  }

  const refreshBalance = async () => {
    try {
      return await getWasilBalance();
    } catch {
      return null;
    }
  };

  let balance = await refreshBalance();
  if (balance !== null && balance > balanceBefore) {
    return { status: "completed", balance, refreshed: true };
  }

  for (const delay of [2000, 4000, 8000, 12000]) {
    await wait(delay);
    balance = await refreshBalance();
    if (balance !== null && balance > balanceBefore) {
      return { status: "completed", balance, refreshed: true };
    }
  }

  return {
    status: "pending",
    balance: balance ?? balanceBefore,
    refreshed: false,
  };
}

export async function refreshWasilEnergyBalance() {
  try {
    return { status: "success" as const, balance: await getWasilBalance() };
  } catch {
    return {
      status: "error" as const,
      code: "balance-unavailable" as const,
      message: "Le solde d’énergie n’a pas pu être actualisé.",
    };
  }
}
