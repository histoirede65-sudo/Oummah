import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { DailyGoal } from "../domain/DailyGoal";
import { isGoalComplete } from "../domain/DailyGoal";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

const ICONS: Record<DailyGoal["category"], keyof typeof Ionicons.glyphMap> = {
  quran: "book-outline", hifz: "school-outline", dhikr: "ellipse-outline", dua: "heart-outline", hadith: "library-outline", prayer: "time-outline", calendar: "calendar-outline", character: "people-outline", personal: "sparkles-outline",
};

export default function DailyGoalCard({ goal, onPress, onDelete }: { goal: DailyGoal; onPress(): void; onDelete?: () => void }) {
  const complete = isGoalComplete(goal);
  const ratio = Math.min(1, goal.progress.current / goal.progress.target);
  const displayCurrent = goal.progress.unit === "minute" ? Math.floor(goal.progress.current / 60) : Math.floor(goal.progress.current);
  const displayTarget = goal.progress.unit === "minute" ? Math.ceil(goal.progress.target / 60) : goal.progress.target;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, complete && styles.cardComplete, pressed && styles.pressed]}>
      <View style={[styles.icon, complete && styles.iconComplete]}><Ionicons name={complete ? "checkmark" : ICONS[goal.category]} size={18} color={complete ? colors.background : colors.goldLight} /></View>
      <View style={styles.copy}>
        <View style={styles.titleRow}><Text numberOfLines={1} style={[styles.title, complete && styles.titleComplete]}>{goal.title}</Text><Text style={styles.time}>{goal.estimatedMinutes} min</Text></View>
        <Text numberOfLines={1} style={styles.subtitle}>{complete && goal.progress.completedAt ? `Terminé à ${new Date(goal.progress.completedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : goal.subtitle}</Text>
        <View style={styles.progressRow}><View style={styles.track}><View style={[styles.fill, { width: `${ratio * 100}%` }]} /></View><Text style={styles.progressText}>{displayCurrent}/{displayTarget}</Text></View>
      </View>
      {goal.personal ? (
        <Pressable
          accessibilityLabel="Supprimer cet objectif"
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onDelete?.();
          }}
          style={({ pressed }) => [styles.deleteButton, pressed && styles.deleteButtonPressed]}
        >
          <Ionicons name="trash-outline" size={19} color={colors.danger} />
        </Pressable>
      ) : (
        <Ionicons name={goal.validation === "manual" ? (complete ? "checkmark-circle" : "ellipse-outline") : "chevron-forward"} size={20} color={complete ? colors.goldLight : colors.textMuted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 82, padding: 12, flexDirection: "row", alignItems: "center", borderRadius: 19, borderWidth: 1, borderColor: "rgba(255,255,255,0.075)", backgroundColor: "rgba(255,255,255,0.032)" },
  cardComplete: { borderWidth: 2, borderColor: colors.success, backgroundColor: "rgba(98,197,139,0.23)", shadowColor: colors.success, shadowOpacity: 0.95, shadowRadius: 19, elevation: 12 },
  pressed: { opacity: 0.72 },
  icon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "rgba(241,188,79,0.09)" },
  iconComplete: { backgroundColor: colors.success },
  copy: { flex: 1, minWidth: 0, marginHorizontal: 10 },
  titleRow: { flexDirection: "row", alignItems: "center" },
  title: { flex: 1, color: colors.text, fontFamily: typography.serifMedium, fontSize: 16 },
  titleComplete: { color: colors.success },
  time: { marginLeft: 7, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5 },
  subtitle: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5 },
  progressRow: { marginTop: 7, flexDirection: "row", alignItems: "center" },
  track: { flex: 1, height: 3, overflow: "hidden", borderRadius: 2, backgroundColor: "rgba(255,255,255,0.09)" },
  fill: { height: "100%", borderRadius: 2, backgroundColor: colors.goldLight },
  progressText: { width: 36, marginLeft: 7, color: colors.goldMuted, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "700", textAlign: "right" },
  deleteButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 15, borderWidth: 1, borderColor: "rgba(233,107,114,0.42)", backgroundColor: "rgba(233,107,114,0.12)" },
  deleteButtonPressed: { backgroundColor: "rgba(233,107,114,0.24)" },
});
