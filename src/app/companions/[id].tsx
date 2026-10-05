import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { COMPANIONS } from "../../features/companions/companionsData";
import { markCompanionOpened } from "../../features/companions/companionsStorage";
import type { CompanionQuote } from "../../features/companions/companionsTypes";
import { useI18n } from "../../i18n";
import type { LanguageCode, TranslationKey } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const CARD = "#151022";
const CARD_RAISED = "#1E1730";
const LINE = "#2B2238";

function Quote({ quote, language, label }: { quote: CompanionQuote; language: LanguageCode; label: string }) {
  return (
    <View style={styles.quote}>
      <View style={styles.quoteHead}>
        <Text style={styles.quoteLabel}>{label}</Text>
        {quote.grade ? <Text style={styles.grade}>{quote.grade[language]}</Text> : null}
      </View>
      <Text style={styles.quoteText}>« {quote.text[language]} »</Text>
      <Text style={styles.quoteRef}>{quote.ref[language]}</Text>
    </View>
  );
}

export default function CompanionDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { language, t } = useI18n();
  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<string, number>>({});
  const [openSources, setOpenSources] = useState<string[]>([]);
  const index = COMPANIONS.findIndex((item) => item.id === id);
  const companion = COMPANIONS[index];

  useEffect(() => {
    if (!companion) return;
    void markCompanionOpened(companion.id);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [companion]);

  if (!companion) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={styles.missing}>{t("companions.notFound")}</Text>
      </SafeAreaView>
    );
  }

  const next = COMPANIONS[(index + 1) % COMPANIONS.length];
  // Keyed by companion so that moving to the next biography starts with every source list folded.
  const toggleSources = (key: string) =>
    setOpenSources((current) => current.includes(key) ? current.filter((x) => x !== key) : [...current, key]);

  return (
    <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel={t("common.back")}>
            <Ionicons name="chevron-back" size={23} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{companion.shortName[language]}</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <Text style={styles.arabic}>{companion.arabicName}</Text>
            <Text style={styles.name}>{companion.name[language]}</Text>
            {companion.laqab ? (
              <Text style={styles.laqab}>
                <Text style={styles.laqabName}>{companion.laqab[language]}</Text>
                {companion.laqabMeaning ? ` · ${companion.laqabMeaning[language]}` : ""}
              </Text>
            ) : null}
          </View>

          <Text style={styles.summary}>{companion.summary[language]}</Text>

          <View style={styles.facts}>
            {companion.facts.map((fact, i) => (
              <View key={fact.key} style={[styles.fact, i % 2 === 0 && styles.factLeft, i < 2 && styles.factTop]}>
                <Text style={styles.factKey}>{t(`companions.fact.${fact.key}` as TranslationKey)}</Text>
                <Text style={styles.factValue}>{fact.value[language]}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.chaptersLabel}>{t("companions.chapters")}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabs}>
            {companion.periods.map((period) => (
              <Pressable
                key={period.id}
                onPress={() => scrollRef.current?.scrollTo({ y: Math.max(0, (offsets.current[period.id] ?? 0) - 12), animated: true })}
                style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.tabText}>{period.title[language]}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {companion.periods.map((period) => {
            const sources = period.sources ?? [];
            const sourcesKey = `${companion.id}:${period.id}`;
            const sourcesOpen = openSources.includes(sourcesKey);
            return (
              <View key={period.id} style={styles.period} onLayout={(event) => { offsets.current[period.id] = event.nativeEvent.layout.y; }}>
                {period.date ? <Text style={styles.date}>{period.date[language]}</Text> : null}
                <Text style={styles.periodTitle}>{period.title[language]}</Text>
                {period.paragraphs.map((paragraph, i) => <Text key={i} style={styles.paragraph}>{paragraph[language]}</Text>)}
                {period.quotes?.map((quote, i) => (
                  <Quote key={i} quote={quote} language={language} label={t(quote.kind === "quran" ? "companions.quoteQuran" : "companions.quoteHadith")} />
                ))}
                {sources.length ? (
                  <Pressable onPress={() => toggleSources(sourcesKey)} style={styles.sourcesToggle} hitSlop={6} accessibilityRole="button" accessibilityState={{ expanded: sourcesOpen }}>
                    <Ionicons name={sourcesOpen ? "chevron-down" : "chevron-forward"} size={13} color={colors.textMuted} />
                    <Text style={styles.sourcesToggleText}>
                      {sources.length === 1 ? t("companions.sourcesOne") : t("companions.sourcesMany", { count: sources.length })}
                    </Text>
                  </Pressable>
                ) : null}
                {sourcesOpen ? sources.map((source, i) => <Text key={i} style={styles.source}>{source[language]}</Text>) : null}
              </View>
            );
          })}

          {companion.lessons.length ? (
            <View style={styles.lessons}>
              <Text style={styles.lessonsLabel}>{t("companions.lessons")}</Text>
              {companion.lessons.map((lesson, i) => (
                <View key={i} style={styles.lesson}>
                  <View style={styles.lessonDot} />
                  <Text style={styles.lessonText}>{lesson[language]}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Text style={styles.method}>{t("companions.method")}</Text>

          <Pressable onPress={() => router.replace(`/companions/${next.id}` as Href)} style={({ pressed }) => [styles.next, pressed && styles.pressed]} accessibilityRole="button">
            <View style={styles.nextMono}><Text style={styles.nextMonoText}>{next.initial}</Text></View>
            <View style={styles.nextCopy}>
              <Text style={styles.nextLabel}>{t("companions.next")}</Text>
              <Text style={styles.nextName}>{next.name[language]}</Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.goldLight} />
          </Pressable>
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
  headerTitle: { flex: 1, textAlign: "center", color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21 },
  content: { paddingHorizontal: 18, paddingBottom: 70 },
  hero: { alignItems: "center", paddingTop: 4 },
  arabic: { color: colors.goldLight, fontFamily: typography.arabic, fontSize: 40, lineHeight: 64, textAlign: "center" },
  name: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 29, lineHeight: 35, textAlign: "center" },
  laqab: { marginTop: 6, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 19, textAlign: "center" },
  laqabName: { color: colors.goldLight, fontWeight: "700" },
  summary: { marginTop: 18, color: colors.text, fontFamily: typography.sans, fontSize: 16, lineHeight: 25 },
  facts: { marginTop: 18, flexDirection: "row", flexWrap: "wrap", borderRadius: 18, borderWidth: 1, borderColor: LINE, backgroundColor: CARD, overflow: "hidden" },
  fact: { width: "50%", paddingHorizontal: 12, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LINE },
  factLeft: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: LINE },
  factTop: { borderTopWidth: 0 },
  factKey: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase" },
  factValue: { marginTop: 3, color: colors.text, fontFamily: typography.sans, fontSize: 13, lineHeight: 18 },
  chaptersLabel: { marginTop: 22, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" },
  tabsScroll: { marginTop: 8, marginHorizontal: -18 },
  tabs: { paddingHorizontal: 18, gap: 7 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 13, borderWidth: 1, borderColor: LINE, backgroundColor: CARD },
  tabText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12, fontWeight: "600" },
  period: { marginTop: 28 },
  date: { alignSelf: "flex-start", marginBottom: 7, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 7, overflow: "hidden", backgroundColor: colors.goldLight, color: "#1B1408", fontFamily: typography.sans, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.6 },
  periodTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 23, lineHeight: 29 },
  paragraph: { marginTop: 10, color: colors.text, fontFamily: typography.sans, fontSize: 16, lineHeight: 26 },
  quote: { marginTop: 14, padding: 15, borderRadius: 18, borderWidth: 1, borderColor: "rgba(227,181,90,.24)", backgroundColor: CARD_RAISED },
  quoteHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  quoteLabel: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9.5, fontWeight: "900", letterSpacing: 1.1 },
  grade: { flexShrink: 1, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: "hidden", backgroundColor: "rgba(80,170,110,.16)", color: "#A6DDB8", fontFamily: typography.sans, fontSize: 9.5, fontWeight: "700" },
  quoteText: { marginTop: 8, color: colors.text, fontFamily: typography.serif, fontSize: 18.5, lineHeight: 26 },
  quoteRef: { marginTop: 9, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5 },
  sourcesToggle: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start" },
  sourcesToggleText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, fontWeight: "600" },
  source: { marginTop: 5, marginLeft: 18, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, lineHeight: 17 },
  lessons: { marginTop: 32, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: CARD, gap: 10 },
  lessonsLabel: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  lesson: { flexDirection: "row", gap: 10 },
  lessonDot: { width: 6, height: 6, marginTop: 8, borderRadius: 3, backgroundColor: colors.goldLight },
  lessonText: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 15, lineHeight: 22 },
  method: { marginTop: 18, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 17 },
  next: { marginTop: 18, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: CARD, flexDirection: "row", alignItems: "center", gap: 12 },
  nextMono: { width: 42, height: 42, borderRadius: 13, backgroundColor: CARD_RAISED, alignItems: "center", justifyContent: "center" },
  nextMonoText: { color: colors.goldLight, fontFamily: typography.arabic, fontSize: 20 },
  nextCopy: { flex: 1 },
  nextLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5, fontWeight: "800", letterSpacing: 1.1 },
  nextName: { marginTop: 2, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 17 },
  missing: { margin: 30, color: colors.text },
  pressed: { opacity: 0.82 },
});
