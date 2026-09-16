import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, Pressable, View } from "react-native";
import { SIRAH_PERIODS } from "../../features/sirah/sirahData";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export default function SirahPeriodPage() {
  const { periodId } = useLocalSearchParams<{ periodId: string }>();
  const period = SIRAH_PERIODS.find((item) => item.id === periodId) ?? SIRAH_PERIODS[0];
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
    <Text style={styles.eyebrow}>SÎRA · {period.era.toUpperCase()}</Text><Text style={styles.title}>{period.title}</Text><Text style={styles.subtitle}>{period.subtitle}</Text>
    <View style={styles.line} />
    {period.chapters.map((chapter, index) => <View key={chapter.id} style={styles.chapter}>
      <View style={styles.marker}><Text style={styles.markerText}>{String(index + 1).padStart(2, "0")}</Text></View>
      <View style={[styles.card, period.era === "hijra" && styles.hijraCard]}><Text style={styles.chapterTitle}>{chapter.title}</Text>
        {chapter.assertions.map((assertion) => <View key={assertion.id} style={styles.assertion}><Text style={styles.assertionText}>{assertion.text}</Text><View style={styles.sources}>{assertion.sources.map((source) => <View key={`${assertion.id}-${source.reference}`} style={styles.source}><Text style={styles.sourceKind}>{source.kind === "DISCUSSED" ? "RÉCIT DISCUTÉ" : source.kind === "NOT_ESTABLISHED" ? "NON ÉTABLI" : source.kind}</Text><Text style={styles.sourceRef}>{source.reference}</Text></View>)}</View></View>)}
        <View style={styles.lesson}><Text style={styles.lessonLabel}>À RETENIR</Text>{chapter.lessons.map((lesson) => <Text key={lesson} style={styles.lessonText}>• {lesson}</Text>)}</View>
      </View>
    </View>)}
  </ScrollView>;
}
const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: "#080611" }, content: { padding: 22, paddingTop: 62, paddingBottom: 52 }, back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "rgba(209,165,80,0.36)", alignItems: "center", justifyContent: "center", marginBottom: 22 }, eyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "700", letterSpacing: 1.6 }, title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 30, marginTop: 9 }, subtitle: { color: "#B9AEC8", fontFamily: typography.sans, fontSize: 14, lineHeight: 20, marginTop: 8 }, line: { width: 1, backgroundColor: "#BD9148", position: "absolute", left: 42, top: 210, bottom: 42, opacity: 0.45 }, chapter: { flexDirection: "row", gap: 12, marginTop: 22 }, marker: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#171021", borderWidth: 1, borderColor: "#D1A451", alignItems: "center", justifyContent: "center", zIndex: 2 }, markerText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "700" }, card: { flex: 1, backgroundColor: "#120D1D", borderRadius: 20, borderWidth: 1, borderColor: "rgba(224,187,111,0.25)", padding: 17 }, hijraCard: { borderColor: "rgba(224,187,111,0.82)", backgroundColor: "#1D1421" }, chapterTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21, lineHeight: 26, marginBottom: 14 }, assertion: { marginBottom: 15 }, assertionText: { color: "#E5DCEA", fontFamily: typography.sans, fontSize: 15, lineHeight: 23 }, sources: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 9 }, source: { borderRadius: 10, borderWidth: 1, borderColor: "rgba(212,169,82,0.34)", backgroundColor: "#21172A", paddingHorizontal: 8, paddingVertical: 5 }, sourceKind: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 8, fontWeight: "700" }, sourceRef: { color: "#C8BDD1", fontFamily: typography.sans, fontSize: 9, marginTop: 2 }, lesson: { marginTop: 3, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(224,187,111,0.18)" }, lessonLabel: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 13, fontWeight: "700", letterSpacing: 1.4 }, lessonText: { color: "#FFF7E7", fontFamily: typography.serifMedium, fontSize: 19, lineHeight: 28, marginTop: 10 } });
