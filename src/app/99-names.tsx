import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { getAllahName, getAllahNames, nameOfTheDay } from "../features/99-names/names";
import { useOpenedAllahNames } from "../features/99-names/namesStorage";
import { useI18n } from "../i18n";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const CARD = "#151022";
const CARD_RAISED = "#1E1730";
const LINE = "#2B2238";
// A verse is never cut: longer ones are shown only on the name's page.
const TODAY_VERSE_MAX = 200;

function normalize(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[̀-ًͯ-ٰٟ]/g, "")
    .replace(/[’‘'ʼ\-\s]/g, "");
}

export default function AllahNamesScreen() {
  const { language, t } = useI18n();
  const [query, setQuery] = useState("");
  const opened = useOpenedAllahNames();
  const names = getAllahNames(language);
  const filteredNames = useMemo(() => {
    const normalized = normalize(query.trim());
    if (!normalized) return names;
    return names.filter((name) =>
      [name.transliteration, name.translation, name.arabic, String(name.id)]
        .map(normalize)
        .some((value) => value.includes(normalized)),
    );
  }, [names, query]);

  const today = getAllahName(nameOfTheDay(), language);
  const todayEvidence = today.evidence;

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundSecondary, colors.background]}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel={t("common.back")}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>{t("names99.title")}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.lead}>{t("names99.lead")}</Text>

          <Pressable
            onPress={() => router.push(`/99-names/${today.id}` as Href)}
            style={({ pressed }) => [styles.todayCard, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <LinearGradient colors={[CARD_RAISED, CARD]} style={StyleSheet.absoluteFill} />
            <Text style={styles.todayEyebrow}>{t("names99.today", { number: today.id })}</Text>
            <Text style={styles.todayArabic}>{today.arabic}</Text>
            <Text style={styles.todayTransliteration}>{today.transliteration}</Text>
            <Text style={styles.todayTranslation}>{today.translation}</Text>
            {todayEvidence.kind === "quran" && todayEvidence.text.length <= TODAY_VERSE_MAX ? (
              <>
                <Text style={styles.todayVerse}>{t("names99.quote", { text: todayEvidence.text })}</Text>
                <Text style={styles.todayReference}>{todayEvidence.surah} · {todayEvidence.ref}</Text>
              </>
            ) : null}
            <View style={styles.todayAction}>
              <Text style={styles.todayActionText}>{t("names99.discover")}</Text>
              <Ionicons name="arrow-forward" size={15} color={colors.goldLight} />
            </View>
          </Pressable>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t("names99.searchPlaceholder")}
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8} accessibilityLabel={t("names99.clear")}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>{t("names99.listTitle")}</Text>
            <Text style={styles.count}>
              {query.trim()
                ? t(filteredNames.length > 1 ? "names99.resultsMany" : "names99.resultsOne", { count: filteredNames.length })
                : opened.length ? t("names99.openedCount", { count: opened.length }) : t("names99.total")}
            </Text>
          </View>

          <View style={styles.grid}>
            {filteredNames.map((name) => (
              <Pressable
                key={name.id}
                onPress={() => router.push(`/99-names/${name.id}` as Href)}
                style={({ pressed }) => [styles.nameCard, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${name.id}. ${name.transliteration}, ${name.translation}`}
              >
                <Text style={styles.cardNumber}>{name.id}</Text>
                {opened.includes(name.id) ? <View style={styles.openedDot} /> : null}
                <Text style={styles.arabic}>{name.arabic}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.transliteration}>
                  {name.transliteration}
                </Text>
                <Text numberOfLines={2} style={styles.translation}>{name.translation}</Text>
              </Pressable>
            ))}
          </View>

          {filteredNames.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={24} color={colors.goldLight} />
              <Text style={styles.emptyTitle}>{t("names99.emptyTitle")}</Text>
              <Text style={styles.emptyText}>{t("names99.emptyText")}</Text>
            </View>
          ) : null}

          <View style={styles.methodCard}>
            <Text style={styles.methodVerse}>{t("names99.verse")}</Text>
            <Text style={styles.methodVerseRef}>{t("names99.verseRef")}</Text>
            <Text style={styles.methodTitle}>{t("names99.methodTitle")}</Text>
            <Text style={styles.methodText}>{t("names99.method1")}</Text>
            <Text style={styles.methodText}>{t("names99.method2")}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  header: { minHeight: 74, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: LINE, backgroundColor: "rgba(255,255,255,0.045)" },
  headerCopy: { flex: 1, alignItems: "center" },
  headerSpacer: { width: 42 },
  headerTitle: { marginTop: 3, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21 },
  content: { padding: 16, paddingBottom: 44 },
  lead: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13.5, lineHeight: 20 },
  todayCard: { marginTop: 16, overflow: "hidden", alignItems: "center", paddingHorizontal: 20, paddingVertical: 22, borderRadius: 26, borderWidth: 1.2, borderColor: "rgba(227,181,90,0.42)" },
  todayEyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9.5, fontWeight: "700", letterSpacing: 1.4, textTransform: "uppercase" },
  todayArabic: { marginTop: 6, color: colors.text, fontFamily: typography.arabic, fontSize: 44, lineHeight: 68, textAlign: "center" },
  todayTransliteration: { color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 26, textAlign: "center" },
  todayTranslation: { marginTop: 3, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, textAlign: "center" },
  todayVerse: { marginTop: 14, color: colors.textSecondary, fontFamily: typography.serifMedium, fontSize: 16, lineHeight: 21, textAlign: "center", fontStyle: "italic" },
  todayReference: { marginTop: 5, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, textAlign: "center" },
  todayAction: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 6 },
  todayActionText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: "700" },
  searchWrap: { marginTop: 18, height: 48, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 17, borderWidth: 1, borderColor: LINE, backgroundColor: CARD },
  searchInput: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 13 },
  listHeader: { marginTop: 24, marginBottom: 11, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  sectionTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 },
  count: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  nameCard: { width: "48.5%", minHeight: 158, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, paddingTop: 20, paddingBottom: 14, borderRadius: 20, borderWidth: 1, borderColor: LINE, backgroundColor: CARD },
  cardNumber: { position: "absolute", top: 10, left: 12, color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "700", fontVariant: ["tabular-nums"] },
  openedDot: { position: "absolute", top: 13, right: 12, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.goldLight },
  arabic: { color: colors.text, fontFamily: typography.arabic, fontSize: 27, lineHeight: 42, textAlign: "center" },
  transliteration: { marginTop: 4, color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 18, textAlign: "center" },
  translation: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, lineHeight: 14, textAlign: "center" },
  emptyState: { marginTop: 8, alignItems: "center", padding: 24, borderRadius: 22, borderWidth: 1, borderColor: LINE, backgroundColor: CARD },
  emptyTitle: { marginTop: 8, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 18 },
  emptyText: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5 },
  methodCard: { marginTop: 22, padding: 16, gap: 6, borderRadius: 22, borderWidth: 1, borderColor: LINE, backgroundColor: CARD },
  methodVerse: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 17, lineHeight: 22 },
  methodVerseRef: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "700" },
  methodTitle: { marginTop: 10, color: colors.text, fontFamily: typography.sans, fontSize: 12.5, fontWeight: "700" },
  methodText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.992 }] },
});
