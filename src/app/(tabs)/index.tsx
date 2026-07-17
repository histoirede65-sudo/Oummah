import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Href } from 'expo-router';
import { router } from 'expo-router';

import AppHeader from '../../components/AppHeader';
import ContinueReadingCard from '../../components/ContinueReadingCard';
import DalilCard from '../../components/DalilCard';
import HomeGoalsSection from '../../components/HomeGoalsSection';
import HomeShortcuts from '../../components/HomeShortcuts';
import PrayerCard from '../../components/PrayerCard';
import SmartResumeCard from '../../components/SmartResumeCard';
import { useGlobalAudioPlayer } from '../../context/AudioPlayerProvider';
import { SURAHS } from '../../data/surahs';
import { colors } from '../../theme/colors';

export default function HomeScreen() {
  const { listeningResume, resumeListening } = useGlobalAudioPlayer();
  const resumeSurah = listeningResume
    ? SURAHS.find((surah) => surah.id === listeningResume.surahId)
    : null;
  const resume = async () => {
    const snapshot = await resumeListening();
    if (snapshot) router.push(`/listen/${snapshot.surahId}?reciterId=${snapshot.reciterId}&returnTo=${encodeURIComponent('/')}&autoplay=1` as Href);
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        <AppHeader />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <PrayerCard />
          {listeningResume ? (
            <SmartResumeCard
              snapshot={listeningResume}
              surahName={resumeSurah?.transliteration ?? resumeSurah?.frenchName ?? ''}
              onResume={() => void resume()}
            />
          ) : null}
          <DalilCard />
          <HomeShortcuts />
          <HomeGoalsSection />
          <ContinueReadingCard />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 13,
    paddingTop: 0,
    paddingBottom: 14,
    transform: [{ translateY: -2 }],
  },
});
