import type { Href } from 'expo-router';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Animated, ScrollView, StyleSheet, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AudioPlayer from '../../components/surah/AudioPlayer';
import { usePlayerSwipeGestures } from '../../components/surah/PlayerGestures';
import PlayerQuickMenu from '../../components/surah/PlayerQuickMenu';
import ReciterHero from '../../components/surah/ReciterHero';
import type { ReciterTransitionData } from '../../components/surah/ReciterTransition';
import SyncedVerseList from '../../components/surah/SyncedVerseList';
import TadabburControls from '../../components/surah/TadabburControls';
import TadabburVerseFocus from '../../components/surah/TadabburVerseFocus';
import { useGlobalAudioPlayer } from '../../context/AudioPlayerProvider';
import { useReciter } from '../../context/ReciterProvider';
import { animationCurves, animationDurations, premiumAnimations } from '../../core/animations';
import { getTrackReciter, getTrackSurahId, tadabburController, type TadabburVerseState } from '../../core/audio';
import { SURAHS } from '../../data/surahs';
import { AL_FATIHA_VERSES, type Verse } from '../../data/verses/al-fatiha';
import { audioDependencies } from '../../features/audio/audioDependencies';
import { preloadAdjacentAudio, preloadAudioSurface, preloadReciterPortraits } from '../../features/audio/presentation/audioPreload';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';

function transitionData(reciter: { id: string; name: string; country: string; style: string; image?: ImageSourcePropType; availableSurahs?: number }): ReciterTransitionData {
  return { id: reciter.id, name: reciter.name, country: reciter.country, style: reciter.style, image: reciter.image, recitationCount: reciter.availableSurahs ?? 114 };
}

