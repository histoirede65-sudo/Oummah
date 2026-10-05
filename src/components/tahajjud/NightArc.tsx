import { useEffect, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { clock, type NightPhase, type TahajjudNight } from '../../features/tahajjud/tahajjudNight';
import { night as palette, nightType } from './theme';
import { tx } from '../../features/tahajjud/tahajjudI18n';

type Props = {
  width: number;
  night: TahajjudNight;
  phase: NightPhase;
  now: number;
  validated: boolean;
  children?: ReactNode;
};

const PAD = 26;

/**
 * The night as an arc, from Maghrib (left horizon) to Fajr (right horizon). The last third glows in
 * gold; the moon travels along the arc with the time of night.
 */
export function NightArc({ width, night, phase, now, validated, children }: Props) {
  const radius = width / 2 - PAD;
  const cx = width / 2;
  const cy = radius + 30;
  const height = cy + 46;

  const point = (t: number) => {
    const angle = Math.PI - t * Math.PI;
    return { x: cx + radius * Math.cos(angle), y: cy - radius * Math.sin(angle) };
  };
  const arc = (from: number, to: number) => {
    const a = point(from);
    const b = point(to);
    return `M ${a.x} ${a.y} A ${radius} ${radius} 0 0 1 ${b.x} ${b.y}`;
  };

  const progress = phase === 'day' ? 0 : Math.min(1, Math.max(0, (now - night.maghrib) / night.duration));
  const third = point(2 / 3);
  const moon = point(progress);
  const inLastThird = phase === 'lastThird';

  // Moon halo: slow breathing.
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [pulse]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.4,
    transform: [{ scale: 1 + pulse.value * 0.35 }],
  }));

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="lastThird" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={palette.goldSoft} />
            <Stop offset="1" stopColor={palette.gold} />
          </LinearGradient>
          <LinearGradient id="horizon" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={palette.lavender} stopOpacity={0} />
            <Stop offset="0.5" stopColor={palette.lavender} stopOpacity={0.35} />
            <Stop offset="1" stopColor={palette.gold} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Horizon */}
        <Path d={`M ${PAD - 12} ${cy} L ${width - PAD + 12} ${cy}`} stroke="url(#horizon)" strokeWidth={1} />

        {/* Whole night, faint */}
        <Path d={arc(0, 1)} stroke={palette.line} strokeWidth={2} fill="none" strokeDasharray="2 6" strokeLinecap="round" />
        {/* Elapsed part of the night */}
        {progress > 0 ? (
          <Path d={arc(0, Math.min(progress, 2 / 3))} stroke={palette.lavender} strokeOpacity={0.55} strokeWidth={2} fill="none" strokeLinecap="round" />
        ) : null}
        {/* Last third: glow + gold line */}
        <Path d={arc(2 / 3, 1)} stroke={palette.gold} strokeOpacity={inLastThird ? 0.28 : 0.14} strokeWidth={14} fill="none" strokeLinecap="round" />
        <Path d={arc(2 / 3, 1)} stroke="url(#lastThird)" strokeWidth={3.5} fill="none" strokeLinecap="round" />

        {/* Thirds */}
        {[1 / 3, 2 / 3].map((t) => {
          const p = point(t);
          return <Circle key={t} cx={p.x} cy={p.y} r={t === 2 / 3 ? 4.5 : 2.5} fill={t === 2 / 3 ? palette.goldSoft : palette.lavender} opacity={t === 2 / 3 ? 1 : 0.5} />;
        })}
        {/* Horizon ends */}
        <Circle cx={point(0).x} cy={point(0).y} r={3} fill={palette.lavender} opacity={0.7} />
        <Circle cx={point(1).x} cy={point(1).y} r={3} fill={palette.gold} />
      </Svg>

      {/* Moon */}
      {phase !== 'day' ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[styles.halo, { left: moon.x - 20, top: moon.y - 20, backgroundColor: inLastThird ? 'rgba(244,217,149,0.45)' : 'rgba(183,171,242,0.4)' }, haloStyle]}
          />
          <View pointerEvents="none" style={[styles.moon, { left: moon.x - 9, top: moon.y - 9 }, validated && styles.moonDone]} />
        </>
      ) : null}

      {/* Labels */}
      <Text style={[styles.thirdLabel, { left: third.x - 60, top: third.y - 34 }]}>{clock(night.lastThirdStart)}</Text>
      <View style={[styles.end, { left: 4 }]}>
        <Text style={styles.endName}>{tx("Maghrib")}</Text>
        <Text style={styles.endTime}>{clock(night.maghrib)}</Text>
      </View>
      <View style={[styles.end, styles.endRight, { right: 4 }]}>
        <Text style={[styles.endName, styles.endNameGold]}>{tx("Fajr")}</Text>
        <Text style={styles.endTime}>{clock(night.fajr)}</Text>
      </View>

      <View style={[styles.center, { top: cy - radius * 0.62, height: radius * 0.62 }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  halo: { position: 'absolute', width: 40, height: 40, borderRadius: 20 },
  moon: {
    position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: palette.moon,
    shadowColor: palette.goldSoft, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6,
  },
  moonDone: { backgroundColor: palette.goldSoft },
  thirdLabel: { position: 'absolute', width: 120, textAlign: 'center', color: palette.goldSoft, fontSize: 16, letterSpacing: 0.5, ...nightType.bold },
  end: { position: 'absolute', bottom: 0, alignItems: 'flex-start' },
  endRight: { alignItems: 'flex-end' },
  endName: { color: palette.muted, fontSize: 12, letterSpacing: 1.6, textTransform: 'uppercase', ...nightType.bold },
  endNameGold: { color: palette.gold },
  endTime: { marginTop: 2, color: palette.textSoft, fontSize: 17, ...nightType.semibold },
  center: { position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'flex-end' },
});
