import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DUA_GUIDES,
  DUA_SECTIONS,
  loadDuaCatalog,
  type DuaCategory,
  type DuaSectionId,
} from "../features/dua/DuaCatalog";
import {
  getDuaFavorites,
  getDuaProgress,
  type DuaProgress,
} from "../features/dua/DuaStore";
import {
  duaCategoryTitle,
  duaGuideText,
  duaMeaning,
  duaSectionText,
} from "../features/dua/DuaLocalization";
import { useI18n, type LanguageCode } from "../i18n";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

type FilterId = "all" | "favorites" | DuaSectionId;
type SectionDefinition = (typeof DUA_SECTIONS)[number];
type GuideDefinition = (typeof DUA_GUIDES)[number];

const SECTION_ORDER = new Map(
  DUA_SECTIONS.map((section, index) => [section.id, index]),
);

const QUICK_SECTION_IDS: readonly DuaSectionId[] = [
  "morning",
  "evening",
  "sleep",
  "prayer",
  "protection",
];

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchingItemIndex(category: DuaCategory, query: string, language: LanguageCode) {
  const search = normalize(query.trim());
  if (!search) return 0;
  const index = category.items.findIndex((item) =>
    normalize(
      `${item.arabic} ${item.phonetic} ${item.french} ${duaMeaning(item, language)} ${duaCategoryTitle(category, language)}`,
    ).includes(search),
  );
  return Math.max(0, index);
}

function openCategory(
  categoryId: number,
  itemIndex = 0,
  period?: "morning" | "evening",
) {
  router.push({
    pathname: "/dua/[categoryId]",
    params: {
      categoryId: String(categoryId),
      item: String(itemIndex),
      ...(period ? { period } : {}),
    },
  });
}

function sectionFor(id: DuaSectionId) {
  return DUA_SECTIONS.find((section) => section.id === id) ?? DUA_SECTIONS[0];
}

