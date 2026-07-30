import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Reanimated, { Easing, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { useGlobalAudioPlayer } from "../../context/AudioPlayerProvider";
import { useReciter } from "../../context/ReciterProvider";
import { SURAHS } from "../../data/surahs";
import type { CatalogReciter } from "../../features/audio/domain/audio";
import {
  ListeningHeader,
  SearchBar,
  SectionHeader,
  listeningStyles,
} from "../../features/audio/presentation/ListeningComponents";
import ReciterGalleryCard from "../../features/audio/presentation/ReciterGalleryCard";
import { preloadReciterPortraits } from "../../features/audio/presentation/audioPreload";
import { useRecitersViewModel } from "../../features/audio/presentation/viewmodels/useRecitersViewModel";
import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export default function RecitersCatalogScreen() {
  const { t } = useI18n();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const model = useRecitersViewModel();
  const audio = useGlobalAudioPlayer();
  const { setCurrentReciter } = useReciter();
  const [filter, setFilter] = useState<
    "all" | "favorites" | "murattal" | "mujawwad"
  >("all");

  useEffect(() => {
    preloadReciterPortraits(model.reciters, 12);
    preloadReciterPortraits(model.favoriteReciters, 12);
  }, [model.favoriteReciters, model.reciters]);

  const resumeReciter = useMemo(() => {
    const reciterId = audio.listeningResume?.reciterId;
    return model.reciters.find((reciter) => reciter.id === reciterId) ?? null;
  }, [audio.listeningResume?.reciterId, model.reciters]);

  const resumeSurah = useMemo(() => {
    const surahId = audio.listeningResume?.surahId;
    return SURAHS.find((surah) => surah.id === surahId) ?? null;
  }, [audio.listeningResume?.surahId]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace((returnTo || "/listen/reciters") as Href);
  }, [returnTo]);

  const handleOpenReciter = useCallback(
    async (reciter: CatalogReciter) => {
      await setCurrentReciter(reciter);
      router.push({
        pathname: "/listen/reciter/[reciterId]",
        params: {
          reciterId: reciter.id,
          returnTo: "/listen/reciters",
        },
      });
    },
    [setCurrentReciter],
  );

  const handleResumeListening = useCallback(async () => {
    try {
      const session = await audio.resumeListening();

      if (session) {
        router.push(
          `/listen/${session.surahId}?reciterId=${session.reciterId}&returnTo=${encodeURIComponent("/listen/reciters")}&autoplay=1` as Href,
        );
      }
    } catch {
      // Keep the audio home calm if a persisted session is stale.
    }
  }, [audio]);

  const handleToggleFavorite = useCallback(
    async (reciter: CatalogReciter) => {
      try {
        await model.toggleFavoriteReciter(reciter.id);
      } catch {
        // Storage failures should not surface as a redbox from a quick tap.
      }
    },
    [model],
  );

  const handleQuickPlay = useCallback(
    async (reciter: CatalogReciter) => {
      await setCurrentReciter(reciter);
      router.push(
        `/listen/1?reciterId=${reciter.id}&returnTo=${encodeURIComponent("/listen/reciters")}&autoplay=1` as Href,
      );
    },
    [setCurrentReciter],
  );

  const visibleReciters = useMemo(() => {
    if (filter === "favorites") {
      return model.reciters.filter((reciter) =>
        model.isFavoriteReciter(reciter.id),
      );
    }
    if (filter === "murattal" || filter === "mujawwad") {
      return model.reciters.filter((reciter) => reciter.style === filter);
    }
    return model.reciters;
  }, [filter, model]);

  const resumeProgress =
    audio.listeningResume && audio.listeningResume.durationSeconds > 0
      ? audio.listeningResume.positionSeconds /
        audio.listeningResume.durationSeconds
      : audio.progress;
  const resumeRemainingSeconds = audio.listeningResume
    ? Math.max(
        0,
        audio.listeningResume.durationSeconds -
          audio.listeningResume.positionSeconds,
      )
    : Math.max(0, audio.duration - audio.currentTime);

  const continueTitle =
    resumeSurah?.frenchName ??
    audio.track?.title ??
    t("recitations.continueListening");

  const continueReciterName =
    resumeReciter?.name ??
    audio.listeningResume?.reciterName ??
    audio.track?.creator.name;

  const renderReciterItem = useCallback(
    ({ item, index }: { item: CatalogReciter; index: number }) => (
      <Reanimated.View
        entering={FadeInDown.duration(360)
          .delay(Math.min(index, 14) * 22)
          .easing(Easing.out(Easing.cubic))
          .withInitialValues({
            opacity: 0,
            transform: [{ translateY: 10 }],
          })}
        style={styles.cardSlot}
      >
        <ReciterGalleryCard
          reciter={item}
          selected={model.isFavoriteReciter(item.id)}
          onPress={() => {
            void handleOpenReciter(item);
          }}
          onSelect={() => {
            void handleToggleFavorite(item);
          }}
          onPlay={() => {
            void handleQuickPlay(item);
          }}
        />
      </Reanimated.View>
    ),
    [handleOpenReciter, handleQuickPlay, handleToggleFavorite, model],
  );

  const renderSectionReciters = useCallback(
    (reciters: readonly CatalogReciter[]) => {
      if (reciters.length === 0) return null;

      return (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalList}
        >
          {reciters.map((reciter, index) => (
            <Reanimated.View
              key={reciter.id}
              entering={FadeInDown.duration(300)
                .delay(index * 35)
                .easing(Easing.out(Easing.quad))}
              style={styles.horizontalCard}
            >
              <FavoriteReciterCard
                reciter={reciter}
                onPress={() => {
                  void handleOpenReciter(reciter);
                }}
                onPlay={() => {
                  void handleQuickPlay(reciter);
                }}
              />
            </Reanimated.View>
          ))}
        </ScrollView>
      );
    },
    [handleOpenReciter, handleQuickPlay],
  );

  return (
    <SafeAreaView edges={["top"]} style={listeningStyles.safeArea}>
      <FlatList
        style={styles.list}
        data={visibleReciters}
        keyExtractor={(item) => item.id}
        renderItem={renderReciterItem}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={[
          styles.listContent,
          visibleReciters.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <ListeningHeader
              title="Audio"
              subtitle={t("recitations.recitersSubtitle")}
              onBack={goBack}
            />

            <AudioStats
              reciterCount={model.totalReciters}
              favoriteCount={model.favoriteReciters.length}
            />

            {audio.listeningResume && continueReciterName ? (
              <Reanimated.View
                entering={FadeInDown.duration(420).easing(
                  Easing.out(Easing.cubic),
                )}
              >
                <PremiumContinueCard
                  image={resumeReciter?.image}
                  surahName={continueTitle}
                  reciterName={continueReciterName}
                  progress={resumeProgress}
                  remainingSeconds={resumeRemainingSeconds}
                  onPress={() => {
                    void handleResumeListening();
                  }}
                />
              </Reanimated.View>
            ) : null}

            <View style={styles.searchBlock}>
              <SearchBar
                value={model.search}
                onChangeText={model.setSearch}
                placeholder={t("recitations.searchReciter")}
              />
              <FilterChips
                value={filter}
                favoriteCount={model.favoriteReciters.length}
                onChange={setFilter}
              />
            </View>

            {model.favoriteReciters.length > 0 && filter !== "favorites" ? (
              <View style={styles.sectionBlock}>
                <SectionHeader title="Mes favoris" />
                {renderSectionReciters(model.favoriteReciters)}
              </View>
            ) : null}

            <View style={styles.sectionBlock}>
              <SectionHeader
                title={filter === "all" ? "Tous les récitateurs" : "Résultats"}
                actionLabel={`${visibleReciters.length} voix`}
              />
            </View>

            {model.loading && visibleReciters.length === 0 ? (
              <Text style={listeningStyles.loading}>{t("common.loading")}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !model.loading ? (
            <View style={listeningStyles.empty}>
              <Text style={listeningStyles.emptyText}>
                {t("recitations.noReciterFound")}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function AudioStats({
  reciterCount,
  favoriteCount,
}: {
  reciterCount: number;
  favoriteCount: number;
}) {
  return (
    <View style={styles.stats}>
      <StatChip icon="mic-outline" label={`${reciterCount} voix`} />
      <StatChip icon="book-outline" label="114 sourates" />
      <StatChip icon="star-outline" label={`${favoriteCount} favoris`} />
    </View>
  );
}

function StatChip({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={12} color={colors.goldMuted} />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

function FilterChips({
  value,
  favoriteCount,
  onChange,
}: {
  value: "all" | "favorites" | "murattal" | "mujawwad";
  favoriteCount: number;
  onChange: (value: "all" | "favorites" | "murattal" | "mujawwad") => void;
}) {
  const filters = [
    { id: "all" as const, label: "Tous" },
    { id: "favorites" as const, label: `Favoris ${favoriteCount}` },
    { id: "murattal" as const, label: "Murattal" },
    { id: "mujawwad" as const, label: "Mujawwad" },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filters}
    >
      {filters.map((item) => {
        const active = value === item.id;
        return (
          <Pressable
            key={item.id}
            onPress={() => onChange(item.id)}
            style={[styles.filterChip, active && styles.filterChipActive]}
          >
            <Text
              style={[styles.filterText, active && styles.filterTextActive]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function FavoriteReciterCard({
  reciter,
  onPress,
  onPlay,
}: {
  reciter: CatalogReciter;
  onPress: () => void;
  onPlay: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.favoriteCard, pressed && styles.pressed]}
    >
      {reciter.image ? (
        <Image
          source={reciter.image}
          contentFit="cover"
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <LinearGradient
        colors={["transparent", "rgba(7,5,16,0.96)"]}
        style={StyleSheet.absoluteFill}
      />
      <Text numberOfLines={2} style={styles.favoriteName}>
        {reciter.name}
      </Text>
      <Pressable
        onPress={(event) => {
          event.stopPropagation();
          onPlay();
        }}
        style={styles.favoritePlay}
      >
        <Ionicons name="play" size={13} color={colors.background} />
      </Pressable>
    </Pressable>
  );
}

function PremiumContinueCard({
  image,
  surahName,
  reciterName,
  progress,
  remainingSeconds,
  onPress,
}: {
  image?: CatalogReciter["image"];
  surahName: string;
  reciterName: string;
  progress: number;
  remainingSeconds: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.continueCard, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[
          colors.surfaceAlt,
          colors.purpleMid,
          colors.backgroundSecondary,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.continueGradient}
      >
        <View style={styles.continueArtwork}>
          {image ? (
            <Image
              source={image}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              transition={180}
              style={styles.continueImage}
            />
          ) : (
            <Ionicons name="headset" size={34} color={colors.goldMuted} />
          )}
        </View>

        <View style={styles.continueCopy}>
          <Text style={styles.continueEyebrow}>{"Continuer l'écoute"}</Text>
          <Text numberOfLines={1} style={styles.continueSurah}>
            {surahName}
          </Text>
          <Text numberOfLines={1} style={styles.continueReciter}>
            {reciterName}
          </Text>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` },
              ]}
            />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressText}>
              {Math.round(Math.min(Math.max(progress, 0), 1) * 100)}%
            </Text>
            <Text style={styles.progressText}>
              {formatRemainingTime(remainingSeconds)} restant
            </Text>
          </View>
        </View>

        <View style={styles.continuePlay}>
          <Ionicons name="play" size={18} color={colors.background} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function formatRemainingTime(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },

  headerContent: {
    paddingHorizontal: 0,
    paddingBottom: 4,
  },

  sectionBlock: {
    marginTop: 0,
  },

  horizontalList: {
    paddingRight: 16,
    gap: 10,
  },

  horizontalCard: {
    width: 154,
  },

  listContent: {
    paddingBottom: 108,
    paddingHorizontal: 16,
  },

  emptyListContent: {
    flexGrow: 1,
  },

  column: {
    gap: 8,
  },

  cardSlot: {
    flex: 1,
    minWidth: 0,
    marginBottom: 9,
  },

  continueCard: {
    marginTop: 10,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 5,
  },

  continueGradient: {
    minHeight: 132,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },

  continueArtwork: {
    width: 84,
    height: 102,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.purpleDeep,
  },

  continueImage: {
    width: "100%",
    height: "100%",
  },

  continueCopy: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 14,
  },

  continueEyebrow: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },

  continueSurah: {
    marginTop: 7,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 22,
  },

  continueReciter: {
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
  },

  progressTrack: {
    height: 5,
    marginTop: 14,
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: "rgba(248,244,238,0.14)",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.goldMuted,
  },

  progressMeta: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  progressText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
    fontVariant: ["tabular-nums"],
  },

  continuePlay: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.goldLight,
  },

  pressed: {
    opacity: 0.68,
  },

  stats: {
    marginTop: -2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statChip: {
    height: 27,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(126,78,151,0.38)",
    backgroundColor: "rgba(35,20,51,0.66)",
  },
  statText: {
    marginLeft: 5,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 8.5,
    fontWeight: "700",
  },
  searchBlock: {
    marginTop: 15,
  },
  filters: {
    paddingTop: 9,
    paddingRight: 12,
    gap: 7,
  },
  filterChip: {
    height: 31,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(25,15,37,0.82)",
  },
  filterChipActive: {
    borderColor: "rgba(227,181,90,0.54)",
    backgroundColor: "rgba(104,55,124,0.48)",
  },
  filterText: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "700",
  },
  filterTextActive: {
    color: colors.goldLight,
  },
  favoriteCard: {
    height: 106,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 10,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.32)",
    backgroundColor: colors.surface,
  },
  favoriteName: {
    maxWidth: 112,
    paddingRight: 18,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 13.5,
    lineHeight: 16,
  },
  favoritePlay: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 27,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.goldLight,
  },
});
