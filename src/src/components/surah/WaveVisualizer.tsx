import { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { colors } from '../../theme/colors';

type WaveVisualizerProps = {
  isPlaying: boolean;
  audioLevel: number;
  progress?: number;
};

const BAR_COUNT = 24;
const VARIATION_DURATION = 200;
const KEYFRAME_COUNT = 13;
const PAUSED_SCALE = 0.18;
const inputRange = Array.from({ length: KEYFRAME_COUNT }, (_, index) => index / (KEYFRAME_COUNT - 1));

const barOutputRanges = Array.from({ length: BAR_COUNT }, (_, barIndex) => {
  const values = inputRange.map((_, frameIndex) => {
    const phase = frameIndex * 0.88 + barIndex * 0.61;
    const primary = (Math.sin(phase) + 1) / 2;
    const secondary = (Math.sin(phase * 0.57 + barIndex * 0.41) + 1) / 2;
    return 0.1 + (primary * 0.7 + secondary * 0.3) * 0.72;
  });
  values[values.length - 1] = values[0];
  return values;
});

function clamp(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function WaveVisualizer({ isPlaying, audioLevel, progress = 0 }: WaveVisualizerProps) {
  const motion = useRef(new Animated.Value(0)).current;
  const activity = useRef(new Animated.Value(0)).current;
  const motionLoop = useRef<Animated.CompositeAnimation | null>(null);
  const levelTransition = useRef<Animated.CompositeAnimation | null>(null);
  const normalizedLevel = clamp(audioLevel);
  const normalizedProgress = clamp(progress);

  useEffect(() => {
    motionLoop.current?.stop();
    motionLoop.current = null;

    if (!isPlaying) {
      motion.stopAnimation();
      return;
    }

    motion.setValue(0);
    const animation = Animated.loop(Animated.timing(motion, {
      toValue: 1,
      duration: VARIATION_DURATION * (KEYFRAME_COUNT - 1),
      easing: Easing.linear,
      isInteraction: false,
      useNativeDriver: true,
    }));
    motionLoop.current = animation;
    animation.start();

    return () => {
      animation.stop();
      if (motionLoop.current === animation) motionLoop.current = null;
    };
  }, [isPlaying, motion]);

  useEffect(() => {
    levelTransition.current?.stop();
    const target = isPlaying ? 0.48 + normalizedLevel * 0.52 : 0;
    const transition = Animated.timing(activity, {
      toValue: target,
      duration: 220,
      easing: Easing.inOut(Easing.sin),
      isInteraction: false,
      useNativeDriver: true,
    });
    levelTransition.current = transition;
    transition.start();

    return () => {
      transition.stop();
      if (levelTransition.current === transition) levelTransition.current = null;
    };
  }, [activity, isPlaying, normalizedLevel]);

  return (
    <View pointerEvents="none" style={[styles.wave, { opacity: 0.84 + normalizedProgress * 0.06 }]}>
      {barOutputRanges.map((outputRange, index) => {
        const variation = motion.interpolate({ inputRange, outputRange, extrapolate: 'clamp' });
        const scaleY = Animated.add(PAUSED_SCALE, Animated.multiply(activity, variation));
        return <Animated.View key={index} style={[styles.bar, { transform: [{ scaleY }] }]} />;
      })}
    </View>
  );
}

export default memo(WaveVisualizer);

const styles = StyleSheet.create({
  wave: {
    height: 31,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bar: {
    width: 2.5,
    height: 27,
    borderRadius: 999,
    backgroundColor: colors.goldMuted,
  },
});
