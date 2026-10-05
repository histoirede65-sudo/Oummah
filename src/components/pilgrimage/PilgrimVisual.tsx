import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, Ellipse, G, Line, Path, Polygon, RadialGradient, Rect, Stop, Text as SvgText } from "react-native-svg";

import { hajjTypeLabel } from "../../features/pilgrimage/pilgrimageI18n";
import type { HajjType, Visual } from "../../features/pilgrimage/pilgrimageTypes";
import { useI18n } from "../../i18n";
import { pil, pilType } from "./theme";

const W = 320;
const H = 150;

/** Kaaba seen from above or from the front, with its gold band. */
function Kaaba({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <G>
      <Rect x={x - size / 2} y={y - size / 2} width={size} height={size} rx={2} fill="#0E0B10" stroke="#3A2E1E" strokeWidth={1} />
      <Rect x={x - size / 2} y={y - size / 2 + size * 0.24} width={size} height={size * 0.1} fill={pil.gold} opacity={0.9} />
    </G>
  );
}

function Tawaf() {
  const { t } = useI18n();
  const cx = W / 2;
  const cy = H / 2 + 2;
  const dots = Array.from({ length: 7 }, (_, index) => {
    const angle = -Math.PI / 2 - (index / 7) * Math.PI * 2;
    return { x: cx + Math.cos(angle) * 108, y: cy + Math.sin(angle) * 52 };
  });
  return (
    <>
      <Ellipse cx={cx} cy={cy} rx={108} ry={52} fill="none" stroke={pil.goldLine} strokeWidth={14} />
      <Ellipse cx={cx} cy={cy} rx={108} ry={52} fill="none" stroke={pil.gold} strokeWidth={1.5} strokeDasharray="4 6" />
      {dots.map((dot, index) => <Circle key={index} cx={dot.x} cy={dot.y} r={4} fill={index === 0 ? pil.gold : "#FFFFFF"} opacity={index === 0 ? 1 : 0.7} />)}
      {/* Counter-clockwise: the Kaaba stays on the left. */}
      <Path d={`M ${cx + 70} ${cy + 46} q 18 -6 30 -22`} stroke="#FFFFFF" strokeWidth={2} fill="none" />
      <Polygon points={`${cx + 102},${cy + 20} ${cx + 94},${cy + 22} ${cx + 101},${cy + 29}`} fill="#FFFFFF" />
      <Kaaba x={cx} y={cy} size={38} />
      <Circle cx={cx - 19} cy={cy + 19} r={3.4} fill={pil.gold} />
      <SvgText x={cx - 26} y={cy + 36} fill={pil.gold} fontSize={9} fontWeight="700" textAnchor="end">{t("pilgrimage.visual.blackStone")}</SvgText>
    </>
  );
}

function Sai() {
  const { t } = useI18n();
  return (
    <>
      <Line x1={60} y1={H / 2} x2={260} y2={H / 2} stroke={pil.goldLine} strokeWidth={16} strokeLinecap="round" />
      <Rect x={130} y={H / 2 - 9} width={60} height={18} fill="rgba(123,212,168,0.55)" />
      {[0, 1, 2].map((index) => (
        <Polygon key={index} points={`${92 + index * 60},${H / 2 - 5} ${100 + index * 60},${H / 2} ${92 + index * 60},${H / 2 + 5}`} fill="#FFFFFF" />
      ))}
      <Circle cx={60} cy={H / 2} r={20} fill={pil.surfaceHigh} stroke={pil.gold} strokeWidth={2} />
      <Circle cx={260} cy={H / 2} r={20} fill={pil.surfaceHigh} stroke={pil.gold} strokeWidth={2} />
      <SvgText x={60} y={H / 2 + 42} fill="#FFFFFF" fontSize={12} fontWeight="700" textAnchor="middle">{t("pilgrimage.mode.safa")}</SvgText>
      <SvgText x={260} y={H / 2 + 42} fill="#FFFFFF" fontSize={12} fontWeight="700" textAnchor="middle">{t("pilgrimage.mode.marwa")}</SvgText>
      <SvgText x={160} y={H / 2 - 18} fill={pil.green} fontSize={10} fontWeight="700" textAnchor="middle">{t("pilgrimage.visual.greenMarkers")}</SvgText>
      <SvgText x={60} y={H / 2 + 4} fill={pil.gold} fontSize={11} fontWeight="800" textAnchor="middle">1</SvgText>
      <SvgText x={260} y={H / 2 + 4} fill={pil.gold} fontSize={11} fontWeight="800" textAnchor="middle">7</SvgText>
    </>
  );
}

