import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AudioPlayer from "../../components/surah/AudioPlayer";
import AudioProgress from "../../components/surah/AudioProgress";
import { usePlayerSwipeGestures } from "../../components/surah/PlayerGestures";
import PlayerQuickMenu from "../../components/surah/PlayerQuickMenu";
import ReciterHero from "../../components/surah/ReciterHero";
import type { ReciterTransitionData } from "../../components/surah/ReciterTransition";
import SyncedVerseList, {
  type TadabburDisplayVerse,
} from "../../components/surah/SyncedVerseList";
import { useGlobalAudioPlayer } from "../../context/AudioPlayerProvider";
import { useReciter } from "../../context/ReciterProvider";
import {
  animationCurves,
  animationDurations,
  premiumAnimations,
} from "../../core/animations";
import {
  getTrackReciter,
  getTrackSurahId,
  tadabburController,
  type TadabburVerseState,
} from "../../core/audio";
import { SURAHS } from "../../data/surahs";
import { audioDependencies } from "../../features/audio/audioDependencies";
import {
  preloadAdjacentAudio,
  preloadAudioSurface,
  preloadReciterPortraits,
} from "../../features/audio/presentation/audioPreload";
import { readingQuranRepository } from "../../features/quran/ReadingQuranRepository";
import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";

function transitionData(reciter: {
  id: string;
  name: string;
  country: string;
  style: string;
  image?: ImageSourcePropType;
  availableSurahs?: number;
}): ReciterTransitionData {
  return {
    id: reciter.id,
    name: reciter.name,
    country: reciter.country,
    style: reciter.style,
    image: reciter.image,
    recitationCount: reciter.availableSurahs ?? 114,
  };
}

