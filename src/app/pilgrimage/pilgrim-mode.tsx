import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, G, Path, Rect, Text as SvgText } from "react-native-svg";

import { InvocationCard, TextScaleContext } from "../../components/pilgrimage/PilgrimBits";
import { pil, pilType } from "../../components/pilgrimage/theme";
import { usePilgrimageContent } from "../../features/pilgrimage/pilgrimageI18n";
import { updatePilgrimageState, usePilgrimageState, type PilgrimageState } from "../../features/pilgrimage/pilgrimageStorage";
import type { Tool } from "../../features/pilgrimage/pilgrimageTypes";
import { useI18n, type TranslationKey } from "../../i18n";

const TABS: ReadonlyArray<{ id: Tool; label: TranslationKey; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: "tawaf", label: "pilgrimage.mode.tabTawaf", icon: "sync-outline" },
  { id: "sai", label: "pilgrimage.mode.tabSai", icon: "swap-vertical-outline" },
  { id: "jamarat", label: "pilgrimage.mode.tabJamarat", icon: "ellipsis-horizontal-circle-outline" },
];

const tap = () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
const success = () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);

function setCounters(update: (counters: PilgrimageState["counters"]) => PilgrimageState["counters"]) {
  void updatePilgrimageState((state) => ({ ...state, counters: update(state.counters) }));
}

/** Arc of a ring between two angles (degrees, 0 = top, clockwise). */
function arc(cx: number, cy: number, r: number, from: number, to: number) {
  const point = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return `${cx + r * Math.cos(rad)} ${cy + r * Math.sin(rad)}`;
  };
  return `M ${point(from)} A ${r} ${r} 0 ${to - from > 180 ? 1 : 0} 1 ${point(to)}`;
}

export default function PilgrimModeScreen() {
  useKeepAwake();
  const params = useLocalSearchParams<{ tool?: string }>();
  const [tool, setTool] = useState<Tool>(params.tool === "sai" || params.tool === "jamarat" ? params.tool : "tawaf");
  const state = usePilgrimageState();
  const insets = useSafeAreaInsets();
  const { t } = useI18n();

  useEffect(() => {
    if (params.tool === "tawaf" || params.tool === "sai" || params.tool === "jamarat") setTool(params.tool);
  }, [params.tool]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("common.back")} onPress={() => router.back()} hitSlop={8} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{t("pilgrimage.mode.eyebrow")}</Text>
          <Text style={styles.title}>{t("pilgrimage.onSite")}</Text>
        </View>
        <View style={styles.awake}>
          <Ionicons name="sunny-outline" size={14} color={pil.gold} />
          <Text style={styles.awakeText}>{t("pilgrimage.mode.awake")}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tool === tab.id }}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => undefined);
              setTool(tab.id);
            }}
            style={[styles.tab, tool === tab.id && styles.tabActive]}
          >
            <Ionicons name={tab.icon} size={17} color={tool === tab.id ? pil.ink : "#FFFFFF"} />
            <Text style={[styles.tabText, tool === tab.id && styles.tabTextActive]}>{t(tab.label)}</Text>
          </Pressable>
        ))}
      </View>

      <TextScaleContext.Provider value={state?.textScale ?? 1}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>
        {state ? (
          tool === "tawaf" ? <TawafCounter count={state.counters.tawaf} onNext={() => setTool("sai")} />
            : tool === "sai" ? <SaiCounter count={state.counters.sai} />
              : <JamaratCounter day={state.counters.jamaratDay} counts={state.counters.jamarat} />
        ) : null}
        <Text style={styles.disclaimer}>{t("pilgrimage.mode.disclaimer")}</Text>
      </ScrollView>
      </TextScaleContext.Provider>
    </View>
  );
}

// ----- Tawâf ---------------------------------------------------------------------------------

