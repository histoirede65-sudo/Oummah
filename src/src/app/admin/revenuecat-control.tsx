import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getRevenueCatControl,
  reconcileRevenueCatSubscription,
  type RevenueCatControlPayload,
  type RevenueCatUnlinkedSubscription,
} from "../../features/admin/RevenueCatControlService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const EMPTY: RevenueCatControlPayload = {
  summary: {
    events24h: 0,
    productionEvents24h: 0,
    sandboxEvents24h: 0,
    testEvents24h: 0,
    unlinkedSubscriptions: 0,
    staleSubscriptions: 0,
  },
  events: [],
  unlinked: [],
};

function Metric({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={18} color={colors.goldLight} />
      <Text style={styles.metricValue}>{value.toLocaleString("fr-FR")}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function RevenueCatControlScreen() {
  const [data, setData] = useState(EMPTY);
  const [selected, setSelected] =
    useState<RevenueCatUnlinkedSubscription | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      setData(await getRevenueCatControl());
    } catch (error) {
      Alert.alert(
        "Contrôle RevenueCat",
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

  const openReconcile = (row: RevenueCatUnlinkedSubscription) => {
    setSelected(row);
    setEmail(row.suggestedEmail ?? "");
  };

  const reconcile = async () => {
    if (!selected || saving) return;

    const cleanEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      Alert.alert("Adresse invalide", "Saisissez une adresse e-mail valide.");
      return;
    }

    setSaving(true);

    try {
      await reconcileRevenueCatSubscription(
        selected.appUserId,
        selected.productId,
        cleanEmail,
      );
      setSelected(null);
      setEmail("");
      await load(true);
      Alert.alert(
        "Abonnement relié",
        "L’abonnement RevenueCat est maintenant associé au compte OUMMAH.",
      );
    } catch (error) {
      Alert.alert(
        "Réconciliation impossible",
        error instanceof Error ? error.message : "Réessayez.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>Contrôle RevenueCat</Text>
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
          <Text style={styles.sectionTitle}>État du webhook</Text>

          <View style={styles.grid}>
            <Metric
              icon="pulse-outline"
              label="Événements 24 h"
              value={data.summary.events24h}
            />
            <Metric
              icon="cloud-done-outline"
              label="Production 24 h"
              value={data.summary.productionEvents24h}
            />
            <Metric
              icon="flask-outline"
              label="Sandbox 24 h"
              value={data.summary.sandboxEvents24h}
            />
            <Metric
              icon="bug-outline"
              label="Tests 24 h"
              value={data.summary.testEvents24h}
            />
            <Metric
              icon="unlink-outline"
              label="Non reliés"
              value={data.summary.unlinkedSubscriptions}
            />
            <Metric
              icon="time-outline"
              label="Sans mise à jour 30 j"
              value={data.summary.staleSubscriptions}
            />
          </View>

          <Text style={styles.sectionTitle}>Abonnements non reliés</Text>

          {data.unlinked.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.empty}>
                Tous les abonnements réels sont reliés ou aucun abonnement n’a
                encore été reçu.
              </Text>
            </View>
          ) : (
            data.unlinked.map((row) => (
              <View
                key={`${row.appUserId}-${row.productId}`}
                style={styles.unlinkedCard}
              >
                <Text style={styles.product}>{row.productId}</Text>
                <Text style={styles.meta}>{row.appUserId}</Text>
                <Text style={styles.meta}>
                  {row.store ?? "UNKNOWN"} · {row.environment ?? "UNKNOWN"} ·{" "}
                  {row.latestEventType}
                </Text>
                {row.suggestedEmail ? (
                  <Text style={styles.suggestion}>
                    E-mail détecté : {row.suggestedEmail}
                  </Text>
                ) : null}

                <Pressable
                  onPress={() => openReconcile(row)}
                  style={styles.reconcileButton}
                >
                  <Ionicons
                    name="link-outline"
                    size={17}
                    color={colors.background}
                  />
                  <Text style={styles.reconcileText}>
                    Relier à un compte OUMMAH
                  </Text>
                </Pressable>
              </View>
            ))
          )}

          <Text style={styles.sectionTitle}>Derniers événements</Text>

          <View style={styles.card}>
            {data.events.length === 0 ? (
              <Text style={styles.empty}>Aucun événement reçu.</Text>
            ) : (
              data.events.map((event) => (
                <View key={event.eventId} style={styles.eventRow}>
                  <View style={styles.eventCopy}>
                    <Text style={styles.eventType}>{event.eventType}</Text>
                    <Text style={styles.meta}>
                      {event.productId ?? "sans produit"} ·{" "}
                      {event.environment ?? "UNKNOWN"} ·{" "}
                      {event.store ?? "UNKNOWN"}
                    </Text>
                    <Text style={styles.meta}>
                      {new Date(event.receivedAt).toLocaleString("fr-FR")}
                    </Text>
                  </View>
                  <Text style={styles.price}>
                    {event.priceUsd.toFixed(2)} $
                  </Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <Modal
        visible={Boolean(selected)}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Relier l’abonnement</Text>
            <Text style={styles.modalText}>
              Indique l’adresse e-mail exacte du compte OUMMAH concerné.
            </Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="utilisateur@exemple.fr"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
            />

            <View style={styles.modalActions}>
              <Pressable
                disabled={saving}
                onPress={() => setSelected(null)}
                style={[styles.modalButton, styles.cancelButton]}
              >
                <Text style={styles.cancelText}>Annuler</Text>
              </Pressable>

              <Pressable
                disabled={saving}
                onPress={() => void reconcile()}
                style={styles.modalButton}
              >
                {saving ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Text style={styles.confirmText}>Confirmer</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 20,
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
    minHeight: 106,
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
    fontSize: 22,
  },
  metricLabel: { marginTop: 4, color: colors.textMuted, fontSize: 9.5 },
  card: {
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  empty: {
    paddingVertical: 18,
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 10,
    lineHeight: 15,
  },
  unlinkedCard: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(242,139,130,0.25)",
    backgroundColor: "rgba(242,139,130,0.05)",
  },
  product: { color: colors.text, fontSize: 12, fontWeight: "800" },
  meta: { marginTop: 5, color: colors.textMuted, fontSize: 8.5 },
  suggestion: {
    marginTop: 8,
    color: colors.goldLight,
    fontSize: 9.5,
    fontWeight: "700",
  },
  reconcileButton: {
    minHeight: 42,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    backgroundColor: colors.goldLight,
  },
  reconcileText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: "900",
  },
  eventRow: {
    minHeight: 65,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  eventCopy: { flex: 1 },
  eventType: { color: colors.text, fontSize: 10.5, fontWeight: "800" },
  price: { color: colors.goldLight, fontSize: 10.5, fontWeight: "900" },
  modalOverlay: {
    flex: 1,
    padding: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  modalCard: {
    width: "100%",
    padding: 18,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  modalTitle: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 20,
  },
  modalText: {
    marginTop: 7,
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 16,
  },
  input: {
    minHeight: 49,
    marginTop: 16,
    paddingHorizontal: 13,
    color: colors.text,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  modalActions: { marginTop: 15, flexDirection: "row", gap: 8 },
  modalButton: {
    flex: 1,
    minHeight: 45,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.goldLight,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "transparent",
  },
  cancelText: { color: colors.textSecondary, fontWeight: "800" },
  confirmText: { color: colors.background, fontWeight: "900" },
});
