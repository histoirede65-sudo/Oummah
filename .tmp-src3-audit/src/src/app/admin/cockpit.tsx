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
  getFounderCockpit,
  type FounderCockpit,
} from "../../features/admin/FounderCockpitService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const EMPTY: FounderCockpit = {
  status: "stable",
  statusLabel: "OUMMAH stable",
  generatedAt: new Date().toISOString(),
  users: {
    total: 0,
    newToday: 0,
    active1d: 0,
    active7d: 0,
    active30d: 0,
  },
  premium: {
    activeRevenueCat: 0,
    activeManual: 0,
    trials: 0,
    conversionRate: 0,
  },
  finance: {
    revenueTodayUsd: 0,
    revenue30dUsd: 0,
    aiCostTodayUsd: 0,
    aiCost30dUsd: 0,
    marginTodayUsd: 0,
    margin30dUsd: 0,
    projectedMonthRevenueUsd: 0,
    projectedMonthCostUsd: 0,
    projectedMonthMarginUsd: 0,
  },
  wasil: {
    questionsToday: 0,
    questions7d: 0,
    questions30d: 0,
    averageCostPerQuestionUsd: 0,
    creditsAvailable: 0,
    creditsSpent: 0,
  },
  operations: {
    openAlerts: 0,
    criticalAlerts: 0,
    openSupport: 0,
    urgentSupport: 0,
    pendingMosques: 0,
    pendingMosqueReports: 0,
  },
  system: {
    health: "never_run",
    cronEnabled: false,
    lastMonitorRunAt: null,
    failures24h: 0,
  },
  trends: [],
  priorities: [],
};

function usd(value: number) {
  return `${value.toFixed(value < 1 ? 4 : 2)} $`;
}

function statusIcon(
  value: FounderCockpit["status"],
): keyof typeof Ionicons.glyphMap {
  if (value === "growth") return "trending-up-outline";
  if (value === "critical") return "warning-outline";
  if (value === "watch") return "eye-outline";
  return "remove-outline";
}

function Metric({
  icon,
  label,
  value,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  onPress?: () => void;
}) {
  const content = (
    <>
      <Ionicons name={icon} size={18} color={colors.goldLight} />
      <Text style={styles.metricValue}>
        {typeof value === "number"
          ? value.toLocaleString("fr-FR")
          : value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </>
  );

  if (!onPress) {
    return <View style={styles.metric}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.metric,
        pressed && styles.pressed,
      ]}
    >
      {content}
    </Pressable>
  );
}

