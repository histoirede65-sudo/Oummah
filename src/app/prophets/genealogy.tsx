import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { useI18n } from "../../i18n";
import { typography } from "../../theme/typography";

// English for this screen; French stays the source text.
const GENEALOGY_EN: Record<string, string> = {
  "Père de l’humanité": "Father of humanity",
  "Lien généalogique précis non affirmé": "Exact lineage not asserted",
  "Après le Déluge": "After the Flood",
  "Peuple de ‘Âd": "People of ‘Âd",
  "Peuple de Thamûd": "People of Thamûd",
  "Grande lignée prophétique": "Great prophetic line",
  "Contemporain d’Ibrâhîm": "Contemporary of Ibrâhîm",
  "Descendance lointaine d’Ismâ‘îl": "Distant descendant of Ismâ‘îl",
  "Ya‘qûb / Israël": "Ya‘qûb / Israel",
  "Parenté précise non affichée": "Exact kinship not shown",
  "Grande branche issue de Ya‘qûb": "Great branch descended from Ya‘qûb",
  "Lignée précise non affichée": "Exact lineage not shown",
  "Mère de ‘Îsâ": "Mother of ‘Îsâ",
  "Le Coran donne les grandes branches": "The Quran gives the main branches",
  "Maryam 19:58 distingue les descendants d’Âdam, ceux liés à Nûh, puis les descendances d’Ibrâhîm et d’Israël. C’est la charpente générale retenue ici.": "Maryam 19:58 distinguishes the descendants of Âdam, those linked to Nûh, then the descendants of Ibrâhîm and Israel. This is the general framework used here.",
  "Coran 19:58": "Quran 19:58",
  "Une chaîne donnée par le Prophète ﷺ": "A chain given by the Prophet ﷺ",
  "Le Prophète ﷺ nomme explicitement Yûsuf fils de Ya‘qûb, fils d’Ishâq, fils d’Ibrâhîm. Cette branche est donc affichée comme filiation directe.": "The Prophet ﷺ explicitly names Yûsuf son of Ya‘qûb, son of Ishâq, son of Ibrâhîm. This branch is therefore shown as direct descent.",
  "La lignée de Muhammad ﷺ": "The lineage of Muhammad ﷺ",
  "Le Prophète ﷺ a indiqué qu’Allah a choisi Kinâna parmi les descendants d’Ismâ‘îl, puis Quraysh, Banû Hâshim, puis lui-même. Les générations intermédiaires ne sont pas inventées dans l’arbre.": "The Prophet ﷺ said that Allah chose Kinâna among the descendants of Ismâ‘îl, then Quraysh, Banû Hâshim, then himself. The generations in between are not invented in the tree.",
  "Dâwûd et Sulaymân": "Dâwûd and Sulaymân",
  "Le Prophète ﷺ dit « Sulaymân fils de Dâwûd » dans un hadith authentique. Leur lien père-fils est donc affiché comme direct.": "The Prophet ﷺ says “Sulaymân son of Dâwûd” in an authentic hadith. Their father-son link is therefore shown as direct.",
  "Arbre des Prophètes": "Tree of the Prophets",
  "Explore les lignées et ouvre chaque histoire": "Explore the lineages and open each story",
  "père / fils établi": "established father / son",
  "descendance lointaine": "distant descent",
  "repère de branche": "branch marker",
  "Les textes qui fondent cet arbre": "The texts this tree is based on",
  "Coran et hadiths authentiques d’abord ; les chaînes non établies ne sont pas complétées.": "Quran and authentic hadiths first; unestablished chains are not filled in.",
  "L’arbre n’invente pas les générations absentes. Un trait clair indique une filiation directe établie ; un trait plus discret signale seulement une grande descendance ou un repère traditionnel.": "The tree does not invent missing generations. A bright line shows established direct descent; a fainter line only indicates broad descent or a traditional marker.",
  "AUTRES PROPHÈTES DU MODULE": "OTHER PROPHETS IN THIS SECTION",
  "Leur lien de parenté exact avec cette branche n’est pas affiché lorsqu’il n’est pas suffisamment établi.": "Their exact kinship with this branch is not shown when it is not sufficiently established.",
  "frères": "brothers",
  "REPÈRES & SOURCES": "LANDMARKS & SOURCES",
  "Coran 14:39 : Ibrâhîm remercie Allah de lui avoir accordé Ismâ‘îl et Ishâq.": "Quran 14:39: Ibrâhîm thanks Allah for granting him Ismâ‘îl and Ishâq.",
  "Coran 12:6 + Sahih al-Bukhari 3382/3390 : Ibrâhîm → Ishâq → Ya‘qûb → Yûsuf.": "Quran 12:6 + Sahih al-Bukhari 3382/3390: Ibrâhîm → Ishâq → Ya‘qûb → Yûsuf.",
  "Sahih Muslim 2276 : Muhammad ﷺ appartient à Banû Hâshim, issus de Quraysh, issus de Kinâna, parmi les descendants d’Ismâ‘îl.": "Sahih Muslim 2276: Muhammad ﷺ belongs to Banû Hâshim, from Quraysh, from Kinâna, among the descendants of Ismâ‘îl.",
  "Sahih al-Bukhari 3424 : Sulaymân est explicitement appelé fils de Dâwûd.": "Sahih al-Bukhari 3424: Sulaymân is explicitly called the son of Dâwûd.",
  "Coran 19:58, 29:27 et 6:84–86 : grandes descendances prophétiques. Lorsque la parenté exacte n’est pas établie par un texte sûr, l’arbre n’ajoute pas de lien direct.": "Quran 19:58, 29:27 and 6:84–86: the great prophetic lines of descent. When exact kinship is not established by a reliable text, the tree adds no direct link.",
};


