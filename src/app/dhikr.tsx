import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useGlobalAudioPlayer } from "../context/AudioPlayerProvider";
import { TASBIH_PRESETS } from "../features/dhikr/TasbihPresets";
import {
  loadTasbihState,
  loadTasbihPrayerSchedule,
  incrementTasbihTotalToday,
  saveTasbihState,
  tasbihDayKey,
  tasbihPrayerCycleKey,
} from "../features/dhikr/TasbihStore";
import { useLearningAudioPlayer } from "../features/learning-audio/useLearningAudioPlayer";
import { ARABIC_READING_FONT_FAMILY } from "../features/quran/ArabicReadingPresentation";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { goalProgressBridge } from "../features/daily-goals/services/goalProgressBridge";
import { useI18n } from "../i18n";

const BEAD_COUNT = 33;
const ROSARY_SIZE = 272;
const ROSARY_RADIUS = 118;
const BEAD_SIZE = 12;
// After prayer: 33 · 33 · 33, then the tahlil that completes the hundred (Sahih Muslim 597).
const CORE_TASBIH = TASBIH_PRESETS[0];
// Pause between reaching a target and moving to the next formula.
const AUTO_ADVANCE_DELAY_MS = 650;

export default function DhikrScreen() {
  const { language, t } = useI18n();
  const [stepIndex, setStepIndex] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalToday, setTotalToday] = useState(0);
  const [ready, setReady] = useState(false);
  const prayerCycleKey = useRef<string | null>(null);
  const dayKey = useRef(tasbihDayKey());
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const latestState = useRef({ counts, totalToday, stepIndex });
  const { pause: pauseQuranAudio } = useGlobalAudioPlayer();
  const learningAudio = useLearningAudioPlayer({
    pauseCompetingAudio: pauseQuranAudio,
  });

  const preset = CORE_TASBIH;
  const safeStepIndex = Math.min(stepIndex, preset.steps.length - 1);
  latestState.current = { counts, totalToday, stepIndex: safeStepIndex };
  const step = preset.steps[safeStepIndex];
  const count = counts[step.id] ?? 0;
  const complete = count >= step.target;
  // One bead per repetition up to 33: the final tahlil shows a single bead.
  const beadCount = Math.min(step.target, BEAD_COUNT);
  const completedBeads =
    count === 0
      ? 0
      : count % beadCount === 0
        ? beadCount
        : count % beadCount;
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    let active = true;
    Promise.all([loadTasbihState(), loadTasbihPrayerSchedule()])
      .then(([stored, schedule]) => {
        if (!active) return;
        const today = tasbihDayKey();
        const cycle = tasbihPrayerCycleKey(schedule);
        prayerCycleKey.current = cycle ?? stored?.prayerCycleKey ?? null;
        dayKey.current = today;
        const reset = stored?.dayKey !== today || Boolean(cycle && stored?.prayerCycleKey && cycle !== stored.prayerCycleKey);
        setStepIndex(reset ? 0 : Math.min(CORE_TASBIH.steps.length - 1, Math.max(0, stored?.stepIndex ?? 0)));
        setCounts(reset ? {} : stored?.counts ?? {});
        setTotalToday(stored?.dayKey === today ? stored.totalToday : 0);
      })
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(useCallback(() => {
    if (!ready) return;
    let active = true;
    const checkPrayer = async () => {
      const today = tasbihDayKey();
      if (today !== dayKey.current) {
        dayKey.current = today;
        setCounts({});
        setStepIndex(0);
        setTotalToday(0);
      }
      const schedule = await loadTasbihPrayerSchedule();
      if (!active) return;
      const cycle = tasbihPrayerCycleKey(schedule);
      if (!cycle) return;
      if (prayerCycleKey.current && prayerCycleKey.current !== cycle) {
        setCounts({});
        setStepIndex(0);
      }
      prayerCycleKey.current = cycle;
    };
    void checkPrayer();
    const timer = setInterval(() => void checkPrayer(), 30_000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void checkPrayer();
    });
    return () => {
      active = false;
      clearInterval(timer);
      subscription.remove();
      if (saveTimer.current) clearTimeout(saveTimer.current);
      const latest = latestState.current;
      void saveTasbihState({
        presetId: preset.id,
        stepIndex: latest.stepIndex,
        counts: latest.counts,
        totalToday: latest.totalToday,
        dayKey: tasbihDayKey(),
        prayerCycleKey: prayerCycleKey.current ?? undefined,
        updatedAt: Date.now(),
      }).catch(() => undefined);
    };
  }, [ready]));

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void saveTasbihState({
        presetId: preset.id,
        stepIndex: safeStepIndex,
        counts,
        totalToday,
        dayKey: tasbihDayKey(),
        prayerCycleKey: prayerCycleKey.current ?? undefined,
        updatedAt: Date.now(),
      }).catch(() => undefined);
    }, 180);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [counts, preset.id, ready, safeStepIndex, totalToday]);

  const increment = useCallback(() => {
    const next = count + 1;
    setCounts((current) => ({ ...current, [step.id]: next }));
    void incrementTasbihTotalToday().then((nextTotal) => {
      setTotalToday(nextTotal);
      goalProgressBridge.record({
        metric: "dhikr_count",
        absolute: nextTotal,
      });
    }).catch(() => undefined);
    if (next === step.target) {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => undefined);
      // Move on to the next formula by itself once the target is reached.
      if (safeStepIndex < preset.steps.length - 1) {
        if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
        const nextIndex = safeStepIndex + 1;
        autoAdvanceTimer.current = setTimeout(() => {
          learningAudio.stop();
          setStepIndex(nextIndex);
        }, AUTO_ADVANCE_DELAY_MS);
      }
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
  }, [count, learningAudio, preset.steps.length, safeStepIndex, step.id, step.target]);

  useEffect(() => () => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
  }, []);

  const undo = useCallback(() => {
    if (count <= 0) return;
    setCounts((current) => ({ ...current, [step.id]: count - 1 }));
    void Haptics.selectionAsync().catch(() => undefined);
  }, [count, step.id]);

  const reset = useCallback(() => {
    setCounts((current) => ({ ...current, [step.id]: 0 }));
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Warning,
    ).catch(() => undefined);
  }, [count, step.id]);

  const goToStep = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= preset.steps.length) return;
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      learningAudio.stop();
      setStepIndex(nextIndex);
      void Haptics.selectionAsync().catch(() => undefined);
    },
    [learningAudio, preset.steps.length],
  );

  const toggleAudio = useCallback(() => {
    if (!step.audioSource) return;
    learningAudio.toggle({
      key: step.id,
      source: step.audioSource,
    });
  }, [learningAudio, step.audioSource, step.id]);

  const beads = useMemo(
    () =>
      Array.from({ length: beadCount }, (_, index) => {
        const angle = (index / beadCount) * Math.PI * 2 - Math.PI / 2;
        return {
          index,
          left:
            ROSARY_SIZE / 2 + Math.cos(angle) * ROSARY_RADIUS - BEAD_SIZE / 2,
          top:
            ROSARY_SIZE / 2 + Math.sin(angle) * ROSARY_RADIUS - BEAD_SIZE / 2,
        };
      }),
    [beadCount],
  );

  const isPlaying =
    learningAudio.activeKey === step.id && learningAudio.isPlaying;
  const isAudioLoading = learningAudio.pendingKey === step.id;
  const presetTitle = language === "en" ? preset.englishTitle : preset.title;
  const presetSource =
    language === "en" && preset.id === "free-remembrance"
      ? t("dhikr.freeCounter")
      : preset.source;
  const stepTranslation = language === "en" ? step.english : step.french;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          accessibilityLabel={t("common.back")}
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/" as Href)
          }
          style={styles.circleButton}
        >
          <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
        </Pressable>
        <View style={styles.titleCopy}>
          <Text style={styles.title}>{t("dhikr.title")}</Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {presetTitle} ·{" "}
            {t("dhikr.stepProgress", {
              current: safeStepIndex + 1,
              total: preset.steps.length,
            })}
          </Text>
        </View>
        <View
          accessibilityLabel={t("dhikr.todayAccessibility", { count: totalToday })}
          style={styles.todayPill}
        >
          <Text style={styles.todayPillLabel}>{t("dhikr.today")}</Text>
          <Text style={styles.todayPillValue}>{totalToday}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formulaTabs}>
          {preset.steps.map((item, itemIndex) => {
            const active = itemIndex === safeStepIndex;
            const itemCount = Math.min(item.target, counts[item.id] ?? 0);
            const isCompletion = item.target === 1;
            return (
              <Pressable
                accessibilityLabel={t("dhikr.selectFormula", { name: item.phonetic })}
                key={item.id}
                onPress={() => goToStep(itemIndex)}
                style={[
                  styles.formulaTab,
                  isCompletion && styles.formulaTabCompletion,
                  active && styles.formulaTabActive,
                ]}
              >
                <Text
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  numberOfLines={1}
                  style={[
                    styles.formulaTabText,
                    active && styles.formulaTabTextActive,
                  ]}
                >
                  {isCompletion ? t("dhikr.completionTab") : item.phonetic}
                </Text>
                <Text style={styles.formulaTabCount}>
                  {itemCount}/{item.target}
                  {itemCount >= item.target ? " ✓" : ""}
                </Text>
                <View style={styles.formulaTabTrack}>
                  <View
                    style={[
                      styles.formulaTabFill,
                      { width: `${(itemCount / item.target) * 100}%` },
                    ]}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sessionCard}>
          <Text
            selectable
            style={[styles.arabic, step.target === 1 && styles.arabicLong]}
          >
            {step.arabic}
          </Text>
          <Text selectable style={styles.phonetic}>
            {step.phonetic}
          </Text>
          <Text selectable style={styles.french}>
            {stepTranslation}
          </Text>

          <View style={styles.formulaActions}>
            <Pressable
              accessibilityLabel={t("dhikr.openSource", { source: presetSource })}
              disabled={!preset.sourceUrl}
              onPress={() =>
                preset.sourceUrl && void Linking.openURL(preset.sourceUrl)
              }
              style={styles.sourcePill}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={13}
                color={colors.goldLight}
              />
              <Text style={styles.sourceText}>{presetSource}</Text>
            </Pressable>
            {step.audioSource ? (
              <Pressable
                accessibilityLabel={t(
                  isPlaying ? "dhikr.pauseAccessibility" : "dhikr.listenAccessibility",
                  { name: step.phonetic },
                )}
                onPress={toggleAudio}
                style={styles.listenButton}
              >
                {isAudioLoading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Ionicons
                    name={isPlaying ? "pause" : "volume-high-outline"}
                    size={17}
                    color={colors.background}
                  />
                )}
                <Text style={styles.listenText}>
                  {isAudioLoading
                    ? t("dhikr.loadingAudio")
                    : isPlaying
                      ? t("dhikr.pause")
                      : t("dhikr.listen")}
                </Text>
              </Pressable>
            ) : null}
          </View>
          {learningAudio.error ? (
            <Text style={styles.audioError}>
              {language === "fr" ? learningAudio.error : t("dhikr.audioPlaybackError")}
            </Text>
          ) : null}
        </View>

        <View style={styles.rosaryCard}>
          <View style={styles.rosary}>
            {beads.map((bead) => (
              <View
                key={bead.index}
                style={[
                  styles.bead,
                  { left: bead.left, top: bead.top },
                  bead.index < completedBeads && styles.beadComplete,
                  bead.index === completedBeads && !complete && styles.beadNext,
                ]}
              />
            ))}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("dhikr.counterAccessibility", {
                count,
                target: step.target,
              })}
              onPress={increment}
              style={({ pressed }) => [
                styles.counter,
                complete && styles.counterComplete,
                pressed && !complete && styles.counterPressed,
              ]}
            >
              <LinearGradient
                colors={
                  complete
                    ? ["#F1D07B", "#C98B31"]
                    : ["#2A2140", "#151022"]
                }
                style={StyleSheet.absoluteFill}
              />
              <Text
                style={[
                  styles.counterValue,
                  complete && styles.counterValueDone,
                ]}
              >
                {count}
              </Text>
              <Text
                style={[
                  styles.counterTarget,
                  complete && styles.counterTargetDone,
                ]}
              >
                {t("dhikr.outOf", { target: step.target })}
              </Text>
              <View
                style={[styles.tapPill, complete && styles.tapPillComplete]}
              >
                <Ionicons
                  name={complete ? "checkmark" : "finger-print-outline"}
                  size={14}
                  color={complete ? colors.background : colors.goldLight}
                />
                <Text
                  style={[styles.tapText, complete && styles.tapTextComplete]}
                >
                  {complete ? t("dhikr.finishedUpper") : t("dhikr.tapUpper")}
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.counterTools}>
            <Pressable
              accessibilityLabel={t("dhikr.undoAccessibility")}
              onPress={undo}
              disabled={count === 0}
              style={styles.toolButton}
            >
              <Ionicons
                name="arrow-undo"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.toolText}>{t("dhikr.undo")}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={t("dhikr.resetAccessibility")}
              onPress={reset}
              disabled={count === 0}
              style={styles.toolButton}
            >
              <Ionicons name="refresh" size={18} color={colors.textSecondary} />
              <Text style={styles.toolText}>{t("dhikr.reset")}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.hadithSection}>
          <Text style={styles.hadithHeading}>{t("dhikr.fingersTitle")}</Text>
          <Text style={styles.hadithBody}>{t("dhikr.fingersHadith1501")}</Text>
          <Pressable onPress={() => void Linking.openURL("https://sunnah.com/abudawud:1501")}>
            <Text style={styles.hadithSource}>{t("dhikr.fingersSource1501")}</Text>
          </Pressable>
          <Text style={[styles.hadithBody, styles.hadithBodySpaced]}>{t("dhikr.fingersHadith1502")}</Text>
          <Pressable onPress={() => void Linking.openURL("https://sunnah.com/abudawud:1502")}>
            <Text style={styles.hadithSource}>{t("dhikr.fingersSource1502")}</Text>
          </Pressable>
          <Text style={styles.hadithNote}>{t("dhikr.rosaryNote")}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  topBar: {
    height: 70,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  circleButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  titleCopy: { flex: 1, marginHorizontal: 12 },
  todayPill: {
    minWidth: 62,
    paddingHorizontal: 11,
    paddingVertical: 6,
    alignItems: "flex-end",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.22)",
    backgroundColor: colors.surface,
  },
  todayPillLabel: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 6.5,
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  todayPillValue: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 21,
    lineHeight: 24,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  title: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 29,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
  },
  hadithSection: { marginTop: 22, padding: 18, borderRadius: 22, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  hadithHeading: { color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 19 },
  hadithBody: { marginTop: 15, color: colors.text, fontFamily: typography.sans, fontSize: 13, lineHeight: 20 },
  hadithSource: { marginTop: 7, color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, textDecorationLine: "underline" },
  hadithBodySpaced: { marginTop: 13 },
  hadithNote: { marginTop: 17, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.borderSoft, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12, lineHeight: 19 },
  content: { paddingHorizontal: 14, paddingBottom: 120 },
  formulaTabs: {
    marginTop: 13,
    flexDirection: "row",
    gap: 7,
  },
  formulaTab: {
    flex: 1,
    height: 56,
    paddingHorizontal: 7,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,242,220,0.12)",
    backgroundColor: "#151022",
  },
  formulaTabCompletion: { flex: 0.62 },
  formulaTabActive: {
    borderColor: "rgba(240,204,124,0.70)",
    backgroundColor: "#1E1730",
  },
  formulaTabTrack: {
    alignSelf: "stretch",
    height: 2.5,
    marginTop: 5,
    marginHorizontal: 4,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  formulaTabFill: { height: "100%", borderRadius: 2, backgroundColor: colors.goldLight },
  formulaTabText: {
    color: colors.textSecondary,
    fontFamily: typography.serifSemibold,
    fontSize: 10.5,
  },
  formulaTabTextActive: { color: "#FFF8ED" },
  formulaTabCount: {
    marginTop: 2,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 7.5,
    fontWeight: "800",
  },
  sessionCard: {
    marginTop: 13,
    padding: 16,
    overflow: "hidden",
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.22)",
    backgroundColor: "#151022",
  },
  sourcePill: {
    height: 29,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(10,8,18,0.54)",
  },
  sourceText: {
    marginLeft: 5,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 7.5,
  },
  arabic: {
    marginTop: 2,
    color: "#FFF9F0",
    fontFamily: ARABIC_READING_FONT_FAMILY,
    fontSize: 30,
    lineHeight: 48,
    textAlign: "center",
    writingDirection: "rtl",
  },
  arabicLong: { fontSize: 21, lineHeight: 36 },
  phonetic: {
    marginTop: 11,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 15,
    lineHeight: 21,
    textAlign: "center",
  },
  french: {
    marginTop: 7,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  formulaActions: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listenButton: {
    height: 36,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: colors.goldLight,
  },
  listenText: {
    marginLeft: 6,
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "800",
  },
  audioError: {
    marginTop: 10,
    color: colors.danger,
    fontFamily: typography.sans,
    fontSize: 8.5,
    textAlign: "center",
  },
  rosaryCard: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 29,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "#100C19",
  },
  rosary: { width: ROSARY_SIZE, height: ROSARY_SIZE },
  bead: {
    position: "absolute",
    width: BEAD_SIZE,
    height: BEAD_SIZE,
    borderRadius: BEAD_SIZE / 2,
    borderWidth: 1,
    borderColor: "rgba(224,185,103,0.22)",
    backgroundColor: "#2B2238",
  },
  beadComplete: {
    borderColor: "#F1D078",
    backgroundColor: colors.goldLight,
    shadowColor: colors.goldLight,
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  beadNext: {
    borderColor: colors.goldLight,
    transform: [{ scale: 1.38 }],
  },
  counter: {
    position: "absolute",
    top: (ROSARY_SIZE - 160) / 2,
    left: (ROSARY_SIZE - 160) / 2,
    width: 160,
    height: 160,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 80,
    borderWidth: 1,
    borderColor: "rgba(239,200,111,0.50)",
    shadowColor: colors.goldLight,
    shadowOpacity: 0.16,
    shadowRadius: 22,
  },
  counterComplete: { borderColor: "#FFE3A0" },
  counterPressed: { transform: [{ scale: 0.965 }] },
  counterValue: {
    fontVariant: ["lining-nums", "tabular-nums"],
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 58,
    lineHeight: 65,
  },
  counterValueDone: { color: colors.background },
  counterTarget: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  counterTargetDone: { color: "rgba(8,7,14,0.66)" },
  tapPill: {
    height: 27,
    marginTop: 11,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "rgba(9,7,17,0.48)",
  },
  tapPillComplete: { backgroundColor: "rgba(255,255,255,0.28)" },
  tapText: {
    marginLeft: 4,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 7.5,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  tapTextComplete: { color: colors.background },
  counterTools: {
    width: "100%",
    marginTop: -6,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toolButton: { width: 65, alignItems: "center", paddingVertical: 8 },
  toolText: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
  },
  stepNavigation: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 9,
  },
  stepButton: {
    flex: 1,
    height: 49,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  stepButtonPrimary: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  stepButtonText: {
    marginLeft: 6,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: "700",
  },
  stepButtonPrimaryText: {
    marginRight: 6,
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: "800",
  },
  disabled: { opacity: 0.34 },
});