export default function FounderCockpitScreen() {
  const [data, setData] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      setData(await getFounderCockpit());
    } catch (error) {
      Alert.alert(
        "Centre de pilotage",
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

  const maxTrend = useMemo(
    () =>
      Math.max(
        1,
        ...data.trends.map((point) =>
          Math.max(point.activeUsers, point.wasilQuestions),
        ),
      ),
    [data.trends],
  );

  const isCritical = data.status === "critical";
  const isGrowth = data.status === "growth";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>FONDATEUR</Text>
          <Text style={styles.title}>Centre de pilotage</Text>
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
              styles.hero,
              isCritical && styles.heroCritical,
              isGrowth && styles.heroGrowth,
            ]}
          >
            <View
              style={[
                styles.heroIcon,
                isCritical && styles.heroIconCritical,
              ]}
            >
              <Ionicons
                name={statusIcon(data.status)}
                size={29}
                color={isCritical ? "#F28B82" : colors.goldLight}
              />
            </View>

            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>ÉTAT GLOBAL</Text>
              <Text
                style={[
                  styles.heroTitle,
                  isCritical && styles.heroTitleCritical,
                ]}
              >
                {data.statusLabel}
              </Text>
              <Text style={styles.heroText}>
                Marge 30 jours : {usd(data.finance.margin30dUsd)} ·{" "}
                {data.operations.criticalAlerts} alerte
                {data.operations.criticalAlerts === 1 ? "" : "s"} critique
                {data.operations.criticalAlerts === 1 ? "" : "s"}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Aujourd’hui</Text>
          <View style={styles.grid}>
            <Metric
              icon="people-outline"
              label="Actifs"
              value={data.users.active1d}
              onPress={() => router.push("/admin/analytics")}
            />
            <Metric
              icon="person-add-outline"
              label="Nouveaux inscrits"
              value={data.users.newToday}
              onPress={() => router.push("/admin/analytics")}
            />
            <Metric
              icon="cash-outline"
              label="Revenus"
              value={usd(data.finance.revenueTodayUsd)}
              onPress={() => router.push("/admin/revenuecat-finance")}
            />
            <Metric
              icon="hardware-chip-outline"
              label="Coût Wasil"
              value={usd(data.finance.aiCostTodayUsd)}
              onPress={() => router.push("/admin/wasil-finance")}
            />
            <Metric
              icon="calculator-outline"
              label="Marge"
              value={usd(data.finance.marginTodayUsd)}
              onPress={() => router.push("/admin/wasil-finance")}
            />
            <Metric
              icon="chatbubble-ellipses-outline"
              label="Questions Wasil"
              value={data.wasil.questionsToday}
              onPress={() => router.push("/admin/wasil-finance")}
            />
          </View>

          <Text style={styles.sectionTitle}>Croissance & Premium</Text>
          <View style={styles.grid}>
            <Metric
              icon="people-circle-outline"
              label="Utilisateurs total"
              value={data.users.total}
            />
            <Metric
              icon="calendar-outline"
              label="Actifs 30 jours"
              value={data.users.active30d}
            />
            <Metric
              icon="diamond-outline"
              label="Premium RevenueCat"
              value={data.premium.activeRevenueCat}
              onPress={() => router.push("/admin/revenuecat-finance")}
            />
            <Metric
              icon="gift-outline"
              label="Premium manuels"
              value={data.premium.activeManual}
              onPress={() => router.push("/admin/premium-wasil")}
            />
            <Metric
              icon="flask-outline"
              label="Essais actifs"
              value={data.premium.trials}
            />
            <Metric
              icon="stats-chart-outline"
              label="Conversion"
              value={`${data.premium.conversionRate.toFixed(2)} %`}
            />
          </View>

          <Text style={styles.sectionTitle}>Opérations</Text>
          <View style={styles.grid}>
            <Metric
              icon="warning-outline"
              label="Alertes ouvertes"
              value={data.operations.openAlerts}
              onPress={() => router.push("/admin/alerts")}
            />
            <Metric
              icon="alert-circle-outline"
              label="Alertes critiques"
              value={data.operations.criticalAlerts}
              onPress={() => router.push("/admin/alerts")}
            />
            <Metric
              icon="help-buoy-outline"
              label="Tickets ouverts"
              value={data.operations.openSupport}
              onPress={() => router.push("/admin/support")}
            />
            <Metric
              icon="flame-outline"
              label="Tickets urgents"
              value={data.operations.urgentSupport}
              onPress={() => router.push("/admin/support")}
            />
            <Metric
              icon="business-outline"
              label="Mosquées à valider"
              value={data.operations.pendingMosques}
              onPress={() => router.push("/admin/mosques")}
            />
            <Metric
              icon="flag-outline"
              label="Signalements mosquées"
              value={data.operations.pendingMosqueReports}
              onPress={() => router.push("/admin/mosque-reports")}
            />
          </View>

          <Text style={styles.sectionTitle}>Prévision fin de mois</Text>
          <View style={styles.forecastCard}>
            <View style={styles.forecastRow}>
              <Text style={styles.forecastLabel}>Revenus projetés</Text>
              <Text style={styles.forecastValue}>
                {usd(data.finance.projectedMonthRevenueUsd)}
              </Text>
            </View>
            <View style={styles.forecastRow}>
              <Text style={styles.forecastLabel}>Coûts IA projetés</Text>
              <Text style={styles.forecastValue}>
                {usd(data.finance.projectedMonthCostUsd)}
              </Text>
            </View>
            <View style={styles.forecastDivider} />
            <View style={styles.forecastRow}>
              <Text style={styles.forecastMainLabel}>Marge projetée</Text>
              <Text
                style={[
                  styles.forecastMainValue,
                  data.finance.projectedMonthMarginUsd < 0 &&
                    styles.negative,
                ]}
              >
                {usd(data.finance.projectedMonthMarginUsd)}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Tendance sur 14 jours</Text>
          <View style={styles.chartCard}>
            {data.trends.map((point) => (
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
                      styles.activeBar,
                      {
                        width: `${Math.max(
                          2,
                          (point.activeUsers / maxTrend) * 100,
                        )}%`,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.wasilBar,
                      {
                        width: `${Math.max(
                          2,
                          (point.wasilQuestions / maxTrend) * 100,
                        )}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.dayValue}>
                  {point.activeUsers}/{point.wasilQuestions}
                </Text>
              </View>
            ))}
            <View style={styles.legend}>
              <Text style={styles.legendText}>Or : actifs</Text>
              <Text style={styles.legendText}>Clair : questions Wasil</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Priorités du moment</Text>
          {data.priorities.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="checkmark-done-outline"
                size={26}
                color={colors.goldLight}
              />
              <Text style={styles.emptyTitle}>Aucune priorité critique</Text>
              <Text style={styles.emptyText}>
                Les principaux indicateurs sont sous contrôle.
              </Text>
            </View>
          ) : (
            data.priorities.map((priority, index) => (
              <Pressable
                key={`${priority.title}-${index}`}
                onPress={() => router.push(priority.route as never)}
                style={[
                  styles.priorityCard,
                  priority.severity === "critical" &&
                    styles.priorityCritical,
                ]}
              >
                <Ionicons
                  name={
                    priority.severity === "critical"
                      ? "warning-outline"
                      : "information-circle-outline"
                  }
                  size={20}
                  color={
                    priority.severity === "critical"
                      ? "#F28B82"
                      : colors.goldLight
                  }
                />
                <View style={styles.priorityCopy}>
                  <Text style={styles.priorityTitle}>{priority.title}</Text>
                  <Text style={styles.priorityText}>
                    {priority.description}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.goldLight}
                />
              </Pressable>
            ))
          )}

          <Pressable
            onPress={() => router.push("/admin/alert-settings")}
            style={styles.systemCard}
          >
            <View style={styles.systemIcon}>
              <Ionicons
                name={
                  data.system.health === "healthy"
                    ? "shield-checkmark-outline"
                    : "pulse-outline"
                }
                size={22}
                color={
                  data.system.health === "healthy"
                    ? colors.goldLight
                    : "#F28B82"
                }
              />
            </View>
            <View style={styles.systemCopy}>
              <Text style={styles.systemTitle}>Santé du système</Text>
              <Text style={styles.systemText}>
                {data.system.health === "healthy"
                  ? "Surveillance opérationnelle"
                  : "Surveillance à vérifier"}{" "}
                · {data.system.failures24h} échec
                {data.system.failures24h === 1 ? "" : "s"} sur 24 h
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.goldLight} />
          </Pressable>
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
    fontSize: 21,
  },
  loader: { marginTop: 70 },
  content: { padding: 18, paddingBottom: 55 },
  hero: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.28)",
    backgroundColor: "rgba(241,188,79,0.06)",
  },
  heroGrowth: {
    borderColor: "rgba(116,210,150,0.32)",
    backgroundColor: "rgba(116,210,150,0.05)",
  },
  heroCritical: {
    borderColor: "rgba(242,139,130,0.36)",
    backgroundColor: "rgba(242,139,130,0.05)",
  },
  heroIcon: {
    width: 57,
    height: 57,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  heroIconCritical: {
    backgroundColor: "rgba(242,139,130,0.10)",
  },
  heroCopy: { flex: 1, marginLeft: 14 },
  heroEyebrow: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    marginTop: 3,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 20,
  },
  heroTitleCritical: { color: "#F28B82" },
  heroText: {
    marginTop: 5,
    color: colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 14,
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
    minHeight: 108,
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
  forecastCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  forecastRow: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  forecastLabel: { color: colors.textSecondary, fontSize: 10.5 },
  forecastValue: { color: colors.text, fontSize: 12, fontWeight: "800" },
  forecastDivider: {
    height: 1,
    marginVertical: 5,
    backgroundColor: colors.border,
  },
  forecastMainLabel: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 14,
  },
  forecastMainValue: {
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 18,
  },
  negative: { color: "#F28B82" },
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
  activeBar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.goldLight,
  },
  wasilBar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.textSecondary,
    opacity: 0.45,
  },
  dayValue: {
    width: 48,
    color: colors.textMuted,
    textAlign: "right",
    fontSize: 8.5,
  },
  legend: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendText: { color: colors.textMuted, fontSize: 8 },
  emptyCard: {
    padding: 24,
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  emptyTitle: {
    marginTop: 9,
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  emptyText: {
    marginTop: 5,
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 9.5,
  },
  priorityCard: {
    minHeight: 76,
    marginBottom: 9,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  priorityCritical: {
    borderColor: "rgba(242,139,130,0.30)",
    backgroundColor: "rgba(242,139,130,0.05)",
  },
  priorityCopy: { flex: 1 },
  priorityTitle: { color: colors.text, fontSize: 11, fontWeight: "800" },
  priorityText: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8.8,
    lineHeight: 13,
  },
  systemCard: {
    minHeight: 74,
    marginTop: 14,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.05)",
  },
  systemIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.09)",
  },
  systemCopy: { flex: 1, marginHorizontal: 11 },
  systemTitle: { color: colors.text, fontSize: 11.5, fontWeight: "800" },
  systemText: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8.8,
    lineHeight: 13,
  },
  pressed: { opacity: 0.74 },
});
