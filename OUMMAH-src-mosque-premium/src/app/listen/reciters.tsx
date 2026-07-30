import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Reanimated, {
  Easing,
  FadeInDown,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useGlobalAudioPlayer } from '../../context/AudioPlayerProvider';
import { useReciter } from '../../context/ReciterProvider';
import { SURAHS } from '../../data/surahs';
import type { CatalogReciter } from '../../features/audio/domain/audio';
import {
  ListeningHeader,
  ReciterCard,
  SearchBar,
  SectionHeader,
  listeningStyles,
} from '../../features/audio/presentation/ListeningComponents';
import ReciterGalleryCard from '../../features/audio/presentation/ReciterGalleryCard';
import { preloadReciterPortraits } from '../../features/audio/presentation/audioPreload';
import { useRecitersViewModel } from '../../features/audio/presentation/viewmodels/useRecitersViewModel';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function RecitersCatalogScreen() {
  const { t } = useI18n();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const model = useRecitersViewModel();
  const audio = useGlobalAudioPlayer();
  const { setCurrentReciter } = useReciter();

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

    router.replace((returnTo || '/listen/reciters') as Href);
  }, [returnTo]);

  const handleOpenReciter = useCallback(
    async (reciter: CatalogReciter) => {
      await setCurrentReciter(reciter);
      router.push({
        pathname: '/listen/reciter/[reciterId]',
        params: {
          reciterId: reciter.id,
          returnTo: '/listen/reciters',
        },
      });
    },
    [setCurrentReciter],
  );

  const handleResumeListening = useCallback(async () => {
    try {
      const session = await audio.resumeListening();

      if (session) {
        router.push(`/listen/${session.surahId}?reciterId=${session.reciterId}&returnTo=${encodeURIComponent('/listen/reciters')}&autoplay=1` as Href);
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

  const resumeProgress = audio.listeningResume && audio.listeningResume.durationSeconds > 0
    ? audio.listeningResume.positionSeconds / audio.listeningResume.durationSeconds
    : audio.progress;

  const continueTitle =
    resumeSurah?.frenchName ??
    audio.track?.title ??
    t('recitations.continueListening');

  const continueReciterName =
    resumeReciter?.name ??
    audio.listeningResume?.reciterName ??
    audio.track?.creator.name;

  const renderReciterItem = useCallback(
    ({ item, index }: { item: CatalogReciter; index: number }) => (
      <Reanimated.View
        entering={FadeInDown
          .duration(360)
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
        />
      </Reanimated.View>
    ),
    [handleOpenReciter, handleToggleFavorite, model],
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
              entering={FadeInDown
                .duration(300)
                .delay(index * 35)
                .easing(Easing.out(Easing.quad))}
              style={styles.horizontalCard}
            >
              <ReciterCard
                reciter={reciter}
                onPress={() => {
                  void handleOpenReciter(reciter);
                }}
              />
            </Reanimated.View>
          ))}
        </ScrollView>
      );
    },
    [handleOpenReciter],
  );

  return (
    <SafeAreaView edges={['top']} style={listeningStyles.safeArea}>
      <FlatList
        style={styles.list}
        data={model.reciters}
        keyExtractor={(item) => item.id}
        renderItem={renderReciterItem}
        numColumns={2}
        columnWrapperStyle={styles.column}
        contentContainerStyle={[
          styles.listContent,
          model.reciters.length === 0 && styles.emptyListContent,
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
              subtitle={t('recitations.recitersSubtitle')}
              onBack={goBack}
            />

            <Reanimated.View entering={FadeInDown.duration(320).easing(Easing.out(Easing.cubic))}>
              <AudioOverview
                reciterCount={model.totalReciters}
                favoriteCount={model.favoriteReciters.length}
              />
            </Reanimated.View>

            {audio.listeningResume && continueReciterName ? (
              <Reanimated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}>
                <PremiumContinueCard
                  image={resumeReciter?.image}
                  surahName={continueTitle}
                  reciterName={continueReciterName}
                  progress={resumeProgress}
                  onPress={() => {
                    void handleResumeListening();
                  }}
                />
              </Reanimated.View>
            ) : null}

            {model.favoriteReciters.length > 0 ? (
              <View style={styles.sectionBlock}>
                <SectionHeader title="Mes récitateurs favoris" />
                {renderSectionReciters(model.favoriteReciters)}
              </View>
            ) : null}

            <View style={styles.sectionBlock}>
              <SectionHeader title="Recherche" />
              <SearchBar
                value={model.search}
                onChangeText={model.setSearch}
                placeholder={t('recitations.searchReciter')}
              />
            </View>

            <View style={styles.sectionBlock}>
              <SectionHeader title="Tous les récitateurs" />
            </View>

            {model.loading && model.reciters.length === 0 ? (
              <Text style={listeningStyles.loading}>
                {t('common.loading')}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !model.loading ? (
            <View style={listeningStyles.empty}>
              <Text style={listeningStyles.emptyText}>
                {t('recitations.noReciterFound')}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function AudioOverview({
  reciterCount,
  favoriteCount,
}: {
  reciterCount: number;
  favoriteCount: number;
}) {
  return (
    <LinearGradient
      colors={['rgba(200,148,58,0.18)', colors.surfaceAlt, colors.purpleDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.overview}
    >
      <View style={styles.overviewIcon}>
        <Ionicons name="headset" size={21} color={colors.goldMuted} />
      </View>

      <View style={styles.overviewCopy}>
        <Text style={styles.overviewTitle}>Studio audio</Text>
        <Text style={styles.overviewMeta}>
          {reciterCount} voix · 114 sourates · {favoriteCount} favoris
        </Text>
      </View>
    </LinearGradient>
  );
}

function PremiumContinueCard({
  image,
  surahName,
  reciterName,
  progress,
  onPress,
}: {
  image?: CatalogReciter['image'];
  surahName: string;
  reciterName: string;
  progress: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.continueCard,
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={[colors.surfaceAlt, colors.purpleMid, colors.backgroundSecondary]}
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
            <View style={[styles.progressFill, { width: `${Math.min(Math.max(progress, 0), 1) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.continuePlay}>
          <Ionicons name="play" size={18} color={colors.background} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },

  headerContent: {
    paddingHorizontal: 16,
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
    width: 126,
  },

  listContent: {
    paddingBottom: 24,
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
    marginBottom: 12,
  },

  continueCard: {
    marginTop: 10,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 5,
  },

  continueGradient: {
    minHeight: 132,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },

  continueArtwork: {
    width: 84,
    height: 102,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.purpleDeep,
  },

  continueImage: {
    width: '100%',
    height: '100%',
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
    fontWeight: '700',
    textTransform: 'uppercase',
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
    overflow: 'hidden',
    borderRadius: 3,
    backgroundColor: 'rgba(248,244,238,0.14)',
  },

  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.goldMuted,
  },

  continuePlay: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: colors.goldLight,
  },

  pressed: {
    opacity: 0.68,
  },

  overview: {
    minHeight: 74,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
  },

  overviewIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.purpleDeep,
  },

  overviewCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },

  overviewTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 19,
  },

  overviewMeta: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: '600',
  },
});
