import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Reanimated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReciter } from '../../../context/ReciterProvider';
import { useGlobalAudioPlayer } from '../../../context/AudioPlayerProvider';
import { audioDependencies } from '../../../features/audio/audioDependencies';
import { SURAHS } from '../../../data/surahs';
import {
  SearchBar,
  ReciterAvatar,
  SurahAudioRow,
  listeningStyles,
} from '../../../features/audio/presentation/ListeningComponents';
import { preloadReciterPortraits } from '../../../features/audio/presentation/audioPreload';
import { useOfflineDownloads } from '../../../features/audio/presentation/useOfflineDownloads';
import { useSurahCatalogViewModel } from '../../../features/audio/presentation/viewmodels/useSurahCatalogViewModel';
import type { SurahCatalogItem } from '../../../features/audio/domain/audio';
import { readingQuranRepository } from '../../../features/quran/ReadingQuranRepository';
import { useI18n } from '../../../i18n';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export default function ReciterDetailScreen() {
  const { language, t } = useI18n();
  const audio = useGlobalAudioPlayer();
  const [search, setSearch] = useState('');
  const [storageExpanded, setStorageExpanded] = useState(false);
  const { reciterId: routeReciterId, returnTo } = useLocalSearchParams<{ reciterId?: string; returnTo?: string }>();
  const { currentReciter, reciters } = useReciter();
  const reciterId = routeReciterId ?? currentReciter?.id;
  const reciter = reciters.find((item) => item.id === reciterId);
  const { items, refresh } = useSurahCatalogViewModel(reciterId);
  const offline = useOfflineDownloads();
  const [favoriteIds, setFavoriteIds] = useState<readonly string[]>([]);
  const [englishSurahNames, setEnglishSurahNames] = useState<
    ReadonlyMap<number, string>
  >(new Map());
  const isFavorite = reciter ? favoriteIds.includes(reciter.id) : false;

  const displayedItems = useMemo<readonly SurahCatalogItem[]>(() => {
    if (items.length > 0) return items;
    return SURAHS.map((surah) => ({
      surah,
      track: {
        id: `${reciterId ?? 'pending'}:${surah.id}`,
        contentType: 'quran',
        contentId: String(surah.id),
        title: surah.transliteration,
        creator: reciter ?? {
          id: reciterId ?? 'pending',
          name: '',
          style: 'murattal',
          language: 'ar',
          country: '',
          audioSource: 'quranfoundation',
        },
        source: { uri: '' },
        surahId: surah.id,
        reciter: reciter ?? undefined,
        quran: reciter ? { surahId: surah.id, reciter } : undefined,
      },
      isFavorite: false,
      isDownloaded: false,
    }));
  }, [items, reciter, reciterId]);

  useEffect(() => {
    let active = true;
    preloadReciterPortraits(reciters, 10);
    void audioDependencies.reciterFavorites
      .list()
      .then((ids) => {
        if (active) setFavoriteIds(ids);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [reciters]);

  useEffect(() => {
    let active = true;
    if (language !== 'en') {
      setEnglishSurahNames(new Map());
      return () => {
        active = false;
      };
    }
    void readingQuranRepository
      .getEnglishSurahNames()
      .then((names) => {
        if (active) setEnglishSurahNames(names);
      })
      .catch(() => {
        if (active) setEnglishSurahNames(new Map());
      });
    return () => {
      active = false;
    };
  }, [language]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace((returnTo || '/listen/reciters') as Href);
  }, [returnTo]);

  const changeReciter = useCallback(() => {
    if (!reciterId) return;
    router.push(`/listen/reciters?returnTo=${encodeURIComponent(`/listen/reciter/${reciterId}`)}` as Href);
  }, [reciterId]);

  const openSurah = useCallback(
    (surahId: number) => {
      if (!reciterId) return;
      router.push(`/listen/${surahId}?reciterId=${reciterId}&autoplay=1&returnTo=${encodeURIComponent(`/listen/reciter/${reciterId}`)}` as Href);
    },
    [reciterId],
  );

  const toggleFavorite = useCallback(async () => {
    if (!reciter) return;
    try {
      const selected = await audioDependencies.reciterFavorites.toggle(reciter.id);
      setFavoriteIds((ids) => (
        selected
          ? ids.includes(reciter.id) ? ids : [...ids, reciter.id]
          : ids.filter((id) => id !== reciter.id)
      ));
    } catch {
      // Keep the current visual state if storage is unavailable.
    }
  }, [reciter]);

  const downloadTrack = useCallback(async (trackId: string) => {
    const item = items.find((candidate) => candidate.track.id === trackId);
    if (!item) return;
    const state = offline.downloads.get(trackId)?.state;
    if (state === 'downloading' || state === 'queued') {
      offline.cancel(trackId);
      return;
    }
    if (state === 'downloaded') {
      offline.remove(trackId);
      refresh();
      return;
    }
    const track = item.track.source.uri
      ? item.track
      : await audioDependencies.catalog.getTrack(item.surah.id, reciterId);
    offline.enqueue(track);
    refresh();
  }, [items, offline, reciterId, refresh]);

  const downloadAll = useCallback(async () => {
    const tracks = await Promise.all(items
      .filter((item) => !item.isDownloaded && offline.downloads.get(item.track.id)?.state !== 'downloaded')
      .map((item) => (
        item.track.source.uri
          ? Promise.resolve(item.track)
          : audioDependencies.catalog.getTrack(item.surah.id, reciterId)
      )));
    offline.enqueueMany(tracks);
    refresh();
  }, [items, offline, reciterId, refresh]);

  const removeReciterDownloads = useCallback(() => {
    items.forEach((item) => {
      if (offline.downloads.get(item.track.id)?.state === 'downloaded') {
        offline.remove(item.track.id);
      }
    });
    refresh();
  }, [items, offline, refresh]);

  const playRandom = useCallback(() => {
    if (displayedItems.length === 0) return;
    const item = displayedItems[Math.floor(Math.random() * displayedItems.length)];
    void openSurah(item.surah.id);
  }, [displayedItems, openSurah]);

  const renderSurah = useCallback(
    ({ item, index }: { item: (typeof displayedItems)[number]; index: number }) => (
      <Reanimated.View
        entering={FadeInDown
          .duration(300)
          .delay(Math.min(index, 16) * 18)
          .easing(Easing.out(Easing.quad))}
      >
        <SurahAudioRow
          item={item}
          surahDisplayName={
            language === 'en'
              ? englishSurahNames.get(item.surah.id) || item.surah.transliteration
              : item.surah.frenchName
          }
          onPress={() => {
            void openSurah(item.surah.id);
          }}
          onDownload={() => {
            void downloadTrack(item.track.id);
          }}
          downloadState={offline.downloads.get(item.track.id)?.state}
          downloadProgress={offline.downloads.get(item.track.id)?.progress}
        />
      </Reanimated.View>
    ),
    [downloadTrack, englishSurahNames, language, offline.downloads, openSurah],
  );

  const keyExtractor = useCallback((item: (typeof displayedItems)[number]) => item.track.id, []);
  const filteredItems = useMemo(() => {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const query = normalize(search.trim());
    return displayedItems.filter(({ surah }) => normalize(`${surah.id} ${surah.transliteration} ${surah.arabicName} ${language === 'en' ? englishSurahNames.get(surah.id) ?? '' : surah.frenchName}`).includes(query));
  }, [displayedItems, search, language, englishSurahNames]);
  const canResume = audio.listeningResume?.reciterId === reciterId;

  return (
    <SafeAreaView edges={['top']} style={listeningStyles.safeArea}>
      <FlatList
        data={filteredItems}
        keyboardShouldPersistTaps="handled"
        keyExtractor={keyExtractor}
        renderItem={renderSurah}
        ItemSeparatorComponent={SurahSeparator}
        contentContainerStyle={listeningStyles.content}
        showsVerticalScrollIndicator={false}
        initialNumToRender={14}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={32}
        windowSize={6}
        removeClippedSubviews
        ListHeaderComponent={
          <>
            <View style={styles.pageHeader}>
              <Pressable onPress={goBack} accessibilityLabel={t('common.back')} style={styles.headerBack}>
                <Ionicons name="arrow-back" size={22} color={colors.goldMuted} />
              </Pressable>
              <Text style={styles.pageTitle}>{language === 'en' ? 'Your reciter' : 'Votre récitateur'}</Text>
              <Pressable onPress={changeReciter} accessibilityLabel={t('recitations.changeReciter')} style={styles.changeButton}>
                <Ionicons name="swap-horizontal-outline" size={16} color={colors.goldMuted} />
                <Text style={styles.changeText}>{language === 'en' ? 'Change' : 'Changer'}</Text>
              </Pressable>
            </View>

            {reciter ? (
              <Reanimated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}>
                <LinearGradient
                  colors={[colors.surfaceAlt, colors.purpleMid, colors.backgroundSecondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.hero}
                >
                  <View style={styles.profileRow}>
                  <View style={styles.portraitFrame}>
                    {reciter.image ? (
                      <Image
                        source={reciter.image}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                        transition={180}
                        style={styles.portraitImage}
                      />
                    ) : (
                      <ReciterAvatar reciter={reciter} size={150} />
                    )}
                  </View>

                  <View style={styles.profileCopy}>
                  <Text style={styles.name}>
                    {reciter.name}
                  </Text>
                  <Text style={styles.meta}>
                    {t(`recitations.style.${reciter.style}`)} · {t('recitations.surahCount', { count: reciter.availableSurahs ?? displayedItems.length })}
                  </Text>
                  </View>
                  </View>
                </LinearGradient>

                  <Pressable style={styles.primaryPlay} onPress={() => {
                    if (canResume) {
                      void audio.resumeListening().then((session) => {
                        if (session) router.push(`/listen/${session.surahId}?reciterId=${session.reciterId}&autoplay=1&returnTo=${encodeURIComponent(`/listen/reciter/${reciterId}`)}` as Href);
                      }).catch(() => undefined);
                    } else openSurah(displayedItems[0]?.surah.id ?? 1);
                  }}>
                    <Ionicons name="play" size={20} color={colors.background} />
                    <Text style={styles.primaryPlayText}>{canResume ? t('recitations.continueListening') : (language === 'en' ? 'Listen to Al-Fatiha' : 'Écouter Al-Fatiha')}</Text>
                  </Pressable>

                  <View style={styles.actions}>
                    <ActionButton
                      icon={isFavorite ? 'star' : 'star-outline'}
                      label={t('recitations.favorite')}
                      active={isFavorite}
                      onPress={() => {
                        void toggleFavorite();
                      }}
                    />
                    <ActionButton
                      icon="download-outline"
                      label={language === 'en' ? 'Download all' : 'Tout télécharger'}
                      onPress={() => {
                        void downloadAll();
                      }}
                    />
                    <ActionButton
                      icon="shuffle"
                      label={t('recitations.random')}
                      onPress={playRandom}
                    />
                  </View>

                <View style={styles.storageCard}>
                  <Pressable onPress={() => setStorageExpanded((value) => !value)} accessibilityRole="button" accessibilityState={{ expanded: storageExpanded }}>
                  <View style={styles.storageHeading}>
                  <Text style={styles.storageTitle}>
                    {t('recitations.offlineStorage')}
                  </Text>
                  <Ionicons name={storageExpanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.goldMuted} />
                  </View>
                  <Text style={styles.storageText}>
                    {t('recitations.storageStats', {
                      count: offline.stats.downloadedCount,
                      used: formatBytes(offline.stats.usedBytes, language),
                      free: formatBytes(offline.stats.freeBytes, language),
                    })}
                  </Text>
                  </Pressable>
                  {storageExpanded ? (
                  <View style={styles.storageActions}>
                    <Pressable onPress={removeReciterDownloads} style={styles.storageAction}>
                      <Ionicons name="trash-outline" size={14} color={colors.goldMuted} />
                      <Text style={styles.storageActionText}>
                        {t('recitations.clearReciterDownloads')}
                      </Text>
                    </Pressable>
                    <Pressable onPress={offline.clearAll} style={styles.storageAction}>
                      <Ionicons name="close-circle-outline" size={14} color={colors.goldMuted} />
                      <Text style={styles.storageActionText}>
                        {t('recitations.clearCache')}
                      </Text>
                    </Pressable>
                  </View>
                  ) : null}
                </View>

                <Text style={styles.sectionTitle}>
                  {t('recitations.allSurahs')}
                </Text>
                <View style={{ marginBottom: 12 }}>
                  <SearchBar value={search} onChangeText={setSearch} placeholder={language === 'en' ? 'Search for a surah…' : 'Rechercher une sourate…'} />
                </View>
                {filteredItems.length === 0 ? <Text style={styles.storageText}>{language === 'en' ? 'No surah found' : 'Aucune sourate trouvée'}</Text> : null}
              </Reanimated.View>
            ) : null}
          </>
        }
      />
    </SafeAreaView>
  );
}

function ActionButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        active && styles.actionActive,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={18} color={colors.goldMuted} />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function SurahSeparator() {
  return <View style={styles.surahSeparator} />;
}

function formatBytes(bytes: number, language: 'fr' | 'en') {
  if (bytes <= 0) return language === 'en' ? '0 MB' : '0 Mo';
  const megabytes = bytes / 1024 / 1024;
  if (megabytes < 1024) {
    return `${megabytes.toFixed(1)} ${language === 'en' ? 'MB' : 'Mo'}`;
  }
  return `${(megabytes / 1024).toFixed(2)} ${language === 'en' ? 'GB' : 'Go'}`;
}

const styles = StyleSheet.create({
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18, marginTop: 12 },
  headerBack: { width: 42, height: 42, borderRadius: 21, borderWidth: 1, borderColor: colors.borderSoft, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { flex: 1, color: colors.text, fontFamily: typography.serifMedium, fontSize: 23 },
  changeButton: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 9, borderRadius: 20, borderWidth: 1, borderColor: colors.borderSoft },
  changeText: { color: colors.text, fontSize: 11 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 14, width: '100%' },
  profileCopy: { flex: 1, minWidth: 0 },
  primaryPlay: { marginTop: 14, minHeight: 48, padding: 12, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.goldLight },
  primaryPlayText: { flexShrink: 1, color: colors.background, fontFamily: typography.sans, fontSize: 14, fontWeight: '800' },
  storageHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hero: {
    padding: 12,
    alignItems: 'center',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surfaceAlt,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 5,
  },

  portraitFrame: {
    width: 104,
    height: 130,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(200,148,58,0.08)',
  },

  portraitImage: {
    width: '100%',
    height: '100%',
  },

  name: {
    marginTop: 0,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 23,
    lineHeight: 28,
    textAlign: 'left',
  },

  meta: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'left',
  },

  actions: {
    width: '100%',
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },

  action: {
    flex: 1,
    minHeight: 54,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.purpleDeep,
  },

  actionActive: {
    borderColor: colors.goldDark,
    backgroundColor: colors.surfaceLight,
  },

  actionText: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 9,
    textAlign: 'center',
    fontWeight: '700',
  },

  sectionTitle: {
    marginTop: 24,
    marginBottom: 12,
    color: colors.goldMuted,
    fontFamily: typography.serifMedium,
    fontSize: 22,
  },

  storageCard: {
    width: '100%',
    marginTop: 16,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: 'rgba(21,12,36,0.82)',
  },

  storageTitle: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },

  storageText: {
    marginTop: 5,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: '600',
  },

  storageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },

  storageAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(241,204,126,0.1)',
  },

  storageActionText: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: '800',
  },

  surahSeparator: {
    height: 8,
  },

  pressed: {
    opacity: 0.66,
  },
});
