import { Ionicons } from "@expo/vector-icons";
import {
  createAudioPlayer,
  setAudioModeAsync,
  useAudioPlayerStatus,
} from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useGlobalAudioPlayer } from "../../context/AudioPlayerProvider";
import { useReciter } from "../../context/ReciterProvider";
import { SURAHS } from "../../data/surahs";
import {
  dateKey,
  loadHifzState,
  saveHifzState,
  upsertHifzProgress,
} from "../../features/hifz/HifzStore";
import { quranFoundationRepository } from "../../features/quranfoundation/QuranFoundationRepository";
import type { QuranFoundationVerse } from "../../features/quranfoundation/QuranFoundationTypes";
import { ARABIC_READING_FONT_FAMILY } from "../../features/quran/ArabicReadingPresentation";
import { QuranArabicText } from "../../features/quran/QuranArabicText";
import { QuranWordHighlight } from "../../features/quran/QuranWordHighlight";
import {
  audioPositionMilliseconds,
  getSyncPositionMs,
  getWordSyncState,
  normalizeWordTimestamps,
  type AudioSourceMode,
  type WordTimestamp,
} from "../../features/quran/QuranWordSync";
import { colors } from "../../theme/colors";
import { goalProgressBridge } from "../../features/daily-goals/services/goalProgressBridge";
import { getCurrentUserProfile } from "../../features/profile/UserProfileRepository";
import { useI18n } from "../../i18n";
import { typography } from "../../theme/typography";

type TextVisibility = "full" | "masked" | "hidden";
const repetitions = [3, 5, 10] as const;
const REPEAT_GAP_MS = 450;

type Celebration = "verse" | "surah" | null;

function resolveVerseAudioUrl(value?: string) {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://verses.quran.foundation/${trimmed.replace(/^\/+/, "")}`;
}

function isMaskedWord(index: number, seed: number) {
  return (index + seed) % 3 === 1;
}

function isQuranicPauseMark(value: string) {
  return /^[\u06D6-\u06ED]+$/u.test(value);
}

