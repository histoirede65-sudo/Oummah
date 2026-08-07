import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
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
  getWasilFinanceDashboard,
  type WasilFinanceDashboard,
} from "../../features/admin/WasilFinanceService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const EMPTY: WasilFinanceDashboard = {
  overview: {
    questionsToday: 0,
    questions30d: 0,
    aiCostTodayUsd: 0,
    aiCost30dUsd: 0,
    aiCostLifetimeUsd: 0,
    revenueTodayUsd: 0,
    revenue30dUsd: 0,
    revenueLifetimeUsd: 0,
    refunds30dUsd: 0,
    netMargin30dUsd: 0,
    averageCostPerQuestionUsd: 0,
    creditsAvailable: 0,
    creditsSpent: 0,
    creditPurchaseCount30d: 0,
    profitability: "watch",
  },
  topUsers: [],
  daily: [],
  projections: [],
  diagnostics: [],
};

function usd(value: number) {
  return `${value.toFixed(value < 1 ? 4 : 2)} $`;
}

function profitabilityLabel(
  value: WasilFinanceDashboard["overview"]["profitability"],
) {
  if (value === "very_profitable") return "TRÈS RENTABLE";
  if (value === "profitable") return "RENTABLE";
  if (value === "loss") return "DÉFICITAIRE";
  return "À SURVEILLER";
}