export default function SurahListeningScreen() {
  const { language } = useI18n();
  const { surahId, reciterId, returnTo, autoplay } = useLocalSearchParams<{
    surahId: string;
    reciterId?: string;
    returnTo?: string;
    autoplay?: string;
  }>();
  const { width, height } = useWindowDimensions();
  const compact = width < 370;
  const scrollOffset = useRef(0);
  const previousTadabburVerse = useRef<TadabburVerseState | null>(null);
  const backdropValues = useRef(
    premiumAnimations.createValues("fadeIn"),
  ).current;
  const backdropInitialized = useRef(false);
  const surahOpacity = useRef(new Animated.Value(1)).current;
  const surahTranslateX = useRef(new Animated.Value(0)).current;
  const surahScale = useRef(new Animated.Value(1)).current;
  const timelineReadyKeyRef = useRef("");
  const startupRequestRef = useRef("");
  const playRequestRef = useRef(0);
  const mountedRef = useRef(true);
  const audioReadyRef = useRef(false);
  const id = Number(surahId) || 1;
  const surah = SURAHS.find((item) => item.id === id) ?? SURAHS[0];
  const [quickMenuVisible, setQuickMenuVisible] = useState(false);
  const [tadabburVerses, setTadabburVerses] = useState<
    readonly TadabburDisplayVerse[]
  >([]);
  const [activeTadabburVerseId, setActiveTadabburVerseId] = useState(1);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(surah.verses);
  const rangeEndRef = useRef(surah.verses);
  const rangeStopSecondsRef = useRef<number | null>(null);
  const [activeVerseProgress, setActiveVerseProgress] = useState(0);
  const [englishSurahName, setEnglishSurahName] = useState<string>();

  useEffect(() => {
    let active = true;
    if (language !== "en") {
      setEnglishSurahName(undefined);
      return () => {
        active = false;
      };
    }
    setEnglishSurahName(undefined);
    void readingQuranRepository
      .getEnglishSurahNames()
      .then((names) => {
        if (active) setEnglishSurahName(names.get(surah.id));
      })
      .catch(() => {
        if (active) setEnglishSurahName(undefined);
      });
    return () => {
      active = false;
    };
  }, [language, surah.id]);

  useEffect(() => {
    if (surah.id === 1) {
      tadabburController.deactivate();
      rangeStopSecondsRef.current = null;
    }
  }, [surah.id]);
  const heroHeight = Math.max(450, Math.min(510, Math.round(height * 0.56)));
  const {
    track,
    isLoaded,
    isPlaying,
    isFavorite,
    currentTime,
    duration,
    getCurrentPositionMs,
    loadSurah,
    pause,
    play,
    stop,
    seekTo,
    skipBy,
    subscribeToPosition,
    toggleFavorite,
    cyclePlaybackRate,
    cycleRepeatMode,
    cycleSleepTimer,
  } = useGlobalAudioPlayer();
  const { currentReciter, reciters, setCurrentReciter } = useReciter();
  const tadabburMode = useSyncExternalStore(
    tadabburController.subscribe,
    tadabburController.getSnapshot,
    tadabburController.getSnapshot,
  );
  const activeTadabburVerse =
    tadabburVerses.find((verse) => verse.id === activeTadabburVerseId) ??
    tadabburVerses[0];
  const handleTadabburUpdate = useCallback(
    (
      nextVerses: readonly TadabburDisplayVerse[],
      verseId: number,
      verseProgress: number,
    ) => {
      setTadabburVerses((current) =>
        current.length === nextVerses.length &&
        current[0]?.id === nextVerses[0]?.id &&
        current.at(-1)?.id === nextVerses.at(-1)?.id
          ? current
          : nextVerses,
      );
      setActiveTadabburVerseId(verseId);
      setActiveVerseProgress(verseProgress);
    },
    [],
  );

  const playVerseRange = useCallback(() => {
    const start = tadabburVerses.find((verse) => verse.id === rangeStart);
    if (start?.startSeconds === undefined) return;
    rangeEndRef.current = rangeEnd;
    rangeStopSecondsRef.current = tadabburVerses.find((verse) => verse.id === rangeEnd)?.endSeconds ?? null;
    void seekTo(start.startSeconds).then(() => play());
  }, [play, rangeEnd, rangeStart, seekTo, tadabburVerses]);

  useEffect(() => subscribeToPosition((positionMs) => {
    const stopAt = rangeStopSecondsRef.current;
    if (stopAt !== null && positionMs / 1000 >= stopAt) {
      rangeStopSecondsRef.current = null;
      pause();
    }
  }), [pause, subscribeToPosition]);

  const activeReciter = track ? getTrackReciter(track) : undefined;
  const activeSurahId = track ? getTrackSurahId(track) : undefined;
  const transitionReciters = useMemo(() => {
    const selectedReciter =
      currentReciter ??
      reciters.find((reciter) => reciter.id === activeReciter?.id) ??
      reciters[0];
    if (!selectedReciter) return null;
    const activeIndex = reciters.findIndex(
      (item) => item.id === selectedReciter.id,
    );
    const selected = activeIndex >= 0 ? reciters[activeIndex] : selectedReciter;
    if (reciters.length < 2 || activeIndex < 0)
      return { current: transitionData(selected) };
    return {
      current: transitionData(selected),
      previous: transitionData(
        reciters[(activeIndex - 1 + reciters.length) % reciters.length],
      ),
      next: transitionData(reciters[(activeIndex + 1) % reciters.length]),
    };
  }, [activeReciter, currentReciter, reciters]);

  const openSurah = useCallback(
    (targetId: number) => {
      if (targetId < 1 || targetId > 114 || targetId === surah.id) return;
      const shouldAutoplay = isPlaying;
      if (shouldAutoplay) pause();
      timelineReadyKeyRef.current = "";
      const selectedReciterId = currentReciter?.id ?? activeReciter?.id;
      const autoplayParam = shouldAutoplay ? "&autoplay=1" : "";
      const target = selectedReciterId
        ? `/listen/${targetId}?reciterId=${selectedReciterId}&returnTo=${encodeURIComponent(returnTo || "/listen/reciters")}${autoplayParam}`
        : `/listen/${targetId}?returnTo=${encodeURIComponent(returnTo || "/listen/reciters")}${autoplayParam}`;
      router.replace(target as Href);
    },
    [
      activeReciter?.id,
      currentReciter?.id,
      isPlaying,
      pause,
      returnTo,
      surah.id,
    ],
  );
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
  const handleStop = useCallback(() => {
    rangeStopSecondsRef.current = null;
    void stop();
  }, [stop]);
  const handleSkipBackward = useCallback(() => {
    void skipBy(-5);
  }, [skipBy]);
  const handleSkipForward = useCallback(() => {
    void skipBy(5);
  }, [skipBy]);
  const goBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace((returnTo || "/listen/reciters") as Href);
  }, [returnTo]);
  const collapsePlayer = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace("/listen/reciters");
  }, []);
  const gestureOptions = useMemo(
    () => ({
      surface: "full" as const,
      canCollapse: () => scrollOffset.current <= 1,
      onCollapse: collapsePlayer,
      onPrevious: () => openSurah(surah.id - 1),
      onNext: () => openSurah(surah.id + 1),
    }),
    [collapsePlayer, openSurah, surah.id],
  );
  const playerGesture = usePlayerSwipeGestures(gestureOptions);
  const currentReciterId = transitionReciters?.current.id;
  const requestedReciterId =
    reciterId ?? currentReciter?.id ?? activeReciter?.id;
  audioReadyRef.current = isLoaded;
  const handleTimelineReady = useCallback((key: string) => {
    timelineReadyKeyRef.current = key;
  }, []);
  const waitForAudioReady = useCallback(
    (timeoutMs = 10_000) =>
      new Promise<boolean>((resolve) => {
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
      }),
    [],
  );
  const ensureTimelineReady = useCallback(async () => {
    if (!requestedReciterId) return false;
    const correctTrack =
      activeSurahId === surah.id && activeReciter?.id === requestedReciterId;
    if (surah.id === 1 || !correctTrack || !isLoaded) {
      audioReadyRef.current = false;
      await loadSurah(surah.id, false, requestedReciterId);
      if (surah.id === 1) await seekTo(0);
    }
    // Verse timestamps enrich highlighting, but playback only needs audio.
    return waitForAudioReady();
  }, [
    activeReciter?.id,
    activeSurahId,
    isLoaded,
    loadSurah,
    requestedReciterId,
    seekTo,
    surah.id,
    waitForAudioReady,
  ]);
  const handleTogglePlay = useCallback(() => {
    const requestId = ++playRequestRef.current;
    if (isPlaying) {
      pause();
      return;
    }
    void ensureTimelineReady()
      .then((ready) => {
        if (ready && mountedRef.current && playRequestRef.current === requestId)
          play();
      })
      .catch(() => undefined);
  }, [ensureTimelineReady, isPlaying, pause, play]);
  const chooseReciter = useCallback(
    (selectedReciterId: string) => {
      const selectedReciter = reciters.find(
        (reciter) => reciter.id === selectedReciterId,
      );
      if (!selectedReciter) return;
      const shouldAutoplay = isPlaying;
      if (shouldAutoplay) pause();
      timelineReadyKeyRef.current = "";
      void setCurrentReciter(selectedReciter);
      router.setParams({
        reciterId: selectedReciterId,
        autoplay: shouldAutoplay ? "1" : "0",
      });
    },
    [isPlaying, pause, reciters, setCurrentReciter],
  );
  const chooseSurah = useCallback(
    (selectedSurahId: number) => {
      openSurah(selectedSurahId);
    },
    [openSurah],
  );
  const toggleReciterFavorite = useCallback(() => {
    if (currentReciterId)
      void audioDependencies.reciterFavorites.toggle(currentReciterId);
  }, [currentReciterId]);
  useEffect(() => {
    if (!backdropInitialized.current && !tadabburMode.isActive) {
      backdropInitialized.current = true;
      backdropValues.opacity?.setValue(0);
      return;
    }
    backdropInitialized.current = true;
    const animation = premiumAnimations.start(
      tadabburMode.isActive ? "fadeIn" : "fadeOut",
      backdropValues,
    );
    return () => animation.stop();
  }, [backdropValues, tadabburMode.isActive]);

  useEffect(() => {
    if (!tadabburMode.isActive || !activeTadabburVerse) {
      previousTadabburVerse.current = null;
      return;
    }
    const next: TadabburVerseState = {
      surahId: surah.id,
      verseId: activeTadabburVerse.id,
      progress: activeVerseProgress,
    };
    const previous = previousTadabburVerse.current;
    if (
      previous &&
      (previous.surahId !== next.surahId || previous.verseId !== next.verseId)
    ) {
      void tadabburController.completeVerse(previous);
    }
    previousTadabburVerse.current = next;
    tadabburController.updateVerse(next);
  }, [
    activeTadabburVerse,
    activeVerseProgress,
    surah.id,
    tadabburMode.isActive,
  ]);

  useEffect(() => () => tadabburController.deactivate(), []);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    surahOpacity.stopAnimation();
    surahTranslateX.stopAnimation();
    surahScale.stopAnimation();
    surahOpacity.setValue(0.76);
    surahTranslateX.setValue(18);
    surahScale.setValue(0.985);
    const animation = Animated.parallel([
      Animated.timing(surahOpacity, {
        toValue: 1,
        duration: animationDurations.slow,
        easing: animationCurves.premium,
        useNativeDriver: true,
        isInteraction: false,
      }),
      Animated.timing(surahTranslateX, {
        toValue: 0,
        duration: animationDurations.slow,
        easing: animationCurves.premium,
        useNativeDriver: true,
        isInteraction: false,
      }),
      Animated.timing(surahScale, {
        toValue: 1,
        duration: animationDurations.slow,
        easing: animationCurves.premium,
        useNativeDriver: true,
        isInteraction: false,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [surah.id, surahOpacity, surahScale, surahTranslateX]);

  useEffect(() => {
    if (!requestedReciterId) return;
    const requestIdentity = `${requestedReciterId}:${surah.id}`;
    if (startupRequestRef.current === requestIdentity) return;
    startupRequestRef.current = requestIdentity;
    const shouldResume = isPlaying || autoplay === "1";
    if (isPlaying) pause();
    if (timelineReadyKeyRef.current !== requestIdentity)
      timelineReadyKeyRef.current = "";
    const requestId = ++playRequestRef.current;
    void ensureTimelineReady()
      .then((ready) => {
        if (
          ready &&
          mountedRef.current &&
          startupRequestRef.current === requestIdentity &&
          playRequestRef.current === requestId &&
          shouldResume
        )
          play();
      })
      .catch(() => undefined);
  }, [
    autoplay,
    ensureTimelineReady,
    isPlaying,
    pause,
    play,
    requestedReciterId,
    surah.id,
  ]);

  useEffect(() => {
    const selectedReciterId =
      currentReciter?.id ?? activeReciter?.id ?? reciterId;
    preloadAudioSurface(selectedReciterId, surah.id);
    if (isPlaying) preloadAdjacentAudio(selectedReciterId, surah.id);
  }, [activeReciter?.id, currentReciter?.id, isPlaying, reciterId, surah.id]);

  useEffect(() => {
    preloadReciterPortraits(reciters, 10);
  }, [reciters]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.tadabburBackdrop,
          { opacity: backdropValues.opacity },
        ]}
      />
      <Animated.View
        {...playerGesture.panHandlers}
        style={[styles.gestureSurface, playerGesture.animatedStyle]}
      >
        <Animated.View
          style={[
            styles.gestureSurface,
            {
              opacity: surahOpacity,
              transform: [
                { translateX: surahTranslateX },
                { scale: surahScale },
              ],
            },
          ]}
        >
          <ScrollView
            contentContainerStyle={[
              styles.content,
              compact && styles.contentCompact,
            ]}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(event) => {
              scrollOffset.current = event.nativeEvent.contentOffset.y;
            }}
          >
            {transitionReciters ? (
              <ReciterHero
                previousReciter={transitionReciters.previous}
                nextReciter={transitionReciters.next}
                surahName={surah.transliteration}
                surahNumber={surah.id}
                surahArabicName={surah.arabicName}
                surahFrenchName={
                  language === "en"
                    ? englishSurahName || surah.transliteration
                    : surah.frenchName
                }
                verses={surah.verses}
                revelation={surah.revelationType}
                height={heroHeight}
                progressContent={<AudioProgress
                  progress={duration > 0 ? currentTime / duration : 0}
                  elapsed={formatPlaybackTime(currentTime)}
                  duration={formatPlaybackTime(duration)}
                  onSeek={(position) => {
                    if (duration > 0) void seekTo(position * duration).catch(() => undefined);
                  }}
                />}
                isPlaying={isPlaying}
                isFavorite={isFavorite}
                onFavorite={() => void toggleFavorite()}
                onBack={goBack}
                onMenu={() => setQuickMenuVisible(true)}
                onReciterPress={() =>
                  router.push({
                    pathname: "/listen/reciters",
                    params: { returnTo: `/listen/${surah.id}` },
                  })
                }
                onReciterDoubleTap={toggleReciterFavorite}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onRangeStartChange={(value) => {
                  setRangeStart(value);
                  if (value > rangeEnd) setRangeEnd(value);
                }}
                onRangeEndChange={setRangeEnd}
                onPlayRange={playVerseRange}
                onTogglePlay={handleTogglePlay}
                onStop={handleStop}
                onSkipBackward={handleSkipBackward}
                onSkipForward={handleSkipForward}
                onPrevious={handlePrevious}
                onNext={handleNext}
                previousDisabled={surah.id <= 1 && currentTime <= 3}
                nextDisabled={surah.id >= 114}
                transportDisabled={!isLoaded}
              />
            ) : null}
            <SyncedVerseList
              key="normal-verses"
              surahId={surah.id}
              reciterId={activeReciter?.id ?? reciterId}
              trackId={track?.id}
              audioUrl={track?.remoteUri ?? track?.source.uri}
              duration={duration}
              compact={compact}
              hidden={false}
              subscribeToPosition={subscribeToPosition}
              getCurrentPositionMs={getCurrentPositionMs}
              onTimelineReady={handleTimelineReady}
              onTadabburUpdate={handleTadabburUpdate}
            />
            <AudioPlayer
              optionsOnly
              onTogglePlay={handleTogglePlay}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onPlayLongPress={() => setQuickMenuVisible(true)}
            />
          </ScrollView>
        </Animated.View>
      </Animated.View>
      <PlayerQuickMenu
        visible={quickMenuVisible}
        reciters={reciters}
        currentSurahId={surah.id}
        currentReciterName={currentReciter?.name ?? activeReciter?.name}
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

function formatPlaybackTime(seconds: number) {
  const value = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  gestureSurface: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 30 },
  contentCompact: { paddingHorizontal: 12 },
  tadabburBackdrop: { backgroundColor: "rgba(0,0,0,0.18)" },
});
