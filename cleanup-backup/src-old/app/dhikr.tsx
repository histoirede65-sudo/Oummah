import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
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
  saveTasbihState,
  tasbihDayKey,
} from "../features/dhikr/TasbihStore";
import { useLearningAudioPlayer } from "../features/learning-audio/useLearningAudioPlayer";
import { ARABIC_READING_FONT_FAMILY } from "../features/quran/ArabicReadingPresentation";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { goalProgressBridge } from "../features/daily-goals/services/goalProgressBridge";

const BEAD_COUNT = 33;
const ROSARY_SIZE = 304;
const ROSARY_RADIUS = 132;
const BEAD_SIZE = 13;
const CORE_TASBIH = {
  ...TASBIH_PRESETS[0],
  steps: TASBIH_PRESETS[0].steps.slice(0, 3),
};

export default function DhikrScreen() {
  const [stepIndex, setStepIndex] = useState(0);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [totalToday, setTotalToday] = useState(0);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const { pause: pauseQuranAudio } = useGlobalAudioPlayer();
  const learningAudio = useLearningAudioPlayer({
    pauseCompetingAudio: pauseQuranAudio,
  });

  const preset = CORE_TASBIH;
  const safeStepIndex = Math.min(stepIndex, preset.steps.length - 1);
  const step = preset.steps[safeStepIndex];
  const count = counts[step.id] ?? 0;
  const complete = count >= step.target;
  const completedBeads =
    count === 0
      ? 0
      : count % BEAD_COUNT === 0
        ? BEAD_COUNT
        : count % BEAD_COUNT;
  const sessionTotal = preset.steps.reduce(
    (sum, item) => sum + Math.min(item.target, counts[item.id] ?? 0),
    0,
  );
  const sessionTarget = preset.steps.reduce(
    (sum, item) => sum + item.target,
    0,
  );

  useEffect(() => {
    let active = true;
    loadTasbihState()
      .then((stored) => {
        if (!active || !stored) return;
        const today = tasbihDayKey();
        setStepIndex(Math.min(2, Math.max(0, stored.stepIndex)));
        setCounts(stored.counts ?? {});
        setTotalToday(stored.dayKey === today ? stored.totalToday : 0);
      })
      .finally(() => active && setReady(true));
    return () => {
      active = false;
    };
  }, []);

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
        updatedAt: Date.now(),
      }).catch(() => undefined);
    }, 180);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [counts, preset.id, ready, safeStepIndex, totalToday]);

  const increment = useCallback(() => {
    if (complete) return;
    const next = count + 1;
    setCounts((current) => ({ ...current, [step.id]: next }));
    setTotalToday((value) => {
      const nextTotal = value + 1;
      goalProgressBridge.record({
        metric: "dhikr_count",
        absolute: nextTotal,
      });
      return nextTotal;
    });
    if (next === step.target) {
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      ).catch(() => undefined);
    } else {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
    }
  }, [complete, count, step.id, step.target]);

  const undo = useCallback(() => {
    if (count <= 0) return;
    setCounts((current) => ({ ...current, [step.id]: count - 1 }));
    setTotalToday((value) => Math.max(0, value - 1));
    void Haptics.selectionAsync().catch(() => undefined);
  }, [count, step.id]);

  const reset = useCallback(() => {
    setTotalToday((value) => Math.max(0, value - count));
    setCounts((current) => ({ ...current, [step.id]: 0 }));
    void Haptics.notificationAsync(
      Haptics.NotificationFeedbackType.Warning,
    ).catch(() => undefined);
  }, [count, step.id]);

  const goToStep = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= preset.steps.length) return;
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
      Array.from({ length: BEAD_COUNT }, (_, index) => {
        const angle = (index / BEAD_COUNT) * Math.PI * 2 - Math.PI / 2;
        return {
          index,
          left:
            ROSARY_SIZE / 2 + Math.cos(angle) * ROSARY_RADIUS - BEAD_SIZE / 2,
          top:
            ROSARY_SIZE / 2 + Math.sin(angle) * ROSARY_RADIUS - BEAD_SIZE / 2,
        };
      }),
    [],
  );

  const isPlaying =
    learningAudio.activeKey === step.id && learningAudio.isPlaying;
  const isAudioLoading = learningAudio.pendingKey === step.id;
  const overallProgress = sessionTarget > 0 ? sessionTotal / sessionTarget : 0;

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/" as Href)
          }
          style={styles.circleButton}
        >
          <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
        </Pressable>
        <View style={styles.titleCopy}>
          <Text style={styles.title}>Dhikr</Text>
          <Text style={styles.subtitle}>Votre chapelet numérique</Text>
        </View>
        <View style={styles.todayPill}>
          <Text style={styles.todayValue}>{totalToday}</Text>
          <Text style={styles.todayLabel}>AUJ.</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            source={require("../assets/images/home/shortcuts/dhikr-real.jpg")}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={["rgba(7,5,14,0.12)", "rgba(16,8,25,0.72)", "#090711"]}
            locations={[0, 0.58, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroGlass}>
            <View style={styles.heroIcon}>
              <Ionicons
                name="ellipse-outline"
                size={19}
                color={colors.goldLight}
              />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>
                TASBIH · PRÉSENCE · RÉGULARITÉ
              </Text>
              <Text style={styles.heroTitle}>Comptez sans perdre le sens</Text>
              <Text style={styles.heroText}>
                Touchez le chapelet à chaque répétition. Votre progression est
                enregistrée automatiquement.
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.formulaTabs}>
          {preset.steps.map((item, itemIndex) => {
            const active = itemIndex === safeStepIndex;
            return (
              <Pressable
                key={item.id}
                onPress={() => goToStep(itemIndex)}
                style={[styles.formulaTab, active && styles.formulaTabActive]}
              >
                <View style={styles.formulaTabSheen} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.formulaTabText,
                    active && styles.formulaTabTextActive,
                  ]}
                >
                  {item.phonetic}
                </Text>
                <Text style={styles.formulaTabCount}>
                  {counts[item.id] ?? 0}/{item.target}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sessionCard}>
          <View style={styles.sessionTopRow}>
            <View>
              <Text style={styles.sessionEyebrow}>
                {preset.title.toUpperCase()}
              </Text>
              <Text style={styles.sessionStep}>
                Étape {safeStepIndex + 1} sur {preset.steps.length}
              </Text>
            </View>
            <Pressable
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
              <Text style={styles.sourceText}>{preset.source}</Text>
            </Pressable>
          </View>

          <View style={styles.overallTrack}>
            <LinearGradient
              colors={[colors.goldDark, colors.goldLight]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.overallFill,
                { width: `${overallProgress * 100}%` },
              ]}
            />
          </View>

          <Text selectable style={styles.arabic}>
            {step.arabic}
          </Text>
          <Text selectable style={styles.phonetic}>
            {step.phonetic}
          </Text>
          <Text selectable style={styles.french}>
            {step.french}
          </Text>

          <View style={styles.formulaActions}>
            <View style={styles.targetPill}>
              <Ionicons name="repeat" size={14} color={colors.goldLight} />
              <Text style={styles.targetText}>Objectif {step.target}</Text>
            </View>
            {step.audioSource ? (
              <Pressable
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
                    ? "Chargement"
                    : isPlaying
                      ? "Pause"
                      : "Écouter"}
                </Text>
              </Pressable>
            ) : null}
          </View>
          {learningAudio.error ? (
            <Text style={styles.audioError}>{learningAudio.error}</Text>
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
              accessibilityLabel={`Compteur de dhikr, ${count} sur ${step.target}`}
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
                    : ["rgba(79,38,98,0.98)", "rgba(26,15,39,0.99)"]
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
                sur {step.target}
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
                  {complete ? "TERMINÉ" : "TOUCHER"}
                </Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.counterTools}>
            <Pressable
              onPress={undo}
              disabled={count === 0}
              style={styles.toolButton}
            >
              <Ionicons
                name="arrow-undo"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.toolText}>Annuler</Text>
            </Pressable>
            <View style={styles.cyclePill}>
              <Text style={styles.cycleValue}>
                {Math.floor(count / BEAD_COUNT)}
              </Text>
              <Text style={styles.cycleLabel}>TOURS COMPLETS</Text>
            </View>
            <Pressable
              onPress={reset}
              disabled={count === 0}
              style={styles.toolButton}
            >
              <Ionicons name="refresh" size={18} color={colors.textSecondary} />
              <Text style={styles.toolText}>Remettre</Text>
            </Pressable>
          </View>
        </View>

        {preset.steps.length > 1 ? (
          <View style={styles.stepNavigation}>
            <Pressable
              disabled={safeStepIndex === 0}
              onPress={() => goToStep(safeStepIndex - 1)}
              style={[
                styles.stepButton,
                safeStepIndex === 0 && styles.disabled,
              ]}
            >
              <Ionicons name="arrow-back" size={17} color={colors.goldLight} />
              <Text style={styles.stepButtonText}>Précédent</Text>
            </Pressable>
            <Pressable
              disabled={safeStepIndex >= preset.steps.length - 1}
              onPress={() => goToStep(safeStepIndex + 1)}
              style={[
                styles.stepButton,
                styles.stepButtonPrimary,
                safeStepIndex >= preset.steps.length - 1 && styles.disabled,
              ]}
            >
              <Text style={styles.stepButtonPrimaryText}>Dhikr suivant</Text>
              <Ionicons
                name="arrow-forward"
                size={17}
                color={colors.background}
              />
            </Pressable>
          </View>
        ) : null}
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
    backgroundColor: colors.purpleDeep,
  },
  titleCopy: { flex: 1, marginHorizontal: 12 },
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
  todayPill: {
    minWidth: 48,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  todayValue: {
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 16,
  },
  todayLabel: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 6.5,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  content: { paddingHorizontal: 14, paddingBottom: 120 },
  hero: {
    height: 222,
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
    backgroundColor: colors.surface,
  },
  heroGlass: {
    position: "absolute",
    right: 11,
    bottom: 11,
    left: 11,
    minHeight: 91,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,247,230,0.25)",
    backgroundColor: "rgba(10,7,18,0.76)",
  },
  heroIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.42)",
    backgroundColor: "rgba(73,35,89,0.58)",
  },
  heroCopy: { flex: 1, marginLeft: 12 },
  heroEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 7.5,
    fontWeight: "800",
    letterSpacing: 0.9,
  },
  heroTitle: {
    marginTop: 3,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 19,
  },
  heroText: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 8.8,
    lineHeight: 12.5,
  },
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
    borderColor: "rgba(255,242,220,0.17)",
    backgroundColor: "rgba(42,23,56,0.72)",
  },
  formulaTabActive: {
    borderColor: "rgba(240,204,124,0.60)",
    backgroundColor: "rgba(92,49,109,0.84)",
    shadowColor: "#A467B8",
    shadowOpacity: 0.28,
    shadowRadius: 9,
  },
  formulaTabSheen: {
    position: "absolute",
    top: 0,
    right: 10,
    left: 10,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
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
    borderColor: "rgba(227,181,90,0.29)",
    backgroundColor: "rgba(32,18,46,0.95)",
  },
  sessionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sessionEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  sessionStep: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8.5,
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
  overallTrack: {
    height: 3,
    marginTop: 13,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  overallFill: { height: "100%", borderRadius: 2 },
  arabic: {
    marginTop: 21,
    color: "#FFF9F0",
    fontFamily: ARABIC_READING_FONT_FAMILY,
    fontSize: 30,
    lineHeight: 48,
    textAlign: "center",
    writingDirection: "rtl",
  },
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
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  targetPill: {
    height: 34,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 17,
    backgroundColor: "rgba(132,76,153,0.22)",
  },
  targetText: {
    marginLeft: 6,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "700",
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
    backgroundColor: "rgba(17,11,27,0.94)",
  },
  rosary: { width: ROSARY_SIZE, height: ROSARY_SIZE },
  bead: {
    position: "absolute",
    width: BEAD_SIZE,
    height: BEAD_SIZE,
    borderRadius: BEAD_SIZE / 2,
    borderWidth: 1,
    borderColor: "rgba(224,185,103,0.24)",
    backgroundColor: "rgba(71,42,83,0.83)",
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
    top: (ROSARY_SIZE - 172) / 2,
    left: (ROSARY_SIZE - 172) / 2,
    width: 172,
    height: 172,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 86,
    borderWidth: 1,
    borderColor: "rgba(239,200,111,0.50)",
    shadowColor: "#B47AD0",
    shadowOpacity: 0.28,
    shadowRadius: 22,
  },
  counterComplete: { borderColor: "#FFE3A0" },
  counterPressed: { transform: [{ scale: 0.965 }] },
  counterValue: {
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
  cyclePill: {
    minWidth: 108,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(64,35,78,0.54)",
  },
  cycleValue: {
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 16,
  },
  cycleLabel: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 6.5,
    fontWeight: "800",
    letterSpacing: 0.6,
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
