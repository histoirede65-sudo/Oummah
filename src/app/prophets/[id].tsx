import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { PROPHET_STORIES } from "../../features/prophets/allProphetsData";
import { PROPHET_AUDIO_EPISODES } from "../../features/prophets/audio/prophetAudioData";
import { PROPHET_FRENCH_NAMES, PROPHETS_PREVIEW, type ProphetReference, type ProphetSourceKind } from "../../features/prophets/prophetsData";
import { loadProphetProgress, saveProphetProgress } from "../../features/prophets/prophetProgress";
import { goalProgressBridge } from "../../features/daily-goals/services/goalProgressBridge";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const SOURCE_LABELS: Record<ProphetSourceKind, string> = { QURAN: "CORAN", SUNNA: "SUNNA AUTHENTIQUE", TAFSIR: "TAFSIR" };
const PALETTES: [string, string, string][] = [
  ["#0A0818", "#2A1739", "#8A5C2E"], ["#080D1C", "#16314A", "#7A4E27"], ["#110918", "#4A202D", "#8B5E25"],
  ["#07131A", "#154B50", "#8A6630"], ["#100B20", "#322347", "#89602F"], ["#0C0A16", "#3E2025", "#A16A2E"],
];
const ICONS: (keyof typeof Ionicons.glyphMap)[] = ["book-outline","moon-outline","flame-outline","water-outline","sparkles-outline","trail-sign-outline","shield-checkmark-outline","sunny-outline"];

function SourceChip({ kind }: { kind: ProphetSourceKind }) {
  const icon = kind === "QURAN" ? "book-outline" : kind === "SUNNA" ? "checkmark-circle-outline" : "library-outline";
  return <View style={styles.sourceChip}><Ionicons name={icon} size={13} color={colors.goldLight} /><Text style={styles.sourceChipText}>{SOURCE_LABELS[kind]}</Text></View>;
}
function ReferenceCard({ reference }: { reference: ProphetReference }) {
  const open = () => reference.surahId && router.push(`/surah/${reference.surahId}?verse=${reference.verse ?? 1}` as Href);
  return <Pressable disabled={!reference.surahId} onPress={open} style={({ pressed }) => [styles.referenceCard, pressed && styles.pressed]}>
    <View style={styles.referenceHeader}><SourceChip kind={reference.kind} /><Text style={styles.referenceLabel}>{reference.label}</Text></View>
    <Text style={styles.referenceNote}>{reference.note}</Text>
    {reference.surahId ? <View style={styles.referenceAction}><Ionicons name="play-circle-outline" size={17} color={colors.goldLight} /><Text style={styles.referenceActionText}>Ouvrir le passage dans le Coran</Text><Ionicons name="arrow-forward" size={14} color={colors.goldLight} /></View> : null}
  </Pressable>;
}