type NodeKind = "prophet" | "family" | "group";
type TreeNode = { id: string; name: string; arabic?: string; x: number; y: number; w?: number; kind?: NodeKind; note?: string };
type LinkKind = "direct" | "distant" | "family";
type TreeLink = { from: string; to: string; kind: LinkKind };

const BASE_W = 1040;
const BASE_H = 1510;
const NODE_H = 74;

const NODES: TreeNode[] = [
  { id:"adam",name:"Âdam",arabic:"آدم",x:430,y:35,note:"Père de l’humanité" },
  { id:"idris",name:"Idrîs",arabic:"إدريس",x:430,y:145,note:"Lien généalogique précis non affirmé" },
  { id:"nuh",name:"Nûh",arabic:"نوح",x:430,y:255,note:"Après le Déluge" },

  { id:"hud",name:"Hûd",arabic:"هود",x:80,y:375,note:"Peuple de ‘Âd" },
  { id:"salih",name:"Sâlih",arabic:"صالح",x:80,y:485,note:"Peuple de Thamûd" },
  { id:"ibrahim",name:"Ibrâhîm",arabic:"إبراهيم",x:430,y:425,w:190,note:"Grande lignée prophétique" },
  { id:"lut",name:"Lût",arabic:"لوط",x:760,y:425,note:"Contemporain d’Ibrâhîm" },
  { id:"shuayb",name:"Shu‘ayb",arabic:"شعيب",x:80,y:595,note:"Madyan" },

  { id:"ismail",name:"Ismâ‘îl",arabic:"إسماعيل",x:300,y:570,w:175 },
  { id:"ishaq",name:"Ishâq",arabic:"إسحاق",x:560,y:570,w:175 },
  { id:"muhammad",name:"Muhammad ﷺ",arabic:"محمد",x:220,y:810,w:210,note:"Descendance lointaine d’Ismâ‘îl" },
  { id:"yaqub",name:"Ya‘qûb / Israël",arabic:"يعقوب",x:560,y:690,w:190 },
  { id:"yusuf",name:"Yûsuf",arabic:"يوسف",x:700,y:810,w:175 },
  { id:"ayyub",name:"Ayyûb",arabic:"أيوب",x:850,y:690,note:"Parenté précise non affichée" },
  { id:"dhul-kifl",name:"Dhûl-Kifl",arabic:"ذو الكفل",x:850,y:810,note:"Parenté précise non affichée" },

  { id:"banu-israil",name:"Banû Isrâ’îl",x:515,y:920,w:285,kind:"group",note:"Grande branche issue de Ya‘qûb" },
  { id:"musa",name:"Mûsâ",arabic:"موسى",x:390,y:1040,w:175 },
  { id:"harun",name:"Hârûn",arabic:"هارون",x:610,y:1040,w:175 },
  { id:"dawud",name:"Dâwûd",arabic:"داود",x:160,y:1160,w:175 },
  { id:"sulayman",name:"Sulaymân",arabic:"سليمان",x:160,y:1280,w:175 },
  { id:"ilyas",name:"Ilyâs",arabic:"إلياس",x:80,y:705,w:175,note:"Lignée précise non affichée" },
  { id:"al-yasa",name:"Al-Yasa‘",arabic:"اليسع",x:80,y:815,w:175,note:"Lignée précise non affichée" },
  { id:"yunus",name:"Yûnus",arabic:"يونس",x:80,y:925,w:175,note:"Lignée précise non affichée" },
  { id:"zakariya",name:"Zakariyyâ",arabic:"زكريا",x:820,y:1040,w:175 },
  { id:"yahya",name:"Yahyâ",arabic:"يحيى",x:820,y:1160,w:175 },
  { id:"maryam",name:"Maryam",arabic:"مريم",x:820,y:1280,w:175,kind:"family",note:"Mère de ‘Îsâ" },
  { id:"isa",name:"‘Îsâ",arabic:"عيسى",x:820,y:1400,w:175 },
];

