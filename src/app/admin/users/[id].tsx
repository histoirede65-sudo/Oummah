import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { grantManualPremium, revokeManualPremium } from "../../../features/admin/AdminPremiumService";
import { sendOummahMessage } from "../../../features/admin/oummahMessages";
import {
  adjustAdminUserCredits,
  deleteAdminUser,
  getAdminUserCreditHistory,
  getAdminUserDetail,
  type AdminUserCreditAdjustment,
  type AdminUserDetail,
} from "../../../features/admin/AdminService";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

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

export default function AdminUserDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const userId = single(params.id);

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [history, setHistory] = useState<AdminUserCreditAdjustment[]>([]);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const parsedAmount = useMemo(() => {
    const value = Number(amount.trim().replace(",", "."));
    if (!Number.isInteger(value) || value <= 0) return null;
    return mode === "add" ? value : -value;
  }, [amount, mode]);

  const load = useCallback(
    async (silent = false) => {
      if (!userId) {
        Alert.alert("Utilisateur introuvable", "Identifiant utilisateur absent.");
        router.back();
        return;
      }

      if (!silent) setLoading(true);

      try {
        const [nextUser, nextHistory] = await Promise.all([
          getAdminUserDetail(userId),
          getAdminUserCreditHistory(userId, 100),
        ]);

        setUser(nextUser);
        setHistory(nextHistory);
      } catch (error) {
        Alert.alert(
          "Fiche utilisateur",
          error instanceof Error ? error.message : "Chargement impossible.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const submit = async () => {
    if (!userId || saving) return;

    if (parsedAmount === null) {
      Alert.alert(
        "Montant invalide",
        "Saisissez un nombre entier supérieur à zéro.",
      );
      return;
    }

    const cleanedReason = reason.trim();
    if (cleanedReason.length < 3) {
      Alert.alert(
        "Motif obligatoire",
        "Indiquez clairement la raison de cet ajustement.",
      );
      return;
    }

    if (mode === "remove" && user && Math.abs(parsedAmount) > user.balance) {
      Alert.alert(
        "Solde insuffisant",
        `Cet utilisateur dispose actuellement de ${user.balance} crédits.`,
      );
      return;
    }

    const action = mode === "add" ? "ajouter" : "retirer";

    Alert.alert(
      "Confirmer l’ajustement",
      `Voulez-vous ${action} ${Math.abs(parsedAmount)} crédits à ${user?.email ?? "cet utilisateur"} ?\n\nMotif : ${cleanedReason}`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          style: mode === "remove" ? "destructive" : "default",
          onPress: async () => {
            setSaving(true);

            try {
              await adjustAdminUserCredits(
                userId,
                parsedAmount,
                cleanedReason,
              );

              setAmount("");
              setReason("");
              await load(true);

              Alert.alert(
                "Crédits mis à jour",
                "L’ajustement a été enregistré dans le journal administrateur.",
              );
            } catch (error) {
              Alert.alert(
                "Action impossible",
                error instanceof Error ? error.message : "Réessayez.",
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  const grantQuickCredits = (credits: 1 | 5 | 10) => {
    if (!userId || saving) return;

    Alert.alert(
      "Offrir des crédits Wasil",
      `Ajouter ${credits} crédit${credits > 1 ? "s" : ""} à ${user?.email ?? "cet utilisateur"} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Ajouter",
          onPress: async () => {
            setSaving(true);
            try {
              await adjustAdminUserCredits(
                userId,
                credits,
                "Crédits offerts par l’administrateur",
              );
              await load(true);
              Alert.alert(
                "Crédits ajoutés",
                `${credits} crédit${credits > 1 ? "s ont" : " a"} bien été ajouté${credits > 1 ? "s" : ""}.`,
              );
            } catch (error) {
              Alert.alert(
                "Action impossible",
                error instanceof Error ? error.message : "Réessayez.",
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  // Premium offered by hand (months > 0) or withdrawn (0). Store subscriptions are not touched.
  const setPremium = (months: number) => {
    if (!userId || saving || !user) return;
    Alert.alert(
      months ? `Offrir ${months} mois de Premium ?` : "Retirer le Premium offert ?",
      months ? `${user.email} aura accès à Premium pendant ${months} mois.` : `${user.email} perd le Premium offert à la main. Un abonnement payé sur le store n’est pas touché.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: months ? "Offrir" : "Retirer",
          style: months ? "default" : "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              if (months) await grantManualPremium(userId, months, "Premium offert par OUMMAH");
              else await revokeManualPremium(userId, "Premium retiré par OUMMAH");
              Alert.alert(months ? "Premium offert" : "Premium retiré", months ? `${months} mois de Premium pour ${user.email}.` : `Le Premium offert à ${user.email} est retiré.`);
            } catch (error) {
              Alert.alert("Action impossible", error instanceof Error ? error.message : "Réessayez.");
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  const sendNote = () => {
    const body = note.trim();
    if (!userId || saving || !user || body.length < 2) return;
    Alert.alert("Envoyer ce message ?", `${user.email} le recevra dans sa messagerie, signé « OUMMAH », avec une notification.`, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Envoyer",
        onPress: async () => {
          setSaving(true);
          try {
            const sent = await sendOummahMessage(body, userId);
            setNote("");
            Alert.alert("Message envoyé", sent.devices ? "Une notification a été envoyée sur son téléphone." : "Il le verra en ouvrant sa messagerie (notifications désactivées sur son téléphone).");
          } catch (error) {
            Alert.alert("Envoi impossible", error instanceof Error ? error.message : "Réessayez.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const removeUser = () => {
    if (!userId || saving || !user) return;

    Alert.alert(
      "Supprimer définitivement cet utilisateur ?",
      `Le compte ${user.email} et ses données liées seront supprimés. Cette action est irréversible.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer définitivement",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              await deleteAdminUser(userId);
              Alert.alert("Utilisateur supprimé", "Le compte a été supprimé.", [
                { text: "OK", onPress: () => router.replace("/admin") },
              ]);
            } catch (error) {
              Alert.alert(
                "Suppression impossible",
                error instanceof Error ? error.message : "Réessayez.",
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
          </Pressable>

          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>ADMINISTRATION</Text>
            <Text style={styles.title}>Fiche utilisateur</Text>
          </View>

          <Pressable onPress={() => void load()} style={styles.headerButton}>
            <Ionicons name="refresh" size={20} color={colors.goldLight} />
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.goldLight} />
        ) : user ? (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
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
            <View style={styles.identityCard}>
              <View style={styles.avatar}>
                <Ionicons
                  name="person-outline"
                  size={25}
                  color={colors.goldLight}
                />
              </View>

              <View style={styles.identityCopy}>
                <Text style={styles.email} numberOfLines={2}>
                  {user.email}
                </Text>
                <Text style={styles.userId} numberOfLines={1}>
                  {user.userId}
                </Text>
              </View>
            </View>

            <Pressable
              disabled={saving}
              onPress={removeUser}
              style={[styles.deleteButton, saving && styles.disabled]}
            >
              <Ionicons name="trash-outline" size={18} color="#F28B82" />
              <Text style={styles.deleteButtonText}>Supprimer définitivement</Text>
            </Pressable>

            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Text style={styles.metricValue}>{user.balance}</Text>
                <Text style={styles.metricLabel}>Solde actuel</Text>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricValue}>{user.totalSpent}</Text>
                <Text style={styles.metricLabel}>Total consommé</Text>
              </View>

              <View style={styles.metric}>
                <Text style={styles.metricValue}>{user.adjustmentCount}</Text>
                <Text style={styles.metricLabel}>Ajustements admin</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Inscription</Text>
                <Text style={styles.infoValue}>
                  {formatDate(user.createdAt)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dernière connexion</Text>
                <Text style={styles.infoValue}>
                  {formatDate(user.lastSignInAt)}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bilan ajustements</Text>
                <Text
                  style={[
                    styles.infoValue,
                    user.adjustmentTotal < 0 && styles.negative,
                  ]}
                >
                  {user.adjustmentTotal > 0 ? "+" : ""}
                  {user.adjustmentTotal} crédits
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Message OUMMAH</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Arrive dans sa messagerie, signé « OUMMAH »"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={2000}
              textAlignVertical="top"
              style={[styles.input, styles.reasonInput]}
            />
            <Pressable disabled={saving || note.trim().length < 2} onPress={sendNote} style={[styles.submitButton, (saving || note.trim().length < 2) && styles.disabled]}>
              <Ionicons name="chatbubble-ellipses" size={18} color={colors.background} />
              <Text style={styles.submitText}>Envoyer le message</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Premium</Text>

            <View style={styles.quickCreditsRow}>
              {([1, 3, 12] as const).map((months) => (
                <Pressable
                  key={months}
                  disabled={saving}
                  onPress={() => setPremium(months)}
                  style={[styles.quickCreditButton, saving && styles.disabled]}
                >
                  <Ionicons name="diamond-outline" size={17} color={colors.background} />
                  <Text style={styles.quickCreditText}>{months} mois</Text>
                </Pressable>
              ))}
            </View>
            <Pressable disabled={saving} onPress={() => setPremium(0)} style={[styles.revokePremium, saving && styles.disabled]}>
              <Text style={styles.revokePremiumText}>Retirer le Premium offert</Text>
            </Pressable>

            <Text style={styles.sectionTitle}>Ajouter rapidement des crédits Wasil</Text>

            <View style={styles.quickCreditsRow}>
              {([1, 5, 10] as const).map((credits) => (
                <Pressable
                  key={credits}
                  disabled={saving}
                  onPress={() => grantQuickCredits(credits)}
                  style={[styles.quickCreditButton, saving && styles.disabled]}
                >
                  <Ionicons name="flash-outline" size={17} color={colors.background} />
                  <Text style={styles.quickCreditText}>+{credits}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Ajustement personnalisé</Text>

            <View style={styles.formCard}>
              <View style={styles.modeRow}>
                <Pressable
                  onPress={() => setMode("add")}
                  style={[
                    styles.modeButton,
                    mode === "add" && styles.modeButtonActive,
                  ]}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={18}
                    color={
                      mode === "add" ? colors.background : colors.goldLight
                    }
                  />
                  <Text
                    style={[
                      styles.modeText,
                      mode === "add" && styles.modeTextActive,
                    ]}
                  >
                    Ajouter
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setMode("remove")}
                  style={[
                    styles.modeButton,
                    mode === "remove" && styles.removeButtonActive,
                  ]}
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={18}
                    color={
                      mode === "remove" ? colors.background : "#F28B82"
                    }
                  />
                  <Text
                    style={[
                      styles.modeText,
                      styles.removeText,
                      mode === "remove" && styles.modeTextActive,
                    ]}
                  >
                    Retirer
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.inputLabel}>Montant entier</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                placeholder="Ex. 25"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                style={styles.input}
              />

              <Text style={styles.inputLabel}>Motif obligatoire</Text>
              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Ex. Geste commercial après incident"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={300}
                textAlignVertical="top"
                style={[styles.input, styles.reasonInput]}
              />

              <Text style={styles.counter}>{reason.length}/300</Text>

              <Pressable
                disabled={saving}
                onPress={() => void submit()}
                style={[
                  styles.submitButton,
                  mode === "remove" && styles.submitButtonRemove,
                  saving && styles.disabled,
                ]}
              >
                {saving ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Ionicons
                    name={
                      mode === "add"
                        ? "add-circle-outline"
                        : "remove-circle-outline"
                    }
                    size={19}
                    color={colors.background}
                  />
                )}

                <Text style={styles.submitText}>
                  {saving
                    ? "Mise à jour…"
                    : mode === "add"
                      ? "Ajouter les crédits"
                      : "Retirer les crédits"}
                </Text>
              </Pressable>
            </View>

            <Text style={styles.sectionTitle}>Historique des ajustements</Text>

            {history.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Aucun ajustement administrateur enregistré.
                </Text>
              </View>
            ) : (
              history.map((entry) => (
                <View key={entry.id} style={styles.historyCard}>
                  <View
                    style={[
                      styles.historyIcon,
                      entry.amount < 0 && styles.historyIconNegative,
                    ]}
                  >
                    <Ionicons
                      name={
                        entry.amount > 0
                          ? "add-outline"
                          : "remove-outline"
                      }
                      size={18}
                      color={
                        entry.amount > 0 ? colors.goldLight : "#F28B82"
                      }
                    />
                  </View>

                  <View style={styles.historyCopy}>
                    <Text style={styles.historyReason}>{entry.reason}</Text>
                    <Text style={styles.historyMeta}>
                      {entry.adminEmail ?? "Administrateur"} ·{" "}
                      {formatDate(entry.createdAt)}
                    </Text>
                  </View>

                  <Text
                    style={[
                      styles.historyAmount,
                      entry.amount < 0 && styles.negative,
                    ]}
                  >
                    {entry.amount > 0 ? "+" : ""}
                    {entry.amount}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  headerCopy: {
    alignItems: "center",
  },
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
  loader: {
    marginTop: 70,
  },
  content: {
    padding: 18,
    paddingBottom: 55,
  },
  identityCard: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  identityCopy: {
    flex: 1,
    marginLeft: 13,
  },
  deleteButton: {
    minHeight: 48,
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(242,139,130,0.55)",
    backgroundColor: "rgba(242,139,130,0.08)",
  },
  deleteButtonText: {
    color: "#F28B82",
    fontSize: 12,
    fontWeight: "800",
  },
  email: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  userId: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 8.5,
  },
  metrics: {
    marginTop: 11,
    flexDirection: "row",
    gap: 8,
  },
  metric: {
    flex: 1,
    minHeight: 91,
    padding: 10,
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
    fontSize: 21,
  },
  metricLabel: {
    marginTop: 4,
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 8.5,
  },
  infoCard: {
    marginTop: 11,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  infoRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 10,
  },
  infoValue: {
    flex: 1.4,
    color: colors.text,
    textAlign: "right",
    fontSize: 10.5,
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  revokePremium: { marginTop: 10, minHeight: 44, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1, borderColor: "rgba(233,107,114,0.6)" },
  revokePremiumText: { color: colors.danger, fontWeight: "800", fontSize: 14 },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 11,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  quickCreditsRow: {
    flexDirection: "row",
    gap: 9,
  },
  quickCreditButton: {
    flex: 1,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    backgroundColor: colors.goldLight,
  },
  quickCreditText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "900",
  },
  formCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  modeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 15,
  },
  modeButton: {
    flex: 1,
    minHeight: 43,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.goldLight,
  },
  modeButtonActive: {
    backgroundColor: colors.goldLight,
  },
  removeButtonActive: {
    borderColor: "#F28B82",
    backgroundColor: "#F28B82",
  },
  modeText: {
    color: colors.goldLight,
    fontWeight: "800",
  },
  modeTextActive: {
    color: colors.background,
  },
  removeText: {
    color: "#F28B82",
  },
  inputLabel: {
    marginTop: 10,
    marginBottom: 7,
    color: colors.textSecondary,
    fontSize: 10.5,
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 13,
    color: colors.text,
    fontSize: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  reasonInput: {
    minHeight: 92,
    paddingTop: 12,
  },
  counter: {
    marginTop: 5,
    textAlign: "right",
    color: colors.textMuted,
    fontSize: 8.5,
  },
  submitButton: {
    minHeight: 50,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.goldLight,
  },
  submitButtonRemove: {
    backgroundColor: "#F28B82",
  },
  submitText: {
    color: colors.background,
    fontSize: 12.5,
    fontWeight: "900",
  },
  disabled: {
    opacity: 0.5,
  },
  emptyCard: {
    padding: 22,
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 10.5,
  },
  historyCard: {
    minHeight: 70,
    marginBottom: 9,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  historyIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  historyIconNegative: {
    backgroundColor: "rgba(242,139,130,0.10)",
  },
  historyCopy: {
    flex: 1,
    marginHorizontal: 11,
  },
  historyReason: {
    color: colors.text,
    fontSize: 10.5,
    fontWeight: "700",
  },
  historyMeta: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8.5,
  },
  historyAmount: {
    color: colors.goldLight,
    fontSize: 15,
    fontWeight: "900",
  },
  negative: {
    color: "#F28B82",
  },
});
