import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { type Href, router, usePathname } from "expo-router";
import { useCallback, useEffect, useMemo } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGlobalAudioPlayer } from "../../../context/AudioPlayerProvider";
import { getTrackReciter, getTrackSurahId } from "../../../core/audio";
import { getReciterImage } from "../data/QuranFoundationReciterMapper";
import { useI18n } from "../../../i18n";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { usePlayerSwipeGestures } from "../../../components/surah/PlayerGestures";

export default function MiniPlayer() {
  const { t } = useI18n();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const {
    track,
    isPlaying,
    progress,
    togglePlay,
    next,
    startNewListening,
    miniPlayerState,
    hideMiniPlayer,
    setFullPlayerActive,
  } = useGlobalAudioPlayer();
  const isFullPlayer = /^\/listen\/\d+$/.test(pathname);
  const isDhikrPlayer =
    pathname.startsWith("/dhikr") || pathname.startsWith("/dua");
  const reciter = track ? getTrackReciter(track) : null;
  const isVisible = Boolean(track && reciter) && !isFullPlayer && !isDhikrPlayer && miniPlayerState.mode === "mini";
  const reciterImage = reciter
    ? getReciterImage(Number(reciter.id), reciter.name)
    : undefined;
  const openFullPlayer = useCallback(() => {
    if (!track || !reciter) return;
    const surahId = getTrackSurahId(track);
    if (surahId)
      router.push(
        `/listen/${surahId}?reciterId=${reciter.id}&returnTo=${encodeURIComponent(pathname)}` as Href,
      );
  }, [pathname, reciter, track]);
  const closePlayer = useCallback(() => {
    hideMiniPlayer();
    void startNewListening()
      .catch(() => undefined)
      .finally(hideMiniPlayer);
  }, [hideMiniPlayer, startNewListening]);
  const gestureOptions = useMemo(
    () => ({
      surface: "mini" as const,
      active: isVisible,
      onExpand: openFullPlayer,
      onDismiss: closePlayer,
    }),
    [closePlayer, isVisible, openFullPlayer],
  );
  const swipeGesture = usePlayerSwipeGestures(gestureOptions);

  useEffect(() => {
    setFullPlayerActive(isFullPlayer);
  }, [isFullPlayer, setFullPlayerActive]);

  if (
    !track ||
    !reciter ||
    isFullPlayer ||
    isDhikrPlayer ||
    miniPlayerState.mode === "full"
  )
    return null;

  if (miniPlayerState.mode !== "mini") return null;
  return (
    <Animated.View
      {...swipeGesture.panHandlers}
      style={[
        styles.container,
        {
          bottom: 67 + insets.bottom,
        },
        swipeGesture.animatedStyle,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[
          colors.goldDark,
          colors.gold,
          colors.goldLight,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("common.openPlayer", { title: track.title })}
        onPress={openFullPlayer}
        style={({ pressed }) => [styles.details, pressed && styles.pressed]}
      >
        <View style={styles.artwork}>
          {reciterImage ? (
            <Image
              source={reciterImage}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              style={styles.artworkImage}
            />
          ) : (
            <Ionicons name="mic" size={18} color={colors.goldMuted} />
          )}
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.title}>
            {track.title}
          </Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {reciter.name}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityLabel={t("audio.hideMiniPlayer")}
        onPress={closePlayer}
        hitSlop={8}
        style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
      >
        <Ionicons name="close" size={18} color="#FFF7EC" />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(
          isPlaying ? "common.pause" : "common.resumePlayback",
        )}
        onPress={togglePlay}
        style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
      >
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={21}
          color={colors.text}
          style={!isPlaying && styles.playIcon}
        />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("audio.next")}
        onPress={() => void next()}
        style={({ pressed }) => [styles.nextButton, pressed && styles.pressed]}
      >
        <Ionicons name="play-skip-forward" size={18} color={colors.text} />
      </Pressable>
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(100, Math.max(0, progress * 100))}%` },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.goldLight,
    borderRadius: 22,
    backgroundColor: colors.gold,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 9,
    overflow: "hidden",
  },
  details: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
  },
  artwork: {
    width: 44,
    height: 44,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.purpleDeep,
  },
  artworkImage: { width: "100%", height: "100%" },
  copy: { flex: 1, minWidth: 0, marginLeft: 10 },
  title: {
    color: colors.text,
    fontFamily: typography.serif,
    fontSize: 16,
    fontWeight: "600",
  },
  subtitle: {
    marginTop: 1,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "500",
  },
  closeButton: {
    width: 34,
    height: 34,
    marginRight: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,242,222,0.22)",
    backgroundColor: "rgba(77,40,77,0.82)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.24,
    shadowRadius: 5,
    elevation: 4,
  },
  playButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.purpleDeep,
    shadowColor: colors.gold,
    shadowOpacity: 0.34,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButton: {
    width: 36,
    height: 39,
    marginRight: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  playIcon: { marginLeft: 2 },
  progressTrack: {
    position: "absolute",
    right: 16,
    bottom: 0,
    left: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(248,244,238,0.12)",
  },
  progressFill: { height: "100%", backgroundColor: colors.text },
  pressed: { opacity: 0.68 },
});
