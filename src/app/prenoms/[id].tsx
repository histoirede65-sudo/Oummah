import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { relatedNames } from '../../features/muslim-names/collections';
import { getMuslimName } from '../../features/muslim-names/data';
import { getNameStory, getReadableVariants, getStatusBasis, isExternalSourceClickable } from '../../features/muslim-names/presentation';
import type { NameSourceId } from '../../features/muslim-names/scholar-sources';
import { SourceChips, SourceSheet } from '../../features/muslim-names/SourceSheet';
import { getNameSources } from '../../features/muslim-names/sources';
import { addNameToHistory, loadNameFavorites, toggleNameFavorite } from '../../features/muslim-names/storage';
import { GENDER_ACCENT, NameRow, RecommendedPill, ScreenHeader } from '../../features/muslim-names/ui';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

/** First surah number found in a reference such as « Sourate 12 », « 7:65 · Sourate 11 » or « Notamment 2:124-132 ». */
function firstSurah(reference?: string) {
  const match = reference?.match(/Sourate\s+(\d{1,3})|(\d{1,3}):\d/);
  const value = Number(match?.[1] ?? match?.[2]);
  return value >= 1 && value <= 114 ? value : null;
}

export default function PrenomDetailScreen(){
  const params=useLocalSearchParams<{id:string}>();
  const item=getMuslimName(params.id);
  const [favorite,setFavorite]=useState(false);
  const [source,setSource]=useState<NameSourceId|null>(null);

  useEffect(()=>{if(!item)return;void addNameToHistory(item.id);void loadNameFavorites().then(ids=>setFavorite(ids.includes(item.id)));},[item?.id]);
  if(!item)return <LinearGradient colors={[colors.background,colors.backgroundSecondary]} style={styles.screen}><SafeAreaView style={styles.safe}><ScreenHeader title="Prénom" onBack={()=>router.back()}/><View style={styles.notFound}><Text style={styles.notFoundTitle}>Prénom introuvable</Text><Text style={styles.notFoundText}>Cette fiche n’existe plus ou l’adresse est incorrecte.</Text></View></SafeAreaView></LinearGradient>;

  const basis=getStatusBasis(item);
  const story=getNameStory(item);
  const variants=getReadableVariants(item);
  const sources=getNameSources(item);
  const related=relatedNames(item);
  const surah=firstSurah(item.quranReference);
  const hasArabic=Boolean(item.arabic&&item.arabic!=='—');
  const toggle=async()=>{const ids=await toggleNameFavorite(item.id);setFavorite(ids.includes(item.id));};
  const share=()=>Share.share({message:`${item.name}${hasArabic?` — ${item.arabic}`:''}\n${item.meaning}\n\nDécouvert dans OUMMAH · Prénoms`});
  const openUrl=(url?:string)=>{
    if(!isExternalSourceClickable(url))return;
    Linking.openURL(url as string).catch(()=>Alert.alert('Source indisponible','Impossible d’ouvrir cette source pour le moment.'));
  };

  return <LinearGradient colors={[colors.background,colors.backgroundSecondary,colors.background]} style={styles.screen}>
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="" onBack={()=>router.back()} right={<View style={styles.headerActions}>
        <Pressable onPress={()=>void share()} style={styles.headerButton} accessibilityLabel="Partager"><Ionicons name="share-outline" size={19} color={colors.text}/></Pressable>
        <Pressable onPress={()=>void toggle()} style={styles.headerButton} accessibilityLabel={favorite?'Retirer des favoris':'Ajouter aux favoris'}><Ionicons name={favorite?'heart':'heart-outline'} size={20} color={colors.goldLight}/></Pressable>
      </View>}/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          {hasArabic?<Text style={styles.arabic}>{item.arabic}</Text>:null}
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.translit}>{item.transliteration}{item.pronunciation?<Text style={styles.pronounce}>  ·  prononcé {item.pronunciation}</Text>:null}</Text>
          <View style={styles.tags}>
            <View style={[styles.tag,{borderColor:`${GENDER_ACCENT[item.gender]}77`}]}><Text style={[styles.tagText,{color:GENDER_ACCENT[item.gender]}]}>{item.gender==='boy'?'Garçon':'Fille'}</Text></View>
            {basis?<RecommendedPill/>:null}
            {item.origin.length?<View style={styles.tag}><Text style={styles.tagText}>{item.origin.join(' · ')}</Text></View>:null}
          </View>
        </View>

        <Entry label="Sens"><Text style={styles.meaning}>{item.meaning}</Text></Entry>

        {basis?<Entry label="Pourquoi « Recommandé »">
          <Text style={styles.body}>{basis.reason}</Text>
          <SourceChips ids={basis.sources} onOpen={setSource}/>
        </Entry>:null}

        {item.historicalRole||story?<Entry label="Repère">
          {item.historicalRole?<Text style={styles.bodyStrong}>{item.historicalRole}</Text>:null}
          {story?<Text style={[styles.body,item.historicalRole&&styles.spaced]}>{story}</Text>:null}
        </Entry>:null}

        {item.quranReference?<Entry label="Dans le Coran">
          <Text style={styles.body}>{item.quranReference}</Text>
          {surah?<Pressable onPress={()=>router.push(`/surah/${surah}` as Href)} hitSlop={6}><Text style={styles.link}>Lire la sourate {surah} ›</Text></Pressable>:null}
          <Text style={styles.note}>La référence indique où le nom, la personne ou le mot apparaît ; elle ne fait pas à elle seule du prénom un nom recommandé.</Text>
        </Entry>:null}

        {item.nuance?<Entry label="À connaître"><Text style={styles.body}>{item.nuance}</Text></Entry>:null}

        {variants.length?<Entry label="Autres écritures">
          <View style={styles.variants}>{variants.map(value=><View key={value} style={styles.variant}><Text style={styles.variantText}>{value}</Text></View>)}</View>
        </Entry>:null}

        {sources.length?<Entry label="Sources">
          {sources.map((entry,index)=>{const clickable=isExternalSourceClickable(entry.url);return <Pressable key={`${entry.label}-${index}`} disabled={!clickable} onPress={()=>openUrl(entry.url)} style={({pressed})=>[styles.source,pressed&&clickable&&styles.pressed]}>
            <View style={{flex:1}}>
              <Text style={styles.sourceLabel}>{entry.label}</Text>
              {entry.reference?<Text style={styles.sourceRef}>{entry.reference}</Text>:null}
              {entry.note?<Text style={styles.sourceNote}>{entry.note}</Text>:null}
            </View>
            {clickable?<Ionicons name="open-outline" size={15} color={colors.goldLight}/>:null}
          </Pressable>;})}
        </Entry>:null}

        <Pressable onPress={()=>void toggle()} style={[styles.favorite,favorite&&styles.favoriteActive]}><Ionicons name={favorite?'heart':'heart-outline'} size={18} color={favorite?colors.background:colors.goldLight}/><Text style={[styles.favoriteText,favorite&&styles.favoriteTextActive]}>{favorite?'Dans mes favoris':'Ajouter à mes favoris'}</Text></Pressable>

        {related.length?<>
          <Text style={styles.relatedLabel}>DANS LE MÊME ESPRIT</Text>
          {related.map(candidate=><NameRow key={candidate.id} item={candidate} onPress={()=>router.push(`/prenoms/${candidate.id}` as Href)}/>)}
        </>:null}

        <Pressable onPress={()=>router.push('/prenoms/guide')} style={styles.guide}><Text style={styles.guideText}>Avant de choisir : repères et avis des savants</Text><Ionicons name="chevron-forward" size={15} color={colors.goldLight}/></Pressable>
      </ScrollView>
      <SourceSheet id={source} onClose={()=>setSource(null)}/>
    </SafeAreaView>
  </LinearGradient>;
}

