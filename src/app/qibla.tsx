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
  setQiblaTutorialSeen,
} from "../features/qibla/qiblaPreferences";
import {
  type QiblaSensorQuality,
  useQiblaCompass,
} from "../features/qibla/useQiblaCompass";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const ALIGNMENT_TOLERANCE = 3;
const NEAR_ALIGNMENT_TOLERANCE = 12;
const BACKGROUND_IMAGE = require("../assets/images/home/shortcuts/qibla-real.jpg");

function unwrapTarget(previous: number, nextNormalized: number) {
  return previous + shortestAngle(nextNormalized - normalizeDegrees(previous));
}

function formatDistance(distanceKm: number | null) {
  if (distanceKm === null) return "—";
  return `${Math.round(distanceKm).toLocaleString("fr-FR")} km`;
}

function qualityCopy(quality: QiblaSensorQuality) {
  if (quality === "excellent") return "Précision optimale";
  if (quality === "medium") return "Précision correcte";
  return "Calibrage conseillé";
}

function GlassCard({ children, style }: { children: ReactNode; style?: object }) {
  return (
    <View style={[styles.glassCard, style]}>
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.12)", "rgba(89,45,119,0.12)", "rgba(10,6,19,0.82)"]}
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
      duration: 240,
      easing: Easing.out(Easing.quad),
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
      duration: isNear ? 300 : 220,
      easing: Easing.out(Easing.cubic),
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
        <View style={[styles.compassFace, { width: size - 9, height: size - 9, borderRadius: (size - 9) / 2 }]}>
          <LinearGradient
            colors={["rgba(57,31,78,0.97)", "rgba(9,6,17,0.99)", "rgba(22,11,34,0.99)"]}
            style={StyleSheet.absoluteFill}
          />

          <Animated.View style={[styles.rotatingDial, { transform: [{ rotate: dialRotate }] }]}>
            {Array.from({ length: 36 }).map((_, index) => (
              <View
                key={index}
                style={[styles.tickWrap, { transform: [{ rotate: `${index * 10}deg` }] }]}
              >
                <View style={[styles.tick, index % 3 === 0 && styles.tickMajor]} />
              </View>
            ))}
            <Text style={[styles.cardinal, styles.north]}>N</Text>
            <Text style={[styles.cardinal, styles.east]}>E</Text>
            <Text style={[styles.cardinal, styles.south]}>S</Text>
            <Text style={[styles.cardinal, styles.west]}>O</Text>
          </Animated.View>

          <Animated.View style={[styles.needleLayer, { transform: [{ rotate: needleRotate }] }]}>
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

          <Animated.View style={[styles.centerMedallion, { transform: [{ scale: kaabaScale }] }]}>
            <LinearGradient colors={["#F7DC91", "#A76D1D", "#E7B954"]} style={styles.centerGold}>
              <View style={styles.centerInner}>
                <View style={styles.kaaba}>
                  <View style={styles.kaabaBand} />
                  <View style={styles.kaabaDoor} />
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          <View style={styles.phoneMarker} />
        </View>
      </LinearGradient>
    </View>
  );
}

