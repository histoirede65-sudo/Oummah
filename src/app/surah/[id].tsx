import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { createAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { router, useLocalSearchParams } from "expo-router";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ListRenderItem,
  type ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useGlobalAudioPlayer } from "../../context/AudioPlayerProvider";
import { useReciter } from "../../context/ReciterProvider";
import { offlineRepository } from "../../core/offline";
import { SURAHS } from "../../data/surahs";
import { ARABIC_READING_FONT_FAMILY } from "../../features/quran/ArabicReadingPresentation";
import { QuranArabicText } from "../../features/quran/QuranArabicText";
import { QuranWordHighlight } from "../../features/quran/QuranWordHighlight";
import {
  audioPositionMilliseconds,
  getSyncPositionMs,
  getWordSyncState,
  isQuranicPauseMark,
  normalizeWordTimestamps,
  type AudioSourceMode,
} from "../../features/quran/QuranWordSync";
import {
  DEFAULT_READING_PREFERENCES,
  readingPreferencesStore,
  type ReadingMode,
  type ReadingPreferences,
} from "../../features/quran/ReadingPreferences";
import { readingQuranRepository } from "../../features/quran/ReadingQuranRepository";
import { sanitizeTranslationText } from "../../features/quran/TranslationText";
import { quranFoundationRepository } from "../../features/quranfoundation/QuranFoundationRepository";
import { goalProgressBridge } from "../../features/daily-goals/services/goalProgressBridge";
import { loadReadConfirmations, onLocalMidnight, setReadConfirmation } from "../../features/reading-progress/ReadingValidationStore";
import type {
  QuranFoundationRecitation,
  QuranFoundationVerse,
} from "../../features/quranfoundation/QuranFoundationTypes";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import QuranReciterSelector from "../../components/quran/QuranReciterSelector";
import { WasilContextButton } from "../../components/wasil/WasilContextButton";
import { useI18n, type TranslationKey } from "../../i18n";
const modes: { id: ReadingMode; labelKey: TranslationKey }[] = [
  { id: "arabic", labelKey: "surahReader.arabic" },
  { id: "arabic-translation", labelKey: "surahReader.arabicTranslation" },
  { id: "arabic-transliteration", labelKey: "surahReader.arabicTransliteration" },
  { id: "translation", labelKey: "surahReader.translation" },
  { id: "mushaf", labelKey: "surahReader.mushaf" },
];

function resolveVerseAudioUrl(value?: string) {
  if (!value) return undefined;
  if (/^https?:\/\//.test(value)) return value;
  return `https://verses.quran.foundation/${value.replace(/^\/+/, "")}`;
}

type VerseTimeline = NonNullable<
  QuranFoundationRecitation["timestamps"]
>[number];

function waitForAudioCondition(
  condition: () => boolean,
  isCurrent: () => boolean,
  timeoutMs: number,
) {
  return new Promise<boolean>((resolve) => {
    const startedAt = Date.now();
    const check = () => {
      if (!isCurrent()) return resolve(false);
      if (condition()) return resolve(true);
      if (Date.now() - startedAt >= timeoutMs) return resolve(false);
      setTimeout(check, 20);
    };
    check();
  });
}

function replaceAndWaitForAudioSource(
  player: ReturnType<typeof createAudioPlayer>,
  audioUrl: string,
  isCurrent: () => boolean,
  timeoutMs: number,
) {
  return new Promise<boolean>((resolve) => {
    let settled = false;
    let sawUnloaded = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      subscription.remove();
      resolve(ready);
    };
    const subscription = player.addListener(
      "playbackStatusUpdate",
      (status) => {
        if (!isCurrent()) return finish(false);
        if (!status.isLoaded) {
          sawUnloaded = true;
          return;
        }
        if (sawUnloaded || status.currentTime <= 0.1) finish(true);
      },
    );
    const timeout = setTimeout(() => finish(false), timeoutMs);
    player.replace({ uri: audioUrl });
  });
}