function profitabilityIcon(
  value: WasilFinanceDashboard["overview"]["profitability"],
): keyof typeof Ionicons.glyphMap {
  if (value === "very_profitable" || value === "profitable") {
    return "trending-up-outline";
  }
  if (value === "loss") return "trending-down-outline";
  return "eye-outline";
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

export default function WasilFinanceScreen() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      setData(await getWasilFinanceDashboard());
    } catch (error) {
      Alert.alert(
        "Finances Wasil",
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

  const maxDaily = useMemo(
    () =>
      Math.max(
        1,
        ...data.daily.map((point) =>
          Math.max(point.aiCostUsd, point.revenueUsd),
        ),
      ),
    [data.daily],
  );

  const isLoss = data.overview.profitability === "loss";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>Finances Wasil</Text>
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
          <View
            style={[
              styles.profitabilityCard,
              isLoss && styles.profitabilityCardLoss,
            ]}
          >
            <View
              style={[
                styles.profitabilityIcon,
                isLoss && styles.profitabilityIconLoss,
              ]}
            >
              <Ionicons
                name={profitabilityIcon(data.overview.profitability)}
                size={27}
                color={isLoss ? "#F28B82" : colors.goldLight}
              />
            </View>

            <View style={styles.profitabilityCopy}>
              <Text style={styles.profitabilityEyebrow}>
                RENTABILITÉ SUR 30 JOURS
              </Text>
              <Text
                style={[
                  styles.profitabilityTitle,
                  isLoss && styles.profitabilityTitleLoss,
                ]}
              >
                {profitabilityLabel(data.overview.profitability)}
              </Text>
              <Text style={styles.profitabilityAmount}>
                Marge : {usd(data.overview.netMargin30dUsd)}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Vue financière</Text>

          <View style={styles.grid}>
            <Metric
              icon="hardware-chip-outline"
              label="Coût IA aujourd’hui"
              value={usd(data.overview.aiCostTodayUsd)}
            />
            <Metric
              icon="analytics-outline"
              label="Coût IA 30 jours"
              value={usd(data.overview.aiCost30dUsd)}
            />
            <Metric
              icon="cash-outline"
              label="Revenu aujourd’hui"
              value={usd(data.overview.revenueTodayUsd)}
            />
            <Metric
              icon="trending-up-outline"
              label="Revenu 30 jours"
              value={usd(data.overview.revenue30dUsd)}
            />
            <Metric
              icon="return-down-back-outline"
              label="Remboursements 30 j"
              value={usd(data.overview.refunds30dUsd)}
            />
            <Metric
              icon="calculator-outline"
              label="Coût moyen / question"
              value={usd(data.overview.averageCostPerQuestionUsd)}
            />
          </View>

          <Text style={styles.sectionTitle}>Usage et crédits</Text>

          <View style={styles.grid}>
            <Metric
              icon="chatbubble-ellipses-outline"
              label="Questions aujourd’hui"
              value={data.overview.questionsToday}
            />
            <Metric
              icon="chatbubbles-outline"
              label="Questions 30 jours"
              value={data.overview.questions30d}
            />
            <Metric
              icon="wallet-outline"
              label="Crédits disponibles"
              value={data.overview.creditsAvailable}
            />
            <Metric
              icon="flash-outline"
              label="Crédits consommés"
              value={data.overview.creditsSpent}
            />
            <Metric
              icon="bag-check-outline"
              label="Achats de packs 30 j"
              value={data.overview.creditPurchaseCount30d}
            />
            <Metric
              icon="server-outline"
              label="Coût IA cumulé"
              value={usd(data.overview.aiCostLifetimeUsd)}
            />
          </View>

          <Text style={styles.sectionTitle}>Évolution sur 30 jours</Text>

          <View style={styles.chartCard}>
            {data.daily.map((point) => (
              <View key={point.day} style={styles.dayRow}>
                <Text style={styles.dayLabel}>
                  {new Date(point.day).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </Text>

                <View style={styles.bars}>
                  <View
                    style={[
                      styles.revenueBar,
                      {
                        width: `${Math.max(
                          2,
                          (point.revenueUsd / maxDaily) * 100,
                        )}%`,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.costBar,
                      {
                        width: `${Math.max(
                          2,
                          (point.aiCostUsd / maxDaily) * 100,
                        )}%`,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.dayValue}>{point.questions}</Text>
              </View>
            ))}

            <View style={styles.legend}>
              <Text style={styles.legendText}>Or : revenus</Text>
              <Text style={styles.legendText}>Clair : coûts IA</Text>
              <Text style={styles.legendText}>Droite : questions</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Plus gros consommateurs</Text>

          <View style={styles.card}>
            {data.topUsers.length === 0 ? (
              <Text style={styles.empty}>Aucune consommation disponible.</Text>
            ) : (
              data.topUsers.map((user, index) => (
                <View key={user.userId} style={styles.userRow}>
                  <Text style={styles.rank}>{index + 1}</Text>
                  <View style={styles.userCopy}>
                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user.email ?? user.userId}
                    </Text>
                    <Text style={styles.userMeta}>
                      {user.questions30d} questions · {user.totalSpent} crédits
                      consommés
                    </Text>
                  </View>
                  <View style={styles.userValues}>
                    <Text style={styles.userCost}>
                      {usd(user.estimatedCost30dUsd)}
                    </Text>
                    <Text style={styles.userBalance}>
                      Solde {user.balance}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <Text style={styles.sectionTitle}>Projections mensuelles</Text>

          {data.projections.map((projection) => (
            <View key={projection.users} style={styles.projectionCard}>
              <View style={styles.projectionHeader}>
                <Text style={styles.projectionUsers}>
                  {projection.users.toLocaleString("fr-FR")} utilisateurs
                </Text>
                <Text
                  style={[
                    styles.projectionMargin,
                    projection.projectedMarginUsd < 0 &&
                      styles.projectionMarginLoss,
                  ]}
                >
                  {usd(projection.projectedMarginUsd)}
                </Text>
              </View>
              <Text style={styles.projectionMeta}>
                {projection.projectedQuestions.toLocaleString("fr-FR")} questions
                · coût {usd(projection.projectedAiCostUsd)} · revenu{" "}
                {usd(projection.projectedRevenueUsd)}
              </Text>
            </View>
          ))}

          {data.diagnostics.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>Diagnostic des données</Text>
              <View style={styles.noteCard}>
                <Ionicons
                  name="information-circle-outline"
                  size={20}
                  color={colors.goldLight}
                />
                <View style={styles.noteCopy}>
                  {data.diagnostics.map((item) => (
                    <Text key={item} style={styles.noteText}>
                      • {item}
                    </Text>
                  ))}
                </View>
              </View>
            </>
          ) : null}
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
    fontSize: 22,
  },
  loader: { marginTop: 70 },
  content: { padding: 18, paddingBottom: 55 },
  profitabilityCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.28)",
    backgroundColor: "rgba(241,188,79,0.06)",
  },
  profitabilityCardLoss: {
    borderColor: "rgba(242,139,130,0.35)",
    backgroundColor: "rgba(242,139,130,0.05)",
  },
  profitabilityIcon: {
    width: 55,
    height: 55,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  profitabilityIconLoss: {
    backgroundColor: "rgba(242,139,130,0.10)",
  },
  profitabilityCopy: { flex: 1, marginLeft: 14 },
  profitabilityEyebrow: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  profitabilityTitle: {
    marginTop: 3,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 20,
  },
  profitabilityTitleLoss: { color: "#F28B82" },
  profitabilityAmount: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 10,
  },
  sectionTitle: {
    marginTop: 22,
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
    fontSize: 20,
  },
  metricLabel: { marginTop: 4, color: colors.textMuted, fontSize: 9.5 },
  chartCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  dayRow: {
    minHeight: 31,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayLabel: { width: 37, color: colors.textMuted, fontSize: 8.5 },
  bars: { flex: 1, gap: 3 },
  revenueBar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.goldLight,
  },
  costBar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.textSecondary,
    opacity: 0.45,
  },
  dayValue: {
    width: 36,
    textAlign: "right",
    color: colors.textMuted,
    fontSize: 8.5,
  },
  legend: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendText: { color: colors.textMuted, fontSize: 7.5 },
  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  empty: {
    paddingVertical: 18,
    color: colors.textMuted,
    textAlign: "center",
  },
  userRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rank: {
    width: 27,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 17,
  },
  userCopy: { flex: 1 },
  userEmail: { color: colors.text, fontSize: 10.5, fontWeight: "800" },
  userMeta: { marginTop: 4, color: colors.textMuted, fontSize: 8.5 },
  userValues: { alignItems: "flex-end" },
  userCost: { color: colors.goldLight, fontSize: 10, fontWeight: "900" },
  userBalance: { marginTop: 4, color: colors.textMuted, fontSize: 8 },
  projectionCard: {
    marginBottom: 9,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  projectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  projectionUsers: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  projectionMargin: {
    color: colors.goldLight,
    fontSize: 12,
    fontWeight: "900",
  },
  projectionMarginLoss: { color: "#F28B82" },
  projectionMeta: {
    marginTop: 7,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },
  noteCard: {
    padding: 14,
    flexDirection: "row",
    gap: 10,
    borderRadius: 16,
    backgroundColor: "rgba(241,188,79,0.06)",
  },
  noteCopy: { flex: 1 },
  noteText: {
    marginBottom: 5,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },
});
