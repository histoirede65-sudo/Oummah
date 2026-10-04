import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getHadithPreviews, hadithRepository } from "../../../../features/hadith-explorer/data/hadithRepository";
import type { HadithSummary } from "../../../../features/hadith-explorer/domain/Hadith";
import { getHadithCollection } from "../../../../features/hadith-explorer/domain/HadithCollection";
import type { HadithDocumentaryCategory } from "../../../../features/hadith-explorer/domain/HadithCollection";
import HadithCard from "../../../../features/hadith-explorer/presentation/HadithCard";
import HadithScreenHeader from "../../../../features/hadith-explorer/presentation/HadithScreenHeader";
import type { HadithPreview } from "../../../../features/hadith-explorer/presentation/hadithPreview";
import { colors } from "../../../../theme/colors";
import { typography } from "../../../../theme/typography";
import { useI18n } from "../../../../i18n";

const PAGE_SIZE = 20;

export default function HadithCollectionThemeScreen() {
  const { language, t } = useI18n();
  const { collectionId, themeId } = useLocalSearchParams<{
    collectionId: string;
    themeId: string;
  }>();

  const collection = useMemo(() => getHadithCollection(collectionId), [collectionId]);
  const [category, setCategory] = useState<HadithDocumentaryCategory | null>(null);
  const [items, setItems] = useState<HadithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [previews, setPreviews] = useState<Record<string, HadithPreview>>({});

  useEffect(() => {
    let active = true;

    if (!collection || !themeId) {
      setLoading(false);
      setItems([]);
      setCategory(null);
      return;
    }

    setLoading(true);
    setVisibleCount(PAGE_SIZE);

    void hadithRepository.listCollectionCategories(collection, language)
      .then((categories) => {
        const selected = categories.find((item) => item.id === themeId) ?? null;
        if (!selected) throw new Error("Catégorie introuvable.");
        setCategory(selected);
        return hadithRepository.searchCollectionCategory(collection, selected.id);
      })
      .then((results) => {
        if (active) setItems(results);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [collection, themeId, language]);

  useEffect(() => {
    setPreviews({});
  }, [language, collection?.id, themeId]);

  useEffect(() => {
    let active = true;
    const current = items.slice(0, visibleCount);
    if (!current.length) return;
    void getHadithPreviews(current, language).then((values) => active && setPreviews((old) => ({ ...old, ...values })));
    return () => { active = false; };
  }, [items, visibleCount, language]);

  if (!collection) {
    return (
      <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.emptyTitle}>{t("hadith.categoryNotFound")}</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (loading) {
    return (
      <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
        <SafeAreaView style={styles.center}>
          <ActivityIndicator color={colors.goldLight} />
          <Text style={styles.stateText}>{t("hadith.loadingCategory")}</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!category) {
    return (
      <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.emptyTitle}>{t("hadith.categoryNotFound")}</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const visibleItems = items.slice(0, visibleCount);

  return (
    <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}>
          <HadithScreenHeader title={category.name} subtitle={t(`hadith.collection.${collection.id}.name` as never)} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <LinearGradient colors={[`${collection.tone}D9`, "#201329"]} style={styles.hero}>
            <View style={styles.heroIcon}>
                <Ionicons name="pricetag-outline" size={25} color={colors.goldLight} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>{t("hadith.categoryUpper")}</Text>
              <Text style={styles.heroTitle}>{category.name}</Text>
              <Text style={styles.heroCollection}>{t(`hadith.collection.${collection.id}.name` as never)}</Text>
            </View>
          </LinearGradient>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>{t("hadith.categoryHadiths")}</Text>
            {!loading ? (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{items.length}</Text>
              </View>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.goldLight} />
              <Text style={styles.stateText}>{t("hadith.sortingCategoryHadiths")}</Text>
            </View>
          ) : items.length ? (
            <View style={styles.list}>
              {visibleItems.map((item, index) => {
                const preview = previews[item.id] ?? { title: t("hadith.loadingHadith"), subtitle: "" };
                return <HadithCard key={item.id} title={[preview.title, preview.subtitle].filter(Boolean).join(" ")} lines={4} index={index} onPress={() => router.push(`/hadith/${item.id}` as Href)} />;
              })}

              {visibleCount < items.length ? (
                <Pressable
                  onPress={() => setVisibleCount((value) => value + PAGE_SIZE)}
                  style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
                >
                  <Text style={styles.moreText}>{t("hadith.showTwentyMore")}</Text>
                  <Ionicons name="chevron-down" size={17} color={colors.goldLight} />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.state}>
              <Ionicons name="library-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>{t("hadith.noClassifiedHadith")}</Text>
              <Text style={styles.stateText}>
                {t("hadith.noCategoryMatch")}
              </Text>
            </View>
          )}

          <Text style={styles.credit}>
            {t("hadith.thematicClassificationCredit")}
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: { paddingHorizontal: 18 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: {
    padding: 19,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,232,183,0.24)",
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,12,28,0.28)",
    borderWidth: 1,
    borderColor: "rgba(244,213,138,0.22)",
  },
  heroCopy: { flex: 1 },
  heroEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 25,
    marginTop: 4,
  },
  heroCollection: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: typography.sans,
    fontSize: 11,
    marginTop: 4,
  },
  listHeader: {
    marginTop: 27,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 23,
  },
  countBadge: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(227,181,90,0.16)",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.24)",
  },
  countText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
    includeFontPadding: false,
  },
  list: { gap: 9 },
  state: { paddingVertical: 58, alignItems: "center", gap: 10 },
  stateText: {
    maxWidth: 290,
    textAlign: "center",
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11.5,
    lineHeight: 17,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 20,
  },
  moreButton: {
    marginTop: 5,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(227,181,90,0.08)",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.15)",
  },
  moreText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "700",
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.992 }] },
  credit: {
    color: "#6D6475",
    fontFamily: typography.sans,
    fontSize: 9.5,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 26,
  },
});
