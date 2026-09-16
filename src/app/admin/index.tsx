import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getAdminDashboard, getAdminUsers, type AdminDashboard, type AdminUserRow } from "../../features/admin/AdminService";
import { getAdminAlertCounts, getAdminAttentionState, type AdminAlertCounts, type AdminAttentionState } from "../../features/admin/AdminAlertsService";
import { isOummahAdminSession } from "../../features/auth/AdminAccess";
import { getValidSession } from "../../features/auth/SupabaseAuthService";
import { adminListMosquePrayerTimeUpdates } from "../../features/mosques/data/mosquePrayerUpdates";
import { getAdminSupportCounts } from "../../features/support/AdminSupportService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Summary = {
  dashboard: AdminDashboard | null;
  support: Awaited<ReturnType<typeof getAdminSupportCounts>> | null;
  alerts: AdminAlertCounts | null;
  prayerTimes: number | null;
  attention: AdminAttentionState | null;
  users: AdminUserRow[];
};
type Entry = { title: string; subtitle: string; route: Href; badge?: number };
type Group = "mosques" | "finance" | "communication" | "advanced";

function Badge({ count }: { count?: number }) {
  if (!count || count < 1) return null;
  return <View style={styles.badge}><Text style={styles.badgeText}>{count > 99 ? "99+" : count}</Text></View>;
}

