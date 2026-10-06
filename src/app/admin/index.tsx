import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AdminScreen, adminStyles, Card } from "../../components/admin/AdminUI";
import { getAdminAlertCounts, type AdminAlertCounts } from "../../features/admin/AdminAlertsService";
import { inboxTotal, loadInbox, type Inbox } from "../../features/admin/adminInbox";
import { getAdminDashboard, type AdminDashboard } from "../../features/admin/AdminService";
import { getValidSession } from "../../features/auth/SupabaseAuthService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

/** Admin home: what waits for a decision first, then five doors. Technical tools live in « Réglages ». */
export default function AdminHomeScreen() {
  const [inbox, setInbox] = useState<Inbox | null>(null);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [alerts, setAlerts] = useState<AdminAlertCounts | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const request = useRef(0);

  const load = useCallback(async (pull = false) => {
    const id = ++request.current;
    if (pull) setRefreshing(true);
    if (!(await getValidSession())) {
      router.replace("/profile");
      return;
    }
    const [nextInbox, nextDashboard, nextAlerts] = await Promise.all([
      loadInbox().catch(() => null),
      getAdminDashboard().catch(() => null),
      getAdminAlertCounts(true).catch(() => null),
    ]);
    if (id !== request.current) return;
    setInbox(nextInbox);
    setDashboard(nextDashboard);
    setAlerts(nextAlerts);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
    return () => {
      request.current += 1;
    };
  }, [load]));

  const total = inboxTotal(inbox);
  const parts = inbox
    ? [
        [inbox.support.length, "support"],
        [inbox.mosques.length, "mosquée"],
        [inbox.times.length, "horaire"],
        [inbox.posts.length, "annonce"],
        [inbox.reports.length, "signalement"],
        [inbox.wall.length, "dua"],
      ].filter(([count]) => Number(count) > 0).map(([count, label]) => `${count} ${label}${Number(count) > 1 && label !== "support" ? "s" : ""}`)
    : [];

  return (
    <AdminScreen title="Administration" eyebrow="OUMMAH" onRefresh={() => void load(true)} refreshing={refreshing}>
      <Pressable onPress={() => router.push("/admin/inbox")} accessibilityRole="button" style={({ pressed }) => [pressed && styles.pressed]}>
        <View style={[styles.inbox, total > 0 && styles.inboxActive]}>
          <View style={styles.inboxTop}>
            <Text style={[styles.inboxCount, total === 0 && styles.inboxCountDone]}>{inbox ? total : "…"}</Text>
            <View style={styles.inboxCopy}>
              <Text style={[styles.inboxTitle, total > 0 && styles.onGold]}>{total === 0 && inbox ? "Rien à traiter" : "À traiter"}</Text>
              <Text style={[styles.inboxText, total > 0 && styles.onGoldSoft]}>{inbox ? (parts.join(" · ") || "Tout est à jour") : "Chargement…"}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={total > 0 ? colors.background : colors.goldLight} />
          </View>
          {inbox?.failed.length ? <Text style={[styles.inboxWarn, total > 0 && styles.onGold]}>Non chargé : {inbox.failed.join(", ")}</Text> : null}
        </View>
      </Pressable>

      {alerts && alerts.critical > 0 ? (
        <Pressable onPress={() => router.push("/admin/alerts")} accessibilityRole="button">
          <Card>
            <View style={styles.row}>
              <Ionicons name="warning" size={22} color={colors.danger} />
              <View style={styles.copy}>
                <Text style={adminStyles.rowTitle}>{alerts.critical} alerte{alerts.critical > 1 ? "s" : ""} critique{alerts.critical > 1 ? "s" : ""}</Text>
                <Text style={adminStyles.meta}>Touchez pour voir</Text>
              </View>
            </View>
          </Card>
        </Pressable>
      ) : null}

      <Door icon="people-outline" title="Utilisateurs" text={dashboard ? `${dashboard.usersTotal.toLocaleString("fr-FR")} comptes · +${dashboard.usersToday} aujourd’hui` : "Chercher un compte, Premium, crédits"} href="/admin/users" />
      <Door icon="business-outline" title="Mosquées" text={dashboard ? `${dashboard.mosqueApproved} validées · ${dashboard.mosquePending} en attente` : "Valider, corriger, masquer"} href="/admin/mosques" />
      <Door icon="paper-plane-outline" title="Envoyer" text="Notification, annonce dans l’app, ou les deux" href="/admin/send" />
      <Door icon="stats-chart-outline" title="Chiffres" text="Utilisateurs, revenus, Wasil, modules" href="/admin/numbers" />

      <Pressable onPress={() => router.push("/admin/settings")} style={styles.settings} accessibilityRole="button">
        <Ionicons name="settings-outline" size={17} color={colors.textMuted} />
        <Text style={styles.settingsText}>Réglages · équipe, historique, alertes, listes complètes</Text>
      </Pressable>
    </AdminScreen>
  );
}

function Door({ icon, title, text, href }: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string; href: Href }) {
  return (
    <Pressable onPress={() => router.push(href)} accessibilityRole="button" style={({ pressed }) => [pressed && styles.pressed]}>
      <Card>
        <View style={styles.row}>
          <View style={styles.icon}><Ionicons name={icon} size={22} color={colors.goldLight} /></View>
          <View style={styles.copy}>
            <Text style={styles.doorTitle}>{title}</Text>
            <Text style={adminStyles.meta}>{text}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  inbox: { padding: 18, borderRadius: 24, borderWidth: 1, borderColor: "rgba(227,181,90,0.4)", backgroundColor: "rgba(227,181,90,0.07)" },
  inboxActive: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  inboxTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  inboxCount: { minWidth: 52, color: colors.background, fontFamily: typography.serifSemibold, fontSize: 52, lineHeight: 56 },
  inboxCountDone: { color: colors.goldLight },
  inboxCopy: { flex: 1 },
  inboxTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 26 },
  inboxText: { marginTop: 2, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, lineHeight: 19 },
  onGold: { color: colors.background },
  onGoldSoft: { color: "rgba(8,7,19,0.72)" },
  inboxWarn: { marginTop: 10, color: colors.danger, fontFamily: typography.sans, fontSize: 12.5 },
  row: { flexDirection: "row", alignItems: "center", gap: 14 },
  icon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.12)" },
  copy: { flex: 1 },
  doorTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 },
  settings: { marginTop: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12 },
  settingsText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 13.5 },
});
