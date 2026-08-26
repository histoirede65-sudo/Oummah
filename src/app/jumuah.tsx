import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { isFriday, loadJumuahProgress, saveJumuahProgress } from "../features/jumuah/JumuahService";

type Item = { id: string; title: string; detail: string; source: string; icon: keyof typeof Ionicons.glyphMap; congrats: string; action?: () => void };
const BASE_ITEMS: Omit<Item, "action">[] = [
  { id: "ghusl", title: "Faire le ghusl", detail: "Se purifier et se préparer pour la prière du vendredi.", source: "Sahih Muslim 846b, 850a", icon: "water-outline", congrats: "Mā shā’ Allah — une belle préparation pour ce jour béni." },
  { id: "prepare", title: "Se préparer avec soin", detail: "Porter de beaux vêtements et utiliser du parfum lorsque cela s’applique.", source: "Sunan Abi Dawud 343 · Hasan", icon: "shirt-outline", congrats: "Qu’Allah embellisse aussi ton cœur en ce vendredi." },
  { id: "kahf", title: "Lire Sourate Al-Kahf", detail: "Consacrer un moment à la récitation et à la méditation de la sourate.", source: "Al-Bayhaqi / al-Darimi — vertu rapportée du vendredi", icon: "book-outline", congrats: "Mā shā’ Allah — qu’Allah fasse du Coran une lumière pour toi." },
  { id: "salawat", title: "Multiplier les prières sur le Prophète ﷺ", detail: "Augmenter les ṣalawāt particulièrement en ce jour.", source: "Sunan Abi Dawud 1047 · Sahih", icon: "heart-outline", congrats: "Allāhumma ṣalli wa sallim ‘alā nabiyyinā Muḥammad ﷺ." },
  { id: "early", title: "Se rendre tôt à la mosquée", detail: "Si tu assistes à la Jumu‘a, arriver suffisamment tôt sans gêner les fidèles.", source: "Sahih Muslim 850a", icon: "business-outline", congrats: "Belle intention — qu’Allah récompense chacun de tes pas." },
  { id: "khutbah", title: "Écouter attentivement la khutbah", detail: "Si tu y assistes, garder le silence et prêter attention au sermon.", source: "Sunan Abi Dawud 343 · Hasan", icon: "ear-outline", congrats: "Mā shā’ Allah — un moment d’écoute et de rappel accompli." },
  { id: "dua", title: "Multiplier les invocations", detail: "Profiter du vendredi pour invoquer Allah et rechercher l’heure d’exaucement.", source: "Sahih al-Bukhari 935 · Sahih Muslim 852", icon: "sparkles-outline", congrats: "Āmīn — qu’Allah accueille tes invocations et t’accorde le meilleur." },
];

