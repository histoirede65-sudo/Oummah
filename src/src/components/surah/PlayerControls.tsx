import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, G, Polygon } from 'react-native-svg';

import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { ARTWORK_BREATHING_HALF_CYCLE } from './ArtworkAnimator';
import { useLongPressGesture } from './PlayerGestures';

type PlayerControlsProps = {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onPlayLongPress?: () => void;
  onSeekBackward: () => void;
  onSeekForward: () => void;
  onPrevious: () => void;
  onNext: () => void;
  compact?: boolean;
  primaryOnly?: boolean;
  secondaryOpacity?: Animated.Value;
};

function PlayMandala() {
  return (
    <View pointerEvents="none" style={styles.mandala}>
      <Svg width={118} height={118} viewBox="0 0 118 118">
        <G fill="none" stroke={colors.goldMuted} strokeWidth={0.7} opacity={0.3}>
          <Polygon points="59,2 70,17 88,10 91,29 110,28 101,46 116,59 101,72 110,90 91,89 88,108 70,101 59,116 48,101 30,108 27,89 8,90 17,72 2,59 17,46 8,28 27,29 30,10 48,17" />
          <G rotation={15} origin="59,59"><Polygon points="59,7 71,22 90,18 94,37 111,47 98,59 111,71 94,81 90,100 71,96 59,111 47,96 28,100 24,81 7,71 20,59 7,47 24,37 28,18 47,22" /></G>
          <Circle cx={59} cy={59} r={50} strokeDasharray="2 4" opacity={0.65} />
          <Circle cx={59} cy={59} r={43} opacity={0.8} />
        </G>
      </Svg>
    </View>
  );
}

export default function PlayerControls({ isPlaying, onTogglePlay, onPlayLongPress, onSeekBackward, onSeekForward, onPrevious, onNext, compact, primaryOnly, secondaryOpacity }: PlayerControlsProps) {
  const { t } = useI18n();
  const pressScale = useRef(new Animated.Value(1)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const haloScale = useRef(new Animated.Value(1)).current;
  const haloAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const pressAnimation = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    haloAnimation.current?.stop();
    if (!isPlaying) {
      const fadeOut = Animated.parallel([
        Animated.timing(haloOpacity, { toValue: 0, duration: 250, useNativeDriver: true, isInteraction: false }),
        Animated.timing(haloScale, { toValue: 0.98, duration: 250, useNativeDriver: true, isInteraction: false }),
      ]);
      haloAnimation.current = fadeOut;
      fadeOut.start();
      return () => fadeOut.stop();
    }

    haloOpacity.setValue(0.08);
    haloScale.setValue(0.98);
    const pulse = Animated.sequence([
      Animated.parallel([
        Animated.timing(haloOpacity, { toValue: 0.42, duration: ARTWORK_BREATHING_HALF_CYCLE, useNativeDriver: true, isInteraction: false }),
        Animated.timing(haloScale, { toValue: 1.14, duration: ARTWORK_BREATHING_HALF_CYCLE, useNativeDriver: true, isInteraction: false }),
      ]),
      Animated.parallel([
        Animated.timing(haloOpacity, { toValue: 0.14, duration: ARTWORK_BREATHING_HALF_CYCLE, useNativeDriver: true, isInteraction: false }),
        Animated.timing(haloScale, { toValue: 1, duration: ARTWORK_BREATHING_HALF_CYCLE, useNativeDriver: true, isInteraction: false }),
      ]),
    ]);
    const loop = Animated.loop(pulse, { resetBeforeIteration: false });
    haloAnimation.current = loop;
    loop.start();
    return () => loop.stop();
  }, [haloOpacity, haloScale, isPlaying]);

  useEffect(() => () => {
    haloAnimation.current?.stop();
    pressAnimation.current?.stop();
  }, []);

  const animatePress = (toValue: number) => {
    pressAnimation.current?.stop();
    const animation = Animated.timing(pressScale, {
      toValue,
      duration: 75,
      useNativeDriver: true,
      isInteraction: false,
    });
    pressAnimation.current = animation;
    animation.start();
  };
  const playGesture = useLongPressGesture(onTogglePlay, onPlayLongPress);

  return (
    <View style={[styles.controls, compact && styles.controlsCompact]}>
      <Animated.View pointerEvents={primaryOnly ? 'none' : 'auto'} style={[styles.sideControls, { opacity: secondaryOpacity ?? 1 }]}>
        <Pressable onPress={onSeekBackward} style={({ pressed }) => [styles.skipCircle, pressed && styles.pressed]}><Ionicons name="shuffle" size={27} color={colors.textMuted} /></Pressable>
        <Pressable accessibilityLabel={t('audio.previous')} onPress={onPrevious} style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}><Ionicons name="play-skip-back" size={24} color={colors.goldMuted} /></Pressable>
      </Animated.View>
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <Animated.View pointerEvents="none" style={[styles.animatedHalo, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]} />
        <Pressable
          accessibilityLabel={t(isPlaying ? 'common.pause' : 'common.resumePlayback')}
          onPress={playGesture.onPress}
          onLongPress={playGesture.onLongPress}
          delayLongPress={450}
          onPressIn={() => { playGesture.onPressIn(); animatePress(0.94); }}
          onPressOut={() => animatePress(1)}
          style={[styles.play, compact && styles.playCompact]}
        >
          <PlayMandala />
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={36} color={colors.goldMuted} style={!isPlaying && styles.playIcon} />
        </Pressable>
      </Animated.View>
      <Animated.View pointerEvents={primaryOnly ? 'none' : 'auto'} style={[styles.sideControls, { opacity: secondaryOpacity ?? 1 }]}>
        <Pressable accessibilityLabel={t('audio.next')} onPress={onNext} style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}><Ionicons name="play-skip-forward" size={24} color={colors.goldMuted} /></Pressable>
        <Pressable onPress={onSeekForward} style={({ pressed }) => [styles.skipCircle, pressed && styles.pressed]}><Ionicons name="repeat" size={28} color={colors.textMuted} /></Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { marginTop: 22, marginBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  controlsCompact: { marginVertical: 6 },
  sideControls: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  play: { width: 96, height: 96, alignItems: 'center', justifyContent: 'center', borderRadius: 48, borderWidth: 2.4, borderColor: colors.goldLight, backgroundColor: colors.purpleDeep, shadowColor: colors.goldMuted, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 24, elevation: 15 },
  playCompact: { width: 58, height: 58, borderRadius: 29 },
  animatedHalo: { position: 'absolute', top: -13, right: -13, bottom: -13, left: -13, borderRadius: 58, backgroundColor: 'rgba(196,154,66,0.16)', shadowColor: colors.goldMuted, shadowOpacity: 0.8, shadowRadius: 20, elevation: 9 },
  mandala: { position: 'absolute', width: 118, height: 118, alignItems: 'center', justifyContent: 'center' },
  navButton: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 31, borderWidth: 1, borderColor: 'rgba(200,148,58,0.58)', backgroundColor: 'rgba(21,12,36,0.82)' },
  skipCircle: { width: 50, height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 25, backgroundColor: 'transparent' },
  playIcon: { marginLeft: 4 },
  pressed: { opacity: 0.58 },
});
