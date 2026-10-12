import { memo } from 'react';
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

/** Earth at night seen from space: dark globe, gold city lights, a crescent above. Drawn, weighs nothing. */
const LIGHTS: [number, number, number][] = [
  [62, 58, 2.2], [70, 64, 1.6], [78, 55, 2.6], [86, 62, 1.8], [94, 70, 2.2], [102, 60, 1.5], [74, 76, 1.4],
  [110, 74, 2], [118, 66, 1.4], [58, 72, 1.3], [90, 84, 1.8], [100, 92, 1.4], [82, 96, 1.2], [122, 88, 1.6],
  [66, 90, 1.1], [112, 104, 1.3], [96, 48, 1.3], [128, 76, 1.1], [52, 84, 1], [106, 82, 1.2],
];

function OummahNightArtComponent({ size = 140 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 180 180">
      <Defs>
        <RadialGradient id="halo" cx="50%" cy="56%" r="50%">
          <Stop offset="0.6" stopColor="#E3B55A" stopOpacity={0.22} />
          <Stop offset="1" stopColor="#E3B55A" stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id="globe" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#3A1F52" />
          <Stop offset="1" stopColor="#0E0915" />
        </LinearGradient>
      </Defs>
      <Circle cx={90} cy={100} r={78} fill="url(#halo)" />
      <Circle cx={90} cy={100} r={58} fill="url(#globe)" stroke="rgba(227,181,90,0.55)" strokeWidth={1.2} />
      <G stroke="rgba(227,181,90,0.16)" strokeWidth={0.8} fill="none">
        <Path d="M32 100 H148" />
        <Path d="M40 72 Q90 84 140 72" />
        <Path d="M40 128 Q90 116 140 128" />
        <Path d="M90 42 Q60 100 90 158" />
        <Path d="M90 42 Q120 100 90 158" />
      </G>
      {LIGHTS.map(([x, y, r], index) => (
        <G key={index}>
          <Circle cx={x} cy={y + 14} r={r * 2.4} fill="#F4D995" opacity={0.18} />
          <Circle cx={x} cy={y + 14} r={r} fill="#F4D995" />
        </G>
      ))}
      <Path d="M142 18 A16 16 0 1 0 158 42 A12 12 0 1 1 142 18 Z" fill="#F7EDD2" />
    </Svg>
  );
}

export const OummahNightArt = memo(OummahNightArtComponent);
