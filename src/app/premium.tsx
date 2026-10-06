import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { PurchasesPackage } from "react-native-purchases";

import { getValidSession } from "../features/auth/SupabaseAuthService";
import {
  clearPremiumAccessCache,
  getPremiumAccess,
  restorePremiumPurchases,
} from "../features/premium/PremiumAccessService";
import { revenueCatPaymentProvider } from "../features/premium/RevenueCatPaymentProvider";
import { translate, type TranslationKey } from "../i18n";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const BENEFITS: readonly TranslationKey[] = [
  "premium.benefit1",
  "premium.benefit2",
  "premium.benefit3",
  "premium.benefit4",
  "premium.benefit5",
];

type Feedback = { kind: "error" | "success"; message: string } | null;

function providerMessage(code: string) {
  if (code === "expo-go-unavailable") {
    return translate("premium.expoGo");
  }
  if (code === "not-configured") {
    return translate("premium.notConfigured");
  }
  if (code === "unsupported-platform") {
    return translate("premium.platform");
  }
  return translate("premium.unreachable");
}

export default function PremiumScreen() {
  const [monthlyPackage, setMonthlyPackage] =
    useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const loadOffering = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    const session = await getValidSession().catch(() => null);
    setSignedIn(Boolean(session));
    if (!session) {
      setFeedback({
        kind: "error",
        message: translate("premium.signInFirst"),
      });
      setLoading(false);
      return;
    }

    const result = await revenueCatPaymentProvider.getOfferings();
    if (result.status !== "success") {
      setFeedback({ kind: "error", message: providerMessage(result.error.code) });
      setLoading(false);
      return;
    }

    const offering =
      result.value.all.default ??
      (result.value.current?.identifier === "default"
        ? result.value.current
        : null);
    const packages = offering?.availablePackages ?? [];
    const selectedPackage =
      packages.find(
        (item) =>
          item.identifier === "$rc_monthly" &&
          item.product.identifier === "monthly",
      ) ??
      packages.find((item) => item.identifier === "$rc_monthly") ??
      packages.find((item) => item.product.identifier === "monthly") ??
      null;

    if (!selectedPackage) {
      setFeedback({
        kind: "error",
        message: translate("premium.offerTemporarilyOff"),
      });
    }
    setMonthlyPackage(selectedPackage);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadOffering();
  }, [loadOffering]);

  const purchase = async () => {
    if (!signedIn) {
      router.push("/profile");
      return;
    }
    if (!monthlyPackage) {
      setFeedback({
        kind: "error",
        message: translate("premium.offerOff"),
      });
      return;
    }

    setProcessing(true);
    setFeedback(null);
    const result = await revenueCatPaymentProvider.purchasePackage(monthlyPackage);
    if (result.status !== "success") {
      if (result.error.code !== "purchase-cancelled") {
        setFeedback({
          kind: "error",
          message: providerMessage(result.error.code),
        });
      }
      setProcessing(false);
      return;
    }
    if (!result.value.isPremium) {
      setFeedback({
        kind: "error",
        message:
          translate("premium.notActiveYet"),
      });
      setProcessing(false);
      return;
    }

    await clearPremiumAccessCache();
    const access = await getPremiumAccess();
    setFeedback(
      access.isPremium
        ? { kind: "success", message: translate("premium.active") }
        : {
            kind: "error",
            message: translate("premium.notSynced"),
          },
    );
    setProcessing(false);
  };

  const restore = async () => {
    if (!signedIn) {
      router.push("/profile");
      return;
    }
    setProcessing(true);
    setFeedback(null);
    const result = await restorePremiumPurchases();
    if (result.status === "not-configured") {
      setFeedback({
        kind: "error",
        message: translate("premium.restoreUnavailable"),
      });
      setProcessing(false);
      return;
    }
    if (result.status === "failed") {
      setFeedback({ kind: "error", message: result.error });
      setProcessing(false);
      return;
    }
    if (result.status === "no-purchases") {
      setFeedback({
        kind: "error",
        message: translate("premium.noneFound"),
      });
      setProcessing(false);
      return;
    }

    const access = await getPremiumAccess();
    setFeedback(
      access.isPremium
        ? { kind: "success", message: translate("premium.restored") }
        : {
            kind: "error",
            message: translate("premium.noEntitlement"),
          },
    );
    setProcessing(false);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[colors.purpleMid, colors.backgroundSecondary, colors.background]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>OUMMAH Premium</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroIcon}>
          <Ionicons name="diamond-outline" size={31} color={colors.goldLight} />
        </View>
        <Text style={styles.title}>OUMMAH Premium</Text>
        <Text style={styles.intro}>{translate("premium.intro")}</Text>

        <View style={styles.benefitsCard}>
          {BENEFITS.map((benefit) => (
            <View key={benefit} style={styles.benefitRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={colors.goldLight}
              />
              <Text style={styles.benefitText}>{translate(benefit)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.offerCard}>
          <Text style={styles.offerLabel}>{translate("premium.monthly")}</Text>
          {loading ? (
            <ActivityIndicator color={colors.goldLight} style={styles.loader} />
          ) : monthlyPackage ? (
            <>
              <Text style={styles.price}>
                {monthlyPackage.product.priceString}
              </Text>
              <Text style={styles.period}>{translate("premium.perMonth")}</Text>
            </>
          ) : (
            <Text style={styles.unavailable}>{translate("premium.unavailable")}</Text>
          )}
        </View>

        {feedback ? (
          <View
            style={[
              styles.feedback,
              feedback.kind === "success"
                ? styles.feedbackSuccess
                : styles.feedbackError,
            ]}
          >
            <Text style={styles.feedbackText}>{feedback.message}</Text>
          </View>
        ) : null}

        <Pressable
          disabled={loading || processing || (!monthlyPackage && signedIn)}
          onPress={() => void purchase()}
          style={({ pressed }) => [
            styles.primaryButton,
            (loading || processing || (!monthlyPackage && signedIn)) &&
              styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          {processing ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={styles.primaryButtonText}>
              {signedIn ? translate("premium.subscribe") : translate("premium.signIn")}
            </Text>
          )}
        </Pressable>

        <Pressable
          disabled={processing}
          onPress={() => void restore()}
          style={styles.restoreButton}
        >
          <Text style={styles.restoreText}>{translate("premium.restore")}</Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.returnLink}>
          <Text style={styles.returnText}>{translate("common.back")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 58,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  headerTitle: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 19,
  },
  headerSpacer: { width: 42 },
  content: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 42,
    alignItems: "center",
  },
  heroIcon: {
    width: 68,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
    backgroundColor: "rgba(227,181,90,0.10)",
  },
  title: {
    marginTop: 18,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 32,
    textAlign: "center",
  },
  intro: {
    maxWidth: 330,
    marginTop: 9,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  benefitsCard: {
    width: "100%",
    marginTop: 24,
    padding: 18,
    gap: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(23,16,38,0.86)",
  },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  benefitText: {
    flex: 1,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 13.5,
    lineHeight: 19,
  },
  offerCard: {
    width: "100%",
    minHeight: 132,
    marginTop: 16,
    padding: 19,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.34)",
    backgroundColor: "rgba(33,19,49,0.92)",
  },
  offerLabel: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  loader: { marginTop: 16 },
  price: {
    marginTop: 10,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 32,
  },
  period: {
    marginTop: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  unavailable: {
    marginTop: 14,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 13,
  },
  feedback: {
    width: "100%",
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 15,
    borderWidth: 1,
  },
  feedbackSuccess: {
    borderColor: "rgba(98,197,139,0.34)",
    backgroundColor: "rgba(98,197,139,0.10)",
  },
  feedbackError: {
    borderColor: "rgba(233,107,114,0.30)",
    backgroundColor: "rgba(233,107,114,0.08)",
  },
  feedbackText: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  primaryButton: {
    width: "100%",
    minHeight: 52,
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.goldLight,
  },
  primaryButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: "800",
  },
  buttonDisabled: { opacity: 0.48 },
  buttonPressed: { opacity: 0.82 },
  restoreButton: { marginTop: 17, paddingHorizontal: 14, paddingVertical: 9 },
  restoreText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "700",
  },
  returnLink: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 9 },
  returnText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
  },
});
