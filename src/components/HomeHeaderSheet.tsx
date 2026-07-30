import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

type SheetMode = "menu" | "notifications";

const MENU_ITEMS = [
  { label: "Mon profil", subtitle: "Préférences et parcours", icon: "person-outline", route: "/profile" },
  { label: "Objectifs du jour", subtitle: "Votre programme spirituel", icon: "checkmark-circle-outline", route: "/daily-goals" },
  { label: "Hadith du jour", subtitle: "Lire et méditer", icon: "library-outline", route: "/hadith" },
  { label: "Calendrier islamique", subtitle: "Événements et rappels", icon: "calendar-outline", route: "/calendar" },
  { label: "Mes mosquées", subtitle: "Horaires et favoris", icon: "business-outline", route: "/mosques" },
] as const;

export default function HomeHeaderSheet({
  visible,
  mode,
  onClose,
  onOpenAdhan,
}: {
  visible: boolean;
  mode: SheetMode;
  onClose(): void;
  onOpenAdhan(): void;
}) {
  const open = (route: string) => {
    onClose();
    router.push(route as Href);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={styles.backdrop}>
        <Pressable onPress={(event) => event.stopPropagation()} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.eyebrow}>
                {mode === "menu" ? "NAVIGATION" : "VOS RAPPELS"}
              </Text>
              <Text style={styles.title}>
                {mode === "menu" ? "Menu OUMMAH" : "Notifications"}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {mode === "menu" ? (
            <View style={styles.items}>
              {MENU_ITEMS.map((item) => (
                <Pressable key={item.label} onPress={() => open(item.route)} style={styles.item}>
                  <View style={styles.icon}>
                    <Ionicons name={item.icon} size={19} color={colors.goldLight} />
                  </View>
                  <View style={styles.copy}>
                    <Text style={styles.itemTitle}>{item.label}</Text>
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.items}>
              <Pressable onPress={() => { onClose(); onOpenAdhan(); }} style={styles.item}>
                <View style={styles.icon}><Ionicons name="volume-high-outline" size={19} color={colors.goldLight} /></View>
                <View style={styles.copy}><Text style={styles.itemTitle}>Alertes de l’Adhan</Text><Text style={styles.itemSubtitle}>Prières, son et anticipation</Text></View>
                <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
              </Pressable>
              <Pressable onPress={() => open("/calendar")} style={styles.item}>
                <View style={styles.icon}><Ionicons name="calendar-outline" size={19} color={colors.goldLight} /></View>
                <View style={styles.copy}><Text style={styles.itemTitle}>Rappels du calendrier</Text><Text style={styles.itemSubtitle}>Événements et dates islamiques</Text></View>
                <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
              </Pressable>
              <Pressable onPress={() => open("/daily-goals")} style={styles.item}>
                <View style={styles.icon}><Ionicons name="sparkles-outline" size={19} color={colors.goldLight} /></View>
                <View style={styles.copy}><Text style={styles.itemTitle}>Rappels d’objectifs</Text><Text style={styles.itemSubtitle}>Votre programme du jour</Text></View>
                <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
              </Pressable>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(3,4,10,0.72)" },
  sheet: { paddingTop: 9, paddingHorizontal: 18, paddingBottom: 26, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderBottomWidth: 0, borderColor: "rgba(241,188,79,0.20)", backgroundColor: colors.backgroundSecondary },
  handle: { width: 42, height: 4, marginBottom: 16, alignSelf: "center", borderRadius: 2, backgroundColor: "rgba(255,255,255,0.19)" },
  header: { marginBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 8, fontWeight: "800", letterSpacing: 1.1 },
  title: { marginTop: 3, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 23 },
  close: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)" },
  items: { gap: 7 },
  item: { minHeight: 62, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", borderRadius: 17, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.03)" },
  icon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "rgba(241,188,79,0.09)" },
  copy: { flex: 1, minWidth: 0, marginHorizontal: 10 },
  itemTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 14 },
  itemSubtitle: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5 },
});
