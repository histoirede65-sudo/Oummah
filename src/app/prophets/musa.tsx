import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { MUSA_CHAPTERS as MUSA_CHAPTERS_FR, type ProphetReference, type ProphetSourceKind } from "../../features/prophets/prophetsData";
import { localizeChapters } from "../../features/prophets/prophetsLocalization";
import { PROPHETS_PREVIEW } from "../../features/prophets/prophetsData";
import { loadMusaProgress, saveMusaProgress } from "../../features/prophets/prophetProgress";
import { PROPHET_AUDIO_EPISODES } from "../../features/prophets/audio/prophetAudioData";
import { useI18n } from "../../i18n";
import type { TranslationKey } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const SOURCE_LABELS: Record<ProphetSourceKind, TranslationKey> = { QURAN: "prophets.sourceQuran", SUNNA: "prophets.sourceSunna", TAFSIR: "prophets.sourceTafsir" };
const MUSA_COVER = PROPHETS_PREVIEW.find((prophet) => prophet.id === "musa")?.coverImage ?? require("../../assets/images/prophets/musa-scenes/moussa.jpg");

function SourceChip({ kind }: { kind: ProphetSourceKind }) {
  const { t } = useI18n();
  const icon = kind === "QURAN" ? "book-outline" : kind === "SUNNA" ? "checkmark-circle-outline" : "library-outline";
  return <View style={styles.sourceChip}><Ionicons name={icon} size={13} color={colors.goldLight} /><Text style={styles.sourceChipText}>{t(SOURCE_LABELS[kind])}</Text></View>;
}

function ReferenceCard({ reference }: { reference: ProphetReference }) {
  const { t } = useI18n();
  const open = () => {
    if (!reference.surahId) return;
    router.push(`/surah/${reference.surahId}?verse=${reference.verse ?? 1}` as Href);
  };
  return (
    <Pressable disabled={!reference.surahId} onPress={open} style={({ pressed }) => [styles.referenceCard, pressed && styles.pressed]}>
      <View style={styles.referenceHeader}><SourceChip kind={reference.kind} /><Text style={styles.referenceLabel}>{reference.label}</Text></View>
      <Text style={styles.referenceNote}>{reference.note}</Text>
      {reference.surahId ? <View style={styles.referenceAction}><Ionicons name="play-circle-outline" size={17} color={colors.goldLight} /><Text style={styles.referenceActionText}>{t("prophets.openPassage")}</Text><Ionicons name="arrow-forward" size={14} color={colors.goldLight} /></View> : null}
    </Pressable>
  );
}


const SCENE_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; colors: [string, string, string]; glow: string; label: TranslationKey }> = {
  nile: { icon: "boat-outline", colors: ["#120A24", "#4C2235", "#0B405A"], glow: "rgba(244,190,87,0.38)", label: "musaScene.nile" },
  mistake: { icon: "heart-half-outline", colors: ["#180B19", "#442024", "#161020"], glow: "rgba(214,99,89,0.26)", label: "musaScene.mistake" },
  madyan: { icon: "water-outline", colors: ["#170D23", "#6A3B20", "#24404A"], glow: "rgba(235,184,92,0.42)", label: "musaScene.madyan" },
  family: { icon: "home-outline", colors: ["#171025", "#4A2832", "#75502C"], glow: "rgba(235,184,92,0.30)", label: "musaScene.family" },
  tuwa: { icon: "flame-outline", colors: ["#050713", "#15102A", "#56301F"], glow: "rgba(255,189,75,0.64)", label: "musaScene.tuwa" },
  pharaoh: { icon: "business-outline", colors: ["#100818", "#30142C", "#70411F"], glow: "rgba(227,181,90,0.30)", label: "musaScene.pharaoh" },
  magicians: { icon: "sparkles-outline", colors: ["#11091F", "#381446", "#784516"], glow: "rgba(245,186,62,0.56)", label: "musaScene.magicians" },
  signs: { icon: "thunderstorm-outline", colors: ["#07101D", "#152947", "#213D2D"], glow: "rgba(101,201,155,0.30)", label: "musaScene.signs" },
  departure: { icon: "moon-outline", colors: ["#050710", "#10172B", "#29203E"], glow: "rgba(231,192,112,0.22)", label: "musaScene.departure" },
  sea: { icon: "water-outline", colors: ["#04101E", "#075075", "#0C6C88"], glow: "rgba(142,225,255,0.34)", label: "musaScene.sea" },
  "after-sea": { icon: "trail-sign-outline", colors: ["#160F24", "#503624", "#8B6336"], glow: "rgba(236,187,98,0.28)", label: "musaScene.afterSea" },
  mount: { icon: "triangle-outline", colors: ["#050611", "#151025", "#44313B"], glow: "rgba(255,205,116,0.52)", label: "musaScene.mount" },
  calf: { icon: "warning-outline", colors: ["#180B16", "#4A2117", "#86531E"], glow: "rgba(246,190,76,0.50)", label: "musaScene.calf" },
  "holy-land": { icon: "map-outline", colors: ["#0F0E20", "#2F263B", "#745A2F"], glow: "rgba(225,184,101,0.30)", label: "musaScene.holyLand" },
  khidr: { icon: "boat-outline", colors: ["#04111B", "#0B3A45", "#2C5143"], glow: "rgba(100,210,171,0.30)", label: "musaScene.khidr" },
  qarun: { icon: "diamond-outline", colors: ["#140919", "#4B231D", "#8B5C20"], glow: "rgba(246,190,76,0.52)", label: "musaScene.qarun" },
};

