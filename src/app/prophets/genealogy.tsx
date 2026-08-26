import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Prophet = { id: string; name: string; arabic: string; note?: string };
const CHRONOLOGY: Prophet[] = [
  { id:"adam",name:"Âdam",arabic:"آدم",note:"Père de l’humanité" }, { id:"idris",name:"Idrîs",arabic:"إدريس" },
  { id:"nuh",name:"Nûh",arabic:"نوح" }, { id:"hud",name:"Hûd",arabic:"هود" }, { id:"salih",name:"Sâlih",arabic:"صالح" },
  { id:"ibrahim",name:"Ibrâhîm",arabic:"إبراهيم",note:"Une grande lignée prophétique" }, { id:"lut",name:"Lût",arabic:"لوط" },
  { id:"ismail",name:"Ismâ‘îl",arabic:"إسماعيل" }, { id:"ishaq",name:"Ishâq",arabic:"إسحاق" }, { id:"yaqub",name:"Ya‘qûb",arabic:"يعقوب" },
  { id:"yusuf",name:"Yûsuf",arabic:"يوسف" }, { id:"shuayb",name:"Shu‘ayb",arabic:"شعيب" }, { id:"ayyub",name:"Ayyûb",arabic:"أيوب" },
  { id:"dhul-kifl",name:"Dhûl-Kifl",arabic:"ذو الكفل" }, { id:"musa",name:"Mûsâ",arabic:"موسى" }, { id:"harun",name:"Hârûn",arabic:"هارون" },
  { id:"dawud",name:"Dâwûd",arabic:"داود" }, { id:"sulayman",name:"Sulaymân",arabic:"سليمان" }, { id:"ilyas",name:"Ilyâs",arabic:"إلياس" },
  { id:"al-yasa",name:"Al-Yasa‘",arabic:"اليسع" }, { id:"yunus",name:"Yûnus",arabic:"يونس" }, { id:"zakariya",name:"Zakariyyâ",arabic:"زكريا" },
  { id:"yahya",name:"Yahyâ",arabic:"يحيى" }, { id:"isa",name:"‘Îsâ",arabic:"عيسى" }, { id:"muhammad",name:"Muhammad ﷺ",arabic:"محمد",note:"Dernier des prophètes" },
];

