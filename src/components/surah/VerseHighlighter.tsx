import { memo, useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import type { VerseHighlightMode } from '../../core/audio';
import { colors } from '../../theme/colors';

type VerseHighlighterProps = {
  verseId: number;
  isActive: boolean;
  progress: number;
  highlightMode: VerseHighlightMode;
  children: ReactNode;
};

const TRANSITION_DURATION = 250;

function VerseHighlighter({ verseId, isActive, progress, highlightMode, children }: VerseHighlighterProps) {
  const intensity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const transition = useRef<Animated.CompositeAnimation | null>(null);
  const normalizedProgress = Math.min(100, Math.max(0, Number.isFinite(progress) ? progress : 0));

  useEffect(() => {
    transition.current?.stop();
    const animation = Animated.timing(intensity, {
      toValue: isActive ? 1 : 0,
      duration: TRANSITION_DURATION,
      easing: Easing.inOut(Easing.sin),
      isInteraction: false,
      useNativeDriver: true,
    });
    transition.current = animation;
    animation.start();
    return () => {
      animation.stop();
      if (transition.current === animation) transition.current = null;
    };
  }, [intensity, isActive]);

  const focusOpacity = highlightMode === 'focus'
    ? intensity.interpolate({ inputRange: [0, 1], outputRange: [0.42, 1] })
    : 1;
  const scale = intensity.interpolate({
    inputRange: [0, 1],
    outputRange: [1, highlightMode === 'focus' ? 1.008 : highlightMode === 'reading' ? 1.003 : 1],
  });
  const glowOpacity = Animated.multiply(
    intensity,
    highlightMode === 'reading'
      ? 0.035 + normalizedProgress * 0.00015
      : highlightMode === 'study' ? 0.045 : 0.025,
  );

  return (
    <View
      accessibilityValue={{ min: 0, max: 100, now: Math.round(normalizedProgress) }}
      nativeID={`verse-${verseId}`}
      style={styles.container}
    >
      <Animated.View style={{ opacity: focusOpacity, transform: [{ scale }] }}>{children}</Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, highlightMode === 'study' && styles.studySurface, { opacity: glowOpacity }]}
      />
      {highlightMode === 'study' ? (
        <Animated.View pointerEvents="none" style={[styles.studyBorder, { opacity: intensity }]} />
      ) : null}
    </View>
  );
}

export default memo(VerseHighlighter);

const styles = StyleSheet.create({
  container: { position: 'relative' },
  glow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 25,
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 2,
  },
  studySurface: {
    backgroundColor: colors.surfaceLight,
  },
  studyBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 25, borderWidth: 1, borderColor: colors.gold },
});
