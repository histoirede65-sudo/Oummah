import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
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
  bearingToCardinal,
  calculateDistanceToKaabaKm,
  calculateQiblaBearing,
  getTurnInstruction,
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
const NEAR_ALIGNMENT_TOLERANCE = 10;
const BACKGROUND_IMAGE = require("../assets/images/home/shortcuts/qibla-real.jpg");

function formatDistance(distanceKm: number | null) {
  if (distanceKm === null) return "—";
  return `${Math.round(distanceKm).toLocaleString("fr-FR")} km`;
}

function qualityLabel(quality: QiblaSensorQuality) {
  if (quality === "excellent") return "Excellente";
  if (quality === "medium") return "Moyenne";
  return "Faible";
}

function qualityColor(quality: QiblaSensorQuality) {
  if (quality === "excellent") return colors.success;
  if (quality === "medium") return colors.goldLight;
  return colors.danger;
}

function unwrapTarget(previous: number, nextNormalized: number) {
  return previous + shortestAngle(nextNormalized - normalizeDegrees(previous));
}

function GlassCard({
  children,
  style,
}: {
  children: ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.glassCard, style]}>
      <LinearGradient
        pointerEvents="none"
        colors={[
          "rgba(255,255,255,0.135)",
          "rgba(108,61,137,0.13)",
          "rgba(13,8,24,0.66)",
        ]}
        locations={[0, 0.38, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(255,255,255,0.16)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.75, y: 0.8 }}
        style={styles.glassShine}
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
}: {
  size: number;
  heading: number | null;
  qiblaBearing: number | null;
  isAligned: boolean;
}) {
  const dialRotation = useRef(new Animated.Value(0)).current;
  const needleRotation = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const previousDialRef = useRef(0);
  const previousNeedleRef = useRef(0);

  useEffect(() => {
    if (heading === null) return;
    const normalized = normalizeDegrees(-heading);
    const target = unwrapTarget(previousDialRef.current, normalized);
    previousDialRef.current = target;
    Animated.timing(dialRotation, {
      toValue: target,
      duration: 145,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [dialRotation, heading]);

  useEffect(() => {
    if (heading === null || qiblaBearing === null) return;
    const normalized = normalizeDegrees(qiblaBearing - heading);
    const target = unwrapTarget(previousNeedleRef.current, normalized);
    previousNeedleRef.current = target;
    Animated.spring(needleRotation, {
      toValue: target,
      damping: 24,
      stiffness: 150,
      mass: 0.45,
      useNativeDriver: true,
    }).start();
  }, [heading, needleRotation, qiblaBearing]);

  useEffect(() => {
    if (!isAligned) {
      pulse.stopAnimation();
      pulse.setValue(0);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [isAligned, pulse]);

  const dialRotate = dialRotation.interpolate({
    inputRange: [-1440, 1440],
    outputRange: ["-1440deg", "1440deg"],
  });
  const needleRotate = needleRotation.interpolate({
    inputRange: [-1440, 1440],
    outputRange: ["-1440deg", "1440deg"],
  });

  const degreeLabels = Array.from({ length: 12 }, (_, index) => index * 30);
  const labelRadius = size * 0.405;
  const center = size / 2;

  return (
    <View style={[styles.compassStage, { width: size, height: size }]}>
      <Animated.View
        pointerEvents="none"
        style={[
          styles.compassHalo,
          {
            width: size + 24,
            height: size + 24,
            borderRadius: (size + 24) / 2,
            opacity: pulse.interpolate({
              inputRange: [0, 1],
              outputRange: [isAligned ? 0.28 : 0.08, isAligned ? 0.76 : 0.08],
            }),
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.98, 1.035],
                }),
              },
            ],
          },
        ]}
      />

      <LinearGradient
        colors={
          isAligned
            ? ["#FFF0A8", "#E9B84F", "#8E5E18", "#F6D77F"]
            : ["#E9C878", "#8E672C", "#3F2A17", "#C59B4A"]
        }
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[
          styles.compassGoldRim,
          { width: size, height: size, borderRadius: size / 2 },
        ]}
      >
        <View
          style={[
            styles.compassGlassRim,
            {
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
            },
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(55,34,74,0.94)",
              "rgba(9,7,18,0.98)",
              "rgba(23,12,34,0.98)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.compassInnerHighlight} />

          <Animated.View
            style={[
              styles.rotatingDial,
              { transform: [{ rotate: dialRotate }] },
            ]}
          >
            {Array.from({ length: 120 }).map((_, index) => {
              const major = index % 10 === 0;
              const medium = index % 5 === 0;
              return (
                <View
                  key={index}
                  pointerEvents="none"
                  style={[
                    styles.tickWrap,
                    { transform: [{ rotate: `${index * 3}deg` }] },
                  ]}
                >
                  <View
                    style={[
                      styles.tick,
                      medium && styles.tickMedium,
                      major && styles.tickMajor,
                    ]}
                  />
                </View>
              );
            })}

            {degreeLabels.map((degree) => {
              const angle = ((degree - 90) * Math.PI) / 180;
              const left = center + Math.cos(angle) * labelRadius - 15;
              const top = center + Math.sin(angle) * labelRadius - 9;
              return (
                <Text
                  key={degree}
                  style={[
                    styles.degreeLabel,
                    {
                      left,
                      top,
                      transform: [{ rotate: `${degree}deg` }],
                    },
                  ]}
                >
                  {degree}°
                </Text>
              );
            })}

            <Text style={[styles.cardinal, styles.cardinalNorth]}>N</Text>
            <Text style={[styles.cardinal, styles.cardinalEast]}>E</Text>
            <Text style={[styles.cardinal, styles.cardinalSouth]}>S</Text>
            <Text style={[styles.cardinal, styles.cardinalWest]}>O</Text>

            {Array.from({ length: 8 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.roseRayWrap,
                  { transform: [{ rotate: `${index * 45}deg` }] },
                ]}
              >
                <LinearGradient
                  colors={
                    index % 2 === 0
                      ? ["rgba(239,194,95,0.82)", "rgba(239,194,95,0.03)"]
                      : ["rgba(255,255,255,0.42)", "rgba(255,255,255,0.02)"]
                  }
                  style={styles.roseRay}
                />
              </View>
            ))}
          </Animated.View>

          <Animated.View
            pointerEvents="none"
            style={[
              styles.needleLayer,
              { transform: [{ rotate: needleRotate }] },
            ]}
          >
            <LinearGradient
              colors={
                isAligned
                  ? ["#FFF5BD", "#F2BD45", "#A76B17"]
                  : ["#F2D58A", "#D59A32", "#875618"]
              }
              style={styles.needleShaft}
            />
            <View
              style={[
                styles.needleHead,
                isAligned && styles.needleHeadAligned,
              ]}
            />
            <View style={styles.needleTail} />
          </Animated.View>

          <View style={styles.centerMedallionOuter}>
            <LinearGradient
              colors={["#F0D68E", "#A76D1E", "#E8BE61"]}
              style={styles.centerMedallionGold}
            >
              <View style={styles.centerMedallionInner}>
                <View style={styles.kaaba}>
                  <View style={styles.kaabaBand} />
                  <View style={styles.kaabaDoor} />
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.phoneMarker}>
            <View style={styles.phoneMarkerTriangle} />
          </View>
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
    headingAccuracy,
    sensorQuality,
    loading,
    permissionDenied,
    error,
    restart,
  } = useQiblaCompass();

  const [helpVisible, setHelpVisible] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [locked, setLocked] = useState(false);
  const [lockedHeading, setLockedHeading] = useState<number | null>(null);
  const hasVibratedRef = useRef(false);

  const compassSize = Math.min(width - 30, 382);
  const effectiveHeading = locked ? lockedHeading : heading;
  const qiblaBearing = useMemo(
    () =>
      location
        ? calculateQiblaBearing(location.latitude, location.longitude)
        : null,
    [location],
  );
  const distanceKm = useMemo(
    () =>
      location
        ? calculateDistanceToKaabaKm(location.latitude, location.longitude)
        : null,
    [location],
  );
  const relativeAngle =
    qiblaBearing !== null && effectiveHeading !== null
      ? shortestAngle(qiblaBearing - effectiveHeading)
      : 0;
  const absoluteDifference = Math.abs(relativeAngle);
  const isAligned =
    qiblaBearing !== null &&
    effectiveHeading !== null &&
    absoluteDifference <= ALIGNMENT_TOLERANCE;
  const isNear =
    qiblaBearing !== null &&
    effectiveHeading !== null &&
    absoluteDifference <= NEAR_ALIGNMENT_TOLERANCE;

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
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        ).catch(() => undefined);
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

  const toggleLock = () => {
    if (!locked) {
      setLockedHeading(heading);
      setLocked(true);
      return;
    }
    setLocked(false);
    setLockedHeading(null);
  };

  const statusText = loading
    ? "Initialisation des capteurs…"
    : qiblaBearing === null || effectiveHeading === null
      ? "Recherche de la direction…"
      : getTurnInstruction(relativeAngle);

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
          colors={[
            "rgba(4,3,10,0.68)",
            "rgba(14,7,24,0.72)",
            "rgba(5,3,12,0.94)",
          ]}
          locations={[0, 0.46, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.backgroundOrbTop} />
        <View style={styles.backgroundOrbBottom} />
      </ImageBackground>

      <SafeAreaView edges={["top", "left", "right"]} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.headerButton}>
              <Ionicons name="chevron-back" size={23} color={colors.goldLight} />
            </Pressable>
            <View style={styles.headerCopy}>
              <Text style={styles.title}>Qibla</Text>
              <Text style={styles.subtitle}>Direction de La Mecque</Text>
            </View>
            <Pressable
              onPress={() => setHelpVisible(true)}
              style={styles.headerButton}
            >
              <Ionicons
                name="sparkles-outline"
                size={21}
                color={colors.goldLight}
              />
            </Pressable>
          </View>

          {permissionDenied || error ? (
            <GlassCard style={styles.permissionCard}>
              <View style={styles.permissionIcon}>
                <Ionicons
                  name={permissionDenied ? "location-outline" : "compass-outline"}
                  size={31}
                  color={colors.goldLight}
                />
              </View>
              <Text style={styles.permissionTitle}>
                {permissionDenied
                  ? "Localisation nécessaire"
                  : "Boussole indisponible"}
              </Text>
              <Text style={styles.permissionText}>
                {permissionDenied
                  ? "OUMMAH utilise votre position uniquement pour calculer la direction de La Mecque."
                  : error}
              </Text>
              <Pressable onPress={restart} style={styles.primaryButton}>
                <LinearGradient
                  colors={["#F4CF77", "#C98C2F"]}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.primaryButtonText}>Réessayer</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <>
              <View style={styles.locationRow}>
                <View style={styles.locationPill}>
                  <Ionicons name="location" size={13} color={colors.goldLight} />
                  <Text numberOfLines={1} style={styles.locationText}>
                    {location?.city ?? "Localisation en cours"}
                  </Text>
                </View>
                <Pressable
                  onPress={toggleLock}
                  style={[styles.lockPill, locked && styles.lockPillActive]}
                >
                  <Ionicons
                    name={locked ? "lock-closed" : "lock-open-outline"}
                    size={13}
                    color={locked ? colors.background : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.lockText,
                      locked && styles.lockTextActive,
                    ]}
                  >
                    {locked ? "Verrouillée" : "Stabiliser"}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.statusWrap}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: isAligned
                        ? colors.success
                        : colors.goldLight,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusText,
                    isAligned && styles.statusTextAligned,
                  ]}
                >
                  {statusText}
                </Text>
              </View>

              <PremiumCompass
                size={compassSize}
                heading={effectiveHeading}
                qiblaBearing={qiblaBearing}
                isAligned={isAligned}
              />

              <GlassCard style={styles.metricsCard}>
                <View style={styles.metricBlock}>
                  <View style={styles.metricIcon}>
                    <Ionicons
                      name="navigate-outline"
                      size={18}
                      color={colors.goldLight}
                    />
                  </View>
                  <Text style={styles.metricLabel}>Qibla à</Text>
                  <Text style={styles.metricValue}>
                    {qiblaBearing === null ? "—" : `${Math.round(qiblaBearing)}°`}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricBlock}>
                  <View style={styles.metricIcon}>
                    <View style={styles.miniKaaba}>
                      <View style={styles.miniKaabaBand} />
                    </View>
                  </View>
                  <Text style={styles.metricLabel}>La Mecque à</Text>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    style={styles.metricValueDistance}
                  >
                    {formatDistance(distanceKm)}
                  </Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricBlock}>
                  <View
                    style={[
                      styles.metricIcon,
                      isAligned && styles.metricIconAligned,
                    ]}
                  >
                    <Ionicons
                      name={isAligned ? "checkmark" : "sync-outline"}
                      size={20}
                      color={isAligned ? colors.background : colors.goldLight}
                    />
                  </View>
                  <Text style={styles.metricLabel}>Orientation</Text>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.alignmentText,
                      isAligned && styles.alignmentTextSuccess,
                    ]}
                  >
                    {isAligned
                      ? "Bien aligné"
                      : qiblaBearing === null
                        ? "En attente"
                        : bearingToCardinal(qiblaBearing)}
                  </Text>
                </View>
              </GlassCard>

              <GlassCard style={styles.sensorCard}>
                <View style={styles.sensorRow}>
                  <View style={styles.sensorIconWrap}>
                    <Ionicons
                      name="locate-outline"
                      size={21}
                      color={colors.goldLight}
                    />
                  </View>
                  <View style={styles.sensorCopy}>
                    <Text style={styles.sensorLabel}>Précision du capteur</Text>
                    <Text
                      style={[
                        styles.sensorValue,
                        { color: qualityColor(sensorQuality) },
                      ]}
                    >
                      {qualityLabel(sensorQuality)}
                    </Text>
                  </View>
                  <View style={styles.signalBars}>
                    {[0, 1, 2, 3].map((bar) => {
                      const activeBars =
                        sensorQuality === "excellent"
                          ? 4
                          : sensorQuality === "medium"
                            ? 3
                            : 1;
                      return (
                        <View
                          key={bar}
                          style={[
                            styles.signalBar,
                            { height: 7 + bar * 4 },
                            bar < activeBars && {
                              backgroundColor: qualityColor(sensorQuality),
                            },
                          ]}
                        />
                      );
                    })}
                  </View>
                </View>
                <View style={styles.sensorSeparator} />
                <View style={styles.sensorAdviceRow}>
                  <Ionicons
                    name="information-circle-outline"
                    size={16}
                    color={colors.textMuted}
                  />
                  <Text style={styles.sensorAdvice}>
                    {sensorQuality === "low"
                      ? "Éloignez le téléphone des objets métalliques puis calibrez-le."
                      : `Cap actuel : ${heading === null ? "—" : `${Math.round(heading)}°`} • Gardez le téléphone à plat.`}
                  </Text>
                </View>
              </GlassCard>

              <View style={styles.actionRow}>
                <Pressable
                  onPress={() => router.push("/qibla-map")}
                  style={styles.actionButton}
                >
                  <LinearGradient
                    colors={["rgba(42,24,60,0.88)", "rgba(14,9,25,0.93)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons name="map-outline" size={22} color={colors.goldLight} />
                  <Text style={styles.actionButtonText}>Carte</Text>
                </Pressable>
                <Pressable
                  onPress={() => setHelpVisible(true)}
                  style={styles.actionButton}
                >
                  <LinearGradient
                    colors={["rgba(42,24,60,0.88)", "rgba(14,9,25,0.93)"]}
                    style={StyleSheet.absoluteFill}
                  />
                  <Ionicons name="scan-outline" size={22} color={colors.goldLight} />
                  <Text style={styles.actionButtonText}>Calibration</Text>
                </Pressable>
              </View>

              <GlassCard style={styles.preferenceCard}>
                <View style={styles.preferenceCopy}>
                  <Ionicons
                    name="phone-portrait-outline"
                    size={20}
                    color={colors.goldLight}
                  />
                  <View style={styles.preferenceTexts}>
                    <Text style={styles.preferenceTitle}>
                      Vibration à l’alignement
                    </Text>
                    <Text style={styles.preferenceSubtitle}>
                      Une seule vibration lorsque la Qibla est trouvée
                    </Text>
                  </View>
                </View>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={toggleHaptics}
                  trackColor={{
                    false: "rgba(255,255,255,0.12)",
                    true: "rgba(227,181,90,0.52)",
                  }}
                  thumbColor={hapticsEnabled ? colors.goldLight : "#8D8592"}
                />
              </GlassCard>
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <Modal
        visible={helpVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHelpVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalEyebrow}>PRÉCISION</Text>
                <Text style={styles.modalTitle}>Calibrer la boussole</Text>
              </View>
              <Pressable
                onPress={() => setHelpVisible(false)}
                style={styles.modalClose}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <View style={styles.figureEight}>
              <Text style={styles.figureEightText}>∞</Text>
            </View>
            <Text style={styles.modalBody}>
              Déplacez doucement votre téléphone en dessinant un huit dans
              l’air pendant quelques secondes.
            </Text>
            <View style={styles.helpList}>
              <View style={styles.helpRow}>
                <Ionicons
                  name="remove-circle-outline"
                  size={18}
                  color={colors.goldLight}
                />
                <Text style={styles.helpText}>
                  Retirez les accessoires ou coques aimantés.
                </Text>
              </View>
              <View style={styles.helpRow}>
                <Ionicons
                  name="hardware-chip-outline"
                  size={18}
                  color={colors.goldLight}
                />
                <Text style={styles.helpText}>
                  Éloignez-vous des enceintes, véhicules et objets métalliques.
                </Text>
              </View>
              <View style={styles.helpRow}>
                <Ionicons
                  name="phone-portrait-outline"
                  size={18}
                  color={colors.goldLight}
                />
                <Text style={styles.helpText}>
                  Tenez ensuite le téléphone à plat, écran vers le haut.
                </Text>
              </View>
            </View>
            <Pressable
              onPress={() => {
                setHelpVisible(false);
                restart();
              }}
              style={styles.primaryButton}
            >
              <LinearGradient
                colors={["#F4CF77", "#C98C2F"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.primaryButtonText}>Recalibrer maintenant</Text>
            </Pressable>
          </GlassCard>
        </View>
      </Modal>

      <Modal
        visible={tutorialVisible}
        transparent
        animationType="fade"
        onRequestClose={closeTutorial}
      >
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <View style={styles.tutorialIcon}>
              <Ionicons name="compass-outline" size={38} color={colors.goldLight} />
            </View>
            <Text style={styles.tutorialTitle}>Trouvez la Qibla</Text>
            <Text style={styles.tutorialText}>
              Posez votre téléphone à plat puis tournez-vous jusqu’à ce que la
              flèche dorée pointe vers le haut.
            </Text>
            <View style={styles.tutorialSteps}>
              <View style={styles.tutorialStep}>
                <Text style={styles.stepNumber}>1</Text>
                <Text style={styles.stepText}>Autorisez votre localisation</Text>
              </View>
              <View style={styles.tutorialStep}>
                <Text style={styles.stepNumber}>2</Text>
                <Text style={styles.stepText}>Éloignez les objets métalliques</Text>
              </View>
              <View style={styles.tutorialStep}>
                <Text style={styles.stepNumber}>3</Text>
                <Text style={styles.stepText}>Attendez le halo doré</Text>
              </View>
            </View>
            <Pressable onPress={closeTutorial} style={styles.primaryButton}>
              <LinearGradient
                colors={["#F4CF77", "#C98C2F"]}
                style={StyleSheet.absoluteFill}
              />
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
  backgroundImage: { opacity: 0.72 },
  backgroundOrbTop: {
    position: "absolute",
    top: -110,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(99,43,134,0.25)",
  },
  backgroundOrbBottom: {
    position: "absolute",
    bottom: 80,
    left: -130,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: "rgba(191,132,45,0.09)",
  },
  content: { paddingHorizontal: 15, paddingBottom: 42 },
  header: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.28)",
    backgroundColor: "rgba(18,11,30,0.66)",
  },
  headerCopy: { alignItems: "center" },
  title: {
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 36,
    lineHeight: 37,
  },
  subtitle: {
    marginTop: -1,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  locationRow: {
    marginTop: 1,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  locationPill: {
    minWidth: 0,
    flex: 1,
    height: 34,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,9,27,0.58)",
  },
  locationText: {
    flex: 1,
    marginLeft: 6,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 9.5,
  },
  lockPill: {
    height: 34,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(15,9,27,0.58)",
  },
  lockPillActive: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  lockText: {
    marginLeft: 5,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 8.5,
    fontWeight: "700",
  },
  lockTextActive: { color: colors.background },
  statusWrap: {
    minHeight: 37,
    marginBottom: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    width: 7,
    height: 7,
    marginRight: 8,
    borderRadius: 4,
    shadowColor: colors.goldLight,
    shadowOpacity: 0.7,
    shadowRadius: 7,
  },
  statusText: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
    textAlign: "center",
  },
  statusTextAligned: { color: "#F4D87B" },
  compassStage: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  compassHalo: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(246,203,99,0.78)",
    backgroundColor: "rgba(225,161,52,0.15)",
    shadowColor: "#F4C85E",
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 12,
  },
  compassGoldRim: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    shadowColor: "#000",
    shadowOpacity: 0.58,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 13 },
    elevation: 13,
  },
  compassGlassRim: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,247,220,0.30)",
    backgroundColor: "rgba(9,6,17,0.96)",
  },
  compassInnerHighlight: {
    position: "absolute",
    top: 7,
    right: 22,
    left: 22,
    height: "44%",
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  rotatingDial: { ...StyleSheet.absoluteFillObject },
  tickWrap: {
    position: "absolute",
    top: 7,
    right: 7,
    bottom: 7,
    left: 7,
    alignItems: "center",
  },
  tick: {
    width: 1,
    height: 5,
    borderRadius: 1,
    backgroundColor: "rgba(234,202,130,0.38)",
  },
  tickMedium: {
    height: 9,
    backgroundColor: "rgba(238,202,120,0.66)",
  },
  tickMajor: {
    width: 2,
    height: 14,
    backgroundColor: "#E8C168",
  },
  degreeLabel: {
    position: "absolute",
    width: 30,
    color: "rgba(238,214,166,0.68)",
    fontFamily: typography.serifMedium,
    fontSize: 10,
    textAlign: "center",
  },
  cardinal: {
    position: "absolute",
    color: "#F2D792",
    fontFamily: typography.serifSemibold,
    fontSize: 24,
    textAlign: "center",
    textShadowColor: "rgba(229,173,62,0.34)",
    textShadowRadius: 8,
  },
  cardinalNorth: { top: "10%", alignSelf: "center" },
  cardinalEast: { right: "11%", top: "46%" },
  cardinalSouth: { bottom: "8.5%", alignSelf: "center" },
  cardinalWest: { left: "10.5%", top: "46%" },
  roseRayWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
  },
  roseRay: {
    width: 3,
    height: "31%",
    marginTop: "20%",
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  needleLayer: { ...StyleSheet.absoluteFillObject, alignItems: "center" },
  needleShaft: {
    position: "absolute",
    top: "16%",
    width: 8,
    height: "36%",
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    shadowColor: "#F6C24B",
    shadowOpacity: 0.86,
    shadowRadius: 10,
    elevation: 8,
  },
  needleHead: {
    position: "absolute",
    top: "11.5%",
    width: 0,
    height: 0,
    borderLeftWidth: 12,
    borderRightWidth: 12,
    borderBottomWidth: 25,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#E8B748",
    transform: [{ rotate: "180deg" }],
  },
  needleHeadAligned: { borderBottomColor: "#FFF0A0" },
  needleTail: {
    position: "absolute",
    top: "51%",
    width: 4,
    height: "18%",
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: "rgba(219,208,187,0.52)",
  },
  centerMedallionOuter: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(5,3,11,0.82)",
    shadowColor: "#000",
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 10,
  },
  centerMedallionGold: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  centerMedallionInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,240,189,0.38)",
    backgroundColor: "#130D1D",
  },
  kaaba: {
    width: 36,
    height: 31,
    borderWidth: 1.4,
    borderColor: "#E7B752",
    backgroundColor: "#06050A",
  },
  kaabaBand: {
    position: "absolute",
    top: 8,
    right: 0,
    left: 0,
    height: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E7B752",
    backgroundColor: "rgba(199,146,49,0.35)",
  },
  kaabaDoor: {
    position: "absolute",
    right: 7,
    bottom: 0,
    width: 7,
    height: 13,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "#D9A742",
  },
  phoneMarker: {
    position: "absolute",
    top: 1,
    alignItems: "center",
  },
  phoneMarkerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 13,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFF0A3",
    transform: [{ rotate: "180deg" }],
  },
  glassCard: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(223,190,129,0.19)",
    backgroundColor: "rgba(16,9,28,0.70)",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7,
  },
  glassShine: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: "52%",
  },
  metricsCard: {
    minHeight: 126,
    paddingVertical: 17,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 27,
  },
  metricBlock: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  metricDivider: {
    width: 1,
    marginVertical: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  metricIcon: {
    width: 37,
    height: 37,
    marginBottom: 7,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.34)",
    backgroundColor: "rgba(15,9,27,0.65)",
  },
  metricIconAligned: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
    shadowColor: colors.goldLight,
    shadowOpacity: 0.7,
    shadowRadius: 9,
  },
  metricLabel: {
    color: colors.textSecondary,
    fontFamily: typography.serifMedium,
    fontSize: 13,
  },
  metricValue: {
    marginTop: 2,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 28,
    lineHeight: 30,
    fontVariant: ["tabular-nums"],
  },
  metricValueDistance: {
    marginTop: 2,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 21,
    lineHeight: 26,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
  alignmentText: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 14,
    lineHeight: 15,
    textAlign: "center",
  },
  alignmentTextSuccess: { color: "#F3D575" },
  miniKaaba: {
    width: 20,
    height: 18,
    borderWidth: 1,
    borderColor: colors.goldLight,
    backgroundColor: "#08070B",
  },
  miniKaabaBand: {
    position: "absolute",
    top: 5,
    right: 0,
    left: 0,
    height: 3,
    backgroundColor: colors.goldLight,
  },
  sensorCard: {
    marginTop: 12,
    padding: 15,
    borderRadius: 24,
  },
  sensorRow: { flexDirection: "row", alignItems: "center" },
  sensorIconWrap: {
    width: 45,
    height: 45,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.34)",
    backgroundColor: "rgba(25,14,39,0.75)",
  },
  sensorCopy: { flex: 1, marginLeft: 12 },
  sensorLabel: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  sensorValue: {
    marginTop: 1,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  signalBars: {
    height: 28,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  signalBar: {
    width: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  sensorSeparator: {
    height: 1,
    marginVertical: 12,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  sensorAdviceRow: { flexDirection: "row", alignItems: "center" },
  sensorAdvice: {
    flex: 1,
    marginLeft: 7,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
    lineHeight: 14,
  },
  actionRow: { marginTop: 12, flexDirection: "row", gap: 10 },
  actionButton: {
    flex: 1,
    height: 58,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.24)",
  },
  actionButtonText: {
    marginLeft: 9,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "700",
  },
  preferenceCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  preferenceCopy: { flex: 1, flexDirection: "row", alignItems: "center" },
  preferenceTexts: { flex: 1, marginLeft: 10 },
  preferenceTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  preferenceSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8,
  },
  permissionCard: {
    marginTop: 24,
    padding: 24,
    borderRadius: 28,
    alignItems: "center",
  },
  permissionIcon: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.38)",
    backgroundColor: "rgba(40,21,55,0.75)",
  },
  permissionTitle: {
    marginTop: 16,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 24,
  },
  permissionText: {
    marginTop: 7,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
    lineHeight: 16,
    textAlign: "center",
  },
  primaryButton: {
    height: 50,
    width: "100%",
    marginTop: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  primaryButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "900",
  },
  modalBackdrop: {
    flex: 1,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(3,2,8,0.82)",
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    padding: 20,
    borderRadius: 30,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  modalTitle: {
    marginTop: 3,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 25,
  },
  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  figureEight: {
    height: 112,
    marginVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  figureEightText: {
    color: colors.goldLight,
    fontFamily: typography.serif,
    fontSize: 104,
    lineHeight: 110,
    textShadowColor: "rgba(227,181,90,0.55)",
    textShadowRadius: 16,
  },
  modalBody: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
    lineHeight: 17,
    textAlign: "center",
  },
  helpList: { marginTop: 14, gap: 11 },
  helpRow: { flexDirection: "row", alignItems: "flex-start" },
  helpText: {
    flex: 1,
    marginLeft: 9,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 9,
    lineHeight: 15,
  },
  tutorialIcon: {
    width: 72,
    height: 72,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.38)",
    backgroundColor: "rgba(70,35,88,0.40)",
  },
  tutorialTitle: {
    marginTop: 16,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 28,
    textAlign: "center",
  },
  tutorialText: {
    marginTop: 7,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
    lineHeight: 17,
    textAlign: "center",
  },
  tutorialSteps: { marginTop: 16, gap: 10 },
  tutorialStep: { flexDirection: "row", alignItems: "center" },
  stepNumber: {
    width: 29,
    height: 29,
    borderRadius: 15,
    color: colors.background,
    backgroundColor: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "900",
    lineHeight: 29,
    textAlign: "center",
  },
  stepText: {
    marginLeft: 10,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 9.5,
  },
});
