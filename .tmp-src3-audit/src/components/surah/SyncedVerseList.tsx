import * as Font from "expo-font";
import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Reanimated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { quranFoundationRepository } from "../../features/quranfoundation/QuranFoundationRepository";
import type { QuranFoundationVerse } from "../../features/quranfoundation/QuranFoundationTypes";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import uthmanicHafsSource from "../../../assets/fonts/quran/UthmanicHafs1Ver18.ttf";
import {
  ARABIC_READING_COLOR,
  ARABIC_READING_FONT_FAMILY,
  ARABIC_READING_FONT_WEIGHT,
  getArabicReadingMetrics,
} from "../../features/quran/ArabicReadingPresentation";
import { readingPreferencesStore } from "../../features/quran/ReadingPreferences";
import { QuranArabicText } from "../../features/quran/QuranArabicText";
import { QuranWordHighlight } from "../../features/quran/QuranWordHighlight";
import { sanitizeTranslationText } from "../../features/quran/TranslationText";
import {
  activeVerseAt,
  getActiveWordTimestamp,
  getSyncPositionMs,
  getWordSyncState,
  normalizeVerseTimestamps,
  normalizeWordTimestamps,
} from "../../features/quran/QuranWordSync";
import type {
  AudioSourceMode,
  VerseTimestamp,
  WordTimestamp,
} from "../../features/quran/QuranWordSync";

type SyncedWord = {
  position: number;
  text: string;
};

type SyncedVerse = {
  id: number;
  arabic: string;
  words: readonly SyncedWord[];
  pageNumber: number;
  fontFamily: string;
  fontKind: "uthmanic-hafs";
  translation?: string;
  transliteration?: string;
  timestamp?: VerseTimestamp;
};

export type TadabburDisplayVerse = {
  id: number;
  arabic: string;
  french: string;
  startSeconds?: number;
  endSeconds?: number;
};

type VerseDisplayMode = "arabic" | "translation" | "transliteration";

type SyncedVerseListProps = {
  surahId: number;
  reciterId?: string;
  trackId?: string;
  audioUrl?: string;
  duration: number;
  compact?: boolean;
  overlay?: boolean;
  hidden?: boolean;
  subscribeToPosition: (listener: (positionMs: number) => void) => () => void;
  getCurrentPositionMs: () => number;
  onTimelineReady?: (key: string) => void;
  onTadabburUpdate?: (
    verses: readonly TadabburDisplayVerse[],
    activeVerseId: number,
    progress: number,
  ) => void;
};

const mushafFont = ARABIC_READING_FONT_FAMILY;
function isRemoteAudioUrl(value: string | undefined) {
  return value?.startsWith("http://") || value?.startsWith("https://");
}

