import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { RESTRICTION_SECTIONS, RESTRICTION_SOURCES, type RestrictionTone } from '../../features/muslim-names/restricted-names';
import { ScreenHeader, prenomTheme } from '../../features/muslim-names/ui';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const TONES: Record<RestrictionTone,{accent:string;wash:string;border:string;icon:keyof typeof Ionicons.glyphMap}> = {
  forbidden:{accent:'#FF767E',wash:'rgba(255,86,96,.09)',border:'rgba(255,104,112,.34)',icon:'close-circle-outline'},
  avoid:{accent:'#FFAD68',wash:'rgba(255,157,79,.08)',border:'rgba(255,173,104,.30)',icon:'warning-outline'},
  disputed:{accent:'#D5B4FF',wash:'rgba(190,144,255,.08)',border:'rgba(213,180,255,.28)',icon:'git-compare-outline'},
  context:{accent:'#8EC5FF',wash:'rgba(100,169,242,.08)',border:'rgba(142,197,255,.28)',icon:'information-circle-outline'},
};

export default function RestrictedNamesScreen(){
  const [openSections,setOpenSections]=useState<string[]>(['clear-forbidden','angels']);
  const sourceCount=useMemo(()=>Object.keys(RESTRICTION_SOURCES).length,[]);
  const toggle=(id:string)=>setOpenSections(current=>current.includes(id)?current.filter(value=>value!==id):[...current,id]);
  const openSource=async(url:string)=>{
    try{
      const supported=await Linking.canOpenURL(url);
      if(!supported) throw new Error('unsupported');
      await Linking.openURL(url);
    }catch{
      Alert.alert('Source indisponible','Cette source ne peut pas être ouverte sur cet appareil pour le moment.');
    }
  };

  return <LinearGradient colors={[colors.background,colors.backgroundSecondary,colors.background]} style={styles.screen}>
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Prénoms interdits & à éviter" onBack={()=>router.back()}/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="shield-outline" size={25} color="#FF8A91"/></View>
          <Text style={styles.heroEyebrow}>GUIDE RELIGIEUX</Text>
          <Text style={styles.heroTitle}>Comprendre avant de juger un prénom</Text>
          <Text style={styles.heroText}>Tous les cas ne sont pas au même niveau. Cette page distingue les interdictions claires, les noms réprouvés, les avis divergents et les simples questions de contexte.</Text>
          <View style={styles.heroRule}><Ionicons name="scale-outline" size={17} color={colors.goldLight}/><Text style={styles.heroRuleText}>Quand les savants divergent, OUMMAH le dit clairement au lieu de transformer un avis en consensus.</Text></View>
        </View>

        <View style={styles.quickGrid}>
          <QuickStat value="6" label="grandes règles" icon="layers-outline"/>
          <QuickStat value={`${RESTRICTION_SECTIONS.reduce((sum,section)=>sum+section.examples.length,0)}`} label="exemples expliqués" icon="list-outline"/>
          <QuickStat value={`${sourceCount}`} label="sources" icon="book-outline"/>
        </View>

        <View style={styles.keyNotice}>
          <Ionicons name="alert-circle-outline" size={20} color="#FFAD68"/>
          <View style={{flex:1}}><Text style={styles.keyNoticeTitle}>Pour une personne qui porte déjà l’un de ces prénoms</Text><Text style={styles.keyNoticeText}>Une règle sur le choix initial d’un prénom ne signifie pas automatiquement qu’une personne adulte porte un péché à cause du choix fait par ses parents. Certaines situations exigent un changement ; d’autres non. La fiche indique le niveau de la règle.</Text></View>
        </View>

        {RESTRICTION_SECTIONS.map(section=>{
          const tone=TONES[section.tone];
          const opened=openSections.includes(section.id);
          return <View key={section.id} style={[styles.section,{borderColor:tone.border,backgroundColor:tone.wash}]}>
            <Pressable onPress={()=>toggle(section.id)} style={({pressed})=>[styles.sectionHeader,pressed&&styles.pressed]} accessibilityRole="button" accessibilityState={{expanded:opened}}>
              <View style={[styles.sectionIcon,{borderColor:tone.border,backgroundColor:tone.wash}]}><Ionicons name={tone.icon} size={20} color={tone.accent}/></View>
              <View style={{flex:1}}><Text style={[styles.sectionEyebrow,{color:tone.accent}]}>{section.eyebrow}</Text><Text style={styles.sectionTitle}>{section.title}</Text><Text style={styles.sectionSummary}>{section.summary}</Text></View>
              <View style={styles.countPill}><Text style={styles.countText}>{section.examples.length}</Text></View>
              <Ionicons name={opened?'chevron-up':'chevron-down'} size={18} color={tone.accent}/>
            </Pressable>
            {opened?<View style={styles.sectionBody}>
              <View style={[styles.ruleBox,{borderColor:tone.border}]}><Text style={styles.ruleLabel}>RÈGLE OUMMAH</Text><Text style={styles.ruleText}>{section.rule}</Text></View>
              <View style={styles.examples}>{section.examples.map(example=><View key={`${section.id}:${example.name}`} style={styles.example}>
                <View style={styles.exampleTop}><View style={{flex:1}}><Text style={styles.exampleName}>{example.name}</Text>{example.variants?.length?<Text style={styles.variants}>Aussi écrit : {example.variants.join(' · ')}</Text>:null}</View>{example.arabic?<Text style={styles.arabic}>{example.arabic}</Text>:null}</View>
                {example.meaning?<View style={styles.meaningRow}><Text style={styles.meaningLabel}>Sens</Text><Text style={styles.meaningText}>{example.meaning}</Text></View>:null}
                <View style={[styles.verdict,{borderColor:tone.border,backgroundColor:tone.wash}]}><Text style={[styles.verdictText,{color:tone.accent}]}>{example.verdict}</Text></View>
                <Text style={styles.explanation}>{example.explanation}</Text>
                <View style={styles.sourceChips}>{example.sourceIds.map(id=>{const source=RESTRICTION_SOURCES[id];if(!source)return null;return <Pressable key={`${example.name}:${id}`} onPress={()=>void openSource(source.url)} style={({pressed})=>[styles.sourceChip,pressed&&styles.pressed]}><Ionicons name="open-outline" size={11} color={colors.goldLight}/><Text style={styles.sourceChipText}>{source.reference}</Text></Pressable>})}</View>
              </View>)}</View>
            </View>:null}
          </View>;
        })}

        <View style={styles.sourcesBlock}>
          <Text style={styles.sourcesEyebrow}>RÉFÉRENCES UTILISÉES</Text>
          <Text style={styles.sourcesTitle}>Sources & méthode</Text>
          <Text style={styles.sourcesIntro}>Les boutons ci-dessous ouvrent la référence complète. Une source de fatwa explique un avis juridique ; elle n’est pas présentée comme un verset ou un hadith.</Text>
          {Object.entries(RESTRICTION_SOURCES).map(([id,source])=><Pressable key={id} onPress={()=>void openSource(source.url)} style={({pressed})=>[styles.sourceRow,pressed&&styles.pressed]}>
            <View style={styles.sourceIcon}><Ionicons name="book-outline" size={16} color={colors.goldLight}/></View>
            <View style={{flex:1}}><Text style={styles.sourceTitle}>{source.label}</Text><Text style={styles.sourceRef}>{source.reference}</Text>{source.note?<Text style={styles.sourceNote}>{source.note}</Text>:null}</View>
            <Ionicons name="open-outline" size={15} color={colors.textMuted}/>
          </Pressable>)}
        </View>

        <View style={styles.footerNote}><Ionicons name="heart-outline" size={18} color={colors.goldLight}/><Text style={styles.footerText}>Le but de cette page est d’aider les parents à choisir sereinement un beau prénom, pas de juger les personnes qui portent déjà un nom discuté.</Text></View>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}