const VerseRow = memo(function VerseRow({
  verse,
  settings,
  screenWidth,
  onListen,
  onOpenTafsir,
  onConfirmRead,
  isRead,
  isSavingRead,
  isPlaying,
  isActive,
  activeWordPosition,
  lastReadWordPosition,
  isWordSyncUnavailable,
  showLocation,
}: {
  verse: QuranFoundationVerse;
  settings: ReadingPreferences;
  screenWidth: number;
  onListen: (verse: QuranFoundationVerse) => void;
  onOpenTafsir: (verse: QuranFoundationVerse) => void;
  onConfirmRead: (verse: QuranFoundationVerse) => void;
  isRead: boolean;
  isSavingRead: boolean;
  isPlaying: boolean;
  isActive: boolean;
  activeWordPosition: number | null;
  lastReadWordPosition: number | null;
  isWordSyncUnavailable: boolean;
  showLocation: boolean;
}) {
  const { t } = useI18n();
  const showArabic = settings.mode !== "translation";
  const showTranslation =
    settings.mode === "arabic-translation" || settings.mode === "translation";
  const showTransliteration =
    settings.showTransliteration || settings.mode === "arabic-transliteration";
  const transliterationSize =
    screenWidth < 375 ? 16 : screenWidth < 430 ? 17 : 18;
  const arabicWords = useMemo(
    () =>
      verse.textUthmani.replace(/\s+/g, " ").trim().split(" ").filter(Boolean),
    [verse.textUthmani],
  );
  const officialTranslation =
    sanitizeTranslationText(
      verse.translation || verse.translations?.[0]?.text,
    ) || t("surahReader.translationUnavailable");
  return (
    <View
      style={[
        styles.verse,
        settings.columnWidth === "wide" && styles.verseWide,
        isActive && styles.verseActive,
      ]}
    >
      <View style={styles.verseTop}>
        <View style={styles.number}>
          <Text style={styles.numberText}>{verse.id}</Text>
        </View>
        {showLocation ? (
          <Text style={styles.location}>
            {t("surahReader.verseLocation", {
              juz: verse.juzNumber || "—",
              page: verse.pageNumber || "—",
            })}
          </Text>
        ) : null}
        <Pressable
          accessibilityLabel={t("surahReader.listenVerse", { verse: verse.id })}
          onPress={() => onListen(verse)}
          hitSlop={10}
          style={styles.listenIcon}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={16}
            color={colors.goldLight}
          />
        </Pressable>
        <WasilContextButton
          accessibilityLabel={t("surahReader.wasilAccessibility")}
          compact
          prompt={t("surahReader.wasilPrompt", {
            verseKey: verse.verseKey,
            arabic: verse.textUthmani,
            translation:
              sanitizeTranslationText(
                verse.translation || verse.translations?.[0]?.text,
              ) || t("surahReader.translationUnavailable"),
          })}
        />
      </View>
      {showArabic ? (
        <QuranArabicText
          selectable
          screenWidth={screenWidth}
          preferredSize={48}
        >
          {isActive ? (() => {
            let visualWordPosition = 0;
            return arabicWords.map((word, index) => {
              const isPauseMark = isQuranicPauseMark(word);
              const wordPosition = isPauseMark ? null : ++visualWordPosition;
              return (
                <QuranWordHighlight
                  key={`${index}-${word}`}
                  text={`${word}${index < arabicWords.length - 1 ? " " : ""}`}
                  fontFamily={ARABIC_READING_FONT_FAMILY}
                  isActive={wordPosition !== null && wordPosition === activeWordPosition}
                  isRead={
                    wordPosition !== null &&
                    lastReadWordPosition !== null &&
                    wordPosition <= lastReadWordPosition
                  }
                />
              );
            });
          })() : verse.textUthmani}
        </QuranArabicText>
      ) : null}
      {isWordSyncUnavailable ? (
        <Text style={styles.syncUnavailable}>
          {t("surahReader.wordSyncUnavailable")}
        </Text>
      ) : null}
      {showTransliteration ? (
        <Text
          selectable
          style={[styles.transliteration, { fontSize: transliterationSize }]}
        >
          {verse.transliteration || t("surahReader.transliterationUnavailable")}
        </Text>
      ) : null}
      {showTranslation ? (
        <View style={styles.translationContainer}>
          <Text
            numberOfLines={0}
            style={[
              styles.translation,
              {
                fontSize: settings.translationSize,
                lineHeight: settings.translationSize * 1.55,
              },
            ]}
          >
            {officialTranslation}
          </Text>
        </View>
      ) : null}

      <View style={styles.verseActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRead ? t("surahReader.unmarkVerseReadLabel", { verse: verse.id }) : t("surahReader.markVerseReadLabel", { verse: verse.id })}
          accessibilityState={{ checked: isRead }}
          disabled={isSavingRead}
          onPress={() => onConfirmRead(verse)}
          style={({ pressed }) => [styles.verseAction, isRead && styles.verseActionDone, pressed && styles.tafsirButtonPressed]}
        >
          <Ionicons name={isRead ? "checkmark-circle" : "ellipse-outline"} size={18} color={isRead ? colors.success : colors.goldLight} />
          <Text style={[styles.verseActionText, isRead && styles.verseActionTextDone]}>
            {t(isRead ? "surahReader.verseReadShort" : "surahReader.markVerseReadShort")}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("surahReader.understandVerseLabel", { verse: verse.verseKey })}
          onPress={(event) => {
            event.stopPropagation();
            onOpenTafsir(verse);
          }}
          style={({ pressed }) => [styles.verseAction, pressed && styles.tafsirButtonPressed]}
        >
          <Ionicons name="book-outline" size={17} color={colors.goldLight} />
          <Text style={styles.verseActionText}>{t("surahReader.understandShort")}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.goldLight} />
        </Pressable>
      </View>
    </View>
  );
});

