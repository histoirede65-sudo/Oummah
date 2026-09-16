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
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getAdminAlertHealth,
  getAdminAlertSettings,
  runAdminAlertMonitorNow,
  updateAdminAlertSetting,
  type AdminAlertHealth,
  type AdminAlertSetting,
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

function formatDate(value: string | null) {
  if (!value) return "Jamais";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function healthLabel(status: AdminAlertHealth["status"]) {
  if (status === "healthy") return "OPÉRATIONNEL";
  if (status === "warning") return "À SURVEILLER";
  if (status === "critical") return "EN ÉCHEC";
  return "JAMAIS EXÉCUTÉ";
}

export default function AdminAlertSettingsScreen() {
  const [health, setHealth] = useState(EMPTY_HEALTH);
  const [settings, setSettings] = useState<AdminAlertSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [running, setRunning] = useState(false);
  const [actingType, setActingType] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const [nextHealth, nextSettings] = await Promise.all([
        getAdminAlertHealth(),
        getAdminAlertSettings(),
      ]);
      setHealth(nextHealth);
      setSettings(nextSettings);
    } catch (error) {
      Alert.alert(
        "Surveillance des alertes",
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

  const runNow = async () => {
    if (running) return;
    setRunning(true);

    try {
      await runAdminAlertMonitorNow();
      await load(true);
      Alert.alert("Contrôle terminé", "Le moteur d’alertes a été exécuté.");
    } catch (error) {
      Alert.alert(
        "Contrôle impossible",
        error instanceof Error ? error.message : "Réessayez.",
      );
    } finally {
      setRunning(false);
    }
  };

  const updateSetting = async (
    row: AdminAlertSetting,
    patch: Partial<Pick<AdminAlertSetting, "enabled" | "criticalPushEnabled">>,
  ) => {
    const enabled = patch.enabled ?? row.enabled;
    const criticalPushEnabled =
      patch.criticalPushEnabled ?? row.criticalPushEnabled;

    setActingType(row.alertType);
    setSettings((current) =>
      current.map((item) =>
        item.alertType === row.alertType
          ? { ...item, enabled, criticalPushEnabled }
          : item,
      ),
    );

    try {
      await updateAdminAlertSetting(
        row.alertType,
        enabled,
        criticalPushEnabled,
      );
      await load(true);
    } catch (error) {
      await load(true);
      Alert.alert(
        "Réglage impossible",
        error instanceof Error ? error.message : "Réessayez.",
      );
    } finally {
      setActingType(null);
    }
  };

  const healthCritical =
    health.status === "critical" || health.status === "never_run";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>Surveillance automatique</Text>
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
              styles.healthCard,
              healthCritical && styles.healthCardCritical,
            ]}
          >
            <View
              style={[
                styles.healthIcon,
                healthCritical && styles.healthIconCritical,
              ]}
            >
              <Ionicons
                name={healthCritical ? "warning-outline" : "shield-checkmark-outline"}
                size={25}
                color={healthCritical ? "#F28B82" : colors.goldLight}
              />
            </View>

            <View style={styles.healthCopy}>
              <Text style={styles.healthEyebrow}>SANTÉ DU MOTEUR</Text>
              <Text
                style={[
                  styles.healthTitle,
                  healthCritical && styles.healthTitleCritical,
                ]}
              >
                {healthLabel(health.status)}
              </Text>
              <Text style={styles.healthText}>
                Dernier contrôle : {formatDate(health.lastRunAt)}
              </Text>
              <Text style={styles.healthText}>
                Cron : {health.cronEnabled ? health.cronSchedule ?? "activé" : "désactivé"}
              </Text>
            </View>
          </View>

          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{health.runs24h}</Text>
              <Text style={styles.metricLabel}>Exécutions 24 h</Text>
            </View>
            <View style={styles.metric}>
              <Text
                style={[
                  styles.metricValue,
                  health.failures24h > 0 && styles.metricValueCritical,
                ]}
              >
                {health.failures24h}
              </Text>
              <Text style={styles.metricLabel}>Échecs 24 h</Text>
            </View>
          </View>

          {health.lastError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Dernière erreur</Text>
              <Text style={styles.errorText}>{health.lastError}</Text>
              <Text style={styles.errorDate}>
                {formatDate(health.lastFailureAt)}
              </Text>
            </View>
          ) : null}

          <Pressable
            disabled={running}
            onPress={() => void runNow()}
            style={[styles.runButton, running && styles.disabled]}
          >
            {running ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Ionicons
                name="play-outline"
                size={19}
                color={colors.background}
              />
            )}
            <Text style={styles.runText}>
              {running ? "Contrôle en cours…" : "Lancer un contrôle maintenant"}
            </Text>
          </Pressable>

          <Text style={styles.sectionTitle}>Types d’alertes</Text>

          {settings.map((row) => {
            const acting = actingType === row.alertType;

            return (
              <View key={row.alertType} style={styles.settingCard}>
                <View style={styles.settingTop}>
                  <View style={styles.settingCopy}>
                    <Text style={styles.settingTitle}>{row.label}</Text>
                    <Text style={styles.settingDescription}>
                      {row.description}
                    </Text>
                  </View>

                  <Switch
                    disabled={acting}
                    value={row.enabled}
                    onValueChange={(value) =>
                      void updateSetting(row, { enabled: value })
                    }
                    trackColor={{
                      false: colors.border,
                      true: colors.goldMuted,
                    }}
                    thumbColor={
                      row.enabled ? colors.goldLight : colors.textMuted
                    }
                  />
                </View>

                <View style={styles.pushRow}>
                  <View style={styles.pushCopy}>
                    <Ionicons
                      name="notifications-outline"
                      size={17}
                      color={
                        row.enabled && row.criticalPushEnabled
                          ? colors.goldLight
                          : colors.textMuted
                      }
                    />
                    <Text style={styles.pushText}>
                      Push admin si l’alerte est critique
                    </Text>
                  </View>

                  <Switch
                    disabled={acting || !row.enabled}
                    value={row.enabled && row.criticalPushEnabled}
                    onValueChange={(value) =>
                      void updateSetting(row, {
                        criticalPushEnabled: value,
                      })
                    }
                    trackColor={{
                      false: colors.border,
                      true: colors.goldMuted,
                    }}
                    thumbColor={
                      row.enabled && row.criticalPushEnabled
                        ? colors.goldLight
                        : colors.textMuted
                    }
                  />
                </View>
              </View>
            );
          })}

          <View style={styles.noteCard}>
            <Ionicons
              name="time-outline"
              size={20}
              color={colors.goldLight}
            />
            <Text style={styles.noteText}>
              Le contrôle automatique est planifié chaque heure. Les
              notifications push critiques sont envoyées aux appareils des
              comptes présents dans l’équipe administratrice.
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
    fontSize: 19,
  },
  loader: { marginTop: 70 },
  content: { padding: 18, paddingBottom: 55 },
  healthCard: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.28)",
    backgroundColor: "rgba(241,188,79,0.06)",
  },
  healthCardCritical: {
    borderColor: "rgba(242,139,130,0.35)",
    backgroundColor: "rgba(242,139,130,0.05)",
  },
  healthIcon: {
    width: 51,
    height: 51,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  healthIconCritical: {
    backgroundColor: "rgba(242,139,130,0.10)",
  },
  healthCopy: { flex: 1, marginLeft: 13 },
  healthEyebrow: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  healthTitle: {
    marginTop: 3,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 18,
  },
  healthTitleCritical: { color: "#F28B82" },
  healthText: { marginTop: 4, color: colors.textMuted, fontSize: 9.5 },
  metrics: { marginTop: 10, flexDirection: "row", gap: 9 },
  metric: {
    flex: 1,
    minHeight: 83,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  metricValue: {
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 22,
  },
  metricValueCritical: { color: "#F28B82" },
  metricLabel: { marginTop: 4, color: colors.textMuted, fontSize: 8.5 },
  errorCard: {
    marginTop: 10,
    padding: 13,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(242,139,130,0.28)",
    backgroundColor: "rgba(242,139,130,0.05)",
  },
  errorTitle: { color: "#F28B82", fontSize: 10, fontWeight: "900" },
  errorText: {
    marginTop: 6,
    color: colors.textSecondary,
    fontSize: 9.5,
    lineHeight: 15,
  },
  errorDate: { marginTop: 5, color: colors.textMuted, fontSize: 8 },
  runButton: {
    minHeight: 50,
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.goldLight,
  },
  runText: {
    color: colors.background,
    fontSize: 11.5,
    fontWeight: "900",
  },
  disabled: { opacity: 0.5 },
  sectionTitle: {
    marginTop: 23,
    marginBottom: 11,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  settingCard: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  settingTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingCopy: { flex: 1 },
  settingTitle: { color: colors.text, fontSize: 11.5, fontWeight: "800" },
  settingDescription: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 14,
  },
  pushRow: {
    minHeight: 47,
    marginTop: 12,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pushCopy: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  pushText: { color: colors.textSecondary, fontSize: 9.5 },
  noteCard: {
    marginTop: 9,
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
