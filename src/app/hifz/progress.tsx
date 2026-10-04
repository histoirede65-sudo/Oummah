import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { dateKey, loadHifzState, type HifzState } from "../../features/hifz/HifzStore";

export default function HifzProgressScreen() {
  const { t } = useI18n();
  const [state, setState] = useState<HifzState>();
  useFocusEffect(useCallback(() => { void loadHifzState().then(setState); }, []));
  const learned = state?.progress.reduce((sum, item) => sum + item.learnedVerses.length, 0) ?? 0;
  const minutes = state?.sessions.reduce((sum, item) => sum + item.minutes, 0) ?? 0;
  const regularDays = new Set(state?.sessions.map((item) => item.date)).size;
  const progress = state ? Math.min(1, learned / state.annualTarget) : 0;
  const today = dateKey();
  return <SafeAreaView style={styles.safe} edges={["top"]}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><Pressable accessibilityLabel={t("common.back")} onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={21} color={colors.goldLight} /></Pressable><Text style={styles.title}>{t("hifz.progress")}</Text></View>
    <View style={styles.progressCard}><Text style={styles.cardLabel}>{t("hifz.progressScreen.overall")}</Text><Text style={styles.percent}>{Math.round(progress * 100)} %</Text><View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View><Text style={styles.meta}>{t(learned > 1 ? "hifz.learnedMany" : "hifz.learnedOne", { count: learned })}</Text></View>
    <View style={styles.grid}><Metric label={t("hifz.progressScreen.versesLearned")} value={String(learned)} /><Metric label={t("hifz.progressScreen.activeDays")} value={String(regularDays)} /><Metric label={t("hifz.progressScreen.totalTime")} value={t("hifz.progressScreen.minutes", { count: minutes })} /></View>
    <Text style={styles.section}>{t("hifz.progressScreen.recentActivity")}</Text>
    <View style={styles.activity}><Text style={styles.activityText}>{state?.sessions.some((item) => item.date === today) ? t("hifz.progressScreen.sessionToday") : t("hifz.progressScreen.noSessionToday")}</Text><Text style={styles.activityHint}>{t("hifz.progressScreen.activityHint")}</Text></View>
  </ScrollView></SafeAreaView>;
}
function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, content: { padding: 16, paddingBottom: 80 }, header: { flexDirection: "row", alignItems: "center", marginBottom: 22 }, back: { padding: 8, marginRight: 8 }, title: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 26 }, progressCard: { padding: 20, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft }, cardLabel: { color: colors.goldLight, fontSize: 10, fontWeight: "800", letterSpacing: 1 }, percent: { marginTop: 12, color: colors.text, fontFamily: typography.serifMedium, fontSize: 40, fontVariant: ["lining-nums", "tabular-nums"] }, track: { height: 7, marginTop: 12, overflow: "hidden", borderRadius: 4, backgroundColor: "rgba(255,255,255,0.14)" }, fill: { height: "100%", backgroundColor: colors.goldLight }, meta: { marginTop: 10, color: colors.textSecondary, fontSize: 14 }, grid: { marginTop: 12, flexDirection: "row", gap: 8 }, metric: { flex: 1, minHeight: 92, padding: 12, justifyContent: "center", borderRadius: 16, backgroundColor: colors.surface }, metricValue: { color: colors.goldLight, fontSize: 22, fontWeight: "800" }, metricLabel: { marginTop: 5, color: colors.textMuted, fontSize: 11, lineHeight: 15 }, section: { marginTop: 28, marginBottom: 10, color: colors.text, fontFamily: typography.serifMedium, fontSize: 21 }, activity: { padding: 16, borderRadius: 16, backgroundColor: colors.surface }, activityText: { color: colors.text, fontSize: 15, fontWeight: "700" }, activityHint: { marginTop: 6, color: colors.textSecondary, fontSize: 13, lineHeight: 19 } });