const LINKS: TreeLink[] = [
  {from:"adam",to:"idris",kind:"distant"},{from:"idris",to:"nuh",kind:"distant"},
  {from:"nuh",to:"ibrahim",kind:"distant"},
  {from:"ibrahim",to:"ismail",kind:"direct"},{from:"ibrahim",to:"ishaq",kind:"direct"},
  {from:"ismail",to:"muhammad",kind:"distant"},{from:"ishaq",to:"yaqub",kind:"direct"},{from:"yaqub",to:"yusuf",kind:"direct"},
  {from:"yaqub",to:"banu-israil",kind:"distant"},{from:"banu-israil",to:"musa",kind:"distant"},{from:"banu-israil",to:"harun",kind:"distant"},
  {from:"banu-israil",to:"dawud",kind:"distant"},{from:"dawud",to:"sulayman",kind:"direct"},
  {from:"banu-israil",to:"zakariya",kind:"distant"},{from:"banu-israil",to:"maryam",kind:"distant"},
  {from:"zakariya",to:"yahya",kind:"direct"},{from:"maryam",to:"isa",kind:"direct"},
];

const SIDE_PROPHETS = ["hud","salih","lut","shuayb","ilyas","al-yasa","yunus","ayyub","dhul-kifl"];

function TreeCard({ node, scale }: { node: TreeNode; scale: number }) {
  const { language } = useI18n();
  const tr = (text: string) => (language === "en" ? GENEALOGY_EN[text] ?? text : text);
  const w=(node.w??160)*scale; const h=NODE_H*scale;
  const isGroup=node.kind==="group"; const isFamily=node.kind==="family"; const isMuhammad=node.id==="muhammad";
  const clickable=node.kind!=="group" && node.id!=="maryam";
  return <Pressable disabled={!clickable} onPress={()=>clickable&&router.push(`/prophets/${node.id}?chapter=0` as Href)}
    style={({pressed})=>[styles.treeNode,{left:node.x*scale,top:node.y*scale,width:w,height:h,borderRadius:17*scale,paddingHorizontal:12*scale,paddingVertical:8*scale},isGroup&&styles.groupNode,isFamily&&styles.familyNode,isMuhammad&&styles.muhammadNode,pressed&&styles.pressed]}>
    <Text numberOfLines={1} style={[styles.treeName,{fontSize:15*scale},isGroup&&styles.groupText,isMuhammad&&styles.muhammadName]}>{tr(node.name)}</Text>
    {node.arabic?<Text style={[styles.treeArabic,{fontSize:18*scale},isMuhammad&&styles.muhammadArabic]}>{node.arabic}</Text>:null}
    {node.note?<Text numberOfLines={1} style={[styles.treeNote,{fontSize:7.8*scale},isMuhammad&&styles.muhammadNote]}>{tr(node.note)}</Text>:null}
  </Pressable>;
}

