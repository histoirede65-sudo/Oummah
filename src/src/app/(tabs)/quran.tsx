import type { Href } from "expo-router";
import { router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LastReadingCard from "../../components/quran/LastReadingCard";
import CalendarSeasonalPrompt from "../../components/CalendarSeasonalPrompt";
import QuranHeader from "../../components/quran/QuranHeader";
import QuranQuickActions, {
  type QuranTab,
} from "../../components/quran/QuranQuickActions";
import QuranSearchBar from "../../components/quran/QuranSearchBar";
import QuranReciterSelector from "../../components/quran/QuranReciterSelector";
import JuzList from "../../components/quran/JuzList";
import SurahList from "../../components/quran/SurahList";
import { SURAHS } from "../../data/surahs";
import { JUZ } from "../../data/juz";
import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { offlineRepository, type ReadingPosition } from "../../core/offline";

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
  const [favoriteSurahIds, setFavoriteSurahIds] = useState<Set<number>>(
    new Set(),
  );
  const [bookmarkSurahIds, setBookmarkSurahIds] = useState<Set<number>>(
    new Set(),
  );
  const [bookmarkVerseBySurah, setBookmarkVerseBySurah] = useState<
    Map<number, number>
  >(new Map());
  const handleBackPress = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/" as Href);
  };

  const toggleFavoritesFilter = () => {
    changeTab(activeTab === "favorites" ? "surahs" : "favorites");
  };

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        offlineRepository.getLastReading(),
        offlineRepository.getFavorites(),
        offlineRepository.getBookmarks(),
      ]).then(([position, favorites, bookmarks]) => {
        if (!active) return;
        setLastReading(position);
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
        `${surah.frenchName} ${surah.transliteration} ${surah.arabicName}`,
        language,
      ).includes(search),
    );
  }, [activeTab, bookmarkSurahIds, favoriteSurahIds, language, query]);

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
        `${surah?.frenchName ?? ""} ${surah?.transliteration ?? ""} ${surah?.arabicName ?? ""}`,
        language,
      ).includes(search);
    });
  }, [language, query]);

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
      ? "Aucun Juz ne correspond à cette recherche."
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
        surahName={lastReadingSurah?.frenchName}
        page={lastReading?.page}
        verse={lastReading?.verseNumber}
        progress={
          lastReading
            ? Math.round(
                (lastReading.verseNumber / (lastReadingSurah?.verses || 1)) *
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
      <CalendarSeasonalPrompt context="quran" />
      <View style={styles.searchGap}>
        <QuranSearchBar value={query} onChangeText={setQuery} />
      </View>
      <QuranQuickActions
        activeTab={activeTab}
        onTabChange={changeTab}
        onBookmarkPress={() => changeTab("bookmarks")}
        onAudioPress={() => router.push("/listen/reciters" as Href)}
        onHifzPress={() => router.push("/hifz" as Href)}
      />
      <QuranReciterSelector />
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
      <QuranHeader
        onBackPress={handleBackPress}
        favoritesActive={activeTab === "favorites"}
        onFavoritePress={toggleFavoritesFilter}
      />
      {activeTab === "juz" ? (
        <JuzList
          data={filteredJuz}
          header={header}
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