function Entry({label,children}:{label:string;children:ReactNode}){
  return <View style={styles.entry}><Text style={styles.entryLabel}>{label.toUpperCase()}</Text>{children}</View>;
}

const styles=StyleSheet.create({
  screen:{flex:1},safe:{flex:1},pressed:{opacity:.72},content:{paddingHorizontal:20,paddingBottom:54},
  headerActions:{flexDirection:'row',gap:8},
  headerButton:{width:42,height:42,borderRadius:15,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.borderSoft,backgroundColor:'rgba(255,255,255,.035)'},
  head:{paddingBottom:18,borderBottomWidth:1,borderBottomColor:colors.borderSoft},
  arabic:{color:colors.goldLight,fontFamily:typography.arabic,fontSize:46,lineHeight:72,textAlign:'right'},
  name:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:46,lineHeight:50},
  translit:{marginTop:3,color:colors.textSecondary,fontFamily:typography.sans,fontSize:13.5},
  pronounce:{color:colors.textMuted},
  tags:{marginTop:13,flexDirection:'row',flexWrap:'wrap',gap:6},
  tag:{paddingHorizontal:10,paddingVertical:5,borderRadius:999,borderWidth:1,borderColor:colors.borderSoft},
  tagText:{color:colors.textSecondary,fontFamily:typography.sans,fontSize:11,fontWeight:'700'},
  entry:{paddingVertical:16,borderBottomWidth:1,borderBottomColor:'rgba(126,78,151,.20)'},
  entryLabel:{marginBottom:6,color:colors.goldLight,fontFamily:typography.sans,fontSize:9.5,fontWeight:'800',letterSpacing:1.4},
  meaning:{color:colors.text,fontFamily:typography.serifMedium,fontSize:22,lineHeight:29},
  body:{color:colors.textSecondary,fontFamily:typography.sans,fontSize:14,lineHeight:21},
  bodyStrong:{color:colors.text,fontFamily:typography.sans,fontSize:14,lineHeight:21,fontWeight:'700'},
  spaced:{marginTop:4},
  link:{marginTop:6,color:colors.goldLight,fontFamily:typography.sans,fontSize:12.5,fontWeight:'800'},
  note:{marginTop:7,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5,lineHeight:15},
  variants:{flexDirection:'row',flexWrap:'wrap',gap:6},
  variant:{paddingHorizontal:10,paddingVertical:5,borderRadius:999,backgroundColor:'rgba(255,255,255,.05)'},
  variantText:{color:colors.textSecondary,fontFamily:typography.sans,fontSize:12},
  source:{paddingVertical:8,flexDirection:'row',alignItems:'flex-start',gap:10},
  sourceLabel:{color:colors.text,fontFamily:typography.sans,fontSize:12.5,fontWeight:'800'},
  sourceRef:{marginTop:2,color:colors.textSecondary,fontFamily:typography.sans,fontSize:11.5,lineHeight:17},
  sourceNote:{marginTop:2,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5,lineHeight:15},
  favorite:{marginTop:20,minHeight:48,borderRadius:15,borderWidth:1,borderColor:'rgba(227,181,90,.45)',alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},
  favoriteActive:{backgroundColor:colors.goldLight,borderColor:colors.goldLight},
  favoriteText:{color:colors.goldLight,fontFamily:typography.sans,fontSize:12.5,fontWeight:'800'},
  favoriteTextActive:{color:colors.background},
  relatedLabel:{marginTop:30,marginBottom:2,color:colors.goldLight,fontFamily:typography.sans,fontSize:9.5,fontWeight:'800',letterSpacing:1.4},
  guide:{marginTop:24,paddingVertical:12,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},
  guideText:{flex:1,color:colors.goldLight,fontFamily:typography.sans,fontSize:12.5,fontWeight:'700'},
  notFound:{margin:16,padding:28,alignItems:'center'},
  notFoundTitle:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:24},
  notFoundText:{marginTop:5,color:colors.textMuted,fontFamily:typography.sans,fontSize:12,textAlign:'center'},
});