function Jamarat() {
  const { t } = useI18n();
  const pillars = [
    { x: 80, h: 46, label: t("pilgrimage.mode.pillarSmall") },
    { x: 160, h: 60, label: t("pilgrimage.mode.pillarMiddle") },
    { x: 240, h: 76, label: t("pilgrimage.mode.pillarLarge") },
  ];
  return (
    <>
      <Line x1={30} y1={118} x2={290} y2={118} stroke={pil.line} strokeWidth={2} />
      {pillars.map((pillar, index) => (
        <G key={pillar.label}>
          <Rect x={pillar.x - 14} y={118 - pillar.h} width={28} height={pillar.h} rx={4} fill={pil.surfaceHigh} stroke={pil.gold} strokeWidth={1.5} />
          <SvgText x={pillar.x} y={136} fill="#FFFFFF" fontSize={11} fontWeight="700" textAnchor="middle">{pillar.label}</SvgText>
          <SvgText x={pillar.x} y={118 - pillar.h - 8} fill={pil.gold} fontSize={11} fontWeight="800" textAnchor="middle">{index + 1}</SvgText>
          {Array.from({ length: 7 }, (_, dot) => (
            <Circle key={dot} cx={pillar.x - 15 + dot * 5} cy={128 - pillar.h - 22} r={1.6} fill="#FFFFFF" opacity={0.75} />
          ))}
        </G>
      ))}
    </>
  );
}

function Mountain({ sun }: { sun: boolean }) {
  return (
    <>
      {sun ? <Circle cx={230} cy={44} r={20} fill={pil.gold} opacity={0.9} /> : null}
      <Path d="M 0 130 L 70 92 L 110 108 L 165 58 L 220 104 L 260 88 L 320 130 Z" fill="#2A2233" />
      <Path d="M 120 130 L 165 74 L 210 130 Z" fill="#3A2F45" />
      <Rect x={162} y={56} width={6} height={18} fill={pil.sand} />
      <SvgText x={165} y={146} fill="#FFFFFF" fontSize={11} fontWeight="700" textAnchor="middle">Jabal ar-Rahma</SvgText>
    </>
  );
}

function Tents() {
  return (
    <>
      {Array.from({ length: 3 }, (_, row) =>
        Array.from({ length: 6 }, (_, col) => {
          const x = 40 + col * 48 + (row % 2) * 24;
          const y = 62 + row * 24;
          return <Polygon key={`${row}-${col}`} points={`${x - 16},${y + 14} ${x},${y - 6} ${x + 16},${y + 14}`} fill={row === 0 ? "#F3E3C3" : "#E6D3AE"} opacity={1 - row * 0.2} />;
        }),
      )}
      <Circle cx={270} cy={34} r={10} fill={pil.gold} opacity={0.85} />
    </>
  );
}

function NightSky() {
  const stars = [[40, 30], [90, 52], [130, 22], [200, 40], [250, 18], [285, 60], [60, 78], [175, 70]];
  return (
    <>
      {stars.map(([x, y], index) => <Circle key={index} cx={x} cy={y} r={index % 3 === 0 ? 1.8 : 1.1} fill="#FFFFFF" opacity={0.85} />)}
      <Path d="M 236 30 a 22 22 0 1 0 22 30 a 17 17 0 1 1 -22 -30 Z" fill={pil.gold} />
      <Path d="M 0 132 Q 80 108 160 120 T 320 112 L 320 150 L 0 150 Z" fill="#231C2C" />
      {Array.from({ length: 9 }, (_, index) => <Circle key={index} cx={110 + index * 12} cy={128 + (index % 2) * 4} r={3} fill="#8E8496" />)}
    </>
  );
}