function MenuRow({ title, subtitle, icon, onPress, badge, expanded }: {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: number;
  expanded?: boolean;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button"
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      style={({ pressed }) => [styles.menuRow, pressed && styles.pressed]}>
      <View style={styles.menuIcon}><Ionicons name={icon} size={22} color={colors.goldLight} /></View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Badge count={badge} />
      <Ionicons name={expanded === undefined ? "chevron-forward" : expanded ? "chevron-up" : "chevron-down"} size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function Submenu({ entries }: { entries: Entry[] }) {
  return <View style={styles.submenu}>{entries.map((entry) => (
    <Pressable key={entry.title} onPress={() => router.push(entry.route)} accessibilityRole="button"
      style={({ pressed }) => [styles.subRow, pressed && styles.pressed]}>
      <View style={styles.rowCopy}>
        <Text style={styles.subTitle}>{entry.title}</Text>
        <Text style={styles.rowSubtitle}>{entry.subtitle}</Text>
      </View>
      <Badge count={entry.badge} />
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </Pressable>
  ))}</View>;
}

export default function AdminHomeScreen() {
  const [summary, setSummary] = useState<Summary>({ dashboard: null, support: null, alerts: null, prayerTimes: null, attention: null, users: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [openGroup, setOpenGroup] = useState<Group | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async (refresh = false) => {
    const id = ++requestId.current;
    if (refresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const session = await getValidSession(true);
      if (id !== requestId.current) return;
      if (!isOummahAdminSession(session)) {
        router.replace("/profile");
        return;
      }
      const [dashboard, support, alerts, prayerTimes, attention, users] = await Promise.allSettled([
        getAdminDashboard(), getAdminSupportCounts(), getAdminAlertCounts(true),
        adminListMosquePrayerTimeUpdates(), getAdminAttentionState(), getAdminUsers("", 5000),
      ]);
      if (id !== requestId.current) return;
      setSummary({
        dashboard: dashboard.status === "fulfilled" ? dashboard.value : null,
        support: support.status === "fulfilled" ? support.value : null,
        alerts: alerts.status === "fulfilled" ? alerts.value : null,
        prayerTimes: prayerTimes.status === "fulfilled" ? prayerTimes.value.length : null,
        attention: attention.status === "fulfilled" ? attention.value : null,
        users: users.status === "fulfilled" ? users.value : [],
      });
      if ([dashboard, support, alerts, prayerTimes, attention, users].some((result) => result.status === "rejected")) {
        setError("Certaines informations n’ont pas pu être chargées. Vous pouvez réessayer.");
      }
    } catch {
      if (id === requestId.current) setError("Chargement impossible. Vérifiez votre connexion puis réessayez.");
    } finally {
      if (id === requestId.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestId.current += 1; };
  }, [load]));

  const toggle = (group: Group) => setOpenGroup((current) => current === group ? null : group);
  const { dashboard, support, alerts, prayerTimes, attention, users } = summary;
  const mosqueCount = (dashboard?.mosquePending ?? 0) + (dashboard?.mosqueReportsPending ?? 0) + (prayerTimes ?? 0);
  const critical = (alerts?.critical ?? 0) > 0;
  const showAttention = !alerts || !attention || alerts.open > 0 || attention.actionCount > 0 || attention.unreadCount > 0;
  const alertSubtitle = attention
    ? `${attention.actionCount} à traiter · ${attention.unreadCount} information${attention.unreadCount === 1 ? "" : "s"} non lue${attention.unreadCount === 1 ? "" : "s"}`
    : alerts ? `${alerts.open} alerte${alerts.open === 1 ? "" : "s"} ouverte${alerts.open === 1 ? "" : "s"}` : "Consulter les alertes et les demandes";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Retour">
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>OUMMAH</Text><Text style={styles.title}>Administration</Text></View>
        <Pressable onPress={() => void load(true)} disabled={loading || refreshing} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Actualiser">
          <Ionicons name="refresh" size={20} color={colors.goldLight} />
        </Pressable>
      </View>
      {loading ? <ActivityIndicator style={styles.loader} color={colors.goldLight} /> : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={colors.goldLight} />}>
          {error ? <Pressable onPress={() => void load(true)} accessibilityRole="button" style={styles.errorBox}><Text style={styles.errorText}>{error}</Text><Text style={styles.retry}>Réessayer</Text></Pressable> : null}

          <View style={styles.stats}>
            <View style={styles.stat}><Text style={styles.statValue}>{dashboard?.usersTotal.toLocaleString("fr-FR") ?? "—"}</Text><Text style={styles.statLabel}>Utilisateurs</Text></View>
            <View style={styles.statDivider} />
            <View style={styles.stat}><Text style={styles.statValue}>{dashboard?.usersToday.toLocaleString("fr-FR") ?? "—"}</Text><Text style={styles.statLabel}>Inscrits aujourd’hui</Text></View>
          </View>

          {showAttention ? <Pressable onPress={() => router.push("/admin/alerts")} accessibilityRole="button"
            style={({ pressed }) => [styles.attention, critical && styles.attentionCritical, pressed && styles.pressed]}>
            <Ionicons name={critical ? "warning-outline" : "notifications-outline"} size={22} color={critical ? colors.danger : colors.goldLight} />
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{critical ? `${alerts!.critical} alerte${alerts!.critical === 1 ? "" : "s"} importante${alerts!.critical === 1 ? "" : "s"}` : "À surveiller"}</Text>
              <Text style={styles.rowSubtitle}>{alertSubtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable> : null}

          <Text style={styles.sectionTitle}>L’essentiel</Text>
          <View style={styles.menu}>
            <MenuRow title="Utilisateurs" subtitle="Rechercher un compte et gérer ses crédits" icon="people-outline" onPress={() => router.push("/admin/users")} />
            <MenuRow title="Support" subtitle={support ? `${support.open} ouvert${support.open === 1 ? "" : "s"} · ${support.urgent} urgent${support.urgent === 1 ? "" : "s"}` : "Répondre aux demandes des utilisateurs"} icon="chatbubbles-outline" badge={support?.unread} onPress={() => router.push("/admin/support")} />
            <MenuRow title="Mosquées" subtitle="Propositions, horaires et signalements" icon="business-outline" badge={mosqueCount} expanded={openGroup === "mosques"} onPress={() => toggle("mosques")} />
            {openGroup === "mosques" ? <Submenu entries={[
              { title: "Valider les mosquées", subtitle: "Accepter ou refuser les propositions", route: "/admin/mosques", badge: dashboard?.mosquePending },
              { title: "Valider les horaires", subtitle: "Prières et heure de Joumou’a", route: "/admin/mosque-prayer-times", badge: prayerTimes ?? undefined },
              { title: "Traiter les signalements", subtitle: "Corriger les erreurs remontées", route: "/admin/mosque-reports", badge: dashboard?.mosqueReportsPending },
            ]} /> : null}
            <MenuRow title="Abonnements & revenus" subtitle="Premium, crédits Wasil et finances" icon="diamond-outline" expanded={openGroup === "finance"} onPress={() => toggle("finance")} />
            {openGroup === "finance" ? <Submenu entries={[
              { title: "Gérer Premium & Wasil", subtitle: "Accès Premium et crédits des utilisateurs", route: "/admin/premium-wasil" },
              { title: "Voir les revenus", subtitle: "Ventes, abonnements et remboursements", route: "/admin/revenuecat-finance" },
              { title: "Suivre les coûts Wasil", subtitle: "Dépenses IA et rentabilité", route: "/admin/wasil-finance" },
            ]} /> : null}
            <MenuRow title="Communication" subtitle="Envoyer une notification ou publier une annonce" icon="megaphone-outline" expanded={openGroup === "communication"} onPress={() => toggle("communication")} />
            {openGroup === "communication" ? <Submenu entries={[
              { title: "Envoyer une notification", subtitle: "Un message sur le téléphone des utilisateurs", route: "/admin/push-notifications" },
              { title: "Publier une annonce", subtitle: "Un message visible dans l’application", route: "/admin/announcements" },
            ]} /> : null}
            <MenuRow title="Statistiques" subtitle="Fréquentation et modules les plus utilisés" icon="bar-chart-outline" onPress={() => router.push("/admin/analytics")} />
          </View>

          <View style={styles.advanced}>
            <MenuRow title="Options avancées" subtitle="Équipe, historique et contrôles techniques" icon="options-outline" expanded={openGroup === "advanced"} onPress={() => toggle("advanced")} />
            {openGroup === "advanced" ? <Submenu entries={[
              { title: "Centre d’alertes", subtitle: "Toutes les alertes et informations", route: "/admin/alerts" },
              { title: "Tableau de bord détaillé", subtitle: "Indicateurs complets et projections", route: "/admin/cockpit" },
              { title: "Contrôle des achats", subtitle: "Vérifications et synchronisation RevenueCat", route: "/admin/revenuecat-control" },
              { title: "Équipe administratrice", subtitle: "Rôles et accès", route: "/admin/team" },
              { title: "Historique des actions", subtitle: "Validations et modifications effectuées", route: "/admin/activity" },
              { title: "Réglages des alertes", subtitle: "Seuils et surveillance", route: "/admin/alert-settings" },
            ]} /> : null}
          </View>

          <View style={styles.usersHeader}>
            <View>
              <Text style={styles.sectionTitle}>Tous les utilisateurs</Text>
              <Text style={styles.usersCount}>{users.length} compte{users.length === 1 ? "" : "s"} affiché{users.length === 1 ? "" : "s"}</Text>
            </View>
            <Pressable onPress={() => router.push("/admin/users")} accessibilityRole="button">
              <Text style={styles.allUsersLink}>Rechercher</Text>
            </Pressable>
          </View>

          {users.map((user) => (
            <Pressable
              key={user.userId}
              onPress={() => router.push({ pathname: "/admin/users/[id]", params: { id: user.userId } })}
              accessibilityRole="button"
              style={({ pressed }) => [styles.userCard, pressed && styles.pressed]}
            >
              <View style={styles.rowCopy}>
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                <Text style={styles.userDate}>Inscrit le {new Date(user.createdAt).toLocaleDateString("fr-FR")}</Text>
              </View>
              <Text style={styles.userBalance}>{user.balance.toLocaleString("fr-FR")} crédits</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 76, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  headerCopy: { flex: 1, alignItems: "center" },
  headerButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: colors.card, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: colors.goldMuted, fontSize: 9, fontWeight: "700", letterSpacing: 2 },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 26 },
  loader: { marginTop: 70 },
  content: { padding: 16, paddingBottom: 32 },
  stats: { flexDirection: "row", alignItems: "center", paddingVertical: 14, marginBottom: 14 },
  stat: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  statValue: { color: colors.text, fontSize: 26, fontWeight: "700" },
  statLabel: { color: colors.textSecondary, marginTop: 4, fontSize: 12, textAlign: "center" },
  statDivider: { width: 1, height: 32, backgroundColor: colors.borderSoft },
  attention: { padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 16, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderSoft },
  attentionCritical: { borderColor: colors.danger },
  sectionTitle: { color: colors.goldLight, fontSize: 13, fontWeight: "700", marginTop: 24, marginBottom: 10 },
  menu: { borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 20, overflow: "hidden", backgroundColor: colors.card },
  menuRow: { minHeight: 80, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  menuIcon: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.08)" },
  rowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: "700" },
  rowSubtitle: { marginTop: 4, color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
  badge: { minWidth: 23, borderRadius: 12, paddingHorizontal: 6, paddingVertical: 3, alignItems: "center", backgroundColor: colors.goldLight },
  badgeText: { color: colors.background, fontSize: 11, fontWeight: "800" },
  submenu: { paddingLeft: 22, paddingRight: 14, backgroundColor: colors.backgroundSecondary },
  subRow: { minHeight: 68, paddingVertical: 13, gap: 10, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSoft },
  subTitle: { color: colors.text, fontSize: 14, fontWeight: "600" },
  advanced: { marginTop: 22, borderRadius: 18, overflow: "hidden", borderWidth: 1, borderColor: colors.borderSoft },
  usersHeader: { marginTop: 10, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  usersCount: { marginTop: -6, color: colors.textMuted, fontSize: 11 },
  allUsersLink: { paddingVertical: 10, color: colors.goldLight, fontSize: 12, fontWeight: "700" },
  userCard: { minHeight: 68, marginTop: 9, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.card },
  userEmail: { color: colors.text, fontSize: 13, fontWeight: "700" },
  userDate: { marginTop: 4, color: colors.textMuted, fontSize: 10.5 },
  userBalance: { color: colors.goldLight, fontSize: 11, fontWeight: "700" },
  errorBox: { padding: 14, borderRadius: 14, backgroundColor: colors.surfaceAlt, marginBottom: 10 },
  errorText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  retry: { marginTop: 8, color: colors.goldLight, fontWeight: "700" },
  pressed: { opacity: 0.7 },
});
