import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Image } from "expo-image";

import { COMPANIONS } from "../features/companions/companionsData";
import { useOpenedCompanions } from "../features/companions/companionsStorage";
import type { Companion, CompanionGroup, CompanionSection } from "../features/companions/companionsTypes";
import { useI18n } from "../i18n";
import type { TranslationKey } from "../i18n";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const CARD = "#151022";
const CARD_RAISED = "#1E1730";
const LINE = "#2B2238";

type Filter = "all" | CompanionGroup;
const FILTERS: Filter[] = ["all", "caliphs", "promised", "women", "ansar", "scholars"];
const SECTIONS: CompanionSection[] = ["caliphs", "promised", "mecca", "medina", "women"];
const SECTION_META: Partial<Record<CompanionSection, TranslationKey>> = {
  caliphs: "companions.sectionMeta.caliphs",
  promised: "companions.sectionMeta.promised",
};

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[̀-ًͯ-ٰٟ]/g, "")
    .replace(/[’‘'ʼ`\-\s]/g, "");
}

export default function CompanionsScreen() {
  const { language, t } = useI18n();
  const opened = useOpenedCompanions();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = normalize(query.trim());
    return COMPANIONS.filter((item) => {
      if (filter !== "all" && !item.groups.includes(filter)) return false;
      if (!q) return true;
      return [item.name.fr, item.name.en, item.arabicName, item.shortTitle[language], item.laqab?.[language] ?? ""]
        .map(normalize)
        .some((value) => value.includes(q));
    });
  }, [filter, query, language]);

  const grouped = filter === "all" && !query.trim();
  const open = (item: Companion) => router.push(`/companions/${item.id}` as Href);

  const row = (item: Companion) => (
    <Pressable key={item.id} onPress={() => open(item)} style={({ pressed }) => [styles.row, pressed && styles.pressed]} accessibilityRole="button">
      <View style={styles.mono}><Text style={styles.monoText}>{item.initial}</Text></View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowName}>{item.name[language]}</Text>
        <Text style={styles.rowShort}>{item.shortTitle[language]}</Text>
      </View>
      {opened.includes(item.id)
        ? <Text style={styles.readMark}>{t("companions.read")}</Text>
        : <Ionicons name="chevron-forward" size={18} color={colors.goldLight} />}
    </Pressable>
  );

  return (
    <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel={t("common.back")}>
            <Ionicons name="chevron-back" size={23} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>{t("companions.title")}</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Image source={require("../assets/images/home/shortcuts/companions-premium.png")} style={StyleSheet.absoluteFill} contentFit="cover" />
            <LinearGradient colors={["rgba(13,11,24,.15)", "rgba(13,11,24,.94)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>{t("companions.kicker")}</Text>
              <Text style={styles.title}>{t("companions.title")}</Text>
              <Text style={styles.intro}>{t("companions.intro", { count: COMPANIONS.length })}</Text>
            </View>
          </View>

          <View style={styles.search}>
            <Ionicons name="search" size={17} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("companions.search")}
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} hitSlop={10} accessibilityRole="button" accessibilityLabel={t("companions.searchClear")}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
            {FILTERS.map((item) => {
              const active = filter === item;
              const count = item === "all" ? COMPANIONS.length : COMPANIONS.filter((c) => c.groups.includes(item)).length;
              return (
                <Pressable key={item} onPress={() => setFilter(item)} style={[styles.chip, active && styles.chipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(`companions.filter.${item}` as TranslationKey)}</Text>
                  <Text style={[styles.chipCount, active && styles.chipTextActive]}>{count}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {grouped ? SECTIONS.map((section) => {
            const items = COMPANIONS.filter((item) => item.section === section);
            const meta = SECTION_META[section];
            return (
              <View key={section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t(`companions.section.${section}` as TranslationKey)}</Text>
                  {meta ? <Text style={styles.sectionMeta}>{t(meta)}</Text> : null}
                </View>
                {section === "caliphs" ? (
                  <View style={styles.grid}>
                    {items.map((item) => (
                      <Pressable key={item.id} onPress={() => open(item)} style={({ pressed }) => [styles.caliph, pressed && styles.pressed]} accessibilityRole="button">
                        <LinearGradient colors={[CARD_RAISED, CARD]} style={StyleSheet.absoluteFill} />
                        <Text style={styles.caliphArabic}>{item.arabicShort ?? item.arabicName}</Text>
                        <Text style={styles.caliphName}>{item.shortName[language]}</Text>
                        <Text style={styles.caliphLaqab} numberOfLines={2}>{item.laqab?.[language] ?? item.shortTitle[language]}</Text>
                        <View style={styles.caliphFooter}>
                          <Text style={styles.caliphYears}>{item.years?.[language]}</Text>
                          {opened.includes(item.id) ? <Text style={styles.readMark}>{t("companions.read")}</Text> : null}
                        </View>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <View style={styles.rows}>{items.map(row)}</View>
                )}
              </View>
            );
          }) : (
            <>
              <Text style={styles.results}>{t("companions.results", { count: visible.length })}</Text>
              {visible.length
                ? <View style={styles.rows}>{visible.map(row)}</View>
                : <Text style={styles.empty}>{t("companions.empty", { query: query.trim() })}</Text>}
            </>
          )}
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
  hero: { height: 230, borderRadius: 26, overflow: "hidden", borderWidth: 1, borderColor: "rgba(227,181,90,.26)", justifyContent: "flex-end" },
  heroCopy: { padding: 18 },
  kicker: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 },
  title: { marginTop: 6, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 30 },
  intro: { marginTop: 6, color: "rgba(245,241,232,.82)", fontFamily: typography.sans, fontSize: 13.5, lineHeight: 20 },
  search: { marginTop: 14, height: 46, borderRadius: 15, borderWidth: 1, borderColor: LINE, backgroundColor: CARD, flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 14 },
  searchInput: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 14, paddingVertical: 0 },
  chipsScroll: { marginTop: 12, marginHorizontal: -16 },
  chips: { paddingHorizontal: 16, gap: 7 },
  chip: { height: 34, paddingHorizontal: 13, borderRadius: 17, borderWidth: 1, borderColor: LINE, backgroundColor: CARD, flexDirection: "row", alignItems: "center", gap: 6 },
  chipActive: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  chipText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12.5, fontWeight: "700" },
  chipCount: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: "800" },
  chipTextActive: { color: "#1B1408" },
  sectionHeader: { marginTop: 24, marginBottom: 10, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 },
  sectionTitle: { flexShrink: 1, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21 },
  sectionMeta: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  caliph: { width: "48.8%", minHeight: 150, padding: 13, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: LINE },
  caliphArabic: { color: colors.goldLight, fontFamily: typography.arabic, fontSize: 24, textAlign: "right", writingDirection: "rtl" },
  caliphName: { marginTop: 4, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 18 },
  caliphLaqab: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 16 },
  caliphFooter: { marginTop: "auto", paddingTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  caliphYears: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "800", letterSpacing: 0.6 },
  rows: { borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: CARD, overflow: "hidden" },
  row: { minHeight: 70, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: LINE },
  mono: { width: 44, height: 44, borderRadius: 14, backgroundColor: CARD_RAISED, alignItems: "center", justifyContent: "center" },
  monoText: { color: colors.goldLight, fontFamily: typography.arabic, fontSize: 21 },
  rowCopy: { flex: 1 },
  rowName: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 17 },
  rowShort: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, lineHeight: 16 },
  readMark: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, fontWeight: "700" },
  results: { marginTop: 18, marginBottom: 10, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  empty: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, lineHeight: 21 },
  pressed: { opacity: 0.82 },
});
