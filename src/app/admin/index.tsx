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
  adjustAdminUserCredits,
  getAdminDashboard,
  getAdminUsers,
  type AdminDashboard,
  type AdminUserRow,
} from "../../features/admin/AdminService";
import { getValidSession } from "../../features/auth/SupabaseAuthService";
import { isOummahAdminSession } from "../../features/auth/AdminAccess";
import { colors } from "../../theme/colors";
import { getAdminSupportCounts } from "../../features/support/AdminSupportService";
import { getAdminAlertCounts } from "../../features/admin/AdminAlertsService";
import { adminListMosquePrayerTimeUpdates } from "../../features/mosques/data/mosquePrayerUpdates";
import { typography } from "../../theme/typography";

const EMPTY_DASHBOARD: AdminDashboard = {
  usersTotal: 0,
  usersToday: 0,
  mosquePending: 0,
  mosqueApproved: 0,
  mosqueRejected: 0,
  walletsTotal: 0,
  creditsAvailable: 0,
  creditsSpent: 0,
  mosqueReportsPending: 0,
  adminActionsToday: 0,
};

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={19} color={colors.goldLight} />
      </View>
      <Text style={styles.metricValue}>{value.toLocaleString("fr-FR")}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export default function AdminHomeScreen() {
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingUserId, setActingUserId] = useState<string | null>(null);
  const [supportCounts, setSupportCounts] = useState({
    open: 0,
    inProgress: 0,
    urgent: 0,
    unread: 0,
  });
  const [alertCounts, setAlertCounts] = useState({
    open: 0,
    critical: 0,
    warning: 0,
    info: 0,
  });
  const [pendingPrayerTimes, setPendingPrayerTimes] = useState(0);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const session = await getValidSession(true);
      if (!isOummahAdminSession(session)) {
        Alert.alert("Accès refusé", "Ce compte n’est pas administrateur.");
        router.replace("/profile");
        return;
      }

      const [
        nextDashboard,
        nextUsers,
        nextSupportCounts,
        nextAlertCounts,
        nextPrayerTimes,
      ] = await Promise.all([
        getAdminDashboard(),
        getAdminUsers(search),
        getAdminSupportCounts().catch(() => ({
          open: 0,
          inProgress: 0,
          urgent: 0,
          unread: 0,
        })),
        getAdminAlertCounts(true).catch(() => ({
          open: 0,
          critical: 0,
          warning: 0,
          info: 0,
        })),
        adminListMosquePrayerTimeUpdates().catch(() => []),
      ]);

      setDashboard(nextDashboard);
      setUsers(nextUsers);
      setSupportCounts(nextSupportCounts);
      setAlertCounts(nextAlertCounts);
      setPendingPrayerTimes(nextPrayerTimes.length);
    } catch (error) {
      Alert.alert(
        "Administration",
        error instanceof Error ? error.message : "Chargement impossible.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const adjustCredits = useCallback(
    (user: AdminUserRow, amount: number) => {
      const action = amount > 0 ? "ajouter" : "retirer";
      Alert.alert(
        "Crédits Wasil",
        `Confirmer : ${action} ${Math.abs(amount)} crédits à ${user.email} ?`,
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Confirmer",
            style: amount < 0 ? "destructive" : "default",
            onPress: async () => {
              setActingUserId(user.userId);
              try {
                await adjustAdminUserCredits(
                  user.userId,
                  amount,
                  `Ajustement depuis l’espace admin (${amount > 0 ? "+" : ""}${amount})`,
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

  const filteredTitle = useMemo(
    () => search.trim() ? `Résultats utilisateurs` : "Utilisateurs récents",
    [search],
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ESPACE ADMIN</Text>
          <Text style={styles.title}>Pilotage OUMMAH</Text>
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
          showsVerticalScrollIndicator={false}
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
          <Pressable
            onPress={() => router.push("/admin/cockpit")}
            style={({ pressed }) => [
              styles.founderCockpitCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.founderCockpitIcon}>
              <Ionicons name="speedometer-outline" size={24} color={colors.goldLight} />
            </View>
            <View style={styles.founderCockpitCopy}>
              <Text style={styles.founderCockpitEyebrow}>VUE FONDATEUR</Text>
              <Text style={styles.founderCockpitTitle}>Centre de pilotage global</Text>
              <Text style={styles.founderCockpitSubtitle}>
                Activité, Premium, revenus, Wasil, alertes et support
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={21} color={colors.goldLight} />
          </Pressable>

          <Text style={styles.sectionTitle}>Vue d’ensemble</Text>
          <View style={styles.metricsGrid}>
            <MetricCard icon="people-outline" label="Utilisateurs" value={dashboard.usersTotal} />
            <MetricCard icon="person-add-outline" label="Aujourd’hui" value={dashboard.usersToday} />
            <MetricCard icon="flash-outline" label="Crédits disponibles" value={dashboard.creditsAvailable} />
            <MetricCard icon="analytics-outline" label="Crédits consommés" value={dashboard.creditsSpent} />
            <MetricCard icon="flag-outline" label="Signalements en attente" value={dashboard.mosqueReportsPending} />
            <MetricCard icon="pulse-outline" label="Actions admin aujourd’hui" value={dashboard.adminActionsToday} />
          </View>

          <Pressable
            onPress={() => router.push("/admin/mosques")}
            style={({ pressed }) => [styles.mosqueCard, pressed && styles.pressed]}
          >
            <View style={styles.mosqueIcon}>
              <Ionicons name="business-outline" size={24} color={colors.background} />
            </View>
            <View style={styles.mosqueCopy}>
              <Text style={styles.mosqueTitle}>Modération des mosquées</Text>
              <Text style={styles.mosqueSubtitle}>
                {dashboard.mosquePending} proposition{dashboard.mosquePending === 1 ? "" : "s"} en attente
              </Text>
              <Text style={styles.mosqueStats}>
                {dashboard.mosqueApproved} validées · {dashboard.mosqueRejected} refusées
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/mosque-prayer-times")}
            style={({ pressed }) => [styles.mosqueCard, pressed && styles.pressed]}
          >
            <View style={styles.mosqueIcon}>
            <Ionicons name="time-outline" size={24} color={colors.background} />
            </View>
            <View style={styles.mosqueCopy}>
              <Text style={styles.mosqueTitle}>Horaires des mosquées</Text>
              <Text style={styles.mosqueSubtitle}>Valider les horaires proposés et l’heure de Joumou’a</Text>
            </View>
            {pendingPrayerTimes > 0 ? (
              <View style={styles.pendingPrayerBadge}>
                <Text style={styles.pendingPrayerBadgeText}>
                  {pendingPrayerTimes > 99 ? "99+" : pendingPrayerTimes}
                </Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/alerts")}
            style={({ pressed }) => [
              styles.alertAdminCard,
              pressed && styles.pressed,
            ]}
          >
            <View
              style={[
                styles.alertAdminIcon,
                alertCounts.critical > 0 && styles.alertAdminIconCritical,
              ]}
            >
              <Ionicons
                name="warning-outline"
                size={22}
                color={
                  alertCounts.critical > 0
                    ? "#F28B82"
                    : colors.goldLight
                }
              />
            </View>
            <View style={styles.alertAdminCopy}>
              <Text style={styles.alertAdminTitle}>Centre d’alertes</Text>
              <Text style={styles.alertAdminSubtitle}>
                {alertCounts.critical} critiques · {alertCounts.warning} avertissements
              </Text>
            </View>
            {alertCounts.open > 0 ? (
              <View style={styles.alertAdminBadge}>
                <Text style={styles.alertAdminBadgeText}>
                  {alertCounts.open > 99 ? "99+" : alertCounts.open}
                </Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/support")}
            style={({ pressed }) => [
              styles.supportAdminCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.supportAdminIcon}>
              <Ionicons name="help-buoy-outline" size={22} color={colors.goldLight} />
            </View>
            <View style={styles.supportAdminCopy}>
              <Text style={styles.supportAdminTitle}>Support utilisateurs</Text>
              <Text style={styles.supportAdminSubtitle}>
                {supportCounts.open} ouverts · {supportCounts.inProgress} en cours · {supportCounts.urgent} urgents
              </Text>
            </View>
            {supportCounts.unread > 0 ? (
              <View style={styles.supportAdminUnread}>
                <Text style={styles.supportAdminUnreadText}>
                  {supportCounts.unread > 99 ? "99+" : supportCounts.unread}
                </Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/revenuecat-control")}
            style={({ pressed }) => [
              styles.revenueControlCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.revenueControlIcon}>
              <Ionicons name="git-compare-outline" size={22} color={colors.goldLight} />
            </View>
            <View style={styles.revenueControlCopy}>
              <Text style={styles.revenueControlTitle}>Contrôle RevenueCat</Text>
              <Text style={styles.revenueControlSubtitle}>
                Événements, comptes non reliés et réconciliation
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/revenuecat-finance")}
            style={({ pressed }) => [
              styles.revenueAdminCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.revenueAdminIcon}>
              <Ionicons name="trending-up-outline" size={22} color={colors.goldLight} />
            </View>
            <View style={styles.revenueAdminCopy}>
              <Text style={styles.revenueAdminTitle}>Revenus & abonnements</Text>
              <Text style={styles.revenueAdminSubtitle}>
                RevenueCat, remboursements, produits et alertes Wasil
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/wasil-finance")}
            style={({ pressed }) => [
              styles.wasilFinanceCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.wasilFinanceIcon}>
              <Ionicons name="calculator-outline" size={22} color={colors.goldLight} />
            </View>
            <View style={styles.wasilFinanceCopy}>
              <Text style={styles.wasilFinanceTitle}>Finances Wasil</Text>
              <Text style={styles.wasilFinanceSubtitle}>
                Coûts IA, revenus, marge et projections
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/premium-wasil")}
            style={({ pressed }) => [
              styles.premiumAdminCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.premiumAdminIcon}>
              <Ionicons name="diamond-outline" size={22} color={colors.goldLight} />
            </View>
            <View style={styles.premiumAdminCopy}>
              <Text style={styles.premiumAdminTitle}>Premium & Wasil</Text>
              <Text style={styles.premiumAdminSubtitle}>
                Abonnements manuels, crédits, ventes et coûts détectés
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/team")}
            style={({ pressed }) => [
              styles.teamAdminCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.teamAdminIcon}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.goldLight} />
            </View>
            <View style={styles.teamAdminCopy}>
              <Text style={styles.teamAdminTitle}>Équipe administratrice</Text>
              <Text style={styles.teamAdminSubtitle}>
                Gérer les rôles et les accès à l’administration
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/activity")}
            style={({ pressed }) => [
              styles.activityAdminCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.activityAdminIcon}>
              <Ionicons name="pulse-outline" size={22} color={colors.goldLight} />
            </View>
            <View style={styles.activityAdminCopy}>
              <Text style={styles.activityAdminTitle}>Journal d’activité</Text>
              <Text style={styles.activityAdminSubtitle}>
                Validations, refus, signalements et crédits
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/mosque-reports")}
            style={({ pressed }) => [styles.reportAdminCard, pressed && styles.pressed]}
          >
            <View style={styles.reportAdminIcon}>
              <Ionicons name="flag-outline" size={22} color="#F28B82" />
            </View>
            <View style={styles.reportAdminCopy}>
              <Text style={styles.reportAdminTitle}>Signalements des mosquées</Text>
              <Text style={styles.reportAdminSubtitle}>Vérifier les erreurs remontées par les utilisateurs</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/admin/push-notifications")}
            style={({ pressed }) => [
              styles.pushAdminCard,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.pushAdminIcon}>
              <Ionicons name="notifications-outline" size={22} color={colors.goldLight} />
            </View>
            <View style={styles.pushAdminCopy}>
              <Text style={styles.pushAdminTitle}>Notifications push</Text>
              <Text style={styles.pushAdminSubtitle}>
                Envoyer un message à tous, aux gratuits ou aux Premium
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
          </Pressable>

          <Text style={styles.sectionTitle}>Utilisateurs et crédits Wasil</Text>
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
            {search ? (
              <Pressable onPress={() => setSearch("")}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.usersHeader}>
            <Text style={styles.usersTitle}>{filteredTitle}</Text>
            <Pressable onPress={() => void load()}>
              <Text style={styles.searchButton}>Rechercher</Text>
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
                    <View style={styles.userAvatar}>
                      <Ionicons name="person-outline" size={18} color={colors.goldLight} />
                    </View>
                    <View style={styles.userCopy}>
                      <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                      <Text style={styles.userDate}>
                        Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                      </Text>
                    </View>
                    <View style={styles.balanceBadge}>
                      <Text style={styles.balanceValue}>{user.balance}</Text>
                      <Text style={styles.balanceLabel}>crédits</Text>
                    </View>
                  </View>

                  <Text style={styles.spentText}>
                    Total consommé : {user.totalSpent.toLocaleString("fr-FR")}
                  </Text>

                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/admin/users/[id]",
                        params: { id: user.userId },
                      })
                    }
                    style={({ pressed }) => [
                      styles.userDetailButton,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name="person-circle-outline"
                      size={17}
                      color={colors.goldLight}
                    />
                    <Text style={styles.userDetailButtonText}>
                      Ouvrir la fiche utilisateur
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.textMuted}
                    />
                  </Pressable>

                  <View style={styles.creditActions}>
                    <Pressable
                      disabled={acting}
                      onPress={() => adjustCredits(user, -10)}
                      style={[styles.creditButton, styles.negativeButton]}
                    >
                      <Text style={styles.negativeText}>−10</Text>
                    </Pressable>
                    <Pressable
                      disabled={acting}
                      onPress={() => adjustCredits(user, 10)}
                      style={styles.creditButton}
                    >
                      <Text style={styles.creditText}>{acting ? "…" : "+10"}</Text>
                    </Pressable>
                    <Pressable
                      disabled={acting}
                      onPress={() => adjustCredits(user, 50)}
                      style={styles.creditButton}
                    >
                      <Text style={styles.creditText}>+50</Text>
                    </Pressable>
                  </View>
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
  header: { minHeight: 72, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border },
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  headerCopy: { alignItems: "center" },
  eyebrow: { color: colors.goldMuted, fontSize: 8, fontWeight: "800", letterSpacing: 1.25 },
  title: { marginTop: 2, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 23 },
  loader: { marginTop: 70 },
  content: { padding: 18, paddingBottom: 60 },
  sectionTitle: { marginTop: 8, marginBottom: 12, color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 18 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  founderCockpitCard: {
    minHeight: 106,
    marginBottom: 18,
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.32)",
    backgroundColor: "rgba(241,188,79,0.07)",
    flexDirection: "row",
    alignItems: "center",
  },
  founderCockpitIcon: {
    width: 50,
    height: 50,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.11)",
  },
  founderCockpitCopy: {
    flex: 1,
    marginHorizontal: 13,
  },
  founderCockpitEyebrow: {
    color: colors.goldMuted,
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  founderCockpitTitle: {
    marginTop: 3,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 16,
  },
  founderCockpitSubtitle: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 9.5,
    lineHeight: 14,
  },
  metricCard: { width: "48%", minHeight: 126, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  metricIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(241,188,79,0.10)" },
  metricValue: { marginTop: 12, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 25 },
  metricLabel: { marginTop: 3, color: colors.textMuted, fontSize: 11 },
  mosqueCard: { marginTop: 18, marginBottom: 18, minHeight: 100, padding: 15, borderRadius: 20, borderWidth: 1, borderColor: "rgba(241,188,79,0.28)", backgroundColor: "rgba(241,188,79,0.08)", flexDirection: "row", alignItems: "center" },
  pendingPrayerBadge: { minWidth: 22, height: 22, marginRight: 8, paddingHorizontal: 6, borderRadius: 11, backgroundColor: "#D93025", alignItems: "center", justifyContent: "center" },
  pendingPrayerBadgeText: { color: "#FFFFFF", fontFamily: typography.sansBold, fontSize: 11 },
  mosqueIcon: { width: 48, height: 48, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: colors.goldLight },
  mosqueCopy: { flex: 1, marginHorizontal: 13 },
  mosqueTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 16 },
  mosqueSubtitle: { marginTop: 3, color: colors.goldLight, fontWeight: "700", fontSize: 11 },
  mosqueStats: { marginTop: 3, color: colors.textMuted, fontSize: 10 },
  alertAdminCard: {
    minHeight: 82,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.06)",
    flexDirection: "row",
    alignItems: "center",
  },
  alertAdminIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  alertAdminIconCritical: {
    backgroundColor: "rgba(242,139,130,0.10)",
  },
  alertAdminCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  alertAdminTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  alertAdminSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  alertAdminBadge: {
    minWidth: 25,
    height: 25,
    marginRight: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#F28B82",
  },
  alertAdminBadgeText: {
    color: colors.background,
    fontSize: 9,
    fontWeight: "900",
  },
  supportAdminCard: {
    minHeight: 82,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.06)",
    flexDirection: "row",
    alignItems: "center",
  },
  supportAdminIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  supportAdminUnread: {
    minWidth: 25,
    height: 25,
    marginRight: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "#F28B82",
  },
  supportAdminUnreadText: {
    color: colors.background,
    fontSize: 9,
    fontWeight: "900",
  },
  supportAdminCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  supportAdminTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  supportAdminSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  revenueControlCard: {
    minHeight: 82,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.06)",
    flexDirection: "row",
    alignItems: "center",
  },
  revenueControlIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  revenueControlCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  revenueControlTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  revenueControlSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  revenueAdminCard: {
    minHeight: 82,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.06)",
    flexDirection: "row",
    alignItems: "center",
  },
  revenueAdminIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  revenueAdminCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  revenueAdminTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  revenueAdminSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  wasilFinanceCard: {
    minHeight: 82,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.06)",
    flexDirection: "row",
    alignItems: "center",
  },
  wasilFinanceIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  wasilFinanceCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  wasilFinanceTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  wasilFinanceSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  premiumAdminCard: {
    minHeight: 82,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.06)",
    flexDirection: "row",
    alignItems: "center",
  },
  premiumAdminIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  premiumAdminCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  premiumAdminTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  premiumAdminSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  teamAdminCard: {
    minHeight: 82,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.06)",
    flexDirection: "row",
    alignItems: "center",
  },
  teamAdminIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  teamAdminCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  teamAdminTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  teamAdminSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  activityAdminCard: {
    minHeight: 82,
    marginBottom: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.06)",
    flexDirection: "row",
    alignItems: "center",
  },
  activityAdminIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  activityAdminCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  activityAdminTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  activityAdminSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  reportAdminCard: { minHeight: 82, marginBottom: 18, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: "rgba(242,139,130,0.22)", backgroundColor: "rgba(242,139,130,0.05)", flexDirection: "row", alignItems: "center" },
  reportAdminIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(242,139,130,0.10)" },
  reportAdminCopy: { flex: 1, marginHorizontal: 12 },
  reportAdminTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 15 },
  reportAdminSubtitle: { marginTop: 4, color: colors.textMuted, fontSize: 10, lineHeight: 14 },
  pushAdminCard: {
    minHeight: 82,
    marginBottom: 18,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.06)",
    flexDirection: "row",
    alignItems: "center",
  },
  pushAdminIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  pushAdminCopy: { flex: 1, marginHorizontal: 12 },
  pushAdminTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  pushAdminSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 14,
  },
  searchWrap: { minHeight: 48, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  searchInput: { flex: 1, color: colors.text, fontSize: 13 },
  usersHeader: { marginTop: 16, marginBottom: 9, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  usersTitle: { color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  searchButton: { color: colors.goldLight, fontSize: 11, fontWeight: "800" },
  empty: { paddingVertical: 30, textAlign: "center", color: colors.textMuted },
  userCard: { marginBottom: 11, padding: 14, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  userTop: { flexDirection: "row", alignItems: "center" },
  userAvatar: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(241,188,79,0.10)" },
  userCopy: { flex: 1, marginHorizontal: 10 },
  userEmail: { color: colors.text, fontSize: 12.5, fontWeight: "700" },
  userDate: { marginTop: 3, color: colors.textMuted, fontSize: 9.5 },
  balanceBadge: { minWidth: 58, paddingVertical: 5, paddingHorizontal: 8, alignItems: "center", borderRadius: 11, backgroundColor: "rgba(241,188,79,0.12)" },
  balanceValue: { color: colors.goldLight, fontSize: 15, fontWeight: "800" },
  balanceLabel: { color: colors.textMuted, fontSize: 8 },
  spentText: { marginTop: 11, color: colors.textMuted, fontSize: 10 },
  userDetailButton: {
    minHeight: 42,
    marginTop: 11,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.05)",
  },
  userDetailButtonText: {
    flex: 1,
    color: colors.goldLight,
    fontSize: 10.5,
    fontWeight: "800",
  },
  creditActions: { marginTop: 10, flexDirection: "row", gap: 8 },
  creditButton: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: colors.goldLight },
  negativeButton: { borderWidth: 1, borderColor: "#F28B82", backgroundColor: "transparent" },
  creditText: { color: colors.background, fontWeight: "800" },
  negativeText: { color: "#F28B82", fontWeight: "800" },
  pressed: { opacity: 0.75 },
});
