import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { StyleSheet, Text, View } from "react-native";

import type { DailyPlanSummary } from "../domain/DailyPlan";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

export default function DailyProgressHero({
  summary,
  streak,
}: {
  summary: DailyPlanSummary;
  streak: number;
}) {
  const circumference = 2 * Math.PI * 43;
  const offset = circumference * (1 - summary.progress);
  return (
    <View style={styles.card}>
      <LinearGradient
        colors={["rgba(83,45,101,0.72)", "rgba(23,18,31,0.96)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>VOTRE JOURNÉE SPIRITUELLE</Text>
        <Text style={styles.title}>
          {summary.completed} objectif{summary.completed > 1 ? "s" : ""} sur {summary.total}
        </Text>
        <Text style={styles.subtitle}>
          {summary.remainingMinutes > 0
            ? `${summary.remainingMinutes} minutes restantes aujourd’hui`
            : "Votre programme est accompli, alhamdulillah"}
        </Text>
        <View style={styles.streak}>
          <Ionicons name="flame-outline" size={14} color={colors.goldLight} />
          <Text style={styles.streakText}>{streak} jours de régularité</Text>
        </View>
        <Text style={styles.encouragement}>
          {summary.progress >= 1
            ? "Une belle journée. Avancez toujours avec douceur."
            : "Encore un petit effort pour prendre soin de votre journée."}
        </Text>
      </View>
      <View style={styles.ring}>
        <Svg width="106" height="106" viewBox="0 0 106 106">
          <Circle cx="53" cy="53" r="43" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <Circle
            cx="53"
            cy="53"
            r="43"
            fill="none"
            stroke="#F1BC4F"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            rotation="-90"
            origin="53, 53"
          />
        </Svg>
        <View style={styles.ringCopy}>
          <Text style={styles.percent}>{Math.round(summary.progress * 100)}%</Text>
          <Text style={styles.percentLabel}>ACCOMPLI</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 210,
    overflow: "hidden",
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(245,205,122,0.22)",
  },
  copy: { flex: 1, minWidth: 0, paddingRight: 8 },
  eyebrow: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 10, fontWeight: "800", letterSpacing: 1.15 },
  title: { marginTop: 7, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 26, lineHeight: 29 },
  subtitle: { marginTop: 5, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13.5, lineHeight: 17 },
  streak: { marginTop: 13, flexDirection: "row", alignItems: "center" },
  streakText: { marginLeft: 5, color: colors.goldLight, fontFamily: typography.sans, fontSize: 12.5, fontWeight: "700" },
  encouragement: { marginTop: 12, color: "rgba(238,228,235,0.62)", fontFamily: typography.serifMedium, fontSize: 12.5, lineHeight: 15 },
  ring: { width: 106, height: 106, alignItems: "center", justifyContent: "center" },
  ringCopy: { position: "absolute", alignItems: "center" },
  percent: { color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 25 },
  percentLabel: { marginTop: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 8.5, fontWeight: "800", letterSpacing: 0.7 },
});
