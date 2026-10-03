import { LinearGradient } from 'expo-linear-gradient';
import { memo, useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { night } from './theme';

/** Deterministic pseudo-random (same sky at every render). */
function random(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const STAR_COUNT = 70;
const TWINKLE_COUNT = 7;

function TwinkleStar({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const opacity = useSharedValue(0.15);
  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [delay, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.twinkle, { left: x - size, top: y - size, width: size * 2, height: size * 2, borderRadius: size }, style]}
    />
  );
}

/**
 * Night sky behind the whole Tahajjud space: indigo gradient, a soft moon glow, static stars (one
 * SVG) and a few twinkling ones (native-thread animations). No image: weighs nothing.
 */
function NightSkyComponent({ glow = true }: { glow?: boolean }) {
  const { width, height } = useWindowDimensions();
  const stars = Array.from({ length: STAR_COUNT }, (_, index) => ({
    x: random(index + 1) * width,
    y: random(index + 101) * height * 0.85,
    r: 0.4 + random(index + 201) * 1.1,
    o: 0.25 + random(index + 301) * 0.6,
  }));
  const twinkles = Array.from({ length: TWINKLE_COUNT }, (_, index) => ({
    x: random(index + 501) * width,
    y: random(index + 601) * height * 0.6,
    size: 1.4 + random(index + 701) * 1.2,
    delay: Math.round(random(index + 801) * 2400),
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient colors={[night.sky2, night.sky1, night.sky0]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="glow" cx="78%" cy="9%" r="55%">
            <Stop offset="0" stopColor="#8E7CFF" stopOpacity={glow ? 0.28 : 0} />
            <Stop offset="0.5" stopColor="#4B3A9E" stopOpacity={glow ? 0.1 : 0} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={width / 2} cy={height / 2} r={Math.max(width, height)} fill="url(#glow)" />
        {stars.map((star, index) => (
          <Circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#FFFFFF" opacity={star.o} />
        ))}
      </Svg>
      {twinkles.map((star, index) => <TwinkleStar key={index} {...star} />)}
    </View>
  );
}

export const NightSky = memo(NightSkyComponent);

const styles = StyleSheet.create({
  twinkle: {
    position: 'absolute',
    backgroundColor: '#FFF6DE',
    shadowColor: '#FFF6DE',
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
});
