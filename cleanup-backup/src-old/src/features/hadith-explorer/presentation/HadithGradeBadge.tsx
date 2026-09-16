import { StyleSheet, Text, View } from "react-native";
import type { HadithGradeKind } from "../domain/HadithGrade";
import { typography } from "../../../theme/typography";

const PALETTE: Record<HadithGradeKind, { background: string; border: string; text: string }> = {
  sahih: { background: "rgba(72,168,123,0.16)", border: "rgba(102,217,154,0.42)", text: "#8EE5B4" },
  hasan: { background: "rgba(211,170,75,0.15)", border: "rgba(227,181,90,0.42)", text: "#F1CB77" },
  daif: { background: "rgba(218,104,106,0.14)", border: "rgba(233,107,114,0.4)", text: "#F09B9F" },
  disputed: { background: "rgba(159,117,199,0.15)", border: "rgba(184,142,221,0.4)", text: "#D0A9ED" },
  unclassified: { background: "rgba(160,151,170,0.12)", border: "rgba(190,182,199,0.28)", text: "#C7BED1" },
};

export default function HadithGradeBadge({ grade, kind }: { grade: string; kind: HadithGradeKind }) {
  const palette = PALETTE[kind];
  return (
    <View style={[styles.badge, { backgroundColor: palette.background, borderColor: palette.border }]}>
      <View style={[styles.dot, { backgroundColor: palette.text }]} />
      <Text numberOfLines={1} style={[styles.text, { color: palette.text }]}>{grade}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", maxWidth: "100%", borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  text: { fontFamily: typography.sans, fontSize: 10.5, fontWeight: "700" },
});