function TawafCounter({ count, onNext }: { count: number; onNext: () => void }) {
  const { width } = useWindowDimensions();
  const size = Math.min(width - 40, 330);
  const c = size / 2;
  const r = c - 18;
  const complete = count >= 7;
  const segment = 360 / 7;
  const { t } = useI18n();
  const { invocationsById } = usePilgrimageContent();

  const add = () => {
    if (complete) return;
    if (count + 1 >= 7) success();
    else tap();
    setCounters((counters) => ({ ...counters, tawaf: Math.min(7, counters.tawaf + 1) }));
  };

  return (
    <View>
      <View style={styles.ringWrap}>
        <Svg width={size} height={size}>
          {Array.from({ length: 7 }, (_, index) => {
            // Counter-clockwise like the pilgrims: the arcs fill from the top, to the left.
            const from = 360 - (index + 1) * segment + 2.5;
            const to = 360 - index * segment - 2.5;
            const filled = index < count;
            const current = index === count && !complete;
            return (
              <Path
                key={index}
                d={arc(c, c, r, from, to)}
                stroke={filled ? pil.gold : current ? "rgba(232,187,98,0.55)" : "rgba(255,255,255,0.12)"}
                strokeWidth={current ? 20 : 16}
                strokeLinecap="round"
                fill="none"
              />
            );
          })}
          <G>
            <Rect x={c - 34} y={c - 34} width={68} height={68} rx={4} fill="#0E0B10" stroke="#3A2E1E" strokeWidth={1} />
            <Rect x={c - 34} y={c - 18} width={68} height={7} fill={pil.gold} />
            <Circle cx={c - 34} cy={c + 34} r={5} fill={pil.gold} />
          </G>
          <SvgText x={c} y={c + 62} fill="#FFFFFF" fontSize={13} fontWeight="700" textAnchor="middle">{t("pilgrimage.mode.kaabaLeft")}</SvgText>
        </Svg>
      </View>
      <View style={styles.countRow}>
        <Text style={styles.bigCount}>{count}</Text>
        <Text style={styles.bigCountLabel}>{t("pilgrimage.mode.circuits")}</Text>
      </View>

      {complete ? (
        <View style={styles.doneCard}>
          <Ionicons name="checkmark-circle" size={30} color={pil.green} />
          <Text style={styles.doneTitle}>{t("pilgrimage.mode.tawafDone")}</Text>
          <Text style={styles.doneText}>{t("pilgrimage.mode.tawafDoneText")}</Text>
          <Pressable onPress={onNext} style={styles.primary}>
            <Text style={styles.primaryText}>{t("pilgrimage.mode.goSai")}</Text>
            <Ionicons name="arrow-forward" size={18} color={pil.ink} />
          </Pressable>
        </View>
      ) : (
        <>
          <Pressable accessibilityRole="button" onPress={add} style={({ pressed }) => [styles.bigButton, pressed && styles.bigButtonPressed]}>
            <Text style={styles.bigButtonText}>{t("pilgrimage.mode.circuitDone", { number: count + 1 })}</Text>
            <Text style={styles.bigButtonHint}>{t("pilgrimage.mode.circuitHint")}</Text>
          </Pressable>
          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={18} color={pil.gold} />
            <Text style={styles.hintText}>
              {count < 3 ? t("pilgrimage.mode.ramalHint") : t("pilgrimage.mode.stoneHint")}
            </Text>
          </View>
        </>
      )}
      <Controls
        canUndo={count > 0}
        onUndo={() => setCounters((counters) => ({ ...counters, tawaf: Math.max(0, counters.tawaf - 1) }))}
        onReset={() => setCounters((counters) => ({ ...counters, tawaf: 0 }))}
      />
      <Text style={styles.sayTitle}>{t("pilgrimage.mode.toSay")}</Text>
      {["takbir", "rabbana", "free"].map((id) => <InvocationCard key={id} invocation={invocationsById[id]} />)}
    </View>
  );
}

// ----- Sa‘y ----------------------------------------------------------------------------------

