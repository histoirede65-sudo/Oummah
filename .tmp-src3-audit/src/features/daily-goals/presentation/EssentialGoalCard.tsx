import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DailyGoal } from "../domain/DailyGoal";
import { isGoalComplete } from "../domain/DailyGoal";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

export default function EssentialGoalCard({ goal, onPress }: { goal: DailyGoal; onPress(): void }) {
  const complete = isGoalComplete(goal);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <LinearGradient colors={["rgba(225,160,50,0.17)", "rgba(54,30,66,0.54)"]} style={StyleSheet.absoluteFill} />
      <View style={styles.icon}><Ionicons name={complete ? "checkmark" : "star-outline"} size={19} color={complete ? colors.background : colors.goldLight} /></View>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>OBJECTIF ESSENTIEL</Text>
        <Text style={styles.title}>{goal.title}</Text>
        <Text style={styles.subtitle}>{complete ? "Petite victoire accomplie aujourd’hui" : goal.subtitle}</Text>
      </View>
      <View style={styles.action}><Text style={styles.actionText}>{complete ? "Terminé" : "Continuer"}</Text><Ionicons name="arrow-forward" size={14} color={colors.background} /></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 105, overflow: "hidden", padding: 15, flexDirection: "row", alignItems: "center", borderRadius: 22, borderWidth: 1, borderColor: "rgba(241,188,79,0.34)" },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  icon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: colors.goldLight },
  copy: { flex: 1, minWidth: 0, marginHorizontal: 11 },
  eyebrow: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 9.5, fontWeight: "800", letterSpacing: 1 },
  title: { marginTop: 4, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 18 },
  subtitle: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5 },
  action: { minHeight: 32, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", borderRadius: 12, backgroundColor: colors.goldLight },
  actionText: { marginRight: 4, color: colors.background, fontFamily: typography.sans, fontSize: 11, fontWeight: "800" },
});