function ProphetNode({ p, accent=false }: { p: Prophet; accent?: boolean }) {
  return <Pressable onPress={() => router.push(`/prophets/${p.id}?chapter=0` as Href)} style={({pressed})=>[styles.node,accent&&styles.nodeAccent,pressed&&styles.pressed]}>
    <View style={styles.nodeText}><Text style={styles.nodeName}>{p.name}</Text><Text style={styles.nodeArabic}>{p.arabic}</Text>{p.note?<Text style={styles.nodeNote}>{p.note}</Text>:null}</View>
    <Ionicons name="chevron-forward" size={16} color={colors.goldLight}/>
  </Pressable>;
}
function Relation({ icon="git-branch-outline", title, text, certainty="ÉTABLI" }: {icon?: keyof typeof Ionicons.glyphMap;title:string;text:string;certainty?:string}) {
  return <View style={styles.relation}><Ionicons name={icon} size={19} color={colors.goldLight}/><View style={{flex:1}}><View style={styles.relationHead}><Text style={styles.relTitle}>{title}</Text><Text style={styles.certainty}>{certainty}</Text></View><Text style={styles.relText}>{text}</Text></View></View>;
}
export default function GenealogyScreen(){
 return <LinearGradient colors={[colors.background,colors.backgroundSecondary,colors.background]} style={styles.screen}><SafeAreaView style={styles.safe}>
  <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Ionicons name="chevron-back" size={23} color={colors.text}/></Pressable><Text style={styles.headerTitle}>Arbre des Prophètes</Text><View style={{width:44}}/></View>
  <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
   <LinearGradient colors={["rgba(64,32,78,.96)","rgba(18,12,31,.99)"]} style={styles.hero}>
    <View style={styles.rootIcon}><Ionicons name="git-network-outline" size={30} color={colors.goldLight}/></View>
    <Text style={styles.kicker}>DE ÂDAM À MUHAMMAD ﷺ</Text><Text style={styles.heroTitle}>Une humanité, des lignées prophétiques</Text>
    <Text style={styles.heroText}>L’arbre commence par Âdam عليه السلام : tous les êtres humains descendent de lui. Le Coran parle ensuite de prophètes issus de la descendance d’Âdam, de ceux portés avec Nûh, puis des descendances d’Ibrâhîm et d’Israël.</Text>
    <View style={styles.adamBanner}><Text style={styles.adamArabic}>آدم</Text><View style={{flex:1}}><Text style={styles.adamTitle}>Âdam عليه السلام</Text><Text style={styles.adamText}>Racine commune de l’humanité</Text></View><Ionicons name="people" size={24} color={colors.goldLight}/></View>
   </LinearGradient>

   <View style={styles.legend}><Text style={styles.legendTitle}>COMMENT LIRE L’ARBRE</Text><Text style={styles.legendText}>Les liens père → fils ou frères ne sont affichés comme tels que lorsqu’ils sont établis. Les grandes branches de descendance sont signalées sans inventer les générations manquantes. L’ordre ci-dessous est chronologique indicatif : le Coran ne donne pas une datation complète des 25 prophètes.</Text></View>

   <Text style={styles.sectionTitle}>La grande lignée</Text><Text style={styles.sectionIntro}>Les 25 prophètes du module, d’Âdam à Muhammad ﷺ. Appuie sur un nom pour ouvrir son histoire.</Text>
   <View style={styles.timeline}>{CHRONOLOGY.map((p,i)=><View key={p.id} style={styles.timelineRow}><View style={styles.rail}><View style={[styles.dot,(p.id==="adam"||p.id==="ibrahim"||p.id==="muhammad")&&styles.dotAccent]}/>{i<CHRONOLOGY.length-1?<View style={styles.railLine}/>:null}</View><View style={{flex:1}}><ProphetNode p={p} accent={p.id==="adam"||p.id==="ibrahim"||p.id==="muhammad"}/></View></View>)}</View>

   <Text style={styles.sectionTitle}>Liens de parenté établis</Text><Text style={styles.sectionIntro}>Cette vue complète la chronologie en montrant les liens familiaux importants sans transformer une succession prophétique en fausse filiation.</Text>
   <View style={styles.relations}>
    <Relation title="Ibrâhîm → Ismâ‘îl" text="Père et fils. La branche d’Ismâ‘îl conduit, après de nombreuses générations non affichées, à Muhammad ﷺ."/>
    <Relation title="Ibrâhîm → Ishâq → Ya‘qûb" text="Ishâq est fils d’Ibrâhîm ; Ya‘qûb est fils d’Ishâq. Ya‘qûb est aussi appelé Israël."/>
    <Relation title="Ya‘qûb → Yûsuf" text="Yûsuf est l’un des fils de Ya‘qûb عليهما السلام."/>
    <Relation icon="people-outline" title="Mûsâ ↔ Hârûn" text="Deux frères et deux prophètes, envoyés ensemble face à Pharaon."/>
    <Relation title="Dâwûd → Sulaymân" text="Père et fils ; Sulaymân hérita de Dâwûd."/>
    <Relation title="Zakariyyâ → Yahyâ" text="Père et fils. La naissance de Yahyâ est annoncée à Zakariyyâ dans le Coran."/>
    <Relation icon="woman-outline" title="Maryam → ‘Îsâ" text="Mère et fils. ‘Îsâ عليه السلام naît miraculeusement sans père."/>
    <Relation icon="people-outline" title="Yahyâ ↔ ‘Îsâ" text="Ils appartiennent à la même famille pieuse autour de la maison de ‘Imrân. Le lien précis de cousins est rapporté dans la tradition exégétique ; le Coran établit surtout la proximité de leurs familles et le rôle de Zakariyyâ auprès de Maryam." certainty="LIEN FAMILIAL"/>
   </View>

   <LinearGradient colors={["rgba(227,181,90,.10)","rgba(23,16,38,.86)"]} style={styles.branchCard}><Text style={styles.branchKicker}>BRANCHE D’IBRÂHÎM</Text><Text style={styles.branchBig}>Ibrâhîm</Text><View style={styles.fork}><View style={styles.forkCol}><Text style={styles.forkName}>Ismâ‘îl</Text><Text style={styles.forkArrow}>↓</Text><Text style={styles.unknown}>générations intermédiaires</Text><Text style={styles.forkArrow}>↓</Text><Text style={styles.forkEnd}>Muhammad ﷺ</Text></View><View style={styles.forkDivider}/><View style={styles.forkCol}><Text style={styles.forkName}>Ishâq</Text><Text style={styles.forkArrow}>↓</Text><Text style={styles.forkName}>Ya‘qûb / Israël</Text><Text style={styles.forkArrow}>↓</Text><Text style={styles.unknown}>grande branche des Banû Isrâ’îl</Text></View></View></LinearGradient>

   <View style={styles.sources}><Text style={styles.sourceTitle}>REPÈRES DE SOURCES</Text><Text style={styles.sourceText}>Coran 19:58 — descendants d’Âdam, de ceux portés avec Nûh, d’Ibrâhîm et d’Israël.</Text><Text style={styles.sourceText}>Coran 3:33–37 — famille de ‘Imrân, Maryam et prise en charge par Zakariyyâ.</Text><Text style={styles.sourceText}>Coran 6:84–86 ; 29:27 — prophètes dans la descendance d’Ibrâhîm.</Text><Text style={styles.sourceText}>Sahih Muslim 2365 — unité de la mission prophétique et absence de prophète entre ‘Îsâ et Muhammad ﷺ.</Text></View>
  </ScrollView>
 </SafeAreaView></LinearGradient>;
}
const styles=StyleSheet.create({
 screen:{flex:1},safe:{flex:1},header:{minHeight:74,paddingHorizontal:16,flexDirection:"row",alignItems:"center"},back:{width:44,height:44,borderRadius:22,borderWidth:1,borderColor:colors.borderSoft,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(255,255,255,.04)"},headerTitle:{flex:1,textAlign:"center",color:colors.text,fontFamily:typography.serifSemibold,fontSize:22},content:{padding:16,paddingBottom:70},hero:{padding:23,borderRadius:30,borderWidth:1,borderColor:"rgba(227,181,90,.32)"},rootIcon:{width:54,height:54,borderRadius:19,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(227,181,90,.10)",borderWidth:1,borderColor:"rgba(227,181,90,.18)"},kicker:{marginTop:17,color:colors.goldLight,fontSize:9,fontWeight:"900",letterSpacing:1.4},heroTitle:{marginTop:8,color:colors.text,fontFamily:typography.serifSemibold,fontSize:30,lineHeight:36},heroText:{marginTop:10,color:colors.textSecondary,fontSize:13.5,lineHeight:21},adamBanner:{marginTop:19,padding:14,borderRadius:20,flexDirection:"row",alignItems:"center",gap:12,backgroundColor:"rgba(8,7,19,.44)",borderWidth:1,borderColor:"rgba(227,181,90,.22)"},adamArabic:{color:colors.goldLight,fontFamily:typography.arabic,fontSize:28},adamTitle:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:17},adamText:{marginTop:2,color:colors.textMuted,fontSize:10.5},legend:{marginTop:13,padding:15,borderRadius:20,backgroundColor:"rgba(23,16,38,.78)",borderWidth:1,borderColor:colors.borderSoft},legendTitle:{color:colors.goldLight,fontSize:8.5,fontWeight:"900",letterSpacing:1.1},legendText:{marginTop:7,color:colors.textSecondary,fontSize:11.5,lineHeight:18},sectionTitle:{marginTop:28,color:colors.text,fontFamily:typography.serifSemibold,fontSize:25},sectionIntro:{marginTop:6,marginBottom:13,color:colors.textSecondary,fontSize:12.5,lineHeight:19},timeline:{paddingRight:2},timelineRow:{flexDirection:"row",gap:10},rail:{width:20,alignItems:"center"},dot:{marginTop:26,width:8,height:8,borderRadius:4,backgroundColor:colors.border},dotAccent:{width:12,height:12,borderRadius:6,backgroundColor:colors.goldLight,shadowColor:colors.goldLight,shadowOpacity:.35,shadowRadius:7},railLine:{width:1,flex:1,minHeight:58,backgroundColor:"rgba(227,181,90,.22)"},node:{minHeight:66,marginBottom:8,paddingHorizontal:15,paddingVertical:11,borderRadius:20,borderWidth:1,borderColor:"rgba(227,181,90,.17)",backgroundColor:"rgba(23,16,38,.88)",flexDirection:"row",alignItems:"center",gap:10},nodeAccent:{borderColor:"rgba(227,181,90,.48)",backgroundColor:"rgba(227,181,90,.075)"},nodeText:{flex:1},nodeName:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:17},nodeArabic:{marginTop:1,color:colors.textMuted,fontFamily:typography.arabic,fontSize:15},nodeNote:{marginTop:3,color:colors.goldLight,fontSize:9,fontWeight:"700"},relations:{gap:9},relation:{padding:14,borderRadius:18,flexDirection:"row",gap:10,backgroundColor:"rgba(23,16,38,.82)",borderWidth:1,borderColor:"rgba(227,181,90,.14)"},relationHead:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",gap:8},relTitle:{flex:1,color:colors.text,fontWeight:"800",fontSize:12.5},certainty:{color:colors.goldLight,fontSize:7.5,fontWeight:"900",letterSpacing:.8},relText:{marginTop:4,color:colors.textSecondary,fontSize:11.5,lineHeight:17},branchCard:{marginTop:22,padding:18,borderRadius:25,borderWidth:1,borderColor:"rgba(227,181,90,.25)"},branchKicker:{color:colors.goldLight,fontSize:8.5,fontWeight:"900",letterSpacing:1.2,textAlign:"center"},branchBig:{marginTop:6,color:colors.text,fontFamily:typography.serifSemibold,fontSize:24,textAlign:"center"},fork:{marginTop:15,flexDirection:"row"},forkCol:{flex:1,alignItems:"center",paddingHorizontal:6},forkDivider:{width:1,backgroundColor:"rgba(227,181,90,.20)"},forkName:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:15,textAlign:"center"},forkArrow:{color:colors.goldLight,fontSize:15,marginVertical:4},forkEnd:{color:colors.goldLight,fontFamily:typography.serifSemibold,fontSize:15,textAlign:"center"},unknown:{color:colors.textMuted,fontSize:9.5,lineHeight:14,textAlign:"center"},sources:{marginTop:22,padding:17,borderRadius:22,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:"rgba(23,16,38,.75)"},sourceTitle:{color:colors.goldLight,fontSize:9,fontWeight:"900",letterSpacing:1.1},sourceText:{marginTop:7,color:colors.textSecondary,fontSize:11.5,lineHeight:18},pressed:{opacity:.82,transform:[{scale:.992}]}
});
