import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { getMuslimName } from '../../features/muslim-names/data';
import { relatedNames } from '../../features/muslim-names/collections';
import { addNameToHistory, loadNameFavorites, toggleNameFavorite } from '../../features/muslim-names/storage';
import { NAME_STATUS_META } from '../../features/muslim-names/types';
import { getLanguageAndCulture, getMeaningReliability, getNameSources } from '../../features/muslim-names/sources';
import { EditorialPill, NameRow, ScreenHeader, StatusPill, prenomTheme } from '../../features/muslim-names/ui';
import { getNameStory, getReadableVariants, isExternalSourceClickable } from '../../features/muslim-names/presentation';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function PrenomDetailScreen(){
  const params=useLocalSearchParams<{id:string}>();
  const item=getMuslimName(params.id);
  const [favorite,setFavorite]=useState(false);

  useEffect(()=>{if(!item)return;void addNameToHistory(item.id);void loadNameFavorites().then(ids=>setFavorite(ids.includes(item.id)));},[item?.id]);
  if(!item)return <LinearGradient colors={[colors.background,colors.backgroundSecondary]} style={styles.screen}><SafeAreaView style={styles.safe}><ScreenHeader title="Prénom" onBack={()=>router.back()}/><View style={styles.notFound}><Ionicons name="alert-circle-outline" size={28} color={colors.goldLight}/><Text style={styles.notFoundTitle}>Prénom introuvable</Text><Text style={styles.notFoundText}>Cette fiche n’existe plus ou l’adresse est incorrecte.</Text></View></SafeAreaView></LinearGradient>;

  const status=NAME_STATUS_META[item.status];
  const related=relatedNames(item);
  const toggle=async()=>{const ids=await toggleNameFavorite(item.id);setFavorite(ids.includes(item.id));};
  const story=getNameStory(item);
  const readableVariants=getReadableVariants(item);
  const share=()=>Share.share({message:`${item.name}${item.arabic?` — ${item.arabic}`:''}\n${item.meaning}\n${story}\n\nDécouvert dans OUMMAH · Guide des prénoms`});
  const openSource=(url?:string)=>{
    if(!isExternalSourceClickable(url))return;
    Linking.openURL(url as string).catch(()=>{
      Alert.alert('Source indisponible','Impossible d’ouvrir cette source pour le moment. La référence reste affichée dans la fiche.');
    });
  };
  const isCatalogue=item.editorialLevel==='catalogue';
  const sources=getNameSources(item);
  const reliability=getMeaningReliability(item);
  const {language,culture}=getLanguageAndCulture(item);
  const accent=item.gender==='boy'?'#78B9FF':'#F2A6C7';
  const accentWash=item.gender==='boy'?'rgba(86,155,235,.12)':'rgba(231,126,174,.12)';
  const accentBorder=item.gender==='boy'?'rgba(110,181,255,.45)':'rgba(242,166,199,.45)';

  return <LinearGradient colors={[colors.background,colors.backgroundSecondary,colors.background]} style={styles.screen}>
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Fiche prénom" onBack={()=>router.back()} right={<Pressable onPress={()=>void share()} style={styles.headerAction}><Ionicons name="share-outline" size={19} color={colors.text}/></Pressable>}/>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero,{borderColor:accentBorder,backgroundColor:accentWash}]}>
          <View style={styles.heroTop}>
            <View style={styles.heroIdentity}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.translit}>{item.transliteration}</Text>
              {item.pronunciation?<Text style={styles.pronounce}>Prononcé : {item.pronunciation}</Text>:null}
            </View>
            <View style={styles.heroActions}>
              <Pressable onPress={()=>void toggle()} style={[styles.heart,favorite&&styles.heartActive]} accessibilityLabel={favorite?'Retirer des favoris':'Ajouter aux favoris'}><Ionicons name={favorite?'heart':'heart-outline'} size={22} color={favorite?colors.background:colors.goldLight}/></Pressable>
              {item.arabic?<Text style={styles.arabic}>{item.arabic}</Text>:null}
            </View>
          </View>

          <View style={styles.heroContentCard}>
            <View style={styles.heroMeaning}>
              <Text style={styles.heroLabel}>SENS DU PRÉNOM</Text>
              <Text style={styles.heroMeaningText}>{item.meaning}</Text>
            </View>
            <View style={styles.heroStory}>
              <Text style={styles.heroLabel}>{isCatalogue?'À PROPOS DE CE PRÉNOM':'HISTOIRE, USAGE & REPÈRE'}</Text>
              <Text style={styles.heroStoryText}>{story}</Text>
            </View>
          </View>

          <View style={styles.statusLine}>{isCatalogue?<EditorialPill item={item}/>:<StatusPill status={item.status}/>}<View style={[styles.genderPill,{borderColor:accentBorder,backgroundColor:accentWash}]}><Ionicons name={item.gender==='boy'?'male-outline':'female-outline'} size={13} color={accent}/><Text style={[styles.gender,{color:accent}]}>{item.gender==='boy'?'Garçon':'Fille'}</Text></View></View>
        </View>

        <View style={styles.variantsCard}><Text style={styles.sectionLabel}>LES ÉCRITURES DU PRÉNOM</Text><Text style={styles.variantsIntro}>Forme principale : <Text style={styles.variantMain}>{item.name}</Text></Text><View style={styles.scriptRows}>{item.arabic?<View style={styles.scriptRow}><Text style={styles.scriptLabel}>Arabe</Text><Text style={styles.scriptArabic}>{item.arabic}</Text></View>:null}<View style={styles.scriptRow}><Text style={styles.scriptLabel}>Translittération</Text><Text style={styles.scriptValue}>{item.transliteration}</Text></View></View>{readableVariants.length?<><Text style={styles.variantHeading}>VARIANTES COURANTES</Text><View style={styles.variants}>{readableVariants.map(v=><View key={v} style={styles.variant}><Text style={styles.variantText}>{v}</Text></View>)}</View></>:<Text style={styles.variantsEmpty}>Pas d’autre graphie courante suffisamment établie pour cette fiche.</Text>}<Text style={styles.variantsNote}>Les variantes latines changent selon les pays et les habitudes de translittération. La forme arabe permet de reconnaître le même prénom malgré ces différences.</Text></View>

        {isCatalogue?<View style={styles.catalogueCard}><View style={styles.statusHead}><Ionicons name="library-outline" size={20} color={colors.goldLight}/><Text style={styles.statusTitle}>Fiche catalogue</Text></View><Text style={styles.statusReason}>Cette fiche sert à élargir la découverte. OUMMAH ne lui attribue pas encore de verdict religieux ni d’étymologie définitive tant que la revue éditoriale n’est pas terminée.</Text><Text style={styles.statusDefinition}>Vous pouvez la sauvegarder et la comparer, mais vérifiez le sens exact avant un choix définitif.</Text></View>:<View style={styles.statusCard}>
          <View style={styles.statusHead}><Ionicons name="shield-checkmark-outline" size={20} color={item.status==='note'?colors.goldLight:colors.success}/><Text style={styles.statusTitle}>{status.symbol} {status.label}</Text></View>
          <Text style={styles.statusReason}>{item.statusReason}</Text>
          <Text style={styles.statusDefinition}>{status.description}</Text>
        </View>}

        {item.historicalRole?<InfoCard icon="people-outline" eyebrow="REPÈRE HISTORIQUE" title={item.historicalRole}/>:null}
        {item.quranReference?<InfoCard icon="bookmark-outline" eyebrow="REPÈRE CORANIQUE" title={item.quranReference} note="La référence indique où le nom, la personne ou le terme apparaît ; elle ne signifie pas automatiquement que le prénom est recommandé."/>:null}
        {item.nuance?<View style={styles.nuance}><Ionicons name="information-circle-outline" size={20} color={colors.goldLight}/><View style={{flex:1}}><Text style={styles.nuanceTitle}>À connaître</Text><Text style={styles.nuanceText}>{item.nuance}</Text></View></View>:null}

        <View style={styles.twoCols}>
          <View style={styles.smallCard}><Text style={styles.smallLabel}>ORIGINE</Text>{item.origin.map(x=><Text key={x} style={styles.smallValue}>{x}</Text>)}</View>
          <View style={styles.smallCard}><Text style={styles.smallLabel}>ÉCRITURE</Text>{item.arabic?<Text style={styles.smallArabic}>{item.arabic}</Text>:<Text style={styles.smallValue}>Alphabet latin</Text>}<Text style={styles.smallSub}>{item.transliteration}</Text></View>
        </View>

        <View style={styles.identityCard}>
          <Text style={styles.sectionLabel}>ORIGINE, LANGUE & CULTURE</Text>
          <View style={styles.identityGrid}>
            <Identity label="Origine" value={item.origin.join(' · ') || 'À préciser'}/>
            <Identity label="Langue" value={language.join(' · ')}/>
            <Identity label="Culture / usage" value={culture.join(' · ')}/>
            <Identity label="Fiabilité du sens" value={reliability==='high' ? 'Élevée · source explicite' : reliability==='medium' ? 'Bonne · sens renseigné et revu' : 'Non publiée'}/>
          </View>
          {item.etymology?<Text style={styles.etymology}>{item.etymology}</Text>:null}
        </View>


        <View style={styles.sourcesCard}>
          <View style={styles.sourcesHead}><Ionicons name="library-outline" size={19} color={colors.goldLight}/><View style={{flex:1}}><Text style={styles.sourceLabel}>SOURCES & FIABILITÉ</Text><Text style={styles.sourcesIntro}>Chaque source indique ce qu’elle permet réellement d’établir. Une source culturelle n’équivaut pas à un avis religieux.</Text></View></View>
          {sources.map((source,index)=><View key={`${source.label}-${index}`} style={styles.sourceItem}><Text style={styles.sourceName}>{source.label}</Text>{source.reference?<Text style={styles.sourceText}>{source.reference}</Text>:null}{isExternalSourceClickable(source.url)?<Pressable onPress={()=>openSource(source.url)} hitSlop={6}><Text style={styles.sourceUrl}>Ouvrir la source ↗</Text></Pressable>:null}<Text style={styles.sourceSupports}>Appuie : {source.supports.join(' · ')}</Text>{source.note?<Text style={styles.sourceNote}>{source.note}</Text>:null}</View>)}
        </View>

        <Pressable onPress={()=>void toggle()} style={[styles.favoriteButton,favorite&&styles.favoriteButtonActive]}><Ionicons name={favorite?'heart':'heart-outline'} size={18} color={favorite?colors.background:colors.goldLight}/><Text style={[styles.favoriteText,favorite&&styles.favoriteTextActive]}>{favorite?'Dans mes favoris':'Ajouter à mes favoris'}</Text></Pressable>

        {related.length?<><Text style={styles.relatedLabel}>DANS LE MÊME ESPRIT</Text><View style={styles.related}>{related.map(candidate=><NameRow key={candidate.id} item={candidate} onPress={()=>router.push(`/prenoms/${candidate.id}` as Href)}/>)}</View></>:null}

        <Pressable onPress={()=>router.push('/prenoms/guide')} style={styles.guideLink}><Ionicons name="book-outline" size={18} color={colors.goldLight}/><View style={{flex:1}}><Text style={styles.guideTitle}>Comment interpréter ces statuts ?</Text><Text style={styles.guideSub}>Voir les principes, les précautions et les sources utilisées par le guide.</Text></View><Ionicons name="chevron-forward" size={16} color={colors.textMuted}/></Pressable>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}