export default function JumuahScreen() {
  const [completed, setCompleted] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const toast = useRef(new Animated.Value(0)).current;
  const friday = isFriday();
  useEffect(() => { void loadJumuahProgress().then((p) => setCompleted(p.completed)); }, []);
  const items = useMemo<Item[]>(() => BASE_ITEMS.map((item) => ({ ...item, action: item.id === "kahf" ? () => router.push({ pathname: "/surah/[id]", params: { id: "18" } }) : undefined })), []);
  const progress = completed.length / items.length;

  const celebrate = (text: string) => {
    setMessage(text); toast.setValue(0);
    Animated.sequence([Animated.spring(toast, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }), Animated.delay(1800), Animated.timing(toast, { toValue: 0, duration: 280, useNativeDriver: true })]).start(({ finished }) => { if (finished) setMessage(null); });
  };
  const toggle = async (item: Item) => {
    const done = completed.includes(item.id);
    const next = done ? completed.filter((id) => id !== item.id) : [...completed, item.id];
    setCompleted(next); await saveJumuahProgress(next);
    if (!done) celebrate(next.length === items.length ? "Mā shā’ Allah ✨ Ta Djoumou’a est complète. Qu’Allah accepte tes œuvres." : item.congrats);
  };

  return <SafeAreaView style={styles.safe} edges={["top"]}>
    <LinearGradient colors={["#080713", "#120A20", "#080713"]} style={StyleSheet.absoluteFill} />
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={21} color={colors.goldLight}/></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>VOTRE VENDREDI</Text><Text style={styles.headerTitle}>Djoumou’a</Text></View><View style={styles.headerSpacer}/></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <LinearGradient colors={["rgba(93,43,115,0.48)", "rgba(200,148,58,0.12)", "rgba(23,16,38,0.96)"]} style={styles.hero}>
        <Text style={styles.arabic}>الجمعة</Text><Text style={styles.heroTitle}>Un vendredi qui compte</Text><Text style={styles.heroText}>Avance à ton rythme. Chaque geste coché est un rappel, pas une course à la performance.</Text>
        {!friday ? <View style={styles.offday}><Ionicons name="calendar-outline" size={15} color={colors.goldLight}/><Text style={styles.offdayText}>La checklist se réactive chaque vendredi.</Text></View> : null}
      </LinearGradient>
      <View style={styles.progressCard}><View style={styles.progressTop}><Text style={styles.progressLabel}>MON PARCOURS</Text><Text style={styles.progressCount}>{completed.length} / {items.length}</Text></View><View style={styles.track}><LinearGradient colors={[colors.goldDark, colors.goldLight]} style={[styles.fill, { width: `${Math.max(2, progress * 100)}%` }]} /></View><Text style={styles.progressText}>{completed.length === items.length ? "Mā shā’ Allah, tout est accompli." : completed.length === 0 ? `${items.length} actions à accomplir.` : `${items.length - completed.length} action${items.length - completed.length > 1 ? "s" : ""} restante${items.length - completed.length > 1 ? "s" : ""}.`}</Text></View>
      <Text style={styles.sectionTitle}>Les essentiels de ce vendredi</Text>
      <Text style={styles.sectionIntro}>Des pratiques rapportées dans les sources, présentées avec leur contexte.</Text>
      {items.map((item) => { const done = completed.includes(item.id); return <View key={item.id} style={[styles.item, done && styles.itemDone]}><Pressable accessibilityRole="checkbox" accessibilityState={{ checked: done }} onPress={() => void toggle(item)} style={[styles.check, done && styles.checkDone]}>{done ? <Ionicons name="checkmark" size={18} color="#160D22"/> : null}</Pressable><View style={styles.itemCopy}><Text style={[styles.itemTitle, done && styles.itemTitleDone]}>{item.title}</Text><Text style={styles.itemDetail}>{item.detail}</Text><Text style={styles.source}>{item.source}</Text>{item.action ? <Pressable onPress={item.action} style={styles.action}><Text style={styles.actionText}>Ouvrir Al-Kahf</Text><Ionicons name="arrow-forward" size={13} color={colors.goldLight}/></Pressable> : null}</View><View style={styles.itemIcon}><Ionicons name={item.icon} size={20} color={done ? colors.success : colors.goldLight}/></View></View>; })}
      {completed.length === items.length ? <LinearGradient colors={["rgba(200,148,58,0.22)", "rgba(90,43,115,0.25)"]} style={styles.final}><Ionicons name="sparkles" size={26} color={colors.goldLight}/><Text style={styles.finalTitle}>Mā shā’ Allah</Text><Text style={styles.finalText}>Ta Djoumou’a est complète. Qu’Allah accepte tes œuvres, tes invocations et fasse de ce vendredi une lumière pour toi.</Text></LinearGradient> : null}
      <View style={styles.note}><Ionicons name="information-circle-outline" size={18} color={colors.textMuted}/><Text style={styles.noteText}>Cette checklist accompagne le vendredi. Certaines pratiques concernent particulièrement la personne qui assiste à la prière de Jumu‘a.</Text></View>
    </ScrollView>
    {message ? <Animated.View pointerEvents="none" style={[styles.toast, { opacity: toast, transform: [{ translateY: toast.interpolate({ inputRange: [0,1], outputRange: [20,0] }) }, { scale: toast.interpolate({ inputRange: [0,1], outputRange: [0.96,1] }) }] }]}><Ionicons name="checkmark-circle" size={22} color={colors.success}/><Text style={styles.toastText}>{message}</Text></Animated.View> : null}
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.background}, header:{height:68,paddingHorizontal:18,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}, back:{width:40,height:40,borderRadius:20,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(255,255,255,0.05)"},headerSpacer:{width:40,height:40}, headerCopy:{alignItems:"center"},eyebrow:{fontFamily:typography.sans,fontSize:8,fontWeight:"800",letterSpacing:1.5,color:colors.goldMuted},headerTitle:{fontFamily:typography.serifSemibold,fontSize:25,color:colors.text},content:{paddingHorizontal:18,paddingBottom:52},hero:{padding:24,borderRadius:28,borderWidth:1,borderColor:"rgba(227,181,90,0.22)",alignItems:"center",overflow:"hidden"},arabic:{fontFamily:"UthmanicHafs",fontSize:39,color:colors.goldLight,marginBottom:4},heroTitle:{fontFamily:typography.serifSemibold,fontSize:28,color:colors.text},heroText:{marginTop:8,maxWidth:310,textAlign:"center",fontFamily:typography.sans,fontSize:12.5,lineHeight:19,color:colors.textSecondary},offday:{marginTop:15,paddingHorizontal:12,paddingVertical:8,borderRadius:13,flexDirection:"row",gap:7,alignItems:"center",backgroundColor:"rgba(200,148,58,0.09)"},offdayText:{fontFamily:typography.sans,fontSize:10,color:colors.goldLight},progressCard:{marginTop:14,padding:17,borderRadius:21,borderWidth:1,borderColor:"rgba(255,255,255,0.07)",backgroundColor:"rgba(255,255,255,0.035)"},progressTop:{flexDirection:"row",justifyContent:"space-between",alignItems:"center"},progressLabel:{fontFamily:typography.sans,fontSize:8,fontWeight:"900",letterSpacing:1.3,color:colors.goldMuted},progressCount:{fontFamily:typography.serifSemibold,fontSize:18,color:colors.text},track:{marginTop:11,height:6,borderRadius:3,overflow:"hidden",backgroundColor:"rgba(255,255,255,0.07)"},fill:{height:6,borderRadius:3},progressText:{marginTop:9,fontFamily:typography.sans,fontSize:10.5,color:colors.textMuted},sectionTitle:{marginTop:25,fontFamily:typography.serifSemibold,fontSize:23,color:colors.text},sectionIntro:{marginTop:3,marginBottom:12,fontFamily:typography.sans,fontSize:11,lineHeight:17,color:colors.textMuted},item:{marginBottom:9,padding:14,borderRadius:20,borderWidth:1,borderColor:"rgba(255,255,255,0.075)",backgroundColor:"rgba(255,255,255,0.035)",flexDirection:"row",alignItems:"flex-start"},itemDone:{borderColor:"rgba(98,197,139,0.22)",backgroundColor:"rgba(98,197,139,0.055)"},check:{marginTop:2,width:28,height:28,borderRadius:9,borderWidth:1.5,borderColor:"rgba(227,181,90,0.48)",alignItems:"center",justifyContent:"center"},checkDone:{backgroundColor:colors.goldLight,borderColor:colors.goldLight},itemCopy:{flex:1,minWidth:0,marginLeft:12},itemTitle:{fontFamily:typography.serifSemibold,fontSize:17,color:colors.text},itemTitleDone:{color:"#FFF9F0"},itemDetail:{marginTop:3,fontFamily:typography.sans,fontSize:10.5,lineHeight:15.5,color:colors.textSecondary},source:{marginTop:7,fontFamily:typography.sans,fontSize:8.5,color:colors.goldMuted},itemIcon:{width:35,height:35,borderRadius:13,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(200,148,58,0.08)"},action:{alignSelf:"flex-start",marginTop:9,paddingHorizontal:10,paddingVertical:6,borderRadius:10,flexDirection:"row",gap:5,alignItems:"center",backgroundColor:"rgba(200,148,58,0.09)"},actionText:{fontFamily:typography.sans,fontSize:9,fontWeight:"700",color:colors.goldLight},final:{marginTop:8,padding:23,borderRadius:24,borderWidth:1,borderColor:"rgba(227,181,90,0.3)",alignItems:"center"},finalTitle:{marginTop:6,fontFamily:typography.serifSemibold,fontSize:27,color:colors.goldLight},finalText:{marginTop:5,textAlign:"center",fontFamily:typography.sans,fontSize:11.5,lineHeight:18,color:colors.textSecondary},note:{marginTop:16,padding:13,flexDirection:"row",gap:9,borderRadius:16,backgroundColor:"rgba(255,255,255,0.025)"},noteText:{flex:1,fontFamily:typography.sans,fontSize:9.5,lineHeight:14,color:colors.textMuted},toast:{position:"absolute",left:18,right:18,bottom:25,padding:15,borderRadius:18,borderWidth:1,borderColor:"rgba(98,197,139,0.3)",backgroundColor:"#171026",flexDirection:"row",gap:10,alignItems:"center",shadowColor:"#000",shadowOpacity:.35,shadowRadius:16,shadowOffset:{width:0,height:8}},toastText:{flex:1,fontFamily:typography.sans,fontSize:11.5,lineHeight:16,color:colors.text}
});
