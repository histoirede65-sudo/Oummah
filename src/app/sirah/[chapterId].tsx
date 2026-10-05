import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { SIRAH_CHAPTERS, SIRAH_ERAS } from "../../features/sirah/sirahData";
import { markSirahChapterRead, setLastSirahChapter } from "../../features/sirah/sirahStorage";
import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const CARD = "#151022";
const CARD_RAISED = "#1E1730";
const LINE = "#2B2238";
/** Reading text: pure white, as in the other reading modules. */
const READING = "#FFFFFF";

export default function SirahChapterPage() {
  const { chapterId } = useLocalSearchParams<{ chapterId: string }>();
  const { language, t } = useI18n();
  const scrollRef = useRef<ScrollView>(null);
  const index = SIRAH_CHAPTERS.findIndex((item) => item.id === chapterId);
  const chapter = SIRAH_CHAPTERS[index];

  useEffect(() => {
    if (!chapter) return;
    void setLastSirahChapter(chapter.id);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [chapter]);

  if (!chapter) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>{t("sirah.notFound")}</Text>
      </SafeAreaView>
    );
  }

  const era = SIRAH_ERAS.find((item) => item.id === chapter.era)!;
  const eraChapters = SIRAH_CHAPTERS.filter((item) => item.era === chapter.era);
  const previous = SIRAH_CHAPTERS[index - 1];
  const next = SIRAH_CHAPTERS[index + 1];
  const hasQuran = chapter.body.some((block) => block.type === "quran");
  const hasHadith = chapter.body.some((block) => block.type === "hadith");
  const go = (id: string) => router.replace(`/sirah/${id}` as Href);

  // A chapter counts as read once its end has been reached.
  const onScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 120) void markSirahChapterRead(chapter.id);
  };

  return (
    <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel={t("common.back")}>
            <Ionicons name="chevron-back" size={23} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {t("sirah.position", { era: era.title[language], index: eraChapters.indexOf(chapter) + 1, count: eraChapters.length })}
          </Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={250}>
          <Text style={styles.kicker}>
            {[chapter.year[language], chapter.yearNote?.[language], chapter.place?.[language]].filter(Boolean).join(" · ").toLocaleUpperCase(language)}
          </Text>
          <Text style={styles.title}>{chapter.title[language]}</Text>
          <View style={styles.tags}>
            {hasQuran ? <Text style={styles.tag}>{t("sirah.tagQuran")}</Text> : null}
            {hasHadith ? <Text style={[styles.tag, styles.tagHadith]}>{t("sirah.tagHadith")}</Text> : null}
            <Text style={styles.tag}>{t("sirah.minutes", { count: chapter.minutes })}</Text>
          </View>

          {chapter.body.map((block, i) => block.type === "text" ? (
            <Text key={i} style={styles.paragraph}>{block.text[language]}</Text>
          ) : (
            <View key={i} style={[styles.quote, block.type === "quran" && styles.quoteQuran]}>
              <View style={styles.quoteHead}>
                <Text style={styles.quoteLabel}>{t(block.type === "quran" ? "sirah.quoteQuran" : "sirah.quoteHadith")}</Text>
                {block.grade ? <Text style={styles.grade}>{block.grade[language]}</Text> : null}
              </View>
              {block.context ? <Text style={styles.context}>{block.context[language]}</Text> : null}
              <Text style={styles.quoteText}>{language === "fr" ? `« ${block.text[language]} »` : `“${block.text[language]}”`}</Text>
              <Text style={styles.quoteRef}>{block.ref[language]}</Text>
              {block.hadithId ? (
                <Pressable
                  onPress={() => router.push({ pathname: "/hadith/[hadithId]", params: { hadithId: block.hadithId! } })}
                  style={({ pressed }) => [styles.openHadith, pressed && styles.pressed]}
                  accessibilityRole="button"
                >
                  <Ionicons name="book-outline" size={16} color={colors.goldLight} />
                  <Text style={styles.openHadithText}>{t("sirah.openHadith")}</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.goldLight} />
                </Pressable>
              ) : null}
            </View>
          ))}

          {chapter.note ? (
            <View style={styles.note}>
              <Text style={styles.noteLabel}>{t("sirah.note")}</Text>
              <Text style={styles.noteText}>{chapter.note[language]}</Text>
            </View>
          ) : null}

          {chapter.lessons.length ? (
            <View style={styles.lessons}>
              <Text style={styles.lessonsLabel}>{t("sirah.lessons")}</Text>
              {chapter.lessons.map((lesson, i) => (
                <View key={i} style={styles.lesson}>
                  <View style={styles.lessonDot} />
                  <Text style={styles.lessonText}>{lesson[language]}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {chapter.sources?.length ? (
            <Text style={styles.sources}>{t("sirah.sources")} : {chapter.sources.map((source) => source[language]).join(" · ")}</Text>
          ) : null}

          <View style={styles.nav}>
            {previous ? (
              <Pressable onPress={() => go(previous.id)} style={({ pressed }) => [styles.navCard, pressed && styles.pressed]} accessibilityRole="button">
                <Text style={styles.navLabel}>‹ {t("sirah.previous")}</Text>
                <Text style={styles.navTitle} numberOfLines={2}>{previous.title[language]}</Text>
              </Pressable>
            ) : <View style={styles.navSpacer} />}
            {next ? (
              <Pressable onPress={() => { void markSirahChapterRead(chapter.id); go(next.id); }} style={({ pressed }) => [styles.navCard, styles.navNext, pressed && styles.pressed]} accessibilityRole="button">
                <Text style={[styles.navLabel, styles.navLabelNext]}>{t("sirah.next")} ›</Text>
                <Text style={[styles.navTitle, styles.navTitleNext]} numberOfLines={2}>{next.title[language]}</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => { void markSirahChapterRead(chapter.id); router.back(); }} style={({ pressed }) => [styles.navCard, styles.navNext, pressed && styles.pressed]} accessibilityRole="button">
                <Text style={[styles.navTitle, styles.navTitleNext]}>{t("sirah.backToContents")}</Text>
              </Pressable>
            )}
          </View>
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
  headerTitle: { flex: 1, textAlign: "center", color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, fontWeight: "700" },
  content: { paddingHorizontal: 20, paddingBottom: 70 },
  kicker: { marginTop: 4, color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "900", letterSpacing: 1.2 },
  title: { marginTop: 8, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 30, lineHeight: 35 },
  tags: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, overflow: "hidden", backgroundColor: "rgba(227,181,90,.14)", color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "700" },
  tagHadith: { backgroundColor: "rgba(80,170,110,.16)", color: "#A6DDB8" },
  paragraph: { marginTop: 16, color: READING, fontFamily: typography.sans, fontSize: 18, lineHeight: 29 },
  quote: { marginTop: 16, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: "rgba(227,181,90,.24)", backgroundColor: CARD_RAISED },
  quoteQuran: { backgroundColor: "#13221A", borderColor: "#2C4A37" },
  quoteHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  quoteLabel: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9.5, fontWeight: "900", letterSpacing: 1.1 },
  grade: { flexShrink: 1, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: "hidden", backgroundColor: "rgba(80,170,110,.16)", color: "#A6DDB8", fontFamily: typography.sans, fontSize: 9.5, fontWeight: "700" },
  context: { marginTop: 9, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14.5, lineHeight: 22 },
  quoteText: { marginTop: 10, color: READING, fontFamily: typography.sans, fontSize: 18, lineHeight: 28, fontWeight: "500" },
  quoteRef: { marginTop: 10, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13 },
  openHadith: { marginTop: 12, minHeight: 44, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: "rgba(227,181,90,.30)", backgroundColor: "rgba(227,181,90,.07)", flexDirection: "row", alignItems: "center", gap: 8 },
  openHadithText: { flex: 1, color: colors.goldLight, fontFamily: typography.sans, fontSize: 14, fontWeight: "700" },
  note: { marginTop: 22, paddingLeft: 13, borderLeftWidth: 2, borderLeftColor: colors.goldLight },
  noteLabel: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },
  noteText: { marginTop: 4, color: READING, fontFamily: typography.sans, fontSize: 16, lineHeight: 25 },
  lessons: { marginTop: 24, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: CARD, gap: 10 },
  lessonsLabel: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  lesson: { flexDirection: "row", gap: 10 },
  lessonDot: { width: 6, height: 6, marginTop: 10, borderRadius: 3, backgroundColor: colors.goldLight },
  lessonText: { flex: 1, color: READING, fontFamily: typography.sans, fontSize: 17, lineHeight: 26 },
  sources: { marginTop: 16, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 19 },
  nav: { marginTop: 22, flexDirection: "row", gap: 8 },
  navCard: { flex: 1, minHeight: 74, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: CARD, justifyContent: "center" },
  navNext: { backgroundColor: colors.goldLight, borderColor: colors.goldLight, alignItems: "flex-end" },
  navSpacer: { flex: 1 },
  navLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, fontWeight: "700" },
  navLabelNext: { color: "#1B1408" },
  navTitle: { marginTop: 3, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 15, lineHeight: 19 },
  navTitleNext: { color: "#1B1408", textAlign: "right" },
  missing: { margin: 30, color: colors.text },
  pressed: { opacity: 0.82 },
});