function parsePositiveRouteNumber(value?: string) {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function getRenderedVerseNumber(verse: QuranFoundationVerse) {
  const verseKeyNumber = Number(verse.verseKey.split(":")[1]);
  return Number.isSafeInteger(verseKeyNumber) && verseKeyNumber > 0
    ? verseKeyNumber
    : verse.id;
}

export default function SurahReadingScreen() {
  const { language, t } = useI18n();
  const { id, verse: requestedVerse, direct, source } = useLocalSearchParams<{
    id: string;
    verse?: string;
    direct?: string;
    source?: string;
  }>();
  const { width: screenWidth } = useWindowDimensions();
  const parsedSurahId = parsePositiveRouteNumber(id);
  const surahId =
    parsedSurahId && parsedSurahId <= 114 ? parsedSurahId : 1;
  const surah = SURAHS.find((item) => item.id === surahId) ?? SURAHS[0];
  const requestedVerseNumber = parsePositiveRouteNumber(requestedVerse);
  const shouldRevealRequestedVerseDirectly =
    direct === "1" && requestedVerseNumber !== null;
  const handleBack = useCallback(() => {
    if (source === "widget" || !router.canGoBack()) {
      router.dismissTo("/(tabs)");
      return;
    }
    router.back();
  }, [source]);
  const listRef = useRef<FlatList<QuranFoundationVerse>>(null);
  const offsetRef = useRef(0);
  const scrollRetryRef = useRef({ index: -1, count: 0 });
  const currentVerseRef = useRef(requestedVerseNumber ?? 1);
  const verseLoadRequestRef = useRef(0);
  const [verses, setVerses] = useState<QuranFoundationVerse[]>([]);
  const [readVerseKeys, setReadVerseKeys] = useState<Set<string>>(new Set());
  const [savingReadKeys, setSavingReadKeys] = useState<Set<string>>(new Set());
  useFocusEffect(useCallback(() => {
    let active = true;
    void loadReadConfirmations('quran').then(value => { if (active) setReadVerseKeys(value); });
    return () => { active = false; };
  }, []));
  useEffect(() => onLocalMidnight(() => setReadVerseKeys(new Set())), []);
  const [englishSurahName, setEnglishSurahName] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [deepLinkPositioned, setDeepLinkPositioned] = useState(
    requestedVerseNumber === null,
  );
  const [error, setError] = useState<string>();
  const [settings, setSettings] = useState(DEFAULT_READING_PREFERENCES);
  const [showSettings, setShowSettings] = useState(false);
  const [showVerseJump, setShowVerseJump] = useState(false);
  const [verseJumpValue, setVerseJumpValue] = useState("");
  const [playingVerseKey, setPlayingVerseKey] = useState<string>();
  const [activeVerse, setActiveVerse] = useState<QuranFoundationVerse>();
  const [activeTiming, setActiveTiming] = useState<{
    startMs: number;
    endMs: number;
    requestId: number;
    verseKey: string;
    reciterId: string;
    audioMode: AudioSourceMode;
  }>();
  const [activeRecitationTimeline, setActiveRecitationTimeline] = useState<{
    key: string;
    timestamps: unknown;
  } | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const { currentReciter } = useReciter();
  const { pause: pauseGlobalAudio } = useGlobalAudioPlayer();
  const [versePlayer] = useState(() =>
    createAudioPlayer(null, {
      updateInterval: 50,
      keepAudioSessionActive: true,
    }),
  );

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
  const [preloadPlayer] = useState(() =>
    createAudioPlayer(null, {
      updateInterval: 1000,
      keepAudioSessionActive: false,
    }),
  );
  const versePlayerStatus = useAudioPlayerStatus(versePlayer);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const sessionIdRef = useRef(0);
  const inlineGoalAudioRef = useRef({ position: 0, pending: 0 });
  const inlineReciterIdRef = useRef(currentReciter?.id);
  const timelineCacheRef = useRef(new Map<string, VerseTimeline[]>());
  const timelineRequestsRef = useRef(
    new Map<
      string,
      ReturnType<typeof quranFoundationRepository.getRecitation>
    >(),
  );
  const timelineAudioUrlsRef = useRef(new Map<string, string>());
  const verseAudioUrlsRef = useRef(new Map<string, string>());
  const loadedVerseAudioUrlRef = useRef<string | null>(null);
  const loadingVerseKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const tracker = inlineGoalAudioRef.current;
    const delta = versePlayerStatus.currentTime - tracker.position;
    tracker.position = versePlayerStatus.currentTime;
    if (!versePlayerStatus.playing || delta <= 0 || delta > 3) return;
    tracker.pending += delta;
    if (tracker.pending < 5) return;
    const seconds = Math.floor(tracker.pending);
    tracker.pending -= seconds;
    goalProgressBridge.record({
      metric: "quran_listen_seconds",
      amount: seconds,
    });
  }, [versePlayerStatus.currentTime, versePlayerStatus.playing]);

  const stopInlineVerse = useCallback(
    (requestId?: number, resetPositionSeconds?: number) => {
      if (requestId !== undefined && sessionIdRef.current !== requestId) return;
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = undefined;
      }
      versePlayer.pause();
      if (resetPositionSeconds !== undefined) {
        void versePlayer.seekTo(resetPositionSeconds, 0, 0).catch(() => undefined);
      }
      setPlayingVerseKey(undefined);
    },
    [versePlayer],
  );

  useFocusEffect(
    useCallback(
      () => () => {
        sessionIdRef.current += 1;
        if (stopTimerRef.current) {
          clearTimeout(stopTimerRef.current);
          stopTimerRef.current = undefined;
        }
        versePlayer.pause();
        preloadPlayer.pause();
      },
      [preloadPlayer, versePlayer],
    ),
  );

  useEffect(
    () => () => {
      verseLoadRequestRef.current += 1;
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      sessionIdRef.current += 1;
      versePlayer.remove();
      preloadPlayer.remove();
    },
    [preloadPlayer, versePlayer],
  );

  useEffect(() => {
    if (inlineReciterIdRef.current === currentReciter?.id) return;
    inlineReciterIdRef.current = currentReciter?.id;
    sessionIdRef.current += 1;
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    versePlayer.pause();
    setActiveTiming(undefined);
    setActiveRecitationTimeline(null);
    setPlayingVerseKey(undefined);
    if (!currentReciter) return;
    const timelineKey = `${currentReciter.id}:${surahId}`;
    if (timelineCacheRef.current.has(timelineKey)) return;
    const request = quranFoundationRepository.getRecitation(
      currentReciter.id,
      surahId,
    );
    timelineRequestsRef.current.set(timelineKey, request);
    void request
      .then((recitation) => {
        timelineCacheRef.current.set(timelineKey, [
          ...(recitation.timestamps ?? []),
        ]);
        timelineAudioUrlsRef.current.set(timelineKey, recitation.audioUrl);
        recitation.audioFiles?.forEach((file) => {
          const url = resolveVerseAudioUrl(file.audioUrl ?? file.url);
          if (url)
            verseAudioUrlsRef.current.set(
              `${timelineKey}:${file.verseKey}`,
              url,
            );
        });
      })
      .catch(() => undefined)
      .finally(() => {
        if (timelineRequestsRef.current.get(timelineKey) === request)
          timelineRequestsRef.current.delete(timelineKey);
      });
  }, [currentReciter, surahId, versePlayer]);

  const loadVerses = useCallback(async () => {
    const requestId = verseLoadRequestRef.current + 1;
    verseLoadRequestRef.current = requestId;
    setLoading(true);
    if (requestedVerseNumber) setDeepLinkPositioned(false);
    setError(undefined);
    try {
      const response = (await readingQuranRepository.getVerses(
        surahId,
        language,
      )) as unknown as
        | QuranFoundationVerse[]
        | { verses?: QuranFoundationVerse[] };
      const normalizedVerses = Array.isArray(response)
        ? response
        : (response?.verses ?? []);
      if (verseLoadRequestRef.current !== requestId) return;
      setVerses(normalizedVerses);
      const requestedIndex = requestedVerseNumber
        ? normalizedVerses.findIndex(
            (verse) => getRenderedVerseNumber(verse) === requestedVerseNumber,
          )
        : -1;
      setTimeout(
        () => {
          if (requestedIndex >= 0) {
            currentVerseRef.current = requestedVerseNumber ?? 1;
            if (!shouldRevealRequestedVerseDirectly) {
              setDeepLinkPositioned(true);
            }
            scrollRetryRef.current = { index: -1, count: 0 };
            try {
              listRef.current?.scrollToIndex({
                index: requestedIndex,
                animated: false,
                viewPosition: 0,
              });
            } catch {
              listRef.current?.scrollToOffset({
                offset: 0,
                animated: false,
              });
              // Android can fail to measure the list before the first
              // scroll. Do not leave the whole screen hidden in that case.
              if (shouldRevealRequestedVerseDirectly) {
                setDeepLinkPositioned(true);
              }
            }
            return;
          }
          setDeepLinkPositioned(true);
          listRef.current?.scrollToOffset({
            offset: offsetRef.current,
            animated: false,
          });
        },
        0,
      );
    } catch (reason) {
      if (verseLoadRequestRef.current !== requestId) return;
      setError(
        reason instanceof Error
          ? reason.message
          : t("surahReader.loadFailed"),
      );
      setDeepLinkPositioned(true);
    } finally {
      if (verseLoadRequestRef.current === requestId) setLoading(false);
    }
  }, [language, requestedVerseNumber, shouldRevealRequestedVerseDirectly, surahId, t]);

  useEffect(() => {
    let active = true;
    Promise.all([
      readingPreferencesStore.load(),
      offlineRepository.getLastReading(),
    ]).then(([savedSettings, position]) => {
      if (!active) return;
      setSettings(savedSettings);
      if (!requestedVerseNumber && position?.surahId === surahId) {
        offsetRef.current = position.scrollOffset ?? 0;
        currentVerseRef.current = position.verseNumber;
      }
      void loadVerses();
    });
    return () => {
      active = false;
    };
  }, [loadVerses, requestedVerseNumber, surahId]);

  useEffect(
    () => () => {
      void offlineRepository.saveLastReading({
        surahId,
        verseNumber: currentVerseRef.current,
        page: verses.find((v) => v.id === currentVerseRef.current)?.pageNumber,
        scrollOffset: offsetRef.current,
        displayMode: settings.mode,
        updatedAt: new Date().toISOString(),
      });
    },
    [settings.mode, surahId, verses],
  );

  const updateSettings = (patch: Partial<ReadingPreferences>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    void readingPreferencesStore.save(next);
  };
  const listenToVerse = useCallback(
    async (verse: QuranFoundationVerse) => {
      if (!currentReciter) return;
      if (loadingVerseKeyRef.current === verse.verseKey) return;
      const player = versePlayer;
      if (
        playingVerseKey === verse.verseKey &&
        versePlayerStatus.playing
      ) {
        sessionIdRef.current += 1;
        stopInlineVerse();
        return;
      }
      const playerPositionMs = audioPositionMilliseconds(player.currentTime);
      const pausedPositionMs = activeTiming
        ? getSyncPositionMs(
            playerPositionMs,
            activeTiming.startMs,
            activeTiming.audioMode,
          )
        : playerPositionMs;
      const sameFinishedVerse =
        activeTiming?.verseKey === verse.verseKey &&
        activeTiming.reciterId === currentReciter.id &&
        (versePlayerStatus.didJustFinish ||
          pausedPositionMs >= activeTiming.endMs);
      if (sameFinishedVerse) {
        const requestId = ++sessionIdRef.current;
        const isCurrentRequest = () => sessionIdRef.current === requestId;
        const startSeconds =
          activeTiming.audioMode === "single-verse"
            ? 0
            : activeTiming.startMs / 1000;
        pauseGlobalAudio();
        if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
        player.pause();
        await player.seekTo(startSeconds, 0, 0);
        const seekConfirmed = await waitForAudioCondition(
          () => Math.abs(player.currentTime - startSeconds) <= 0.08,
          isCurrentRequest,
          2_000,
        );
        if (!seekConfirmed || !isCurrentRequest()) return;
        player.setPlaybackRate(playbackRate);
        setActiveTiming({ ...activeTiming, requestId });
        setPlayingVerseKey(verse.verseKey);
        player.play();
        stopTimerRef.current = setTimeout(
          () => stopInlineVerse(requestId, startSeconds),
          Math.max(
            1,
            Math.max(
              activeTiming.endMs - activeTiming.startMs,
              activeTiming.audioMode === "single-verse" ? (player.duration || 0) * 1000 : 0,
            ) / playbackRate,
          ),
        );
        return;
      }
      if (
        activeTiming?.verseKey === verse.verseKey &&
        activeTiming.reciterId === currentReciter.id &&
        pausedPositionMs >= activeTiming.startMs &&
        pausedPositionMs < activeTiming.endMs
      ) {
        const requestId = ++sessionIdRef.current;
        pauseGlobalAudio();
        player.setPlaybackRate(playbackRate);
        player.play();
        setActiveTiming({ ...activeTiming, requestId });
        setPlayingVerseKey(verse.verseKey);
        stopTimerRef.current = setTimeout(
          () => {
            stopInlineVerse(
              requestId,
              activeTiming.audioMode === "single-verse"
                ? 0
                : activeTiming.startMs / 1000,
            );
          },
          Math.max(1, (activeTiming.endMs - pausedPositionMs) / playbackRate),
        );
        return;
      }
      loadingVerseKeyRef.current = verse.verseKey;
      try {
        const requestId = ++sessionIdRef.current;
        const isCurrentRequest = () => sessionIdRef.current === requestId;
        pauseGlobalAudio();
        player.pause();
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      setActiveTiming(undefined);
      setActiveRecitationTimeline(null);
      setPlayingVerseKey(undefined);
      setActiveVerse(verse);
      const timelineKey = `${currentReciter.id}:${surahId}`;
      let timelines = timelineCacheRef.current.get(timelineKey);
      let audioUrl = timelineAudioUrlsRef.current.get(timelineKey);
      if (!timelines || !audioUrl) {
        let recitationRequest = timelineRequestsRef.current.get(timelineKey);
        if (!recitationRequest) {
          recitationRequest = quranFoundationRepository.getRecitation(
            currentReciter.id,
            surahId,
          );
          timelineRequestsRef.current.set(timelineKey, recitationRequest);
        }
        const recitation = await recitationRequest.finally(() => {
          if (
            timelineRequestsRef.current.get(timelineKey) === recitationRequest
          )
            timelineRequestsRef.current.delete(timelineKey);
        });
        timelines = [...(recitation.timestamps ?? [])];
        audioUrl = recitation.audioUrl;
        timelineCacheRef.current.set(timelineKey, timelines);
        timelineAudioUrlsRef.current.set(timelineKey, audioUrl);
        recitation.audioFiles?.forEach((file) => {
          const url = resolveVerseAudioUrl(file.audioUrl ?? file.url);
          if (url)
            verseAudioUrlsRef.current.set(
              `${timelineKey}:${file.verseKey}`,
              url,
            );
        });
      }
      if (!isCurrentRequest()) return;
      const timing = timelines.find((item) => item.verseKey === verse.verseKey);
      if (!timing) {
        Alert.alert(
          t("surahReader.audioUnavailable"),
          t("surahReader.timingUnavailable"),
        );
        return;
      }
      const timestampFromMs = timing.timestampFrom;
      const endMs = timing.timestampTo;
      if (
        !Number.isFinite(timestampFromMs) ||
        !Number.isFinite(endMs) ||
        endMs <= timestampFromMs
      ) {
        Alert.alert(
          t("surahReader.audioUnavailable"),
          t("surahReader.invalidAudioBounds"),
        );
        return;
      }
      const dedicatedUrl = resolveVerseAudioUrl(
        verseAudioUrlsRef.current.get(`${timelineKey}:${verse.verseKey}`) ??
          verse.audioUrl ??
          timing.audioUrl ??
          timing.url,
      );
      const sourceUrl = dedicatedUrl ?? audioUrl;
      const audioMode: AudioSourceMode = dedicatedUrl
        ? "single-verse"
        : "full-surah";
      setActiveRecitationTimeline({ key: timelineKey, timestamps: [timing] });
      const verseHadFinished =
        activeTiming?.verseKey === verse.verseKey &&
        (versePlayerStatus.didJustFinish ||
          pausedPositionMs >= activeTiming.endMs);
      const loaded =
        loadedVerseAudioUrlRef.current === sourceUrl &&
        player.isLoaded &&
        !verseHadFinished
          ? true
          : await replaceAndWaitForAudioSource(
              player,
              sourceUrl,
              isCurrentRequest,
              10_000,
            );
      if (!loaded || !isCurrentRequest()) return;
      loadedVerseAudioUrlRef.current = sourceUrl;
      const startSeconds = dedicatedUrl ? 0 : timestampFromMs / 1000;
      await player.seekTo(startSeconds, 0, 0);
      const seekConfirmed = await waitForAudioCondition(
        () => Math.abs(player.currentTime - startSeconds) <= 0.08,
        isCurrentRequest,
        2_000,
      );
      if (!seekConfirmed || !isCurrentRequest()) return;
      player.setPlaybackRate(playbackRate);
      setActiveVerse(verse);
      setActiveTiming({
        startMs: timestampFromMs,
        endMs,
        requestId,
        verseKey: verse.verseKey,
        reciterId: currentReciter.id,
        audioMode,
      });
      setPlayingVerseKey(verse.verseKey);
      player.play();
        stopTimerRef.current = setTimeout(
          () => {
            stopInlineVerse(requestId, startSeconds);
          },
          // A verse's own file is played to its end: its length can differ from the chapter timings.
          Math.max(1, Math.max(endMs - timestampFromMs, dedicatedUrl ? (player.duration || 0) * 1000 : 0) / playbackRate),
        );
      } finally {
        if (loadingVerseKeyRef.current === verse.verseKey) {
          loadingVerseKeyRef.current = null;
        }
      }
    },
    [
      activeTiming,
      currentReciter,
      pauseGlobalAudio,
      playbackRate,
      playingVerseKey,
      stopInlineVerse,
      surahId,
      t,
      versePlayer,
      versePlayerStatus.didJustFinish,
      versePlayerStatus.playing,
    ],
  );

  const playNeighbor = useCallback(
    (direction: -1 | 1) => {
      if (!activeVerse) return;
      const index = verses.findIndex(
        (verse) => verse.verseKey === activeVerse.verseKey,
      );
      const neighbor = verses[index + direction];
      if (neighbor) void listenToVerse(neighbor);
    },
    [activeVerse, listenToVerse, verses],
  );

  const cyclePlaybackRate = useCallback(() => {
    const next = playbackRate === 1 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1;
    setPlaybackRate(next);
    versePlayer.setPlaybackRate(next);
    if (
      activeTiming &&
      playingVerseKey &&
      activeTiming.requestId === sessionIdRef.current
    ) {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
      const syncPositionMs = getSyncPositionMs(
        audioPositionMilliseconds(versePlayer.currentTime),
        activeTiming.startMs,
        activeTiming.audioMode,
      );
      const remainingMs = activeTiming.endMs - syncPositionMs;
      const requestId = activeTiming.requestId;
      stopTimerRef.current = setTimeout(
        () => {
          stopInlineVerse(
            requestId,
            activeTiming.audioMode === "single-verse"
              ? 0
              : activeTiming.startMs / 1000,
          );
        },
        Math.max(1, remainingMs / next),
      );
    }
  }, [
    activeTiming,
    playbackRate,
    playingVerseKey,
    stopInlineVerse,
    versePlayer,
  ]);

  const syncPositionMs = activeTiming
    ? getSyncPositionMs(
        audioPositionMilliseconds(versePlayerStatus.currentTime),
        activeTiming.startMs,
        activeTiming.audioMode,
      )
    : audioPositionMilliseconds(versePlayerStatus.currentTime);
  const verseProgress = activeTiming
    ? Math.max(
        0,
        Math.min(
          1,
          (syncPositionMs - activeTiming.startMs) /
            Math.max(1, activeTiming.endMs - activeTiming.startMs),
        ),
      )
    : versePlayerStatus.duration > 0
      ? Math.max(
          0,
          Math.min(
            1,
            versePlayerStatus.currentTime / versePlayerStatus.duration,
          ),
        )
      : 0;

  const wordTimestamps = useMemo(
    () =>
      activeRecitationTimeline?.key === `${currentReciter?.id}:${surahId}`
        ? normalizeWordTimestamps(
            activeRecitationTimeline.timestamps,
            versePlayerStatus.duration,
          )
        : [],
    [
      activeRecitationTimeline,
      currentReciter?.id,
      surahId,
      versePlayerStatus.duration,
    ],
  );
  const activeWordState = useMemo(
    () =>
      activeVerse
        ? getWordSyncState({
            positionMs: syncPositionMs,
            verseTimeline: wordTimestamps.filter(
              (word) => word.verseId === activeVerse.id,
            ),
          })
        : { activeWordPosition: null, completedWordPositions: [] as number[] },
    [activeVerse, syncPositionMs, wordTimestamps],
  );
  const lastReadWordPosition =
    activeWordState.completedWordPositions.at(-1) ?? null;
  const isWordSyncUnavailable = Boolean(
    activeTiming && activeRecitationTimeline && wordTimestamps.length === 0,
  );

  useEffect(() => {
    if (
      !activeTiming ||
      !playingVerseKey ||
      !versePlayerStatus.playing ||
      activeTiming.requestId !== sessionIdRef.current
    )
      return;
    const currentMs = getSyncPositionMs(
      audioPositionMilliseconds(versePlayer.currentTime),
      activeTiming.startMs,
      activeTiming.audioMode,
    );
    if (currentMs < activeTiming.endMs) return;
    stopInlineVerse(
      activeTiming.requestId,
      activeTiming.audioMode === "single-verse"
        ? 0
        : activeTiming.startMs / 1000,
    );
  }, [
    activeTiming,
    playingVerseKey,
    stopInlineVerse,
    versePlayer,
    versePlayerStatus.currentTime,
    versePlayerStatus.playing,
  ]);
  const listenToVerseRef = useRef(listenToVerse);
  listenToVerseRef.current = listenToVerse;
  const handleVerseListen = useCallback((verse: QuranFoundationVerse) => {
    void listenToVerseRef.current(verse);
  }, []);
  const handleOpenTafsir = useCallback((verse: QuranFoundationVerse) => {
    goalProgressBridge.record({
      metric: "quran_tafsir_read",
      evidenceId: verse.verseKey,
    });
    router.push({
      pathname: "/tafsir/[verseKey]",
      params: { verseKey: verse.verseKey },
    });
  }, []);
  const handleConfirmRead = useCallback((verse: QuranFoundationVerse) => {
    const key = verse.verseKey;
    if (savingReadKeys.has(key)) return;
    const selected = !readVerseKeys.has(key);
    setSavingReadKeys(previous => new Set(previous).add(key));
    void (async () => {
      try {
        const next = await setReadConfirmation('quran', key, selected);
        await goalProgressBridge.setEvidence('quran_verses_read', `read:${key}`, selected);
        setReadVerseKeys(next);
      } catch {
        await setReadConfirmation('quran', key, !selected).catch(() => undefined);
        Alert.alert('Enregistrement impossible', 'Réessayez dans un instant.');
      } finally {
        setSavingReadKeys(previous => { const next = new Set(previous); next.delete(key); return next; });
      }
    })();
  }, [readVerseKeys, savingReadKeys]);

  useEffect(() => {
    if (!activeVerse || !currentReciter) return;
    const nextVerse =
      verses[
        verses.findIndex((verse) => verse.verseKey === activeVerse.verseKey) + 1
      ];
    if (!nextVerse) return;
    const timelineKey = `${currentReciter.id}:${surahId}`;
    const timing = timelineCacheRef.current
      .get(timelineKey)
      ?.find((item) => item.verseKey === nextVerse.verseKey);
    const dedicatedUrl = resolveVerseAudioUrl(
      verseAudioUrlsRef.current.get(`${timelineKey}:${nextVerse.verseKey}`) ??
        nextVerse.audioUrl ??
        timing?.audioUrl ??
        timing?.url,
    );
    if (dedicatedUrl) preloadPlayer.replace({ uri: dedicatedUrl });
  }, [activeVerse, currentReciter, preloadPlayer, surahId, verses]);

  const renderVerse = useCallback<ListRenderItem<QuranFoundationVerse>>(
    ({ item, index }) => (
      <VerseRow
        verse={item}
        settings={settings}
        screenWidth={screenWidth}
        onListen={handleVerseListen}
        onOpenTafsir={handleOpenTafsir}
        onConfirmRead={handleConfirmRead}
        isRead={readVerseKeys.has(item.verseKey)}
        isSavingRead={savingReadKeys.has(item.verseKey)}
        isPlaying={playingVerseKey === item.verseKey}
        isActive={activeVerse?.verseKey === item.verseKey}
        activeWordPosition={
          activeVerse?.verseKey === item.verseKey
            ? activeWordState.activeWordPosition
            : null
        }
        lastReadWordPosition={
          activeVerse?.verseKey === item.verseKey ? lastReadWordPosition : null
        }
        isWordSyncUnavailable={
          activeVerse?.verseKey === item.verseKey && isWordSyncUnavailable
        }
        showLocation={
          index === 0 ||
          verses[index - 1]?.juzNumber !== item.juzNumber ||
          verses[index - 1]?.pageNumber !== item.pageNumber
        }
      />
    ),
    [
      activeVerse?.verseKey,
      activeWordState.activeWordPosition,
      handleOpenTafsir,
      handleConfirmRead,
      handleVerseListen,
      isWordSyncUnavailable,
      lastReadWordPosition,
      playingVerseKey,
      readVerseKeys,
      savingReadKeys,
      screenWidth,
      settings,
      verses,
    ],
  );
  const viewability = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: ViewToken<QuranFoundationVerse>[];
    }) => {
      const first = viewableItems.find((item) => item.item);
      if (first?.item) {
        currentVerseRef.current = getRenderedVerseNumber(first.item);
        if (
          shouldRevealRequestedVerseDirectly &&
          getRenderedVerseNumber(first.item) === requestedVerseNumber
        ) {
          setDeepLinkPositioned(true);
        }
      }
    },
  ).current;
  const jumpToVerse = useCallback(() => {
    const verseNumber = parsePositiveRouteNumber(verseJumpValue.trim());
    if (!verseNumber) {
      Alert.alert(
        t("surahReader.verseNotFound"),
        t("surahReader.enterValidVerse"),
      );
      return;
    }

    const index = verses.findIndex(
      (verse) => getRenderedVerseNumber(verse) === verseNumber,
    );
    if (index < 0) {
      Alert.alert(
        t("surahReader.verseNotFound"),
        t("surahReader.surahVerseCount", { count: surah.verses }),
      );
      return;
    }

    currentVerseRef.current = verseNumber;
    scrollRetryRef.current = { index: -1, count: 0 };
    listRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0,
    });
    setShowVerseJump(false);
    setVerseJumpValue("");
  }, [surah.verses, t, verseJumpValue, verses]);

  const palette = colors.background;

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safe, { backgroundColor: palette }]}
    >
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{surah.transliteration}</Text>
          <Text style={styles.meta}>
            {t("surahReader.surahMeta", {
              name:
                language === "en"
                  ? englishSurahName || surah.transliteration
                  : surah.frenchName,
              number: surah.id,
              place:
                surah.revelationType === "Médine"
                  ? t("surahReader.medina")
                  : t("surahReader.mecca"),
              count: surah.verses,
            })}
          </Text>
        </View>
        <Text style={styles.headerArabic}>{surah.arabicName}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("surahReader.settingsLabel")}
          onPress={() => setShowSettings((value) => !value)}
          style={[styles.iconButton, styles.headerAction, showSettings && styles.iconButtonActive]}
        >
          <Ionicons name="options-outline" size={21} color={colors.goldLight} />
        </Pressable>
      </View>
      <View style={styles.reciterSelectorSlot}>
        <View style={styles.reciterSelectorRow}>
          <View style={styles.reciterSelectorControl}>
            <QuranReciterSelector compact />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("surahReader.goToVerse")}
            onPress={() => setShowVerseJump((value) => !value)}
            style={({ pressed }) => [styles.verseJumpTrigger, showVerseJump && styles.iconButtonActive, pressed && styles.tafsirButtonPressed]}
          >
            <Text style={styles.verseJumpTriggerText}>{t("surahReader.goToVerse")}</Text>
          </Pressable>
        </View>
        {showVerseJump ? (
          <View style={styles.verseJumpRow}>
            <TextInput
              autoFocus
              value={verseJumpValue}
              onChangeText={(value) =>
                setVerseJumpValue(value.replace(/[^0-9]/g, ""))
              }
              onSubmitEditing={jumpToVerse}
              keyboardType="number-pad"
              returnKeyType="go"
              placeholder={t("surahReader.verseNumberPlaceholder", { count: surah.verses })}
              placeholderTextColor={colors.textMuted}
              style={styles.verseJumpInput}
            />
            <Pressable onPress={jumpToVerse} style={styles.verseJumpGoButton}>
              <Text style={styles.verseJumpGoText}>{t("surahReader.go")}</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
      {showSettings ? (
        <View style={styles.settings}>
          <FlatList
            horizontal
            data={modes}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => updateSettings({ mode: item.id })}
                style={[
                  styles.chip,
                  settings.mode === item.id && styles.chipActive,
                ]}
              >
                <Text style={styles.chipText}>{t(item.labelKey)}</Text>
              </Pressable>
            )}
          />
        </View>
      ) : null}
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.gold} />
      ) : error ? (
        <Pressable onPress={() => void loadVerses()} style={styles.error}>
          <Text style={styles.errorText}>{error}\n{t("surahReader.tapToRetry")}</Text>
        </Pressable>
      ) : verses.length === 0 ? (
        <View style={styles.error}>
          <Text style={styles.errorText}>{t("surahReader.noVerses")}</Text>
        </View>
      ) : (
        <View style={styles.verseListContainer}>
          <FlatList
            ref={listRef}
            data={verses}
            keyExtractor={(item) => item.verseKey}
            renderItem={renderVerse}
            contentContainerStyle={styles.content}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={40}
            windowSize={7}
            // Some long translations were clipped before their final line on
            // iOS. Keep every reading cell fully measured; this only affects
            // the Quran reading screen, not the listening screen.
            removeClippedSubviews={false}
            onScrollToIndexFailed={({ averageItemLength, index }) => {
              // Each retry can fail again and call this handler: without a limit the list kept
              // jumping around the same verse (taller verses in Arabic + translation make it likelier).
              const attempts = scrollRetryRef.current.index === index ? scrollRetryRef.current.count + 1 : 1;
              scrollRetryRef.current = { index, count: attempts };
              listRef.current?.scrollToOffset({
                offset: averageItemLength * index,
                animated: false,
              });
              if (attempts > 60) {
                setDeepLinkPositioned(true);
                return;
              }
              setTimeout(() => {
                try {
                  listRef.current?.scrollToIndex({
                    index,
                    animated: false,
                    viewPosition: 0,
                  });
                } catch {
                  // Android may fail twice before FlatList finishes measuring.
                  // Showing the list is safer than leaving the screen stuck.
                  setDeepLinkPositioned(true);
                }
              }, 80);
            }}
            onViewableItemsChanged={viewability}
            onScroll={(event) => {
              offsetRef.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={250}
            style={!deepLinkPositioned ? styles.hiddenVerseList : undefined}
          />
          {!deepLinkPositioned ? (
            <ActivityIndicator
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              color={colors.gold}
            />
          ) : null}
        </View>
      )}
      {activeVerse ? (
        <View style={styles.inlinePlayer}>
          <View style={styles.inlineProgressTrack}>
            <View
              style={[
                styles.inlineProgress,
                { width: `${verseProgress * 100}%` },
              ]}
            />
          </View>
          <View style={styles.inlineControls}>
            <Pressable
              accessibilityLabel={t("surahReader.previousVerse")}
              disabled={activeVerse.id <= 1}
              onPress={() => playNeighbor(-1)}
              style={styles.inlineSmallButton}
            >
              <Ionicons
                name="play-skip-back"
                size={18}
                color={
                  activeVerse.id <= 1 ? colors.textMuted : colors.goldLight
                }
              />
            </Pressable>
            <Pressable
              accessibilityLabel={playingVerseKey ? t("common.pause") : t("surahReader.play")}
              onPress={() => void listenToVerse(activeVerse)}
              style={styles.inlinePlayButton}
            >
              <Ionicons
                name={playingVerseKey ? "pause" : "play"}
                size={21}
                color={colors.background}
              />
            </Pressable>
            <Pressable
              accessibilityLabel={t("surahReader.nextVerse")}
              disabled={activeVerse.id >= verses.length}
              onPress={() => playNeighbor(1)}
              style={styles.inlineSmallButton}
            >
              <Ionicons
                name="play-skip-forward"
                size={18}
                color={
                  activeVerse.id >= verses.length
                    ? colors.textMuted
                    : colors.goldLight
                }
              />
            </Pressable>
            <View style={styles.inlineCopy}>
              <Text numberOfLines={1} style={styles.inlineTitle}>
                {t("surahReader.activeVerse", {
                  surah:
                    language === "en"
                      ? englishSurahName || surah.transliteration
                      : surah.frenchName,
                  verse: activeVerse.id,
                })}
              </Text>
              <Text numberOfLines={1} style={styles.inlineSubtitle}>
                {currentReciter?.name ?? t("surahReader.reciter")}
              </Text>
            </View>
            <Pressable
              accessibilityLabel={t("surahReader.playbackSpeed")}
              onPress={cyclePlaybackRate}
              style={styles.rateButton}
            >
              <Text style={styles.rateText}>{playbackRate}×</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    minHeight: 74,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.22)",
  },
  iconButtonActive: {
    borderColor: "rgba(227,181,90,0.6)",
    backgroundColor: "rgba(227,181,90,0.12)",
  },
  headerAction: { marginLeft: 8 },
  reciterSelectorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  reciterSelectorControl: { flex: 1, minWidth: 0 },
  verseJumpTrigger: {
    height: 38,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.35)",
  },
  verseJumpTriggerText: { color: colors.goldLight, fontSize: 13, fontWeight: "700" },

  headerCopy: { flex: 1, marginLeft: 10 },
  title: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 22,
  },
  meta: { color: colors.textMuted, fontSize: 9 },
  headerArabic: {
    maxWidth: 90,
    color: colors.goldLight,
    fontFamily: typography.arabic,
    fontSize: 20,
    textAlign: "right",
  },
  reciterSelectorSlot: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  verseJumpRow: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  verseJumpInput: {
    flex: 1,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 13,
  },
  verseJumpGoButton: {
    height: 38,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.purpleDeep,
  },
  verseJumpGoText: {
    color: colors.goldLight,
    fontSize: 12,
    fontWeight: "700",
  },
  settings: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.backgroundSecondary,
  },
  chip: {
    marginRight: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  chipActive: { borderWidth: 1, borderColor: colors.gold },
  chipText: { color: colors.textSecondary, fontSize: 10 },
  settingRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingLabel: { color: colors.textMuted, fontSize: 10 },
  adjust: { color: colors.goldLight, fontSize: 14, fontWeight: "700" },
  transliterationToggle: {
    marginLeft: "auto",
    paddingHorizontal: 11,
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  transliterationToggleActive: {
    backgroundColor: colors.goldLight,
    borderColor: colors.goldLight,
  },
  transliterationToggleText: {
    color: colors.goldLight,
    fontSize: 10,
    fontWeight: "600",
  },
  transliterationToggleTextActive: { color: colors.background },
  themeDot: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  themeActive: { borderWidth: 2, borderColor: colors.gold },
  content: { paddingHorizontal: 20, paddingBottom: 190 },
  verseListContainer: { flex: 1 },
  hiddenVerseList: { opacity: 0 },
  verse: {
    maxWidth: 760,
    width: "100%",
    alignSelf: "center",
    paddingVertical: 34,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(224,188,112,0.22)",
  },
  verseActive: {
    borderRadius: 18,
    borderBottomColor: "rgba(224,188,112,0.48)",
    backgroundColor: "rgba(200,148,58,0.07)",
  },
  verseWide: { maxWidth: 920 },
  verseTop: { flexDirection: "row", alignItems: "center", marginBottom: 26 },
  number: {
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.goldLight,
    backgroundColor: colors.goldDark,
  },
  numberText: { color: colors.background, fontSize: 9, fontWeight: "700" },
  location: {
    marginLeft: 9,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  listenIcon: {
    marginLeft: "auto",
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(126,72,148,0.18)",
  },
  arabic: {
    color: colors.goldLight,
    fontFamily: typography.arabic,
    textAlign: "right",
    writingDirection: "rtl",
    paddingVertical: 8,
  },
  arabicText: {
    width: "100%",
    flexShrink: 1,
    textAlign: "right",
    writingDirection: "rtl",
    includeFontPadding: false,
  },
  syncUnavailable: {
    marginTop: 12,
    color: colors.textMuted,
    fontSize: 11,
    textAlign: "center",
  },
  translationContainer: {
    width: "100%",
    flexShrink: 0,
    marginTop: 28,
    paddingTop: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(224,188,112,0.16)",
    overflow: "visible",
  },
  translation: {
    width: "100%",
    flexShrink: 0,
    color: "#FFFFFF",
  },
  transliteration: {
    marginTop: 22,
    color: colors.textMuted,
    fontStyle: "italic",
    fontWeight: "400",
    lineHeight: 28,
    textAlign: "left",
  },
  inlinePlayer: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.backgroundSecondary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 14,
  },
  inlineProgressTrack: { height: 3, backgroundColor: colors.surfaceLight },
  inlineProgress: { height: "100%", backgroundColor: colors.goldLight },
  inlineControls: {
    minHeight: 72,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  inlineSmallButton: {
    width: 34,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  inlinePlayButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.goldLight,
  },
  inlineCopy: { flex: 1, minWidth: 0, marginLeft: 10 },
  inlineTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 16,
  },
  inlineSubtitle: { marginTop: 2, color: colors.textMuted, fontSize: 9 },
  rateButton: {
    minWidth: 38,
    height: 32,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  rateText: { color: colors.goldLight, fontSize: 10, fontWeight: "700" },
  loader: { flex: 1 },
  error: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: {
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  verseActions: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  verseAction: {
    height: 38,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.35)",
    backgroundColor: "rgba(227,181,90,0.06)",
  },
  verseActionDone: {
    borderColor: "rgba(98,197,139,0.55)",
    backgroundColor: "rgba(98,197,139,0.10)",
  },
  verseActionText: { color: colors.text, fontSize: 13, fontWeight: "700" },
  verseActionTextDone: { color: colors.success },
  tafsirButtonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
});