export default function ProphetStoryScreen() {
  const params = useLocalSearchParams<{ id: string; chapter?: string }>();
  const story = PROPHET_STORIES[params.id];
  const preview = PROPHETS_PREVIEW.find((item) => item.id === params.id);
  const initialIndex = story ? Math.min(story.chapters.length - 1, Math.max(0, Number(params.chapter ?? 0) || 0)) : 0;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [showIntro, setShowIntro] = useState(true);
  const [completed, setCompleted] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heroScale = useRef(new Animated.Value(1)).current;
  const heroTextOpacity = useRef(new Animated.Value(1)).current;
  const heroTextTranslateY = useRef(new Animated.Value(0)).current;
  const storyOpacity = useRef(new Animated.Value(1)).current;
  const storyTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!story) return;
    loadProphetProgress(story.id).then((p) => setCompleted(p.completed));
  }, [story?.id]);

  useEffect(() => () => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
  }, []);

  if (!story) return <SafeAreaView style={styles.missing}><Text style={styles.missingText}>Histoire introuvable.</Text></SafeAreaView>;
  const chapter = story.chapters[activeIndex];
  const progress = completed.length / story.chapters.length;
  const palette = PALETTES[activeIndex % PALETTES.length];
  const icon = ICONS[activeIndex % ICONS.length];
  const done = completed.includes(chapter.id);

  const goTo = (index: number) => {
    const next = Math.min(story.chapters.length - 1, Math.max(0, index));
    if (next === activeIndex || isTransitioning) return;
    setIsTransitioning(true);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    heroScale.setValue(1.035);
    const nextImage = story.chapters[next].image;
    const nextImageUri = nextImage ? Image.resolveAssetSource(nextImage)?.uri : null;
    const preload = nextImageUri ? Image.prefetch(nextImageUri) : Promise.resolve(true);
    transitionTimerRef.current = setTimeout(async () => {
      await preload.catch(() => false);
      setActiveIndex(next);
      saveProphetProgress(story.id, { completed, lastChapterId: story.chapters[next].id });
      heroTextOpacity.setValue(0);
      heroTextTranslateY.setValue(8);
      storyOpacity.setValue(0);
      storyTranslateY.setValue(8);
      Animated.parallel([
        Animated.timing(heroScale, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(45),
          Animated.parallel([
            Animated.timing(heroTextOpacity, { toValue: 1, duration: 190, useNativeDriver: true }),
            Animated.timing(heroTextTranslateY, { toValue: 0, duration: 190, useNativeDriver: true }),
          ]),
        ]),
        Animated.sequence([
          Animated.delay(110),
          Animated.parallel([
            Animated.timing(storyOpacity, { toValue: 1, duration: 190, useNativeDriver: true }),
            Animated.timing(storyTranslateY, { toValue: 0, duration: 190, useNativeDriver: true }),
          ]),
        ]),
      ]).start(() => setIsTransitioning(false));
    }, 120);
  };

  const toggleComplete = async () => {
    const next = done ? completed.filter((id) => id !== chapter.id) : [...completed, chapter.id];
    setCompleted(next);
    await saveProphetProgress(story.id, { completed: next, lastChapterId: chapter.id });
    // Objectif « Une histoire de prophète » : un chapitre lu jusqu'au bout.
    void goalProgressBridge.setEvidence("prophet_story", `read:${story.id}:${chapter.id}`, !done).catch(() => undefined);
  };

  return <LinearGradient colors={[colors.background, "#090715", colors.background]} style={styles.screen}>
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => showIntro ? router.back() : setShowIntro(true)} style={styles.backButton}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
        <View style={styles.headerCopy}><Text style={styles.headerEyebrow}>HISTOIRES DES PROPHÈTES</Text><Text style={styles.headerTitle}>{story.name} <Text style={styles.headerArabic}>عليه السلام</Text></Text></View>
        <View style={styles.headerSpacer} />
      </View>
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {showIntro ? (
          <>
          <View style={styles.hero}>
            {preview?.coverImage ? <Image source={preview.coverImage} resizeMode="cover" style={styles.coverImage} /> : null}
            <LinearGradient colors={["rgba(7,7,18,0.02)", "rgba(8,7,19,0.22)", "rgba(8,7,19,0.78)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.heroRim} />
            <View style={styles.heroCopy}>
              <Text style={styles.introLabel}>PREMIER VOYAGE IMMERSIF</Text>
              <Text style={styles.heroTitle}>{story.name}</Text>
              {story.id !== "muhammad" ? <Text style={styles.heroFrenchName}>{PROPHET_FRENCH_NAMES[story.id] ?? story.name}</Text> : null}
              <Text style={styles.introSubtitle}>{story.summary}</Text>
              <Pressable onPress={() => setShowIntro(false)} style={({ pressed }) => [styles.introButton, pressed && styles.pressed]}>
                <Text style={styles.introButtonText}>Commencer le voyage</Text>
                <Ionicons name="arrow-forward" size={17} color={colors.background} />
              </Pressable>
            </View>
          </View>
          {PROPHET_AUDIO_EPISODES[story.id] ? (
            <Pressable
              onPress={() => router.push(`/prophets/audio/${story.id}` as Href)}
              style={({ pressed }) => [styles.audioButton, pressed && styles.pressed]}
            >
              <Ionicons name="headset-outline" size={20} color={colors.goldLight} />
              <View style={styles.audioButtonCopy}>
                <Text style={styles.audioButtonTitle}>Écouter l’histoire complète</Text>
                <Text style={styles.audioButtonSubtitle}>Récit audio immersif de {PROPHET_AUDIO_EPISODES[story.id].prophetName}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.goldLight} />
            </Pressable>
          ) : null}
          </>
        ) : (
        <>
        <Animated.View style={{ transform: [{ scale: heroScale }] }}>
        <LinearGradient colors={palette} style={styles.hero}>
          {chapter.image ? <Image source={chapter.image} resizeMode="cover" style={styles.coverImage} /> : null}
          <LinearGradient colors={["rgba(7,7,18,0.08)", "rgba(8,7,19,0.38)", "rgba(8,7,19,0.90)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.heroRim} />
          <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 3, opacity: heroTextOpacity, transform: [{ translateY: heroTextTranslateY }] }]}>
          <View style={styles.heroCopy}>
            <Text style={styles.chapterNumber}>{String(chapter.index).padStart(2,"0")} / {String(story.chapters.length).padStart(2,"0")}</Text>
            <Text style={styles.heroTitle}>{chapter.title}</Text>
            <Text style={styles.heroSubtitle}>{chapter.subtitle}</Text>
            <View style={styles.atmosphereRow}><Ionicons name="compass-outline" size={14} color={colors.goldLight} /><Text style={styles.atmosphereText}>{chapter.atmosphere}</Text></View>
          </View>
          </Animated.View>
        </LinearGradient>
        </Animated.View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chapterRail}>
          {story.chapters.map((item,index)=><Pressable key={item.id} onPress={()=>goTo(index)} style={[styles.railDot,index===activeIndex&&styles.railDotActive,completed.includes(item.id)&&styles.railDotCompleted]}><Text style={[styles.railDotText,(index===activeIndex||completed.includes(item.id))&&styles.railDotTextActive]}>{item.index}</Text></Pressable>)}
        </ScrollView>

        <Animated.View style={{ opacity: storyOpacity, transform: [{ translateY: storyTranslateY }] }}>
        <View key={`story-${story.id}-${chapter.id}`} style={styles.storyCard}>
          <Text style={styles.storyEyebrow}>LE RÉCIT</Text>
          <Text style={styles.storyText}>{chapter.paragraphs.join("\n\n")}</Text>
        </View>
        </Animated.View>

        <View style={styles.sourceSection}><Text style={styles.sectionEyebrow}>REVENIR AUX SOURCES</Text><Text style={styles.sectionTitle}>Le passage au cœur de la scène</Text>{chapter.references.map((r,i)=><ReferenceCard key={`${r.label}-${i}`} reference={r} />)}</View>

        <LinearGradient colors={["rgba(227,181,90,0.08)","rgba(23,16,38,0.88)"]} style={styles.lessonCard}>
          <View style={styles.lessonIcon}><Ionicons name="bulb-outline" size={20} color={colors.goldLight}/></View><Text style={styles.lessonEyebrow}>CE QU’ON EN RETIENT</Text>
          {chapter.lessons.map((lesson,index)=><View key={index} style={styles.lessonRow}><Text style={styles.lessonNumber}>{String(index+1).padStart(2,"0")}</Text><Text style={styles.lessonText}>{lesson}</Text></View>)}
        </LinearGradient>

        <Pressable onPress={toggleComplete} style={[styles.completeButton,done&&styles.completeButtonDone]}><Ionicons name={done?"checkmark-circle":"checkmark-circle-outline"} size={25} color={done?colors.background:colors.goldLight}/><View style={styles.completeCopy}><Text style={[styles.completeTitle,done&&styles.completeTitleDone]}>{done?"Chapitre terminé":"Marquer ce chapitre comme lu"}</Text><Text style={[styles.completeSubtitle,done&&styles.completeSubtitleDone]}>{done?"Ta progression est enregistrée.":"Tu pourras reprendre ici plus tard."}</Text></View></Pressable>

        <View style={styles.globalProgressCard}><View style={styles.globalProgressHeader}><Text style={styles.globalProgressTitle}>Ton voyage avec {story.name}</Text><Text style={styles.globalProgressValue}>{completed.length}/{story.chapters.length}</Text></View><View style={styles.globalTrack}><View style={[styles.globalFill,{width:`${Math.max(2,progress*100)}%`}]} /></View></View>
        <View style={styles.navigationRow}><Pressable disabled={activeIndex===0} onPress={()=>goTo(activeIndex-1)} style={[styles.navButton,activeIndex===0&&styles.navButtonDisabled]}><Ionicons name="arrow-back" size={17} color={activeIndex===0?colors.textMuted:colors.goldLight}/><Text style={[styles.navText,activeIndex===0&&styles.navTextDisabled]}>Précédent</Text></Pressable><Pressable disabled={activeIndex===story.chapters.length-1} onPress={()=>goTo(activeIndex+1)} style={[styles.navButton,styles.navButtonNext,activeIndex===story.chapters.length-1&&styles.navButtonDisabled]}><Text style={[styles.navText,activeIndex===story.chapters.length-1&&styles.navTextDisabled]}>Suivant</Text><Ionicons name="arrow-forward" size={17} color={activeIndex===story.chapters.length-1?colors.textMuted:colors.goldLight}/></Pressable></View>
        <View style={styles.methodCard}><Ionicons name="shield-checkmark-outline" size={20} color={colors.goldLight}/><Text style={styles.methodText}>Ce récit reste volontairement limité aux éléments établis par les sources indiquées. Les images définitives seront intégrées séparément sans représenter le visage d’un prophète.</Text></View>
        </>
        )}
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}