export default function QiblaScreen() {
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
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const hasVibratedRef = useRef(false);

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
      if (!preferences.tutorialSeen) setTutorialVisible(true);
    });
  }, []);

  useEffect(() => {
    if (isAligned && !hasVibratedRef.current) {
      hasVibratedRef.current = true;
      if (hapticsEnabled) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
    }
    if (!isNear) hasVibratedRef.current = false;
  }, [hapticsEnabled, isAligned, isNear]);

  const closeTutorial = async () => {
    setTutorialVisible(false);
    await setQiblaTutorialSeen(true);
  };

  const toggleHaptics = async (value: boolean) => {
    setHapticsEnabled(value);
    await setQiblaHapticsEnabled(value);
  };

  const instruction = loading || !hasDirection
    ? { icon: "compass-outline" as const, eyebrow: "UN INSTANT", title: "Recherche de la Qibla", subtitle: "Gardez votre téléphone à plat" }
    : isAligned
      ? { icon: "checkmark" as const, eyebrow: "QIBLA TROUVÉE", title: "Vous êtes bien orienté", subtitle: "La flèche dorée pointe vers La Mecque" }
      : relativeAngle > 0
        ? { icon: "arrow-redo" as const, eyebrow: isNear ? "PRESQUE" : "ORIENTATION", title: isNear ? "Un peu à droite" : "Tournez à droite", subtitle: `${Math.max(1, Math.round(absoluteDifference))}° avant l’alignement` }
        : { icon: "arrow-undo" as const, eyebrow: isNear ? "PRESQUE" : "ORIENTATION", title: isNear ? "Un peu à gauche" : "Tournez à gauche", subtitle: `${Math.max(1, Math.round(absoluteDifference))}° avant l’alignement` };

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
        <View style={styles.backgroundOrbTop} />
        <View style={styles.backgroundOrbBottom} />
      </ImageBackground>

      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={23} color={colors.goldLight} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Qibla</Text>
              <View style={styles.locationLine}>
                <Ionicons name="location" size={11} color={colors.goldLight} />
                <Text numberOfLines={1} style={styles.locationText}>{location?.city ?? "Localisation en cours"}</Text>
              </View>
            </View>
            <Pressable onPress={() => setHelpVisible(true)} style={styles.headerButton}>
              <Ionicons name="help-circle-outline" size={22} color={colors.goldLight} />
            </Pressable>
          </View>

          {permissionDenied || error ? (
            <GlassCard style={styles.errorCard}>
              <View style={styles.errorIcon}>
                <Ionicons name={permissionDenied ? "location-outline" : "compass-outline"} size={34} color={colors.goldLight} />
              </View>
              <Text style={styles.errorTitle}>{permissionDenied ? "Localisation nécessaire" : "Boussole indisponible"}</Text>
              <Text style={styles.errorText}>{permissionDenied ? "Autorisez la localisation pour calculer précisément la direction de La Mecque." : error}</Text>
              <Pressable onPress={restart} style={styles.primaryButton}>
                <LinearGradient colors={["#F4CF77", "#C98C2F"]} style={StyleSheet.absoluteFill} />
                <Text style={styles.primaryButtonText}>Réessayer</Text>
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
                  <Text style={styles.detailsToggleText}>Détails et réglages</Text>
                </View>
                <Ionicons name={detailsVisible ? "chevron-up" : "chevron-down"} size={18} color={colors.textSecondary} />
              </Pressable>

              {detailsVisible ? (
                <GlassCard style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <View><Text style={styles.detailLabel}>Direction</Text><Text style={styles.detailValue}>{qiblaBearing === null ? "—" : `${Math.round(qiblaBearing)}°`}</Text></View>
                    <View style={styles.detailDivider} />
                    <View><Text style={styles.detailLabel}>La Mecque</Text><Text style={styles.detailValue}>{formatDistance(distanceKm)}</Text></View>
                    <View style={styles.detailDivider} />
                    <View><Text style={styles.detailLabel}>Capteur</Text><Text style={styles.detailValueSmall}>{qualityCopy(sensorQuality)}</Text></View>
                  </View>
                  <View style={styles.settingSeparator} />
                  <View style={styles.settingRow}>
                    <View style={styles.settingCopy}>
                      <Ionicons name="phone-portrait-outline" size={19} color={colors.goldLight} />
                      <View><Text style={styles.settingTitle}>Vibration à l’alignement</Text><Text style={styles.settingSubtitle}>Confirme lorsque la Qibla est trouvée</Text></View>
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
                    <Text style={styles.calibrateText}>Calibrer la boussole</Text>
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
              <View><Text style={styles.modalEyebrow}>PRÉCISION</Text><Text style={styles.modalTitle}>Calibrer la boussole</Text></View>
              <Pressable onPress={() => setHelpVisible(false)} style={styles.modalClose}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
            </View>
            <View style={styles.figureEight}><Text style={styles.figureEightText}>∞</Text></View>
            <Text style={styles.modalBody}>Dessinez doucement un huit avec votre téléphone pendant quelques secondes, puis tenez-le à plat.</Text>
            <View style={styles.helpRow}><Ionicons name="remove-circle-outline" size={18} color={colors.goldLight} /><Text style={styles.helpText}>Retirez les coques ou accessoires aimantés.</Text></View>
            <View style={styles.helpRow}><Ionicons name="hardware-chip-outline" size={18} color={colors.goldLight} /><Text style={styles.helpText}>Éloignez-vous des véhicules et objets métalliques.</Text></View>
            <Pressable onPress={() => { setHelpVisible(false); restart(); }} style={styles.primaryButton}>
              <LinearGradient colors={["#F4CF77", "#C98C2F"]} style={StyleSheet.absoluteFill} />
              <Text style={styles.primaryButtonText}>Recalibrer maintenant</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>

      <Modal visible={tutorialVisible} transparent animationType="fade" onRequestClose={closeTutorial}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <View style={styles.tutorialIcon}><Ionicons name="compass-outline" size={38} color={colors.goldLight} /></View>
            <Text style={styles.tutorialTitle}>Trouvez la Qibla simplement</Text>
            <Text style={styles.tutorialText}>Posez le téléphone à plat et suivez l’indication. Lorsque vous êtes bien orienté, l’écran devient doré et le téléphone vibre.</Text>
            <Pressable onPress={closeTutorial} style={styles.primaryButton}>
              <LinearGradient colors={["#F4CF77", "#C98C2F"]} style={StyleSheet.absoluteFill} />
              <Text style={styles.primaryButtonText}>Commencer</Text>
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
  backgroundOrbTop: { position: "absolute", top: -110, right: -90, width: 270, height: 270, borderRadius: 135, backgroundColor: "rgba(102,44,137,0.26)" },
  backgroundOrbBottom: { position: "absolute", bottom: 30, left: -140, width: 320, height: 320, borderRadius: 160, backgroundColor: "rgba(201,144,48,0.09)" },
  content: { paddingHorizontal: 17, paddingBottom: 36 },
  header: { height: 70, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerButton: { width: 43, height: 43, borderRadius: 22, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(227,181,90,0.25)", backgroundColor: "rgba(18,11,30,0.62)" },
  headerCopy: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  title: { color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 34, lineHeight: 36 },
  locationLine: { maxWidth: 190, flexDirection: "row", alignItems: "center", marginTop: 1 },
  locationText: { marginLeft: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 10 },
  instructionCard: { minHeight: 86, marginTop: 3, marginBottom: 14, paddingHorizontal: 16, borderRadius: 24, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(227,181,90,0.22)", backgroundColor: "rgba(16,9,28,0.76)" },
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
  rotatingDial: { ...StyleSheet.absoluteFillObject },
  tickWrap: { position: "absolute", top: 9, right: 9, bottom: 9, left: 9, alignItems: "center" },
  tick: { width: 1, height: 6, borderRadius: 1, backgroundColor: "rgba(235,202,130,0.38)" },
  tickMajor: { width: 2, height: 14, backgroundColor: "#E8C168" },
  cardinal: { position: "absolute", color: "#F2D792", fontFamily: typography.serifSemibold, fontSize: 25, textShadowColor: "rgba(229,173,62,0.34)", textShadowRadius: 8 },
  north: { top: "10%", alignSelf: "center" },
  east: { right: "11%", top: "45%" },
  south: { bottom: "9%", alignSelf: "center" },
  west: { left: "10%", top: "45%" },
  needleLayer: { ...StyleSheet.absoluteFillObject, alignItems: "center" },
  qiblaTip: { position: "absolute", top: "7%", width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(244,210,125,0.72)", backgroundColor: "#17101F", shadowColor: "#E6B94F", shadowOpacity: 0.55, shadowRadius: 10, elevation: 7 },
  qiblaTipAligned: { borderColor: "#FFF3AE", backgroundColor: "#5C4217", shadowOpacity: 0.95, shadowRadius: 16 },
  miniKaaba: { width: 22, height: 19, borderWidth: 1, borderColor: "#EBC45D", backgroundColor: "#07060A" },
  miniKaabaBand: { position: "absolute", top: 5, right: 0, left: 0, height: 3, backgroundColor: "#B88729" },
  qiblaPointer: { position: "absolute", top: "21%", width: 8, height: "31%", borderRadius: 6, shadowColor: "#F6C24B", shadowOpacity: 0.7, shadowRadius: 9, elevation: 6 },
  pointerTail: { position: "absolute", top: "52%", width: 3, height: "13%", borderRadius: 3, backgroundColor: "rgba(230,218,194,0.32)" },
  centerMedallion: { width: 82, height: 82, borderRadius: 41, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(5,3,11,0.88)", shadowColor: "#000", shadowOpacity: 0.85, shadowRadius: 14, elevation: 11 },
  centerGold: { width: 74, height: 74, borderRadius: 37, alignItems: "center", justifyContent: "center" },
  centerInner: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,240,189,0.4)", backgroundColor: "#120C1B" },
  kaaba: { width: 34, height: 29, borderWidth: 1.5, borderColor: "#E7B752", backgroundColor: "#050408", shadowColor: "#F2C45D", shadowOpacity: 0.5, shadowRadius: 8 },
  kaabaBand: { position: "absolute", top: 9, right: 0, left: 0, height: 5, borderTopWidth: 1, borderBottomWidth: 1, borderColor: "#E7B752", backgroundColor: "rgba(199,146,49,0.35)" },
  kaabaDoor: { position: "absolute", right: 8, bottom: 0, width: 8, height: 15, borderWidth: 1, borderBottomWidth: 0, borderColor: "#D9A742" },
  phoneMarker: { position: "absolute", top: 2, width: 0, height: 0, borderLeftWidth: 9, borderRightWidth: 9, borderBottomWidth: 15, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: "#FFF0A3", transform: [{ rotate: "180deg" }] },
  detailsToggle: { height: 48, marginTop: 0, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  detailsToggleLeft: { flexDirection: "row", alignItems: "center" },
  detailsToggleText: { marginLeft: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12, fontWeight: "700" },
  glassCard: { overflow: "hidden", borderWidth: 1, borderColor: "rgba(223,190,129,0.19)", backgroundColor: "rgba(16,9,28,0.78)", shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 7 },
  detailsCard: { borderRadius: 24, padding: 16 },
  detailRow: { flexDirection: "row", alignItems: "stretch" },
  detailDivider: { width: 1, marginHorizontal: 12, backgroundColor: "rgba(255,255,255,0.12)" },
  detailLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9 },
  detailValue: { marginTop: 4, color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 18 },
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
  tutorialIcon: { width: 76, height: 76, alignSelf: "center", marginBottom: 15, borderRadius: 38, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(227,181,90,0.35)", backgroundColor: "rgba(14,8,25,0.82)" },
  tutorialTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 27, textAlign: "center" },
  tutorialText: { marginTop: 10, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 19, textAlign: "center" },
});