function Types() {
  const { language } = useI18n();
  const items = (["tamattu", "qiran", "ifrad"] as HajjType[]).map((type, index) => ({ x: 70 + index * 90, label: hajjTypeLabel(type, language).title }));
  return (
    <>
      {items.map((item, index) => (
        <G key={item.label}>
          <Circle cx={item.x} cy={64} r={30} fill={pil.surfaceHigh} stroke={pil.gold} strokeWidth={1.5} />
          <SvgText x={item.x} y={70} fill={pil.gold} fontSize={18} fontWeight="800" textAnchor="middle">{index + 1}</SvgText>
          <SvgText x={item.x} y={118} fill="#FFFFFF" fontSize={13} fontWeight="700" textAnchor="middle">{item.label}</SvgText>
        </G>
      ))}
    </>
  );
}

function Burst() {
  return (
    <>
      {Array.from({ length: 16 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2;
        return <Line key={index} x1={W / 2 + Math.cos(angle) * 34} y1={H / 2 + Math.sin(angle) * 34} x2={W / 2 + Math.cos(angle) * (index % 2 ? 54 : 64)} y2={H / 2 + Math.sin(angle) * (index % 2 ? 54 : 64)} stroke={pil.gold} strokeWidth={2} strokeLinecap="round" opacity={0.8} />;
      })}
      <Kaaba x={W / 2} y={H / 2} size={40} />
    </>
  );
}

const EMBLEMS: Partial<Record<Visual, keyof typeof Ionicons.glyphMap>> = {
  preparation: "briefcase-outline",
  miqat: "airplane-outline",
  ihram: "shirt-outline",
  talbiya: "megaphone-outline",
  prohibitions: "hand-left-outline",
  haram: "business-outline",
  stone: "ellipse-outline",
  prayer: "accessibility-outline",
  zamzam: "water-outline",
  hair: "cut-outline",
  exit: "sunny-outline",
  sacrifice: "leaf-outline",
  medina: "star-outline",
  rawda: "flower-outline",
  salam: "heart-outline",
  quba: "home-outline",
  baqi: "leaf-outline",
  uhud: "triangle-outline",
};

/** Illustration at the top of a page. */
export const PilgrimVisual = memo(function PilgrimVisual({ visual, arabic }: { visual: Visual; arabic?: string }) {
  const drawing = visual === "tawaf" || visual === "ifada" || visual === "farewell" ? <Tawaf />
    : visual === "sai" ? <Sai />
      : visual === "jamarat" ? <Jamarat />
        : visual === "arafat" ? <Mountain sun />
          : visual === "mina" ? <Tents />
            : visual === "muzdalifa" ? <NightSky />
              : visual === "types" ? <Types />
                : visual === "done" ? <Burst />
                  : null;
  const emblem = EMBLEMS[visual];
  return (
    <View style={styles.frame}>
      <LinearGradient colors={["#241C30", "#141019"]} style={StyleSheet.absoluteFill} />
      {drawing ? (
        <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="50%" r="60%">
              <Stop offset="0" stopColor={pil.gold} stopOpacity="0.16" />
              <Stop offset="1" stopColor={pil.gold} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={W} height={H} fill="url(#glow)" />
          {drawing}
        </Svg>
      ) : (
        <View style={styles.emblemWrap}>
          <View style={styles.emblemHalo}>
            <View style={styles.emblem}>
              <Ionicons name={emblem ?? "star-outline"} size={34} color={pil.ink} />
            </View>
          </View>
          {arabic ? <Text style={styles.emblemArabic}>{arabic}</Text> : null}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  frame: { height: 170, overflow: "hidden", borderRadius: 24, borderWidth: 1, borderColor: pil.line, backgroundColor: pil.surface },
  emblemWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emblemHalo: { width: 92, height: 92, alignItems: "center", justifyContent: "center", borderRadius: 46, backgroundColor: pil.goldSoft },
  emblem: { width: 66, height: 66, alignItems: "center", justifyContent: "center", borderRadius: 33, backgroundColor: pil.gold },
  emblemArabic: { color: pil.gold, fontSize: 24, ...pilType.arabic },
});
