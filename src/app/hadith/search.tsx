import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hadithRepository } from "../../features/hadith-explorer/data/hadithRepository";
import type { HadithSummary } from "../../features/hadith-explorer/domain/Hadith";
import { HADITH_COLLECTIONS } from "../../features/hadith-explorer/domain/HadithCollection";
import HadithCard from "../../features/hadith-explorer/presentation/HadithCard";
import HadithScreenHeader from "../../features/hadith-explorer/presentation/HadithScreenHeader";
import HadithSearchBar from "../../features/hadith-explorer/presentation/HadithSearchBar";
import { hadithLibraryService } from "../../features/hadith-explorer/services/hadithLibraryService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useI18n } from "../../i18n";

const SUGGESTION_IDS = ["intention", "parents", "anger", "smile", "lying", "fasting", "prayer", "patience"] as const;

function normalizeSearchTitle(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").replace(/[^a-z0-9]+/g, "");
}

export default function HadithSearchScreen() {
  const { language, t } = useI18n();
  const params = useLocalSearchParams<{ q?: string; theme?: string; category?: string; collection?: string; collectionId?: string; view?: string }>();
  // A theme backed by a HadeethEnc category lists that category instead of searching the text.
  const themeCategory = params.theme && params.category ? params.category : "";
  const [query, setQuery] = useState(params.q ?? params.collection ?? "");
  const [results, setResults] = useState<HadithSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(Boolean(params.q || params.collection || params.view || themeCategory));

  useEffect(() => {
    let active = true;
    if (themeCategory) {
      setLoading(true);
      void hadithRepository.listCategory(themeCategory, language)
        .then((value) => active && setResults(value))
        .catch(() => active && setResults([]))
        .finally(() => active && setLoading(false));
      return () => { active = false; };
    }
    if (params.view === "favorites") {
      setLoading(true);
      void hadithLibraryService.favorites().then(async (items) => {
        const localized = language === "en"
          ? await Promise.all(items.map(async ({ id, title }) => {
              const hadith = await hadithRepository.get(id, "en").catch(() => null);
              return { id, title: hadith?.title ?? title, translations: hadith ? ["en"] : ["fr"] };
            }))
          : items.map(({ id, title }) => ({ id, title, translations: ["fr"] }));
        if (active) { setResults(localized); setLoading(false); }
      });
      return () => { active = false; };
    }
    const clean = query.trim();
    if (clean.length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true); setSearched(true);
    const timer = setTimeout(() => {
      const runSearch = async () => {
        const collection = params.collectionId
          ? HADITH_COLLECTIONS.find((item) => item.id === params.collectionId)
          : undefined;
        const isInitialCollectionQuery = Boolean(
          collection && clean === (params.q ?? "").trim(),
        );

        if (collection && params.theme) {
          return hadithRepository.searchCollectionTheme(collection, clean);
        }

        if (collection && isInitialCollectionQuery) {
          return hadithRepository.searchCollection(collection);
        }

        if (collection) {
          return hadithRepository.searchWithinCollection(collection, clean);
        }

        return hadithRepository.search(clean, language);
      };

      void runSearch()
        .then((value) => active && setResults(value))
        .catch(() => active && setResults([]))
        .finally(() => active && setLoading(false));
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [language, query, params.view, params.collectionId, params.q, params.theme, themeCategory]);

  const title = params.view === "favorites" ? t("hadith.myFavorites") : params.theme ? params.theme : params.collection ? t("hadith.collection") : t("hadith.search");
  const subtitle = params.view === "favorites"
    ? t("hadith.personalLibrary")
    : params.collection
      ?? (params.theme ? (loading ? "" : t("hadith.hadithCount", { count: results.length })) : t("hadith.searchTolerance"));
  const unique = useMemo(() => Array.from(new Map(results.map((item) => [item.id, item])).values()), [results]);

  return (
    <LinearGradient colors={["#080713", "#110A1C", "#080713"]} style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}><HadithScreenHeader title={title} subtitle={subtitle} /></View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {params.view !== "favorites" && !themeCategory ? <HadithSearchBar value={query} onChangeText={setQuery} /> : null}
          {!query && params.view !== "favorites" ? <><Text style={styles.prompt}>{t("hadith.searchPrompt")}</Text><View style={styles.suggestions}>{SUGGESTION_IDS.map((id) => { const value = t(`hadith.suggestion.${id}` as never); return <Pressable key={id} onPress={() => setQuery(value)} style={styles.suggestion}><Text style={styles.suggestionText}>{value}</Text></Pressable>; })}</View><View style={styles.hint}><Ionicons name="sparkles-outline" size={19} color={colors.goldLight} /><Text style={styles.hintText}>{t("hadith.searchHint")}</Text></View></> : null}
          {loading ? <View style={styles.state}><ActivityIndicator color={colors.goldLight} /><Text style={styles.stateText}>{t("hadith.searchingReferences")}</Text></View> : null}
          {!loading && searched && !themeCategory ? <Text style={styles.count}>{t("hadith.resultCount", { count: unique.length })}</Text> : null}
          {!loading && searched && !unique.length ? <View style={styles.state}><Ionicons name="search-outline" size={31} color={colors.textMuted} /><Text style={styles.emptyTitle}>{t("hadith.noHadithFound")}</Text><Text style={styles.stateText}>{t("hadith.noResultsHelp")}</Text></View> : null}
          <View style={styles.list}>{unique.map((item, index) => <HadithCard key={item.id} title={item.title} subtitle={t("hadith.hadeethEncReference", { id: item.id })} index={index} onPress={() => router.push(`/hadith/${item.id}` as Href)} />)}</View>
          <Text style={styles.credit}>{t("hadith.searchCredit")}</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, safe: { flex: 1 }, header: { paddingHorizontal: 18 }, content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 110 },
  prompt: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 21, marginTop: 27, marginBottom: 13 }, suggestions: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, suggestion: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 99, backgroundColor: "rgba(42,27,57,0.9)", borderWidth: 1, borderColor: "rgba(151,104,173,0.24)" }, suggestionText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11.5 },
  hint: { marginTop: 23, padding: 16, borderRadius: 19, flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "rgba(227,181,90,0.07)" }, hintText: { flex: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, lineHeight: 16 },
  state: { paddingVertical: 55, alignItems: "center", gap: 10 }, stateText: { maxWidth: 280, textAlign: "center", color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 17 }, emptyTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 20 }, count: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, marginTop: 20, marginBottom: 10 }, list: { gap: 9 }, credit: { color: "#6D6475", fontFamily: typography.sans, fontSize: 9.5, textAlign: "center", marginTop: 25 },
});
