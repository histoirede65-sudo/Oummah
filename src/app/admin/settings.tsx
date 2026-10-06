import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AdminScreen, adminStyles, Card, SectionTitle } from "../../components/admin/AdminUI";
import { colors } from "../../theme/colors";

/** Technical tools kept out of the way of daily work. Every former admin screen stays reachable here. */
const GROUPS: { title: string; items: { label: string; text: string; icon: keyof typeof Ionicons.glyphMap; href: Href }[] }[] = [
  {
    title: "Comptes et abonnements",
    items: [
      { label: "Premium et crédits Wasil", text: "Tous les comptes Premium, accès manuels", icon: "diamond-outline", href: "/admin/premium-wasil" },
      { label: "Contrôle des achats", text: "Vérifier et resynchroniser RevenueCat", icon: "card-outline", href: "/admin/revenuecat-control" },
    ],
  },
  {
    title: "Modération : listes complètes",
    items: [
      { label: "Signalements", text: "En attente, résolus et ignorés", icon: "flag-outline", href: "/admin/mosque-reports" },
      { label: "Mur des duas", text: "Toutes les duas à examiner", icon: "hand-left-outline", href: "/admin/dua-wall" },
      { label: "Support", text: "Tous les tickets, y compris fermés", icon: "chatbubbles-outline", href: "/admin/support" },
    ],
  },
  {
    title: "Équipe et suivi",
    items: [
      { label: "Équipe administratrice", text: "Ajouter une personne, changer son rôle", icon: "people-circle-outline", href: "/admin/team" },
      { label: "Historique des actions", text: "Qui a validé ou modifié quoi", icon: "time-outline", href: "/admin/activity" },
      { label: "Centre d’alertes", text: "Alertes techniques et financières", icon: "warning-outline", href: "/admin/alerts" },
      { label: "Réglages des alertes", text: "Seuils et surveillance", icon: "options-outline", href: "/admin/alert-settings" },
      { label: "Tableau de bord détaillé", text: "Tous les indicateurs et projections", icon: "speedometer-outline", href: "/admin/cockpit" },
    ],
  },
];

export default function AdminSettings() {
  return (
    <AdminScreen title="Réglages">
      {GROUPS.map((group) => (
        <View key={group.title}>
          <SectionTitle>{group.title}</SectionTitle>
          <Card>
            {group.items.map((item, index) => (
              <Pressable key={item.label} onPress={() => router.push(item.href)} style={({ pressed }) => [styles.row, index > 0 && styles.rowBorder, pressed && { opacity: 0.6 }]} accessibilityRole="button">
                <Ionicons name={item.icon} size={20} color={colors.goldLight} />
                <View style={styles.copy}>
                  <Text style={adminStyles.rowTitle}>{item.label}</Text>
                  <Text style={adminStyles.meta}>{item.text}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </Pressable>
            ))}
          </Card>
        </View>
      ))}
    </AdminScreen>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.1)" },
  copy: { flex: 1 },
});
