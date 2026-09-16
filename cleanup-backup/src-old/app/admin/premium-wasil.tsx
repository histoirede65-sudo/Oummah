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
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getAdminPremiumOverview,
  getAdminPremiumUsers,
  grantManualPremium,
  revokeManualPremium,
  type AdminPremiumOverview,
  type AdminPremiumUser,
} from "../../features/admin/AdminPremiumService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const EMPTY: AdminPremiumOverview = {
  totalUsers: 0,
  activeManualPremium: 0,
  expiring7d: 0,
  walletsTotal: 0,
  creditsAvailable: 0,
  creditsSpent: 0,
  creditPurchaseCount: 0,
  estimatedGrossCents: 0,
  estimatedAiCostUsd: 0,
};

function Metric({
  label,
  value,
  icon,
  suffix = "",
}: {
  label: string;
  value: number | string;
  icon: keyof typeof Ionicons.glyphMap;
  suffix?: string;
}) {
  return (
    <View style={styles.metric}>
      <Ionicons name={icon} size={18} color={colors.goldLight} />
      <Text style={styles.metricValue}>
        {typeof value === "number"
          ? value.toLocaleString("fr-FR")
          : value}
        {suffix}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminPremiumWasilScreen() {
  const [overview, setOverview] = useState(EMPTY);
  const [users, setUsers] = useState<AdminPremiumUser[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingUserId, setActingUserId] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);

      try {
        const [nextOverview, nextUsers] = await Promise.all([
          getAdminPremiumOverview(),
          getAdminPremiumUsers(search),
        ]);

        setOverview(nextOverview);
        setUsers(nextUsers);
      } catch (error) {
        Alert.alert(
          "Premium & Wasil",
          error instanceof Error ? error.message : "Chargement impossible.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const grossEuros = useMemo(
    () => (overview.estimatedGrossCents / 100).toFixed(2),
    [overview.estimatedGrossCents],
  );

  const grant = useCallback(
    (user: AdminPremiumUser, months: number) => {
      const reason = `${months} mois offerts depuis l’espace admin`;

      Alert.alert(
        "Offrir Premium",
        `Accorder ${months} mois de Premium à ${user.email} ?`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Confirmer",
            onPress: async () => {
              setActingUserId(user.userId);

              try {
                await grantManualPremium(user.userId, months, reason);
                await load(true);
                Alert.alert(
                  "Premium activé",
                  `${months} mois ont été accordés à ${user.email}.`,
                );
              } catch (error) {
                Alert.alert(
                  "Action impossible",
                  error instanceof Error ? error.message : "Réessayez.",
                );
              } finally {
                setActingUserId(null);
              }
            },
          },
        ],
      );
    },
    [load],
  );

  const revoke = useCallback(
    (user: AdminPremiumUser) => {
      Alert.alert(
        "Retirer le Premium manuel",
        `Retirer l’accès Premium manuel de ${user.email} ?\n\nUn abonnement RevenueCat actif restera valable.`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Retirer",
            style: "destructive",
            onPress: async () => {
              setActingUserId(user.userId);

              try {
                await revokeManualPremium(
                  user.userId,
                  "Accès manuel retiré depuis l’espace admin",
                );
                await load(true);
              } catch (error) {
                Alert.alert(
                  "Action impossible",
                  error instanceof Error ? error.message : "Réessayez.",
                );
              } finally {
                setActingUserId(null);
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
          <Text style={styles.title}>Premium & Wasil</Text>
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
          <Text style={styles.sectionTitle}>Vue business</Text>

          <View style={styles.grid}>
            <Metric
              icon="people-outline"
              label="Utilisateurs"
              value={overview.totalUsers}
            />
            <Metric
              icon="diamond-outline"
              label="Premium manuels actifs"
              value={overview.activeManualPremium}
            />
            <Metric
              icon="time-outline"
              label="Expirent sous 7 jours"
              value={overview.expiring7d}
            />
            <Metric
              icon="wallet-outline"
              label="Portefeuilles Wasil"
              value={overview.walletsTotal}
            />
            <Metric
              icon="flash-outline"
              label="Crédits disponibles"
              value={overview.creditsAvailable}
            />
            <Metric
              icon="analytics-outline"
              label="Crédits consommés"
              value={overview.creditsSpent}
            />
            <Metric
              icon="bag-check-outline"
              label="Achats de packs"
              value={overview.creditPurchaseCount}
            />
            <Metric
              icon="cash-outline"
              label="Brut détecté"
              value={grossEuros}
              suffix=" €"
            />
            <Metric
              icon="hardware-chip-outline"
              label="Coût IA détecté"
              value={overview.estimatedAiCostUsd.toFixed(4)}
              suffix=" $"
            />
          </View>

          <View style={styles.noteCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.goldLight}
            />
            <Text style={styles.noteText}>
              Les montants sont calculés uniquement lorsque les tables existantes
              contiennent des champs monétaires reconnus. Aucun revenu n’est inventé.
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Utilisateurs</Text>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => void load()}
              placeholder="Rechercher une adresse e-mail"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="search"
              style={styles.searchInput}
            />
            <Pressable onPress={() => void load()}>
              <Text style={styles.searchText}>Rechercher</Text>
            </Pressable>
          </View>

          {users.length === 0 ? (
            <Text style={styles.empty}>Aucun utilisateur trouvé.</Text>
          ) : (
            users.map((user) => {
              const acting = actingUserId === user.userId;

              return (
                <View key={user.userId} style={styles.userCard}>
                  <View style={styles.userTop}>
                    <View style={styles.avatar}>
                      <Ionicons
                        name={
                          user.manualPremiumActive
                            ? "diamond-outline"
                            : "person-outline"
                        }
                        size={20}
                        color={colors.goldLight}
                      />
                    </View>

                    <View style={styles.userCopy}>
                      <Text style={styles.email} numberOfLines={1}>
                        {user.email}
                      </Text>
                      <Text style={styles.meta}>
                        Inscrit le {formatDate(user.createdAt)}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        user.manualPremiumActive &&
                          styles.statusBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          user.manualPremiumActive &&
                            styles.statusTextActive,
                        ]}
                      >
                        {user.manualPremiumActive
                          ? "PREMIUM MANUEL"
                          : "STANDARD"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.walletRow}>
                    <Text style={styles.walletText}>
                      Solde : {user.balance} crédits
                    </Text>
                    <Text style={styles.walletText}>
                      Consommés : {user.totalSpent}
                    </Text>
                  </View>

                  {user.manualPremiumActive ? (
                    <View style={styles.premiumInfo}>
                      <Text style={styles.premiumInfoText}>
                        Du {formatDate(user.manualPremiumStartsAt)} au{" "}
                        {formatDate(user.manualPremiumEndsAt)}
                      </Text>
                      {user.manualPremiumReason ? (
                        <Text style={styles.premiumReason}>
                          {user.manualPremiumReason}
                        </Text>
                      ) : null}
                    </View>
                  ) : null}

                  <View style={styles.actions}>
                    <Pressable
                      disabled={acting}
                      onPress={() => grant(user, 1)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionText}>+1 mois</Text>
                    </Pressable>

                    <Pressable
                      disabled={acting}
                      onPress={() => grant(user, 3)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionText}>+3 mois</Text>
                    </Pressable>

                    <Pressable
                      disabled={acting}
                      onPress={() => grant(user, 12)}
                      style={styles.actionButton}
                    >
                      <Text style={styles.actionText}>+1 an</Text>
                    </Pressable>
                  </View>

                  {user.manualPremiumActive ? (
                    <Pressable
                      disabled={acting}
                      onPress={() => revoke(user)}
                      style={styles.revokeButton}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={16}
                        color="#F28B82"
                      />
                      <Text style={styles.revokeText}>
                        Retirer le Premium manuel
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              );
            })
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
    fontSize: 22,
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
    fontSize: 22,
  },
  metricLabel: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9.5,
  },
  noteCard: {
    marginTop: 14,
    padding: 14,
    flexDirection: "row",
    gap: 10,
    borderRadius: 16,
    backgroundColor: "rgba(241,188,79,0.06)",
  },
  noteText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 9.5,
    lineHeight: 15,
  },
  searchWrap: {
    minHeight: 48,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 13 },
  searchText: {
    color: colors.goldLight,
    fontSize: 9.5,
    fontWeight: "900",
  },
  empty: {
    paddingVertical: 35,
    textAlign: "center",
    color: colors.textMuted,
  },
  userCard: {
    marginTop: 11,
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  userTop: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  userCopy: { flex: 1, marginHorizontal: 10 },
  email: { color: colors.text, fontSize: 11.5, fontWeight: "800" },
  meta: { marginTop: 4, color: colors.textMuted, fontSize: 8.5 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.background,
  },
  statusBadgeActive: {
    backgroundColor: "rgba(241,188,79,0.12)",
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 7.5,
    fontWeight: "900",
  },
  statusTextActive: { color: colors.goldLight },
  walletRow: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  walletText: { color: colors.textSecondary, fontSize: 9.5 },
  premiumInfo: {
    marginTop: 10,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(241,188,79,0.07)",
  },
  premiumInfoText: {
    color: colors.goldLight,
    fontSize: 9.5,
    fontWeight: "800",
  },
  premiumReason: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8.5,
  },
  actions: { marginTop: 12, flexDirection: "row", gap: 7 },
  actionButton: {
    flex: 1,
    minHeight: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: colors.goldLight,
  },
  actionText: {
    color: colors.background,
    fontSize: 9.5,
    fontWeight: "900",
  },
  revokeButton: {
    minHeight: 41,
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#F28B82",
  },
  revokeText: {
    color: "#F28B82",
    fontSize: 9.5,
    fontWeight: "800",
  },
});