function verseNumberFromKey(verseKey?: string) {
  const value = Number(verseKey?.split(":")[1]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function verseKey(verse: QuranFoundationVerse) {
  return (
    verse.verseKey ??
    (verse as QuranFoundationVerse & { verse_key?: string }).verse_key
  );
}

function clipWords(text: string, maxWords: number) {
  const words = sanitizeTranslationText(text).split(" ").filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return `${words.slice(0, maxWords).join(" ")}…`;
}

function verseArabic(verse: QuranFoundationVerse) {
  return verse.textUthmani || "";
}

function verseWords(verse: QuranFoundationVerse) {
  const foundationWords = (verse.words ?? []).flatMap((word): SyncedWord[] => {
    const charType = word.charTypeName ?? word.char_type_name ?? "word";
    const position = Number(
      word.position ?? word.wordPosition ?? word.word_position,
    );
    const text = word.textUthmani ?? word.text_uthmani ?? word.text ?? "";
    if (
      charType !== "word" ||
      !Number.isFinite(position) ||
      position <= 0 ||
      !text.trim()
    )
      return [];
    return [{ position, text: text.trim() }];
  });
  if (foundationWords.length > 0) return foundationWords;
  return verseArabic(verse)
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((text, index) => ({ position: index + 1, text }));
}

function fatihaWords(verse: QuranFoundationVerse) {
  return verseArabic(verse)
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((text, index) => ({ position: index + 1, text }));
}

function verseFont(verse: QuranFoundationVerse) {
  return {
    pageNumber: verse.pageNumber || 1,
    fontFamily: mushafFont,
    fontKind: "uthmanic-hafs" as const,
  };
}

function verseTranslation(verse: QuranFoundationVerse) {
  return sanitizeTranslationText(
    verse.translations?.[0]?.text || verse.translation,
  );
}

function verseTransliteration(verse: QuranFoundationVerse) {
  return verse.transliteration || "";
}

function restoreOpenFinalSegments(
  raw: unknown,
  normalized: readonly WordTimestamp[],
): readonly WordTimestamp[] {
  if (!Array.isArray(raw)) return normalized;
  const restored = [...normalized];
  raw.forEach((item) => {
    if (!item || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    const verseId = verseNumberFromKey(
      String(record.verseKey ?? record.verse_key ?? ""),
    );
    const verseEndMs = Number(record.timestampTo ?? record.timestamp_to);
    const segments = record.segments;
    if (!verseId || !Number.isFinite(verseEndMs) || !Array.isArray(segments))
      return;
    const finalSegment = [...segments]
      .reverse()
      .find((segment) => Array.isArray(segment) && segment.length >= 3);
    if (
      !Array.isArray(finalSegment) ||
      (finalSegment[2] !== null && finalSegment[2] !== undefined)
    )
      return;
    const wordPosition = Number(finalSegment[0]);
    const startMs = Number(finalSegment[1]);
    if (
      !Number.isFinite(wordPosition) ||
      !Number.isFinite(startMs) ||
      verseEndMs <= startMs
    )
      return;
    if (
      restored.some(
        (word) =>
          word.verseId === verseId && word.wordPosition === wordPosition,
      )
    )
      return;
    restored.push({ verseId, wordPosition, startMs, endMs: verseEndMs });
  });
  return restored.sort((left, right) => left.startMs - right.startMs);
}

export default function SyncedVerseList({
  surahId,
  reciterId,
  trackId,
  audioUrl,
  duration,
  compact,
  overlay,
  hidden,
  subscribeToPosition,
  getCurrentPositionMs,
  onTimelineReady,
  onTadabburUpdate,
}: SyncedVerseListProps) {
  const { width } = useWindowDimensions();
  const [verses, setVerses] = useState<readonly QuranFoundationVerse[]>([]);
  const [rawTiming, setRawTiming] = useState<{
    key: string;
    timestamps: unknown;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadedFonts, setLoadedFonts] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [mode, setMode] = useState<VerseDisplayMode>("arabic");
  const [preferredArabicSize, setPreferredArabicSize] = useState(38);
  const timingRequestIdentityRef = useRef("");
  const syncSessionIdentityRef = useRef("");
  const syncSessionIdRef = useRef(0);
  const timelineRef = useRef<readonly WordTimestamp[]>([]);
  const verseTimelineRef = useRef<readonly VerseTimestamp[]>([]);
  const verseKeyRef = useRef<number | null>(null);
  const [listenerWordState, setListenerWordState] = useState({
    activeVerseId: null as number | null,
    activeWordPosition: null as number | null,
    completedWordPositions: [] as number[],
  });

  useEffect(() => {
    let active = true;
    void readingPreferencesStore.load().then((preferences) => {
      if (active) setPreferredArabicSize(preferences.arabicSize);
    });
    return () => {
      active = false;
    };
  }, []);
  const timingKey = `timings:${reciterId ?? "no-reciter"}:${surahId}:${encodeURIComponent(audioUrl ?? trackId ?? "no-audio")}`;
  if (syncSessionIdentityRef.current !== timingKey) {
    syncSessionIdentityRef.current = timingKey;
    syncSessionIdRef.current += 1;
  }
  const syncSessionId = syncSessionIdRef.current;
  const rawTimestamps =
    rawTiming?.key === timingKey ? rawTiming.timestamps : null;

  useEffect(() => {
    let active = true;
    setVerses([]);
    setLoading(true);

    void quranFoundationRepository
      .getVerses(surahId)
      .then((nextVerses) => {
        if (!active || syncSessionIdRef.current !== syncSessionId) return;
        setVerses(nextVerses);
      })
      .catch(() => undefined)
      .finally(() => {
        if (active && syncSessionIdRef.current === syncSessionId)
          setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [surahId, syncSessionId]);

  useEffect(() => {
    let active = true;
    const requestIdentity = timingKey;
    timingRequestIdentityRef.current = requestIdentity;
    setRawTiming(null);

    if (reciterId) {
      void quranFoundationRepository
        .getRecitation(reciterId, surahId)
        .then((recitation) => {
          if (
            !active ||
            syncSessionIdRef.current !== syncSessionId ||
            timingRequestIdentityRef.current !== requestIdentity
          )
            return;
          if (
            isRemoteAudioUrl(audioUrl) &&
            recitation?.audioUrl &&
            recitation.audioUrl !== audioUrl
          )
            return;
          setRawTiming({
            key: requestIdentity,
            timestamps: recitation?.timestamps ?? null,
          });
        })
        .catch(() => undefined);
    }

    return () => {
      active = false;
    };
  }, [audioUrl, onTimelineReady, reciterId, surahId, syncSessionId, timingKey]);

  const timestamps = useMemo(
    () => normalizeVerseTimestamps(rawTimestamps, duration),
    [duration, rawTimestamps],
  );
  const normalizedWordTimestamps = useMemo(
    () => normalizeWordTimestamps(rawTimestamps, duration),
    [duration, rawTimestamps],
  );
  const wordTimestamps = useMemo(
    () => restoreOpenFinalSegments(rawTimestamps, normalizedWordTimestamps),
    [normalizedWordTimestamps, rawTimestamps],
  );

  const syncedVerses = useMemo<readonly SyncedVerse[]>(() => {
    const timestampByVerse = new Map(
      timestamps.map((item) => [item.verseId, item]),
    );
    return verses
      .map((verse) => {
        const id = verseNumberFromKey(verseKey(verse)) ?? verse.id;
        const font = verseFont(verse);
        const words = surahId === 1 ? fatihaWords(verse) : verseWords(verse);
        return {
          id,
          arabic:
            words.length > 0
              ? words.map((word) => word.text).join(" ")
              : clipWords(verseArabic(verse), 9),
          words,
          pageNumber: font.pageNumber,
          fontFamily: font.fontFamily,
          fontKind: font.fontKind,
          translation: verseTranslation(verse),
          transliteration: verseTransliteration(verse),
          timestamp: timestampByVerse.get(id),
        };
      })
      .filter((verse) => verse.arabic.length > 0);
  }, [surahId, timestamps, verses]);

  const tadabburVerses = useMemo<readonly TadabburDisplayVerse[]>(
    () =>
      syncedVerses.map((verse) => ({
        id: verse.id,
        arabic: verse.arabic,
        french: verse.translation ?? "",
        startSeconds: verse.timestamp?.startSeconds,
        endSeconds: verse.timestamp?.endSeconds,
      })),
    [syncedVerses],
  );

  const activeVerse = useMemo(
    () =>
      syncedVerses.find(
        (verse) => verse.id === listenerWordState.activeVerseId,
      ) ??
      syncedVerses[0] ??
      null,
    [listenerWordState.activeVerseId, syncedVerses],
  );

  const visibleVerses = useMemo(() => {
    if (syncedVerses.length === 0) return [];
    const foundIndex = syncedVerses.findIndex(
      (verse) => verse.id === activeVerse?.id,
    );
    const activeIndex = foundIndex >= 0 ? foundIndex : 0;
    const startIndex =
      activeIndex === syncedVerses.length - 1
        ? Math.max(0, activeIndex - 1)
        : activeIndex;
    return syncedVerses.slice(startIndex, startIndex + 2);
  }, [activeVerse?.id, syncedVerses]);
  verseKeyRef.current =
    listenerWordState.activeVerseId ?? syncedVerses[0]?.id ?? null;
  timelineRef.current = wordTimestamps;
  verseTimelineRef.current = timestamps;

  const handlePositionUpdate = useCallback(
    (positionMs: number) => {
      const mode: AudioSourceMode = "full-surah";
      const currentVerseTimestamp = verseTimelineRef.current.find(
        (timestamp) =>
          positionMs >= timestamp.startSeconds * 1000 &&
          positionMs < timestamp.endSeconds * 1000,
      );
      const verseTimestampFromMs = Math.round(
        (currentVerseTimestamp?.startSeconds ?? 0) * 1000,
      );
      const syncPositionMs = getSyncPositionMs(
        positionMs,
        verseTimestampFromMs,
        mode,
      );
      const timedWord = getActiveWordTimestamp(
        syncPositionMs,
        timelineRef.current,
      );
      const activeVerseId =
        timedWord?.verseId ??
        activeVerseAt(verseTimelineRef.current, syncPositionMs / 1000) ??
        verseKeyRef.current;
      if (activeVerseId === null) return;
      const activeTimestamp = verseTimelineRef.current.find(
        (timestamp) => timestamp.verseId === activeVerseId,
      );
      const verseDurationMs = activeTimestamp
        ? Math.max(
            1,
            (activeTimestamp.endSeconds - activeTimestamp.startSeconds) * 1000,
          )
        : 1;
      const verseProgress = activeTimestamp
        ? Math.round(
            Math.min(
              100,
              Math.max(
                0,
                ((syncPositionMs - activeTimestamp.startSeconds * 1000) /
                  verseDurationMs) *
                  100,
              ),
            ),
          )
        : 0;
      onTadabburUpdate?.(tadabburVerses, activeVerseId, verseProgress);
      verseKeyRef.current = activeVerseId;
      const nextState = getWordSyncState({
        positionMs: syncPositionMs,
        verseTimeline: timelineRef.current.filter(
          (word) => word.verseId === activeVerseId,
        ),
      });
      setListenerWordState((previous) => {
        const sameCompleted =
          previous.completedWordPositions.length ===
            nextState.completedWordPositions.length &&
          previous.completedWordPositions.every(
            (position, index) =>
              position === nextState.completedWordPositions[index],
          );
        return previous.activeVerseId === activeVerseId &&
          previous.activeWordPosition === nextState.activeWordPosition &&
          sameCompleted
          ? previous
          : { activeVerseId, ...nextState };
      });
    },
    [onTadabburUpdate, tadabburVerses],
  );

  useEffect(() => {
    const unsubscribe = subscribeToPosition(handlePositionUpdate);
    handlePositionUpdate(getCurrentPositionMs());
    return unsubscribe;
  }, [
    getCurrentPositionMs,
    handlePositionUpdate,
    subscribeToPosition,
    syncSessionId,
  ]);

  const activeWordState = listenerWordState;
  const lastReadWordPosition =
    activeWordState.completedWordPositions.at(-1) ?? null;

  const visibleFontsLoaded = visibleVerses.every(
    (verse) =>
      loadedFonts.has(verse.fontFamily) || Font.isLoaded(verse.fontFamily),
  );
  useEffect(() => {
    if (
      !reciterId ||
      !rawTimestamps ||
      wordTimestamps.length === 0 ||
      syncedVerses.length === 0 ||
      !visibleFontsLoaded
    )
      return;
    handlePositionUpdate(getCurrentPositionMs());
    onTimelineReady?.(`${reciterId}:${surahId}`);
  }, [
    getCurrentPositionMs,
    handlePositionUpdate,
    onTimelineReady,
    rawTimestamps,
    reciterId,
    surahId,
    syncedVerses.length,
    visibleFontsLoaded,
    wordTimestamps.length,
  ]);
  useEffect(() => {
    let active = true;
    const missingFonts = visibleVerses.filter(
      (verse) =>
        !loadedFonts.has(verse.fontFamily) && !Font.isLoaded(verse.fontFamily),
    );
    if (missingFonts.length === 0) {
      return () => {
        active = false;
      };
    }

    const fontMap = missingFonts.reduce<Record<string, number>>(
      (accumulator, verse) => {
        accumulator[verse.fontFamily] = uthmanicHafsSource;
        return accumulator;
      },
      {},
    );

    void Font.loadAsync(fontMap)
      .then(() => {
        if (!active) return;
        setLoadedFonts((previous) => {
          const next = new Set(previous);
          Object.keys(fontMap).forEach((fontName) => {
            next.add(fontName);
          });
          return next;
        });
      })
      .catch((error) => {
        console.error("QURAN FONT LOAD ERROR", error);
      });

    return () => {
      active = false;
    };
  }, [loadedFonts, visibleVerses]);

  if (hidden) return null;

  if (!visibleFontsLoaded || syncedVerses.length === 0) {
    return (
      <View
        style={[
          styles.container,
          overlay && styles.overlayContainer,
          compact && styles.containerCompact,
          styles.emptyContainer,
        ]}
      >
        <Text style={styles.emptyTitle}>
          {!visibleFontsLoaded || loading
            ? "Chargement des versets…"
            : "Versets indisponibles"}
        </Text>
        <Text style={styles.emptyText}>
          {!visibleFontsLoaded
            ? "Chargement de la police Quran exacte."
            : loading
              ? "La synchronisation arrive dans un instant."
              : "Le texte de cette sourate n’a pas encore été reçu."}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        overlay && styles.overlayContainer,
        compact && styles.containerCompact,
      ]}
    >
      {!overlay ? <VerseModeTabs mode={mode} onChange={setMode} /> : null}
      <View style={styles.content}>
        {visibleVerses.map((verse) => (
          <SyncedVerseRow
            key={`${mode}-${verse.id}-${verse.fontFamily}`}
            verse={verse}
            isActive={verse.id === activeVerse?.id}
            mode={mode}
            activeWordPosition={
              verse.id === activeVerse?.id
                ? activeWordState.activeWordPosition
                : null
            }
            lastReadWordPosition={
              verse.id === activeVerse?.id ? lastReadWordPosition : null
            }
            screenWidth={width}
            preferredArabicSize={preferredArabicSize}
          />
        ))}
      </View>
    </View>
  );
}

function VerseModeTabs({
  mode,
  onChange,
}: {
  mode: VerseDisplayMode;
  onChange: (mode: VerseDisplayMode) => void;
}) {
  const tabs: { mode: VerseDisplayMode; label: string }[] = [
    { mode: "arabic", label: "Versets" },
    { mode: "translation", label: "Traduction" },
    { mode: "transliteration", label: "Phonétique" },
  ];

  return (
    <View style={styles.modeTabs}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.mode}
          accessibilityRole="button"
          onPress={() => onChange(tab.mode)}
          style={[styles.modeTab, mode === tab.mode && styles.modeTabActive]}
        >
          <Text
            style={[
              styles.modeTabText,
              mode === tab.mode && styles.modeTabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const StableArabicVerse = memo(function StableArabicVerse({
  words,
  activeWordPosition,
  lastReadWordPosition,
  fontFamily,
  screenWidth,
  preferredArabicSize,
}: {
  words: readonly SyncedWord[];
  activeWordPosition: number | null;
  lastReadWordPosition: number | null;
  fontFamily: string;
  screenWidth: number;
  preferredArabicSize: number;
}) {
  const metrics = getArabicReadingMetrics(screenWidth, preferredArabicSize);
  const arabicLineHeight = metrics.lineHeight + 4;

  return (
    <QuranArabicText
      screenWidth={screenWidth}
      preferredSize={preferredArabicSize}
      style={[styles.stableArabicText, { lineHeight: arabicLineHeight }]}
    >
      {words.map((word, index) => (
        <Fragment key={`${word.position}-${word.text}`}>
          <QuranWordHighlight
            fontFamily={fontFamily}
            isActive={word.position === activeWordPosition}
            isRead={
              lastReadWordPosition !== null &&
              word.position <= lastReadWordPosition
            }
            text={word.text}
          />
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </QuranArabicText>
  );
});

const SyncedVerseRow = memo(
  function SyncedVerseRow({
    verse,
    isActive,
    mode,
    activeWordPosition,
    lastReadWordPosition,
    screenWidth,
    preferredArabicSize,
  }: {
    verse: SyncedVerse;
    isActive: boolean;
    mode: VerseDisplayMode;
    activeWordPosition: number | null;
    lastReadWordPosition: number | null;
    screenWidth: number;
    preferredArabicSize: number;
  }) {
    const active = useSharedValue(isActive ? 1 : 0);

    useEffect(() => {
      active.value = withTiming(isActive ? 1 : 0, {
        duration: 320,
        easing: Easing.out(Easing.cubic),
      });
    }, [active, isActive]);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: 0.9 + active.value * 0.1,
      transform: [{ translateY: 0 }, { scale: 1 }],
      backgroundColor: interpolateColor(
        active.value,
        [0, 1],
        ["rgba(8,7,19,0.42)", "rgba(30,20,37,0.72)"],
      ),
      borderColor: interpolateColor(
        active.value,
        [0, 1],
        ["rgba(216,182,90,0.15)", "rgba(216,182,90,0.46)"],
      ),
    }));

    const stableWords = useMemo(
      () =>
        verse.words.length > 0
          ? verse.words
          : verse.arabic
              .split(/\s+/)
              .filter(Boolean)
              .map((text, index) => ({ position: index + 1, text })),
      [verse],
    );
    const translationExcerpt = verse.translation
      ? clipWords(verse.translation, 18)
      : "";
    const translationFull = verse.translation ?? "";
    const transliterationFull = verse.transliteration ?? "";

    return (
      <Reanimated.View
        style={[
          styles.row,
          mode !== "arabic" && styles.rowExpanded,
          animatedStyle,
        ]}
      >
        <View style={styles.verseTop}>
          <View style={[styles.number, isActive && styles.numberActive]}>
            <Text style={styles.numberText}>{verse.id}</Text>
          </View>
          <Text style={styles.statusText}>
            {isActive ? "En cours" : "À suivre"}
          </Text>
        </View>
        {mode === "arabic" ? (
          <>
            <StableArabicVerse
              words={stableWords}
              activeWordPosition={activeWordPosition}
              lastReadWordPosition={isActive ? lastReadWordPosition : null}
              fontFamily={verse.fontFamily}
              screenWidth={screenWidth}
              preferredArabicSize={preferredArabicSize}
            />
            {translationExcerpt ? (
              <Text numberOfLines={3} style={styles.translation}>
                {translationExcerpt}
              </Text>
            ) : null}
          </>
        ) : (
          <Text style={styles.translationOnly}>
            {mode === "translation" ? translationFull : transliterationFull}
          </Text>
        )}
      </Reanimated.View>
    );
  },
  (previous, next) =>
    previous.verse === next.verse &&
    previous.isActive === next.isActive &&
    previous.mode === next.mode &&
    previous.activeWordPosition === next.activeWordPosition &&
    previous.lastReadWordPosition === next.lastReadWordPosition &&
    previous.screenWidth === next.screenWidth &&
    previous.preferredArabicSize === next.preferredArabicSize,
);

const styles = StyleSheet.create({
  container: {
    minHeight: 214,
    marginTop: 0,
    overflow: "hidden",
    borderRadius: 0,
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  containerCompact: {
    minHeight: 196,
  },
  overlayContainer: {
    minHeight: 148,
    marginTop: 0,
    borderColor: "rgba(216,182,90,0.18)",
    backgroundColor: "rgba(8,7,19,0.42)",
  },
  content: {
    paddingHorizontal: 0,
    paddingTop: 8,
    paddingBottom: 2,
    gap: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  emptyTitle: {
    color: colors.goldMuted,
    fontFamily: typography.serifMedium,
    fontSize: 18,
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  modeTabs: {
    height: 36,
    padding: 3,
    flexDirection: "row",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(216,182,90,0.16)",
    backgroundColor: "rgba(8,7,19,0.36)",
  },
  modeTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  modeTabActive: {
    backgroundColor: "rgba(200,148,58,0.18)",
  },
  modeTabText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "800",
  },
  modeTabTextActive: {
    color: colors.goldLight,
  },
  row: {
    minHeight: 94,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 13,
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: colors.goldMuted,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 14,
  },
  rowExpanded: {
    minHeight: 124,
    paddingVertical: 16,
  },
  verseTop: {
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  number: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(200,148,58,0.78)",
    backgroundColor: "rgba(8,7,19,0.6)",
    shadowColor: colors.goldMuted,
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  numberActive: {
    borderColor: colors.goldMuted,
  },
  numberText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "800",
  },
  statusText: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  arabic: {
    color: ARABIC_READING_COLOR,
    fontFamily: ARABIC_READING_FONT_FAMILY,
    fontWeight: ARABIC_READING_FONT_WEIGHT,
    textAlign: "right",
    writingDirection: "rtl",
  },
  stableArabicText: {
    width: "100%",
    flexShrink: 1,
    includeFontPadding: false,
    writingDirection: "rtl",
    textAlign: "right",
  },
  arabicActive: {
    color: ARABIC_READING_COLOR,
  },
  translation: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "left",
  },
  translationOnly: {
    marginTop: 5,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 16.5,
    lineHeight: 25,
    fontWeight: "500",
  },
});