function SaiCounter({ count }: { count: number }) {
  const complete = count >= 7;
  const lap = Math.min(7, count + 1);
  const fromSafa = lap % 2 === 1;
  const { t } = useI18n();
  const { invocationsById } = usePilgrimageContent();
  const safa = t("pilgrimage.mode.safa");
  const marwa = t("pilgrimage.mode.marwa");

  const add = () => {
    if (complete) return;
    if (count + 1 >= 7) success();
    else tap();
    setCounters((counters) => ({ ...counters, sai: Math.min(7, counters.sai + 1) }));
  };

  return (
    <View>
      <View style={styles.track}>
        <View style={styles.hill}>
          <Text style={styles.hillName}>{safa}</Text>
          <Text style={styles.hillArabic}>الصفا</Text>
        </View>
        <View style={styles.laps}>
          {Array.from({ length: 7 }, (_, index) => {
            const filled = index < count;
            const current = index === count && !complete;
            const down = index % 2 === 0;
            return (
              <View key={index} style={[styles.lap, filled && styles.lapFilled, current && styles.lapCurrent]}>
                <Ionicons name={down ? "arrow-down" : "arrow-up"} size={16} color={filled ? pil.ink : current ? pil.gold : "#FFFFFF"} />
                <Text style={[styles.lapNumber, filled && styles.lapNumberFilled]}>{index + 1}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.greenZone}><Text style={styles.greenZoneText}>{t("pilgrimage.mode.greenZone")}</Text></View>
        <View style={styles.hill}>
          <Text style={styles.hillName}>{marwa}</Text>
          <Text style={styles.hillArabic}>المروة</Text>
        </View>
      </View>

      {complete ? (
        <View style={styles.doneCard}>
          <Ionicons name="checkmark-circle" size={30} color={pil.green} />
          <Text style={styles.doneTitle}>{t("pilgrimage.mode.saiDone")}</Text>
          <Text style={styles.doneText}>{t("pilgrimage.mode.saiDoneText")}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.direction}>{t("pilgrimage.mode.trip", { number: lap })}</Text>
          <Text style={styles.directionWay}>{fromSafa ? `${safa}  →  ${marwa}` : `${marwa}  →  ${safa}`}</Text>
          <Pressable accessibilityRole="button" onPress={add} style={({ pressed }) => [styles.bigButton, pressed && styles.bigButtonPressed]}>
            <Text style={styles.bigButtonText}>{t("pilgrimage.mode.arrivedAt", { place: fromSafa ? marwa : safa })}</Text>
            <Text style={styles.bigButtonHint}>{t("pilgrimage.mode.tripDone", { number: lap })}</Text>
          </Pressable>
          <View style={styles.hint}>
            <Ionicons name="information-circle-outline" size={18} color={pil.gold} />
            <Text style={styles.hintText}>{t("pilgrimage.mode.saiHint")}</Text>
          </View>
        </>
      )}
      <Controls
        canUndo={count > 0}
        onUndo={() => setCounters((counters) => ({ ...counters, sai: Math.max(0, counters.sai - 1) }))}
        onReset={() => setCounters((counters) => ({ ...counters, sai: 0 }))}
      />
      <Text style={styles.sayTitle}>{t("pilgrimage.mode.toSay")}</Text>
      {(count === 0 ? ["safa", "safa-dhikr", "forgiveness"] : ["safa-dhikr", "forgiveness", "free"]).map((id) => <InvocationCard key={id} invocation={invocationsById[id]} />)}
    </View>
  );
}

// ----- Jamarât -------------------------------------------------------------------------------

const PILLARS: readonly TranslationKey[] = ["pilgrimage.mode.pillarSmall", "pilgrimage.mode.pillarMiddle", "pilgrimage.mode.pillarLarge"];

function JamaratCounter({ day, counts }: { day: 10 | 11 | 12 | 13; counts: [number, number, number] }) {
  // On the 10th, only the big one (Jamrat al-‘Aqaba).
  const order = day === 10 ? [2] : [0, 1, 2];
  const active = order.find((pillar) => counts[pillar] < 7);
  const showPause = active !== undefined && active !== order[0] && counts[active] === 0;
  const { t } = useI18n();
  const { invocationsById } = usePilgrimageContent();

  const throwOne = () => {
    if (active === undefined) return;
    const next = counts.map((value, pillar) => (pillar === active ? value + 1 : value)) as [number, number, number];
    const finishedAll = order.every((pillar) => next[pillar] >= 7);
    if (finishedAll || next[active] === 7) success();
    else tap();
    setCounters((counters) => ({ ...counters, jamarat: next }));
  };

  return (
    <View>
      <Text style={styles.dayLabel}>{t("pilgrimage.mode.dayLabel")}</Text>
      <View style={styles.days}>
        {([10, 11, 12, 13] as const).map((value) => (
          <Pressable
            key={value}
            onPress={() => {
              void Haptics.selectionAsync().catch(() => undefined);
              setCounters((counters) => ({ ...counters, jamaratDay: value, jamarat: [0, 0, 0] }));
            }}
            style={[styles.day, day === value && styles.dayActive]}
          >
            <Text style={[styles.dayText, day === value && styles.dayTextActive]}>{value}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.pillars}>
        {PILLARS.map((label, pillar) => {
          const used = order.includes(pillar);
          const isActive = pillar === active;
          return (
            <View key={label} style={[styles.pillar, !used && styles.pillarUnused, isActive && styles.pillarActive]}>
              <Text style={styles.pillarOrder}>{used ? (day === 10 ? t("pilgrimage.mode.aqaba") : `${order.indexOf(pillar) + 1}`) : "—"}</Text>
              <View style={[styles.pillarStone, { height: 46 + pillar * 16 }, counts[pillar] >= 7 && styles.pillarStoneDone]} />
              <Text style={styles.pillarName}>{t(label)}</Text>
              <View style={styles.pebbles}>
                {Array.from({ length: 7 }, (_, index) => (
                  <View key={index} style={[styles.pebble, index < counts[pillar] && styles.pebbleThrown]} />
                ))}
              </View>
              <Text style={styles.pillarCount}>{used ? `${counts[pillar]} / 7` : t("pilgrimage.mode.notToday")}</Text>
            </View>
          );
        })}
      </View>

      {showPause ? (
        <View style={styles.pause}>
          <Ionicons name="hand-left-outline" size={20} color={pil.green} />
          <Text style={styles.pauseText}>{t("pilgrimage.mode.pause")}</Text>
        </View>
      ) : null}

      {active === undefined ? (
        <View style={styles.doneCard}>
          <Ionicons name="checkmark-circle" size={30} color={pil.green} />
          <Text style={styles.doneTitle}>{t("pilgrimage.mode.stoningDone", { day })}</Text>
          <Text style={styles.doneText}>
            {day === 10 ? t("pilgrimage.mode.stoningDone10") : t("pilgrimage.mode.stoningDoneOther")}
          </Text>
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={throwOne} style={({ pressed }) => [styles.bigButton, pressed && styles.bigButtonPressed]}>
          <Text style={styles.bigButtonText}>{t("pilgrimage.mode.throw")}</Text>
          <Text style={styles.bigButtonHint}>{t("pilgrimage.mode.throwHint", { pillar: t(PILLARS[active]), number: counts[active] + 1 })}</Text>
        </Pressable>
      )}
      <Controls
        canUndo={order.some((pillar) => counts[pillar] > 0)}
        onUndo={() => setCounters((counters) => {
          const last = [...order].reverse().find((pillar) => counters.jamarat[pillar] > 0);
          if (last === undefined) return counters;
          const next = [...counters.jamarat] as [number, number, number];
          next[last] -= 1;
          return { ...counters, jamarat: next };
        })}
        onReset={() => setCounters((counters) => ({ ...counters, jamarat: [0, 0, 0] }))}
      />
      <Text style={styles.sayTitle}>{t("pilgrimage.mode.toSay")}</Text>
      <InvocationCard invocation={invocationsById.takbir} />
    </View>
  );
}

function Controls({ canUndo, onUndo, onReset }: { canUndo: boolean; onUndo: () => void; onReset: () => void }) {
  const [confirm, setConfirm] = useState(false);
  const { t } = useI18n();
  return (
    <View style={styles.controls}>
      <Pressable disabled={!canUndo} onPress={onUndo} style={[styles.control, !canUndo && styles.disabled]}>
        <Ionicons name="arrow-undo-outline" size={18} color="#FFFFFF" />
        <Text style={styles.controlText}>{t("pilgrimage.mode.undo")}</Text>
      </Pressable>
      <Pressable
        disabled={!canUndo}
        onPress={() => {
          if (!confirm) {
            setConfirm(true);
            setTimeout(() => setConfirm(false), 2500);
            return;
          }
          setConfirm(false);
          onReset();
        }}
        style={[styles.control, confirm && styles.controlConfirm, !canUndo && styles.disabled]}
      >
        <Ionicons name="refresh-outline" size={18} color={confirm ? pil.ink : "#FFFFFF"} />
        <Text style={[styles.controlText, confirm && styles.controlTextConfirm]}>{confirm ? t("pilgrimage.mode.confirmReset") : t("pilgrimage.mode.reset")}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: pil.bg },
  header: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: pil.surfaceHigh },
  headerCopy: { flex: 1 },
  eyebrow: { color: pil.gold, fontSize: 12, fontWeight: "800", letterSpacing: 1.3, ...pilType.sans },
  title: { color: pil.text, fontSize: 30, ...pilType.display },
  awake: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: pil.goldSoft },
  awakeText: { color: pil.gold, fontSize: 12, fontWeight: "800", ...pilType.sans },
  tabs: { marginTop: 14, marginHorizontal: 16, padding: 4, flexDirection: "row", gap: 4, borderRadius: 18, backgroundColor: pil.surface },
  tab: { flex: 1, minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 14 },
  tabActive: { backgroundColor: pil.gold },
  tabText: { color: pil.text, fontSize: 15, fontWeight: "700", ...pilType.sans },
  tabTextActive: { color: pil.ink, fontWeight: "800" },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  ringWrap: { alignItems: "center", justifyContent: "center" },
  countRow: { marginTop: 4, flexDirection: "row", alignItems: "baseline", justifyContent: "center", gap: 8 },
  bigCount: { color: pil.text, fontSize: 56, fontWeight: "900", ...pilType.sans },
  bigCountLabel: { color: pil.textSoft, fontSize: 20, fontWeight: "700", ...pilType.sans },
  bigButton: { marginTop: 18, minHeight: 92, alignItems: "center", justifyContent: "center", borderRadius: 28, backgroundColor: pil.gold },
  bigButtonPressed: { transform: [{ scale: 0.97 }], backgroundColor: pil.goldDeep },
  bigButtonText: { color: pil.ink, fontSize: 22, fontWeight: "900", ...pilType.sans },
  bigButtonHint: { marginTop: 4, color: "rgba(27,18,8,0.75)", fontSize: 13.5, fontWeight: "700", ...pilType.sans },
  hint: { marginTop: 14, padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 9, borderRadius: 16, backgroundColor: pil.surface },
  hintText: { flex: 1, color: pil.text, fontSize: 15, lineHeight: 22, ...pilType.sans },
  doneCard: { marginTop: 16, padding: 18, alignItems: "center", borderRadius: 24, borderWidth: 1, borderColor: "rgba(123,212,168,0.4)", backgroundColor: pil.greenSoft },
  doneTitle: { marginTop: 6, color: pil.text, fontSize: 22, fontWeight: "800", ...pilType.sans },
  doneText: { marginTop: 6, color: pil.text, fontSize: 15.5, lineHeight: 23, textAlign: "center", ...pilType.sans },
  primary: { marginTop: 14, minHeight: 48, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 24, backgroundColor: pil.gold },
  primaryText: { color: pil.ink, fontSize: 16, fontWeight: "800", ...pilType.sans },
  controls: { marginTop: 14, flexDirection: "row", gap: 10 },
  control: { flex: 1, minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 16, backgroundColor: pil.surfaceHigh },
  controlConfirm: { backgroundColor: pil.red },
  controlText: { color: pil.text, fontSize: 14, fontWeight: "700", ...pilType.sans },
  controlTextConfirm: { color: pil.ink, fontWeight: "800" },
  disabled: { opacity: 0.4 },
  sayTitle: { marginTop: 26, marginBottom: 10, color: pil.gold, fontSize: 15, fontWeight: "800", ...pilType.sans },
  track: { padding: 14, gap: 10, borderRadius: 26, borderWidth: 1, borderColor: pil.line, backgroundColor: pil.surface },
  hill: { minHeight: 54, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, borderRadius: 18, backgroundColor: pil.surfaceHigh },
  hillName: { color: pil.text, fontSize: 20, fontWeight: "800", ...pilType.sans },
  hillArabic: { color: pil.gold, fontSize: 22, ...pilType.arabic },
  laps: { flexDirection: "row", gap: 6 },
  lap: { flex: 1, minHeight: 64, alignItems: "center", justifyContent: "center", gap: 4, borderRadius: 14, borderWidth: 1, borderColor: pil.line, backgroundColor: "rgba(255,255,255,0.04)" },
  lapFilled: { borderColor: pil.gold, backgroundColor: pil.gold },
  lapCurrent: { borderColor: pil.gold, borderWidth: 2 },
  lapNumber: { color: pil.text, fontSize: 15, fontWeight: "800", ...pilType.sans },
  lapNumberFilled: { color: pil.ink },
  greenZone: { paddingVertical: 7, alignItems: "center", borderRadius: 12, backgroundColor: pil.greenSoft },
  greenZoneText: { color: pil.green, fontSize: 13, fontWeight: "800", ...pilType.sans },
  direction: { marginTop: 18, color: pil.textSoft, fontSize: 15, fontWeight: "700", textAlign: "center", ...pilType.sans },
  directionWay: { marginTop: 2, color: pil.text, fontSize: 28, fontWeight: "800", textAlign: "center", ...pilType.sans },
  dayLabel: { color: pil.textSoft, fontSize: 14, fontWeight: "700", ...pilType.sans },
  days: { marginTop: 8, flexDirection: "row", gap: 8 },
  day: { flex: 1, minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: pil.surface },
  dayActive: { backgroundColor: pil.gold },
  dayText: { color: pil.text, fontSize: 20, fontWeight: "800", ...pilType.sans },
  dayTextActive: { color: pil.ink },
  pillars: { marginTop: 16, flexDirection: "row", gap: 8, alignItems: "flex-end" },
  pillar: { flex: 1, paddingVertical: 12, alignItems: "center", gap: 6, borderRadius: 20, borderWidth: 1, borderColor: pil.line, backgroundColor: pil.surface },
  pillarUnused: { opacity: 0.35 },
  pillarActive: { borderColor: pil.gold, borderWidth: 2, backgroundColor: pil.surfaceHigh },
  pillarOrder: { color: pil.gold, fontSize: 13, fontWeight: "800", ...pilType.sans },
  pillarStone: { width: 26, borderRadius: 6, borderWidth: 1.5, borderColor: pil.gold, backgroundColor: "rgba(232,187,98,0.12)" },
  pillarStoneDone: { backgroundColor: pil.gold },
  pillarName: { color: pil.text, fontSize: 14, fontWeight: "800", ...pilType.sans },
  pebbles: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 4, paddingHorizontal: 6 },
  pebble: { width: 9, height: 9, borderRadius: 5, borderWidth: 1, borderColor: "rgba(255,255,255,0.45)" },
  pebbleThrown: { borderColor: pil.gold, backgroundColor: pil.gold },
  pillarCount: { color: pil.textSoft, fontSize: 12.5, fontWeight: "700", ...pilType.sans },
  pause: { marginTop: 14, padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 9, borderRadius: 16, backgroundColor: pil.greenSoft },
  pauseText: { flex: 1, color: pil.text, fontSize: 15, lineHeight: 22, fontWeight: "600", ...pilType.sans },
  disclaimer: { marginTop: 22, color: pil.muted, fontSize: 13, textAlign: "center", ...pilType.sans },
});
