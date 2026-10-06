import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AdminScreen, adminStyles, Card, Loading, SectionTitle } from "../../components/admin/AdminUI";
import { getAdminAnalytics, type AnalyticsPayload } from "../../features/admin/AdminAnalyticsService";
import { getRevenueDashboard, type RevenueDashboard } from "../../features/admin/RevenueCatAdminService";
import { getWasilFinanceDashboard, type WasilFinanceDashboard } from "../../features/admin/WasilFinanceService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Block<T> = { data: T | null; error: string };
const empty = <T,>(): Block<T> => ({ data: null, error: "" });

const number = (value: number) => Math.round(value).toLocaleString("fr-FR");
const money = (value: number) => `${value.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} $`;

const PROFITABILITY: Record<WasilFinanceDashboard["overview"]["profitability"], { label: string; color: string }> = {
  very_profitable: { label: "Très rentable", color: colors.success },
  profitable: { label: "Rentable", color: colors.success },
  watch: { label: "À surveiller", color: colors.goldLight },
  loss: { label: "À perte", color: colors.danger },
};

export default function AdminNumbers() {
  const [analytics, setAnalytics] = useState<Block<AnalyticsPayload>>(empty);
  const [revenue, setRevenue] = useState<Block<RevenueDashboard>>(empty);
  const [wasil, setWasil] = useState<Block<WasilFinanceDashboard>>(empty);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (pull = false) => {
    if (pull) setRefreshing(true);
    const settle = <T,>(task: Promise<T>, set: (block: Block<T>) => void) =>
      task.then((data) => set({ data, error: "" })).catch((error: unknown) => set({ data: null, error: error instanceof Error ? error.message : "Non chargé." }));
    await Promise.all([settle(getAdminAnalytics(30), setAnalytics), settle(getRevenueDashboard(), setRevenue), settle(getWasilFinanceDashboard(), setWasil)]);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const users = analytics.data?.overview;
  const sales = revenue.data?.overview;
  const ai = wasil.data?.overview;
  const profit = ai ? PROFITABILITY[ai.profitability] : null;

  return (
    <AdminScreen title="Chiffres" onRefresh={() => void load(true)} refreshing={refreshing}>
      <SectionTitle>Utilisateurs</SectionTitle>
      <BlockView block={analytics} details="/admin/analytics">
        {users ? (
          <>
            <View style={styles.grid}>
              <Stat value={number(users.usersTotal)} label="comptes" big />
              <Stat value={`+${number(users.newUsersToday)}`} label="aujourd’hui" />
            </View>
            <View style={styles.grid}>
              <Stat value={number(users.active1d)} label="actifs 24 h" />
              <Stat value={number(users.active7d)} label="actifs 7 j" />
              <Stat value={number(users.active30d)} label="actifs 30 j" />
            </View>
          </>
        ) : null}
      </BlockView>

      <SectionTitle>Revenus</SectionTitle>
      <BlockView block={revenue} details="/admin/revenuecat-finance">
        {sales ? (
          <>
            <View style={styles.grid}>
              <Stat value={money(sales.revenue30dUsd)} label="sur 30 jours" big />
              <Stat value={money(sales.revenue7dUsd)} label="sur 7 jours" />
            </View>
            <View style={styles.grid}>
              <Stat value={number(sales.activeSubscriptions)} label="abonnés actifs" />
              <Stat value={number(sales.trialsActive)} label="essais en cours" />
              <Stat value={money(sales.refunds30dUsd)} label="remboursés 30 j" />
            </View>
            {sales.billingIssuesActive > 0 ? <Text style={[adminStyles.meta, { color: colors.danger }]}>{sales.billingIssuesActive} problème(s) de paiement en cours</Text> : null}
          </>
        ) : null}
      </BlockView>

      <SectionTitle>Wasil</SectionTitle>
      <BlockView block={wasil} details="/admin/wasil-finance">
        {ai && profit ? (
          <>
            <Text style={[styles.badge, { color: profit.color, borderColor: profit.color }]}>{profit.label}</Text>
            <View style={styles.grid}>
              <Stat value={money(ai.netMargin30dUsd)} label="marge nette 30 j" big />
              <Stat value={number(ai.questions30d)} label="questions 30 j" />
            </View>
            <View style={styles.grid}>
              <Stat value={money(ai.revenue30dUsd)} label="ventes 30 j" />
              <Stat value={money(ai.aiCost30dUsd)} label="coût IA 30 j" />
              <Stat value={money(ai.averageCostPerQuestionUsd)} label="par question" />
            </View>
          </>
        ) : null}
      </BlockView>

      <SectionTitle>Modules les plus ouverts (30 j)</SectionTitle>
      <BlockView block={analytics} details="/admin/analytics">
        {analytics.data
          ? [...analytics.data.modules].sort((a, b) => b.opens - a.opens).slice(0, 8).map((row, index, all) => (
              <View key={row.module} style={styles.moduleRow}>
                <Text style={styles.moduleName}>{row.module}</Text>
                <View style={styles.bar}><View style={[styles.barFill, { width: `${Math.max(4, (row.opens / Math.max(1, all[0].opens)) * 100)}%` }]} /></View>
                <Text style={styles.moduleValue}>{number(row.opens)}</Text>
              </View>
            ))
          : null}
      </BlockView>
    </AdminScreen>
  );
}

function BlockView<T>({ block, details, children }: { block: Block<T>; details: Href; children: ReactNode }) {
  return (
    <Card>
      {block.error ? <Text style={adminStyles.rowText}>{block.error}</Text> : !block.data ? <Loading /> : children}
      <Pressable onPress={() => router.push(details)} style={styles.details} accessibilityRole="button">
        <Text style={styles.detailsText}>Voir le détail</Text>
        <Ionicons name="chevron-forward" size={15} color={colors.goldLight} />
      </Pressable>
    </Card>
  );
}

function Stat({ value, label, big = false }: { value: string; label: string; big?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, big && styles.statBig]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", gap: 10, marginBottom: 10 },
  stat: { flex: 1 },
  statValue: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 26 },
  statBig: { color: colors.goldLight, fontSize: 36 },
  statLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5 },
  badge: { alignSelf: "flex-start", marginBottom: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, fontFamily: typography.sans, fontSize: 12.5, fontWeight: "800" },
  moduleRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  moduleName: { width: 110, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13.5 },
  bar: { flex: 1, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, backgroundColor: colors.goldLight },
  moduleValue: { width: 54, textAlign: "right", color: colors.text, fontFamily: typography.sans, fontSize: 13.5, fontWeight: "700" },
  details: { marginTop: 6, flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  detailsText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 14, fontWeight: "800" },
});