export default function SurahListeningScreen() {
  const { t } = useI18n();
  const { surahId, reciterId, returnTo, autoplay } = useLocalSearchParams<{ surahId: string; reciterId?: string; returnTo?: string; autoplay?: string }>();
  const { width, height } = useWindowDimensions();
  const compact = width < 370;
  const scrollOffset = useRef(0);
  const previousTadabburVerse = useRef<TadabburVerseState | null>(null);
  const backdropValues = useRef(premiumAnimations.createValues('fadeIn')).current;
  const backdropInitialized = useRef(false);
  const surahOpacity = useRef(new Animated.Value(1)).current;
  const surahTranslateX = useRef(new Animated.Value(0)).current;
  const surahScale = useRef(new Animated.Value(1)).current;
  const timelineReadyKeyRef = useRef('');
  const startupRequestRef = useRef('');
  const playRequestRef = useRef(0);
  const mountedRef = useRef(true);
  const audioReadyRef = useRef(false);
  const [quickMenuVisible, setQuickMenuVisible] = useState(false);
  const id = Number(surahId) || 1;
  const surah = SURAHS.find((item) => item.id === id) ?? SURAHS[0];
  const heroHeight = Math.max(430, Math.min(560, Math.round(height * 0.52)));
  const { track, isLoaded, isPlaying, isFavorite, progress, currentTime, duration, getCurrentPositionMs, loadSurah, pause, play, seekTo, subscribeToPosition, toggleFavorite, cyclePlaybackRate, cycleRepeatMode, cycleSleepTimer } = useGlobalAudioPlayer();
  const { currentReciter, reciters, setCurrentReciter } = useReciter();
  const tadabburMode = useSyncExternalStore(
    tadabburController.subscribe,
    tadabburController.getSnapshot,
    tadabburController.getSnapshot,
  );
  const tadabburVerses = useMemo<readonly Verse[]>(() => (
    surah.id === 1
      ? AL_FATIHA_VERSES
      : [{ id: 1, arabic: t('quran.basmala'), french: surah.frenchName }]
  ), [surah.frenchName, surah.id, t]);
  const safeProgress = Number.isFinite(progress) ? Math.max(0, Math.min(0.999999, progress)) : 0;
  const versePosition = Math.min(tadabburVerses.length - 1, Math.floor(safeProgress * tadabburVerses.length));
  const activeTadabburVerse = tadabburVerses[Math.max(0, versePosition)];
  const activeVerseProgress = Math.round(Math.min(100, Math.max(0, (safeProgress * tadabburVerses.length - versePosition) * 100)));

  const activeReciter = track ? getTrackReciter(track) : undefined;
  const activeSurahId = track ? getTrackSurahId(track) : undefined;
  const transitionReciters = useMemo(() => {
    const selectedReciter = currentReciter
      ?? reciters.find((reciter) => reciter.id === activeReciter?.id)
      ?? reciters[0];
    if (!selectedReciter) return null;
    const activeIndex = reciters.findIndex((item) => item.id === selectedReciter.id);
    const selected = activeIndex >= 0 ? reciters[activeIndex] : selectedReciter;
    if (reciters.length < 2 || activeIndex < 0) return { current: transitionData(selected) };
    return {
      current: transitionData(selected),
      previous: transitionData(reciters[(activeIndex - 1 + reciters.length) % reciters.length]),
      next: transitionData(reciters[(activeIndex + 1) % reciters.length]),
    };
  }, [activeReciter, currentReciter, reciters]);

  const openSurah = useCallback((targetId: number) => {
    if (targetId < 1 || targetId > 114 || targetId === surah.id) return;
    const shouldAutoplay = isPlaying;
    if (shouldAutoplay) pause();
    timelineReadyKeyRef.current = '';
    const selectedReciterId = currentReciter?.id ?? activeReciter?.id;
    const autoplayParam = shouldAutoplay ? '&autoplay=1' : '';
    const target = selectedReciterId
      ? `/listen/${targetId}?reciterId=${selectedReciterId}&returnTo=${encodeURIComponent(returnTo || '/listen/reciters')}${autoplayParam}`
      : `/listen/${targetId}?returnTo=${encodeURIComponent(returnTo || '/listen/reciters')}${autoplayParam}`;
    router.replace(target as Href);
  }, [activeReciter?.id, currentReciter?.id, isPlaying, pause, returnTo, surah.id]);
  const handlePrevious = useCallback(() => {
    if (currentTime > 3 || surah.id <= 1) {
      void seekTo(0);
      return;
    }
    openSurah(surah.id - 1);
  }, [currentTime, openSurah, seekTo, surah.id]);
  const handleNext = useCallback(() => {
    openSurah(surah.id + 1);
  }, [openSurah, surah.id]);
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace((returnTo || '/listen/reciters') as Href);
  }, [returnTo]);
  const collapsePlayer = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/listen/reciters');
  }, []);
  const gestureOptions = useMemo(() => ({
    surface: 'full' as const,
    canCollapse: () => scrollOffset.current <= 1,
    onCollapse: collapsePlayer,
    onPrevious: () => openSurah(surah.id - 1),
    onNext: () => openSurah(surah.id + 1),
  }), [collapsePlayer, openSurah, surah.id]);
  const playerGesture = usePlayerSwipeGestures(gestureOptions);
  const currentReciterId = transitionReciters?.current.id;
  const requestedReciterId = reciterId ?? currentReciter?.id ?? activeReciter?.id;
  const requestedTimelineKey = `${requestedReciterId ?? 'no-reciter'}:${surah.id}`;
  audioReadyRef.current = isLoaded;
  const handleTimelineReady = useCallback((key: string) => {
    timelineReadyKeyRef.current = key;
  }, []);
  const waitForTimeline = useCallback((key: string, timeoutMs = 5000) => new Promise<boolean>((resolve) => {
    if (timelineReadyKeyRef.current === key) {
      resolve(true);
      return;
    }
    const startedAt = Date.now();
    const check = () => {
      if (timelineReadyKeyRef.current === key) {
        resolve(true);
        return;
      }
      if (!mountedRef.current || Date.now() - startedAt >= timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(check, 25);
    };
    setTimeout(check, 25);
  }), []);
  const waitForAudioReady = useCallback((timeoutMs = 10_000) => new Promise<boolean>((resolve) => {
    if (audioReadyRef.current) {
      resolve(true);
      return;
    }
    const startedAt = Date.now();
    const check = () => {
      if (audioReadyRef.current) {
        resolve(true);
        return;
      }
      if (!mountedRef.current || Date.now() - startedAt >= timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(check, 20);
    };
    setTimeout(check, 20);
  }), []);
  const ensureTimelineReady = useCallback(async () => {
    if (!requestedReciterId) return false;
    const correctTrack = activeSurahId === surah.id && activeReciter?.id === requestedReciterId;
    if (!correctTrack) {
      audioReadyRef.current = false;
      await loadSurah(surah.id, false, requestedReciterId);
    }
    const [timelineReady, audioReady] = await Promise.all([
      waitForTimeline(requestedTimelineKey),
      waitForAudioReady(),
    ]);
    return timelineReady && audioReady;
  }, [activeReciter?.id, activeSurahId, loadSurah, requestedReciterId, requestedTimelineKey, surah.id, waitForAudioReady, waitForTimeline]);
  const handleTogglePlay = useCallback(() => {
    const requestId = ++playRequestRef.current;
    if (isPlaying) {
      pause();
      return;
    }
    void ensureTimelineReady().then((ready) => {
      if (ready && mountedRef.current && playRequestRef.current === requestId) play();
    }).catch(() => undefined);
  }, [ensureTimelineReady, isPlaying, pause, play]);
  const chooseReciter = useCallback((selectedReciterId: string) => {
    const selectedReciter = reciters.find((reciter) => reciter.id === selectedReciterId);
    if (!selectedReciter) return;
    const shouldAutoplay = isPlaying;
    if (shouldAutoplay) pause();
    timelineReadyKeyRef.current = '';
    void setCurrentReciter(selectedReciter);
    router.setParams({ reciterId: selectedReciterId, autoplay: shouldAutoplay ? '1' : '0' });
  }, [isPlaying, pause, reciters, setCurrentReciter]);
  const chooseSurah = useCallback((selectedSurahId: number) => {
    openSurah(selectedSurahId);
  }, [openSurah]);
  const toggleReciterFavorite = useCallback(() => {
    if (currentReciterId) void audioDependencies.reciterFavorites.toggle(currentReciterId);
  }, [currentReciterId]);
  const toggleTadabbur = useCallback(() => {
    setQuickMenuVisible(false);
    tadabburController.toggle();
  }, []);

  useEffect(() => {
    if (!backdropInitialized.current && !tadabburMode.isActive) {
      backdropInitialized.current = true;
      backdropValues.opacity?.setValue(0);
      return;
    }
    backdropInitialized.current = true;
    const animation = premiumAnimations.start(
      tadabburMode.isActive ? 'fadeIn' : 'fadeOut',
      backdropValues,
    );
    return () => animation.stop();
  }, [backdropValues, tadabburMode.isActive]);

  useEffect(() => {
    if (!tadabburMode.isActive) {
      previousTadabburVerse.current = null;
      return;
    }
    const next: TadabburVerseState = {
      surahId: surah.id,
      verseId: activeTadabburVerse.id,
      progress: activeVerseProgress,
    };
    const previous = previousTadabburVerse.current;
    if (previous && (previous.surahId !== next.surahId || previous.verseId !== next.verseId)) {
      void tadabburController.completeVerse(previous);
    }
    previousTadabburVerse.current = next;
    tadabburController.updateVerse(next);
  }, [activeTadabburVerse.id, activeVerseProgress, surah.id, tadabburMode.isActive]);

  useEffect(() => () => tadabburController.deactivate(), []);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    surahOpacity.stopAnimation();
    surahTranslateX.stopAnimation();
    surahScale.stopAnimation();
    surahOpacity.setValue(0.76);
    surahTranslateX.setValue(18);
    surahScale.setValue(0.985);
    const animation = Animated.parallel([
      Animated.timing(surahOpacity, { toValue: 1, duration: animationDurations.slow, easing: animationCurves.premium, useNativeDriver: true, isInteraction: false }),
      Animated.timing(surahTranslateX, { toValue: 0, duration: animationDurations.slow, easing: animationCurves.premium, useNativeDriver: true, isInteraction: false }),
      Animated.timing(surahScale, { toValue: 1, duration: animationDurations.slow, easing: animationCurves.premium, useNativeDriver: true, isInteraction: false }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [surah.id, surahOpacity, surahScale, surahTranslateX]);

  useEffect(() => {
    if (!requestedReciterId) return;
    const requestIdentity = `${requestedReciterId}:${surah.id}`;
    if (startupRequestRef.current === requestIdentity) return;
    startupRequestRef.current = requestIdentity;
    const shouldResume = isPlaying || autoplay === '1';
    if (isPlaying) pause();
    if (timelineReadyKeyRef.current !== requestIdentity) timelineReadyKeyRef.current = '';
    const requestId = ++playRequestRef.current;
    void ensureTimelineReady().then((ready) => {
      if (ready && mountedRef.current && startupRequestRef.current === requestIdentity && playRequestRef.current === requestId && shouldResume) play();
    }).catch(() => undefined);
  }, [autoplay, ensureTimelineReady, isPlaying, pause, play, requestedReciterId, surah.id]);

  useEffect(() => {
    const selectedReciterId = currentReciter?.id ?? activeReciter?.id ?? reciterId;
    preloadAudioSurface(selectedReciterId, surah.id);
    if (isPlaying) preloadAdjacentAudio(selectedReciterId, surah.id);
  }, [activeReciter?.id, currentReciter?.id, isPlaying, reciterId, surah.id]);

  useEffect(() => {
    preloadReciterPortraits(reciters, 10);
  }, [reciters]);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.tadabburBackdrop, { opacity: backdropValues.opacity }]} />
      <Animated.View {...playerGesture.panHandlers} style={[styles.gestureSurface, playerGesture.animatedStyle]}>
        <Animated.View style={[styles.gestureSurface, { opacity: surahOpacity, transform: [{ translateX: surahTranslateX }, { scale: surahScale }] }]}>
        <ScrollView
          contentContainerStyle={[styles.content, compact && styles.contentCompact]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(event) => { scrollOffset.current = event.nativeEvent.contentOffset.y; }}
        >
          {transitionReciters ? <ReciterHero
            previousReciter={transitionReciters.previous}
            nextReciter={transitionReciters.next}
            surahName={track?.title ?? surah.transliteration}
            surahNumber={surah.id}
            surahArabicName={surah.arabicName}
            surahFrenchName={surah.frenchName}
            verses={surah.verses}
            revelation={surah.revelationType}
            height={heroHeight}
            isPlaying={isPlaying}
            isFavorite={isFavorite}
            onFavorite={() => void toggleFavorite()}
            onBack={goBack}
            onMenu={() => setQuickMenuVisible(true)}
            onReciterPress={() => router.push({ pathname: '/listen/reciters', params: { returnTo: `/listen/${surah.id}` } })}
            onReciterDoubleTap={toggleReciterFavorite}
            focusContent={tadabburMode.isActive ? (
              <TadabburVerseFocus
                verses={tadabburVerses}
                activeVerseId={activeTadabburVerse.id}
                progress={activeVerseProgress}
              />
            ) : undefined}
          /> : null}
          <SyncedVerseList
            surahId={surah.id}
            reciterId={activeReciter?.id ?? reciterId}
            trackId={track?.id}
            audioUrl={track?.remoteUri ?? track?.source.uri}
            duration={duration}
            compact={compact}
            hidden={tadabburMode.isActive}
            subscribeToPosition={subscribeToPosition}
            getCurrentPositionMs={getCurrentPositionMs}
            onTimelineReady={handleTimelineReady}
          />
          <TadabburControls
            isActive={tadabburMode.isActive}
            pauseSeconds={tadabburMode.settings.pauseAfterVerseSeconds}
            onToggle={toggleTadabbur}
            onCyclePause={() => tadabburController.cyclePauseAfterVerse()}
          />
          <AudioPlayer
            minimal={tadabburMode.isActive}
            onTogglePlay={handleTogglePlay}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onPlayLongPress={tadabburMode.isActive ? undefined : () => setQuickMenuVisible(true)}
            onOpenMenu={() => setQuickMenuVisible(true)}
          />
        </ScrollView>
        </Animated.View>
      </Animated.View>
      <PlayerQuickMenu
        visible={quickMenuVisible}
        reciters={reciters}
        currentSurahId={surah.id}
        onClose={() => setQuickMenuVisible(false)}
        onSpeed={cyclePlaybackRate}
        onTimer={cycleSleepTimer}
        onRepeat={cycleRepeatMode}
        onReciter={chooseReciter}
        onSurah={chooseSurah}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  gestureSurface: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 30 },
  contentCompact: { paddingHorizontal: 12 },
  tadabburBackdrop: { backgroundColor: 'rgba(0,0,0,0.18)' },
});