export default function DuaHomeScreen() {
  const { language, t } = useI18n();
  const { section: requestedSection, focus: requestedFocus } = useLocalSearchParams<{
    section?: string | string[];
    focus?: string | string[];
  }>();
  const [catalog, setCatalog] = useState<readonly DuaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [favoriteIds, setFavoriteIds] = useState<readonly string[]>([]);
  const [resume, setResume] = useState<DuaProgress | null>(null);
  const [expandedSections, setExpandedSections] = useState<readonly DuaSectionId[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const sectionOffsetsRef = useRef<Partial<Record<DuaSectionId, number>>>({});
  const libraryOffsetRef = useRef(0);
  const handledNotificationRouteRef = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.all([loadDuaCatalog(), getDuaFavorites(), getDuaProgress()])
      .then(([nextCatalog, favorites, progress]) => {
        if (!active) return;
        setCatalog(nextCatalog);
        setFavoriteIds(favorites);
        setResume(progress);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const suggestedSection: DuaSectionId =
    new Date().getHours() >= 18 || new Date().getHours() < 5
      ? "sleep"
      : "morning";
  const suggestedCategory =
    catalog.find((category) => category.section === suggestedSection) ??
    catalog[0];
  const resumeCategory = resume
    ? catalog.find((category) => category.id === resume.categoryId)
    : undefined;

  const filtered = useMemo(() => {
    const search = normalize(query.trim());
    const favorites = new Set(favoriteIds);
    return catalog
      .filter((category) => {
        if (
          filter !== "all" &&
          filter !== "favorites" &&
          category.section !== filter
        ) {
          return false;
        }
        if (
          filter === "favorites" &&
          !category.items.some((item) => favorites.has(item.id))
        ) {
          return false;
        }
        if (!category.items.length) return false;
        if (!search) return true;
        return normalize(
          `${category.frenchTitle} ${duaCategoryTitle(category, language)} ${category.arabicTitle} ${category.items
            .map((item) => `${item.arabic} ${item.phonetic} ${item.french} ${duaMeaning(item, language)}`)
            .join(" ")}`,
        ).includes(search);
      })
      .sort((a, b) => {
        const sectionDifference =
          (SECTION_ORDER.get(a.section) ?? 999) -
          (SECTION_ORDER.get(b.section) ?? 999);
        if (sectionDifference !== 0) return sectionDifference;
        return a.frenchTitle.localeCompare(b.frenchTitle, "fr");
      });
  }, [catalog, favoriteIds, filter, language, query]);

  const searching = query.trim().length > 0;
  const visibleDuaCount = filtered.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );
  const duaCountBySection = new Map<DuaSectionId, number>();
  for (const category of catalog) {
    duaCountBySection.set(
      category.section,
      (duaCountBySection.get(category.section) ?? 0) + category.items.length,
    );
  }

  const quickSections = QUICK_SECTION_IDS.map(sectionFor).filter((section) =>
    catalog.some((category) => category.section === section.id),
  );

  const revealSection = (section: DuaSectionId) => {
    setFilter("all");
    setQuery("");
    setExpandedSections([section]);
    requestAnimationFrame(() => {
      setTimeout(() => {
        const y = sectionOffsetsRef.current[section];
        if (typeof y === "number") {
          scrollRef.current?.scrollTo({ y: Math.max(0, libraryOffsetRef.current + y - 18), animated: true });
        }
      }, 80);
    });
  };

  const applySection = (section: DuaSectionId) => {
    revealSection(section);
  };

  useEffect(() => {
    if (loading || handledNotificationRouteRef.current || catalog.length === 0) return;

    const sectionValue = Array.isArray(requestedSection) ? requestedSection[0] : requestedSection;
    const focusValue = Array.isArray(requestedFocus) ? requestedFocus[0] : requestedFocus;
    const validSection = DUA_SECTIONS.some((entry) => entry.id === sectionValue)
      ? (sectionValue as DuaSectionId)
      : undefined;

    if (!validSection && !focusValue) return;
    handledNotificationRouteRef.current = true;

    const focusQueries: Record<string, string> = {
      "wake-up": "réveil",
      bedtime: "dormir",
      leave: "sortant de chez",
      enter: "entrant chez",
      "before-meal": "avant de manger",
    };
    const focusQuery = focusValue ? focusQueries[focusValue] : undefined;
    const candidates = validSection
      ? catalog.filter((category) => category.section === validSection)
      : catalog;
    const matchingCategory = focusQuery
      ? candidates.find((category) =>
          normalize(`${category.frenchTitle} ${category.items.map((item) => item.french).join(" ")}`).includes(
            normalize(focusQuery),
          ),
        )
      : candidates[0];

    if (matchingCategory) {
      openCategory(matchingCategory.id, focusQuery ? matchingItemIndex(matchingCategory, focusQuery, "fr") : 0);
    } else if (validSection) {
      revealSection(validSection);
    }
  }, [catalog, loading, requestedFocus, requestedSection]);

  const applyGuide = (guide: GuideDefinition) => {
    if (guide.categoryId != null) {
      openCategory(guide.categoryId);
      return;
    }
    if (guide.section) {
      applySection(guide.section);
      return;
    }
    setFilter("all");
    setQuery(guide.query ?? "");
  };

  const toggleSection = (sectionId: DuaSectionId) => {
    setExpandedSections((current) =>
      current.includes(sectionId)
        ? current.filter((id) => id !== sectionId)
        : [...current, sectionId],
    );
  };

  const groupedSections = useMemo(() =>
    DUA_SECTIONS.map((section) => ({
      section,
      categories: filtered.filter((category) => category.section === section.id),
    })).filter((group) => group.categories.length > 0),
  [filtered]);

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={t("common.back")}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/" as Href)
          }
          style={styles.circleButton}
        >
          <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
        </Pressable>
        <View style={styles.titleCopy}>
          <Text style={styles.title}>{t("dua.home.title")}</Text>
          <Text style={styles.subtitle}>{t("dua.home.subtitle")}</Text>
        </View>
        <Pressable
          accessibilityLabel={t("dua.home.favorites")}
          accessibilityState={{ selected: filter === "favorites" }}
          onPress={() => setFilter(filter === "favorites" ? "all" : "favorites")}
          style={[styles.circleButton, filter === "favorites" && styles.circleButtonActive]}
        >
          <Ionicons
            name={filter === "favorites" ? "heart" : "heart-outline"}
            size={20}
            color={colors.goldLight}
          />
        </Pressable>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={19} color={colors.goldMuted} />
        <TextInput
          accessibilityLabel={t("dua.home.searchPlaceholder")}
          value={query}
          onChangeText={setQuery}
          placeholder={t("dua.home.searchPlaceholder")}
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.goldLight}
          style={styles.searchInput}
        />
        {query ? (
          <Pressable
            accessibilityLabel={t("dua.home.clearSearch")}
            hitSlop={8}
            onPress={() => setQuery("")}
          >
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {!searching ? (
        <>
          <View style={styles.hero}>
            <Image
              source={require("../assets/images/home/shortcuts/dua-real.jpg")}
              contentFit="cover"
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={["rgba(8,7,19,0.10)", "rgba(8,7,19,0.62)", "rgba(8,7,19,0.97)"]}
              locations={[0, 0.45, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroContent}>
              <Text style={styles.heroEyebrow}>{t("dua.home.suggestedNow")}</Text>
              <Text numberOfLines={2} style={styles.heroTitle}>
                {suggestedCategory
                  ? duaCategoryTitle(suggestedCategory, language)
                  : t("dua.home.essentials")}
              </Text>
              <View style={styles.heroBottom}>
                <Text numberOfLines={1} style={styles.heroArabic}>
                  {suggestedCategory?.arabicTitle ?? "الأذكار"}
                </Text>
                <Pressable
                  disabled={!suggestedCategory}
                  onPress={() => suggestedCategory && openCategory(suggestedCategory.id)}
                  style={styles.startButton}
                >
                  <Ionicons name="play" size={15} color={colors.background} />
                  <Text style={styles.startText}>{t("dua.home.start")}</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {resumeCategory ? (
            <Pressable
              onPress={() => openCategory(resumeCategory.id, resume?.itemIndex ?? 0)}
              style={({ pressed }) => [styles.resumeCard, pressed && styles.pressed]}
            >
              <View style={styles.resumeIcon}>
                <Ionicons name="time-outline" size={19} color={colors.goldLight} />
              </View>
              <View style={styles.resumeCopy}>
                <Text style={styles.resumeEyebrow}>{t("dua.home.resume")}</Text>
                <Text numberOfLines={1} style={styles.resumeTitle}>
                  {duaCategoryTitle(resumeCategory, language)}
                </Text>
              </View>
              <Text style={styles.resumeMeta}>
                {(resume?.itemIndex ?? 0) + 1} / {resumeCategory.items.length}
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.goldLight} />
            </Pressable>
          ) : null}

          <SectionHeading eyebrow={t("dua.home.quickEyebrow")} title={t("dua.home.quickTitle")} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRow}
          >
            {quickSections.map((section) => (
              <QuickCard
                key={section.id}
                section={section}
                text={duaSectionText(section, language)}
                countLabel={t("dua.home.duaCount", { count: duaCountBySection.get(section.id) ?? 0 })}
                onPress={() => applySection(section.id)}
              />
            ))}
          </ScrollView>

          <SectionHeading eyebrow={t("dua.home.needEyebrow")} title={t("dua.home.needTitle")} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.guideRow}
          >
            {DUA_GUIDES.map((guide) => (
              <GuideCard
                key={guide.id}
                guide={guide}
                text={duaGuideText(guide, language)}
                onPress={() => applyGuide(guide)}
              />
            ))}
          </ScrollView>
        </>
      ) : null}

      <View
        onLayout={(event) => {
          libraryOffsetRef.current = event.nativeEvent.layout.y;
        }}
        style={styles.catalogHeading}
      >
        <Text style={styles.catalogTitle}>
          {searching
            ? t("dua.home.results")
            : filter === "favorites"
              ? t("dua.home.favoritesTitle")
              : t("dua.home.libraryTitle")}
        </Text>
        <Text style={styles.resultCount}>
          {t("dua.home.duaCount", { count: visibleDuaCount })}
        </Text>
      </View>

      {loading ? (
        <View style={styles.empty}>
          <ActivityIndicator color={colors.goldLight} />
          <Text style={styles.emptyText}>{t("dua.home.loading")}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons
            name={filter === "favorites" ? "heart-outline" : "search-outline"}
            size={25}
            color={colors.goldLight}
          />
          <Text style={styles.emptyText}>
            {filter === "favorites" && !searching
              ? t("dua.home.noFavorites")
              : t("dua.home.noResults")}
          </Text>
        </View>
      ) : filter !== "all" || searching ? (
        <View style={styles.filteredList}>
          {filtered.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              title={duaCategoryTitle(category, language)}
              countLabel={t("dua.home.duaCount", { count: category.items.length })}
              section={sectionFor(category.section)}
              favoriteCount={category.items.filter((entry) => favoriteIds.includes(entry.id)).length}
              onPress={() => openCategory(category.id, matchingItemIndex(category, query, language))}
            />
          ))}
        </View>
      ) : (
        <View style={styles.accordionList}>
          {groupedSections.map(({ section, categories }) => {
            const expanded = expandedSections.includes(section.id);
            const text = duaSectionText(section, language);
            const duaCount = categories.reduce((sum, category) => sum + category.items.length, 0);
            return (
              <View
                key={section.id}
                style={styles.accordionGroup}
                onLayout={(event) => {
                  sectionOffsetsRef.current[section.id] = event.nativeEvent.layout.y;
                }}
              >
                <Pressable
                  accessibilityState={{ expanded }}
                  onPress={() => toggleSection(section.id)}
                  style={({ pressed }) => [styles.accordionHeader, pressed && styles.pressed]}
                >
                  <View style={styles.catalogSectionIcon}>
                    <Ionicons
                      name={section.icon as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={colors.goldLight}
                    />
                  </View>
                  <View style={styles.accordionCopy}>
                    <Text style={styles.catalogSectionTitle}>{text.label}</Text>
                    <Text style={styles.catalogSectionSubtitle}>
                      {t("dua.home.duaCount", { count: duaCount })}
                    </Text>
                  </View>
                  <Ionicons
                    name={expanded ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.goldLight}
                  />
                </Pressable>
                {expanded ? (
                  <View style={styles.accordionBody}>
                    {categories.map((category) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        title={duaCategoryTitle(category, language)}
                        countLabel={t("dua.home.duaCount", { count: category.items.length })}
                        section={section}
                        favoriteCount={category.items.filter((entry) => favoriteIds.includes(entry.id)).length}
                        onPress={() => openCategory(category.id)}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {header}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function QuickCard({
  section,
  text,
  countLabel,
  onPress,
}: {
  section: SectionDefinition;
  text: { label: string; subtitle: string };
  countLabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickCard, pressed && styles.pressed]}
    >
      <Image source={section.imageSource} contentFit="cover" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["rgba(4,4,10,0.06)", "rgba(8,6,15,0.88)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.quickIcon}>
        <Ionicons
          name={section.icon as keyof typeof Ionicons.glyphMap}
          size={18}
          color={colors.goldLight}
        />
      </View>
      <Text style={styles.quickTitle}>{text.label}</Text>
      <Text numberOfLines={1} style={styles.quickSubtitle}>
        {countLabel}
      </Text>
    </Pressable>
  );
}

function GuideCard({
  guide,
  text,
  onPress,
}: {
  guide: GuideDefinition;
  text: { label: string; subtitle: string };
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.guideCard, pressed && styles.pressed]}
    >
      <Image source={guide.imageSource} contentFit="cover" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["rgba(6,5,12,0.02)", "rgba(9,6,16,0.93)"]}
        locations={[0.2, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.guideTopRow}>
        <View style={styles.guideIcon}>
          <Ionicons
            name={guide.icon as keyof typeof Ionicons.glyphMap}
            size={17}
            color={colors.goldLight}
          />
        </View>
        <Ionicons name="arrow-forward" size={15} color={colors.goldLight} />
      </View>
      <Text style={styles.guideTitle}>{text.label}</Text>
      <Text numberOfLines={2} style={styles.guideSubtitle}>
        {text.subtitle}
      </Text>
    </Pressable>
  );
}

function CategoryCard({
  category,
  title,
  countLabel,
  section,
  favoriteCount,
  onPress,
}: {
  category: DuaCategory;
  title: string;
  countLabel: string;
  section: SectionDefinition;
  favoriteCount: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]}
    >
      <View style={styles.categoryImageWrap}>
        <Image source={section.imageSource} contentFit="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={["rgba(8,5,14,0.04)", "rgba(10,7,17,0.82)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.categoryImageIcon}>
          <Ionicons
            name={section.icon as keyof typeof Ionicons.glyphMap}
            size={16}
            color={colors.goldLight}
          />
        </View>
      </View>
      <View style={styles.categoryCopy}>
        <Text numberOfLines={2} style={styles.categoryTitle}>
          {title}
        </Text>
        <Text numberOfLines={1} style={styles.categoryArabic}>
          {category.arabicTitle}
        </Text>
        <View style={styles.categoryMetaRow}>
          <Text style={styles.categoryMeta}>{countLabel}</Text>
          {favoriteCount > 0 ? (
            <>
              <View style={styles.metaDot} />
              <Ionicons name="heart" size={11} color={colors.goldMuted} />
              <Text style={styles.categoryMeta}>{favoriteCount}</Text>
            </>
          ) : null}
        </View>
      </View>
      <View style={styles.categoryArrow}>
        <Ionicons name="arrow-forward" size={16} color={colors.goldLight} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 14, paddingBottom: 116 },
  headerContent: { marginHorizontal: -14, paddingHorizontal: 14 },
  topBar: { height: 72, flexDirection: "row", alignItems: "center" },
  circleButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
  },
  titleCopy: { flex: 1, marginHorizontal: 12 },
  title: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 29 },
  subtitle: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11 },
  hero: {
    height: 200,
    marginTop: 12,
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
    backgroundColor: "#151022",
  },
  heroEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.05,
  },
  heroTitle: {
    marginTop: 7,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 24,
    lineHeight: 27,
  },
  heroArabic: {
    flex: 1,
    color: "#EBC86F",
    fontFamily: typography.arabic,
    fontSize: 19,
    lineHeight: 27,
    textAlign: "left",
  },
  heroBottom: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 10 },
  startButton: {
    height: 38,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.goldLight,
  },
  startText: {
    marginLeft: 6,
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: "800",
  },
  resumeCard: {
    minHeight: 64,
    marginTop: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.26)",
    backgroundColor: "#151022",
  },
  resumeIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "#1E1730",
  },
  resumeCopy: { flex: 1, minWidth: 0, marginLeft: 3 },
  resumeEyebrow: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  resumeTitle: { marginTop: 2, color: colors.text, fontFamily: typography.serifMedium, fontSize: 16 },
  resumeMeta: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  sectionHeading: { marginTop: 22, paddingHorizontal: 2 },
  sectionEyebrow: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  sectionTitle: { marginTop: 3, color: colors.text, fontFamily: typography.serifMedium, fontSize: 20.5 },
  quickRow: { paddingTop: 10, paddingRight: 28, gap: 9 },
  quickCard: {
    width: 164,
    height: 135,
    padding: 13,
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 13,
    elevation: 6,
  },
  quickIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,234,188,0.35)",
    backgroundColor: "rgba(15,10,24,0.66)",
  },
  quickTitle: { marginTop: "auto", color: "#FFF8EF", fontFamily: typography.serifSemibold, fontSize: 16.5 },
  quickSubtitle: { marginTop: 3, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11 },
  guideRow: { paddingTop: 10, paddingRight: 28, gap: 9 },
  guideCard: {
    width: 146,
    height: 166,
    padding: 12,
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  guideTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  guideIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(13,9,21,0.70)",
  },
  guideTitle: { marginTop: "auto", color: colors.text, fontFamily: typography.serifSemibold, fontSize: 15.5, lineHeight: 17.5 },
  guideSubtitle: { marginTop: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11, lineHeight: 15 },
  search: {
    height: 50,
    marginTop: 4,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
  },
  searchInput: { flex: 1, marginHorizontal: 9, padding: 0, color: colors.text, fontFamily: typography.sans, fontSize: 14 },
  catalogHeading: {
    marginTop: 24,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  catalogTitle: { color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 21 },
  resultCount: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  catalogSectionIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
    backgroundColor: "#1E1730",
  },
  catalogSectionTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 16.5 },
  catalogSectionSubtitle: {
    marginTop: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  categoryCard: {
    minHeight: 116,
    overflow: "hidden",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#100C19",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 5,
  },
  categoryImageWrap: { width: 82, height: 94, overflow: "hidden", borderRadius: 18, backgroundColor: colors.surface },
  categoryImageIcon: {
    position: "absolute",
    right: 7,
    bottom: 7,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "rgba(12,8,20,0.76)",
  },
  categoryCopy: { flex: 1, minWidth: 0, marginHorizontal: 11 },
  categoryTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 16.5, lineHeight: 19 },
  categoryArabic: {
    marginTop: 3,
    color: colors.goldMuted,
    fontFamily: typography.arabic,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "right",
    writingDirection: "rtl",
  },
  categoryMetaRow: { marginTop: 6, flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  categoryMeta: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  metaDot: { width: 3, height: 3, marginHorizontal: 5, borderRadius: 2, backgroundColor: colors.goldDark },
  categoryArrow: {
    width: 31,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#1E1730",
  },
  empty: { minHeight: 170, alignItems: "center", justifyContent: "center" },
  emptyText: { marginTop: 10, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, textAlign: "center" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.992 }] },
  filteredList: { gap: 10, paddingBottom: 18 },
  accordionList: { gap: 10, paddingBottom: 22 },
  accordionGroup: {
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
  },
  accordionHeader: {
    minHeight: 68,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  accordionCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  accordionBody: {
    gap: 10,
    paddingHorizontal: 9,
    paddingBottom: 10,
  },
  circleButtonActive: { borderColor: colors.goldLight, backgroundColor: "rgba(227,181,90,0.12)" },
  heroContent: {
    position: "absolute",
    right: 16,
    bottom: 14,
    left: 16,
  },
});