function QuickStat({value,label,icon}:{value:string;label:string;icon:keyof typeof Ionicons.glyphMap}){return <View style={styles.quickStat}><Ionicons name={icon} size={16} color={colors.goldLight}/><Text style={styles.quickValue}>{value}</Text><Text style={styles.quickLabel}>{label}</Text></View>}

const styles=StyleSheet.create({
  screen:{flex:1},safe:{flex:1},content:{paddingHorizontal:16,paddingBottom:44},pressed:{opacity:.72},
  hero:{padding:20,borderRadius:27,borderWidth:1,borderColor:'rgba(255,118,126,.28)',backgroundColor:'rgba(100,24,35,.16)'},heroIcon:{width:48,height:48,borderRadius:17,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,118,126,.34)',backgroundColor:'rgba(255,118,126,.08)'},heroEyebrow:{marginTop:15,color:'#FF8A91',fontFamily:typography.sans,fontSize:9,fontWeight:'900',letterSpacing:1.5},heroTitle:{marginTop:5,color:colors.text,fontFamily:typography.sans,fontSize:24,fontWeight:'900',lineHeight:29},heroText:{marginTop:9,color:colors.textSecondary,fontFamily:typography.sans,fontSize:12,lineHeight:19},heroRule:{marginTop:15,padding:12,borderRadius:17,borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:prenomTheme.goldWash,flexDirection:'row',gap:9},heroRuleText:{flex:1,color:colors.textSecondary,fontFamily:typography.sans,fontSize:10.5,lineHeight:16},
  quickGrid:{marginTop:11,flexDirection:'row',gap:8},quickStat:{flex:1,minHeight:83,padding:11,borderRadius:18,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card,alignItems:'center',justifyContent:'center'},quickValue:{marginTop:4,color:colors.text,fontFamily:typography.sans,fontSize:18,fontWeight:'900'},quickLabel:{marginTop:2,color:colors.textMuted,fontFamily:typography.sans,fontSize:8.5,textAlign:'center'},
  keyNotice:{marginTop:18,padding:14,borderRadius:20,borderWidth:1,borderColor:'rgba(255,173,104,.28)',backgroundColor:'rgba(255,157,79,.065)',flexDirection:'row',gap:10},keyNoticeTitle:{color:colors.text,fontFamily:typography.sans,fontSize:12.5,fontWeight:'800'},keyNoticeText:{marginTop:4,color:colors.textSecondary,fontFamily:typography.sans,fontSize:10,lineHeight:16},
  section:{marginTop:14,borderRadius:24,borderWidth:1,overflow:'hidden'},sectionHeader:{padding:15,flexDirection:'row',alignItems:'center',gap:11},sectionIcon:{width:43,height:43,borderRadius:14,borderWidth:1,alignItems:'center',justifyContent:'center'},sectionEyebrow:{fontFamily:typography.sans,fontSize:8,fontWeight:'900',letterSpacing:1.15},sectionTitle:{marginTop:3,color:colors.text,fontFamily:typography.sans,fontSize:16,fontWeight:'900'},sectionSummary:{marginTop:4,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5,lineHeight:14},countPill:{minWidth:26,height:26,paddingHorizontal:6,borderRadius:13,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,.055)'},countText:{color:colors.textSecondary,fontFamily:typography.sans,fontSize:9,fontWeight:'800'},sectionBody:{paddingHorizontal:12,paddingBottom:13,borderTopWidth:1,borderTopColor:'rgba(255,255,255,.06)'},ruleBox:{marginTop:11,padding:12,borderRadius:16,borderWidth:1,backgroundColor:'rgba(7,7,16,.16)'},ruleLabel:{color:colors.goldLight,fontFamily:typography.sans,fontSize:8,fontWeight:'900',letterSpacing:1.2},ruleText:{marginTop:4,color:colors.textSecondary,fontFamily:typography.sans,fontSize:10,lineHeight:16},examples:{marginTop:10,gap:9},example:{padding:13,borderRadius:18,borderWidth:1,borderColor:'rgba(255,255,255,.07)',backgroundColor:'rgba(8,7,17,.34)'},exampleTop:{flexDirection:'row',alignItems:'flex-start',gap:12},exampleName:{color:colors.text,fontFamily:typography.sans,fontSize:15,fontWeight:'900'},variants:{marginTop:3,color:colors.textMuted,fontFamily:typography.sans,fontSize:8.8,lineHeight:13},arabic:{color:colors.goldLight,fontFamily:typography.arabic,fontSize:22},meaningRow:{marginTop:9,paddingVertical:8,paddingHorizontal:10,borderRadius:13,backgroundColor:'rgba(255,255,255,.035)',flexDirection:'row',gap:8},meaningLabel:{color:colors.goldLight,fontFamily:typography.sans,fontSize:9,fontWeight:'900'},meaningText:{flex:1,color:colors.textSecondary,fontFamily:typography.sans,fontSize:10,lineHeight:15},verdict:{alignSelf:'flex-start',marginTop:9,paddingHorizontal:9,paddingVertical:5,borderRadius:999,borderWidth:1},verdictText:{fontFamily:typography.sans,fontSize:9,fontWeight:'900'},explanation:{marginTop:8,color:colors.textSecondary,fontFamily:typography.sans,fontSize:10.5,lineHeight:17},sourceChips:{marginTop:10,flexDirection:'row',flexWrap:'wrap',gap:6},sourceChip:{paddingHorizontal:8,paddingVertical:6,borderRadius:999,borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:prenomTheme.goldWash,flexDirection:'row',alignItems:'center',gap:4},sourceChipText:{color:colors.goldLight,fontFamily:typography.sans,fontSize:8,fontWeight:'800'},
  sourcesBlock:{marginTop:28},sourcesEyebrow:{color:colors.goldLight,fontFamily:typography.sans,fontSize:9,fontWeight:'900',letterSpacing:1.4},sourcesTitle:{marginTop:4,color:colors.text,fontFamily:typography.sans,fontSize:21,fontWeight:'900'},sourcesIntro:{marginTop:6,marginBottom:10,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5,lineHeight:16},sourceRow:{marginTop:8,padding:12,borderRadius:17,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card,flexDirection:'row',alignItems:'center',gap:10},sourceIcon:{width:34,height:34,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:prenomTheme.goldWash},sourceTitle:{color:colors.text,fontFamily:typography.sans,fontSize:11,fontWeight:'800'},sourceRef:{marginTop:2,color:colors.goldLight,fontFamily:typography.sans,fontSize:8.5,fontWeight:'700'},sourceNote:{marginTop:3,color:colors.textMuted,fontFamily:typography.sans,fontSize:8.5,lineHeight:13},
  footerNote:{marginTop:22,padding:14,borderRadius:18,borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:prenomTheme.goldWash,flexDirection:'row',gap:9},footerText:{flex:1,color:colors.textSecondary,fontFamily:typography.sans,fontSize:10,lineHeight:16},
});
