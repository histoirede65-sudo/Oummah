import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ContinueListeningCard from '../../components/quran/ContinueListeningCard';
import LastReadingCard from '../../components/quran/LastReadingCard';
import QuranHeader from '../../components/quran/QuranHeader';
import QuranQuickActions, { type QuranTab } from '../../components/quran/QuranQuickActions';
import QuranSearchBar from '../../components/quran/QuranSearchBar';
import SurahList from '../../components/quran/SurahList';
import { useGlobalAudioPlayer } from '../../context/AudioPlayerProvider';
import { SURAHS } from '../../data/surahs';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { offlineRepository, type ReadingPosition } from '../../core/offline';

function normalize(value: string, locale: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase(locale);
}

export default function QuranScreen() {
  const { language, t } = useI18n();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<QuranTab>('surahs');
  const { track } = useGlobalAudioPlayer();
  const [lastReading, setLastReading] = useState<ReadingPosition | null>(null);
  const [favoriteSurahIds, setFavoriteSurahIds] = useState<Set<number>>(new Set());

  useFocusEffect(useCallback(() => {
    let active = true;
    Promise.all([offlineRepository.getLastReading(), offlineRepository.getFavorites()]).then(([position, favorites]) => {
      if (!active) return;
      setLastReading(position);
      setFavoriteSurahIds(new Set(favorites.filter((item) => item.type === 'surah').map((item) => Number(item.targetId))));
    });
    return () => { active = false; };
  }, []));

  const filteredSurahs = useMemo(() => {
    const search = normalize(query.trim(), language);
    const base = activeTab === 'favorites'
      ? SURAHS.filter((surah) => favoriteSurahIds.has(surah.id))
      : activeTab === 'juz'
        ? SURAHS
        : SURAHS;
    if (!search) return base;

    const numeric = Number(search.replace(/^(sourate|juz|page|verset)\s*/i, ''));
    if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 114) {
      return base.filter((surah) => surah.id === numeric || (activeTab === 'juz' && surah.juzStart === numeric));
    }

    return base.filter((surah) =>
      normalize(`${surah.frenchName} ${surah.transliteration} ${surah.arabicName}`, language).includes(search),
    );
  }, [activeTab, favoriteSurahIds, language, query]);

  const changeTab = (tab: QuranTab) => {
    setActiveTab(tab);
    if (tab !== 'surahs') setQuery('');
  };

  const emptyMessage = activeTab === 'juz'
    ? t('quran.juzComingSoon')
    : activeTab === 'favorites'
      ? t('quran.favoritesEmpty')
      : t('quran.empty');

  const header = (
    <>
      <QuranHeader
        onMenuPress={() => undefined}
        onFavoritePress={() => changeTab('favorites')}
      />
      <LastReadingCard
        surahName={lastReading ? SURAHS[lastReading.surahId - 1]?.frenchName : undefined}
        page={lastReading?.page}
        verse={lastReading?.verseNumber}
        progress={lastReading ? Math.round((lastReading.verseNumber / (SURAHS[lastReading.surahId - 1]?.verses || 1)) * 100) : 0}
        onResume={() => router.push(`/surah/${lastReading?.surahId ?? 1}?verse=${lastReading?.verseNumber ?? 1}` as Href)}
      />
      <ContinueListeningCard
        onResume={() => router.push(`/listen/${track?.surahId ?? 1}?returnTo=${encodeURIComponent('/quran')}` as Href)}
        onOpenRecitations={() => router.push('/listen/reciters' as Href)}
      />
      <View style={styles.searchGap}>
        <QuranSearchBar value={query} onChangeText={setQuery} />
      </View>
      <QuranQuickActions
        activeTab={activeTab}
        onTabChange={changeTab}
        onFavoritePress={() => {
          changeTab('favorites');
        }}
        onBookmarkPress={() => undefined}
        onAudioPress={() => router.push('/listen/reciters' as Href)}
      />
      <View style={styles.listHeading}>
        <Text style={styles.listTitle}>
          {activeTab === 'surahs' ? t('quran.allSurahs') : activeTab === 'juz' ? t('quran.juz') : t('common.favorites')}
        </Text>
        {activeTab === 'surahs' ? <Text style={styles.count}>{filteredSurahs.length} / 114</Text> : null}
      </View>
    </>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <SurahList
        data={filteredSurahs}
        header={header}
        emptyMessage={emptyMessage}
        onSurahPress={(surah) => router.push(`/surah/${surah.id}` as Href)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  searchGap: { marginTop: 12 },
  listHeading: { marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listTitle: { color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 21 },
  count: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, fontWeight: '500' },
});
