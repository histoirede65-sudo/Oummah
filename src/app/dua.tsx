import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

type FilterId = "all" | "favorites" | DuaSectionId;
type SectionDefinition = (typeof DUA_SECTIONS)[number];
type GuideDefinition = (typeof DUA_GUIDES)[number];

const SECTION_ORDER = new Map(
  DUA_SECTIONS.map((section, index) => [section.id, index]),
);

const QUICK_SECTION_IDS: readonly DuaSectionId[] = [
  "morning-evening",
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

function matchingItemIndex(category: DuaCategory, query: string) {
  const search = normalize(query.trim());
  if (!search) return 0;
  const index = category.items.findIndex((item) =>
    normalize(
      `${item.arabic} ${item.phonetic} ${item.french} ${category.frenchTitle}`,
    ).includes(search),
  );
  return Math.max(0, index);
}

function openCategory(categoryId: number, itemIndex = 0) {
  router.push({
    pathname: "/dua/[categoryId]",
    params: { categoryId: String(categoryId), item: String(itemIndex) },
  });
}

function sectionFor(id: DuaSectionId) {
  return DUA_SECTIONS.find((section) => section.id === id) ?? DUA_SECTIONS[0];
}

export default function DuaHomeScreen() {
  const [catalog, setCatalog] = useState<readonly DuaCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [favoriteIds, setFavoriteIds] = useState<readonly string[]>([]);
  const [resume, setResume] = useState<DuaProgress | null>(null);

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
      : "morning-evening";
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
          `${category.frenchTitle} ${category.arabicTitle} ${category.items
            .map((item) => `${item.arabic} ${item.phonetic} ${item.french}`)
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
  }, [catalog, favoriteIds, filter, query]);

  const totalItems = catalog.reduce(
    (sum, category) => sum + category.items.length,
    0,
  );
  const exactTranslationCount = catalog.reduce(
    (sum, category) =>
      sum + category.items.filter((item) => !item.frenchIsSummary).length,
    0,
  );

  const quickSections = QUICK_SECTION_IDS.map(sectionFor).filter((section) =>
    catalog.some((category) => category.section === section.id),
  );

  const applySection = (section: DuaSectionId) => {
    setFilter(section);
    setQuery("");
  };

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

  const header = (
    <View style={styles.headerContent}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/" as Href)
          }
          style={styles.circleButton}
        >
          <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
        </Pressable>
        <View style={styles.titleCopy}>
          <Text style={styles.title}>Dou‘ā</Text>
          <Text style={styles.subtitle}>Trouver, comprendre et apprendre</Text>
        </View>
        <Pressable
          onPress={() => setFilter(filter === "favorites" ? "all" : "favorites")}
          style={styles.circleButton}
        >
          <Ionicons
            name={filter === "favorites" ? "heart" : "heart-outline"}
            size={20}
            color={colors.goldLight}
          />
        </Pressable>
      </View>

      <View style={styles.hero}>
        <Image
          source={require("../assets/images/home/shortcuts/dua-real.jpg")}
          contentFit="cover"
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[
            "rgba(7,6,16,0.03)",
            "rgba(18,9,29,0.46)",
            "rgba(7,6,15,0.96)",
          ]}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroRim} />
        <View style={styles.heroGlass}>
          <View style={styles.heroEyebrowRow}>
            <View style={styles.liveDot} />
            <Text style={styles.heroEyebrow}>DOU‘Ā CONSEILLÉE MAINTENANT</Text>
          </View>
          <Text numberOfLines={2} style={styles.heroTitle}>
            {suggestedCategory?.frenchTitle ?? "Invocations essentielles"}
          </Text>
          <Text numberOfLines={1} style={styles.heroArabic}>
            {suggestedCategory?.arabicTitle ?? "الأذكار"}
          </Text>
          <View style={styles.heroBottom}>
            <View style={styles.heroMetaWrap}>
              <Ionicons name="language-outline" size={13} color={colors.goldMuted} />
              <Text style={styles.heroMeta}>arabe · phonétique · français</Text>
            </View>
            <Pressable
              disabled={!suggestedCategory}
              onPress={() => suggestedCategory && openCategory(suggestedCategory.id)}
              style={styles.startButton}
            >
              <Ionicons name="play" size={15} color={colors.background} />
              <Text style={styles.startText}>Commencer</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <Stat icon="albums-outline" value={String(catalog.length)} label="rubriques" />
        <Stat icon="sparkles-outline" value={String(totalItems)} label="dou‘ā" />
        <Stat
          icon="language-outline"
          value={String(exactTranslationCount)}
          label="traductions"
        />
      </View>

      {resumeCategory ? (
        <Pressable
          onPress={() => openCategory(resumeCategory.id, resume?.itemIndex ?? 0)}
          style={({ pressed }) => [styles.resumeCard, pressed && styles.pressed]}
        >
          <LinearGradient
            colors={["rgba(87,43,105,0.84)", "rgba(25,15,35,0.96)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.resumeIcon}>
            <Ionicons name="time-outline" size={20} color={colors.goldLight} />
          </View>
          <View style={styles.resumeCopy}>
            <Text style={styles.resumeEyebrow}>REPRENDRE MON APPRENTISSAGE</Text>
            <Text numberOfLines={1} style={styles.resumeTitle}>
              {resumeCategory.frenchTitle}
            </Text>
            <Text style={styles.resumeMeta}>
              Dou‘ā {(resume?.itemIndex ?? 0) + 1} sur {resumeCategory.items.length}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.goldLight} />
        </Pressable>
      ) : null}

      <SectionHeading
        eyebrow="ACCÈS RAPIDE"
        title="Les moments essentiels"
        action="Tout afficher"
        onAction={() => {
          setFilter("all");
          setQuery("");
        }}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickRow}
      >
        {quickSections.map((section) => (
          <QuickCard
            key={section.id}
            section={section}
            active={filter === section.id}
            onPress={() => applySection(section.id)}
          />
        ))}
      </ScrollView>

      <SectionHeading
        eyebrow="SELON VOTRE BESOIN"
        title="Que traversez-vous aujourd’hui ?"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.guideRow}
      >
        {DUA_GUIDES.map((guide) => (
          <GuideCard key={guide.id} guide={guide} onPress={() => applyGuide(guide)} />
        ))}
      </ScrollView>

      <View style={styles.search}>
        <View style={styles.searchGlow} />
        <Ionicons name="search" size={19} color={colors.goldMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher une dou‘ā, un besoin, une phrase…"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.goldLight}
          style={styles.searchInput}
        />
        {query ? (
          <Pressable onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        <FilterChip
          label="Toutes"
          icon="apps-outline"
          active={filter === "all"}
          onPress={() => setFilter("all")}
        />
        <FilterChip
          label="Favoris"
          icon="heart-outline"
          active={filter === "favorites"}
          onPress={() => setFilter("favorites")}
        />
        {DUA_SECTIONS.map((section) => (
          <FilterChip
            key={section.id}
            label={section.label}
            icon={section.icon as keyof typeof Ionicons.glyphMap}
            active={filter === section.id}
            onPress={() => applySection(section.id)}
          />
        ))}
      </ScrollView>

      <View style={styles.catalogHeading}>
        <View>
          <Text style={styles.catalogEyebrow}>BIBLIOTHÈQUE ORGANISÉE</Text>
          <Text style={styles.catalogTitle}>
            {filter === "all"
              ? "Toutes les invocations"
              : filter === "favorites"
                ? "Vos invocations favorites"
                : sectionFor(filter).label}
          </Text>
        </View>
        <Text style={styles.resultCount}>{filtered.length} catégories</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => {
          const previous = filtered[index - 1];
          const showSectionHeader =
            filter === "all" && previous?.section !== item.section;
          const section = sectionFor(item.section);
          return (
            <View>
              {showSectionHeader ? <CatalogSectionHeader section={section} /> : null}
              <CategoryCard
                category={item}
                section={section}
                favoriteCount={
                  item.items.filter((entry) => favoriteIds.includes(entry.id)).length
                }
                onPress={() => openCategory(item.id, matchingItemIndex(item, query))}
              />
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          loading ? (
            <View style={styles.empty}>
              <ActivityIndicator color={colors.goldLight} />
              <Text style={styles.emptyText}>Organisation des invocations…</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={25} color={colors.goldLight} />
              <Text style={styles.emptyText}>
                Aucune invocation ne correspond à cette sélection.
              </Text>
            </View>
          )
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
      />
    </SafeAreaView>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={16} color={colors.goldLight} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function SectionHeading({
  eyebrow,
  title,
  action,
  onAction,
}: {
  eyebrow: string;
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionHeadingCopy}>
        <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action && onAction ? (
        <Pressable onPress={onAction} style={styles.seeAllPill}>
          <Text style={styles.seeAllText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function QuickCard({
  section,
  active,
  onPress,
}: {
  section: SectionDefinition;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickCard,
        active && styles.quickCardActive,
        pressed && styles.pressed,
      ]}
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
      <Text style={styles.quickTitle}>{section.label}</Text>
      <Text numberOfLines={2} style={styles.quickSubtitle}>
        {section.subtitle}
      </Text>
    </Pressable>
  );
}

function GuideCard({ guide, onPress }: { guide: GuideDefinition; onPress: () => void }) {
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
      <Text style={styles.guideTitle}>{guide.label}</Text>
      <Text numberOfLines={2} style={styles.guideSubtitle}>
        {guide.subtitle}
      </Text>
    </Pressable>
  );
}

function FilterChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, active && styles.filterChipActive]}
    >
      <Ionicons
        name={icon}
        size={13}
        color={active ? colors.background : colors.goldMuted}
      />
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function CatalogSectionHeader({ section }: { section: SectionDefinition }) {
  return (
    <View style={styles.catalogSectionHeader}>
      <View style={styles.catalogSectionIcon}>
        <Ionicons
          name={section.icon as keyof typeof Ionicons.glyphMap}
          size={17}
          color={colors.goldLight}
        />
      </View>
      <View style={styles.catalogSectionCopy}>
        <Text style={styles.catalogSectionTitle}>{section.label}</Text>
        <Text style={styles.catalogSectionSubtitle}>{section.subtitle}</Text>
      </View>
      <View style={styles.catalogSectionLine} />
    </View>
  );
}

function CategoryCard({
  category,
  section,
  favoriteCount,
  onPress,
}: {
  category: DuaCategory;
  section: SectionDefinition;
  favoriteCount: number;
  onPress: () => void;
}) {
  const audioCount = category.items.filter((item) => item.audioUrl || item.audioSource).length;
  const translatedCount = category.items.filter((item) => !item.frenchIsSummary).length;
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
          {category.frenchTitle}
        </Text>
        <Text numberOfLines={1} style={styles.categoryArabic}>
          {category.arabicTitle}
        </Text>
        <View style={styles.categoryMetaRow}>
          <Text style={styles.categoryMeta}>{category.items.length} dou‘ā</Text>
          {audioCount > 0 ? (
            <>
              <View style={styles.metaDot} />
              <Ionicons name="headset-outline" size={11} color={colors.textMuted} />
              <Text style={styles.categoryMeta}>{audioCount}</Text>
            </>
          ) : null}
          {translatedCount > 0 ? (
            <>
              <View style={styles.metaDot} />
              <Ionicons name="language-outline" size={11} color={colors.textMuted} />
              <Text style={styles.categoryMeta}>{translatedCount}</Text>
            </>
          ) : null}
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
    borderColor: "rgba(244,211,143,0.24)",
    backgroundColor: "rgba(55,29,72,0.78)",
  },
  titleCopy: { flex: 1, marginHorizontal: 12 },
  title: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 29 },
  subtitle: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5 },
  hero: {
    height: 300,
    overflow: "hidden",
    borderRadius: 29,
    borderWidth: 1,
    borderColor: "rgba(237,196,111,0.38)",
    backgroundColor: colors.surface,
    shadowColor: "#8A4FA4",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 10,
  },
  heroRim: {
    position: "absolute",
    top: 5,
    right: 5,
    bottom: 5,
    left: 5,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  heroGlass: {
    position: "absolute",
    right: 12,
    bottom: 12,
    left: 12,
    padding: 15,
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,241,220,0.28)",
    backgroundColor: "rgba(12,9,20,0.76)",
  },
  heroEyebrowRow: { flexDirection: "row", alignItems: "center" },
  liveDot: {
    width: 6,
    height: 6,
    marginRight: 7,
    borderRadius: 3,
    backgroundColor: colors.goldLight,
    shadowColor: colors.goldLight,
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  heroEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 8.2,
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
    marginTop: 3,
    color: "#EBC86F",
    fontFamily: typography.arabic,
    fontSize: 19,
    lineHeight: 27,
    textAlign: "right",
    writingDirection: "rtl",
  },
  heroBottom: { marginTop: 9, flexDirection: "row", alignItems: "center" },
  heroMetaWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 5 },
  heroMeta: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 8.6 },
  startButton: {
    height: 38,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.goldLight,
    shadowColor: colors.goldLight,
    shadowOpacity: 0.42,
    shadowRadius: 9,
    elevation: 5,
  },
  startText: {
    marginLeft: 6,
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  statsRow: { height: 70, marginTop: 11, flexDirection: "row", gap: 7 },
  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(244,211,143,0.18)",
    backgroundColor: "rgba(29,18,42,0.86)",
  },
  statValue: { marginTop: 2, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 15 },
  statLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 7.5 },
  resumeCard: {
    minHeight: 80,
    marginTop: 10,
    paddingHorizontal: 12,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
  },
  resumeIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(20,12,31,0.68)",
  },
  resumeCopy: { flex: 1, minWidth: 0, marginHorizontal: 11 },
  resumeEyebrow: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 7.4,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  resumeTitle: { marginTop: 2, color: colors.text, fontFamily: typography.serifMedium, fontSize: 16 },
  resumeMeta: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 8 },
  sectionHeading: {
    marginTop: 22,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionHeadingCopy: { flex: 1, minWidth: 0 },
  sectionEyebrow: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  sectionTitle: { marginTop: 3, color: colors.text, fontFamily: typography.serifMedium, fontSize: 20.5 },
  seeAllPill: {
    height: 29,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.34)",
    backgroundColor: "rgba(79,38,97,0.55)",
  },
  seeAllText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 8.5, fontWeight: "800" },
  quickRow: { paddingTop: 10, paddingRight: 28, gap: 9 },
  quickCard: {
    width: 164,
    height: 135,
    padding: 13,
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,242,220,0.21)",
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 13,
    elevation: 6,
  },
  quickCardActive: { borderColor: "rgba(240,204,124,0.66)", shadowColor: "#9360A8", shadowOpacity: 0.36 },
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
  quickSubtitle: { marginTop: 3, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 8.2, lineHeight: 11.5 },
  guideRow: { paddingTop: 10, paddingRight: 28, gap: 9 },
  guideCard: {
    width: 146,
    height: 166,
    padding: 12,
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,242,220,0.21)",
    backgroundColor: colors.surface,
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
  guideSubtitle: { marginTop: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 8, lineHeight: 11.5 },
  search: {
    height: 54,
    marginTop: 21,
    paddingHorizontal: 14,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,242,220,0.27)",
    backgroundColor: "rgba(23,17,30,0.91)",
    shadowColor: "#8B4FA6",
    shadowOpacity: 0.23,
    shadowRadius: 12,
  },
  searchGlow: {
    position: "absolute",
    top: -30,
    right: -5,
    width: 110,
    height: 80,
    borderRadius: 50,
    backgroundColor: "rgba(159,94,184,0.12)",
  },
  searchInput: { flex: 1, marginHorizontal: 9, padding: 0, color: colors.text, fontFamily: typography.sans, fontSize: 12 },
  filtersRow: { paddingTop: 10, paddingRight: 28, gap: 7 },
  filterChip: {
    height: 35,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,242,220,0.18)",
    backgroundColor: "rgba(35,21,47,0.84)",
  },
  filterChipActive: { borderColor: colors.goldLight, backgroundColor: colors.goldLight },
  filterText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 9, fontWeight: "700" },
  filterTextActive: { color: colors.background, fontWeight: "900" },
  catalogHeading: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  catalogEyebrow: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 1,
  },
  catalogTitle: { marginTop: 3, color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 21 },
  resultCount: { marginBottom: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 9 },
  catalogSectionHeader: {
    minHeight: 58,
    marginTop: 18,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  catalogSectionIcon: {
    width: 37,
    height: 37,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
    backgroundColor: "rgba(71,36,88,0.62)",
  },
  catalogSectionCopy: { marginLeft: 9 },
  catalogSectionTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 16.5 },
  catalogSectionSubtitle: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 8 },
  catalogSectionLine: { flex: 1, height: 1, marginLeft: 10, backgroundColor: "rgba(227,181,90,0.16)" },
  categoryCard: {
    minHeight: 116,
    overflow: "hidden",
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(255,242,220,0.20)",
    backgroundColor: "rgba(29,18,39,0.94)",
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
  categoryMeta: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 7.8 },
  metaDot: { width: 3, height: 3, marginHorizontal: 5, borderRadius: 2, backgroundColor: colors.goldDark },
  categoryArrow: {
    width: 31,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(85,44,105,0.48)",
  },
  separator: { height: 9 },
  empty: { minHeight: 170, alignItems: "center", justifyContent: "center" },
  emptyText: { marginTop: 10, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10, textAlign: "center" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.992 }] },
});