function LinkLine({ link, scale }: { link: TreeLink; scale:number }) {
  const a=NODES.find(n=>n.id===link.from)!; const b=NODES.find(n=>n.id===link.to)!;
  const aw=(a.w??160), bw=(b.w??160);
  const ax=(a.x+aw/2)*scale, ay=(a.y+NODE_H)*scale;
  const bx=(b.x+bw/2)*scale, by=b.y*scale;
  const mid=(ay+by)/2;
  const lineColor=link.kind==="direct"?"rgba(229,190,96,.88)":link.kind==="family"?"rgba(130,176,255,.72)":"rgba(229,190,96,.42)";
  const thickness=Math.max(1,2*scale);
  return <>
    <View pointerEvents="none" style={{position:"absolute",left:ax-thickness/2,top:ay,width:thickness,height:Math.max(1,mid-ay),backgroundColor:lineColor}}/>
    <View pointerEvents="none" style={{position:"absolute",left:Math.min(ax,bx),top:mid,width:Math.max(thickness,Math.abs(bx-ax)),height:thickness,backgroundColor:lineColor,opacity:link.kind==="distant"?.7:1}}/>
    <View pointerEvents="none" style={{position:"absolute",left:bx-thickness/2,top:mid,width:thickness,height:Math.max(1,by-mid),backgroundColor:lineColor}}/>
  </>;
}


const EVIDENCE = [
  {
    title:"Le Coran donne les grandes branches",
    text:"Maryam 19:58 distingue les descendants d’Âdam, ceux liés à Nûh, puis les descendances d’Ibrâhîm et d’Israël. C’est la charpente générale retenue ici.",
    ref:"Coran 19:58",
  },
  {
    title:"Une chaîne donnée par le Prophète ﷺ",
    text:"Le Prophète ﷺ nomme explicitement Yûsuf fils de Ya‘qûb, fils d’Ishâq, fils d’Ibrâhîm. Cette branche est donc affichée comme filiation directe.",
    ref:"Sahih al-Bukhari 3382 / 3390",
  },
  {
    title:"La lignée de Muhammad ﷺ",
    text:"Le Prophète ﷺ a indiqué qu’Allah a choisi Kinâna parmi les descendants d’Ismâ‘îl, puis Quraysh, Banû Hâshim, puis lui-même. Les générations intermédiaires ne sont pas inventées dans l’arbre.",
    ref:"Sahih Muslim 2276",
  },
  {
    title:"Dâwûd et Sulaymân",
    text:"Le Prophète ﷺ dit « Sulaymân fils de Dâwûd » dans un hadith authentique. Leur lien père-fils est donc affiché comme direct.",
    ref:"Sahih al-Bukhari 3424",
  },
];

