import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
import { ensureDuaCategoryFrench } from "../../features/dua/DuaTranslationService";
import { useDuaSpeech } from "../../features/dua/useDuaSpeech";
import { goalProgressBridge } from "../../features/daily-goals/services/goalProgressBridge";
import { useLearningAudioPlayer } from "../../features/learning-audio/useLearningAudioPlayer";
import { ARABIC_READING_FONT_FAMILY } from "../../features/quran/ArabicReadingPresentation";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export default function DuaReaderScreen() {
  const { categoryId, item: requestedItem } = useLocalSearchParams<{
    categoryId: string;
    item?: string;
  }>();
  const requestedCategoryId = Number(categoryId);
  const [category, setCategory] = useState<DuaCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(Math.max(0, Number(requestedItem) || 0));
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [favoriteIds, setFavoriteIds] = useState<readonly string[]>([]);
  const [audioTrackWidth, setAudioTrackWidth] = useState(0);
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
    },
    [],
  );

  const items = category?.items ?? [];
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
  const audioProgress = hasRecordedAudio
    ? learningAudio.activeKey === current?.id
      ? learningAudio.focusedProgress
      : 0
    : duaSpeech.activeKey === current?.id
      ? duaSpeech.progress
      : 0;
  const hasFocusedAudio =
    hasRecordedAudio &&
    (audioStartRatio > 0.015 ||
      audioEndRatio < 0.985 ||
      audioStartOffsetSeconds > 0.05 ||
      audioEndOffsetSeconds > 0.05);
  const arabicWords = useMemo(
    () => current?.arabic.trim().split(/\s+/).filter(Boolean) ?? [],
    [current?.arabic],
  );

  const recordedActiveWordIndex = useMemo(() => {
    if (
      !current ||
      !currentAudioKey ||
      learningAudio.activeKey !== current.id ||
      learningAudio.duration <= 0 ||
      learningAudio.currentTime <= 0
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
    const cursor = learningAudio.focusedProgress * totalWeight;
    let elapsed = 0;
    const found = weights.findIndex((weight) => {
      elapsed += weight;
      return cursor <= elapsed;
    });
    return found < 0 ? Math.max(0, arabicWords.length - 1) : found;
  }, [
    arabicWords,
    learningAudio.activeKey,
    learningAudio.focusedProgress,
    learningAudio.duration,
    current?.id,
    currentAudioKey,
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
  const audioSpeed = hasRecordedAudio ? learningAudio.speed : duaSpeech.speed;
  const audioError = hasRecordedAudio ? learningAudio.error : duaSpeech.error;

  useEffect(() => {
    if (!current) return;
    goalProgressBridge.record({
      metric: "dua_read",
      evidenceId: current.id,
    });
  }, [current]);

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
    learningAudio.stop();
    duaSpeech.stop();
  }, [duaSpeech, learningAudio]);

  const changeItem = useCallback(
    (nextIndex: number) => {
      if (!category || nextIndex < 0 || nextIndex >= category.items.length)
        return;
      stopAudio();
      setIndex(nextIndex);
      void Haptics.selectionAsync().catch(() => undefined);
    },
    [category, stopAudio],
  );

  const toggleAudio = useCallback(() => {
    if (!current) return;
    if (currentAudioSource) {
      duaSpeech.stop();
      learningAudio.toggle({
        key: current.id,
        source: currentAudioSource,
        startRatio: audioStartRatio,
        endRatio: audioEndRatio,
        startOffsetSeconds: audioStartOffsetSeconds,
        endOffsetSeconds: audioEndOffsetSeconds,
      });
      return;
    }
    learningAudio.stop();
    duaSpeech.toggle({ key: current.id, text: current.arabic });
  }, [
    audioStartRatio,
    audioEndRatio,
    audioStartOffsetSeconds,
    audioEndOffsetSeconds,
    current,
    currentAudioSource,
    duaSpeech,
    learningAudio,
  ]);

  const cycleAudioSpeed = useCallback(() => {
    if (hasRecordedAudio) learningAudio.cycleSpeed();
    else duaSpeech.cycleSpeed();
  }, [duaSpeech, hasRecordedAudio, learningAudio]);

  const incrementCounter = useCallback(() => {
    if (!current) return;
    const previous = counters[current.id] ?? 0;
    const next = Math.min(target, previous + 1);
    setCounters((values) => ({ ...values, [current.id]: next }));
    if (next >= target && previous < target) {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => undefined);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
  }, [counters, current, target]);

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
      message: `${current.arabic}\n\n${current.phonetic}\n\n${current.french}\n\n${category.frenchTitle}\nSource : ${current.source}`,
    });
  }, [category, current]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.goldLight} />
        <Text style={styles.loadingText}>
          Préparation de la dou‘ā et de sa traduction…
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
          Cette invocation est momentanément indisponible.
        </Text>
        <Pressable onPress={() => router.back()} style={styles.errorButton}>
          <Text style={styles.errorButtonText}>Revenir</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.circleButton}>
          <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
        </Pressable>
        <View style={styles.titleCopy}>
          <Text numberOfLines={1} style={styles.title}>
            {category.frenchTitle}
          </Text>
          <Text style={styles.subtitle}>
            Dou‘ā {safeIndex + 1} sur {items.length}
          </Text>
        </View>
        <Pressable onPress={toggleFavorite} style={styles.circleButton}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? colors.goldLight : colors.textSecondary}
          />
        </Pressable>
      </View>

      <View style={styles.pageProgress}>
        <LinearGradient
          colors={[colors.goldDark, colors.goldLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
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
          <LinearGradient
            colors={["rgba(54,29,72,0.96)", "rgba(18,12,29,0.99)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.readerLiquidOrb} />
          <View style={styles.readerSheen} />
          <View style={styles.readerTopRow}>
            <Pressable
              disabled={!current.sourceUrl}
              onPress={() =>
                current.sourceUrl && void Linking.openURL(current.sourceUrl)
              }
              style={styles.sourcePill}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={13}
                color={colors.goldLight}
              />
              <Text style={styles.sourceText}>{current.source}</Text>
            </Pressable>
            <Pressable onPress={share} style={styles.shareButton}>
              <Ionicons
                name="share-social-outline"
                size={17}
                color={colors.textSecondary}
              />
            </Pressable>
            <WasilContextButton
              compact
              prompt={`Explique-moi quand et comment réciter cette dou‘a, uniquement à partir des sources vérifiées d’OUMMAH. Dou‘a : ${current.arabic}. Traduction : ${current.french}. Source : ${current.source}`}
            />
          </View>

          <Text selectable style={styles.arabic}>
            {arabicWords.map((word, wordIndex) => (
              <Text
                key={`${wordIndex}:${word}`}
                style={[
                  styles.arabicWord,
                  wordIndex === activeWordIndex && styles.arabicWordActive,
                ]}
              >
                {word}
                {wordIndex < arabicWords.length - 1 ? " " : ""}
              </Text>
            ))}
          </Text>

          <View style={styles.languageDivider} />
          <View style={styles.languageHeading}>
            <Ionicons
              name="language-outline"
              size={14}
              color={colors.goldLight}
            />
            <Text style={styles.languageLabel}>PHONÉTIQUE</Text>
          </View>
          <Text selectable style={styles.phonetic}>
            {current.phonetic}
          </Text>

          <View style={styles.languageHeading}>
            <Ionicons name="book-outline" size={14} color={colors.goldLight} />
            <Text style={styles.languageLabel}>TRADUCTION FRANÇAISE</Text>
          </View>
          <Text selectable style={styles.french}>
            {current.french}
          </Text>

          <View style={styles.readerFooter}>
            <View style={styles.repeatPill}>
              <Ionicons
                name="repeat-outline"
                size={14}
                color={colors.goldLight}
              />
              <Text style={styles.repeatText}>{target}× recommandé</Text>
            </View>
            <Text style={styles.orderText}>N° {current.order}</Text>
          </View>
        </View>

        <View style={styles.audioCard}>
          <View style={styles.audioLiquidOrb} />
          <View style={styles.audioSheen} />
          {hasFocusedAudio ? (
            <View style={styles.focusedAudioPill}>
              <Ionicons name="cut-outline" size={12} color={colors.goldLight} />
              <Text style={styles.focusedAudioText}>
                Introduction retirée · audio centré sur la dou‘ā
              </Text>
            </View>
          ) : null}
          <Pressable
            disabled={!current}
            onPress={toggleAudio}
            style={[styles.audioPlay, !current && styles.disabled]}
          >
            {isAudioLoading ? (
              <ActivityIndicator size="small" color={colors.background} />
            ) : (
              <Ionicons
                name={isPlaying ? "pause" : "play"}
                size={24}
                color={colors.background}
              />
            )}
          </Pressable>
          <View style={styles.audioCopy}>
            <Text style={styles.audioTitle}>
              {isAudioLoading
                ? "Chargement de la récitation…"
                : hasRecordedAudio
                  ? "Écouter pour apprendre"
                  : "Écouter avec la voix arabe du téléphone"}
            </Text>
            <Pressable
              onLayout={(event) =>
                setAudioTrackWidth(event.nativeEvent.layout.width)
              }
              onPress={(event) => {
                if (!hasRecordedAudio || audioTrackWidth <= 0) return;
                learningAudio.seekToProgress(
                  event.nativeEvent.locationX / audioTrackWidth,
                  audioStartRatio,
                  audioEndRatio,
                  audioStartOffsetSeconds,
                  audioEndOffsetSeconds,
                );
              }}
              style={styles.audioTrack}
            >
              <View
                style={[styles.audioFill, { width: `${audioProgress * 100}%` }]}
              />
            </Pressable>
            <View style={styles.audioTimes}>
              <Text style={styles.audioTime}>
                {formatTime(audioCurrentTime)}
              </Text>
              <Text style={styles.audioTime}>{formatTime(audioDuration)}</Text>
            </View>
          </View>
          <Pressable onPress={cycleAudioSpeed} style={styles.speedButton}>
            <Text style={styles.speedText}>{audioSpeed}×</Text>
          </Pressable>
        </View>
        {audioError ? (
          <Text style={styles.audioError}>{audioError}</Text>
        ) : null}

        <View style={styles.counterSection}>
          <View style={styles.counterHeading}>
            <View>
              <Text style={styles.counterEyebrow}>COMPTEUR DE RÉPÉTITIONS</Text>
              <Text style={styles.counterTitle}>
                {complete
                  ? "Terminé, mā shā’ Allāh"
                  : `${target - currentCount} restant${target - currentCount > 1 ? "s" : ""}`}
              </Text>
            </View>
            <Pressable onPress={resetCounter} style={styles.resetButton}>
              <Ionicons name="refresh" size={16} color={colors.textMuted} />
            </Pressable>
          </View>

          <Pressable
            onPress={incrementCounter}
            style={({ pressed }) => [
              styles.counterButton,
              complete && styles.counterComplete,
              pressed && styles.counterPressed,
            ]}
          >
            <LinearGradient
              colors={
                complete ? ["#D9A94D", "#F1CC73"] : ["#4E275F", "#251431"]
              }
              style={StyleSheet.absoluteFill}
            />
            <Text
              style={[
                styles.counterValue,
                complete && styles.counterValueComplete,
              ]}
            >
              {currentCount}
            </Text>
            <Text
              style={[
                styles.counterTarget,
                complete && styles.counterTargetComplete,
              ]}
            >
              / {target}
            </Text>
            <Text
              style={[styles.tapHint, complete && styles.counterTargetComplete]}
            >
              {complete ? "COMPLÉTÉ" : "TOUCHEZ POUR COMPTER"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.navigation}>
        <Pressable
          disabled={safeIndex <= 0}
          onPress={() => changeItem(safeIndex - 1)}
          style={[styles.navButton, safeIndex <= 0 && styles.disabled]}
        >
          <Ionicons name="arrow-back" size={18} color={colors.goldLight} />
          <Text style={styles.navText}>Précédent</Text>
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
          <Text style={styles.navTextPrimary}>Suivant</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.background} />
        </Pressable>
      </View>
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
    borderColor: colors.borderSoft,
    backgroundColor: colors.purpleDeep,
  },
  titleCopy: { flex: 1, minWidth: 0, marginHorizontal: 11 },
  title: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 21,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
  },
  pageProgress: {
    height: 3,
    marginHorizontal: 14,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: colors.surfaceLight,
  },
  pageProgressFill: { height: "100%", borderRadius: 2 },
  content: { padding: 14, paddingBottom: 105 },
  readerCard: {
    minHeight: 430,
    overflow: "hidden",
    padding: 17,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
    backgroundColor: colors.surface,
  },
  readerLiquidOrb: {
    position: "absolute",
    top: -105,
    right: -78,
    width: 245,
    height: 245,
    borderRadius: 123,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  readerSheen: {
    position: "absolute",
    top: 0,
    right: 28,
    left: 28,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.38)",
  },
  readerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sourcePill: {
    height: 29,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(12,8,22,0.58)",
  },
  sourceText: {
    marginLeft: 5,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "700",
  },
  shareButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(18,11,30,0.72)",
  },
  arabic: {
    flexGrow: 0,
    marginVertical: 23,
    color: "#FFF9F0",
    fontFamily: ARABIC_READING_FONT_FAMILY,
    fontSize: 31,
    lineHeight: 52,
    textAlign: "right",
    writingDirection: "rtl",
  },
  arabicWord: { color: "#FFF9F0" },
  arabicWordActive: {
    color: "#FFD978",
    backgroundColor: "rgba(227,181,90,0.13)",
    textShadowColor: "rgba(255,211,105,0.92)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  languageDivider: {
    height: 1,
    marginBottom: 16,
    backgroundColor: "rgba(227,181,90,0.16)",
  },
  languageHeading: {
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  languageLabel: {
    marginLeft: 6,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 1,
  },
  phonetic: {
    marginTop: 8,
    marginBottom: 18,
    color: "#F1E7F3",
    fontFamily: typography.serifMedium,
    fontSize: 16,
    lineHeight: 24,
  },
  french: {
    marginTop: 8,
    marginBottom: 21,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 19,
  },
  summaryNotice: {
    marginTop: 10,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.18)",
    backgroundColor: "rgba(9,7,15,0.28)",
  },
  summaryNoticeText: {
    flex: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.2,
    lineHeight: 13.5,
  },
  focusedAudioPill: {
    position: "absolute",
    top: 8,
    left: 72,
    right: 54,
    minHeight: 23,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.28)",
    backgroundColor: "rgba(54,29,72,0.76)",
  },
  focusedAudioText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 7.8,
    fontWeight: "700",
  },
  readerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  repeatPill: {
    height: 30,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: "rgba(132,76,153,0.22)",
  },
  repeatText: {
    marginLeft: 6,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 8.5,
    fontWeight: "700",
  },
  orderText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8.5,
  },
  audioCard: {
    minHeight: 112,
    marginTop: 10,
    paddingHorizontal: 11,
    paddingTop: 32,
    paddingBottom: 11,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(255,242,220,0.22)",
    backgroundColor: "rgba(33,20,45,0.92)",
    shadowColor: "#7D4993",
    shadowOpacity: 0.18,
    shadowRadius: 11,
  },
  audioLiquidOrb: {
    position: "absolute",
    top: -58,
    right: -22,
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  audioSheen: {
    position: "absolute",
    top: 0,
    right: 20,
    left: 20,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  audioPlay: {
    width: 49,
    height: 49,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 25,
    backgroundColor: colors.goldLight,
    shadowColor: colors.goldLight,
    shadowOpacity: 0.38,
    shadowRadius: 8,
    elevation: 4,
  },
  audioCopy: { flex: 1, minWidth: 0, marginHorizontal: 11 },
  audioTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  audioTrack: {
    height: 4,
    marginTop: 9,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: colors.surfaceLight,
  },
  audioFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: colors.goldLight,
  },
  audioTimes: {
    marginTop: 3,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  audioTime: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7,
    fontVariant: ["tabular-nums"],
  },
  speedButton: {
    width: 38,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.purpleDeep,
  },
  speedText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 8.5,
    fontWeight: "800",
  },
  audioError: {
    marginTop: 7,
    paddingHorizontal: 8,
    color: colors.danger,
    fontFamily: typography.sans,
    fontSize: 8.5,
    textAlign: "center",
  },
  counterSection: { marginTop: 15 },
  counterHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  counterEyebrow: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 1,
  },
  counterTitle: {
    marginTop: 3,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  resetButton: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  counterButton: {
    width: 174,
    height: 174,
    marginTop: 14,
    overflow: "hidden",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 87,
    borderWidth: 2,
    borderColor: "rgba(227,181,90,0.40)",
    shadowColor: colors.purpleGlow,
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 7,
  },
  counterComplete: {
    borderColor: colors.goldLight,
    shadowColor: colors.goldLight,
  },
  counterPressed: { transform: [{ scale: 0.97 }] },
  counterValue: {
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 58,
    lineHeight: 62,
    fontVariant: ["tabular-nums"],
  },
  counterValueComplete: { color: colors.background },
  counterTarget: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 13,
  },
  counterTargetComplete: { color: "rgba(8,7,19,0.72)" },
  tapHint: {
    marginTop: 8,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.9,
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
    borderTopColor: colors.borderSoft,
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
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  navButtonPrimary: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  navText: {
    marginLeft: 7,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "700",
  },
  navTextPrimary: {
    marginRight: 7,
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  disabled: { opacity: 0.3 },
});
