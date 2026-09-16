import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import HadithScreenHeader from "../../features/hadith/presentation/HadithScreenHeader";
import {
  activateHadithProgram,
  dueHadithReviews,
  getHadithProgramTranslationKeys,
  HADITH_PROGRAM_TEMPLATES,
  loadHadithLearningState,
  type HadithLearningState,
} from "../../features/hadith/services/hadithLearningService";
import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export default function HadithLearningScreen() {
  const { t } = useI18n();
  const [state, setState] = useState<HadithLearningState>();
  const [loadError, setLoadError] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoadError(false);
    void loadHadithLearningState()
      .then((value) => active && setState(value))
      .catch(() => active && setLoadError(true));
    return () => { active = false; };
  }, []));

  const due = state ? dueHadithReviews(state) : [];
  const choose = async (template: (typeof HADITH_PROGRAM_TEMPLATES)[number]) => {
    const next = await activateHadithProgram(template);
    setState(next);
  };
  const activeKeys = state?.activeProgram ? getHadithProgramTranslationKeys(state.activeProgram.id) : null;

  return (
    <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}>
          <HadithScreenHeader title={t("hadith.learning.title")} subtitle={t("hadith.learning.subtitle")} />
        </View>
        {!state && !loadError ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.goldLight} />
            <Text style={styles.stateText}>{t("hadith.learning.loading")}</Text>
          </View>
        ) : loadError ? (
          <View style={styles.center}><Text style={styles.stateText}>{t("hadith.learning.loadError")}</Text></View>
        ) : state ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.hero}>
              <LinearGradient colors={["#533256", "#20152E"]} style={StyleSheet.absoluteFill} />
              <Text style={styles.heroKicker}>{t("hadith.learning.yourJourney")}</Text>
              <Text style={styles.heroTitle}>{activeKeys ? t(activeKeys.title) : t("hadith.learning.choosePace")}</Text>
              <Text style={styles.heroText}>{activeKeys ? t(activeKeys.description) : t("hadith.learning.defaultDescription")}</Text>
              <View style={styles.stats}>
                <Stat value={state.streak} label={t("hadith.learning.days")} />
                <Stat value={state.memorizedIds.length} label={t("hadith.learning.memorized")} />
                <Stat value={due.length} label={t("hadith.learning.due")} />
              </View>
              {state.activeProgram ? (
                <Pressable accessibilityRole="button" accessibilityLabel={due.length ? t("hadith.learning.startReviews") : t("hadith.learning.continueProgram")} onPress={() => router.push("/hadith/learning/session" as Href)} style={styles.primary}>
                  <Ionicons name="play" size={17} color="#1B1321" />
                  <Text style={styles.primaryText}>{due.length ? t("hadith.learning.startReviews") : t("hadith.learning.continueProgram")}</Text>
                </Pressable>
              ) : null}
            </View>

            <Text style={styles.sectionTitle}>{t("hadith.learning.programs")}</Text>
            <View style={styles.programs}>
              {HADITH_PROGRAM_TEMPLATES.map((template) => {
                const active = state.activeProgram?.id === template.id;
                const keys = getHadithProgramTranslationKeys(template.id);
                const title = keys ? t(keys.title) : template.title;
                return (
                  <Pressable accessibilityRole="button" accessibilityLabel={t("hadith.learning.selectProgram", { name: title })} key={template.id} onPress={() => choose(template)} style={[styles.program, active && styles.programActive]}>
                    <View style={styles.programIcon}>
                      <Ionicons name={template.id === "nawawi" ? "library-outline" : template.id === "character" ? "heart-outline" : "calendar-outline"} size={21} color={colors.goldLight} />
                    </View>
                    <View style={styles.programCopy}>
                      <Text style={styles.programTitle}>{title}</Text>
                      <Text style={styles.programText}>{keys ? t(keys.description) : template.description}</Text>
                      <Text style={styles.programMeta}>{t("hadith.learning.hadithCount", { count: template.targetCount })} · {template.cadence === "daily" ? t("hadith.learning.daily") : t("hadith.learning.flexiblePace")}</Text>
                    </View>
                    {active ? <Ionicons name="checkmark-circle" size={22} color="#75D1A0" /> : <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />}
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.method}>
              <Text style={styles.methodTitle}>{t("hadith.learning.spacedRepetitionTitle")}</Text>
              <Text style={styles.methodText}>{t("hadith.learning.spacedRepetitionText")}</Text>
            </View>
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, safe: { flex: 1 }, header: { paddingHorizontal: 18 }, content: { padding: 18, paddingTop: 13, paddingBottom: 110 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 12 }, stateText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, lineHeight: 18, textAlign: "center" }, hero: { minHeight: 270, borderRadius: 29, overflow: "hidden", padding: 21, borderWidth: 1, borderColor: "rgba(238,200,120,0.28)" }, heroKicker: { color: colors.goldLight, fontFamily: typography.sans, fontWeight: "800", fontSize: 9, letterSpacing: 1.5 }, heroTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 28, marginTop: 7 }, heroText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12, lineHeight: 18, marginTop: 5 }, stats: { flexDirection: "row", gap: 8, marginTop: 20 }, stat: { flex: 1, padding: 11, borderRadius: 16, backgroundColor: "rgba(9,7,19,0.32)" }, statValue: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21 }, statLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9 }, primary: { marginTop: 20, height: 47, borderRadius: 16, backgroundColor: colors.goldLight, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, primaryText: { color: "#1B1321", fontFamily: typography.sans, fontSize: 11.5, fontWeight: "800" }, sectionTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 22, marginTop: 27, marginBottom: 12 }, programs: { gap: 9 }, program: { minHeight: 91, padding: 14, borderRadius: 21, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(28,19,41,0.84)", borderWidth: 1, borderColor: "rgba(139,91,160,0.18)" }, programActive: { borderColor: "rgba(117,209,160,0.38)", backgroundColor: "rgba(42,49,48,0.72)" }, programIcon: { width: 43, height: 43, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.1)" }, programCopy: { flex: 1 }, programTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 17 }, programText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 10, marginTop: 2 }, programMeta: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9, marginTop: 5 }, method: { marginTop: 22, padding: 17, borderRadius: 21, backgroundColor: "rgba(93,70,128,0.11)" }, methodTitle: { color: "#D7B9E5", fontFamily: typography.sans, fontSize: 11.5, fontWeight: "700" }, methodText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, lineHeight: 16, marginTop: 5 },
});