export default function GenealogyScreen(){
  const { language } = useI18n();
  const tr = (text: string) => (language === "en" ? GENEALOGY_EN[text] ?? text : text);
  const [scale,setScale]=useState(.86);
  const canvas=useMemo(()=>({width:BASE_W*scale,height:BASE_H*scale}),[scale]);
  const change=(delta:number)=>setScale(v=>Math.max(.64,Math.min(1.15,Math.round((v+delta)*100)/100)));
  return <LinearGradient colors={[colors.background,colors.backgroundSecondary,colors.background]} style={styles.screen}><SafeAreaView style={styles.safe}>
    <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.back}><Ionicons name="chevron-back" size={23} color={colors.text}/></Pressable><View style={{flex:1}}><Text style={styles.headerTitle}>{tr("Arbre des Prophètes")}</Text><Text style={styles.headerSub}>{tr("Explore les lignées et ouvre chaque histoire")}</Text></View><View style={styles.zoom}><Pressable onPress={()=>change(-.08)} style={styles.zoomBtn}><Ionicons name="remove" size={18} color={colors.goldLight}/></Pressable><Text style={styles.zoomText}>{Math.round(scale*100)}%</Text><Pressable onPress={()=>change(.08)} style={styles.zoomBtn}><Ionicons name="add" size={18} color={colors.goldLight}/></Pressable></View></View>

    <View style={styles.legendBar}>
      <View style={styles.legendItem}><View style={[styles.legendLine,{backgroundColor:"rgba(229,190,96,.88)"}]}/><Text style={styles.legendSmall}>{tr("père / fils établi")}</Text></View>
      <View style={styles.legendItem}><View style={[styles.legendLine,{backgroundColor:"rgba(229,190,96,.42)"}]}/><Text style={styles.legendSmall}>{tr("descendance lointaine")}</Text></View>
      <View style={styles.legendItem}><View style={styles.legendBox}/><Text style={styles.legendSmall}>{tr("repère de branche")}</Text></View>
    </View>

    <ScrollView style={styles.vertical} contentContainerStyle={styles.verticalContent} showsVerticalScrollIndicator={false}>
      <View style={styles.evidenceSection}>
        <View style={styles.evidenceHeadingRow}><Ionicons name="book-outline" size={18} color={colors.goldLight}/><View style={{flex:1}}><Text style={styles.evidenceTitle}>{tr("Les textes qui fondent cet arbre")}</Text><Text style={styles.evidenceSubtitle}>{tr("Coran et hadiths authentiques d’abord ; les chaînes non établies ne sont pas complétées.")}</Text></View></View>
        {EVIDENCE.map((item,index)=><View key={item.ref} style={[styles.evidenceCard,index===0&&styles.evidenceCardFirst]}>
          <View style={styles.evidenceIndex}><Text style={styles.evidenceIndexText}>{index+1}</Text></View>
          <View style={{flex:1}}><Text style={styles.evidenceCardTitle}>{tr(item.title)}</Text><Text style={styles.evidenceText}>{tr(item.text)}</Text><Text style={styles.evidenceRef}>{tr(item.ref)}</Text></View>
        </View>)}
      </View>
      <View style={styles.notice}><Ionicons name="information-circle-outline" size={18} color={colors.goldLight}/><Text style={styles.noticeText}>{tr("L’arbre n’invente pas les générations absentes. Un trait clair indique une filiation directe établie ; un trait plus discret signale seulement une grande descendance ou un repère traditionnel.")}</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{paddingHorizontal:12,paddingBottom:20}}>
        <View style={[styles.canvas,{width:canvas.width,height:canvas.height}]}>
          {LINKS.map((l,i)=><LinkLine key={`${l.from}-${l.to}-${i}`} link={l} scale={scale}/>)}
          {NODES.map(n=><TreeCard key={n.id} node={n} scale={scale}/>)}
          <View style={[styles.sideLabel,{left:42*scale,top:265*scale,width:210*scale}]}><Text style={[styles.sideLabelTitle,{fontSize:10*scale}]}>{tr("AUTRES PROPHÈTES DU MODULE")}</Text><Text style={[styles.sideLabelText,{fontSize:8*scale}]}>{tr("Leur lien de parenté exact avec cette branche n’est pas affiché lorsqu’il n’est pas suffisamment établi.")}</Text></View>
          {SIDE_PROPHETS.map(id=>{const n=NODES.find(x=>x.id===id)!;return <View key={`side-${id}`} style={[styles.sideMarker,{left:(n.x-18)*scale,top:(n.y+24)*scale,width:7*scale,height:7*scale,borderRadius:4*scale}]}/>})}
          <View style={[styles.brotherLine,{left:548*scale,top:1074*scale,width:60*scale,height:2*scale}]}/>
          <Text style={[styles.brotherText,{left:540*scale,top:1082*scale,fontSize:7*scale}]}>{tr("frères")}</Text>
        </View>
      </ScrollView>
      <View style={styles.sources}><Text style={styles.sourceTitle}>{tr("REPÈRES & SOURCES")}</Text><Text style={styles.sourceText}>{tr("Coran 14:39 : Ibrâhîm remercie Allah de lui avoir accordé Ismâ‘îl et Ishâq.")}</Text><Text style={styles.sourceText}>{tr("Coran 12:6 + Sahih al-Bukhari 3382/3390 : Ibrâhîm → Ishâq → Ya‘qûb → Yûsuf.")}</Text><Text style={styles.sourceText}>{tr("Sahih Muslim 2276 : Muhammad ﷺ appartient à Banû Hâshim, issus de Quraysh, issus de Kinâna, parmi les descendants d’Ismâ‘îl.")}</Text><Text style={styles.sourceText}>{tr("Sahih al-Bukhari 3424 : Sulaymân est explicitement appelé fils de Dâwûd.")}</Text><Text style={styles.sourceText}>{tr("Coran 19:58, 29:27 et 6:84–86 : grandes descendances prophétiques. Lorsque la parenté exacte n’est pas établie par un texte sûr, l’arbre n’ajoute pas de lien direct.")}</Text></View>
    </ScrollView>
  </SafeAreaView></LinearGradient>;
}