function Stars({ count = 12 }: { count?: number }) {
  return <>{Array.from({ length: count }).map((_, index) => <View key={index} style={[styles.star, { left: `${8 + ((index * 23) % 84)}%`, top: `${7 + ((index * 17) % 42)}%`, opacity: 0.35 + ((index % 4) * 0.14) }]} />)}</>;
}

function MountainLayer({ bottom = 92, opacity = 0.72 }: { bottom?: number; opacity?: number }) {
  return <View style={[styles.mountainLayer, { bottom, opacity }]}><View style={styles.mountainLeft} /><View style={styles.mountainCenter} /><View style={styles.mountainRight} /></View>;
}

function SceneArtwork({ chapterId }: { chapterId: string }) {
  const { t } = useI18n();
  const scene = SCENE_CONFIG[chapterId] ?? SCENE_CONFIG.nile;
  const isNight = ["tuwa", "departure", "mount", "khidr"].includes(chapterId);

  const foreground = (() => {
    switch (chapterId) {
      case "nile":
        return <><View style={styles.sunDisc} /><View style={styles.citySilhouette}><View style={styles.cityBlockA}/><View style={styles.cityBlockB}/><View style={styles.cityBlockC}/><View style={styles.cityTower}/></View><View style={styles.riverBand}/><View style={styles.reedLeft}/><View style={styles.reedRight}/><View style={styles.basket}><View style={styles.basketBlanket}/></View></>;
      case "mistake":
        return <><View style={styles.citySilhouetteDark}><View style={styles.cityBlockA}/><View style={styles.cityBlockB}/><View style={styles.cityTower}/></View><View style={styles.alleyLineLeft}/><View style={styles.alleyLineRight}/><View style={styles.sceneIconSmall}><Ionicons name="heart-half-outline" size={58} color={colors.goldLight}/></View></>;
      case "madyan":
        return <><MountainLayer bottom={95}/><View style={styles.desertFloor}/><View style={styles.wellOuter}><View style={styles.wellWater}/></View><View style={styles.palmA}><View style={styles.palmTop}/></View><View style={styles.palmB}><View style={styles.palmTop}/></View><View style={styles.sceneIconCorner}><Ionicons name="water-outline" size={42} color={colors.goldLight}/></View></>;
      case "family":
        return <><MountainLayer bottom={104} opacity={0.55}/><View style={styles.desertFloor}/><View style={styles.tent}><View style={styles.tentDoor}/></View><View style={styles.warmLamp}/><View style={styles.sceneIconCorner}><Ionicons name="home-outline" size={40} color={colors.goldLight}/></View></>;
      case "tuwa":
        return <><Stars count={18}/><MountainLayer bottom={68}/><View style={styles.tuwaGlow}/><View style={styles.flameMark}><Ionicons name="flame" size={56} color="#F3C56C"/></View></>;
      case "pharaoh":
        return <><View style={styles.palaceFloor}/><View style={styles.columnLeft}/><View style={styles.columnRight}/><View style={styles.throneGlow}/><View style={styles.sceneIconSmall}><Ionicons name="business-outline" size={62} color={colors.goldLight}/></View></>;
      case "magicians":
        return <><View style={styles.arenaFloor}/><View style={styles.staffLine}/><View style={styles.ropeA}/><View style={styles.ropeB}/><View style={styles.sparkA}/><View style={styles.sparkB}/><View style={styles.sparkC}/></>;
      case "signs":
        return <><View style={styles.stormCloudA}/><View style={styles.stormCloudB}/><View style={styles.rainA}/><View style={styles.rainB}/><View style={styles.rainC}/><View style={styles.lightning}><Ionicons name="flash" size={72} color="#E6C96E"/></View></>;
      case "departure":
        return <><Stars count={20}/><View style={styles.moonDisc}/><MountainLayer bottom={82} opacity={0.62}/><View style={styles.nightPath}/><View style={styles.sceneIconCorner}><Ionicons name="moon-outline" size={40} color={colors.goldLight}/></View></>;
      case "sea":
        return <><View style={styles.seaWallLeft}/><View style={styles.seaWallRight}/><View style={styles.seaPath}/><View style={styles.seaLight}/><View style={styles.foamLeft}/><View style={styles.foamRight}/></>;
      case "after-sea":
        return <><View style={styles.sunDiscSmall}/><MountainLayer bottom={100} opacity={0.55}/><View style={styles.desertFloor}/><View style={styles.pathRibbon}/><View style={styles.sceneIconCorner}><Ionicons name="trail-sign-outline" size={44} color={colors.goldLight}/></View></>;
      case "mount":
        return <><Stars count={22}/><MountainLayer bottom={56}/><View style={styles.mountGlow}/><View style={styles.mountPeak}/></>;
      case "calf":
        return <><View style={styles.campGround}/><View style={styles.tentSmallA}/><View style={styles.tentSmallB}/><View style={styles.calfGlow}/><View style={styles.calfSymbol}><Ionicons name="warning-outline" size={66} color={colors.goldLight}/></View></>;
      case "holy-land":
        return <><View style={styles.sunDiscSmall}/><MountainLayer bottom={92} opacity={0.62}/><View style={styles.gateWall}/><View style={styles.gateArch}/><View style={styles.pathRibbon}/></>;
      case "khidr":
        return <><Stars count={15}/><View style={styles.khWater}/><View style={styles.khBoat}><Ionicons name="boat-outline" size={58} color={colors.goldLight}/></View><View style={styles.khMoon}/></>;
      case "qarun":
        return <><View style={styles.treasureGround}/><View style={styles.chest}><View style={styles.chestBand}/></View><View style={styles.coinA}/><View style={styles.coinB}/><View style={styles.coinC}/><View style={styles.sceneIconCorner}><Ionicons name="diamond-outline" size={42} color={colors.goldLight}/></View></>;
      default:
        return <View style={styles.sceneIconSmall}><Ionicons name={scene.icon} size={70} color={colors.goldLight}/></View>;
    }
  })();

  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient colors={scene.colors} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
      {isNight ? <Stars count={14}/> : null}
      <View style={[styles.sceneGlow, { backgroundColor: scene.glow }]} />
      {foreground}
      <LinearGradient colors={["rgba(8,7,19,0.00)", "rgba(8,7,19,0.08)", "rgba(8,7,19,0.92)"]} style={StyleSheet.absoluteFill} />
      <View style={styles.sceneLabelWrap}><Text style={styles.sceneLabel}>{t(scene.label)}</Text></View>
    </View>
  );
}

