import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getRevenueDashboard,
  type RevenueDashboard,
} from "../../features/admin/RevenueCatAdminService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const EMPTY: RevenueDashboard = {
  overview: {
    activeSubscriptions: 0,
    trialsActive: 0,
    revenueTodayUsd: 0,
    revenue7dUsd: 0,
    revenue30dUsd: 0,
    revenueLifetimeUsd: 0,
    refunds30dUsd: 0,
    refundEvents30d: 0,
    billingIssuesActive: 0,
    events30d: 0,
  },
  products: [],
  stores: [],
  subscribers: [],
  wasilRisk: [],
};

function money(value: number) {
  return `${value.toFixed(2)} $`;
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={18} color={colors.goldLight} />
      <Text style={styles.metricValue}>
        {typeof value === "number"
          ? value.toLocaleString("fr-FR")
          : value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function RevenueCatFinanceScreen() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      setData(await getRevenueDashboard());
    } catch (error) {
      Alert.alert(
        "Revenus & abonnements",
        error instanceof Error ? error.message : "Chargement impossible.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>Revenus & abonnements</Text>
        </View>
        <Pressable onPress={() => void load()} style={styles.headerButton}>
          <Ionicons name="refresh" size={20} color={colors.goldLight} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.goldLight} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load(true);
              }}
              tintColor={colors.goldLight}
            />
          }
        >
          <Text style={styles.sectionTitle}>RevenueCat</Text>
          <View style={styles.grid}>
            <Metric
              icon="diamond-outline"
              label="Abonnements actifs"
              value={data.overview.activeSubscriptions}
            />
            <Metric
              icon="flask-outline"
              label="Essais actifs"
              value={data.overview.trialsActive}
            />
            <Metric
              icon="today-outline"
              label="Revenu aujourd’hui"
              value={money(data.overview.revenueTodayUsd)}
            />
            <Metric
              icon="calendar-outline"
              label="Revenu 7 jours"
              value={money(data.overview.revenue7dUsd)}
            />
            <Metric
              icon="bar-chart-outline"
              label="Revenu 30 jours"
              value={money(data.overview.revenue30dUsd)}
            />
            <Metric
              icon="trending-up-outline"
              label="Revenu cumulé"
              value={money(data.overview.revenueLifetimeUsd)}
            />
            <Metric
              icon="return-down-back-outline"
              label="Remboursements 30 j"
              value={money(data.overview.refunds30dUsd)}
            />
            <Metric
              icon="warning-outline"
              label="Incidents de paiement"
              value={data.overview.billingIssuesActive}
            />
          </View>

          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.goldLight}
            />
            <Text style={styles.infoText}>
              Les chiffres commencent à partir de l’activation du webhook.
              RevenueCat ne renvoie pas automatiquement l’historique antérieur.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Produits</Text>
          <View style={styles.card}>
            {data.products.length === 0 ? (
              <Text style={styles.empty}>Aucun achat RevenueCat reçu.</Text>
            ) : (
              data.products.map((product) => (
                <View key={product.productId} style={styles.row}>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{product.productId}</Text>
                    <Text style={styles.rowMeta}>
                      {product.activeSubscribers} abonnés actifs
                    </Text>
                  </View>
                  <View style={styles.rowValues}>
                    <Text style={styles.rowValue}>
                      {money(product.revenue30dUsd)}
                    </Text>
                    <Text style={styles.rowMeta}>30 jours</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <Text style={styles.sectionTitle}>Boutiques</Text>
          <View style={styles.card}>
            {data.stores.length === 0 ? (
              <Text style={styles.empty}>Aucune boutique détectée.</Text>
            ) : (
              data.stores.map((store) => (
                <View key={store.store} style={styles.row}>
                  <View style={styles.rowCopy}>
                    <Text style={styles.rowTitle}>{store.store}</Text>
                    <Text style={styles.rowMeta}>
                      {store.activeSubscribers} actifs
                    </Text>
                  </View>
                  <Text style={styles.rowValue}>
                    {money(store.revenue30dUsd)}
                  </Text>
                </View>
              ))
            )}
          </View>

          <Text style={styles.sectionTitle}>Abonnements récents</Text>
          {data.subscribers.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.empty}>Aucun abonnement synchronisé.</Text>
            </View>
          ) : (
            data.subscribers.map((subscriber) => (
              <View
                key={`${subscriber.appUserId}-${subscriber.productId}`}
                style={styles.subscriberCard}
              >
                <View style={styles.subscriberTop}>
                  <Text style={styles.subscriberEmail} numberOfLines={1}>
                    {subscriber.userEmail ?? subscriber.appUserId}
                  </Text>
                  <View
                    style={[
                      styles.stateBadge,
                      subscriber.active && styles.stateBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.stateText,
                        subscriber.active && styles.stateTextActive,
                      ]}
                    >
                      {subscriber.active ? "ACTIF" : "INACTIF"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.product}>{subscriber.productId}</Text>
                <Text style={styles.meta}>
                  {subscriber.store} · {subscriber.environment} ·{" "}
                  {subscriber.latestEventType}
                </Text>
                <Text style={styles.meta}>
                  Expiration :{" "}
                  {subscriber.expirationAt
                    ? new Date(subscriber.expirationAt).toLocaleDateString(
                        "fr-FR",
                      )
                    : "non renseignée"}
                </Text>
              </View>
            ))
          )}

          <Text style={styles.sectionTitle}>Alertes Wasil</Text>
          {data.wasilRisk.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.empty}>
                Aucune consommation anormale détectée.
              </Text>
            </View>
          ) : (
            data.wasilRisk.map((risk) => (
              <View key={risk.userId} style={styles.riskCard}>
                <View style={styles.riskIcon}>
                  <Ionicons
                    name="warning-outline"
                    size={19}
                    color="#F28B82"
                  />
                </View>
                <View style={styles.riskCopy}>
                  <Text style={styles.riskEmail} numberOfLines={1}>
                    {risk.email ?? risk.userId}
                  </Text>
                  <Text style={styles.riskMeta}>
                    {risk.questions10m} questions / 10 min ·{" "}
                    {risk.questions1h} / heure · {risk.questions24h} / 24 h
                  </Text>
                </View>
                <Text style={styles.riskLevel}>
                  {risk.riskLevel.toUpperCase()}
                </Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 70,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  headerCopy: { alignItems: "center" },
  eyebrow: {
    color: colors.goldMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 19,
  },
  loader: { marginTop: 70 },
  content: { padding: 18, paddingBottom: 55 },
  sectionTitle: {
    marginTop: 7,
    marginBottom: 11,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  metric: {
    width: "48%",
    minHeight: 110,
    padding: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  metricValue: {
    marginTop: 10,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 21,
  },
  metricLabel: { marginTop: 4, color: colors.textMuted, fontSize: 9.5 },
  infoCard: {
    marginTop: 14,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    borderRadius: 16,
    backgroundColor: "rgba(241,188,79,0.06)",
  },
  infoText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 9.5,
    lineHeight: 15,
  },
  card: {
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  row: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 11.5, fontWeight: "800" },
  rowMeta: { marginTop: 4, color: colors.textMuted, fontSize: 8.5 },
  rowValues: { alignItems: "flex-end" },
  rowValue: { color: colors.goldLight, fontSize: 11.5, fontWeight: "900" },
  empty: {
    paddingVertical: 18,
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 10,
  },
  subscriberCard: {
    marginBottom: 9,
    padding: 13,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  subscriberTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  subscriberEmail: {
    flex: 1,
    color: colors.text,
    fontSize: 11.5,
    fontWeight: "800",
  },
  stateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: colors.background,
  },
  stateBadgeActive: { backgroundColor: "rgba(241,188,79,0.12)" },
  stateText: { color: colors.textMuted, fontSize: 8, fontWeight: "900" },
  stateTextActive: { color: colors.goldLight },
  product: { marginTop: 9, color: colors.goldLight, fontSize: 10.5 },
  meta: { marginTop: 4, color: colors.textMuted, fontSize: 8.5 },
  riskCard: {
    marginBottom: 9,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(242,139,130,0.25)",
    backgroundColor: "rgba(242,139,130,0.05)",
  },
  riskIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(242,139,130,0.10)",
  },
  riskCopy: { flex: 1, marginHorizontal: 10 },
  riskEmail: { color: colors.text, fontSize: 10.5, fontWeight: "800" },
  riskMeta: { marginTop: 4, color: colors.textMuted, fontSize: 8.5 },
  riskLevel: { color: "#F28B82", fontSize: 8, fontWeight: "900" },
});
