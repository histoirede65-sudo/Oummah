import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Reanimated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useReciter } from '../../../context/ReciterProvider';
import { audioDependencies } from '../../../features/audio/audioDependencies';
import { SURAHS } from '../../../data/surahs';
import {
  ListeningHeader,
  ReciterAvatar,
  SurahAudioRow,
  listeningStyles,
} from '../../../features/audio/presentation/ListeningComponents';
import { preloadReciterPortraits } from '../../../features/audio/presentation/audioPreload';
import { useOfflineDownloads } from '../../../features/audio/presentation/useOfflineDownloads';
import { useSurahCatalogViewModel } from '../../../features/audio/presentation/viewmodels/useSurahCatalogViewModel';
import type { SurahCatalogItem } from '../../../features/audio/domain/audio';
import { useI18n } from '../../../i18n';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

export default function ReciterDetailScreen() {
  const { t } = useI18n();
  const { reciterId: routeReciterId, returnTo } = useLocalSearchParams<{ reciterId?: string; returnTo?: string }>();
  const { currentReciter, reciters } = useReciter();
  const reciterId = routeReciterId ?? currentReciter?.id;
  const reciter = reciters.find((item) => item.id === reciterId);
  const { items, refresh } = useSurahCatalogViewModel(reciterId);
  const offline = useOfflineDownloads();
  const [favoriteIds, setFavoriteIds] = useState<readonly string[]>([]);
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

  const totalDuration = useMemo(() => {
    const seconds = displayedItems.reduce((total, item) => total + (item.track.durationHint ?? 0), 0);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return hours > 0
      ? t('recitations.durationHoursMinutes', { hours, minutes })
      : `${minutes} min`;
  }, [displayedItems, t]);

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

  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace((returnTo || '/listen/reciters') as Href);
  }, [returnTo]);

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
    [downloadTrack, offline.downloads, openSurah],
  );

  const keyExtractor = useCallback((item: (typeof displayedItems)[number]) => item.track.id, []);

  return (
    <SafeAreaView edges={['top']} style={listeningStyles.safeArea}>
      <FlatList
        data={displayedItems}
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
            <ListeningHeader
              title={reciter?.name ?? t('recitations.reciters')}
              subtitle={t('recitations.reciterSurahs')}
              onBack={goBack}
            />

            {reciter ? (
              <Reanimated.View entering={FadeInDown.duration(420).easing(Easing.out(Easing.cubic))}>
                <LinearGradient
                  colors={[colors.surfaceAlt, colors.purpleMid, colors.backgroundSecondary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.hero}
                >
                  <View style={styles.portraitFrame}>
                    <ReciterAvatar reciter={reciter} size={150} />
                  </View>

                  <Text numberOfLines={2} style={styles.name}>
                    {reciter.name}
                  </Text>
                  <Text style={styles.meta}>
                    {reciter.country} · {t(`recitations.style.${reciter.style}`)} · {totalDuration}
                  </Text>

                  <View style={styles.actions}>
                    <ActionButton
                      icon={isFavorite ? 'star' : 'star-outline'}
                      label="Favori"
                      active={isFavorite}
                      onPress={() => {
                        void toggleFavorite();
                      }}
                    />
                    <ActionButton
                      icon="download-outline"
                      label="Tout"
                      onPress={() => {
                        void downloadAll();
                      }}
                    />
                    <ActionButton
                      icon="shuffle"
                      label="Aléatoire"
                      onPress={playRandom}
                    />
                  </View>
                </LinearGradient>

                <View style={styles.storageCard}>
                  <Text style={styles.storageTitle}>Stockage hors ligne</Text>
                  <Text style={styles.storageText}>
                    {offline.stats.downloadedCount} sourates · {formatBytes(offline.stats.usedBytes)} utilisés · {formatBytes(offline.stats.freeBytes)} libres
                  </Text>
                  <View style={styles.storageActions}>
                    <Pressable onPress={removeReciterDownloads} style={styles.storageAction}>
                      <Ionicons name="trash-outline" size={14} color={colors.goldMuted} />
                      <Text style={styles.storageActionText}>Effacer ce récitateur</Text>
                    </Pressable>
                    <Pressable onPress={offline.clearAll} style={styles.storageAction}>
                      <Ionicons name="close-circle-outline" size={14} color={colors.goldMuted} />
                      <Text style={styles.storageActionText}>Vider le cache</Text>
                    </Pressable>
                  </View>
                </View>

                <Text style={styles.sectionTitle}>Toutes les sourates</Text>
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

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 Mo';
  const megabytes = bytes / 1024 / 1024;
  if (megabytes < 1024) return `${megabytes.toFixed(1)} Mo`;
  return `${(megabytes / 1024).toFixed(2)} Go`;
}

const styles = StyleSheet.create({
  hero: {
    padding: 18,
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
    width: 164,
    height: 164,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 82,
    backgroundColor: 'rgba(200,148,58,0.08)',
  },

  name: {
    marginTop: 16,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 28,
    lineHeight: 32,
    textAlign: 'center',
  },

  meta: {
    marginTop: 6,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  actions: {
    width: '100%',
    marginTop: 18,
    flexDirection: 'row',
    gap: 8,
  },

  action: {
    flex: 1,
    minHeight: 48,
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
