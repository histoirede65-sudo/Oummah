import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";
import { SafeAreaView } from "react-native-safe-area-context";

import { useGlobalAudioPlayer } from "../../context/AudioPlayerProvider";
import { WasilContextButton } from "../../components/wasil/WasilContextButton";
import {
  loadDuaCatalog,
  type DuaCategory,
} from "../../features/dua/DuaCatalog";
import {
  getDuaFavorites,
  getDuaProgress,
  saveDuaProgress,
  toggleDuaFavorite,
} from "../../features/dua/DuaStore";
import { duaCategoryTitle, duaMeaning } from "../../features/dua/DuaLocalization";
import { ensureDuaCategoryFrench } from "../../features/dua/DuaTranslationService";
import { useDuaSpeech } from "../../features/dua/useDuaSpeech";
import { goalProgressBridge } from "../../features/daily-goals/services/goalProgressBridge";
import { loadReadConfirmations, onLocalMidnight, setReadConfirmation } from "../../features/reading-progress/ReadingValidationStore";
import { useLearningAudioPlayer } from "../../features/learning-audio/useLearningAudioPlayer";
import { ARABIC_READING_FONT_FAMILY } from "../../features/quran/ArabicReadingPresentation";
import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const totalSeconds = Math.floor(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remaining = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
  }
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function AudioSeekBar({
  progress,
  disabled,
  onSeek,
  onPreviewChange,
  accessibilityLabel,
}: {
  accessibilityLabel: string;
  progress: number;
  disabled: boolean;
  onSeek: (progress: number) => void;
  onPreviewChange?: (progress: number | null) => void;
}) {
  const [scrubProgress, setScrubProgress] = useState<number | null>(null);
  const safeProgress = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const displayedProgress = scrubProgress ?? safeProgress;
  const clampProgress = (value: number) => Math.min(1, Math.max(0, value));

  return (
    <Slider
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="adjustable"
      disabled={disabled}
      maximumTrackTintColor={colors.surfaceLight}
      maximumValue={1}
      minimumTrackTintColor={colors.goldLight}
      minimumValue={0}
      onSlidingComplete={(value) => {
        const finalProgress = clampProgress(value);
        if (!disabled && Number.isFinite(finalProgress)) onSeek(finalProgress);
        setScrubProgress(null);
        onPreviewChange?.(null);
      }}
      onSlidingStart={() => {
        setScrubProgress(safeProgress);
        onPreviewChange?.(safeProgress);
      }}
      onValueChange={(value) => {
        const nextProgress = clampProgress(value);
        setScrubProgress(nextProgress);
        onPreviewChange?.(nextProgress);
      }}
      style={styles.audioSlider}
      thumbTintColor={colors.goldLight}
      value={displayedProgress}
    />
  );
}

