import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  Vibration,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  calculateDistanceToKaabaKm,
  calculateQiblaBearing,
  normalizeDegrees,
  shortestAngle,
} from "../features/qibla/qiblaMath";
import {
  readQiblaPreferences,
  setQiblaHapticsEnabled,
} from "../features/qibla/qiblaPreferences";
import {
  type QiblaSensorQuality,
  useQiblaCompass,
} from "../features/qibla/useQiblaCompass";
import { useI18n, type LanguageCode, type TranslationKey } from "../i18n";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const ALIGNMENT_TOLERANCE = 3;
const NEAR_ALIGNMENT_TOLERANCE = 12;
const ALIGNMENT_HAPTIC_COOLDOWN_MS = 1_500;
const BACKGROUND_IMAGE = require("../assets/images/home/shortcuts/qibla-real.jpg");

async function triggerAlignmentHaptic() {
  if (Platform.OS === "android") {
    Vibration.vibrate([0, 140, 80, 220]);
    return;
  }

  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

function unwrapTarget(previous: number, nextNormalized: number) {
  return previous + shortestAngle(nextNormalized - normalizeDegrees(previous));
}

function formatDistance(distanceKm: number | null, language: LanguageCode) {
  if (distanceKm === null) return "—";
  return `${Math.round(distanceKm).toLocaleString(language === "fr" ? "fr-FR" : "en-GB")} km`;
}

function qualityKey(quality: QiblaSensorQuality): TranslationKey {
  if (quality === "excellent") return "qibla.qualityExcellent";
  if (quality === "medium") return "qibla.qualityMedium";
  return "qibla.qualityLow";
}

function GlassCard({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <View style={[styles.glassCard, style]}>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.08)", "rgba(227,181,90,0.04)", "rgba(10,8,18,0.86)"]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

function PremiumCompass({
  size,
  heading,
  qiblaBearing,
  isAligned,
  isNear,
}: {
  size: number;
  heading: number | null;
  qiblaBearing: number | null;
  isAligned: boolean;
  isNear: boolean;
}) {
  const { t } = useI18n();
  const faceSize = size - 9;
  const dialRotation = useRef(new Animated.Value(0)).current;
  const needleRotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const kaabaScale = useRef(new Animated.Value(1)).current;
  const previousDialRef = useRef(0);
  const previousNeedleRef = useRef(0);

  useEffect(() => {
    if (heading === null) return;
    const target = unwrapTarget(previousDialRef.current, normalizeDegrees(-heading));
    previousDialRef.current = target;
    dialRotation.stopAnimation();
    Animated.timing(dialRotation, {
      toValue: target,
      duration: 140,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [dialRotation, heading]);

  useEffect(() => {
    if (heading === null || qiblaBearing === null) return;
    const target = unwrapTarget(
      previousNeedleRef.current,
      normalizeDegrees(qiblaBearing - heading),
    );
    previousNeedleRef.current = target;
    needleRotation.stopAnimation();
    Animated.timing(needleRotation, {
      toValue: target,
      duration: isNear ? 170 : 140,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [heading, isNear, needleRotation, qiblaBearing]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: isAligned ? 780 : 1250,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: isAligned ? 780 : 1250,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isAligned, pulse]);

  useEffect(() => {
    Animated.spring(kaabaScale, {
      toValue: isAligned ? 1.12 : isNear ? 1.06 : 1,
      damping: 12,
      stiffness: 135,
      useNativeDriver: true,
    }).start();
  }, [isAligned, isNear, kaabaScale]);

  const dialRotate = dialRotation.interpolate({
    inputRange: [-1440, 1440],
    outputRange: ["-1440deg", "1440deg"],
  });
  const needleRotate = needleRotation.interpolate({
    inputRange: [-1440, 1440],
    outputRange: ["-1440deg", "1440deg"],
  });

  return (
    <View style={[styles.compassStage, { width: size, height: size }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.outerGlow,
          {
            width: size + 30,
            height: size + 30,
            borderRadius: (size + 30) / 2,
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: isAligned ? [0.38, 0.9] : isNear ? [0.16, 0.46] : [0.06, 0.14],
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.985, isAligned ? 1.045 : 1.018],
                }),
              },
            ],
          },
        ]}
      />

      <LinearGradient
        colors={
          isAligned
            ? ["#FFF4B5", "#EAB74A", "#8C5B15", "#F6D87B"]
            : isNear
              ? ["#F8D987", "#C99335", "#553517", "#DDB65D"]
              : ["#DAB963", "#805B28", "#2E1C14", "#B78B3E"]
        }
        style={[styles.compassRim, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <View style={[styles.compassFace, { width: faceSize, height: faceSize, borderRadius: faceSize / 2 }]}> 
          <LinearGradient
            colors={["rgba(30,23,48,0.97)", "rgba(10,8,18,0.99)", "rgba(21,16,34,0.99)"]}
            style={StyleSheet.absoluteFill}
          />

          <Animated.View style={[styles.rotatingDial, { width: faceSize, height: faceSize, transform: [{ rotate: dialRotate }] }]}> 
            {Array.from({ length: 36 }).map((_, index) => (
              <View
                key={index}
                style={[styles.tickWrap, { transform: [{ rotate: `${index * 10}deg` }] }]}
              >
                <View style={[styles.tick, index % 3 === 0 && styles.tickMajor]} />
              </View>
            ))}
            <Text style={[styles.cardinal, styles.north]}>{t("qibla.north")}</Text>
            <Text style={[styles.cardinal, styles.east]}>{t("qibla.east")}</Text>
            <Text style={[styles.cardinal, styles.south]}>{t("qibla.south")}</Text>
            <Text style={[styles.cardinal, styles.west]}>{t("qibla.west")}</Text>
          </Animated.View>

          <Animated.View style={[styles.needleLayer, { width: faceSize, height: faceSize, transform: [{ rotate: needleRotate }] }]}> 
            <View style={[styles.qiblaTip, isAligned && styles.qiblaTipAligned]}>
              <View style={styles.miniKaaba}>
                <View style={styles.miniKaabaBand} />
              </View>
            </View>
            <LinearGradient
              colors={isAligned ? ["#FFF9D8", "#F3C653", "#A66A19"] : ["#F6DE94", "#D9A43D", "#85511B"]}
              style={styles.qiblaPointer}
            />
            <View style={styles.pointerTail} />
          </Animated.View>

          <Animated.View style={[styles.centerPivot, { transform: [{ scale: kaabaScale }] }]}>
            <LinearGradient colors={["#F7DC91", "#A76D1D", "#E7B954"]} style={styles.centerPivotGold} />
          </Animated.View>

          <View style={styles.phoneMarker} />
        </View>
      </LinearGradient>
    </View>
  );
}

export default function QiblaScreen() {
  const { language, t } = useI18n();
  const { width } = useWindowDimensions();
  const {
    location,
    heading,
    sensorQuality,
    loading,
    permissionDenied,
    error,
    restart,
  } = useQiblaCompass();

  const [helpVisible, setHelpVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const hasVibratedRef = useRef(false);
  const lastVibrationAtRef = useRef(0);

  const compassSize = Math.min(width - 34, 370);
  const qiblaBearing = useMemo(
    () => (location ? calculateQiblaBearing(location.latitude, location.longitude) : null),
    [location],
  );
  const distanceKm = useMemo(
    () => (location ? calculateDistanceToKaabaKm(location.latitude, location.longitude) : null),
    [location],
  );
  const relativeAngle = qiblaBearing !== null && heading !== null ? shortestAngle(qiblaBearing - heading) : 0;
  const absoluteDifference = Math.abs(relativeAngle);
  const hasDirection = qiblaBearing !== null && heading !== null;
  const isAligned = hasDirection && absoluteDifference <= ALIGNMENT_TOLERANCE;
  const isNear = hasDirection && absoluteDifference <= NEAR_ALIGNMENT_TOLERANCE;

  useEffect(() => {
    void readQiblaPreferences().then((preferences) => {
      setHapticsEnabled(preferences.hapticsEnabled);
    });
  }, []);

  useEffect(() => {
    if (!isAligned) {
      hasVibratedRef.current = false;
      return;
    }

    const now = Date.now();
    if (
      hapticsEnabled &&
      !hasVibratedRef.current &&
      now - lastVibrationAtRef.current >= ALIGNMENT_HAPTIC_COOLDOWN_MS
    ) {
      hasVibratedRef.current = true;
      lastVibrationAtRef.current = now;
      void triggerAlignmentHaptic().catch(() => undefined);
    }
  }, [hapticsEnabled, isAligned]);

  const toggleHaptics = async (value: boolean) => {
    setHapticsEnabled(value);
    hasVibratedRef.current = false;
    await setQiblaHapticsEnabled(value);
  };

  const instruction = loading || !hasDirection
    ? { icon: "compass-outline" as const, eyebrow: t("qibla.waitEyebrow"), title: t("qibla.searchingTitle"), subtitle: t("qibla.keepFlat") }
    : isAligned
      ? { icon: "checkmark" as const, eyebrow: t("qibla.foundEyebrow"), title: t("qibla.alignedTitle"), subtitle: t("qibla.alignedSubtitle") }
      : {
          icon: relativeAngle > 0 ? ("arrow-redo" as const) : ("arrow-undo" as const),
          eyebrow: isNear ? t("qibla.nearEyebrow") : t("qibla.orientationEyebrow"),
          title: relativeAngle > 0
            ? (isNear ? t("qibla.slightlyRight") : t("qibla.turnRight"))
            : (isNear ? t("qibla.slightlyLeft") : t("qibla.turnLeft")),
          subtitle: t("qibla.degreesLeft", { degrees: Math.max(1, Math.round(absoluteDifference)) }),
        };

  return (
    <View style={styles.screen}>
      <ImageBackground
        source={BACKGROUND_IMAGE}
        resizeMode="cover"
        blurRadius={Platform.OS === "android" ? 2 : 4}
        style={StyleSheet.absoluteFill}
        imageStyle={styles.backgroundImage}
      >
        <LinearGradient
          colors={["rgba(4,3,10,0.69)", "rgba(13,7,22,0.82)", "rgba(5,3,12,0.97)"]}
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />
      </ImageBackground>

      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable accessibilityLabel={t("common.back")} onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={23} color={colors.goldLight} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>{t("qibla.title")}</Text>
              <View style={styles.locationLine}>
                <Ionicons name="location" size={11} color={colors.goldLight} />
                <Text numberOfLines={1} style={styles.locationText}>{location?.city ?? t("qibla.locating")}</Text>
              </View>
            </View>
            <Pressable accessibilityLabel={t("qibla.calibrateTitle")} onPress={() => setHelpVisible(true)} style={styles.headerButton}>
              <Ionicons name="help-circle-outline" size={22} color={colors.goldLight} />
            </Pressable>
          </View>

          {permissionDenied || error ? (
            <GlassCard style={styles.errorCard}>
              <View style={styles.errorIcon}>
                <Ionicons name={permissionDenied ? "location-outline" : "compass-outline"} size={34} color={colors.goldLight} />
              </View>
              <Text style={styles.errorTitle}>{permissionDenied ? t("qibla.locationNeeded") : t("qibla.compassUnavailable")}</Text>
              <Text style={styles.errorText}>{permissionDenied ? t("qibla.locationNeededText") : error}</Text>
              <Pressable onPress={restart} style={styles.primaryButton}>
                <LinearGradient colors={["#F4CF77", "#C98C2F"]} style={StyleSheet.absoluteFill} />
                <Text style={styles.primaryButtonText}>{t("qibla.retry")}</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <>
              <View style={[styles.instructionCard, isAligned && styles.instructionCardAligned]}>
                <View style={[styles.instructionIcon, isAligned && styles.instructionIconAligned]}>
                  <Ionicons name={instruction.icon} size={22} color={isAligned ? colors.background : colors.goldLight} />
                </View>
                <View style={styles.instructionCopy}>
                  <Text style={[styles.instructionEyebrow, isAligned && styles.instructionEyebrowAligned]}>{instruction.eyebrow}</Text>
                  <Text style={[styles.instructionTitle, isAligned && styles.instructionTitleAligned]}>{instruction.title}</Text>
                  <Text style={styles.instructionSubtitle}>{instruction.subtitle}</Text>
                </View>
              </View>

              <PremiumCompass
                size={compassSize}
                heading={heading}
                qiblaBearing={qiblaBearing}
                isAligned={isAligned}
                isNear={isNear}
              />

              <Pressable onPress={() => setDetailsVisible((value) => !value)} style={styles.detailsToggle}>
                <View style={styles.detailsToggleLeft}>
                  <Ionicons name="options-outline" size={17} color={colors.textSecondary} />
                  <Text style={styles.detailsToggleText}>{t("qibla.details")}</Text>
                </View>
                <Ionicons name={detailsVisible ? "chevron-up" : "chevron-down"} size={18} color={colors.textSecondary} />
              </Pressable>

              {detailsVisible ? (
                <GlassCard style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <View><Text style={styles.detailLabel}>{t("qibla.direction")}</Text><Text style={styles.detailValue}>{qiblaBearing === null ? "—" : `${Math.round(qiblaBearing)}°`}</Text></View>
                    <View style={styles.detailDivider} />
                    <View><Text style={styles.detailLabel}>{t("qibla.mecca")}</Text><Text style={styles.detailValue}>{formatDistance(distanceKm, language)}</Text></View>
                    <View style={styles.detailDivider} />
                    <View><Text style={styles.detailLabel}>{t("qibla.sensor")}</Text><Text style={styles.detailValueSmall}>{t(qualityKey(sensorQuality))}</Text></View>
                  </View>
                  <View style={styles.settingSeparator} />
                  <View style={styles.settingRow}>
                    <View style={styles.settingCopy}>
                      <Ionicons name="phone-portrait-outline" size={19} color={colors.goldLight} />
                      <View><Text style={styles.settingTitle}>{t("qibla.vibration")}</Text><Text style={styles.settingSubtitle}>{t("qibla.vibrationText")}</Text></View>
                    </View>
                    <Switch
                      value={hapticsEnabled}
                      onValueChange={toggleHaptics}
                      trackColor={{ false: "rgba(255,255,255,0.12)", true: "rgba(227,181,90,0.52)" }}
                      thumbColor={hapticsEnabled ? colors.goldLight : "#8D8592"}
                    />
                  </View>
                  <Pressable onPress={() => setHelpVisible(true)} style={styles.calibrateButton}>
                    <Ionicons name="scan-outline" size={18} color={colors.goldLight} />
                    <Text style={styles.calibrateText}>{t("qibla.calibrateTitle")}</Text>
                  </Pressable>
                </GlassCard>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal visible={helpVisible} transparent animationType="fade" onRequestClose={() => setHelpVisible(false)}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View><Text style={styles.modalEyebrow}>{t("qibla.precisionEyebrow")}</Text><Text style={styles.modalTitle}>{t("qibla.calibrateTitle")}</Text></View>
              <Pressable accessibilityLabel={t("hifz.session.close")} onPress={() => setHelpVisible(false)} style={styles.modalClose}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
            </View>
            <View style={styles.figureEight}><Text style={styles.figureEightText}>∞</Text></View>
            <Text style={styles.modalBody}>{t("qibla.calibrateBody")}</Text>
            <View style={styles.helpRow}><Ionicons name="remove-circle-outline" size={18} color={colors.goldLight} /><Text style={styles.helpText}>{t("qibla.helpMagnets")}</Text></View>
            <View style={styles.helpRow}><Ionicons name="hardware-chip-outline" size={18} color={colors.goldLight} /><Text style={styles.helpText}>{t("qibla.helpMetal")}</Text></View>
            <Pressable onPress={() => { setHelpVisible(false); restart(); }} style={styles.primaryButton}>
              <LinearGradient colors={["#F4CF77", "#C98C2F"]} style={StyleSheet.absoluteFill} />
              <Text style={styles.primaryButtonText}>{t("qibla.recalibrate")}</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safeArea: { flex: 1 },
  backgroundImage: { opacity: 0.66 },
  content: { paddingHorizontal: 17, paddingBottom: 36 },
  header: { height: 70, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerButton: { width: 43, height: 43, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(227,181,90,0.25)", backgroundColor: "rgba(21,16,34,0.72)" },
  headerCopy: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  title: { color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 34, lineHeight: 36 },
  locationLine: { maxWidth: 190, flexDirection: "row", alignItems: "center", marginTop: 1 },
  locationText: { marginLeft: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10 },
  instructionCard: { minHeight: 86, marginTop: 3, marginBottom: 14, paddingHorizontal: 16, borderRadius: 24, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(227,181,90,0.22)", backgroundColor: "rgba(21,16,34,0.82)" },
  instructionCardAligned: { borderColor: "rgba(246,210,111,0.72)", backgroundColor: "rgba(83,58,18,0.72)", shadowColor: "#F2C65B", shadowOpacity: 0.35, shadowRadius: 18 },
  instructionIcon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(227,181,90,0.38)", backgroundColor: "rgba(13,8,23,0.82)" },
  instructionIconAligned: { borderColor: colors.goldLight, backgroundColor: colors.goldLight },
  instructionCopy: { flex: 1, marginLeft: 13 },
  instructionEyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  instructionEyebrowAligned: { color: "#FFF2B0" },
  instructionTitle: { marginTop: 2, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 23, lineHeight: 27 },
  instructionTitleAligned: { color: "#FFF3B2" },
  instructionSubtitle: { marginTop: 1, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11 },
  compassStage: { alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 18 },
  outerGlow: { position: "absolute", borderWidth: 2, borderColor: "rgba(246,203,99,0.78)", backgroundColor: "rgba(225,161,52,0.12)", shadowColor: "#F4C85E", shadowOpacity: 0.9, shadowRadius: 27, elevation: 12 },
  compassRim: { padding: 4.5, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.6, shadowRadius: 22, shadowOffset: { width: 0, height: 14 }, elevation: 14 },
  compassFace: { overflow: "hidden", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,247,220,0.28)", backgroundColor: "#0A0712" },
  rotatingDial: { position: "absolute", top: 0, left: 0 },
  tickWrap: { position: "absolute", top: 9, right: 9, bottom: 9, left: 9, alignItems: "center" },
  tick: { width: 1, height: 6, borderRadius: 1, backgroundColor: "rgba(235,202,130,0.38)" },
  tickMajor: { width: 2, height: 14, backgroundColor: "#E8C168" },
  cardinal: { position: "absolute", color: "#F2D792", fontFamily: typography.serifSemibold, fontSize: 25, textShadowColor: "rgba(229,173,62,0.34)", textShadowRadius: 8 },
  north: { top: "10%", left: "50%", width: 40, marginLeft: -20, textAlign: "center" },
  east: { right: "11%", top: "45%" },
  south: { bottom: "9%", left: "50%", width: 40, marginLeft: -20, textAlign: "center" },
  west: { left: "10%", top: "45%" },
  needleLayer: { position: "absolute", top: 0, left: 0, alignItems: "center" },
  qiblaTip: { position: "absolute", top: "7%", left: "50%", width: 48, height: 48, marginLeft: -24, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(244,210,125,0.72)", backgroundColor: "#17101F", shadowColor: "#E6B94F", shadowOpacity: 0.55, shadowRadius: 10, elevation: 7 },
  qiblaTipAligned: { borderColor: "#FFF3AE", backgroundColor: "#5C4217", shadowOpacity: 0.95, shadowRadius: 16 },
  miniKaaba: { width: 22, height: 19, borderWidth: 1, borderColor: "#EBC45D", backgroundColor: "#07060A" },
  miniKaabaBand: { position: "absolute", top: 5, right: 0, left: 0, height: 3, backgroundColor: "#B88729" },
  qiblaPointer: { position: "absolute", top: "21%", left: "50%", width: 8, height: "31%", marginLeft: -4, borderRadius: 6, shadowColor: "#F6C24B", shadowOpacity: 0.7, shadowRadius: 9, elevation: 6 },
  pointerTail: { position: "absolute", top: "52%", left: "50%", width: 3, height: "13%", marginLeft: -1.5, borderRadius: 3, backgroundColor: "rgba(230,218,194,0.32)" },
  phoneMarker: { position: "absolute", top: 2, left: "50%", width: 0, height: 0, marginLeft: -9, borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 15, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "#FFF0A3", transform: [{ rotate: "180deg" }] },
  detailsToggle: { height: 48, marginTop: 0, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailsToggleLeft: { flexDirection: "row", alignItems: "center" },
  detailsToggleText: { marginLeft: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12, fontWeight: "700" },
  glassCard: { overflow: "hidden", borderWidth: 1, borderColor: "rgba(223,190,129,0.19)", backgroundColor: "rgba(21,16,34,0.82)", shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 7 },
  detailsCard: { borderRadius: 24, padding: 16 },
  detailRow: { flexDirection: "row", alignItems: "stretch" },
  detailDivider: { width: 1, marginHorizontal: 12, backgroundColor: "rgba(255,255,255,0.12)" },
  detailLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9 },
  detailValue: { marginTop: 4, color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 18, fontVariant: ["lining-nums", "tabular-nums"] },
  detailValueSmall: { maxWidth: 95, marginTop: 5, color: colors.text, fontFamily: typography.sans, fontSize: 11, fontWeight: "700" },
  settingSeparator: { height: 1, marginVertical: 15, backgroundColor: "rgba(255,255,255,0.1)" },
  settingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  settingCopy: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  settingTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 12, fontWeight: "700" },
  settingSubtitle: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5 },
  calibrateButton: { height: 44, marginTop: 15, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(227,181,90,0.28)", backgroundColor: "rgba(12,7,21,0.48)" },
  calibrateText: { marginLeft: 8, color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: "700" },
  errorCard: { marginTop: 40, borderRadius: 26, padding: 24, alignItems: "center" },
  errorIcon: { width: 68, height: 68, marginBottom: 15, borderRadius: 34, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(227,181,90,0.35)", backgroundColor: "rgba(14,8,25,0.82)" },
  errorTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 24 },
  errorText: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12, lineHeight: 18, textAlign: "center" },
  primaryButton: { width: "100%", height: 52, marginTop: 20, borderRadius: 17, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  primaryButtonText: { color: "#1A1022", fontFamily: typography.sans, fontSize: 13, fontWeight: "800" },
  modalBackdrop: { flex: 1, padding: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(3,2,7,0.78)" },
  modalCard: { width: "100%", maxWidth: 430, borderRadius: 28, padding: 22 },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalEyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9, fontWeight: "800", letterSpacing: 1.5 },
  modalTitle: { marginTop: 2, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 25 },
  modalClose: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.07)" },
  figureEight: { height: 100, marginVertical: 12, alignItems: "center", justifyContent: "center" },
  figureEightText: { color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 100, lineHeight: 104, textShadowColor: "rgba(236,185,76,0.42)", textShadowRadius: 18 },
  modalBody: { marginBottom: 15, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 19, textAlign: "center" },
  helpRow: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  helpText: { flex: 1, marginLeft: 10, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 17 },
  centerPivot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,3,11,0.9)", shadowColor: "#000", shadowOpacity: 0.7, shadowRadius: 8, elevation: 8 },
  centerPivotGold: { width: 16, height: 16, borderRadius: 8 },
});