function Identity({label,value}:{label:string;value:string}){return <View style={styles.identityItem}><Text style={styles.identityLabel}>{label}</Text><Text style={styles.identityValue}>{value}</Text></View>}

function InfoCard({icon,eyebrow,title,note}:{icon:keyof typeof Ionicons.glyphMap;eyebrow:string;title:string;note?:string}){return <View style={styles.infoCard}><View style={styles.infoIcon}><Ionicons name={icon} size={19} color={colors.goldLight}/></View><View style={{flex:1}}><Text style={styles.sectionLabel}>{eyebrow}</Text><Text style={styles.infoText}>{title}</Text>{note?<Text style={styles.infoNote}>{note}</Text>:null}</View></View>}

const styles=StyleSheet.create({
  screen:{flex:1},safe:{flex:1},headerAction:{width:42,height:42,borderRadius:15,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.borderSoft,backgroundColor:'rgba(255,255,255,.035)'},content:{padding:16,paddingBottom:54},
  hero:{padding:20,borderRadius:28,borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:prenomTheme.cardStrong},heroTop:{flexDirection:'row',alignItems:'flex-start',gap:14},heroIdentity:{flex:1,minWidth:0},heroActions:{alignItems:'flex-end',gap:10,maxWidth:'44%'},name:{color:colors.text,fontFamily:typography.sans,fontSize:29,fontWeight:'800'},translit:{marginTop:3,color:colors.textSecondary,fontFamily:typography.sans,fontSize:12.5},pronounce:{marginTop:4,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5},heart:{width:44,height:44,borderRadius:15,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:prenomTheme.goldWash},heartActive:{backgroundColor:colors.goldLight},arabic:{color:colors.goldLight,fontFamily:typography.arabic,fontSize:32,lineHeight:42,textAlign:'right'},heroContentCard:{marginTop:16,padding:16,borderRadius:20,borderWidth:1,borderColor:'rgba(255,255,255,.07)',backgroundColor:'rgba(7,8,24,.30)'},heroMeaning:{},heroStory:{marginTop:14,paddingTop:14,borderTopWidth:1,borderTopColor:colors.borderSoft},heroLabel:{color:colors.goldLight,fontFamily:typography.sans,fontSize:8.5,fontWeight:'800',letterSpacing:1.2},heroMeaningText:{marginTop:6,color:colors.text,fontFamily:typography.sans,fontSize:16,lineHeight:23,fontWeight:'800'},heroStoryText:{marginTop:6,color:colors.textSecondary,fontFamily:typography.sans,fontSize:12,lineHeight:19,fontWeight:'600'},statusLine:{marginTop:17,paddingTop:15,borderTopWidth:1,borderTopColor:colors.borderSoft,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},genderPill:{paddingHorizontal:9,paddingVertical:6,borderRadius:999,borderWidth:1,flexDirection:'row',alignItems:'center',gap:5},gender:{fontFamily:typography.sans,fontSize:10.5,fontWeight:'800'},
  infoCard:{marginTop:11,padding:17,borderRadius:22,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card,flexDirection:'row',gap:12},infoIcon:{width:36,height:36,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:prenomTheme.goldWash},sectionLabel:{color:colors.goldLight,fontFamily:typography.sans,fontSize:8.5,fontWeight:'800',letterSpacing:1.3},infoText:{marginTop:5,color:colors.text,fontFamily:typography.sans,fontSize:13,lineHeight:20,fontWeight:'600'},infoNote:{marginTop:8,color:colors.textMuted,fontFamily:typography.sans,fontSize:10,lineHeight:15},
  statusCard:{marginTop:11,padding:18,borderRadius:23,borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:prenomTheme.goldWash},catalogueCard:{marginTop:11,padding:18,borderRadius:23,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card},statusHead:{flexDirection:'row',alignItems:'center',gap:8},statusTitle:{color:colors.text,fontFamily:typography.sans,fontSize:15,fontWeight:'800'},statusReason:{marginTop:9,color:colors.textSecondary,fontFamily:typography.sans,fontSize:12,lineHeight:19},statusDefinition:{marginTop:9,paddingTop:9,borderTopWidth:1,borderTopColor:colors.borderSoft,color:colors.textMuted,fontFamily:typography.sans,fontSize:10,lineHeight:15},
  nuance:{marginTop:11,padding:17,borderRadius:22,borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:prenomTheme.goldWash,flexDirection:'row',gap:11},nuanceTitle:{color:colors.text,fontFamily:typography.sans,fontSize:13,fontWeight:'800'},nuanceText:{marginTop:4,color:colors.textSecondary,fontFamily:typography.sans,fontSize:11,lineHeight:17},twoCols:{marginTop:11,flexDirection:'row',gap:10},smallCard:{flex:1,minHeight:126,padding:16,borderRadius:22,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card},smallLabel:{color:colors.goldLight,fontFamily:typography.sans,fontSize:8.5,fontWeight:'800',letterSpacing:1.2},smallValue:{marginTop:8,color:colors.text,fontFamily:typography.sans,fontSize:12,fontWeight:'700'},smallArabic:{marginTop:10,color:colors.goldLight,fontFamily:typography.arabic,fontSize:25},smallSub:{marginTop:3,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5},
  identityCard:{marginTop:11,padding:17,borderRadius:22,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card},identityGrid:{marginTop:10,flexDirection:'row',flexWrap:'wrap',gap:9},identityItem:{width:'48%',padding:11,borderRadius:14,backgroundColor:'rgba(255,255,255,.035)'},identityLabel:{color:colors.textMuted,fontFamily:typography.sans,fontSize:8.5,fontWeight:'700'},identityValue:{marginTop:4,color:colors.text,fontFamily:typography.sans,fontSize:10.5,lineHeight:15,fontWeight:'700'},etymology:{marginTop:12,color:colors.textSecondary,fontFamily:typography.sans,fontSize:11,lineHeight:17},variantsCard:{marginTop:11,padding:17,borderRadius:22,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card},variantsIntro:{marginTop:8,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5,lineHeight:16},variantMain:{color:colors.text,fontWeight:'800'},scriptRows:{marginTop:12,gap:7},scriptRow:{minHeight:48,paddingHorizontal:12,paddingVertical:9,borderRadius:14,backgroundColor:'rgba(255,255,255,.035)',flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},scriptLabel:{color:colors.textMuted,fontFamily:typography.sans,fontSize:9,fontWeight:'800'},scriptValue:{flex:1,textAlign:'right',color:colors.text,fontFamily:typography.sans,fontSize:11.5,fontWeight:'700'},scriptArabic:{flex:1,textAlign:'right',color:colors.goldLight,fontFamily:typography.arabic,fontSize:23},variantHeading:{marginTop:13,color:colors.textMuted,fontFamily:typography.sans,fontSize:8.5,fontWeight:'800',letterSpacing:1},variantsEmpty:{marginTop:10,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5,lineHeight:16},variants:{marginTop:10,flexDirection:'row',flexWrap:'wrap',gap:7},variant:{paddingHorizontal:10,paddingVertical:7,borderRadius:999,backgroundColor:'rgba(255,255,255,.05)',borderWidth:1,borderColor:colors.borderSoft},variantText:{color:colors.textSecondary,fontFamily:typography.sans,fontSize:10.5,fontWeight:'600'},variantsNote:{marginTop:11,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5,lineHeight:15},sourcesCard:{marginTop:11,padding:17,borderRadius:22,borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:'rgba(255,255,255,.025)'},sourcesHead:{flexDirection:'row',gap:10,alignItems:'flex-start'},sourceLabel:{color:colors.goldLight,fontFamily:typography.sans,fontSize:8.5,fontWeight:'800',letterSpacing:1.2},sourcesIntro:{marginTop:4,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5,lineHeight:14},sourceItem:{marginTop:12,paddingTop:12,borderTopWidth:1,borderTopColor:colors.borderSoft},sourceName:{color:colors.text,fontFamily:typography.sans,fontSize:12,fontWeight:'800'},sourceText:{marginTop:4,color:colors.textSecondary,fontFamily:typography.sans,fontSize:10.5,lineHeight:16},sourceUrl:{marginTop:7,color:colors.goldLight,fontFamily:typography.sans,fontSize:9.5,fontWeight:'800',lineHeight:14},sourceSupports:{marginTop:5,color:colors.goldLight,fontFamily:typography.sans,fontSize:9.5,lineHeight:14,fontWeight:'700'},sourceNote:{marginTop:5,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5,lineHeight:14},
  favoriteButton:{marginTop:15,minHeight:50,borderRadius:17,borderWidth:1,borderColor:prenomTheme.borderGold,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,backgroundColor:prenomTheme.goldWash},favoriteButtonActive:{backgroundColor:colors.goldLight},favoriteText:{color:colors.goldLight,fontFamily:typography.sans,fontSize:12,fontWeight:'800'},favoriteTextActive:{color:colors.background},relatedLabel:{marginTop:28,marginBottom:10,color:colors.goldLight,fontFamily:typography.sans,fontSize:9,fontWeight:'800',letterSpacing:1.4},related:{gap:9},guideLink:{marginTop:22,padding:16,borderRadius:22,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card,flexDirection:'row',alignItems:'center',gap:11},guideTitle:{color:colors.text,fontFamily:typography.sans,fontSize:13,fontWeight:'800'},guideSub:{marginTop:3,color:colors.textMuted,fontFamily:typography.sans,fontSize:10,lineHeight:15},
  notFound:{margin:16,padding:28,alignItems:'center',borderRadius:24,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card},notFoundTitle:{marginTop:10,color:colors.text,fontFamily:typography.sans,fontSize:17,fontWeight:'800'},notFoundText:{marginTop:5,color:colors.textMuted,fontFamily:typography.sans,fontSize:11,textAlign:'center'},
});
