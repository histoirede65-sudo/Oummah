import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hadithRepository } from "../../../features/hadith-explorer/data/hadithRepository";
import type { Hadith } from "../../../features/hadith-explorer/domain/Hadith";
import HadithGradeBadge from "../../../features/hadith-explorer/presentation/HadithGradeBadge";
import HadithScreenHeader from "../../../features/hadith/presentation/HadithScreenHeader";
import { dueHadithReviews, loadHadithLearningState, recordHadithReview, type HadithReviewRating } from "../../../features/hadith/services/hadithLearningService";
import { useI18n } from "../../../i18n";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

type Step = "read" | "understand" | "memorize" | "review";

export default function HadithLearningSessionScreen() {
  const { language, t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [step, setStep] = useState<Step>("read");
  const [mask, setMask] = useState(0);
  const [error, setError] = useState(false);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    let active = true;
    setError(false);
    setEmpty(false);
    void loadHadithLearningState()
      .then(async (state) => {
        const due = dueHadithReviews(state);
        if (due[0]?.hadithId) return due[0].hadithId;
        const results = await hadithRepository.search(state.activeProgram?.query ?? "comportement", "fr");
        return results[0]?.id ?? null;
      })
      .then((id) => {
        if (!active) return;
        if (id) setSelectedId(id);
        else setEmpty(true);
      })
      .catch(() => active && setError(true));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    setHadith(null);
    setError(false);
    void hadithRepository.get(selectedId, language)
      .then((value) => {
        if (active) setHadith({ ...value, id: selectedId });
      })
      .catch(() => active && setError(true));
    return () => { active = false; };
  }, [language, selectedId]);

  const maskedText = useMemo(() => {
    if (!hadith || mask === 0) return hadith?.french ?? "";
    const words = hadith.french.split(/\s+/);
    const keep = mask === 1 ? 0.7 : mask === 2 ? 0.42 : mask === 3 ? 0.18 : 0;
    return words.map((word, index) => index / words.length < keep ? word : "••••").join(" ");
  }, [hadith, mask]);

  const rate = async (rating: HadithReviewRating) => {
    if (!hadith) return;
    await recordHadithReview(hadith, rating);
    router.replace("/hadith/learning" as never);
  };

  return (
    <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}>
          <HadithScreenHeader title={t("hadith.learning.sessionTitle")} subtitle={t("hadith.learning.guided")} />
        </View>
        {!hadith && !error && !empty ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.goldLight} />
            <Text style={styles.stateText}>{t("hadith.learning.preparing")}</Text>
          </View>
        ) : error ? (
          <View style={styles.center}><Text style={styles.error}>{t("hadith.learning.sessionError")}</Text></View>
        ) : empty ? (
          <View style={styles.center}><Text style={styles.error}>{t("hadith.learning.emptySession")}</Text></View>
        ) : hadith ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.steps}>
              {(["read", "understand", "memorize", "review"] as Step[]).map((item, index) => (
                <View key={item} style={[styles.stepDot, item === step && styles.stepDotActive]}>
                  <Text style={[styles.stepText, item === step && styles.stepTextActive]}>{index + 1}</Text>
                </View>
              ))}
            </View>
            <HadithGradeBadge grade={hadith.grade} kind={hadith.gradeKind} />

            {step === "read" ? (
              <>
                <Text style={styles.arabic}>{hadith.arabic}</Text>
                <Text style={styles.french}>{hadith.french}</Text>
                <Action label={t("hadith.learning.readCarefully")} onPress={() => setStep("understand")} />
              </>
            ) : null}

            {step === "understand" ? (
              <>
                <Text style={styles.title}>{t("hadith.learning.understand")}</Text>
                <Text style={styles.body}>{hadith.explanation || t("hadith.learning.noOfficialExplanation")}</Text>
                {hadith.lessons.slice(0, 4).map((lesson, index) => (
                  <View key={index + "-" + lesson.slice(0, 12)} style={styles.lesson}>
                    <Text style={styles.lessonIndex}>{index + 1}</Text>
                    <Text style={styles.lessonText}>{lesson}</Text>
                  </View>
                ))}
                <Action label={t("hadith.learning.startMemorizing")} onPress={() => setStep("memorize")} />
              </>
            ) : null}

            {step === "memorize" ? (
              <>
                <Text style={styles.title}>{t("hadith.learning.progressiveMask")}</Text>
                <View style={styles.memoryCard}><Text style={styles.memory}>{maskedText}</Text></View>
                <View style={styles.maskRow}>
                  {[0, 1, 2, 3, 4].map((value) => {
                    return (
                      <Pressable accessibilityRole="button" accessibilityLabel={value === 0 ? t("hadith.learning.showAll") : t("hadith.learning.maskLevel", { percent: value * 25 })} key={value} onPress={() => setMask(value)} style={[styles.maskButton, mask === value && styles.maskButtonActive]}>
                        <Text style={styles.maskText}>{value === 0 ? t("hadith.learning.showAll") : value * 25 + "%"}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Action label={t("hadith.learning.reciteWithoutLooking")} onPress={() => setStep("review")} />
              </>
            ) : null}

            {step === "review" ? (
              <>
                <Text style={styles.title}>{t("hadith.learning.recallQuestion")}</Text>
                <Text style={styles.body}>{t("hadith.learning.reviewExplanation")}</Text>
                <View style={styles.ratings}>
                  <Rating label={t("hadith.learning.ratingAgain")} color="#D77878" onPress={() => rate("again")} />
                  <Rating label={t("hadith.learning.ratingHard")} color="#D6A85D" onPress={() => rate("hard")} />
                  <Rating label={t("hadith.learning.ratingGood")} color="#6FC89A" onPress={() => rate("good")} />
                  <Rating label={t("hadith.learning.ratingEasy")} color="#78A9D7" onPress={() => rate("easy")} />
                </View>
              </>
            ) : null}
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

function Action({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.action}><Text style={styles.actionText}>{label}</Text><Ionicons name="arrow-forward" size={17} color="#1A1220" /></Pressable>;
}

function Rating({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.rating, { borderColor: color + "66", backgroundColor: color + "18" }]}><Text style={[styles.ratingText, { color }]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, safe: { flex: 1 }, header: { paddingHorizontal: 18 }, content: { padding: 20, paddingBottom: 110 }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 12 }, stateText: { color: colors.textMuted, fontFamily: typography.sans, textAlign: "center" }, error: { color: colors.textMuted, fontFamily: typography.sans, textAlign: "center" }, steps: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 20 }, stepDot: { width: 28, height: 7, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.1)" }, stepDotActive: { backgroundColor: colors.goldLight }, stepText: { display: "none" }, stepTextActive: { display: "none" }, arabic: { color: "#FFF8EC", fontFamily: "UthmanicHafs", fontSize: 25, lineHeight: 46, textAlign: "right", writingDirection: "rtl", marginTop: 25 }, french: { color: colors.text, fontFamily: typography.serif, fontSize: 19, lineHeight: 29, marginTop: 22 }, title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 26, marginTop: 23, marginBottom: 13 }, body: { color: colors.text, fontFamily: typography.sans, fontSize: 13, lineHeight: 21 }, lesson: { flexDirection: "row", gap: 10, marginTop: 13 }, lessonIndex: { color: colors.goldLight, fontFamily: typography.sans, fontWeight: "700" }, lessonText: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 12, lineHeight: 18 }, action: { marginTop: 28, height: 49, borderRadius: 17, backgroundColor: colors.goldLight, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, actionText: { color: "#1A1220", fontFamily: typography.sans, fontSize: 12, fontWeight: "800" }, memoryCard: { minHeight: 210, padding: 20, justifyContent: "center", borderRadius: 24, backgroundColor: "rgba(35,23,49,0.94)" }, memory: { color: colors.text, fontFamily: typography.serif, fontSize: 19, lineHeight: 28 }, maskRow: { flexDirection: "row", gap: 6, marginTop: 12 }, maskButton: { flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)" }, maskButtonActive: { backgroundColor: "rgba(227,181,90,0.16)" }, maskText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 9.5 }, ratings: { gap: 9, marginTop: 22 }, rating: { paddingVertical: 16, borderRadius: 17, alignItems: "center", borderWidth: 1 }, ratingText: { fontFamily: typography.sans, fontWeight: "800", fontSize: 12 },
});