export default function DuaReaderScreen() {
  const { language, t } = useI18n();
  const { categoryId, item: requestedItem, period } = useLocalSearchParams<{
    categoryId: string;
    item?: string;
    period?: "morning" | "evening";
  }>();
  const requestedCategoryId = Number(categoryId);
  const [category, setCategory] = useState<DuaCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(Math.max(0, Number(requestedItem) || 0));
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [favoriteIds, setFavoriteIds] = useState<readonly string[]>([]);
  const [readDuaIds, setReadDuaIds] = useState<Set<string>>(new Set());
  const [savingReadIds, setSavingReadIds] = useState<Set<string>>(new Set());
  useFocusEffect(useCallback(() => {
    let active = true;
    void loadReadConfirmations('dua').then(ids => { if (active) setReadDuaIds(ids); });
    return () => { active = false; };
  }, []));
  useEffect(() => onLocalMidnight(() => setReadDuaIds(new Set())), []);
  const [listVisible, setListVisible] = useState(false);
  const [audioScrubProgress, setAudioScrubProgress] = useState<number | null>(null);
  const [learningRepeatCount, setLearningRepeatCount] = useState<1 | 3 | 5>(3);
  const [learningRepeatIndex, setLearningRepeatIndex] = useState(0);
  const repeatTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const repeatCompletionRef = useRef(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const goalAudioRef = useRef({ key: "", position: 0, pending: 0 });
  const { pause: pauseQuranAudio } = useGlobalAudioPlayer();
  const learningAudio = useLearningAudioPlayer({
    pauseCompetingAudio: pauseQuranAudio,
  });
  const duaSpeech = useDuaSpeech({
    pauseCompetingAudio: () => {
      pauseQuranAudio();
      learningAudio.stop();
    },
  });

  useEffect(() => {
    let active = true;
    const prepare = async () => {
      try {
        const [catalog, favorites, progress] = await Promise.all([
          loadDuaCatalog(),
          getDuaFavorites(),
          getDuaProgress(),
        ]);
        const found =
          catalog.find((entry) => entry.id === requestedCategoryId) ?? null;
        const translated = found ? await ensureDuaCategoryFrench(found) : null;
        if (!active) return;
        setCategory(translated);
        setFavoriteIds(favorites);
        if (progress?.categoryId === requestedCategoryId) {
          setCounters(progress.counters ?? {});
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void prepare();
    return () => {
      active = false;
    };
  }, [requestedCategoryId]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (repeatTimerRef.current) clearTimeout(repeatTimerRef.current);
    },
    [],
  );

  const adhkarPeriod =
    category?.section === "morning"
      ? "morning"
      : category?.section === "evening"
        ? "evening"
        : category?.section === "morning-evening" &&
            (period === "morning" || period === "evening")
          ? period
          : undefined;

  const items = useMemo(() => {
    const sourceItems = category?.items ?? [];
    if (!adhkarPeriod || category?.section === "morning" || category?.section === "evening") {
      return sourceItems;
    }

    return sourceItems.filter((item) => {
      const searchable = `${item.arabic} ${item.phonetic} ${item.french}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
      const morningOnly =
        /\bmatin\b|ce matin|du jour|today|morning|صباح|أصبح|اصبح|نهار/.test(searchable);
      const eveningOnly =
        /\bsoir\b|ce soir|de la nuit|evening|tonight|مساء|أمس|امس|ليلة|الليل/.test(searchable);

      if (morningOnly && !eveningOnly) return adhkarPeriod === "morning";
      if (eveningOnly && !morningOnly) return adhkarPeriod === "evening";
      return true;
    });
  }, [adhkarPeriod, category?.items]);
  const safeIndex = Math.min(Math.max(0, index), Math.max(0, items.length - 1));
  const current = items[safeIndex];
  const currentCount = current ? (counters[current.id] ?? 0) : 0;
  const target = current?.repetitions ?? 1;
  const currentAudioKey = current?.audioSource
    ? `asset:${current.id}`
    : current?.audioUrl;
  const currentAudioSource =
    current?.audioSource ??
    (current?.audioUrl ? { uri: current.audioUrl } : undefined);
  const hasRecordedAudio = Boolean(currentAudioSource);
  const complete = currentCount >= target;
  const isFavorite = current ? favoriteIds.includes(current.id) : false;
  const recordedIsPlaying =
    learningAudio.activeKey === current?.id && learningAudio.isPlaying;
  const speechIsPlaying =
    duaSpeech.activeKey === current?.id && duaSpeech.isPlaying;
  const isPlaying = recordedIsPlaying || speechIsPlaying;
  const isAudioLoading = hasRecordedAudio
    ? learningAudio.pendingKey === current?.id
    : duaSpeech.pendingKey === current?.id;
  const audioStartRatio = Math.min(0.94, current?.audioStartRatio ?? 0);
  const audioEndRatio = Math.max(
    audioStartRatio + 0.03,
    Math.min(1, current?.audioEndRatio ?? 1),
  );
  const audioStartOffsetSeconds = current?.audioStartOffsetSeconds ?? 0;
  const audioEndOffsetSeconds = current?.audioEndOffsetSeconds ?? 0;
  const audioHighlightDelaySeconds = current?.audioHighlightDelaySeconds ?? 0;
  const audioStartSeconds = current?.audioStartSeconds;
  const audioEndSeconds = current?.audioEndSeconds;
  const audioWordTimes = current?.audioWordTimes;
  const audioProgress = hasRecordedAudio
    ? learningAudio.activeKey === current?.id
      ? learningAudio.focusedProgress
      : 0
    : duaSpeech.activeKey === current?.id
      ? duaSpeech.progress
      : 0;
  const arabicWords = useMemo(
    () => current?.arabic.trim().split(/\s+/).filter(Boolean) ?? [],
    [current?.arabic],
  );

  const recordedActiveWordIndex = useMemo(() => {
    if (
      audioWordTimes?.length &&
      current &&
      learningAudio.activeKey === current.id
    ) {
      // Temps mesurés sur l'enregistrement : le mot affiché suit la voix.
      const position = learningAudio.currentTime + 0.05;
      if (position < audioWordTimes[0]) return -1;
      const next = audioWordTimes.findIndex((time) => time > position);
      return next === -1 ? audioWordTimes.length - 1 : next - 1;
    }
    if (
      !current ||
      !currentAudioKey ||
      learningAudio.activeKey !== current.id ||
      learningAudio.duration <= 0 ||
      learningAudio.focusedDuration <= 0 ||
      learningAudio.focusedCurrentTime <= Math.max(0.7, audioHighlightDelaySeconds)
    ) {
      return -1;
    }
    const weights = arabicWords.map((word) => {
      const letters = word.replace(/[^\u0600-\u06ff]/g, "").length;
      const pause = /[،؛,.!?؟:]$/.test(word) ? 2.2 : 0;
      const longPause = /[.؟!]$/.test(word) ? 1.8 : 0;
      return Math.max(1, letters + pause + longPause);
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const syncDuration = Math.max(
      0.1,
      learningAudio.focusedDuration - audioHighlightDelaySeconds,
    );
    const effectiveProgress = Math.min(
      1,
      Math.max(
        0,
        (learningAudio.focusedCurrentTime - audioHighlightDelaySeconds) / syncDuration,
      ),
    );
    const cursor = Math.min(0.999999, Math.max(0, effectiveProgress)) * totalWeight;
    const cumulative = weights.reduce<number[]>((sums, weight) => {
      sums.push((sums.at(-1) ?? 0) + weight);
      return sums;
    }, []);
    const found = cumulative.findIndex((elapsed) => cursor <= elapsed);
    return found < 0 ? Math.max(0, arabicWords.length - 1) : found;
  }, [
    arabicWords,
    learningAudio.activeKey,
    learningAudio.focusedDuration,
    learningAudio.duration,
    audioHighlightDelaySeconds,
    audioWordTimes,
    current,
    currentAudioKey,
    learningAudio.currentTime,
    learningAudio.focusedCurrentTime,
  ]);
  const activeWordIndex = hasRecordedAudio
    ? recordedActiveWordIndex
    : duaSpeech.activeKey === current?.id
      ? duaSpeech.activeWordIndex
      : -1;
  const audioCurrentTime = hasRecordedAudio
    ? learningAudio.focusedCurrentTime
    : duaSpeech.estimatedCurrentTime;
  const audioDuration = hasRecordedAudio
    ? learningAudio.focusedDuration
    : duaSpeech.estimatedDuration;
  const canSeekRecordedAudio =
    hasRecordedAudio && Number.isFinite(audioDuration) && audioDuration > 0;
  const displayedAudioProgress = audioScrubProgress ?? audioProgress;
  const displayedAudioCurrentTime =
    hasRecordedAudio && audioDuration > 0 && audioScrubProgress !== null
      ? audioScrubProgress * audioDuration
      : audioCurrentTime;
  const audioSpeed = hasRecordedAudio ? learningAudio.speed : duaSpeech.speed;
  const isWaitingForRecitation =
    hasRecordedAudio &&
    recordedIsPlaying &&
    audioHighlightDelaySeconds > 0 &&
    learningAudio.focusedCurrentTime < audioHighlightDelaySeconds;
  const audioError = hasRecordedAudio ? learningAudio.error : duaSpeech.error;
  const periodTitle =
    adhkarPeriod === "morning"
      ? t("dua.morningAdhkar")
      : adhkarPeriod === "evening"
        ? t("dua.eveningAdhkar")
        : category
          ? duaCategoryTitle(category, language)
          : t("dua.reader.invocation");
  const meaning = current ? duaMeaning(current, language) : "";

  useEffect(() => {
    const tracker = goalAudioRef.current;
    const key = current?.id ?? "";
    if (tracker.key !== key) {
      tracker.key = key;
      tracker.position = audioCurrentTime;
      tracker.pending = 0;
      return;
    }
    const delta = audioCurrentTime - tracker.position;
    tracker.position = audioCurrentTime;
    if (!isPlaying || delta <= 0 || delta > 3) return;
    tracker.pending += delta;
    if (tracker.pending < 5) return;
    const seconds = Math.floor(tracker.pending);
    tracker.pending -= seconds;
    goalProgressBridge.record({
      metric: "dua_listen_seconds",
      amount: seconds,
    });
  }, [audioCurrentTime, current?.id, isPlaying]);

  useEffect(() => {
    if (!category || !current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveDuaProgress({
        categoryId: category.id,
        itemIndex: safeIndex,
        counters,
        updatedAt: Date.now(),
      }).catch(() => undefined);
    }, 250);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [category, counters, current, safeIndex]);

  const stopAudio = useCallback(() => {
    if (repeatTimerRef.current) {
      clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = undefined;
    }
    setLearningRepeatIndex(0);
    learningAudio.stop();
    duaSpeech.stop();
  }, [duaSpeech, learningAudio]);

  useEffect(() => {
    // Each invocation must open in a clean learning state. This also prevents
    // a delayed repeat from the previous invocation from restarting its audio.
    if (repeatTimerRef.current) {
      clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = undefined;
    }
    setLearningRepeatIndex(0);
    setAudioScrubProgress(null);
  }, [current?.id]);

  const changeItem = useCallback(
    (nextIndex: number) => {
      if (!category || nextIndex < 0 || nextIndex >= items.length)
        return;
      stopAudio();
      setIndex(nextIndex);
      void Haptics.selectionAsync().catch(() => undefined);
    },
    [category, items.length, stopAudio],
  );

  const playRecordedAudio = useCallback(() => {
    if (!current || !currentAudioSource) return;
    learningAudio.toggle({
      key: current.id,
      source: currentAudioSource,
      startRatio: audioStartRatio,
      endRatio: audioEndRatio,
      startOffsetSeconds: audioStartOffsetSeconds,
      endOffsetSeconds: audioEndOffsetSeconds,
      startSeconds: audioStartSeconds,
      endSeconds: audioEndSeconds,
    });
  }, [
    audioEndOffsetSeconds,
    audioEndRatio,
    audioEndSeconds,
    audioStartSeconds,
    audioStartOffsetSeconds,
    audioStartRatio,
    current,
    currentAudioSource,
    learningAudio,
  ]);

  const toggleAudio = useCallback(() => {
    if (!current) return;
    if (repeatTimerRef.current) {
      clearTimeout(repeatTimerRef.current);
      repeatTimerRef.current = undefined;
    }
    if (currentAudioSource) {
      duaSpeech.stop();
      if (!recordedIsPlaying) {
        repeatCompletionRef.current = learningAudio.completionCount;
        setLearningRepeatIndex(1);
      }
      playRecordedAudio();
      return;
    }
    setLearningRepeatIndex(0);
    learningAudio.stop();
    duaSpeech.toggle({ key: current.id, text: current.arabic });
  }, [
    current,
    currentAudioSource,
    duaSpeech,
    learningAudio,
    playRecordedAudio,
    recordedIsPlaying,
  ]);

  useEffect(() => {
    if (!current?.id || !currentAudioSource || learningRepeatIndex <= 0) return;
    if (learningAudio.completionCount <= repeatCompletionRef.current) return;

    repeatCompletionRef.current = learningAudio.completionCount;
    if (learningRepeatIndex >= learningRepeatCount) {
      setLearningRepeatIndex(0);
      return;
    }

    const completedDuaId = current.id;
    repeatTimerRef.current = setTimeout(() => {
      // Do not restart an audio after the user has navigated to another dou'a.
      if (current?.id !== completedDuaId) return;
      setLearningRepeatIndex((value) => value + 1);
      playRecordedAudio();
    }, 650);

    return () => {
      if (repeatTimerRef.current) {
        clearTimeout(repeatTimerRef.current);
        repeatTimerRef.current = undefined;
      }
    };
  }, [
    current?.id,
    currentAudioSource,
    learningAudio.completionCount,
    learningRepeatCount,
    learningRepeatIndex,
    playRecordedAudio,
  ]);

  const cycleAudioSpeed = useCallback(() => {
    if (hasRecordedAudio) learningAudio.cycleSpeed();
    else duaSpeech.cycleSpeed();
  }, [duaSpeech, hasRecordedAudio, learningAudio]);

  const seekRecordedAudio = useCallback(
    (progress: number) => {
      if (!hasRecordedAudio || audioDuration <= 0) return;
      learningAudio.seekToProgress(
        progress,
        audioStartRatio,
        audioEndRatio,
        audioStartOffsetSeconds,
        audioEndOffsetSeconds,
        audioStartSeconds,
        audioEndSeconds,
      );
    },
    [
      audioDuration,
      audioEndOffsetSeconds,
      audioEndRatio,
      audioEndSeconds,
      audioStartSeconds,
      audioStartOffsetSeconds,
      audioStartRatio,
      hasRecordedAudio,
      learningAudio,
    ],
  );

  const toggleReadDua = useCallback(() => {
    if (!current || savingReadIds.has(current.id)) return;
    const id = current.id;
    const selected = !readDuaIds.has(id);
    setSavingReadIds(previous => new Set(previous).add(id));
    void (async () => {
      try {
        const ids = await setReadConfirmation('dua', id, selected);
        await goalProgressBridge.setEvidence('dua_read', `read:${id}`, selected);
        setReadDuaIds(ids);
      } catch {
        await setReadConfirmation('dua', id, !selected).catch(() => undefined);
        Alert.alert(t("dua.reader.saveFailedTitle"), t("dua.reader.saveFailedMessage"));
      } finally {
        setSavingReadIds(previous => { const next = new Set(previous); next.delete(id); return next; });
      }
    })();
  }, [current, readDuaIds, savingReadIds, t]);

  const incrementCounter = useCallback(() => {
    if (!current) return;
    const previous = counters[current.id] ?? 0;
    const next = Math.min(target, previous + 1);
    setCounters((values) => ({ ...values, [current.id]: next }));
    if (next >= target && previous < target) {
      // Le compteur terminé vaut confirmation de lecture.
      if (!readDuaIds.has(current.id)) toggleReadDua();
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => undefined);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
  }, [counters, current, readDuaIds, target, toggleReadDua]);

  const resetCounter = useCallback(() => {
    if (!current) return;
    setCounters((values) => ({ ...values, [current.id]: 0 }));
  }, [current]);

  const toggleFavorite = useCallback(async () => {
    if (!current) return;
    const result = await toggleDuaFavorite(current.id);
    setFavoriteIds(result.favorites);
    void Haptics.selectionAsync().catch(() => undefined);
  }, [current]);

  const share = useCallback(() => {
    if (!current || !category) return;
    void Share.share({
      message: `${current.arabic}\n\n${current.phonetic}\n\n${meaning}\n\n${duaCategoryTitle(category, language)}\n${t("dua.reader.sourceLabel", { source: current.source })}`,
    });
  }, [category, current, language, meaning, t]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.goldLight} />
        <Text style={styles.loadingText}>
          {t("dua.reader.loading")}
        </Text>
      </SafeAreaView>
    );
  }

  if (!category || !current) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <Ionicons
          name="alert-circle-outline"
          size={28}
          color={colors.goldLight}
        />
        <Text style={styles.loadingText}>
          {t("dua.reader.unavailable")}
        </Text>
        <Pressable onPress={() => router.back()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>{t("dua.reader.goBack")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isRead = readDuaIds.has(current.id);
  const isSavingRead = savingReadIds.has(current.id);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={t("common.back")}
          onPress={() => router.back()}
          style={styles.circleButton}
        >
          <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
        </Pressable>
        <View style={styles.titleCopy}>
          <Text numberOfLines={1} style={styles.title}>
            {periodTitle}
          </Text>
          <Text style={styles.subtitle}>
            {t("dua.reader.position", { current: safeIndex + 1, total: items.length })}
          </Text>
        </View>
        <View style={styles.topActions}>
          <Pressable
            accessibilityLabel={t("dua.reader.chooseDua")}
            onPress={() => setListVisible(true)}
            style={styles.circleButton}
          >
            <Ionicons name="list" size={20} color={colors.goldLight} />
          </Pressable>
          <Pressable
            accessibilityLabel={t(isFavorite ? "dua.reader.removeFavorite" : "dua.reader.addFavorite")}
            onPress={toggleFavorite}
            style={styles.circleButton}
          >
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={isFavorite ? colors.goldLight : colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.pageProgress}>
        <View
          style={[
            styles.pageProgressFill,
            { width: `${((safeIndex + 1) / items.length) * 100}%` },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.readerCard}>
          <Text selectable style={styles.arabic}>
            {arabicWords.map((word, wordIndex) => (
              <Text
                key={`${wordIndex}:${word}`}
                style={[
                  styles.arabicWord,
                  activeWordIndex >= 0 && wordIndex < activeWordIndex && styles.arabicWordRead,
                  wordIndex === activeWordIndex && styles.arabicWordActive,
                ]}
              >
                {word}
                {wordIndex < arabicWords.length - 1 ? " " : ""}
              </Text>
            ))}
          </Text>
          {isWaitingForRecitation ? (
            <Text style={styles.readerHint}>{t("dua.reader.introPlaying")}</Text>
          ) : null}

          <Text selectable style={styles.phonetic}>{current.phonetic}</Text>
          <View style={styles.languageDivider} />
          <Text selectable style={styles.french}>{meaning}</Text>

          <View style={styles.readerFooter}>
            <Pressable
              accessibilityLabel={t("dua.reader.openSource", { source: current.source })}
              disabled={!current.sourceUrl}
              onPress={() => current.sourceUrl && void Linking.openURL(current.sourceUrl)}
              style={styles.sourcePill}
            >
              <Ionicons name="shield-checkmark-outline" size={13} color={colors.goldLight} />
              <Text numberOfLines={1} style={styles.sourceText}>{current.source}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t("dua.reader.share")}
              onPress={share}
              style={styles.shareButton}
            >
              <Ionicons name="share-social-outline" size={17} color={colors.textSecondary} />
            </Pressable>
          </View>
          <WasilContextButton
            compact
            prompt={t("dua.reader.wasilPrompt", {
              arabic: current.arabic,
              meaning,
              source: current.source,
            })}
          />
        </View>

        <View style={styles.audioCard}>
          <View style={styles.audioRow}>
            <Pressable
              accessibilityLabel={isPlaying ? t("dua.reader.pause") : t("dua.reader.play")}
              disabled={!current}
              onPress={toggleAudio}
              style={[styles.audioPlay, !current && styles.disabled]}
            >
              {isAudioLoading ? (
                <ActivityIndicator size="small" color={colors.background} />
              ) : (
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={22}
                  color={colors.background}
                />
              )}
            </Pressable>
            <View style={styles.audioCopy}>
              {hasRecordedAudio ? (
                <AudioSeekBar
                  accessibilityLabel={t("dua.reader.seekBar")}
                  disabled={!canSeekRecordedAudio || isAudioLoading}
                  onSeek={seekRecordedAudio}
                  onPreviewChange={setAudioScrubProgress}
                  progress={displayedAudioProgress}
                />
              ) : (
                <View style={styles.audioTrack}>
                  <View style={[styles.audioFill, { width: `${audioProgress * 100}%` }]} />
                </View>
              )}
              <View style={styles.audioTimes}>
                <Text style={styles.audioTime}>
                  {isAudioLoading
                    ? t("dua.reader.loadingAudio")
                    : hasRecordedAudio
                      ? `${formatTime(displayedAudioCurrentTime)} / ${formatTime(audioDuration)}`
                      : t("dua.reader.phoneVoice")}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityLabel={t("dua.reader.speed")}
              onPress={cycleAudioSpeed}
              style={styles.speedButton}
            >
              <Text style={styles.speedText}>{audioSpeed}×</Text>
            </Pressable>
          </View>
          {hasRecordedAudio ? (
            <View style={styles.learningRepeatRow}>
              <Text style={styles.learningRepeatLabel}>{t("dua.reader.listenRepeat")}</Text>
              {([1, 3, 5] as const).map((count) => (
                <Pressable
                  accessibilityState={{ selected: learningRepeatCount === count }}
                  key={count}
                  onPress={() => {
                    stopAudio();
                    setLearningRepeatCount(count);
                  }}
                  style={[
                    styles.learningRepeatChoice,
                    learningRepeatCount === count && styles.learningRepeatChoiceActive,
                  ]}
                >
                  <Text style={[
                    styles.learningRepeatChoiceText,
                    learningRepeatCount === count && styles.learningRepeatChoiceTextActive,
                  ]}>
                    {count}×
                  </Text>
                </Pressable>
              ))}
              {learningRepeatIndex > 0 ? (
                <Text style={styles.learningRepeatStatus}>
                  {learningRepeatIndex}/{learningRepeatCount}
                </Text>
              ) : null}
            </View>
          ) : null}
        </View>

        {audioError ? (
          <Text style={styles.audioError}>
            {language === "fr" ? audioError : t("dua.reader.audioError")}
          </Text>
        ) : null}

        {target > 1 ? (
          <View style={[styles.counterBar, complete && styles.counterBarComplete]}>
            <View style={styles.counterCopy}>
              <Text style={styles.counterEyebrow}>
                {complete ? t("dua.reader.counterDone") : t("dua.reader.counterTitle")}
              </Text>
              <Text style={styles.counterLine}>
                <Text style={styles.counterValue}>{currentCount}</Text>
                <Text style={styles.counterTarget}>
                  {"  "}{t("dua.reader.counterOutOf", { target })}
                </Text>
              </Text>
            </View>
            <Pressable
              accessibilityLabel={t("dua.reader.counterReset")}
              disabled={currentCount === 0}
              onPress={resetCounter}
              style={[styles.resetButton, currentCount === 0 && styles.disabled]}
            >
              <Ionicons name="refresh" size={16} color={colors.textMuted} />
            </Pressable>
            <Pressable
              accessibilityLabel={t("dua.reader.counterAccessibility", { count: currentCount, target })}
              disabled={complete}
              onPress={incrementCounter}
              style={({ pressed }) => [
                styles.counterButton,
                complete && styles.counterButtonComplete,
                pressed && styles.counterPressed,
              ]}
            >
              {complete ? (
                <Ionicons name="checkmark" size={22} color={colors.background} />
              ) : (
                <Text style={styles.counterButtonText}>+1</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ checked: isRead }}
            disabled={isSavingRead}
            onPress={toggleReadDua}
            style={[styles.readDuaButton, isRead && styles.readDuaButtonDone]}
          >
            <Ionicons
              name={isRead ? "checkmark-circle" : "ellipse-outline"}
              size={20}
              color={isRead ? colors.success : colors.goldLight}
            />
            <Text style={styles.readDuaButtonText}>
              {isRead ? t("dua.reader.readDone") : t("dua.reader.markRead")}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={styles.navigation}>
        <Pressable
          disabled={safeIndex <= 0}
          onPress={() => changeItem(safeIndex - 1)}
          style={[styles.navButton, safeIndex <= 0 && styles.disabled]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.goldLight} />
          <Text style={styles.navText}>{t("dua.reader.previous")}</Text>
        </Pressable>
        <Pressable
          disabled={safeIndex >= items.length - 1}
          onPress={() => changeItem(safeIndex + 1)}
          style={[
            styles.navButton,
            styles.navButtonPrimary,
            safeIndex >= items.length - 1 && styles.disabled,
          ]}
        >
          <Text style={styles.navTextPrimary}>{t("dua.reader.next")}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.background} />
        </Pressable>
      </View>

      <Modal
        visible={listVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setListVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setListVisible(false)}>
          <Pressable style={styles.modalSheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>{t("dua.reader.chooseDuaEyebrow")}</Text>
                <Text style={styles.modalTitle}>{periodTitle}</Text>
              </View>
              <Pressable accessibilityLabel={t("hifz.session.close")} onPress={() => setListVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalList}>
              {items.map((item, itemIndex) => {
                const selected = itemIndex === safeIndex;
                const done = (counters[item.id] ?? 0) >= (item.repetitions ?? 1);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      changeItem(itemIndex);
                      setListVisible(false);
                    }}
                    style={[styles.modalItem, selected && styles.modalItemSelected]}
                  >
                    <View style={[styles.modalIndex, selected && styles.modalIndexSelected]}>
                      <Text style={[styles.modalIndexText, selected && styles.modalIndexTextSelected]}>
                        {itemIndex + 1}
                      </Text>
                    </View>
                    <View style={styles.modalItemCopy}>
                      <Text numberOfLines={1} style={styles.modalItemArabic}>{item.arabic}</Text>
                      <Text numberOfLines={2} style={styles.modalItemFrench}>{duaMeaning(item, language)}</Text>
                    </View>
                    {done ? (
                      <Ionicons name="checkmark-circle" size={20} color={colors.goldLight} />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loadingScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    textAlign: "center",
  },
  errorButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: colors.goldLight,
  },
  errorButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  topBar: {
    height: 70,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  circleButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
  },
  titleCopy: { flex: 1, minWidth: 0, marginHorizontal: 11 },
  title: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 21,
  },
  subtitle: {
    marginTop: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  pageProgress: {
    height: 3,
    marginHorizontal: 14,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: "#1E1730",
  },
  pageProgressFill: { height: "100%", borderRadius: 2, backgroundColor: colors.goldLight },
  content: { padding: 14, paddingBottom: 110 },
  readerCard: {
    padding: 16,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
  },
  sourcePill: {
    flexShrink: 1,
    height: 30,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#100C19",
  },
  sourceText: {
    flexShrink: 1,
    marginLeft: 6,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "700",
  },
  shareButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "#1E1730",
  },
  arabic: {
    marginTop: 2,
    marginBottom: 10,
    color: "#FFF9F0",
    fontFamily: ARABIC_READING_FONT_FAMILY,
    fontSize: 30,
    lineHeight: 52,
    textAlign: "right",
    writingDirection: "rtl",
  },
  readDuaButton: {
    marginTop: 12,
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.55)",
    backgroundColor: "rgba(227,181,90,0.10)",
  },
  readDuaButtonDone: { borderColor: colors.success, backgroundColor: "rgba(98,197,139,0.14)" },
  readDuaButtonText: { color: colors.text, fontFamily: typography.sans, fontSize: 14, fontWeight: "800" },
  arabicWord: { color: "#FFF9F0" },
  arabicWordActive: {
    color: colors.goldLight,
    textDecorationLine: "underline",
    textDecorationColor: colors.goldLight,
    textShadowColor: "rgba(255,211,105,0.72)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 7,
  },
  languageDivider: {
    height: 1,
    marginVertical: 14,
    backgroundColor: "rgba(227,181,90,0.16)",
  },
  phonetic: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 23,
  },
  french: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 15,
    lineHeight: 23,
  },
  readerHint: { marginBottom: 8, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11 },
  readerFooter: {
    marginTop: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  audioCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
  },
  audioPlay: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: colors.goldLight,
  },
  audioCopy: { flex: 1, minWidth: 0, marginHorizontal: 10 },
  audioTrack: {
    height: 4,
    marginVertical: 18,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: "#1E1730",
  },
  audioSlider: {
    flex: 1,
    height: 40,
  },
  audioFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: colors.goldLight,
  },
  audioTimes: { marginTop: -4, flexDirection: "row", justifyContent: "flex-start" },
  audioTime: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  speedButton: {
    minWidth: 44,
    height: 34,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#1E1730",
  },
  speedText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "800",
  },
  learningRepeatRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  learningRepeatLabel: {
    marginRight: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  learningRepeatChoice: {
    minWidth: 40,
    height: 30,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#100C19",
  },
  learningRepeatChoiceActive: {
    borderColor: "rgba(227,181,90,0.62)",
    backgroundColor: "rgba(227,181,90,0.16)",
  },
  learningRepeatChoiceText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "800",
  },
  learningRepeatChoiceTextActive: { color: colors.goldLight },
  learningRepeatStatus: {
    marginLeft: "auto",
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "800",
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  audioError: {
    marginTop: 8,
    paddingHorizontal: 8,
    color: colors.danger,
    fontFamily: typography.sans,
    fontSize: 11,
    textAlign: "center",
  },
  counterEyebrow: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },
  resetButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#2B2238",
  },
  counterButton: {
    width: 64,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.goldLight,
  },
  counterPressed: { transform: [{ scale: 0.96 }] },
  counterValue: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 26,
    fontWeight: "800",
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  counterTarget: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  navigation: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 82,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: "#2B2238",
    backgroundColor: "rgba(8,7,19,0.97)",
  },
  navButton: {
    flex: 1,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
  },
  navButtonPrimary: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  navText: {
    marginLeft: 7,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: "700",
  },
  navTextPrimary: {
    marginRight: 7,
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: "800",
  },
  disabled: { opacity: 0.3 },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(4,3,9,0.72)",
  },
  modalSheet: {
    maxHeight: "82%",
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.background,
  },
  modalHandle: {
    alignSelf: "center",
    width: 46,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderSoft,
  },
  modalHeader: {
    marginTop: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  modalTitle: {
    marginTop: 3,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 20,
  },
  modalClose: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "#151022",
  },
  modalList: { gap: 8, paddingBottom: 10 },
  modalItem: {
    minHeight: 78,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#151022",
  },
  modalItemSelected: {
    borderColor: "rgba(227,181,90,0.58)",
    backgroundColor: "rgba(227,181,90,0.10)",
  },
  modalIndex: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modalIndexSelected: { backgroundColor: colors.goldLight },
  modalIndexText: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  modalIndexTextSelected: { color: colors.background },
  modalItemCopy: { flex: 1, minWidth: 0, marginHorizontal: 10 },
  modalItemArabic: {
    color: colors.goldMuted,
    fontFamily: ARABIC_READING_FONT_FAMILY,
    fontSize: 17,
    lineHeight: 25,
    textAlign: "right",
    writingDirection: "rtl",
  },
  modalItemFrench: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 15,
  },
  arabicWordRead: { color: colors.goldMuted },
  audioRow: { flexDirection: "row", alignItems: "center" },
  counterBar: {
    marginTop: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2B2238",
    backgroundColor: "#1E1730",
  },
  counterBarComplete: { borderColor: colors.goldLight },
  counterCopy: { flex: 1, minWidth: 0 },
  counterLine: { marginTop: 2 },
  counterButtonComplete: { backgroundColor: colors.success },
  counterButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 18,
    fontWeight: "800",
  },
});