function VerseSwipe({
  children,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
}: {
  children: ReactNode;
  onPrevious: () => void;
  onNext: () => void;
  canPrevious: boolean;
  canNext: boolean;
}) {
  const previousRef = useRef(onPrevious);
  const nextRef = useRef(onNext);
  const canPreviousRef = useRef(canPrevious);
  const canNextRef = useRef(canNext);
  const translateX = useRef(new Animated.Value(0)).current;
  const animatingRef = useRef(false);

  useEffect(() => {
    previousRef.current = onPrevious;
    nextRef.current = onNext;
    canPreviousRef.current = canPrevious;
    canNextRef.current = canNext;
  }, [canNext, canPrevious, onNext, onPrevious]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        !animatingRef.current &&
        Math.abs(gesture.dx) > 6 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.1,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        !animatingRef.current &&
        Math.abs(gesture.dx) > 6 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.1,
      onPanResponderMove: (_, gesture) => {
        const resistance = Math.min(1, 150 / Math.max(150, Math.abs(gesture.dx)));
        translateX.setValue(gesture.dx * resistance);
      },
      onPanResponderRelease: (_, gesture) => {
        if (animatingRef.current) return;
        const goNext = gesture.dx < -44 || gesture.vx < -0.42;
        const goPrevious = gesture.dx > 44 || gesture.vx > 0.42;

        if (!goNext && !goPrevious) {
          Animated.spring(translateX, {
            toValue: 0,
            damping: 18,
            stiffness: 210,
            mass: 0.75,
            useNativeDriver: true,
          }).start();
          return;
        }

        const navigate = (goNext && canNextRef.current) || (goPrevious && canPreviousRef.current);
        if (!navigate) {
          Animated.spring(translateX, {
            toValue: goNext ? -18 : 18,
            damping: 18,
            stiffness: 210,
            mass: 0.75,
            useNativeDriver: true,
          }).start(() => {
            Animated.spring(translateX, {
              toValue: 0,
              damping: 18,
              stiffness: 210,
              mass: 0.75,
              useNativeDriver: true,
            }).start();
          });
          return;
        }

        animatingRef.current = true;
        const exitTo = goNext ? -105 : 105;
        Animated.timing(translateX, {
          toValue: exitTo,
          duration: 115,
          useNativeDriver: true,
        }).start(() => {
          if (goNext) nextRef.current();
          else previousRef.current();

          translateX.setValue(goNext ? 34 : -34);
          Animated.spring(translateX, {
            toValue: 0,
            damping: 19,
            stiffness: 230,
            mass: 0.72,
            useNativeDriver: true,
          }).start(() => {
            animatingRef.current = false;
          });
        });
      },
      onPanResponderTerminate: () => {
        animatingRef.current = false;
        Animated.spring(translateX, {
          toValue: 0,
          damping: 18,
          stiffness: 210,
          mass: 0.75,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
    }),
  ).current;

  const opacity = translateX.interpolate({
    inputRange: [-150, 0, 150],
    outputRange: [0.72, 1, 0.72],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      {...responder.panHandlers}
      style={{ opacity, transform: [{ translateX }] }}
    >
      {children}
    </Animated.View>
  );
}

export default function HifzSessionScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { language, t } = useI18n();
  const params = useLocalSearchParams<{
    surah?: string;
    review?: string;
    verse?: string | string[];
    end?: string | string[];
    repeat?: string;
    reciter?: string;
    portion?: "full" | "portion";
  }>();
  const {
    surah: rawSurah,
    review,
    verse: rawVerse,
    end: rawEnd,
    repeat: rawRepeat,
    reciter: rawReciter,
    portion: rawPortion,
  } = params;
  const surahId = Math.max(1, Math.min(114, Number(rawSurah) || 112));
  const surah = SURAHS.find((item) => item.id === surahId) ?? SURAHS[111];
  const [verses, setVerses] = useState<readonly QuranFoundationVerse[]>([]);
  const numericParam = (value: string | string[] | undefined) => {
    const candidate = Array.isArray(value) ? value[0] : value;
    const parsed = Number(candidate);
    return Number.isFinite(parsed) ? Math.floor(parsed) : undefined;
  };
  const requestedVerse = numericParam(rawVerse);
  const currentVerse = requestedVerse !== undefined && requestedVerse >= 1
    ? requestedVerse
    : 1;
  const startVerse = Math.min(surah.verses, currentVerse);
  const requestedEnd = numericParam(rawEnd);
  const endVerse = requestedEnd !== undefined && requestedEnd >= startVerse
    ? Math.min(surah.verses, requestedEnd)
    : startVerse;
  const [index, setIndex] = useState(startVerse - 1);
  const [revealedWordCount, setRevealedWordCount] = useState(0);
  const [repeat, setRepeat] = useState<(typeof repetitions)[number]>(3);
  const [speed, setSpeed] = useState(0.75);
  const [saved, setSaved] = useState(false);
  const [masteredVerses, setMasteredVerses] = useState<number[]>([]);
  const [celebration, setCelebration] = useState<Celebration>(null);
  const [displayName, setDisplayName] = useState("");
  const { pause: pauseQuranAudio } = useGlobalAudioPlayer();
  const { currentReciter, reciters, setCurrentReciter } = useReciter();
  const [versePlayer] = useState(() =>
    createAudioPlayer(null, {
      updateInterval: 100,
      keepAudioSessionActive: false,
    }),
  );
  const verseAudioStatus = useAudioPlayerStatus(versePlayer);
  const repeatsRemaining = useRef(0);
  const clipTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const audioRequestId = useRef(0);
  const loadedReciterId = useRef<string | null>(null);
  const loadedVerseKey = useRef<string | null>(null);
  const resumePosition = useRef<number | null>(null);
  const screenFocused = useRef(false);
  const [audioError, setAudioError] = useState<string>();
  const [audioLoading, setAudioLoading] = useState(false);
  const [reciterModalVisible, setReciterModalVisible] = useState(false);
  const [selectedWordRange, setSelectedWordRange] = useState<[number, number] | null>(null);
  const [textVisibility, setTextVisibility] = useState<TextVisibility>("full");
  const [maskSeed, setMaskSeed] = useState(0);
  const validationInProgress = useRef(false);
  const reviewFinished = useRef(false);
  const [wordTimings, setWordTimings] = useState<readonly WordTimestamp[]>([]);
  const [activeAudioTiming, setActiveAudioTiming] = useState<{
    startMs: number;
    endMs: number;
    audioMode: AudioSourceMode;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void getCurrentUserProfile()
      .then((profile) => {
        if (active) setDisplayName(profile?.displayName?.trim() ?? "");
      })
      .catch(() => {
        if (active) setDisplayName("");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const requestedRepeat = Number(rawRepeat);
    if (repetitions.includes(requestedRepeat as (typeof repetitions)[number])) {
      setRepeat(requestedRepeat as (typeof repetitions)[number]);
    }
  }, [rawRepeat]);

  useEffect(() => {
    if (!rawReciter) return;
    const selected = reciters.find((reciter) => reciter.id === rawReciter);
    if (selected && selected.id !== currentReciter?.id) {
      void setCurrentReciter(selected);
    }
  }, [currentReciter?.id, rawReciter, reciters, setCurrentReciter]);

  useEffect(() => {
    let active = true;
    void quranFoundationRepository
      .getVerses(surahId, language)
      .then((next) => active && setVerses(next))
      .catch(() => active && setVerses([]));
    void loadHifzState().then((state) => {
      if (!active) return;
      setMasteredVerses(
        state.progress.find((item) => item.surahId === surahId)
          ?.learnedVerses ?? [],
      );
    });
    return () => {
      active = false;
    };
  }, [language, surahId]);

  useEffect(() => {
    if (verses.length) setIndex((value) => Math.min(value, verses.length - 1));
  }, [verses.length]);

  const stopVerseAudio = useCallback(() => {
    audioRequestId.current += 1;
    if (clipTimer.current) {
      clearTimeout(clipTimer.current);
      clipTimer.current = undefined;
    }
    repeatsRemaining.current = 0;
    try {
      versePlayer.pause();
      void versePlayer.seekTo(0).catch(() => undefined);
    } catch {}
  }, [versePlayer]);

  const pauseVerseAudio = useCallback(() => {
    if (clipTimer.current) {
      clearTimeout(clipTimer.current);
      clipTimer.current = undefined;
    }
    try {
      versePlayer.pause();
    } catch {}
  }, [versePlayer]);

  useFocusEffect(
    useCallback(() => {
      screenFocused.current = true;

      return () => {
        screenFocused.current = false;
        stopVerseAudio();
      };
    }, [stopVerseAudio]),
  );

  useEffect(() => {
    stopVerseAudio();
    loadedReciterId.current = null;
    loadedVerseKey.current = null;
    resumePosition.current = null;
    setSelectedWordRange(null);
    setSaved(false);
    setRevealedWordCount(0);
    setMaskSeed(0);
    setWordTimings([]);
    setActiveAudioTiming(null);
  }, [index, stopVerseAudio]);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "doNotMix",
    }).catch(() => undefined);
    return () => {
      stopVerseAudio();
      try {
        versePlayer.remove();
      } catch {}
    };
  }, [stopVerseAudio, versePlayer]);

  useEffect(() => {
    if (
      !screenFocused.current ||
      !verseAudioStatus.didJustFinish ||
      repeatsRemaining.current <= 0
    ) {
      if (screenFocused.current && verseAudioStatus.didJustFinish) {
        try {
          versePlayer.pause();
          void versePlayer.seekTo(0).catch(() => undefined);
        } catch {}
      }
      return;
    }
    const requestId = audioRequestId.current;
    repeatsRemaining.current -= 1;
    const timer = setTimeout(() => {
      if (!screenFocused.current || requestId !== audioRequestId.current) return;
      void versePlayer
        .seekTo(0)
        .then(() => {
          if (screenFocused.current && requestId === audioRequestId.current)
            versePlayer.play();
        })
        .catch(() => undefined);
    }, REPEAT_GAP_MS);
    return () => clearTimeout(timer);
  }, [verseAudioStatus.didJustFinish, versePlayer]);

  const verse = verses[index];
  const currentSessionVerse = Number(verse?.verseKey.split(":")[1] ?? index + 1);
  const canGoPrevious = currentSessionVerse > startVerse;
  const canGoNext = currentSessionVerse < endVerse;
  useEffect(() => {
    if (rawPortion !== "full" || !verse?.text) return;
    setSelectedWordRange([1, verse.text.trim().split(/\s+/).length]);
  }, [rawPortion, verse]);
  const currentText = verse?.textUthmani || t("hifz.session.loadingVerse");
  const textWords = useMemo(
    () => currentText.trim().split(/\s+/).filter(Boolean),
    [currentText],
  );
  const currentPhonetic = useMemo(() => {
    const direct = verse?.transliteration?.trim();
    if (direct) return direct;
    const fromWords = verse?.words
      ?.filter(
        (word) =>
          (word.charTypeName ?? word.char_type_name ?? "word") === "word",
      )
      .map((word) => word.transliteration?.text?.trim())
      .filter((value): value is string => Boolean(value))
      .join(" ")
      .trim();
    return fromWords || t("hifz.session.phoneticUnavailable");
  }, [t, verse]);
  const currentVerseNumber = Number(verse?.verseKey.split(":")[1] ?? index + 1);
  const currentVerseMastered = masteredVerses.includes(currentVerseNumber);
  let maskedSeen = 0;
  const maskedText = textWords.map((word, wordIndex) => {
    // Les signes de pause (ۚ, ۖ…) restent toujours visibles.
    const masked = !isQuranicPauseMark(word) && isMaskedWord(wordIndex, maskSeed);
    const revealed = masked && maskedSeen++ < revealedWordCount;
    return { word, wordIndex, masked, revealed };
  });
  const maskedWordCount = maskedSeen;
  const revealNextWord = () => {
    setRevealedWordCount((value) => Math.min(maskedWordCount, value + 1));
  };
  const allWordsRevealed = revealedWordCount >= maskedWordCount;
  const visibilityLabel = {
    full: t("hifz.session.modeFull"),
    masked: t("hifz.session.modeMasked"),
    hidden: t("hifz.session.modeHidden"),
  } as const;
  const syncPositionMs = activeAudioTiming
    ? getSyncPositionMs(
        audioPositionMilliseconds(verseAudioStatus.currentTime),
        activeAudioTiming.startMs,
        activeAudioTiming.audioMode,
      )
    : audioPositionMilliseconds(verseAudioStatus.currentTime);
  const lastWordTiming = wordTimings.at(-1);
  const activePositionMs =
    lastWordTiming &&
    activeAudioTiming &&
    syncPositionMs >= lastWordTiming.startMs &&
    syncPositionMs <= activeAudioTiming.endMs &&
    !wordTimings.some(
      (word) => syncPositionMs >= word.startMs && syncPositionMs < word.endMs,
    )
      ? lastWordTiming.startMs
      : syncPositionMs;
  const activeWordState = getWordSyncState({
    positionMs: activePositionMs,
    verseTimeline: wordTimings,
  });
  const activeWordPosition = activeWordState.activeWordPosition;
  const lastReadWordPosition =
    activeWordPosition !== null
      ? activeWordPosition - 1
      : activeWordState.completedWordPositions.at(-1) ?? null;

  const listen = async () => {
    if (verseAudioStatus.playing) {
      pauseVerseAudio();
      return;
    }
    if (!verse || !currentReciter) return;
    const requestId = audioRequestId.current + 1;
    audioRequestId.current = requestId;
    setAudioError(undefined);
    pauseQuranAudio();
    try {
      await setAudioModeAsync({
        playsInSilentMode: true,
        shouldPlayInBackground: false,
        interruptionMode: "doNotMix",
      });
      if (!screenFocused.current || requestId !== audioRequestId.current) return;
      const recitation = await quranFoundationRepository.getRecitation(
        currentReciter.id,
        surahId,
      );
      if (!screenFocused.current || requestId !== audioRequestId.current) return;
      const file = recitation.audioFiles?.find(
        (item) => item.verseKey === verse.verseKey,
      );
      const dedicatedSource = resolveVerseAudioUrl(
        file?.audioUrl ?? file?.url ?? verse.audioUrl,
      );
      const timing = recitation.timestamps?.find(
        (item) => item.verseKey === verse.verseKey,
      );
      const normalizedWordTimings = normalizeWordTimestamps(
        timing ? [{ ...timing, verseId: currentVerseNumber, segments: timing.segments }] : [],
        Math.max(0, (timing?.timestampTo ?? 0) - (timing?.timestampFrom ?? 0)),
      );
      setWordTimings(normalizedWordTimings);
      const fullSource = resolveVerseAudioUrl(recitation.audioUrl);
      const source = dedicatedSource ?? fullSource;
      if (timing) {
        setActiveAudioTiming({
          startMs: timing.timestampFrom,
          endMs: timing.timestampTo,
          audioMode: dedicatedSource ? "single-verse" : "full-surah",
        });
      } else {
        setActiveAudioTiming(null);
      }
      if (!source) throw new Error("Le fichier de ce verset est indisponible.");
      if (clipTimer.current) clearTimeout(clipTimer.current);
      setAudioLoading(true);
      versePlayer.replace({ uri: source });
      const waitStartedAt = Date.now();
      while (!versePlayer.isLoaded && Date.now() - waitStartedAt < 12_000) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        if (!screenFocused.current || requestId !== audioRequestId.current) return;
      }
      if (!versePlayer.isLoaded) {
        throw new Error("Le fichier audio met trop de temps à charger.");
      }
      loadedReciterId.current = currentReciter.id;
      loadedVerseKey.current = verse.verseKey;
      versePlayer.setPlaybackRate(speed);
      repeatsRemaining.current = repeat - 1;
      if (dedicatedSource && !selectedWordRange) {
        if (!screenFocused.current || requestId !== audioRequestId.current)
          return;
        await versePlayer.seekTo(Math.max(0, resumePosition.current ?? 0));
        resumePosition.current = null;
        versePlayer.play();
        setAudioLoading(false);
        return;
      }
      if (
        !timing ||
        !Number.isFinite(timing.timestampFrom) ||
        !Number.isFinite(timing.timestampTo)
      )
        throw new Error("Le minutage de ce verset est indisponible.");
      const selectedTimings = selectedWordRange
        ? normalizedWordTimings.filter((item) => item.wordPosition >= selectedWordRange[0] && item.wordPosition <= selectedWordRange[1])
        : [];
      const absoluteStartMs = selectedTimings[0]?.startMs ?? timing.timestampFrom;
      const start = dedicatedSource
        ? Math.max(0, absoluteStartMs - timing.timestampFrom) / 1000
        : absoluteStartMs / 1000;
      const length = Math.max(
        0.2,
        ((selectedTimings.at(-1)?.endMs ?? timing.timestampTo) - (selectedTimings[0]?.startMs ?? timing.timestampFrom)) / 1000 / speed,
      );
      const playClip = () => {
        if (!screenFocused.current || requestId !== audioRequestId.current)
          return;
        void versePlayer
          .seekTo(start)
          .then(() => {
            if (screenFocused.current && requestId === audioRequestId.current)
              versePlayer.play();
          })
          .catch(() => undefined);
        clipTimer.current = setTimeout(
          () => {
            if (!screenFocused.current || requestId !== audioRequestId.current)
              return;
            versePlayer.pause();
            if (repeatsRemaining.current <= 0) {
              void versePlayer.seekTo(0).catch(() => undefined);
              return;
            }
            repeatsRemaining.current -= 1;
            clipTimer.current = setTimeout(playClip, REPEAT_GAP_MS);
          },
          length * 1000 + 100,
        );
      };
      clipTimer.current = setTimeout(playClip, 180);
      setAudioLoading(false);
    } catch {
      repeatsRemaining.current = 0;
      setAudioLoading(false);
      if (!screenFocused.current || requestId !== audioRequestId.current) return;
      setAudioError(t("hifz.session.audioUnavailable"));
    }
  };

  const exitSession = useCallback(() => {
    stopVerseAudio();
    router.back();
  }, [stopVerseAudio]);

  const complete = async (difficulty: "easy" | "hard") => {
    if (validationInProgress.current || saved) return;
    validationInProgress.current = true;
    const state = await loadHifzState();
    const verseNumber = Number(verse?.verseKey.split(":")[1] ?? index + 1);
    const now = new Date();
    const next = upsertHifzProgress(state, surahId, (current) => ({
      ...current,
      learnedVerses:
        difficulty === "easy"
          ? [...new Set([...current.learnedVerses, verseNumber])]
          : current.learnedVerses,
      difficultVerses:
        difficulty === "hard"
          ? [...new Set([...current.difficultVerses, verseNumber])]
          : current.difficultVerses.filter((item) => item !== verseNumber),
      reviewCount: current.reviewCount + 1,
      lastStudiedAt: now.toISOString(),
      nextReviewAt: new Date(
        now.getTime() + (difficulty === "hard" ? 24 : 72) * 3600_000,
      ).toISOString(),
    }));
    const existing = next.sessions.find(
      (session) => session.date === dateKey(now),
    );
    const session = {
      date: dateKey(now),
      minutes: 3,
      learned: difficulty === "easy" ? 1 : 0,
      reviewed: 1,
      surahIds: [surahId],
    };
    next.sessions = existing
      ? next.sessions.map((item) =>
          item.date === existing.date
            ? {
                ...item,
                minutes: item.minutes + 3,
                learned: item.learned + session.learned,
                reviewed: item.reviewed + session.reviewed,
                surahIds: [...new Set([...item.surahIds, surahId])],
              }
            : item,
        )
      : [session, ...next.sessions].slice(0, 90);
    next.streak = Math.max(1, next.streak);
    await saveHifzState(next);
    goalProgressBridge.record({
      metric: "hifz_verses_learned",
      evidenceId: `${surahId}:${verseNumber}`,
    });
    goalProgressBridge.record({
      metric: "hifz_session_minutes",
      amount: 3,
      evidenceId: `${surahId}:${verseNumber}:${dateKey(now)}`,
    });
    setSaved(true);
    if (difficulty === "easy") {
      const learned =
        next.progress.find((item) => item.surahId === surahId)?.learnedVerses ??
        [];
      setMasteredVerses(learned);
      setCelebration(learned.length >= surah.verses ? "surah" : "verse");
      validationInProgress.current = false;
      return;
    }
    if (index < verses.length - 1 && index + 1 < endVerse) {
      setIndex((value) => value + 1);
      setSaved(false);
    }
    validationInProgress.current = false;
  };

  const finishReview = async () => {
    if (reviewFinished.current) return;
    reviewFinished.current = true;
    try {
      const now = new Date();
      const today = dateKey(now);
      const state = await loadHifzState();
      const next = {
        ...state,
        sessions: state.sessions.map((item) =>
          item.date === today
            ? { ...item, completed: true, completedAt: now.toISOString() }
            : item,
        ),
      };
      await saveHifzState(next);
      goalProgressBridge.record({
        metric: "hifz_review_completed",
        evidenceId: `hifz-review:${today}:${surahId}:${Number(verse?.verseKey.split(":")[1] ?? index + 1)}`,
      });
      void goalProgressBridge.flush().catch(() => undefined);
    } catch {
      reviewFinished.current = false;
    }
  };

  const closeCelebration = async () => {
    if (celebration === "surah") {
      await finishReview();
      setCelebration(null);
      exitSession();
      return;
    }
    const shouldAdvance =
      celebration === "verse" &&
      index < verses.length - 1 &&
      index + 1 < endVerse;
    setCelebration(null);
    if (shouldAdvance) {
      setIndex((value) => value + 1);
      setSaved(false);
      return;
    }
    await finishReview();
  };

  const goToPreviousVerse = () => {
    if (canGoPrevious) setIndex((value) => Math.max(startVerse - 1, value - 1));
  };
  const goToNextVerse = () => {
    if (canGoNext && index < verses.length - 1) {
      setIndex((value) => Math.min(endVerse - 1, verses.length - 1, value + 1));
    }
  };
  const toggleSpeed = () => {
    // La durée des extraits dépend de la vitesse : on coupe l'audio en cours.
    stopVerseAudio();
    setSpeed((value) => (value === 1 ? 0.75 : 1));
  };
  const rangeLength = endVerse - startVerse + 1;
  const sessionSubtitle = [
    review === "1" ? t("hifz.session.review") : t("hifz.session.newLearning"),
    t("hifz.session.verseLabel", { verse: currentVerseNumber }),
    rangeLength > 1
      ? t("hifz.session.rangeProgress", {
          current: currentSessionVerse - startVerse + 1,
          total: rangeLength,
        })
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Pressable
            accessibilityLabel={t("common.back")}
            onPress={exitSession}
            style={styles.circle}
          >
            <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
          </Pressable>
          <View style={styles.topCopy}>
            <Text numberOfLines={1} style={styles.title}>
              {surah.transliteration} · {surah.arabicName}
            </Text>
            <Text numberOfLines={1} style={styles.subtitle}>
              {sessionSubtitle}
            </Text>
          </View>
          <View style={styles.versePill}>
            <Text style={styles.versePillText}>
              {currentVerseNumber}/{surah.verses}
            </Text>
          </View>
        </View>
        <VerseSwipe
          canPrevious={canGoPrevious}
          canNext={canGoNext}
          onPrevious={goToPreviousVerse}
          onNext={goToNextVerse}
        >
          <View
            style={[
              styles.verseCard,
              currentVerseMastered && styles.verseCardMastered,
            ]}
          >
            <LinearGradient
              colors={["#1E1730", "#100C19"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.textVisibilityRow}>
              {(["full", "masked", "hidden"] as const).map((mode) => (
                <Pressable
                  accessibilityState={{ selected: textVisibility === mode }}
                  key={mode}
                  onPress={() => {
                    setTextVisibility(mode);
                    setRevealedWordCount(0);
                    if (mode === "masked") setMaskSeed((value) => (value + 1) % 3);
                  }}
                  style={[
                    styles.textVisibilityOption,
                    textVisibility === mode && styles.textVisibilityOptionActive,
                  ]}
                >
                  <Text
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    numberOfLines={1}
                    style={[
                      styles.textVisibilityText,
                      textVisibility === mode && styles.textVisibilityTextActive,
                    ]}
                  >
                    {visibilityLabel[mode]}
                  </Text>
                </Pressable>
              ))}
            </View>
            {currentVerseMastered ? (
              <View style={styles.masteredBadge}>
                <Ionicons name="checkmark" size={14} color="#071B12" />
                <Text style={styles.masteredBadgeText}>
                  {t("hifz.session.verseMastered")}
                </Text>
              </View>
            ) : null}
            {textVisibility === "hidden" ? (
              <View style={styles.memoryModeBlock}>
                <Text style={styles.hiddenText}>{t("hifz.session.hiddenHint")}</Text>
                <Pressable onPress={() => setTextVisibility("full")} style={styles.memoryAction}>
                  <Ionicons name="eye-outline" size={16} color={colors.goldLight} />
                  <Text style={styles.memoryActionText}>{t("hifz.session.showText")}</Text>
                </Pressable>
              </View>
            ) : textVisibility === "full" ? (
              <View style={styles.wordSelection}>
                {/* Signature feature: listen to one word or one passage. Shown before the verse, never hidden. */}
                <View style={[styles.wordFeature, selectedWordRange && styles.wordFeatureActive]}>
                  <View style={styles.wordFeatureIcon}>
                    <Ionicons name={selectedWordRange ? "headset" : "hand-left-outline"} size={20} color={selectedWordRange ? colors.background : colors.goldLight} />
                  </View>
                  <View style={styles.wordFeatureCopy}>
                    <Text style={[styles.wordFeatureTitle, selectedWordRange && styles.wordFeatureTitleActive]}>
                      {selectedWordRange
                        ? selectedWordRange[0] === selectedWordRange[1]
                          ? t("hifz.session.wordFeatureOne")
                          : t("hifz.session.wordFeatureRange", { from: selectedWordRange[0], to: selectedWordRange[1] })
                        : t("hifz.session.wordFeatureTitle")}
                    </Text>
                    <Text style={[styles.wordFeatureText, selectedWordRange && styles.wordFeatureTextActive]}>
                      {selectedWordRange ? t("hifz.session.wordFeatureExtend") : t("hifz.session.wordFeatureText")}
                    </Text>
                  </View>
                </View>
                <QuranArabicText
                  screenWidth={screenWidth}
                  preferredSize={33}
                  style={styles.arabicWordsLine}
                >
                  {textWords.map((word, wordIndex) => {
                    const isPauseMark = isQuranicPauseMark(word);
                    const position = textWords
                      .slice(0, wordIndex + 1)
                      .filter((item) => !isQuranicPauseMark(item)).length;
                    const selected = Boolean(
                      !isPauseMark &&
                        selectedWordRange &&
                        position >= selectedWordRange[0] &&
                        position <= selectedWordRange[1],
                    );
                    return (
                      <Text
                        key={`${verse?.verseKey}-${wordIndex}-${isPauseMark ? "quranic-sign" : "word"}`}
                        onPress={() =>
                          setSelectedWordRange((range) =>
                            range
                              ? [
                                  Math.min(range[0], position),
                                  Math.max(range[1], position),
                                ]
                              : [position, position],
                          )
                        }
                        style={[
                          styles.selectableWord,
                          selected && styles.selectableWordActive,
                        ]}
                      >
                        <QuranWordHighlight
                          text={`${word}${wordIndex < textWords.length - 1 ? " " : ""}`}
                          fontFamily={ARABIC_READING_FONT_FAMILY}
                          isActive={!isPauseMark && activeWordPosition === position}
                          isRead={
                            !isPauseMark &&
                            lastReadWordPosition !== null &&
                            position <= lastReadWordPosition
                          }
                        />
                      </Text>
                    );
                  })}
                </QuranArabicText>
                {selectedWordRange ? (
                  <Pressable onPress={() => setSelectedWordRange(null)} style={styles.fullVerseButton}>
                    <Text style={styles.fullVerseButtonText}>{t("hifz.session.wholeVerse")}</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View style={styles.memoryModeBlock}>
                <Text selectable style={styles.arabic}>
                  {maskedText.map(({ word, wordIndex, masked, revealed }) => (
                    <Text key={`${verse?.verseKey}-${wordIndex}`} style={revealed ? styles.revealedWord : undefined}>
                      {masked && !revealed ? "…" : word}{wordIndex < maskedText.length - 1 ? " " : ""}
                    </Text>
                  ))}
                </Text>
                <View style={styles.memoryActions}>
                  <Pressable
                    disabled={allWordsRevealed}
                    onPress={revealNextWord}
                    style={[
                      styles.memoryAction,
                      allWordsRevealed && styles.memoryActionDisabled,
                    ]}
                  >
                    <Ionicons name="eye-outline" size={16} color={colors.goldLight} />
                    <Text style={styles.memoryActionText}>
                      {allWordsRevealed ? t("hifz.session.verseRevealed") : t("hifz.session.nextWord")}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setRevealedWordCount(maskedWordCount)}
                    style={styles.memoryAction}
                  >
                    <Ionicons name="book-outline" size={16} color={colors.goldLight} />
                    <Text style={styles.memoryActionText}>{t("hifz.session.showVerse")}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityLabel={t("hifz.session.newMask")}
                    onPress={() => {
                      setMaskSeed((value) => (value + 1) % 3);
                      setRevealedWordCount(0);
                    }}
                    style={styles.memoryReset}
                  >
                    <Ionicons name="shuffle" size={16} color={colors.goldLight} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={t("hifz.session.hideAgain")}
                    onPress={() => setRevealedWordCount(0)}
                    style={styles.memoryReset}
                  >
                    <Ionicons name="eye-off-outline" size={16} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            )}
            <Text style={styles.cardHint}>
              {textVisibility === "masked" ? t("hifz.session.memoryHint") : null}
              {textVisibility === "masked" && endVerse > startVerse ? " · " : null}
              {endVerse > startVerse ? t("hifz.session.swipeHint") : null}
            </Text>
            {textVisibility === "full" ? (
              <View style={styles.phoneticBlock}>
                <Text style={styles.contentEyebrow}>{t("hifz.session.phonetic")}</Text>
                <Text selectable style={styles.phonetic}>
                  {currentPhonetic}
                </Text>
              </View>
            ) : null}
            <View style={styles.translationBlock}>
              <Text style={styles.contentEyebrow}>{t("hifz.session.translation")}</Text>
              <Text style={styles.translation}>
                {verse?.translation || t("hifz.session.translationFallback")}
              </Text>
            </View>
          </View>
        </VerseSwipe>
        <View style={styles.controls}>
          <Pressable
            accessibilityLabel={t("hifz.session.previousVerse")}
            disabled={!canGoPrevious}
            onPress={goToPreviousVerse}
            style={[styles.controlSmall, !canGoPrevious && styles.dim]}
          >
            <Ionicons name="play-skip-back" size={20} color={colors.goldLight} />
          </Pressable>
          <Pressable
            accessibilityLabel={t("hifz.session.stop")}
            onPress={stopVerseAudio}
            style={styles.controlSmall}
          >
            <Ionicons name="stop" size={20} color={colors.goldLight} />
          </Pressable>
          <Pressable
            accessibilityLabel={verseAudioStatus.playing ? t("hifz.session.pause") : t("hifz.session.play")}
            onPress={() => void listen()}
            style={styles.playRound}
          >
            {audioLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Ionicons
                name={verseAudioStatus.playing ? "pause" : "play"}
                size={25}
                color={colors.background}
              />
            )}
          </Pressable>
          <Pressable
            accessibilityLabel={t("hifz.session.speedAccessibility")}
            onPress={toggleSpeed}
            style={styles.controlSmall}
          >
            <Text style={styles.controlSmallText}>
              {speed === 1 ? "1×" : t("hifz.session.speedSlow")}
            </Text>
          </Pressable>
          <Pressable
            accessibilityLabel={t("hifz.session.nextVerse")}
            disabled={!canGoNext || index >= verses.length - 1}
            onPress={goToNextVerse}
            style={[
              styles.controlSmall,
              (!canGoNext || index >= verses.length - 1) && styles.dim,
            ]}
          >
            <Ionicons name="play-skip-forward" size={20} color={colors.goldLight} />
          </Pressable>
        </View>
        <View style={styles.repeatRow}>
          <Text style={styles.repeatLabel}>{t("hifz.session.repeat")}</Text>
          {repetitions.map((amount) => (
            <Pressable
              accessibilityState={{ selected: repeat === amount }}
              key={amount}
              onPress={() => setRepeat(amount)}
              style={[styles.repeat, repeat === amount && styles.repeatActive]}
            >
              <Text
                style={[
                  styles.repeatText,
                  repeat === amount && styles.repeatTextActive,
                ]}
              >
                {amount}×
              </Text>
            </Pressable>
          ))}
        </View>
        {audioError ? (
          <Text style={styles.audioError}>{audioError}</Text>
        ) : null}
        <View style={styles.evaluate}>
          <Text style={styles.evaluateTitle}>
            {t("hifz.session.evaluateTitle")}
          </Text>
          <Text style={styles.evaluateText}>
            {t("hifz.session.evaluateText")}
          </Text>
          <View style={styles.evaluateButtons}>
            <Pressable
              onPress={() => void complete("hard")}
              style={styles.hard}
            >
              <Ionicons name="refresh" size={16} color={colors.goldLight} />
              <Text style={styles.hardText}>{t("hifz.session.hard")}</Text>
            </Pressable>
            <Pressable
              onPress={() => void complete("easy")}
              style={styles.easy}
            >
              <Ionicons name="checkmark" size={17} color={colors.background} />
              <Text style={styles.easyText}>
                {saved ? t("hifz.session.saved") : t("hifz.session.easy")}
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.reciterHeader}>
          <Text style={styles.controlTitle}>{t("hifz.session.reciter")}</Text>
          <Pressable onPress={() => setReciterModalVisible(true)}>
            <Text style={styles.seeAllReciters}>{t("hifz.session.seeAll")}</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => setReciterModalVisible(true)}
          style={styles.selectedReciterCard}
        >
          {currentReciter?.image ? (
            <Image source={currentReciter.image} style={styles.selectedReciterImage} />
          ) : (
            <View style={styles.selectedReciterFallback}>
              <Ionicons name="person" size={22} color={colors.goldLight} />
            </View>
          )}
          <View style={styles.selectedReciterCopy}>
            <Text style={styles.selectedReciterLabel}>{t("hifz.session.currentReciter")}</Text>
            <Text style={styles.selectedReciterName}>{currentReciter?.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
        </Pressable>
        {!verses.length ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.goldLight} />
            <Text style={styles.loadingText}>
              {t("hifz.session.preparing")}
            </Text>
          </View>
        ) : null}
      </ScrollView>
      <Modal
        visible={reciterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setReciterModalVisible(false)}
      >
        <View style={styles.reciterModalBackdrop}>
          <View style={styles.reciterModalCard}>
            <View style={styles.reciterModalHeader}>
              <View>
                <Text style={styles.reciterModalTitle}>{t("hifz.session.chooseReciter")}</Text>
                <Text style={styles.reciterModalSubtitle}>{t("hifz.session.allReciters")}</Text>
              </View>
              <Pressable accessibilityLabel={t("hifz.session.close")} onPress={() => setReciterModalVisible(false)} style={styles.reciterModalClose}>
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {reciters.map((reciter) => {
                const selected = currentReciter?.id === reciter.id;
                return (
                  <Pressable
                    key={reciter.id}
                    onPress={() => {
                      resumePosition.current = verseAudioStatus.currentTime;
                      loadedReciterId.current = null;
                      loadedVerseKey.current = null;
                      setWordTimings([]);
                      setActiveAudioTiming(null);
                      stopVerseAudio();
                      void setCurrentReciter(reciter);
                      setReciterModalVisible(false);
                    }}
                    style={[styles.reciterModalRow, selected && styles.reciterModalRowSelected]}
                  >
                    {reciter.image ? (
                      <Image source={reciter.image} style={styles.reciterModalImage} />
                    ) : (
                      <View style={styles.reciterModalImageFallback}>
                        <Ionicons name="person" size={20} color={colors.goldLight} />
                      </View>
                    )}
                    <Text style={styles.reciterModalName}>{reciter.name}</Text>
                    {selected ? (
                      <Ionicons name="checkmark-circle" size={22} color={colors.goldLight} />
                    ) : (
                      <Ionicons name="play-circle-outline" size={22} color={colors.textMuted} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal
        visible={celebration !== null}
        transparent
        animationType="fade"
        onRequestClose={() => void closeCelebration()}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.celebrationCard}>
            <LinearGradient
              colors={
                celebration === "surah"
                  ? ["#2A2140", "#151022"]
                  : ["#203C31", "#111C18"]
              }
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.celebrationIcon,
                celebration === "surah" && styles.celebrationIconSurah,
              ]}
            >
              <Ionicons
                name={celebration === "surah" ? "trophy" : "checkmark"}
                size={36}
                color={celebration === "surah" ? colors.goldLight : "#071B12"}
              />
            </View>
            <Text style={styles.celebrationEyebrow}>
              {celebration === "surah"
                ? t("hifz.session.surahMasteredEyebrow")
                : t("hifz.session.verseMasteredEyebrow")}
            </Text>
            <Text style={styles.celebrationTitle}>
              {celebration === "surah"
                ? t("hifz.session.surahMasteredTitle", { surah: surah.transliteration })
                : displayName
                  ? t("hifz.session.verseMasteredTitleNamed", { name: displayName })
                  : t("hifz.session.verseMasteredTitle")}
            </Text>
            <Text style={styles.celebrationBody}>
              {celebration === "surah"
                ? t("hifz.session.surahMasteredBody")
                : t("hifz.session.verseMasteredBody", { verse: currentVerseNumber })}
            </Text>
            <Pressable
              onPress={() => void closeCelebration()}
              style={styles.celebrationButton}
            >
              <Text style={styles.celebrationButtonText}>
                {celebration === "surah"
                  ? t("hifz.session.seeProgress")
                  : index < verses.length - 1 && index + 1 < endVerse
                    ? t("hifz.session.continue")
                    : t("hifz.session.finish")}
              </Text>
              <Ionicons
                name="arrow-forward"
                size={17}
                color={colors.background}
              />
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 14, paddingBottom: 120 },
  top: { height: 70, flexDirection: "row", alignItems: "center" },
  circle: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
  },
  topCopy: { flex: 1, marginLeft: 12 },
  title: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 22,
  },
  subtitle: {
    marginTop: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  versePill: {
    height: 31,
    marginLeft: 8,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#1E1730",
  },
  versePillText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "800",
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  verseCard: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 18,
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 14,
  },
  verseCardMastered: {
    borderColor: "rgba(80,220,150,0.72)",
    shadowColor: "#50DC96",
    shadowOpacity: 0.28,
    shadowRadius: 13,
  },
  masteredBadge: {
    marginTop: 12,
    alignSelf: "center",
    height: 26,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: "#62DEA0",
  },
  masteredBadgeText: {
    marginLeft: 4,
    color: "#071B12",
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "900",
  },
  arabic: {
    marginTop: 16,
    color: "#FFF9EF",
    fontFamily: ARABIC_READING_FONT_FAMILY,
    fontSize: 33,
    lineHeight: 57,
    textAlign: "center",
    writingDirection: "rtl",
    textShadowColor: "rgba(227,181,90,0.22)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 7,
  },
  wordSelection: {
    marginTop: 14,
    alignItems: "stretch",
  },
  arabicWordsLine: {
    paddingHorizontal: 4,
    textAlign: "right",
    writingDirection: "rtl",
  },
  selectableWord: {
    textDecorationLine: "none",
  },
  selectableWordActive: {
    textDecorationLine: "underline",
    textDecorationColor: "rgba(227,181,90,0.72)",
  },
  wordFeature: {
    marginBottom: 14,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.55)",
    backgroundColor: "rgba(227,181,90,0.10)",
  },
  wordFeatureActive: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  wordFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(227,181,90,0.16)",
  },
  wordFeatureCopy: { flex: 1 },
  wordFeatureTitle: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 16, fontWeight: "800" },
  wordFeatureTitleActive: { color: colors.background },
  wordFeatureText: { marginTop: 2, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13.5, lineHeight: 18 },
  wordFeatureTextActive: { color: "rgba(8,7,19,0.72)" },
  fullVerseButton: {
    width: "100%",
    marginTop: 8,
    alignItems: "center",
  },
  fullVerseButtonText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "800",
  },
  memoryModeBlock: {
    width: "100%",
    marginTop: 4,
    alignItems: "center",
  },
  memoryActions: {
    marginTop: 14,
    width: "100%",
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  memoryAction: {
    minHeight: 40,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.32)",
    backgroundColor: "rgba(227,181,90,0.08)",
  },
  memoryActionDisabled: {
    opacity: 0.48,
  },
  memoryActionText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  memoryReset: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  memoryHint: {
    marginTop: 10,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    textAlign: "center",
  },
  hiddenText: {
    marginTop: 26,
    marginBottom: 14,
    maxWidth: 280,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  phoneticBlock: {
    marginTop: 14,
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(236,203,125,0.18)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  translationBlock: {
    marginTop: 10,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(5,3,11,0.24)",
  },
  contentEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 1.05,
    textAlign: "center",
  },
  phonetic: {
    marginTop: 9,
    color: "#FFFDF8",
    fontFamily: typography.sans,
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  translation: {
    marginTop: 7,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: "center",
  },
  cardHint: {
    marginTop: 12,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center",
  },
  textVisibilityRow: {
    padding: 4,
    flexDirection: "row",
    gap: 4,
    borderRadius: 16,
    backgroundColor: "rgba(8,7,19,0.72)",
  },
  textVisibilityOption: {
    flex: 1,
    minHeight: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    borderRadius: 12,
  },
  textVisibilityOptionActive: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  textVisibilityText: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "center",
  },
  textVisibilityTextActive: {
    color: colors.background,
  },
  revealedWord: { color: colors.goldLight },
  controls: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 7 },
  reciterRow: { gap: 8, paddingVertical: 8 },
  reciterChoice: {
    maxWidth: 150,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  reciterChoiceActive: {
    borderColor: colors.goldLight,
    backgroundColor: "rgba(227,181,90,0.18)",
  },
  reciterChoiceText: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 10,
  },
  play: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.goldLight,
  },
  playText: {
    marginLeft: 7,
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  stopControl: {
    width: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(255,238,219,0.28)",
    backgroundColor: "rgba(74,38,72,0.88)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 5,
  },
  stopControlText: {
    marginTop: 1,
    color: "#FFF8EE",
    fontFamily: typography.sans,
    fontSize: 7.5,
    fontWeight: "800",
  },
  controlPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  controlSmall: {
    flex: 1,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
  },
  controlSmallText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "800",
  },
  audioError: {
    marginTop: 7,
    color: "#E8A4A4",
    fontFamily: typography.sans,
    fontSize: 8,
    textAlign: "center",
  },
  controlTitle: {
    marginTop: 19,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 19,
  },
  repeatRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  repeatLabel: {
    marginRight: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  repeat: {
    width: 48,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
  },
  repeatActive: {
    borderColor: colors.goldLight,
    backgroundColor: "rgba(227,181,90,0.14)",
  },
  repeatText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  repeatTextActive: { color: colors.goldLight },
  evaluate: {
    marginTop: 16,
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
  },
  evaluateTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  evaluateText: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  evaluateButtons: { height: 42, marginTop: 12, flexDirection: "row", gap: 8 },
  hard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.40)",
  },
  hardText: {
    marginLeft: 6,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  easy: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.goldLight,
  },
  easyText: {
    marginLeft: 6,
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  dim: { opacity: 0.35 },
  loading: { marginTop: 20, alignItems: "center" },
  loadingText: {
    marginTop: 7,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
  },
  playRound: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    backgroundColor: colors.goldLight,
  },
  reciterHeader: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  seeAllReciters: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "800",
  },
  selectedReciterCard: {
    marginTop: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
  },
  selectedReciterImage: { width: 52, height: 52, borderRadius: 26 },
  selectedReciterFallback: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: "rgba(227,181,90,0.12)",
  },
  selectedReciterCopy: { flex: 1, marginLeft: 12 },
  selectedReciterLabel: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  selectedReciterName: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 15,
    fontWeight: "700",
  },
  reciterModalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(4,2,8,0.78)",
  },
  reciterModalCard: {
    maxHeight: "82%",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
    backgroundColor: "#100C19",
  },
  reciterModalHeader: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  reciterModalTitle: {
    color: colors.text,
    fontFamily: typography.serif,
    fontSize: 24,
  },
  reciterModalSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
  },
  reciterModalClose: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  reciterModalRow: {
    minHeight: 72,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.10)",
  },
  reciterModalRowSelected: {
    borderRadius: 18,
    borderBottomColor: "transparent",
    backgroundColor: "rgba(227,181,90,0.12)",
  },
  reciterModalImage: { width: 48, height: 48, borderRadius: 24 },
  reciterModalImageFallback: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "rgba(227,181,90,0.10)",
  },
  reciterModalName: {
    flex: 1,
    marginHorizontal: 12,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 14,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(4,2,8,0.84)",
  },
  celebrationCard: {
    width: "100%",
    maxWidth: 390,
    paddingHorizontal: 24,
    paddingVertical: 28,
    overflow: "hidden",
    alignItems: "center",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(244,211,137,0.42)",
    shadowColor: "#EBCB79",
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 16,
  },
  celebrationIcon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor: "#62DEA0",
    shadowColor: "#62DEA0",
    shadowOpacity: 0.55,
    shadowRadius: 18,
  },
  celebrationIconSurah: {
    backgroundColor: "rgba(227,181,90,0.13)",
    borderWidth: 1,
    borderColor: colors.goldLight,
  },
  celebrationEyebrow: {
    marginTop: 18,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
  },
  celebrationTitle: {
    marginTop: 8,
    color: "#FFF9EF",
    fontFamily: typography.serifSemibold,
    fontSize: 25,
    lineHeight: 31,
    textAlign: "center",
  },
  celebrationBody: {
    marginTop: 10,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
    lineHeight: 18,
    textAlign: "center",
  },
  celebrationButton: {
    height: 48,
    marginTop: 22,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: colors.goldLight,
  },
  celebrationButtonText: {
    marginRight: 8,
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "900",
  },
});
