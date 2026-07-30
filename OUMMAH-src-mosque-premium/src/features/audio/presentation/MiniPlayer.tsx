import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, router, usePathname } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useGlobalAudioPlayer } from '../../../context/AudioPlayerProvider';
import { getTrackReciter, getTrackSurahId } from '../../../core/audio';
import { getReciterImage } from '../data/QuranFoundationReciterMapper';
import { useI18n } from '../../../i18n';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { usePlayerSwipeGestures } from '../../../components/surah/PlayerGestures';

export default function MiniPlayer() {
  const { t } = useI18n();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const entrance = useRef(new Animated.Value(0)).current;
  const {
    track,
    isPlaying,
    progress,
    togglePlay,
    stop,
    miniPlayerState,
    hideMiniPlayer,
    showMiniPlayer,
    setFullPlayerActive,
  } = useGlobalAudioPlayer();
  const isFullPlayer = /^\/listen\/\d+$/.test(pathname);
  const reciter = track ? getTrackReciter(track) : null;
  const reciterImage = reciter ? getReciterImage(Number(reciter.id), reciter.name) : undefined;
  const openFullPlayer = useCallback(() => {
    if (!track || !reciter) return;
    const surahId = getTrackSurahId(track);
    if (surahId) router.push(`/listen/${surahId}?reciterId=${reciter.id}&returnTo=${encodeURIComponent(pathname)}` as Href);
  }, [pathname, reciter, track]);
  const closePlayer = useCallback(() => {
    hideMiniPlayer();
    void stop().catch(() => undefined);
  }, [hideMiniPlayer, stop]);
  const gestureOptions = useMemo(() => ({
    surface: 'mini' as const,
    active: miniPlayerState.mode === 'mini',
    onExpand: openFullPlayer,
    onDismiss: hideMiniPlayer,
  }), [hideMiniPlayer, miniPlayerState.mode, openFullPlayer]);
  const swipeGesture = usePlayerSwipeGestures(gestureOptions);

  useEffect(() => {
    setFullPlayerActive(isFullPlayer);
  }, [isFullPlayer, setFullPlayerActive]);

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: track && miniPlayerState.mode === 'mini' && !isFullPlayer ? 1 : 0,
      duration: track && miniPlayerState.mode === 'mini' ? 220 : 180,
      useNativeDriver: true,
      isInteraction: false,
    }).start();
  }, [entrance, isFullPlayer, miniPlayerState.mode, track]);

  if (!track || !reciter || isFullPlayer || miniPlayerState.mode === 'full') return null;

  if (miniPlayerState.canRestore) {
    return (
      <Pressable
        accessibilityLabel={t('audio.showMiniPlayer')}
        onPress={showMiniPlayer}
        style={({ pressed }) => [styles.restoreButton, { top: insets.top + 9 }, pressed && styles.pressed]}
      >
        <Ionicons name={isPlaying ? 'volume-high-outline' : 'headset-outline'} size={17} color={colors.goldMuted} />
      </Pressable>
    );
  }

  if (miniPlayerState.mode !== 'mini') return null;
  return (
    <Animated.View
      {...swipeGesture.panHandlers}
      style={[
        styles.container,
        {
          bottom: 67 + insets.bottom,
          opacity: entrance,
          transform: [
            {
              translateY: entrance.interpolate({
                inputRange: [0, 1],
                outputRange: [18, 0],
              }),
            },
          ],
        },
        swipeGesture.animatedStyle,
      ]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[colors.surfaceAlt, colors.purpleDeep, colors.backgroundSecondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.openPlayer', { title: track.title })}
        onPress={openFullPlayer}
        style={({ pressed }) => [styles.details, pressed && styles.pressed]}
      >
        <View style={styles.artwork}>
          {reciterImage
            ? <Image source={reciterImage} contentFit="cover" cachePolicy="memory-disk" priority="high" style={styles.artworkImage} />
            : <Ionicons name="mic" size={18} color={colors.goldMuted} />}
        </View>
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.title}>{track.title}</Text>
          <Text numberOfLines={1} style={styles.subtitle}>{reciter.name}</Text>
        </View>
      </Pressable>
      <Pressable accessibilityLabel={t('audio.hideMiniPlayer')} onPress={closePlayer} hitSlop={8} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
        <Ionicons name="close" size={15} color={colors.textMuted} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(isPlaying ? 'common.pause' : 'common.resumePlayback')}
        onPress={togglePlay}
        style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
      >
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={21} color={colors.background} style={!isPlaying && styles.playIcon} />
      </Pressable>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, progress * 100))}%` }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 9,
    overflow: 'hidden',
  },
  details: { flex: 1, minWidth: 0, height: '100%', flexDirection: 'row', alignItems: 'center', paddingLeft: 10 },
  artwork: { width: 40, height: 40, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.goldDark, backgroundColor: colors.purpleDeep },
  artworkImage: { width: '100%', height: '100%' },
  copy: { flex: 1, minWidth: 0, marginLeft: 10 },
  title: { color: colors.text, fontFamily: typography.serif, fontSize: 15, fontWeight: '600' },
  subtitle: { marginTop: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5, fontWeight: '500' },
  closeButton: { width: 27, height: 37, alignItems: 'center', justifyContent: 'center' },
  playButton: { width: 39, height: 39, marginRight: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: colors.goldLight, shadowColor: colors.gold, shadowOpacity: 0.34, shadowRadius: 8, elevation: 5 },
  playIcon: { marginLeft: 2 },
  progressTrack: { position: 'absolute', right: 16, bottom: 0, left: 16, height: 3, borderRadius: 2, backgroundColor: 'rgba(248,244,238,0.12)' },
  progressFill: { height: '100%', backgroundColor: colors.goldLight },
  restoreButton: { position: 'absolute', right: 62, zIndex: 30, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.purpleDeep, elevation: 10 },
  pressed: { opacity: 0.68 },
});
