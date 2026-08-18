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
  getAdminAlerts,
  getAdminAlertHealth,
  refreshAdminAlerts,
  updateAdminAlert,
  type AdminAlert as AdminAlertRow,
  type AdminAlertSeverity,
  type AdminAlertStatus,
  type AdminAlertHealth,
} from "../../features/admin/AdminAlertsService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const EMPTY_HEALTH: AdminAlertHealth = {
  status: "never_run",
  lastRunAt: null,
  lastSuccessAt: null,
  lastFailureAt: null,
  lastError: null,
  cronEnabled: false,
  cronSchedule: null,
  runs24h: 0,
  failures24h: 0,
};

const TABS: Array<{ value: AdminAlertStatus; label: string }> = [
  { value: "open", label: "Ouvertes" },
  { value: "resolved", label: "Résolues" },
  { value: "ignored", label: "Ignorées" },
];

function severityLabel(severity: AdminAlertSeverity) {
  if (severity === "critical") return "CRITIQUE";
  if (severity === "warning") return "ATTENTION";
  return "INFO";
}

function iconFor(type: string): keyof typeof Ionicons.glyphMap {
  if (type.includes("revenuecat")) return "diamond-outline";
  if (type.includes("refund")) return "return-down-back-outline";
  if (type.includes("billing")) return "card-outline";
  if (type.includes("wasil")) return "flash-outline";
  if (type.includes("premium")) return "time-outline";
  if (type.includes("credit")) return "wallet-outline";
  return "warning-outline";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminAlertsScreen() {
  const [status, setStatus] = useState<AdminAlertStatus>("open");
  const [rows, setRows] = useState<AdminAlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [health, setHealth] = useState<AdminAlertHealth>(EMPTY_HEALTH);

  const load = useCallback(
    async (silent = false, detect = false) => {
      if (!silent) setLoading(true);

      try {
        if (detect) {
          await refreshAdminAlerts();
        }
        const [nextRows, nextHealth] = await Promise.all([
          getAdminAlerts(status),
          getAdminAlertHealth().catch(() => EMPTY_HEALTH),
        ]);
        setRows(nextRows);
        setHealth(nextHealth);
      } catch (error) {
        Alert.alert(
          "Alertes administrateur",
          error instanceof Error ? error.message : "Chargement impossible.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [status],
  );

  useFocusEffect(
    useCallback(() => {
      void load(false, true);
    }, [load]),
  );

  const handle = useCallback(
    async (row: AdminAlertRow, nextStatus: AdminAlertStatus) => {
      const label =
        nextStatus === "resolved"
          ? "marquer comme résolue"
          : nextStatus === "ignored"
            ? "ignorer"
            : "rouvrir";

      Alert.alert(
        "Confirmer l’action",
        `Voulez-vous ${label} cette alerte ?`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Confirmer",
            style: nextStatus === "ignored" ? "destructive" : "default",
            onPress: async () => {
              setActingId(row.id);
              try {
                await updateAdminAlert(row.id, nextStatus);
                await load(true);
              } catch (error) {
                Alert.alert(
                  "Action impossible",
                  error instanceof Error ? error.message : "Réessayez.",
                );
              } finally {
                setActingId(null);
              }
            },
          },
        ],
      );
    },
    [load],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>Centre d’alertes</Text>
        </View>

        <Pressable
          onPress={() => router.push("/admin/alert-settings")}
          style={styles.headerButton}
        >
          <Ionicons name="settings-outline" size={20} color={colors.goldLight} />
        </Pressable>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.value}
            onPress={() => setStatus(tab.value)}
            style={[
              styles.tab,
              status === tab.value && styles.tabActive,
            ]}
          >
            <Text
              style={[
                styles.tabText,
                status === tab.value && styles.tabTextActive,
              ]}
            >
              {tab.label}
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
                void load(true, true);
              }}
              tintColor={colors.goldLight}
            />
          }
        >
          <Pressable
            onPress={() => router.push("/admin/alert-settings")}
            style={[
              styles.monitorCard,
              health.status === "critical" && styles.monitorCardCritical,
            ]}
          >
            <View style={styles.monitorIcon}>
              <Ionicons
                name={
                  health.status === "healthy"
                    ? "shield-checkmark-outline"
                    : "warning-outline"
                }
                size={21}
                color={
                  health.status === "healthy"
                    ? colors.goldLight
                    : "#F28B82"
                }
              />
            </View>
            <View style={styles.monitorCopy}>
              <Text style={styles.monitorTitle}>Surveillance automatique</Text>
              <Text style={styles.monitorText}>
                {health.status === "healthy"
                  ? "Moteur opérationnel"
                  : health.status === "warning"
                    ? "Moteur à surveiller"
                    : health.status === "critical"
                      ? "Échec de surveillance"
                      : "Jamais exécuté"}
                {" · "}
                {health.lastRunAt
                  ? new Date(health.lastRunAt).toLocaleString("fr-FR")
                  : "aucun contrôle"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.goldLight} />
          </Pressable>

          {rows.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons
                name="checkmark-done-outline"
                size={29}
                color={colors.goldLight}
              />
              <Text style={styles.emptyTitle}>Aucune alerte</Text>
              <Text style={styles.emptyText}>
                Aucune alerte dans cette catégorie actuellement.
              </Text>
            </View>
          ) : (
            rows.map((row) => {
              const acting = actingId === row.id;

              return (
                <View
                  key={row.id}
                  style={[
                    styles.card,
                    row.severity === "critical" && styles.criticalCard,
                  ]}
                >
                  <View style={styles.cardTop}>
                    <View
                      style={[
                        styles.iconWrap,
                        row.severity === "critical" &&
                          styles.criticalIconWrap,
                      ]}
                    >
                      <Ionicons
                        name={iconFor(row.alertType)}
                        size={19}
                        color={
                          row.severity === "critical"
                            ? "#F28B82"
                            : colors.goldLight
                        }
                      />
                    </View>

                    <View style={styles.cardCopy}>
                      <Text style={styles.alertTitle}>{row.title}</Text>
                      <Text style={styles.alertType}>{row.alertType}</Text>
                    </View>

                    <View
                      style={[
                        styles.severityBadge,
                        row.severity === "critical" &&
                          styles.criticalBadge,
                        row.severity === "info" && styles.infoBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityText,
                          row.severity === "critical" &&
                            styles.criticalText,
                        ]}
                      >
                        {severityLabel(row.severity)}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.description}>{row.description}</Text>

                  <View style={styles.dateBlock}>
                    <Text style={styles.dateText}>
                      Détectée : {formatDate(row.firstDetectedAt)}
                    </Text>
                    <Text style={styles.dateText}>
                      Dernière détection : {formatDate(row.lastDetectedAt)}
                    </Text>
                  </View>

                  {row.handledByEmail ? (
                    <Text style={styles.handledText}>
                      Traité par {row.handledByEmail}
                    </Text>
                  ) : null}

                  {status === "open" ? (
                    <View style={styles.actions}>
                      <Pressable
                        disabled={acting}
                        onPress={() => void handle(row, "ignored")}
                        style={[styles.actionButton, styles.ignoreButton]}
                      >
                        <Text style={styles.ignoreText}>Ignorer</Text>
                      </Pressable>

                      <Pressable
                        disabled={acting}
                        onPress={() => void handle(row, "resolved")}
                        style={styles.actionButton}
                      >
                        <Text style={styles.actionText}>
                          {acting ? "…" : "Résoudre"}
                        </Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      disabled={acting}
                      onPress={() => void handle(row, "open")}
                      style={styles.reopenButton}
                    >
                      <Ionicons
                        name="refresh-outline"
                        size={16}
                        color={colors.goldLight}
                      />
                      <Text style={styles.reopenText}>Rouvrir l’alerte</Text>
                    </Pressable>
                  )}
                </View>
              );
            })
          )}

          <View style={styles.noteCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.goldLight}
            />
            <Text style={styles.noteText}>
              La détection est recalculée lorsque cette page ou le tableau de
              bord admin est actualisé. Les alertes déjà résolues ne sont pas
              rouvertes automatiquement pour la même source.
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
  tabs: { padding: 12, flexDirection: "row", gap: 8 },
  tab: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.goldLight },
  tabText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: "800",
  },
  tabTextActive: { color: colors.background },
  loader: { marginTop: 70 },
  content: { padding: 18, paddingBottom: 55 },
  monitorCard: {
    minHeight: 70,
    marginBottom: 12,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.06)",
  },
  monitorCardCritical: {
    borderColor: "rgba(242,139,130,0.30)",
    backgroundColor: "rgba(242,139,130,0.05)",
  },
  monitorIcon: {
    width: 41,
    height: 41,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.09)",
  },
  monitorCopy: { flex: 1, marginHorizontal: 11 },
  monitorTitle: { color: colors.text, fontSize: 11, fontWeight: "800" },
  monitorText: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8.5,
    lineHeight: 13,
  },
  emptyCard: {
    marginTop: 45,
    padding: 28,
    alignItems: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  emptyTitle: {
    marginTop: 10,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  emptyText: {
    marginTop: 5,
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 10,
  },
  card: {
    marginBottom: 11,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  criticalCard: {
    borderColor: "rgba(242,139,130,0.35)",
    backgroundColor: "rgba(242,139,130,0.05)",
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  criticalIconWrap: {
    backgroundColor: "rgba(242,139,130,0.10)",
  },
  cardCopy: { flex: 1, marginHorizontal: 11 },
  alertTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  alertType: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  criticalBadge: {
    backgroundColor: "rgba(242,139,130,0.12)",
  },
  infoBadge: {
    backgroundColor: "rgba(116,180,255,0.10)",
  },
  severityText: {
    color: colors.goldLight,
    fontSize: 7.5,
    fontWeight: "900",
  },
  criticalText: { color: "#F28B82" },
  description: {
    marginTop: 12,
    color: colors.textSecondary,
    fontSize: 10.5,
    lineHeight: 16,
  },
  dateBlock: {
    marginTop: 11,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateText: {
    marginTop: 3,
    color: colors.textMuted,
    fontSize: 8.5,
  },
  handledText: {
    marginTop: 7,
    color: colors.goldLight,
    fontSize: 8.5,
  },
  actions: { marginTop: 13, flexDirection: "row", gap: 8 },
  actionButton: {
    flex: 1,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.goldLight,
  },
  actionText: {
    color: colors.background,
    fontSize: 10.5,
    fontWeight: "900",
  },
  ignoreButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  ignoreText: {
    color: colors.textSecondary,
    fontSize: 10.5,
    fontWeight: "800",
  },
  reopenButton: {
    minHeight: 42,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.goldLight,
  },
  reopenText: {
    color: colors.goldLight,
    fontSize: 10,
    fontWeight: "800",
  },
  noteCard: {
    marginTop: 10,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    borderRadius: 16,
    backgroundColor: "rgba(241,188,79,0.06)",
  },
  noteText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 15,
  },
});
