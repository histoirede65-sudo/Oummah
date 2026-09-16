import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import type { FiqhTopic } from "../fiqhTypes";

export function FiqhLessonCard({ topic, index, onPress }: { topic: FiqhTopic; index: number; onPress: () => void }) {
  const comingSoon = topic.publicationStatus === "coming_soon" || topic.publicationStatus === "blocked";
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, comingSoon && styles.cardComingSoon, pressed && styles.pressed]}>
      <View style={styles.top}>
        <Text style={styles.number}>{String(index + 1).padStart(2, "0")}</Text>
        {comingSoon ? (
          <View style={styles.soonBadge}><Ionicons name="lock-closed-outline" size={12} color={colors.goldLight} /><Text style={styles.soonText}>BIENTÔT</Text></View>
        ) : (
          <Ionicons name="arrow-forward" size={17} color={colors.goldLight} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>{topic.title}</Text>
      <Text style={styles.summary} numberOfLines={3}>{comingSoon ? "Contenu en préparation documentaire." : topic.summary}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: 252, minHeight: 174, padding: 19, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  cardComingSoon: { backgroundColor: colors.purpleDeep, borderColor: colors.goldDark },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  number: { color: colors.goldLight, fontSize: 12, fontWeight: "800" },
  soonBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 10, backgroundColor: "rgba(216, 181, 105, 0.08)", borderWidth: 1, borderColor: colors.goldDark },
  soonText: { color: colors.goldLight, fontSize: 9, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.text, fontSize: 20, lineHeight: 25, fontWeight: "800", marginTop: 22 },
  summary: { color: colors.textSecondary, fontSize: 14, lineHeight: 21, marginTop: 8 },
});
