import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Image,
  Alert,
  LayoutChangeEvent,
  PanResponder,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PROPHETS_PREVIEW } from "../../../features/prophets/prophetsData";
import { PROPHET_AUDIO_EPISODES } from "../../../features/prophets/audio/prophetAudioData";
import { useProphetAudio } from "../../../features/prophets/audio/ProphetAudioProvider";
import { localizeAudioEpisode } from "../../../features/prophets/prophetsLocalization";
import { useI18n } from "../../../i18n";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

function formatTime(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const total = Math.floor(value);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function ProphetAudioScreen() {
  const { language, t } = useI18n();
  const params = useLocalSearchParams<{ id: string }>();
  const audioEpisode = useMemo(
    () => (PROPHET_AUDIO_EPISODES[params.id] ? localizeAudioEpisode(PROPHET_AUDIO_EPISODES[params.id], language) : undefined),
    [params.id, language],
  );
  const preview = PROPHETS_PREVIEW.find((item) => item.id === params.id);
  const {
    episode,
    isPlaying,
    isLoading,
    downloadProgress,
    currentTime,
    duration,
    progress,
    startEpisode,
    togglePlay,
    seekBy,
    seekTo,
    stop,
    close,
  } = useProphetAudio();
  const [trackWidth, setTrackWidth] = useState(1);
  const [scrubRatio, setScrubRatio] = useState<number | null>(null);
  const scrubRatioRef = useRef<number | null>(null);
  const trackRef = useRef<View>(null);
  const trackLeftRef = useRef(0);

  const isCurrentEpisode = Boolean(audioEpisode && episode?.id === audioEpisode.id);
  const displayCurrentTime = isCurrentEpisode ? currentTime : 0;
  const displayDuration = isCurrentEpisode ? duration : 0;
  const displayProgress = isCurrentEpisode ? progress : 0;
  const displayIsPlaying = isCurrentEpisode && isPlaying;
  const displayIsLoading = isCurrentEpisode && isLoading;
  const effectiveProgress = scrubRatio ?? displayProgress;
  const effectiveCurrentTime = scrubRatio !== null && displayDuration > 0 ? displayDuration * scrubRatio : displayCurrentTime;

  const durationLabel = useMemo(
    () => (displayDuration > 0 ? formatTime(displayDuration) : `≈ ${audioEpisode?.estimatedMinutes ?? 0} min`),
    [audioEpisode?.estimatedMinutes, displayDuration],
  );

  const handleMainPlay = () => {
    if (!audioEpisode) return;
    if (isCurrentEpisode) {
      void togglePlay();
      return;
    }
    void startEpisode(audioEpisode).catch(() => {
      Alert.alert(t("prophets.downloadFailedTitle"), t("prophets.downloadFailedText"));
    });
  };


  const refreshTrackMetrics = () => {
    trackRef.current?.measureInWindow((x, _y, width) => {
      trackLeftRef.current = x;
      if (width > 0) setTrackWidth(width);
    });
  };

  const onTrackLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(Math.max(1, event.nativeEvent.layout.width));
    requestAnimationFrame(refreshTrackMetrics);
  };

  const updateScrubFromPageX = (pageX: number) => {
    if (displayDuration <= 0) return;
    const ratio = Math.max(
      0,
      Math.min(1, (pageX - trackLeftRef.current) / Math.max(1, trackWidth)),
    );
    scrubRatioRef.current = ratio;
    setScrubRatio(ratio);
  };

  const commitScrub = () => {
    const ratio = scrubRatioRef.current;
    scrubRatioRef.current = null;
    setScrubRatio(null);
    if (ratio === null || displayDuration <= 0) return;
    void seekTo(displayDuration * ratio);
  };

  const progressPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => displayDuration > 0,
        onMoveShouldSetPanResponder: () => displayDuration > 0,
        onStartShouldSetPanResponderCapture: () => displayDuration > 0,
        onMoveShouldSetPanResponderCapture: () => displayDuration > 0,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (event) => {
          refreshTrackMetrics();
          updateScrubFromPageX(event.nativeEvent.pageX);
        },
        onPanResponderMove: (_event, gestureState) => {
          updateScrubFromPageX(gestureState.moveX);
        },
        onPanResponderRelease: commitScrub,
        onPanResponderTerminate: commitScrub,
      }),
    [displayDuration, trackWidth],
  );

  if (!audioEpisode) {
    return (
      <SafeAreaView style={styles.missing}>
        <Text style={styles.missingText}>{t("prophets.audioUnavailable")}</Text>
        <Pressable onPress={() => router.back()} style={styles.missingButton}>
          <Text style={styles.missingButtonText}>{t("common.back")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <>
      <Stack.Screen options={{ gestureEnabled: false }} />
      <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="chevron-back" size={23} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerKicker}>{t("prophets.headerEyebrow")}</Text>
            <Text style={styles.headerTitle}>{t("prophets.audioMode")}</Text>
          </View>
          <Pressable
            accessibilityLabel={t("prophets.audioCloseA11y")}
            onPress={() => void close().then(() => router.back())}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            {preview?.coverImage ? <Image source={preview.coverImage} resizeMode="cover" style={styles.coverImage} /> : null}
            <LinearGradient
              colors={["rgba(9,5,15,0.05)", "rgba(15,7,18,0.34)", "rgba(8,5,13,0.96)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.heroRim} />
            <View style={styles.audioBadge}>
              <Ionicons name="headset" size={19} color="#FFF7EC" />
              <Text style={styles.audioBadgeText}>{t("prophets.audioBadge")}</Text>
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.prophetName}>{audioEpisode.prophetName}</Text>
              <Text style={styles.heroTitle}>{audioEpisode.title}</Text>
              <Text style={styles.heroSubtitle}>{audioEpisode.subtitle}</Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.metaPill}><Ionicons name="time-outline" size={14} color="#F3C46E" /><Text style={styles.metaText}>{durationLabel}</Text></View>
                <View style={styles.metaPill}><Ionicons name="shield-checkmark-outline" size={14} color="#F3C46E" /><Text style={styles.metaText}>{t("prophets.audioSourced")}</Text></View>
              </View>
            </View>
          </View>

          <LinearGradient colors={["#1E1730", "#151022"]} style={styles.playerCard}>
            <View style={styles.nowPlayingRow}>
              <View style={styles.waveBadge}><Ionicons name="pulse" size={20} color="#F3C46E" /></View>
              <View style={styles.nowPlayingCopy}>
                <Text style={styles.nowPlayingKicker}>
                  {displayIsLoading
                    ? t("prophets.audioDownloading", { percent: Math.round((downloadProgress ?? 0) * 100) })
                    : t(displayIsPlaying ? "prophets.audioPlaying" : "prophets.audioReady")}
                </Text>
                <Text style={styles.nowPlayingTitle}>{t("prophets.audioPeace", { name: audioEpisode.prophetName })}</Text>
              </View>
            </View>

            <View
              ref={trackRef}
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={t("prophets.audioPosition")}
              onLayout={onTrackLayout}
              {...progressPanResponder.panHandlers}
              style={styles.progressTrack}
            >
              <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, effectiveProgress * 100))}%` }]} />
              <View style={[styles.progressThumb, scrubRatio !== null && styles.progressThumbDragging, { left: `${Math.max(0, Math.min(100, effectiveProgress * 100))}%` }]} />
            </View>
            <View style={styles.timeRow}>
              <Text style={styles.timeText}>{formatTime(effectiveCurrentTime)}</Text>
              <Text style={styles.timeText}>{displayDuration > 0 ? formatTime(displayDuration) : `≈ ${audioEpisode.estimatedMinutes}:00`}</Text>
            </View>

            <View style={styles.controlsRow}>
              <Pressable onPress={() => void seekBy(-15)} style={({ pressed }) => [styles.seekButton, pressed && styles.pressed]}>
                <Ionicons name="play-back" size={22} color={colors.text} />
                <Text style={styles.seekLabel}>15</Text>
              </Pressable>

              <Pressable
                disabled={displayIsLoading}
                onPress={handleMainPlay}
                style={({ pressed }) => [styles.mainPlayButton, displayIsLoading && styles.mainPlayButtonDisabled, pressed && styles.pressed]}
              >
                <Ionicons name={displayIsLoading ? "ellipsis-horizontal" : displayIsPlaying ? "pause" : "play"} size={31} color="#190C12" />
              </Pressable>

              <Pressable onPress={() => void seekBy(15)} style={({ pressed }) => [styles.seekButton, pressed && styles.pressed]}>
                <Ionicons name="play-forward" size={22} color={colors.text} />
                <Text style={styles.seekLabel}>15</Text>
              </Pressable>
            </View>

            <Pressable onPress={() => void stop()} style={({ pressed }) => [styles.stopButton, pressed && styles.pressed]}>
              <Ionicons name="stop" size={15} color={colors.textSecondary} />
              <Text style={styles.stopText}>{t("prophets.audioStop")}</Text>
            </Pressable>
          </LinearGradient>

          <View style={styles.backgroundCard}>
            <View style={styles.backgroundIcon}><Ionicons name="phone-portrait-outline" size={19} color="#F3C46E" /></View>
            <View style={styles.backgroundCopy}>
              <Text style={styles.backgroundTitle}>{t("prophets.audioBackgroundTitle")}</Text>
              <Text style={styles.backgroundText}>{t("prophets.audioBackgroundText")}</Text>
            </View>
          </View>

          <View style={styles.sourceCard}>
            <Text style={styles.sourceKicker}>{t("prophets.audioSourcesKicker")}</Text>
            <Text style={styles.sourceTitle}>{t("prophets.audioSourcesTitle")}</Text>
            <Text style={styles.sourceText}>{t("prophets.audioSourcesText")}</Text>
            <View style={styles.sourceWrap}>
              {audioEpisode.sourceLabels.map((label) => (
                <View key={label} style={styles.sourcePill}><Text style={styles.sourcePillText}>{label}</Text></View>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  missing: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: colors.background },
  missingText: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22, textAlign: "center" },
  missingButton: { marginTop: 18, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 22, backgroundColor: colors.goldLight },
  missingButtonText: { color: colors.background, fontFamily: typography.sans, fontWeight: "900" },
  header: { minHeight: 72, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.045)" },
  headerCopy: { flex: 1, alignItems: "center" },
  headerKicker: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9, fontWeight: "900", letterSpacing: 1.2 },
  headerTitle: { marginTop: 2, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 },
  content: { padding: 16, paddingBottom: 120 },
  hero: { height: 405, overflow: "hidden", borderRadius: 32, borderWidth: 1, borderColor: "rgba(227,181,90,0.42)", backgroundColor: "#151022" },
  coverImage: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  heroRim: { position: "absolute", top: 8, right: 8, bottom: 8, left: 8, borderRadius: 25, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  audioBadge: { position: "absolute", top: 20, left: 20, minHeight: 34, paddingHorizontal: 11, borderRadius: 17, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(8,7,19,0.62)", borderWidth: 1, borderColor: "rgba(227,181,90,0.45)" },
  audioBadgeText: { color: "#FFF7EC", fontFamily: typography.sans, fontSize: 8.5, fontWeight: "900", letterSpacing: 0.8 },
  heroCopy: { flex: 1, justifyContent: "flex-end", padding: 22 },
  prophetName: { color: "#F3C46E", fontFamily: typography.serifSemibold, fontSize: 19 },
  heroTitle: { marginTop: 4, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 34, lineHeight: 39 },
  heroSubtitle: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 16.5, lineHeight: 24 },
  heroMetaRow: { marginTop: 15, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metaPill: { minHeight: 30, paddingHorizontal: 10, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(8,5,13,0.58)", borderWidth: 1, borderColor: "rgba(243,196,110,0.20)" },
  metaText: { color: "#F8E7C6", fontFamily: typography.sans, fontSize: 10.5, fontWeight: "800" },
  playerCard: { marginTop: 15, padding: 19, borderRadius: 28, borderWidth: 1, borderColor: "#2B2238" },
  nowPlayingRow: { flexDirection: "row", alignItems: "center", gap: 11 },
  waveBadge: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(243,196,110,0.10)", borderWidth: 1, borderColor: "rgba(243,196,110,0.18)" },
  nowPlayingCopy: { flex: 1 },
  nowPlayingKicker: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 8.5, fontWeight: "900", letterSpacing: 1 },
  nowPlayingTitle: { marginTop: 3, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 19 },
  progressTrack: { marginTop: 16, height: 30, justifyContent: "center" },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: colors.goldLight },
  progressThumb: { position: "absolute", width: 14, height: 14, marginLeft: -7, borderRadius: 7, backgroundColor: "#F6D18A", borderWidth: 2, borderColor: "#8B6A2E" },
  progressThumbDragging: { width: 18, height: 18, marginLeft: -9, borderRadius: 9 },
  timeRow: { marginTop: -1, flexDirection: "row", justifyContent: "space-between" },
  timeText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, fontVariant: ["tabular-nums"] },
  controlsRow: { marginTop: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 25 },
  seekButton: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.045)" },
  seekLabel: { position: "absolute", bottom: 5, color: colors.textMuted, fontFamily: typography.sans, fontSize: 7.5, fontWeight: "900" },
  mainPlayButton: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", backgroundColor: "#F3C46E", borderWidth: 4, borderColor: "rgba(255,255,255,0.12)", shadowColor: "#F3C46E", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 10, elevation: 7 },
  mainPlayButtonDisabled: { opacity: 0.62 },
  stopButton: { alignSelf: "center", marginTop: 16, minHeight: 34, paddingHorizontal: 12, borderRadius: 17, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "rgba(255,255,255,0.045)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  stopText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "800" },
  backgroundCard: { marginTop: 14, padding: 16, borderRadius: 24, flexDirection: "row", gap: 12, backgroundColor: "rgba(243,196,110,0.055)", borderWidth: 1, borderColor: "rgba(243,196,110,0.18)" },
  backgroundIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(243,196,110,0.08)" },
  backgroundCopy: { flex: 1 },
  backgroundTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 17 },
  backgroundText: { marginTop: 5, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 19 },
  sourceCard: { marginTop: 14, padding: 17, borderRadius: 24, backgroundColor: "#151022", borderWidth: 1, borderColor: "#2B2238" },
  sourceKicker: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  sourceTitle: { marginTop: 6, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21, lineHeight: 26 },
  sourceText: { marginTop: 6, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 19 },
  sourceWrap: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 7 },
  sourcePill: { minHeight: 27, paddingHorizontal: 9, borderRadius: 14, justifyContent: "center", backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" },
  sourcePillText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5, fontWeight: "700" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
