import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LastReadingCard from "../../components/quran/LastReadingCard";
import { mushafBookmarkStore, type MushafBookmark } from "../../features/quran/mushaf/MushafBookmark";
import CalendarSeasonalPrompt from "../../components/CalendarSeasonalPrompt";
import QuranHeader from "../../components/quran/QuranHeader";
import QuranQuickActions, {
  type QuranTab,
} from "../../components/quran/QuranQuickActions";
import QuranSearchBar from "../../components/quran/QuranSearchBar";
import JuzList from "../../components/quran/JuzList";
import SurahList from "../../components/quran/SurahList";
import { SURAHS } from "../../data/surahs";
import { JUZ } from "../../data/juz";
import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { offlineRepository, type ReadingPosition } from "../../core/offline";
import { readingQuranRepository } from "../../features/quran/ReadingQuranRepository";

function normalize(value: string, locale: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase(locale);
}

export default function QuranScreen() {
  const { language, t } = useI18n();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<QuranTab>("surahs");
  const [lastReading, setLastReading] = useState<ReadingPosition | null>(null);
  const [mushafBookmark, setMushafBookmark] = useState<MushafBookmark | null>(null);
  const [favoriteSurahIds, setFavoriteSurahIds] = useState<Set<number>>(
    new Set(),
  );
  const [bookmarkSurahIds, setBookmarkSurahIds] = useState<Set<number>>(
    new Set(),
  );
  const [bookmarkVerseBySurah, setBookmarkVerseBySurah] = useState<
    Map<number, number>
  >(new Map());
  const [englishSurahNames, setEnglishSurahNames] = useState<
    ReadonlyMap<number, string>
  >(new Map());

  useEffect(() => {
    let active = true;
    if (language !== "en") {
      setEnglishSurahNames(new Map());
      return () => {
        active = false;
      };
    }

    void readingQuranRepository
      .getEnglishSurahNames()
      .then((names) => {
        if (!active) return;
        setEnglishSurahNames(names);
      })
      .catch(() => {
        if (active) setEnglishSurahNames(new Map());
      });

    return () => {
      active = false;
    };
  }, [language]);

  const getSurahDisplayName = useCallback(
    (surah: (typeof SURAHS)[number]) =>
      language === "en"
        ? englishSurahNames.get(surah.id) || surah.transliteration
        : surah.frenchName,
    [englishSurahNames, language],
  );
  const handleBackPress = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/" as Href);
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        offlineRepository.getLastReading(),
        offlineRepository.getFavorites(),
        offlineRepository.getBookmarks(),
        mushafBookmarkStore.load(),
      ]).then(([position, favorites, bookmarks, pageBookmark]) => {
        if (!active) return;
        setLastReading(position);
        setMushafBookmark(pageBookmark);
        setFavoriteSurahIds(
          new Set(
            favorites
              .filter((item) => item.type === "surah")
              .map((item) => Number(item.targetId)),
          ),
        );
        setBookmarkSurahIds(
          new Set(
            bookmarks
              .map((item) => Number(item.verseKey.split(":")[0]))
              .filter((id) => Number.isInteger(id) && id >= 1 && id <= 114),
          ),
        );
        const bookmarkedVerses = new Map<number, number>();
        bookmarks.forEach((item) => {
          const [surahId, verseNumber] = item.verseKey.split(":").map(Number);
          if (!bookmarkedVerses.has(surahId) && Number.isInteger(verseNumber)) {
            bookmarkedVerses.set(surahId, verseNumber);
          }
        });
        setBookmarkVerseBySurah(bookmarkedVerses);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const filteredSurahs = useMemo(() => {
    const search = normalize(query.trim(), language);
    const base =
      activeTab === "favorites"
        ? SURAHS.filter((surah) => favoriteSurahIds.has(surah.id))
        : activeTab === "bookmarks"
          ? SURAHS.filter((surah) => bookmarkSurahIds.has(surah.id))
          : SURAHS;
    if (!search) return base;

    const numeric = Number(
      search.replace(/^(sourate|juz|page|verset)\s*/i, ""),
    );
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 114) {
      return base.filter((surah) => surah.id === numeric);
    }

    return base.filter((surah) =>
      normalize(
        `${getSurahDisplayName(surah)} ${surah.frenchName} ${surah.transliteration} ${surah.arabicName}`,
        language,
      ).includes(search),
    );
  }, [activeTab, bookmarkSurahIds, favoriteSurahIds, getSurahDisplayName, language, query]);

  const filteredJuz = useMemo(() => {
    const search = normalize(query.trim(), language);
    if (!search) return JUZ;
    const numeric = Number(search.replace(/^(juz|partie)\s*/i, ""));
    if (Number.isInteger(numeric))
      return JUZ.filter((juz) => juz.id === numeric);
    return JUZ.filter((juz) => {
      const surah = SURAHS.find(
        (candidate) => candidate.id === juz.startSurahId,
      );
      return normalize(
        `${surah ? getSurahDisplayName(surah) : ""} ${surah?.frenchName ?? ""} ${surah?.transliteration ?? ""} ${surah?.arabicName ?? ""}`,
        language,
      ).includes(search);
    });
  }, [getSurahDisplayName, language, query]);

  const changeTab = (tab: QuranTab) => {
    setActiveTab(tab);
    if (tab !== "surahs") setQuery("");
  };

  const toggleFavorite = async (surahId: number) => {
    const wasFavorite = favoriteSurahIds.has(surahId);
    setFavoriteSurahIds((current) => {
      const next = new Set(current);
      if (wasFavorite) next.delete(surahId);
      else next.add(surahId);
      return next;
    });

    try {
      const favorites = await offlineRepository.getFavorites();
      const otherFavorites = favorites.filter(
        (item) =>
          !(item.type === "surah" && Number(item.targetId) === surahId),
      );
      const nextFavorites = wasFavorite
        ? otherFavorites
        : [
            ...otherFavorites,
            {
              id: `surah:${surahId}`,
              type: "surah" as const,
              targetId: String(surahId),
              createdAt: new Date().toISOString(),
            },
          ];
      await offlineRepository.saveFavorites(nextFavorites);
    } catch {
      setFavoriteSurahIds((current) => {
        const next = new Set(current);
        if (wasFavorite) next.add(surahId);
        else next.delete(surahId);
        return next;
      });
    }
  };

  const emptyMessage =
    activeTab === "juz"
      ? t("quran.juzSearchEmpty")
      : activeTab === "favorites"
        ? t("quran.favoritesEmpty")
        : activeTab === "bookmarks"
          ? t("quran.bookmarksEmpty")
          : t("quran.empty");

  const lastReadingSurah = lastReading
    ? SURAHS.find((surah) => surah.id === lastReading.surahId)
    : undefined;

  const header = (
    <>
      <LastReadingCard
        surahName={lastReadingSurah ? getSurahDisplayName(lastReadingSurah) : undefined}
        page={lastReading?.page}
        verse={lastReading?.verseNumber}
        progress={
          lastReading
            ? Math.round(
                (Math.max(0, lastReading.verseNumber - 1) / (lastReadingSurah?.verses || 1)) *
                  100,
              )
            : 0
        }
        onResume={() =>
          router.push(
            `/surah/${lastReading?.surahId ?? 1}?verse=${lastReading?.verseNumber ?? 1}` as Href,
          )
        }
      />
      {mushafBookmark ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/surah/${mushafBookmark.surahId}?mushafPage=${mushafBookmark.page}` as Href)}
          style={({ pressed }) => [styles.pageBookmark, pressed && styles.pageBookmarkPressed]}
        >
          <View style={styles.pageBookmarkRibbon}>
            <Ionicons name="bookmark" size={18} color="#F4E3B5" />
          </View>
          <View style={styles.pageBookmarkCopy}>
            <Text style={styles.pageBookmarkTitle}>{t("quran.mushafBookmark")}</Text>
            <Text style={styles.pageBookmarkMeta}>
              {t("quran.mushafBookmarkMeta", {
                page: mushafBookmark.page,
                surah: (() => {
                  const target = SURAHS.find((item) => item.id === mushafBookmark.surahId);
                  return target ? getSurahDisplayName(target) : "";
                })(),
              })}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.goldLight} />
        </Pressable>
      ) : null}
      <CalendarSeasonalPrompt context="quran" />
      <View style={styles.searchGap}>
        <QuranSearchBar value={query} onChangeText={setQuery} />
      </View>
      <QuranQuickActions activeTab={activeTab} onTabChange={changeTab} />
      <View style={styles.listHeading}>
        <Text style={styles.listTitle}>
          {activeTab === "surahs"
            ? t("quran.allSurahs")
            : activeTab === "juz"
              ? t("quran.juz")
              : activeTab === "bookmarks"
                ? t("common.bookmarks")
                : t("common.favorites")}
        </Text>
        <View style={styles.countPill}>
          <Text style={styles.count}>
            {activeTab === "surahs"
              ? `${filteredSurahs.length} / 114`
              : activeTab === "juz"
                ? `${filteredJuz.length} / 30`
                : filteredSurahs.length}
          </Text>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <QuranHeader onBackPress={handleBackPress} />
      {activeTab === "juz" ? (
        <JuzList
          data={filteredJuz}
          header={header}
          getSurahDisplayName={getSurahDisplayName}
          onJuzPress={(juz) =>
            router.push(
              `/surah/${juz.startSurahId}?verse=${juz.startVerse}` as Href,
            )
          }
        />
      ) : (
        <SurahList
          data={filteredSurahs}
          header={header}
          getSurahDisplayName={getSurahDisplayName}
          emptyMessage={emptyMessage}
          favoriteSurahIds={favoriteSurahIds}
          onToggleFavorite={(surahId) => void toggleFavorite(surahId)}
          onSurahPress={(surah) => {
            const bookmarkedVerse = bookmarkVerseBySurah.get(surah.id);
            router.push(
              (activeTab === "bookmarks" && bookmarkedVerse
                ? `/surah/${surah.id}?verse=${bookmarkedVerse}`
                : `/surah/${surah.id}`) as Href,
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  searchGap: { marginTop: 11 },
  pageBookmark: { marginTop: 10, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderRadius: 18, borderWidth: 1, borderColor: "rgba(227,181,90,0.35)", backgroundColor: "rgba(227,181,90,0.06)" },
  pageBookmarkPressed: { opacity: 0.75 },
  pageBookmarkRibbon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#A3271C" },
  pageBookmarkCopy: { flex: 1 },
  pageBookmarkTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 15.5, fontWeight: "800" },
  pageBookmarkMeta: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13 },
  listHeading: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listTitle: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 23,
  },
  countPill: {
    minWidth: 49,
    height: 26,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  count: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "700",
  },
});
