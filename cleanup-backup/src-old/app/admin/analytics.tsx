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
  getAdminAnalytics,
  type AnalyticsPayload,
} from "../../features/admin/AdminAnalyticsService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const EMPTY: AnalyticsPayload = {
  overview: {
    usersTotal: 0,
    newUsersToday: 0,
    active1d: 0,
    active7d: 0,
    active30d: 0,
    wasil1d: 0,
    wasil7d: 0,
    wasil30d: 0,
    creditsSpentLifetime: 0,
  },
  daily: [],
  modules: [],
};

const MODULE_LABELS: Record<string, string> = {
  home: "Accueil",
  quran: "Coran",
  audio: "Audio",
  hadith: "Hadith",
  dua: "Dou‘as",
  dhikr: "Dhikr",
  mosques: "Mosquées",
  qibla: "Qibla",
  goals: "Objectifs",
  calendar: "Calendrier",
  profile: "Profil",
  wasil: "Wasil",
  premium: "Premium",
  other: "Autres",
};

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={18} color={colors.goldLight} />
      <Text style={styles.metricValue}>{value.toLocaleString("fr-FR")}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function AdminAnalyticsScreen() {
  const [payload, setPayload] = useState(EMPTY);
  const [period, setPeriod] = useState<7 | 30 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        setPayload(await getAdminAnalytics(period));
      } catch (error) {
        Alert.alert(
          "Statistiques",
          error instanceof Error ? error.message : "Chargement impossible.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const maxDaily = useMemo(
    () =>
      Math.max(
        1,
        ...payload.daily.map((point) =>
          Math.max(point.activeUsers, point.wasilQuestions),
        ),
      ),
    [payload.daily],
  );

  const maxModule = useMemo(
    () => Math.max(1, ...payload.modules.map((row) => row.opens)),
    [payload.modules],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>Statistiques OUMMAH</Text>
        </View>

        <Pressable onPress={() => void load()} style={styles.headerButton}>
          <Ionicons name="refresh" size={20} color={colors.goldLight} />
        </Pressable>
      </View>

      <View style={styles.periodRow}>
        {([7, 30, 90] as const).map((item) => (
          <Pressable
            key={item}
            onPress={() => setPeriod(item)}
            style={[
              styles.periodButton,
              period === item && styles.periodButtonActive,
            ]}
          >
            <Text
              style={[
                styles.periodText,
                period === item && styles.periodTextActive,
              ]}
            >
              {item} jours
            </Text>
          </Pressable>
        ))}
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
          <Text style={styles.sectionTitle}>Audience</Text>
          <View style={styles.grid}>
            <Metric
              icon="people-outline"
              label="Utilisateurs"
              value={payload.overview.usersTotal}
            />
            <Metric
              icon="person-add-outline"
              label="Nouveaux aujourd’hui"
              value={payload.overview.newUsersToday}
            />
            <Metric
              icon="pulse-outline"
              label="Actifs 24 h"
              value={payload.overview.active1d}
            />
            <Metric
              icon="calendar-outline"
              label="Actifs 7 jours"
              value={payload.overview.active7d}
            />
            <Metric
              icon="analytics-outline"
              label="Actifs 30 jours"
              value={payload.overview.active30d}
            />
            <Metric
              icon="flash-outline"
              label="Crédits consommés"
              value={payload.overview.creditsSpentLifetime}
            />
          </View>

          <Text style={styles.sectionTitle}>Wasil</Text>
          <View style={styles.grid}>
            <Metric
              icon="chatbubble-ellipses-outline"
              label="Questions 24 h"
              value={payload.overview.wasil1d}
            />
            <Metric
              icon="chatbubbles-outline"
              label="Questions 7 jours"
              value={payload.overview.wasil7d}
            />
            <Metric
              icon="sparkles-outline"
              label="Questions 30 jours"
              value={payload.overview.wasil30d}
            />
          </View>

          <Text style={styles.sectionTitle}>Évolution quotidienne</Text>
          <View style={styles.chartCard}>
            {payload.daily.length === 0 ? (
              <Text style={styles.empty}>
                Les données commenceront à apparaître après utilisation de cette
                version.
              </Text>
            ) : (
              payload.daily.map((point) => (
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
                        styles.bar,
                        {
                          width: `${Math.max(
                            2,
                            (point.activeUsers / maxDaily) * 100,
                          )}%`,
                        },
                      ]}
                    />
                    <View
                      style={[
                        styles.bar,
                        styles.wasilBar,
                        {
                          width: `${Math.max(
                            2,
                            (point.wasilQuestions / maxDaily) * 100,
                          )}%`,
                        },
                      ]}
                    />
                  </View>

                  <Text style={styles.dayValue}>
                    {point.activeUsers} / {point.wasilQuestions}
                  </Text>
                </View>
              ))
            )}

            <View style={styles.legend}>
              <Text style={styles.legendText}>Or : actifs</Text>
              <Text style={styles.legendText}>Clair : questions Wasil</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Modules les plus utilisés</Text>
          <View style={styles.moduleCard}>
            {payload.modules.length === 0 ? (
              <Text style={styles.empty}>Aucune ouverture enregistrée.</Text>
            ) : (
              payload.modules.map((row, index) => (
                <View key={row.module} style={styles.moduleRow}>
                  <Text style={styles.rank}>{index + 1}</Text>
                  <View style={styles.moduleCopy}>
                    <View style={styles.moduleTop}>
                      <Text style={styles.moduleName}>
                        {MODULE_LABELS[row.module] ?? row.module}
                      </Text>
                      <Text style={styles.moduleValue}>
                        {row.opens.toLocaleString("fr-FR")}
                      </Text>
                    </View>

                    <View style={styles.track}>
                      <View
                        style={[
                          styles.fill,
                          {
                            width: `${Math.max(
                              3,
                              (row.opens / maxModule) * 100,
                            )}%`,
                          },
                        ]}
                      />
                    </View>

                    <Text style={styles.unique}>
                      {row.uniqueUsers} utilisateur
                      {row.uniqueUsers === 1 ? "" : "s"} unique
                      {row.uniqueUsers === 1 ? "" : "s"}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.noteCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.goldLight}
            />
            <Text style={styles.note}>
              Les statistiques d’activité commencent à être collectées à partir
              de l’installation de cette version. Les inscriptions et le total
              des crédits consommés restent calculés sur les données existantes.
            </Text>
          </View>
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
  periodRow: { padding: 12, flexDirection: "row", gap: 8 },
  periodButton: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  periodButtonActive: { backgroundColor: colors.goldLight },
  periodText: { color: colors.textMuted, fontSize: 10, fontWeight: "800" },
  periodTextActive: { color: colors.background },
  loader: { marginTop: 70 },
  content: { padding: 18, paddingBottom: 55 },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 11,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  metric: {
    width: "48%",
    minHeight: 112,
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
    fontSize: 23,
  },
  metricLabel: { marginTop: 3, color: colors.textMuted, fontSize: 9.5 },
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
  bar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.goldLight,
  },
  wasilBar: { opacity: 0.4 },
  dayValue: {
    width: 48,
    color: colors.textSecondary,
    textAlign: "right",
    fontSize: 8.5,
  },
  legend: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  legendText: { color: colors.textMuted, fontSize: 8 },
  moduleCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  moduleRow: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  rank: {
    width: 25,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 17,
  },
  moduleCopy: { flex: 1 },
  moduleTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  moduleName: { color: colors.text, fontSize: 11, fontWeight: "800" },
  moduleValue: { color: colors.goldLight, fontSize: 10, fontWeight: "900" },
  track: {
    height: 6,
    marginTop: 7,
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: colors.background,
  },
  fill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.goldLight,
  },
  unique: { marginTop: 5, color: colors.textMuted, fontSize: 8.5 },
  empty: {
    paddingVertical: 18,
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 15,
  },
  noteCard: {
    marginTop: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 16,
    backgroundColor: "rgba(241,188,79,0.06)",
  },
  note: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 9.5,
    lineHeight: 15,
  },
});
