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
import { typography } from "../../theme/typography";

type TeacherLevel = 0 | 1 | 2 | 3;
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

function concealed(text: string, level: TeacherLevel, revealedWordCount = 0) {
  if (level === 0) return text;
  const words = text.trim().split(/\s+/).filter(Boolean);
  return words
    .map((word, index) => {
      if (index < revealedWordCount) return word;
      if (level === 3) return "…";
      const shouldHide = level === 1 ? index % 3 === 1 : index % 2 === 1;
      return shouldHide ? "…" : word;
    })
    .join(" ");
}

function VerseSwipe({
  children,
  onPrevious,
  onNext,
}: {
  children: ReactNode;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const previousRef = useRef(onPrevious);
  const nextRef = useRef(onNext);
  const translateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    previousRef.current = onPrevious;
    nextRef.current = onNext;
  }, [onNext, onPrevious]);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 10 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        Math.abs(gesture.dx) > 10 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.2,
      onPanResponderMove: (_, gesture) => {
        const resistance = Math.min(1, 150 / Math.max(150, Math.abs(gesture.dx)));
        translateX.setValue(gesture.dx * resistance);
      },
      onPanResponderRelease: (_, gesture) => {
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
          }).start();
        });
      },
      onPanResponderTerminate: () => {
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
  const {
    surah: rawSurah,
    review,
    verse: rawVerse,
    end: rawEnd,
  } = useLocalSearchParams<{
    surah?: string;
    review?: string;
    verse?: string;
    end?: string;
  }>();
  const surahId = Math.max(1, Math.min(114, Number(rawSurah) || 112));
  const surah = SURAHS.find((item) => item.id === surahId) ?? SURAHS[111];
  const [verses, setVerses] = useState<readonly QuranFoundationVerse[]>([]);
  const [index, setIndex] = useState(Math.max(0, (Number(rawVerse) || 1) - 1));
  const endVerse = Math.max(1, Number(rawEnd) || Number.POSITIVE_INFINITY);
  const [teacherLevel, setTeacherLevel] = useState<TeacherLevel>(0);
  const [revealedWordCount, setRevealedWordCount] = useState(0);
  const [repeat, setRepeat] = useState<(typeof repetitions)[number]>(3);
  const [speed, setSpeed] = useState(0.75);
  const [saved, setSaved] = useState(false);
  const [masteredVerses, setMasteredVerses] = useState<number[]>([]);
  const [celebration, setCelebration] = useState<Celebration>(null);
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
  const screenFocused = useRef(false);
  const [audioError, setAudioError] = useState<string>();
  const [audioLoading, setAudioLoading] = useState(false);
  const [reciterModalVisible, setReciterModalVisible] = useState(false);
  const [selectedWordRange, setSelectedWordRange] = useState<[number, number] | null>(null);
  const [wordTimings, setWordTimings] = useState<readonly WordTimestamp[]>([]);
  const [activeAudioTiming, setActiveAudioTiming] = useState<{
    startMs: number;
    endMs: number;
    audioMode: AudioSourceMode;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void quranFoundationRepository
      .getVerses(surahId)
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
  }, [surahId]);

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
    setSelectedWordRange(null);
    setRevealedWordCount(0);
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
    )
      return;
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
  const currentText = verse?.textUthmani || "Chargement du verset…";
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
    return fromWords || "Phonétique indisponible pour ce verset.";
  }, [verse]);
  const teacherLabel = [
    "Texte complet",
    "Mots guidés",
    "Presque sans aide",
    "De mémoire",
  ][teacherLevel];
  const words = useMemo(
    () => currentText.trim().split(/\s+/).filter(Boolean).length,
    [currentText],
  );
  const currentVerseNumber = Number(verse?.verseKey.split(":")[1] ?? index + 1);
  const currentVerseMastered = masteredVerses.includes(currentVerseNumber);
  const allWordsRevealed = revealedWordCount >= words;
  const changeTeacherLevel = (level: TeacherLevel) => {
    setTeacherLevel(level);
    setRevealedWordCount(0);
  };
  const revealNextWord = () => {
    setRevealedWordCount((value) => Math.min(words, value + 1));
  };
  const syncPositionMs = activeAudioTiming
    ? getSyncPositionMs(
        audioPositionMilliseconds(verseAudioStatus.currentTime),
        activeAudioTiming.startMs,
        activeAudioTiming.audioMode,
      )
    : audioPositionMilliseconds(verseAudioStatus.currentTime);
  const activeWordState = getWordSyncState({
    positionMs: syncPositionMs,
    verseTimeline: wordTimings,
  });
  const activeWordPosition = activeWordState.activeWordPosition;
  const lastReadWordPosition =
    activeWordState.completedWordPositions.at(-1) ?? null;

  const listen = async () => {
    if (verseAudioStatus.playing) {
      stopVerseAudio();
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
      versePlayer.setPlaybackRate(speed);
      repeatsRemaining.current = repeat - 1;
      if (dedicatedSource && !selectedWordRange) {
        if (!screenFocused.current || requestId !== audioRequestId.current)
          return;
        await versePlayer.seekTo(0);
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
            if (repeatsRemaining.current <= 0) return;
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
      setAudioError(
        "Audio du verset indisponible. Réessayez avec un autre récitateur.",
      );
    }
  };

  const exitSession = useCallback(() => {
    stopVerseAudio();
    router.back();
  }, [stopVerseAudio]);

  const complete = async (difficulty: "easy" | "hard") => {
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
      reviewed: review === "1" ? 1 : 0,
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
      return;
    }
    if (index < verses.length - 1 && index + 1 < endVerse) {
      setIndex((value) => value + 1);
      changeTeacherLevel(0);
      setSaved(false);
    }
  };

  const closeCelebration = () => {
    if (celebration === "surah") {
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
      changeTeacherLevel(0);
      setSaved(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Pressable onPress={exitSession} style={styles.circle}>
            <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
          </Pressable>
          <View style={styles.topCopy}>
            <Text style={styles.title}>Session de mémorisation</Text>
            <Text style={styles.subtitle}>
              {review === "1"
                ? "Révision intelligente"
                : "Nouvel apprentissage"}
            </Text>
          </View>
          <View style={styles.versePill}>
            <Text style={styles.versePillText}>
              {index + 1}/{surah.verses}
            </Text>
          </View>
        </View>
        <View style={styles.surahBanner}>
          <Text style={styles.bannerName}>{surah.transliteration}</Text>
          <Text style={styles.bannerArabic}>{surah.arabicName}</Text>
          <Text style={styles.bannerMeta}>
            {surah.frenchName} · {words} mots à consolider
          </Text>
        </View>
        <View style={styles.encouragement}>
          <Ionicons name="sparkles" size={17} color={colors.goldLight} />
          <View style={styles.encouragementCopy}>
            <Text style={styles.encouragementText}>
              « Nous avons rendu le Coran facile pour la méditation. »
            </Text>
            <Text style={styles.encouragementSource}>Coran · 54:17</Text>
          </View>
        </View>
        <VerseSwipe
          onPrevious={() => {
            if (index > 0) {
              setIndex((value) => value - 1);
              changeTeacherLevel(0);
            }
          }}
          onNext={() => {
            if (index < verses.length - 1) {
              setIndex((value) => value + 1);
              changeTeacherLevel(0);
            }
          }}
        >
          <View
            style={[
              styles.verseCard,
              currentVerseMastered && styles.verseCardMastered,
            ]}
          >
            <LinearGradient
              colors={["rgba(75,36,93,0.93)", "rgba(19,12,31,0.99)"]}
              style={StyleSheet.absoluteFill}
            />
            {currentVerseMastered ? (
              <View style={styles.masteredBadge}>
                <Ionicons name="checkmark" size={15} color="#071B12" />
                <Text style={styles.masteredBadgeText}>Verset maîtrisé</Text>
              </View>
            ) : null}
            <Text style={styles.modeLabel}>
              MODE PROFESSEUR · {teacherLabel.toUpperCase()}
            </Text>
            {teacherLevel === 0 ? (
              <View style={styles.wordSelection}>
                <QuranArabicText
                  screenWidth={screenWidth}
                  preferredSize={33}
                  style={styles.arabicWordsLine}
                >
                  {currentText.trim().split(/\s+/).map((word, wordIndex, words) => {
                    const position = wordIndex + 1;
                    const selected = Boolean(
                      selectedWordRange &&
                        position >= selectedWordRange[0] &&
                        position <= selectedWordRange[1],
                    );
                    return (
                      <Text
                        key={`${verse?.verseKey}-${position}`}
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
                          text={`${word}${wordIndex < words.length - 1 ? " " : ""}`}
                          fontFamily={ARABIC_READING_FONT_FAMILY}
                          isActive={activeWordPosition === position}
                          isRead={
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
                    <Text style={styles.fullVerseButtonText}>Verset entier</Text>
                  </Pressable>
                ) : null}
              </View>
            ) : (
              <View style={styles.memoryModeBlock}>
                <Text selectable style={styles.arabic}>
                  {concealed(currentText, teacherLevel, revealedWordCount)}
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
                      {allWordsRevealed ? "Verset révélé" : "Mot suivant"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setRevealedWordCount(words)}
                    style={styles.memoryAction}
                  >
                    <Ionicons name="book-outline" size={16} color={colors.goldLight} />
                    <Text style={styles.memoryActionText}>Afficher le verset</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setRevealedWordCount(0)}
                    style={styles.memoryReset}
                  >
                    <Ionicons name="refresh" size={15} color={colors.textMuted} />
                  </Pressable>
                </View>
                <Text style={styles.memoryHint}>
                  Récitez de mémoire, puis révélez uniquement l’aide dont vous avez besoin.
                </Text>
              </View>
            )}
            <View style={styles.phoneticBlock}>
              <Text style={styles.contentEyebrow}>PHONÉTIQUE</Text>
              <Text selectable style={styles.phonetic}>
                {currentPhonetic}
              </Text>
            </View>
            <View style={styles.translationBlock}>
              <Text style={styles.contentEyebrow}>TRADUCTION</Text>
              <Text style={styles.translation}>
                {verse?.translation ||
                  "Écoutez attentivement, répétez puis récitez le passage avec assurance."}
              </Text>
            </View>
            <Text style={styles.swipeHint}>
              Glissez latéralement pour changer de verset
            </Text>
            <View style={styles.teacherButtons}>
              {([0, 1, 2, 3] as TeacherLevel[]).map((level) => (
                <Pressable
                  key={level}
                  onPress={() => changeTeacherLevel(level)}
                  style={[
                    styles.level,
                    teacherLevel === level && styles.levelActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.levelText,
                      teacherLevel === level && styles.levelTextActive,
                    ]}
                  >
                    {level + 1}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </VerseSwipe>
        <View style={styles.controls}>
          <Pressable
            onPress={() => setIndex((value) => Math.max(0, value - 1))}
            style={styles.controlSmall}
          >
            <Ionicons name="play-skip-back" size={20} color={colors.goldLight} />
          </Pressable>
          <Pressable
            onPress={() => void versePlayer.seekTo(Math.max(0, verseAudioStatus.currentTime - 10))}
            style={styles.controlSmall}
          >
            <Text style={styles.controlSmallText}>-10s</Text>
          </Pressable>
          <Pressable onPress={() => void listen()} style={styles.playRound}>
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
          <Pressable onPress={stopVerseAudio} style={styles.controlSmall}>
            <Ionicons name="stop" size={20} color={colors.goldLight} />
          </Pressable>
          <Pressable
            onPress={() => void versePlayer.seekTo(Math.max(0, verseAudioStatus.currentTime + 10))}
            style={styles.controlSmall}
          >
            <Text style={styles.controlSmallText}>+10s</Text>
          </Pressable>
          <Pressable
            onPress={() => setIndex((value) => Math.min(verses.length - 1, value + 1))}
            style={styles.controlSmall}
          >
            <Ionicons name="play-skip-forward" size={20} color={colors.goldLight} />
          </Pressable>
        </View>
        <View style={styles.reciterHeader}>
          <Text style={styles.controlTitle}>Récitateur</Text>
          <Pressable onPress={() => setReciterModalVisible(true)}>
            <Text style={styles.seeAllReciters}>Voir tous</Text>
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
            <Text style={styles.selectedReciterLabel}>RÉCITATEUR ACTUEL</Text>
            <Text style={styles.selectedReciterName}>{currentReciter?.name}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
        </Pressable>
        {audioError ? (
          <Text style={styles.audioError}>{audioError}</Text>
        ) : null}
        <Text style={styles.controlTitle}>Répéter automatiquement</Text>
        <View style={styles.repeatRow}>
          {repetitions.map((amount) => (
            <Pressable
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
          <View style={styles.pausePill}>
            <Ionicons name="flash-outline" size={14} color={colors.textMuted} />
            <Text style={styles.pauseText}>enchaînement rapide</Text>
          </View>
        </View>
        <View style={styles.evaluate}>
          <Text style={styles.evaluateTitle}>
            Comment s’est passée la récitation ?
          </Text>
          <Text style={styles.evaluateText}>
            Cela aide OUMMAH à choisir les prochaines révisions.
          </Text>
          <View style={styles.evaluateButtons}>
            <Pressable
              onPress={() => void complete("hard")}
              style={styles.hard}
            >
              <Ionicons name="refresh" size={16} color={colors.goldLight} />
              <Text style={styles.hardText}>À revoir</Text>
            </Pressable>
            <Pressable
              onPress={() => void complete("easy")}
              style={styles.easy}
            >
              <Ionicons name="checkmark" size={17} color={colors.background} />
              <Text style={styles.easyText}>
                {saved ? "Enregistré" : "Maîtrisé"}
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.nav}>
          <Pressable
            disabled={index === 0}
            onPress={() => {
              setIndex((value) => Math.max(0, value - 1));
              changeTeacherLevel(0);
            }}
            style={[styles.navButton, index === 0 && styles.dim]}
          >
            <Ionicons name="arrow-back" size={17} color={colors.goldLight} />
            <Text style={styles.navText}>Précédent</Text>
          </Pressable>
          <Pressable
            disabled={index >= verses.length - 1}
            onPress={() => {
              setIndex((value) => Math.min(verses.length - 1, value + 1));
              changeTeacherLevel(0);
            }}
            style={[styles.navButton, index >= verses.length - 1 && styles.dim]}
          >
            <Text style={styles.navText}>Suivant</Text>
            <Ionicons name="arrow-forward" size={17} color={colors.goldLight} />
          </Pressable>
        </View>
        {!verses.length ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.goldLight} />
            <Text style={styles.loadingText}>
              Préparation de votre passage…
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
                <Text style={styles.reciterModalTitle}>Choisir un récitateur</Text>
                <Text style={styles.reciterModalSubtitle}>Tous les récitateurs disponibles</Text>
              </View>
              <Pressable onPress={() => setReciterModalVisible(false)} style={styles.reciterModalClose}>
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
        onRequestClose={closeCelebration}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.celebrationCard}>
            <LinearGradient
              colors={
                celebration === "surah"
                  ? ["#352044", "#171020"]
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
                ? "SOURATE MAÎTRISÉE"
                : "VERSET MAÎTRISÉ"}
            </Text>
            <Text style={styles.celebrationTitle}>
              {celebration === "surah"
                ? `Mâ shâ Allah, ${surah.transliteration} est maîtrisée !`
                : "Mâ shâ Allah, continuez ainsi !"}
            </Text>
            <Text style={styles.celebrationBody}>
              {celebration === "surah"
                ? "Chaque verset de cette sourate est maintenant enregistré dans votre parcours. Une belle étape de votre Hifz."
                : `Le verset ${currentVerseNumber} est maintenant marqué d’un check vert dans votre progression.`}
            </Text>
            <Pressable
              onPress={closeCelebration}
              style={styles.celebrationButton}
            >
              <Text style={styles.celebrationButtonText}>
                {celebration === "surah"
                  ? "Voir ma progression"
                  : index < verses.length - 1
                    ? "Continuer"
                    : "Terminer"}
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
    borderColor: colors.borderSoft,
    backgroundColor: colors.purpleDeep,
  },
  topCopy: { flex: 1, marginLeft: 12 },
  title: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 22,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
  },
  versePill: {
    height: 31,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "rgba(81,41,99,0.62)",
  },
  versePillText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "800",
  },
  surahBanner: {
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
    backgroundColor: "rgba(42,23,56,0.90)",
  },
  bannerName: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 19,
    lineHeight: 23,
  },
  bannerArabic: {
    marginTop: 2,
    color: colors.goldMuted,
    fontFamily: typography.arabic,
    fontSize: 24,
    lineHeight: 34,
    textAlign: "right",
  },
  bannerMeta: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
  },
  encouragement: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.18)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  encouragementCopy: { flex: 1, marginLeft: 10 },
  encouragementText: {
    color: colors.textSecondary,
    fontFamily: typography.serifMedium,
    fontSize: 12,
    lineHeight: 17,
  },
  encouragementSource: {
    marginTop: 2,
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "700",
  },
  verseCard: {
    minHeight: 440,
    marginTop: 14,
    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 22,
    overflow: "hidden",
    justifyContent: "center",
    borderRadius: 30,
    borderWidth: 1.25,
    borderColor: "rgba(244,211,137,0.52)",
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
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 2,
    height: 29,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: "#62DEA0",
  },
  masteredBadgeText: {
    marginLeft: 4,
    color: "#071B12",
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "900",
  },
  modeLabel: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
    textAlign: "center",
  },
  arabic: {
    marginTop: 22,
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
    marginTop: 18,
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
    alignItems: "center",
  },
  memoryActions: {
    marginTop: 18,
    width: "100%",
    flexDirection: "row",
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
    maxWidth: 300,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
  },
  phoneticBlock: {
    marginTop: 20,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(236,203,125,0.22)",
    backgroundColor: "rgba(255,255,255,0.045)",
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
    fontFamily: typography.serifMedium,
    fontSize: 18,
    lineHeight: 28,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  translation: {
    marginTop: 7,
    color: "#F3EDF5",
    fontFamily: typography.sans,
    fontSize: 12.5,
    lineHeight: 19,
    textAlign: "center",
  },
  swipeHint: {
    marginTop: 12,
    color: "rgba(235,200,111,0.72)",
    fontFamily: typography.sans,
    fontSize: 7.5,
    textAlign: "center",
  },
  teacherButtons: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 7,
  },
  level: {
    width: 29,
    height: 29,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  levelActive: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  levelText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "800",
  },
  levelTextActive: { color: colors.background },
  controls: { marginTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 7 },
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
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  controlSmallText: {
    marginTop: 1,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 8,
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
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  repeat: {
    width: 48,
    height: 37,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  repeatActive: {
    borderColor: colors.goldLight,
    backgroundColor: "rgba(109,54,130,0.72)",
  },
  repeatText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  repeatTextActive: { color: colors.goldLight },
  pausePill: {
    height: 35,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  pauseText: {
    marginLeft: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8,
  },
  evaluate: {
    marginTop: 20,
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.25)",
    backgroundColor: "rgba(32,19,45,0.92)",
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
    fontSize: 8.8,
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
  nav: { marginTop: 13, flexDirection: "row", gap: 8 },
  navButton: {
    flex: 1,
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  navText: {
    marginHorizontal: 6,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
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
    borderColor: "rgba(227,181,90,0.38)",
    backgroundColor: "rgba(37,22,49,0.92)",
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
    backgroundColor: "#120B1B",
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
