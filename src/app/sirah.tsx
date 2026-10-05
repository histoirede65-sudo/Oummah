import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { SIRAH_CHAPTERS, SIRAH_ERAS } from "../features/sirah/sirahData";
import { useLastSirahChapter, useReadSirahChapters } from "../features/sirah/sirahStorage";
import { useI18n } from "../i18n";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const CARD = "#151022";
const LINE = "#2B2238";
const hero = require("../assets/images/home/shortcuts/sirah-premium.png");

export default function SirahHome() {
  const { language, t } = useI18n();
  const read = useReadSirahChapters();
  const lastId = useLastSirahChapter();
  const readCount = SIRAH_CHAPTERS.filter((chapter) => read.includes(chapter.id)).length;

  // Resume where the reader stopped: the last chapter opened, or the next one if it was finished.
  const lastIndex = SIRAH_CHAPTERS.findIndex((chapter) => chapter.id === lastId);
  const resumeIndex = lastIndex < 0 ? 0 : read.includes(SIRAH_CHAPTERS[lastIndex].id) && lastIndex < SIRAH_CHAPTERS.length - 1 ? lastIndex + 1 : lastIndex;
  const resume = SIRAH_CHAPTERS[resumeIndex];
  const open = (id: string) => router.push(`/sirah/${id}` as Href);

  return (
    <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel={t("common.back")}>
            <Ionicons name="chevron-back" size={23} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t("sirah.headerTitle")}</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Image source={hero} contentFit="cover" transition={180} style={StyleSheet.absoluteFill} />
            <LinearGradient colors={["rgba(13,11,24,.05)", "rgba(13,11,24,.92)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>{t("sirah.kicker")}</Text>
              <Text style={styles.title}>{t("sirah.title")}</Text>
              <Text style={styles.arabic}>السيرة النبوية</Text>
              <Text style={styles.intro}>{t("sirah.intro")}</Text>
              <View style={styles.progressRow}>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${Math.round((readCount / SIRAH_CHAPTERS.length) * 100)}%` }]} />
                </View>
                <Text style={styles.progressText}>{t("sirah.progress", { read: readCount, total: SIRAH_CHAPTERS.length })}</Text>
              </View>
            </View>
          </View>

          <Pressable onPress={() => open(resume.id)} style={({ pressed }) => [styles.resume, pressed && styles.pressed]} accessibilityRole="button">
            <View style={styles.resumeCopy}>
              <Text style={styles.resumeLabel}>{lastId ? t("sirah.resume") : t("sirah.start")}</Text>
              <Text style={styles.resumeTitle} numberOfLines={1}>{resume.title[language]}</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#1B1408" />
          </Pressable>

          {SIRAH_ERAS.map((era) => {
            const chapters = SIRAH_CHAPTERS.filter((chapter) => chapter.era === era.id);
            return (
              <View key={era.id} style={styles.era}>
                <View style={styles.eraHeader}>
                  <Text style={styles.eraTitle}>{era.title[language]}</Text>
                  <Text style={styles.eraYears}>{era.years[language]}</Text>
                </View>
                <Text style={styles.eraSubtitle}>{era.subtitle[language]}</Text>
                <View style={styles.rows}>
                  {chapters.map((chapter, index) => (
                    <Pressable key={chapter.id} onPress={() => open(chapter.id)} style={({ pressed }) => [styles.row, index > 0 && styles.rowBorder, pressed && styles.pressed]} accessibilityRole="button">
                      <View style={styles.year}>
                        <Text style={styles.yearText}>{chapter.year[language]}</Text>
                        {chapter.yearNote ? <Text style={styles.yearNote} numberOfLines={2}>{chapter.yearNote[language]}</Text> : null}
                      </View>
                      <Text style={styles.rowTitle}>{chapter.title[language]}</Text>
                      {read.includes(chapter.id)
                        ? <Text style={styles.readMark}>{t("sirah.read")}</Text>
                        : <Ionicons name="chevron-forward" size={17} color={colors.goldLight} />}
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}

          <Text style={styles.method}>{t("sirah.method")}</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: { minHeight: 74, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.borderSoft, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.04)" },
  spacer: { width: 44 },
  headerTitle: { flex: 1, textAlign: "center", color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 },
  content: { paddingHorizontal: 16, paddingBottom: 60 },
  hero: { minHeight: 330, borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: "rgba(227,181,90,.30)", justifyContent: "flex-end" },
  heroCopy: { padding: 18 },
  kicker: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "900", letterSpacing: 1.4 },
  title: { marginTop: 6, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 29, lineHeight: 34 },
  arabic: { marginTop: 2, color: colors.goldLight, fontFamily: typography.arabic, fontSize: 22 },
  intro: { marginTop: 6, color: "rgba(245,241,232,.84)", fontFamily: typography.sans, fontSize: 13.5, lineHeight: 20 },
  progressRow: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  progressBar: { flex: 1, height: 5, borderRadius: 3, backgroundColor: "rgba(255,255,255,.14)", overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.goldLight },
  progressText: { color: "rgba(245,241,232,.7)", fontFamily: typography.sans, fontSize: 11.5 },
  resume: { marginTop: 12, paddingHorizontal: 16, paddingVertical: 13, borderRadius: 18, backgroundColor: colors.goldLight, flexDirection: "row", alignItems: "center", gap: 12 },
  resumeCopy: { flex: 1 },
  resumeLabel: { color: "#1B1408", fontFamily: typography.sans, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  resumeTitle: { marginTop: 1, color: "#1B1408", fontFamily: typography.serifSemibold, fontSize: 18 },
  era: { marginTop: 26 },
  eraHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 },
  eraTitle: { flexShrink: 1, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 },
  eraYears: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11.5, fontWeight: "700" },
  eraSubtitle: { marginTop: 2, marginBottom: 10, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5 },
  rows: { borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: CARD, overflow: "hidden" },
  row: { minHeight: 62, paddingHorizontal: 13, paddingVertical: 11, flexDirection: "row", alignItems: "center", gap: 12 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LINE },
  year: { width: 62, alignItems: "center" },
  yearText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "800", textAlign: "center" },
  yearNote: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5, textAlign: "center" },
  rowTitle: { flex: 1, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 17, lineHeight: 21 },
  readMark: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, fontWeight: "700" },
  method: { marginTop: 24, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 17 },
  pressed: { opacity: 0.82 },
});