const styles=StyleSheet.create({
  screen:{flex:1},safe:{flex:1},header:{minHeight:76,paddingHorizontal:14,flexDirection:"row",alignItems:"center",gap:10},back:{width:42,height:42,borderRadius:15,borderWidth:1,borderColor:"#2B2238",alignItems:"center",justifyContent:"center",backgroundColor:"rgba(255,255,255,.04)"},headerTitle:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:20},headerSub:{marginTop:2,color:colors.textMuted,fontSize:9.5},zoom:{flexDirection:"row",alignItems:"center",gap:5,padding:4,borderRadius:14,borderWidth:1,borderColor:"rgba(227,181,90,.20)",backgroundColor:"#151022"},zoomBtn:{width:30,height:30,borderRadius:10,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(227,181,90,.08)"},zoomText:{minWidth:34,textAlign:"center",color:colors.textSecondary,fontSize:9,fontWeight:"800"},legendBar:{marginHorizontal:14,marginBottom:8,padding:10,borderRadius:16,flexDirection:"row",flexWrap:"wrap",gap:12,backgroundColor:"#151022",borderWidth:1,borderColor:"#2B2238"},legendItem:{flexDirection:"row",alignItems:"center",gap:6},legendLine:{width:22,height:2,borderRadius:2},legendBox:{width:12,height:12,borderRadius:4,borderWidth:1,borderColor:"rgba(126,165,235,.55)",backgroundColor:"rgba(75,111,181,.12)"},legendSmall:{color:colors.textMuted,fontSize:8.5},vertical:{flex:1},verticalContent:{paddingBottom:40},evidenceSection:{marginHorizontal:14,marginBottom:10,padding:13,borderRadius:20,borderWidth:1,borderColor:"rgba(227,181,90,.24)",backgroundColor:"#151022"},evidenceHeadingRow:{flexDirection:"row",alignItems:"flex-start",gap:9,marginBottom:9},evidenceTitle:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:15},evidenceSubtitle:{marginTop:2,color:colors.textMuted,fontSize:9.5,lineHeight:14},evidenceCard:{flexDirection:"row",gap:9,paddingVertical:10,borderTopWidth:1,borderTopColor:"rgba(255,255,255,.06)"},evidenceCardFirst:{borderTopWidth:0,paddingTop:4},evidenceIndex:{marginTop:1,width:22,height:22,borderRadius:8,alignItems:"center",justifyContent:"center",backgroundColor:"rgba(227,181,90,.10)",borderWidth:1,borderColor:"rgba(227,181,90,.25)"},evidenceIndexText:{color:colors.goldLight,fontSize:9,fontWeight:"900"},evidenceCardTitle:{color:colors.textSecondary,fontSize:11,fontWeight:"800"},evidenceText:{marginTop:3,color:colors.textMuted,fontSize:10,lineHeight:15},evidenceRef:{marginTop:5,color:colors.goldLight,fontSize:9,fontWeight:"800"},notice:{marginHorizontal:14,marginBottom:10,padding:12,borderRadius:17,flexDirection:"row",gap:8,backgroundColor:"rgba(227,181,90,.07)",borderWidth:1,borderColor:"rgba(227,181,90,.18)"},noticeText:{flex:1,color:colors.textSecondary,fontSize:10.5,lineHeight:16},canvas:{position:"relative",borderRadius:28,borderWidth:1,borderColor:"rgba(227,181,90,.20)",backgroundColor:"rgba(10,8,20,.72)",overflow:"hidden"},treeNode:{position:"absolute",justifyContent:"center",alignItems:"center",borderWidth:1.2,borderColor:"rgba(227,181,90,.38)",backgroundColor:"#1E1730",shadowColor:"#000",shadowOpacity:.22,shadowRadius:7,shadowOffset:{width:0,height:4}},groupNode:{borderColor:"rgba(126,165,235,.45)",backgroundColor:"rgba(52,73,119,.24)"},familyNode:{borderColor:"rgba(205,132,184,.42)",backgroundColor:"rgba(43,34,56,.40)"},treeName:{color:colors.text,fontFamily:typography.serifSemibold,textAlign:"center"},groupText:{color:"#C6D6FF"},treeArabic:{marginTop:1,color:colors.goldLight,fontFamily:typography.arabic,textAlign:"center"},treeNote:{marginTop:2,color:colors.textMuted,textAlign:"center"},muhammadNode:{borderWidth:1.8,borderColor:"rgba(227,181,90,.85)",backgroundColor:"rgba(84,58,12,.42)",shadowColor:"rgba(227,181,90,.45)",shadowOpacity:.34,shadowRadius:10,shadowOffset:{width:0,height:5}},muhammadName:{color:"#FFF4D4"},muhammadArabic:{color:"#FFD885"},muhammadNote:{color:"rgba(255,240,205,.82)"},pressed:{opacity:.78,transform:[{scale:.985}]},sideLabel:{position:"absolute",padding:8,borderRadius:12,borderWidth:1,borderColor:"rgba(255,255,255,.08)",backgroundColor:"rgba(255,255,255,.025)"},sideLabelTitle:{color:colors.goldLight,fontWeight:"900",letterSpacing:.8},sideLabelText:{marginTop:4,color:colors.textMuted,lineHeight:12},sideMarker:{position:"absolute",backgroundColor:"rgba(227,181,90,.65)"},brotherLine:{position:"absolute",backgroundColor:"rgba(126,165,235,.72)"},brotherText:{position:"absolute",color:"rgba(166,192,246,.9)",fontWeight:"800"},sources:{margin:14,padding:16,borderRadius:20,borderWidth:1,borderColor:"#2B2238",backgroundColor:"#151022"},sourceTitle:{color:colors.goldLight,fontSize:9,fontWeight:"900",letterSpacing:1.1},sourceText:{marginTop:7,color:colors.textSecondary,fontSize:11,lineHeight:17}
});
