import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useGlobalAudioPlayer } from "../../context/AudioPlayerProvider";
import {
  loadDhikrCatalog,
  type DhikrCategory,
} from "../../features/dhikr/DhikrCatalog";
import {
  getDhikrFavorites,
  getDhikrProgress,
  saveDhikrProgress,
  toggleDhikrFavorite,
} from "../../features/dhikr/DhikrStore";
import { useLearningAudioPlayer } from "../../features/learning-audio/useLearningAudioPlayer";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export default function DhikrReaderScreen() {
  const { categoryId, item: requestedItem } = useLocalSearchParams<{
    categoryId: string;
    item?: string;
  }>();
  const requestedCategoryId = Number(categoryId);
  const [category, setCategory] = useState<DhikrCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(Math.max(0, Number(requestedItem) || 0));
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [favoriteIds, setFavoriteIds] = useState<readonly string[]>([]);
  const [audioTrackWidth, setAudioTrackWidth] = useState(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const { pause: pauseQuranAudio } = useGlobalAudioPlayer();
  const learningAudio = useLearningAudioPlayer({
    pauseCompetingAudio: pauseQuranAudio,
  });

  useEffect(() => {
    let active = true;
    Promise.all([loadDhikrCatalog(), getDhikrFavorites(), getDhikrProgress()])
      .then(([catalog, favorites, progress]) => {
        if (!active) return;
        const found =
          catalog.find((entry) => entry.id === requestedCategoryId) ?? null;
        setCategory(found);
        setFavoriteIds(favorites);
        if (progress?.categoryId === requestedCategoryId) {
          setCounters(progress.counters ?? {});
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
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
  const complete = currentCount >= target;
  const isFavorite = current ? favoriteIds.includes(current.id) : false;
  const isPlaying =
    learningAudio.activeKey === current?.id && learningAudio.isPlaying;
  const isAudioLoading = learningAudio.pendingKey === current?.id;
  const audioProgress =
    learningAudio.activeKey === current?.id ? learningAudio.progress : 0;

  useEffect(() => {
    if (!category || !current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveDhikrProgress({
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
  }, [learningAudio]);

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
    if (!current || !currentAudioKey || !currentAudioSource) return;
    learningAudio.toggle({
      key: current.id,
      source: currentAudioSource,
    });
  }, [current, currentAudioKey, currentAudioSource, learningAudio]);

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
    const result = await toggleDhikrFavorite(current.id);
    setFavoriteIds(result.favorites);
    void Haptics.selectionAsync().catch(() => undefined);
  }, [current]);

  const share = useCallback(() => {
    if (!current || !category) return;
    void Share.share({
      message: `${current.arabic}\n\n${category.frenchTitle}\nSource : ${current.source}`,
    });
  }, [category, current]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.goldLight} />
        <Text style={styles.loadingText}>Préparation de votre dhikr…</Text>
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
          Ce dhikr est momentanément indisponible.
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
            Dhikr {safeIndex + 1} sur {items.length}
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
          <View style={styles.readerTopRow}>
            <View style={styles.sourcePill}>
              <Ionicons
                name="shield-checkmark-outline"
                size={13}
                color={colors.goldLight}
              />
              <Text style={styles.sourceText}>{current.source}</Text>
            </View>
            <Pressable onPress={share} style={styles.shareButton}>
              <Ionicons
                name="share-social-outline"
                size={17}
                color={colors.textSecondary}
              />
            </Pressable>
          </View>

          <Text selectable style={styles.arabic}>
            {current.arabic}
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
          <Pressable
            disabled={!currentAudioSource}
            onPress={toggleAudio}
            style={[styles.audioPlay, !currentAudioSource && styles.disabled]}
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
                : currentAudioSource
                  ? "Écouter pour apprendre"
                  : "Audio indisponible pour ce dhikr"}
            </Text>
            <Pressable
              onLayout={(event) =>
                setAudioTrackWidth(event.nativeEvent.layout.width)
              }
              onPress={(event) => {
                if (audioTrackWidth <= 0) return;
                learningAudio.seekToProgress(
                  event.nativeEvent.locationX / audioTrackWidth,
                  0,
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
                {formatTime(learningAudio.currentTime)}
              </Text>
              <Text style={styles.audioTime}>
                {formatTime(learningAudio.duration)}
              </Text>
            </View>
          </View>
          <Pressable onPress={learningAudio.cycleSpeed} style={styles.speedButton}>
            <Text style={styles.speedText}>{learningAudio.speed}×</Text>
          </Pressable>
        </View>
        {learningAudio.error ? (
          <Text style={styles.audioError}>{learningAudio.error}</Text>
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
    minHeight: 310,
    overflow: "hidden",
    padding: 17,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
    backgroundColor: colors.surface,
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
    flexGrow: 1,
    marginVertical: 23,
    color: "#FFF9F0",
    fontFamily: typography.arabic,
    fontSize: 29,
    lineHeight: 49,
    textAlign: "right",
    writingDirection: "rtl",
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
    minHeight: 84,
    marginTop: 10,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
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