const styles=StyleSheet.create({
  coverImage:{...StyleSheet.absoluteFill,width:"100%",height:"100%"},introLabel:{color:colors.goldLight,fontFamily:typography.sans,fontSize:11,fontWeight:"800",letterSpacing:1.4},introSubtitle:{marginTop:8,color:colors.textSecondary,fontFamily:typography.sans,fontSize:18,lineHeight:27},introButton:{marginTop:16,minHeight:48,paddingHorizontal:16,borderRadius:24,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,backgroundColor:colors.goldLight},introButtonText:{color:colors.background,fontFamily:typography.sans,fontSize:14,fontWeight:"800"},
  audioButton:{marginTop:14,minHeight:68,paddingHorizontal:16,borderRadius:24,flexDirection:"row",alignItems:"center",gap:12,borderWidth:1,borderColor:"rgba(227,181,90,0.34)",backgroundColor:"rgba(227,181,90,0.07)"},audioButtonCopy:{flex:1},audioButtonTitle:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:20,fontWeight:"800"},audioButtonSubtitle:{marginTop:3,color:colors.textMuted,fontFamily:typography.sans,fontSize:12.5},
  screen:{flex:1},safeArea:{flex:1},missing:{flex:1,alignItems:"center",justifyContent:"center",backgroundColor:colors.background},missingText:{color:colors.text},
  header:{minHeight:74,paddingHorizontal:16,flexDirection:"row",alignItems:"center",gap:10},backButton:{width:42,height:42,alignItems:"center",justifyContent:"center",borderRadius:21,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:"rgba(255,255,255,0.045)"},headerCopy:{flex:1,alignItems:"center"},headerSpacer:{width:42},headerEyebrow:{color:colors.goldLight,fontFamily:typography.sans,fontSize:9.5,fontWeight:"800",letterSpacing:1.1},headerTitle:{marginTop:2,color:colors.text,fontFamily:typography.serifSemibold,fontSize:23},headerArabic:{fontFamily:typography.arabic},
  content:{padding:16,paddingBottom:48},hero:{height:440,overflow:"hidden",borderRadius:32,borderWidth:1.2,borderColor:"rgba(227,181,90,0.42)",backgroundColor:colors.surface},stars:{...StyleSheet.absoluteFill},star:{position:"absolute",width:3,height:3,borderRadius:2,backgroundColor:"#F4D28A"},glow:{position:"absolute",width:330,height:330,borderRadius:165,top:50,left:20,backgroundColor:"rgba(235,180,90,0.11)"},heroIcon:{position:"absolute",top:120,alignSelf:"center",opacity:.78},heroRim:{position:"absolute",top:8,right:8,bottom:8,left:8,borderRadius:25,borderWidth:1,borderColor:"rgba(255,255,255,0.09)"},heroCopy:{position:"absolute",left:0,right:0,bottom:0,zIndex:4,paddingHorizontal:22,paddingTop:72,paddingBottom:42},chapterNumber:{color:colors.goldLight,fontFamily:typography.sans,fontSize:11,fontWeight:"800",letterSpacing:1.4},heroTitle:{marginTop:7,color:colors.text,fontFamily:typography.serifSemibold,fontSize:37,lineHeight:42},heroFrenchName:{marginTop:2,color:colors.textSecondary,fontFamily:typography.sans,fontSize:15,lineHeight:20},heroSubtitle:{marginTop:8,color:colors.textSecondary,fontFamily:typography.sans,fontSize:18,lineHeight:27},atmosphereRow:{marginTop:14,flexDirection:"row",alignItems:"center",gap:6},atmosphereText:{color:colors.goldLight,fontFamily:typography.sans,fontSize:14,fontWeight:"700"},
  chapterRail:{marginTop:14,paddingHorizontal:4,gap:8},railDot:{width:32,height:32,borderRadius:16,alignItems:"center",justifyContent:"center",borderWidth:1,borderColor:colors.borderSoft,backgroundColor:colors.surface},railDotActive:{borderColor:colors.goldLight,backgroundColor:"rgba(227,181,90,0.10)"},railDotCompleted:{backgroundColor:colors.goldLight,borderColor:colors.goldLight},railDotText:{color:colors.textMuted,fontFamily:typography.sans,fontSize:11.5,fontWeight:"800"},railDotTextActive:{color:colors.background},
  storyCard:{alignSelf:"stretch",overflow:"visible",marginTop:16,padding:18,borderRadius:26,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:"rgba(23,16,38,0.84)"},storyEyebrow:{color:colors.goldLight,fontFamily:typography.sans,fontSize:10.5,fontWeight:"800",letterSpacing:1.35},storyText:{marginTop:14,color:colors.textSecondary,fontFamily:typography.sans,fontSize:19,lineHeight:31},sourceSection:{marginTop:22},sectionEyebrow:{color:colors.goldLight,fontFamily:typography.sans,fontSize:10.5,fontWeight:"800",letterSpacing:1.35},sectionTitle:{marginTop:6,marginBottom:14,color:colors.text,fontFamily:typography.serifSemibold,fontSize:28,lineHeight:33},referenceCard:{marginBottom:10,padding:15,borderRadius:22,borderWidth:1,borderColor:"rgba(227,181,90,0.24)",backgroundColor:"rgba(227,181,90,0.055)"},referenceHeader:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:10},sourceChip:{flexDirection:"row",alignItems:"center",gap:5,paddingHorizontal:8,height:24,borderRadius:12,backgroundColor:"rgba(227,181,90,0.10)"},sourceChipText:{color:colors.goldLight,fontFamily:typography.sans,fontSize:9,fontWeight:"900",letterSpacing:.7},referenceLabel:{flexShrink:1,color:colors.text,fontFamily:typography.serifSemibold,fontSize:19.5,lineHeight:24,textAlign:"right"},referenceNote:{marginTop:11,color:colors.textSecondary,fontFamily:typography.sans,fontSize:16,lineHeight:25},referenceAction:{marginTop:11,flexDirection:"row",alignItems:"center",gap:6},referenceActionText:{flex:1,color:colors.goldLight,fontFamily:typography.sans,fontSize:13.5,fontWeight:"700"},lessonCard:{marginTop:12,padding:18,borderRadius:26,borderWidth:1,borderColor:"rgba(227,181,90,0.28)"},lessonIcon:{width:40,height:40,borderRadius:14,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(227,181,90,0.10)"},lessonEyebrow:{marginTop:11,color:colors.goldLight,fontFamily:typography.sans,fontSize:10.5,fontWeight:"800",letterSpacing:1},lessonRow:{marginTop:12,flexDirection:"row",gap:10},lessonNumber:{color:colors.goldMuted,fontFamily:typography.serifSemibold,fontSize:18},lessonText:{flex:1,color:colors.textSecondary,fontFamily:typography.sans,fontSize:16.5,lineHeight:25},completeButton:{marginTop:14,minHeight:72,paddingHorizontal:16,borderRadius:24,flexDirection:"row",alignItems:"center",gap:12,borderWidth:1,borderColor:"rgba(227,181,90,0.34)",backgroundColor:"rgba(227,181,90,0.07)"},completeButtonDone:{backgroundColor:colors.goldLight,borderColor:colors.goldLight},completeCopy:{flex:1},completeTitle:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:17},completeTitleDone:{color:colors.background},completeSubtitle:{marginTop:3,color:colors.textMuted,fontFamily:typography.sans,fontSize:12.5},completeSubtitleDone:{color:"rgba(8,7,19,0.72)"},globalProgressCard:{marginTop:12,padding:14,borderRadius:20,backgroundColor:"rgba(255,255,255,0.035)"},globalProgressHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},globalProgressTitle:{color:colors.textSecondary,fontFamily:typography.sans,fontSize:11.5,fontWeight:"700"},globalProgressValue:{color:colors.goldLight,fontFamily:typography.sans,fontSize:11,fontWeight:"800"},globalTrack:{marginTop:9,height:5,borderRadius:3,overflow:"hidden",backgroundColor:"rgba(255,255,255,0.10)"},globalFill:{height:5,borderRadius:3,backgroundColor:colors.goldLight},navigationRow:{marginTop:14,flexDirection:"row",gap:10},navButton:{flex:1,minHeight:48,borderRadius:22,borderWidth:1,borderColor:colors.borderSoft,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:7,backgroundColor:colors.surface},navButtonNext:{borderColor:"rgba(227,181,90,0.32)"},navButtonDisabled:{opacity:.4},navText:{color:colors.goldLight,fontFamily:typography.sans,fontSize:11.5,fontWeight:"800"},navTextDisabled:{color:colors.textMuted},methodCard:{marginTop:14,padding:14,borderRadius:20,borderWidth:1,borderColor:colors.borderSoft,flexDirection:"row",gap:10,backgroundColor:"rgba(23,16,38,0.68)"},methodText:{flex:1,color:colors.textMuted,fontFamily:typography.sans,fontSize:14,lineHeight:21},pressed:{opacity:.84}
});