export default function MusaStoryScreen() {
  const { language, t } = useI18n();
  const MUSA_CHAPTERS = localizeChapters("musa", MUSA_CHAPTERS_FR, language);
  const params = useLocalSearchParams<{ chapter?: string }>();
  const initialIndex = Math.min(MUSA_CHAPTERS.length - 1, Math.max(0, Number(params.chapter ?? 0) || 0));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [showIntro, setShowIntro] = useState(true);
  const [completed, setCompleted] = useState<string[]>([]);
  const [showMap, setShowMap] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const chapter = MUSA_CHAPTERS[activeIndex];

  useEffect(() => {
    void loadMusaProgress().then((progress) => setCompleted(progress.completed));
  }, []);

  useEffect(() => {
    void saveMusaProgress({ completed, lastChapterId: chapter.id });
  }, [chapter.id, completed]);

  const completedCurrent = completed.includes(chapter.id);
  const progress = completed.length / MUSA_CHAPTERS.length;
  const heroScale = scrollY.interpolate({ inputRange: [-120, 0, 260], outputRange: [1.14, 1, 1.05], extrapolate: "clamp" });
  const heroTranslate = scrollY.interpolate({ inputRange: [0, 320], outputRange: [0, 56], extrapolate: "clamp" });

  const goTo = useCallback((index: number) => {
    const next = Math.min(MUSA_CHAPTERS.length - 1, Math.max(0, index));
    setActiveIndex(next);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [MUSA_CHAPTERS.length]);

  const toggleComplete = () => {
    setCompleted((current) => completedCurrent ? current.filter((id) => id !== chapter.id) : [...new Set([...current, chapter.id])]);
  };

  const journeyPoints = useMemo(() => (["prophets.mapNile", "prophets.mapEgypt", "prophets.mapMadyan", "prophets.mapTuwa", "prophets.mapEgypt", "prophets.mapSea", "prophets.mapSinai"] as const).map((key) => t(key)), [t]);

  return (
    <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => showIntro ? router.back() : setShowIntro(true)} style={styles.backButton}><Ionicons name="chevron-back" size={22} color={colors.text} /></Pressable>
          <View style={styles.headerCopy}><Text style={styles.headerEyebrow}>{t("prophets.headerEyebrow")}</Text><Text style={styles.headerTitle}>Mûsâ عليه السلام</Text></View>
          <Pressable onPress={() => setShowMap((value) => !value)} style={[styles.backButton, showMap && styles.headerButtonActive]}><Ionicons name="map-outline" size={20} color={showMap ? colors.background : colors.goldLight} /></Pressable>
        </View>

        {showMap ? (
          <View style={styles.mapPanel}>
            <Text style={styles.mapTitle}>{t("prophets.mapTitle")}</Text>
            <Text style={styles.mapSubtitle}>{t("prophets.mapSubtitle")}</Text>
            <View style={styles.mapRoute}>
              {journeyPoints.map((point, index) => <View key={`${point}-${index}`} style={styles.mapPointWrap}><View style={[styles.mapPoint, index <= activeIndex + 1 && styles.mapPointActive]} /><Text style={[styles.mapPointText, index <= activeIndex + 1 && styles.mapPointTextActive]}>{point}</Text>{index < journeyPoints.length - 1 ? <View style={[styles.mapConnector, index <= activeIndex && styles.mapConnectorActive]} /> : null}</View>)}
            </View>
          </View>
        ) : null}

        <Animated.ScrollView
          ref={scrollRef as any}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
          scrollEventThrottle={16}
        >
          {showIntro ? (
            <View style={styles.hero}>
              <Animated.View style={[styles.heroImageLayer, { transform: [{ translateY: heroTranslate }, { scale: heroScale }] }]}>
                <Image source={MUSA_COVER} contentFit="cover" cachePolicy="memory-disk" priority="high" style={styles.heroImage} />
              </Animated.View>
              <LinearGradient colors={["rgba(7,7,18,0.05)", "rgba(8,7,19,0.42)", "rgba(8,7,19,0.99)"]} style={StyleSheet.absoluteFill} />
              <View style={styles.heroRim} />
              <View style={styles.heroCopy}>
                <Text style={styles.introLabel}>{t("prophets.firstJourney")}</Text>
                <Text style={styles.heroTitle}>Mûsâ عليه السلام</Text>
                <Text style={styles.introSubtitle}>{t("prophets.musaSubtitle")}</Text>
                <Pressable onPress={() => { setShowIntro(false); scrollRef.current?.scrollTo({ y: 0, animated: false }); }} style={({ pressed }) => [styles.introButton, pressed && styles.pressed]}>
                  <Text style={styles.introButtonText}>{t(completed.length ? "prophets.resume" : "prophets.start")}</Text>
                  <Ionicons name="arrow-forward" size={17} color={colors.background} />
                </Pressable>
                {PROPHET_AUDIO_EPISODES.musa ? (
                  <Pressable onPress={() => router.push("/prophets/audio/musa" as Href)} style={({ pressed }) => [styles.audioButton, pressed && styles.pressed]}>
                    <Ionicons name="headset-outline" size={21} color={colors.goldLight} />
                    <View style={styles.audioButtonCopy}>
                      <Text style={styles.audioButtonTitle}>{t("prophets.listen")}</Text>
                      <Text style={styles.audioButtonSubtitle}>{t("prophets.listenSubtitle", { name: "Mûsâ" })}</Text>
                    </View>
                    <Ionicons name="play-circle" size={24} color={colors.goldLight} />
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : (
          <>
          <View style={styles.hero}>
            <Animated.View style={[styles.heroImageLayer, { transform: [{ translateY: heroTranslate }, { scale: heroScale }] }]}> 
              <Image source={chapter.image} contentFit="cover" cachePolicy="memory-disk" priority="high" transition={{ duration: 260, effect: "cross-dissolve" }} style={styles.heroImage} />
            </Animated.View>
            <LinearGradient colors={["rgba(7,7,18,0.02)", "rgba(8,7,19,0.30)", "rgba(8,7,19,0.95)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.heroRim} />
            <View style={styles.heroCopy}>
              <Text style={styles.chapterNumber}>{String(chapter.index).padStart(2, "0")} / {String(MUSA_CHAPTERS.length).padStart(2, "0")}</Text>
              <Text style={styles.heroTitle}>{chapter.title}</Text>
              <Text style={styles.heroSubtitle}>{chapter.subtitle}</Text>
              <View style={styles.atmosphereRow}><Ionicons name="compass-outline" size={14} color={colors.goldLight} /><Text style={styles.atmosphereText}>{chapter.atmosphere}</Text></View>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chapterRail}>
            {MUSA_CHAPTERS.map((item, index) => <Pressable key={item.id} onPress={() => goTo(index)} style={[styles.railDot, index === activeIndex && styles.railDotActive, completed.includes(item.id) && styles.railDotCompleted]}><Text style={[styles.railDotText, (index === activeIndex || completed.includes(item.id)) && styles.railDotTextActive]}>{item.index}</Text></Pressable>)}
          </ScrollView>

          <View key={`story-${chapter.id}`} style={styles.storyCard}>
            <Text style={styles.storyEyebrow}>{t("prophets.story")}</Text>
            <Text style={styles.storyText}>{chapter.paragraphs.join("\n\n")}</Text>
          </View>

          <View style={styles.sourceSection}>
            <Text style={styles.sectionEyebrow}>{t("prophets.sourcesEyebrow")}</Text>
            <Text style={styles.sectionTitle}>{t("prophets.sourcesTitleQuran")}</Text>
            {chapter.references.map((reference) => <ReferenceCard key={reference.label} reference={reference} />)}
          </View>

          <LinearGradient colors={["#1E1730", "#151022"]} style={styles.lessonCard}>
            <View style={styles.lessonIcon}><Ionicons name="sparkles" size={20} color={colors.goldLight} /></View>
            <Text style={styles.lessonEyebrow}>{t("prophets.lessonsMusa")}</Text>
            {chapter.lessons.map((lesson, index) => <View key={index} style={styles.lessonRow}><Text style={styles.lessonNumber}>0{index + 1}</Text><Text style={styles.lessonText}>{lesson}</Text></View>)}
          </LinearGradient>

          <Pressable onPress={toggleComplete} style={({ pressed }) => [styles.completeButton, completedCurrent && styles.completeButtonDone, pressed && styles.pressed]}>
            <Ionicons name={completedCurrent ? "checkmark-circle" : "checkmark-circle-outline"} size={22} color={completedCurrent ? colors.background : colors.goldLight} />
            <View style={styles.completeCopy}><Text style={[styles.completeTitle, completedCurrent && styles.completeTitleDone]}>{t(completedCurrent ? "prophets.chapterDoneMusa" : "prophets.markRead")}</Text><Text style={[styles.completeSubtitle, completedCurrent && styles.completeSubtitleDone]}>{t(completedCurrent ? "prophets.progressSavedMusa" : "prophets.resumeLaterMusa")}</Text></View>
          </Pressable>

          <View style={styles.globalProgressCard}>
            <View style={styles.globalProgressHeader}><Text style={styles.globalProgressTitle}>{t("prophets.journeyWith", { name: "Mûsâ" })}</Text><Text style={styles.globalProgressValue}>{completed.length}/{MUSA_CHAPTERS.length}</Text></View>
            <View style={styles.globalTrack}><View style={[styles.globalFill, { width: `${Math.max(2, progress * 100)}%` }]} /></View>
          </View>

          <View style={styles.navigationRow}>
            <Pressable disabled={activeIndex === 0} onPress={() => goTo(activeIndex - 1)} style={({ pressed }) => [styles.navButton, activeIndex === 0 && styles.navButtonDisabled, pressed && activeIndex > 0 && styles.pressed]}><Ionicons name="arrow-back" size={17} color={activeIndex === 0 ? colors.textMuted : colors.goldLight} /><Text style={[styles.navText, activeIndex === 0 && styles.navTextDisabled]}>{t("prophets.previous")}</Text></Pressable>
            <Pressable disabled={activeIndex === MUSA_CHAPTERS.length - 1} onPress={() => goTo(activeIndex + 1)} style={({ pressed }) => [styles.navButton, styles.navButtonNext, activeIndex === MUSA_CHAPTERS.length - 1 && styles.navButtonDisabled, pressed && activeIndex < MUSA_CHAPTERS.length - 1 && styles.pressed]}><Text style={[styles.navText, activeIndex === MUSA_CHAPTERS.length - 1 && styles.navTextDisabled]}>{t("prophets.nextChapter")}</Text><Ionicons name="arrow-forward" size={17} color={activeIndex === MUSA_CHAPTERS.length - 1 ? colors.textMuted : colors.goldLight} /></Pressable>
          </View>

          <View style={styles.methodCard}><Ionicons name="shield-checkmark-outline" size={20} color={colors.goldLight} /><Text style={styles.methodText}>{t("prophets.musaMethod")}</Text></View>
          </>
          )}
        </Animated.ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, safeArea: { flex: 1 },
  header: { minHeight: 74, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: "#2B2238", backgroundColor: "rgba(255,255,255,0.045)" },
  headerButtonActive: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  headerCopy: { flex: 1, alignItems: "center" }, headerEyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9.5, fontWeight: "800", letterSpacing: 1.1 }, headerTitle: { marginTop: 2, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 23 },
  mapPanel: { marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 22, borderWidth: 1, borderColor: "#2B2238", backgroundColor: "#151022" },
  mapTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 18 }, mapSubtitle: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, lineHeight: 15 },
  mapRoute: { marginTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, mapPointWrap: { flex: 1, alignItems: "center", position: "relative" }, mapPoint: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#1E1730", borderWidth: 1, borderColor: "#2B2238" }, mapPointActive: { backgroundColor: colors.goldLight, borderColor: colors.goldLight }, mapPointText: { marginTop: 5, color: colors.textMuted, fontFamily: typography.sans, fontSize: 7.5 }, mapPointTextActive: { color: colors.goldLight }, mapConnector: { position: "absolute", top: 3, left: "55%", width: "92%", height: 1, backgroundColor: "#2B2238" }, mapConnectorActive: { backgroundColor: "rgba(227,181,90,0.55)" },
  content: { padding: 16, paddingBottom: 48 },
  hero: { height: 440, overflow: "hidden", borderRadius: 32, borderWidth: 1.2, borderColor: "rgba(227,181,90,0.42)", backgroundColor: "#151022" }, heroImageLayer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }, heroImage: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, width: "100%", height: "100%" }, heroRim: { position: "absolute", top: 8, right: 8, bottom: 8, left: 8, borderRadius: 25, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)" },
  heroCopy: { flex: 1, justifyContent: "flex-end", padding: 22 }, introLabel: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "800", letterSpacing: 1.4 }, introSubtitle: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 18, lineHeight: 27 }, introButton: { marginTop: 18, minHeight: 48, paddingHorizontal: 16, borderRadius: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.goldLight }, introButtonText: { color: colors.background, fontFamily: typography.sans, fontSize: 14, fontWeight: "800" }, chapterNumber: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "800", letterSpacing: 1.4 }, heroTitle: { marginTop: 7, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 37, lineHeight: 42 }, heroSubtitle: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 18, lineHeight: 27 }, atmosphereRow: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 6 }, atmosphereText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 14, fontWeight: "700" },
  audioButton: { marginTop: 10, minHeight: 62, paddingHorizontal: 16, borderRadius: 24, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(227,181,90,0.34)", backgroundColor: "rgba(227,181,90,0.07)" }, audioButtonCopy: { flex: 1 }, audioButtonTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 20, fontWeight: "800" }, audioButtonSubtitle: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5 },
  chapterRail: { marginTop: 14, paddingHorizontal: 4, gap: 8 }, railDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#2B2238", backgroundColor: "#151022" }, railDotActive: { borderColor: colors.goldLight, backgroundColor: "rgba(227,181,90,0.10)" }, railDotCompleted: { backgroundColor: colors.goldLight, borderColor: colors.goldLight }, railDotText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, fontWeight: "800" }, railDotTextActive: { color: colors.background },
  storyCard: { alignSelf: "stretch", overflow: "visible", marginTop: 16, padding: 18, borderRadius: 26, borderWidth: 1, borderColor: "#2B2238", backgroundColor: "#151022" }, storyEyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.35 }, storyText: { marginTop: 14, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 20, lineHeight: 33 }, storyParagraph: { marginTop: 13 },
  sourceSection: { marginTop: 22 }, sectionEyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.35 }, sectionTitle: { marginTop: 6, marginBottom: 14, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 28, lineHeight: 33 },
  referenceCard: { marginBottom: 10, padding: 15, borderRadius: 22, borderWidth: 1, borderColor: "rgba(227,181,90,0.24)", backgroundColor: "rgba(227,181,90,0.055)" }, referenceHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, sourceChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, height: 24, borderRadius: 12, backgroundColor: "rgba(227,181,90,0.10)" }, sourceChipText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 }, referenceLabel: { flexShrink: 1, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 19.5, lineHeight: 24, textAlign: "right" }, referenceNote: { marginTop: 11, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 16, lineHeight: 25 }, referenceAction: { marginTop: 11, flexDirection: "row", alignItems: "center", gap: 6 }, referenceActionText: { flex: 1, color: colors.goldLight, fontFamily: typography.sans, fontSize: 13.5, fontWeight: "700" },
  lessonCard: { marginTop: 12, padding: 18, borderRadius: 26, borderWidth: 1, borderColor: "rgba(227,181,90,0.28)" }, lessonIcon: { width: 40, height: 40, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.10)" }, lessonEyebrow: { marginTop: 11, color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "800", letterSpacing: 1 }, lessonRow: { marginTop: 12, flexDirection: "row", gap: 10 }, lessonNumber: { color: colors.goldMuted, fontFamily: typography.serifSemibold, fontSize: 18 }, lessonText: { flex: 1, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 16.5, lineHeight: 25 },
  completeButton: { marginTop: 14, minHeight: 72, paddingHorizontal: 16, borderRadius: 24, flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderColor: "rgba(227,181,90,0.34)", backgroundColor: "rgba(227,181,90,0.07)" }, completeButtonDone: { backgroundColor: colors.goldLight, borderColor: colors.goldLight }, completeCopy: { flex: 1 }, completeTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 17 }, completeTitleDone: { color: colors.background }, completeSubtitle: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5 }, completeSubtitleDone: { color: "rgba(8,7,19,0.72)" },
  globalProgressCard: { marginTop: 12, padding: 14, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.035)" }, globalProgressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, globalProgressTitle: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11.5, fontWeight: "700" }, globalProgressValue: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "800" }, globalTrack: { marginTop: 9, height: 5, borderRadius: 3, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.10)" }, globalFill: { height: 5, borderRadius: 3, backgroundColor: colors.goldLight },
  navigationRow: { marginTop: 14, flexDirection: "row", gap: 10 }, navButton: { flex: 1, minHeight: 48, borderRadius: 22, borderWidth: 1, borderColor: "#2B2238", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "#151022" }, navButtonNext: { borderColor: "rgba(227,181,90,0.32)" }, navButtonDisabled: { opacity: 0.4 }, navText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11.5, fontWeight: "800" }, navTextDisabled: { color: colors.textMuted },
  methodCard: { marginTop: 14, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: "#2B2238", flexDirection: "row", gap: 10, backgroundColor: "#151022" }, methodText: { flex: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 14, lineHeight: 21 },
  sceneGlow: { position: "absolute", width: 260, height: 260, borderRadius: 130, top: 34, alignSelf: "center", opacity: 0.72 },
  sceneLabelWrap: { position: "absolute", top: 286, left: 26, right: 26, alignItems: "center" },
  sceneLabel: { color: "rgba(248,244,238,0.86)", fontFamily: typography.serifMedium, fontSize: 19, lineHeight: 24, textAlign: "center", letterSpacing: 0.2 },
  star: { position: "absolute", width: 3, height: 3, borderRadius: 2, backgroundColor: "#F5DFA0" },
  mountainLayer: { position: "absolute", left: 0, right: 0, height: 145 },
  mountainLeft: { position: "absolute", left: -35, bottom: 0, width: 190, height: 140, backgroundColor: "rgba(8,8,22,0.82)", transform: [{ rotate: "35deg" }] },
  mountainCenter: { position: "absolute", left: 115, bottom: -22, width: 180, height: 185, backgroundColor: "rgba(10,9,25,0.94)", transform: [{ rotate: "43deg" }] },
  mountainRight: { position: "absolute", right: -48, bottom: -8, width: 200, height: 155, backgroundColor: "rgba(12,10,29,0.86)", transform: [{ rotate: "-38deg" }] },
  sunDisc: { position: "absolute", width: 82, height: 82, borderRadius: 41, top: 48, right: 74, backgroundColor: "rgba(245,190,88,0.92)", shadowColor: "#F1B852", shadowOpacity: 0.55, shadowRadius: 28 },
  sunDiscSmall: { position: "absolute", width: 58, height: 58, borderRadius: 29, top: 56, left: 54, backgroundColor: "rgba(235,178,86,0.75)" },
  citySilhouette: { position: "absolute", left: 0, right: 0, top: 138, height: 82, flexDirection: "row", alignItems: "flex-end", opacity: 0.66 },
  citySilhouetteDark: { position: "absolute", left: 20, right: 20, top: 118, height: 126, flexDirection: "row", alignItems: "flex-end", opacity: 0.82 },
  cityBlockA: { width: 82, height: 58, backgroundColor: "rgba(8,8,20,0.85)" }, cityBlockB: { width: 70, height: 78, backgroundColor: "rgba(8,8,20,0.90)" }, cityBlockC: { width: 96, height: 52, backgroundColor: "rgba(8,8,20,0.86)" }, cityTower: { width: 36, height: 112, backgroundColor: "rgba(8,8,20,0.92)" },
  riverBand: { position: "absolute", left: 0, right: 0, bottom: 78, height: 118, backgroundColor: "rgba(7,63,89,0.76)", borderTopWidth: 1, borderColor: "rgba(199,220,226,0.20)" },
  reedLeft: { position: "absolute", width: 5, height: 88, left: 52, bottom: 88, backgroundColor: "#6E633B", transform: [{ rotate: "-8deg" }] }, reedRight: { position: "absolute", width: 5, height: 104, right: 62, bottom: 84, backgroundColor: "#6E633B", transform: [{ rotate: "7deg" }] },
  basket: { position: "absolute", width: 116, height: 50, borderRadius: 30, bottom: 118, alignSelf: "center", backgroundColor: "#6B4329", borderWidth: 2, borderColor: "#B98B50", transform: [{ rotate: "-2deg" }] }, basketBlanket: { width: 70, height: 24, borderRadius: 16, alignSelf: "center", marginTop: -12, backgroundColor: "#D8C79A", opacity: 0.85 },
  alleyLineLeft: { position: "absolute", width: 2, height: 180, left: 98, top: 130, backgroundColor: "rgba(227,181,90,0.38)", transform: [{ rotate: "21deg" }] }, alleyLineRight: { position: "absolute", width: 2, height: 180, right: 98, top: 130, backgroundColor: "rgba(227,181,90,0.38)", transform: [{ rotate: "-21deg" }] },
  sceneIconSmall: { position: "absolute", top: 116, alignSelf: "center", width: 132, height: 132, borderRadius: 66, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(227,181,90,0.38)", backgroundColor: "rgba(7,7,18,0.42)" }, sceneIconCorner: { position: "absolute", right: 34, top: 54, width: 72, height: 72, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,7,19,0.40)", borderWidth: 1, borderColor: "rgba(227,181,90,0.28)" },
  desertFloor: { position: "absolute", left: -20, right: -20, bottom: 70, height: 145, borderTopLeftRadius: 160, borderTopRightRadius: 120, backgroundColor: "rgba(116,77,38,0.55)" },
  wellOuter: { position: "absolute", width: 150, height: 64, borderRadius: 75, bottom: 120, alignSelf: "center", borderWidth: 5, borderColor: "#8F7048", backgroundColor: "rgba(11,23,33,0.78)", alignItems: "center", justifyContent: "center" }, wellWater: { width: 126, height: 42, borderRadius: 63, backgroundColor: "#14566E" },
  palmA: { position: "absolute", width: 7, height: 78, left: 70, bottom: 158, backgroundColor: "#6B5130", transform: [{ rotate: "6deg" }] }, palmB: { position: "absolute", width: 7, height: 68, right: 78, bottom: 148, backgroundColor: "#6B5130", transform: [{ rotate: "-7deg" }] }, palmTop: { position: "absolute", width: 48, height: 18, left: -20, top: -6, borderRadius: 24, backgroundColor: "#314331" },
  tent: { position: "absolute", width: 180, height: 96, bottom: 104, left: 72, backgroundColor: "rgba(88,53,39,0.80)", transform: [{ skewX: "-12deg" }] }, tentDoor: { position: "absolute", width: 38, height: 58, bottom: 0, left: 70, backgroundColor: "rgba(10,8,18,0.80)" }, warmLamp: { position: "absolute", width: 18, height: 18, borderRadius: 9, bottom: 132, left: 158, backgroundColor: "#F0B952", shadowColor: "#F0B952", shadowOpacity: 0.9, shadowRadius: 22 },
  tuwaGlow: { position: "absolute", width: 220, height: 220, borderRadius: 110, bottom: 86, alignSelf: "center", backgroundColor: "rgba(230,155,60,0.15)", shadowColor: "#F2B14E", shadowOpacity: 0.85, shadowRadius: 48 }, flameMark: { position: "absolute", bottom: 150, alignSelf: "center" },
  palaceFloor: { position: "absolute", left: 0, right: 0, bottom: 70, height: 120, backgroundColor: "rgba(85,51,31,0.48)" }, columnLeft: { position: "absolute", left: 58, top: 74, width: 34, height: 224, backgroundColor: "rgba(183,132,66,0.38)", borderTopLeftRadius: 8, borderTopRightRadius: 8 }, columnRight: { position: "absolute", right: 58, top: 74, width: 34, height: 224, backgroundColor: "rgba(183,132,66,0.38)", borderTopLeftRadius: 8, borderTopRightRadius: 8 }, throneGlow: { position: "absolute", width: 140, height: 140, borderRadius: 70, top: 105, alignSelf: "center", backgroundColor: "rgba(229,175,79,0.10)" },
  arenaFloor: { position: "absolute", left: 28, right: 28, bottom: 88, height: 100, borderRadius: 50, backgroundColor: "rgba(94,54,28,0.50)", borderWidth: 1, borderColor: "rgba(227,181,90,0.22)" }, staffLine: { position: "absolute", width: 6, height: 150, left: "50%", bottom: 116, backgroundColor: "#B89257", transform: [{ rotate: "8deg" }] }, ropeA: { position: "absolute", width: 138, height: 4, left: 68, bottom: 140, borderRadius: 2, backgroundColor: "#8B623B", transform: [{ rotate: "18deg" }] }, ropeB: { position: "absolute", width: 128, height: 4, right: 58, bottom: 152, borderRadius: 2, backgroundColor: "#8B623B", transform: [{ rotate: "-14deg" }] }, sparkA: { position: "absolute", width: 8, height: 8, borderRadius: 4, left: 90, top: 110, backgroundColor: "#F3C55B" }, sparkB: { position: "absolute", width: 6, height: 6, borderRadius: 3, right: 92, top: 144, backgroundColor: "#F3C55B" }, sparkC: { position: "absolute", width: 10, height: 10, borderRadius: 5, right: 126, top: 92, backgroundColor: "#F3C55B" },
  stormCloudA: { position: "absolute", width: 150, height: 58, borderRadius: 30, top: 70, left: 40, backgroundColor: "rgba(34,46,65,0.92)" }, stormCloudB: { position: "absolute", width: 165, height: 64, borderRadius: 32, top: 92, right: 30, backgroundColor: "rgba(30,43,61,0.94)" }, rainA: { position: "absolute", width: 2, height: 120, top: 132, left: 92, backgroundColor: "rgba(163,201,220,0.42)", transform: [{ rotate: "10deg" }] }, rainB: { position: "absolute", width: 2, height: 132, top: 146, left: 170, backgroundColor: "rgba(163,201,220,0.42)", transform: [{ rotate: "10deg" }] }, rainC: { position: "absolute", width: 2, height: 112, top: 134, right: 88, backgroundColor: "rgba(163,201,220,0.42)", transform: [{ rotate: "10deg" }] }, lightning: { position: "absolute", top: 132, alignSelf: "center" },
  moonDisc: { position: "absolute", width: 72, height: 72, borderRadius: 36, top: 56, right: 56, backgroundColor: "rgba(225,219,188,0.82)" }, nightPath: { position: "absolute", width: 84, height: 260, bottom: -60, alignSelf: "center", backgroundColor: "rgba(210,172,99,0.24)", transform: [{ perspective: 280 }, { rotateX: "48deg" }] },
  seaWallLeft: { position: "absolute", left: -54, top: 38, width: 190, height: 320, borderTopRightRadius: 120, borderBottomRightRadius: 120, backgroundColor: "rgba(18,111,151,0.80)", borderRightWidth: 3, borderColor: "rgba(179,231,244,0.38)" }, seaWallRight: { position: "absolute", right: -54, top: 38, width: 190, height: 320, borderTopLeftRadius: 120, borderBottomLeftRadius: 120, backgroundColor: "rgba(18,111,151,0.80)", borderLeftWidth: 3, borderColor: "rgba(179,231,244,0.38)" }, seaPath: { position: "absolute", width: 120, bottom: 62, top: 108, alignSelf: "center", backgroundColor: "rgba(196,158,95,0.48)" }, seaLight: { position: "absolute", width: 94, height: 94, borderRadius: 47, top: 70, alignSelf: "center", backgroundColor: "rgba(238,204,127,0.42)" }, foamLeft: { position: "absolute", left: 96, top: 112, width: 18, height: 184, backgroundColor: "rgba(222,245,249,0.34)" }, foamRight: { position: "absolute", right: 96, top: 112, width: 18, height: 184, backgroundColor: "rgba(222,245,249,0.34)" },
  pathRibbon: { position: "absolute", width: 76, height: 260, bottom: -52, alignSelf: "center", backgroundColor: "rgba(228,186,105,0.22)", transform: [{ perspective: 280 }, { rotateX: "50deg" }] },
  mountGlow: { position: "absolute", width: 190, height: 190, borderRadius: 95, top: 82, alignSelf: "center", backgroundColor: "rgba(227,181,90,0.10)", shadowColor: "#E3B55A", shadowOpacity: 0.85, shadowRadius: 52 }, mountPeak: { position: "absolute", width: 170, height: 170, bottom: 88, alignSelf: "center", backgroundColor: "rgba(11,9,23,0.96)", transform: [{ rotate: "45deg" }] },
  campGround: { position: "absolute", left: -10, right: -10, bottom: 74, height: 140, backgroundColor: "rgba(101,63,33,0.45)", borderTopLeftRadius: 100, borderTopRightRadius: 100 }, tentSmallA: { position: "absolute", width: 96, height: 56, left: 42, bottom: 128, backgroundColor: "rgba(82,49,37,0.85)", transform: [{ skewX: "-12deg" }] }, tentSmallB: { position: "absolute", width: 88, height: 52, right: 48, bottom: 118, backgroundColor: "rgba(82,49,37,0.82)", transform: [{ skewX: "10deg" }] }, calfGlow: { position: "absolute", width: 130, height: 130, borderRadius: 65, top: 100, alignSelf: "center", backgroundColor: "rgba(231,176,64,0.16)" }, calfSymbol: { position: "absolute", top: 132, alignSelf: "center" },
  gateWall: { position: "absolute", left: 32, right: 32, bottom: 90, height: 126, backgroundColor: "rgba(102,75,49,0.75)", borderTopLeftRadius: 10, borderTopRightRadius: 10 }, gateArch: { position: "absolute", width: 82, height: 116, borderTopLeftRadius: 42, borderTopRightRadius: 42, bottom: 90, alignSelf: "center", backgroundColor: "rgba(11,9,24,0.88)" },
  khWater: { position: "absolute", left: 0, right: 0, bottom: 72, height: 150, backgroundColor: "rgba(9,76,91,0.70)" }, khBoat: { position: "absolute", bottom: 130, alignSelf: "center" }, khMoon: { position: "absolute", width: 58, height: 58, borderRadius: 29, right: 52, top: 54, backgroundColor: "rgba(225,219,188,0.70)" },
  treasureGround: { position: "absolute", left: -10, right: -10, bottom: 70, height: 130, backgroundColor: "rgba(87,54,28,0.50)", borderTopLeftRadius: 120, borderTopRightRadius: 120 }, chest: { position: "absolute", width: 146, height: 92, bottom: 118, alignSelf: "center", borderRadius: 12, backgroundColor: "#6B3E29", borderWidth: 2, borderColor: "#C18B45" }, chestBand: { position: "absolute", width: 22, top: 0, bottom: 0, alignSelf: "center", backgroundColor: "rgba(216,163,76,0.72)" }, coinA: { position: "absolute", width: 26, height: 26, borderRadius: 13, bottom: 106, left: 82, backgroundColor: "#D9A94F" }, coinB: { position: "absolute", width: 22, height: 22, borderRadius: 11, bottom: 92, right: 92, backgroundColor: "#D9A94F" }, coinC: { position: "absolute", width: 18, height: 18, borderRadius: 9, bottom: 116, right: 66, backgroundColor: "#D9A94F" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.993 }] },
});
