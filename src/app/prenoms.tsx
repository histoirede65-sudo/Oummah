import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { NAME_COLLECTIONS, getDailyName, namesForCollection } from '../features/muslim-names/collections';
import { BOY_NAMES, CATALOGUE_NAMES, GIRL_NAMES, MUSLIM_NAMES, NAME_TAG_LABELS, isAbdName, normalizeNameSearch, searchMuslimNames } from '../features/muslim-names/data';
import { loadNameFavorites, loadNameHistory, toggleNameFavorite } from '../features/muslim-names/storage';
import type { NameGender, NameTag } from '../features/muslim-names/types';
import { ChoiceChip, NameRow, SectionTitle, prenomTheme } from '../features/muslim-names/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const QUICK_TAGS: NameTag[] = ['court','classique','rare','coranique','prophete','compagnon','sahabiyya','facile-france'];
type GenderFilter = 'all' | NameGender;
type QualityFilter = 'all' | 'verified' | 'catalogue';
type SortMode = 'az' | 'za' | 'short' | 'long' | 'verified' | 'rare' | 'origin';
const SORT_LABELS: Record<SortMode,string> = { az:'A → Z', za:'Z → A', short:'Plus courts', long:'Plus longs', verified:'Vérifiés d’abord', rare:'Rares d’abord', origin:'Par origine' };
const BOY_ACCENT='#78B9FF';
const BOY_WASH='rgba(86,155,235,.15)';
const BOY_BORDER='rgba(110,181,255,.52)';
const GIRL_ACCENT='#F2A6C7';
const GIRL_WASH='rgba(231,126,174,.15)';
const GIRL_BORDER='rgba(242,166,199,.52)';
const DANGER_ACCENT='#FF7E86';
const DANGER_BORDER='rgba(255,126,134,.48)';
const DANGER_WASH='rgba(178,48,58,.12)';

export default function PrenomsScreen(){
  const [query,setQuery]=useState('');
  const [gender,setGender]=useState<GenderFilter>('all');
  const [tag,setTag]=useState<NameTag|null>(null);
  const [quality,setQuality]=useState<QualityFilter>('all');
  const [sort,setSort]=useState<SortMode>('az');
  const [letter,setLetter]=useState<string|null>(null);
  const [abdExpanded,setAbdExpanded]=useState(false);
  const [favorites,setFavorites]=useState<string[]>([]);
  const [history,setHistory]=useState<string[]>([]);
  const [searchY,setSearchY]=useState(0);
  const listRef=useRef<FlatList<(typeof MUSLIM_NAMES)[number]>>(null);
  const daily=useMemo(()=>getDailyName(),[]);

  useFocusEffect(useCallback(()=>{void Promise.all([loadNameFavorites(),loadNameHistory()]).then(([f,h])=>{setFavorites(f);setHistory(h);});},[]));

  const directSearchResults=useMemo(()=>{
    const normalized=normalizeNameSearch(query.trim());
    if(!normalized) return [];
    const primary=MUSLIM_NAMES.filter(item=>[item.name,item.transliteration,...item.variants].filter(Boolean).some(value=>normalizeNameSearch(String(value)).includes(normalized)));
    const values=primary.length?primary:searchMuslimNames(query,MUSLIM_NAMES);
    const score=(item:(typeof MUSLIM_NAMES)[number])=>{
      const candidates=[item.name,item.transliteration,...item.variants].filter(Boolean).map(value=>normalizeNameSearch(String(value)));
      if(candidates.some(value=>value===normalized)) return 0;
      if(candidates.some(value=>value.startsWith(normalized))) return 1;
      if(candidates.some(value=>value.includes(normalized))) return 2;
      return 3;
    };
    return [...values].sort((a,b)=>score(a)-score(b)||a.name.localeCompare(b.name,'fr',{sensitivity:'base'})).slice(0,6);
  },[query]);
  const exactDirectMatches=useMemo(()=>{
    const normalized=normalizeNameSearch(query.trim());
    if(!normalized) return [];
    return directSearchResults.filter(item=>[item.name,item.transliteration,...item.variants].filter(Boolean).some(value=>normalizeNameSearch(String(value))===normalized));
  },[query,directSearchResults]);

  const filtered=useMemo(()=>{
    const values=MUSLIM_NAMES.filter(item=>
      (gender==='all'||item.gender===gender)&&
      (!tag||item.tags.includes(tag))&&
      (quality==='all'||(quality==='verified'?item.editorialLevel!=='catalogue':item.editorialLevel==='catalogue'))&&
      (!letter||normalizeNameSearch(item.name).startsWith(letter.toLowerCase()))
    );
    const collator=new Intl.Collator('fr',{sensitivity:'base'});
    return [...values].sort((a,b)=>{
      if(sort==='za') return collator.compare(b.name,a.name);
      if(sort==='short') return a.name.length-b.name.length||collator.compare(a.name,b.name);
      if(sort==='long') return b.name.length-a.name.length||collator.compare(a.name,b.name);
      if(sort==='verified') return Number(a.editorialLevel==='catalogue')-Number(b.editorialLevel==='catalogue')||collator.compare(a.name,b.name);
      if(sort==='rare') return Number(!a.tags.includes('rare'))-Number(!b.tags.includes('rare'))||collator.compare(a.name,b.name);
      if(sort==='origin') return collator.compare(a.origin[0]??'',b.origin[0]??'')||collator.compare(a.name,b.name);
      return collator.compare(a.name,b.name);
    });
  },[gender,tag,quality,sort,letter]);
  // La collection ʿAbd est volontairement indépendante du répertoire principal :
  // elle doit rester accessible même lorsqu'un tri, une lettre ou un filtre masque la liste.
  const abdFiltered=useMemo(()=>{
    const collator=new Intl.Collator('fr',{sensitivity:'base'});
    return MUSLIM_NAMES.filter(isAbdName).sort((a,b)=>collator.compare(a.name,b.name));
  },[]);
  const regularFiltered=useMemo(()=>filtered.filter(item=>!isAbdName(item)),[filtered]);
  const abdOpen=abdExpanded;
  const showAbdGroup=gender!=='girl'&&abdFiltered.length>0;
  const recent=history.map(id=>MUSLIM_NAMES.find(x=>x.id===id)).filter((x):x is (typeof MUSLIM_NAMES)[number]=>Boolean(x)).slice(0,6);
  const isFiltering=Boolean(gender!=='all'||tag||quality!=='all'||letter);
  const open=(id:string)=>router.push(`/prenoms/${id}` as Href);
  const toggle=async(id:string)=>setFavorites(await toggleNameFavorite(id));
  const reset=()=>{setGender('all');setTag(null);setQuality('all');setSort('az');setLetter(null);setAbdExpanded(false);};
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const keepSearchVisible=useCallback(()=>{
    const scroll=()=>listRef.current?.scrollToOffset({offset:Math.max(0,searchY-10),animated:true});
    requestAnimationFrame(scroll);
    setTimeout(scroll,180);
  },[searchY]);

  const Header=<View>
    <View style={styles.hero}>
      <Text style={styles.eyebrow}>GUIDE OUMMAH</Text>
      <Text style={styles.heroTitle}>Quel prénom lui donnerez-vous ?</Text>
      <Text style={styles.heroText}>Un grand répertoire éditorial pour découvrir, comparer et choisir avec nuance : sens en français, écritures, origines, variantes et, quand elles existent, sources vérifiées.</Text>
      <View style={styles.heroStats}><Stat value={`${MUSLIM_NAMES.length}`} label="fiches"/><View style={styles.statDivider}/><Stat value={`${BOY_NAMES.length}`} label="garçons"/><View style={styles.statDivider}/><Stat value={`${GIRL_NAMES.length}`} label="filles"/></View>
      <View style={styles.trustLine}><Ionicons name="shield-checkmark-outline" size={15} color={colors.goldLight}/><Text style={styles.trustText}>{MUSLIM_NAMES.length} fiches · statut religieux affiché seulement quand un texte l’établit</Text></View>
    </View>

    <View style={styles.genderRow}>
      <GenderCard gender="boy" title="Garçon" count={BOY_NAMES.length} icon="male-outline" active={gender==='boy'} onPress={()=>setGender(gender==='boy'?'all':'boy')}/>
      <GenderCard gender="girl" title="Fille" count={GIRL_NAMES.length} icon="female-outline" active={gender==='girl'} onPress={()=>setGender(gender==='girl'?'all':'girl')}/>
    </View>

    {gender!=='all'?<View style={[styles.genderBanner,{borderColor:gender==='boy'?BOY_BORDER:GIRL_BORDER,backgroundColor:gender==='boy'?BOY_WASH:GIRL_WASH}]}><Ionicons name={gender==='boy'?'male-outline':'female-outline'} size={18} color={gender==='boy'?BOY_ACCENT:GIRL_ACCENT}/><View style={{flex:1}}><Text style={[styles.genderBannerTitle,{color:gender==='boy'?BOY_ACCENT:GIRL_ACCENT}]}>{gender==='boy'?'Prénoms garçons':'Prénoms filles'}</Text><Text style={styles.genderBannerSub}>{gender==='boy'?'Univers garçon · accent bleu, mêmes critères de fiabilité':'Univers fille · accent rose, mêmes critères de fiabilité'}</Text></View></View>:null}

    <View style={styles.searchSection} onLayout={event=>setSearchY(event.nativeEvent.layout.y)}>
      <View style={styles.searchSectionHead}>
        <View style={styles.searchBadge}><Ionicons name="search" size={14} color="#DDF9EA"/></View>
        <Text style={styles.searchTitle}>Rechercher un prénom</Text>
        <Text style={styles.searchEyebrow}>DIRECT</Text>
      </View>
      <View style={styles.search}><Ionicons name="search-outline" size={18} color="#A9E3C4"/><TextInput value={query} onChangeText={setQuery} onFocus={keepSearchVisible} placeholder="Rayan, Maryam, Yusuf…" placeholderTextColor="rgba(221,249,234,.58)" style={styles.searchInput} autoCorrect={false} autoCapitalize="words" autoComplete="off" returnKeyType="search"/>{query?<Pressable onPress={()=>setQuery('')} hitSlop={10}><Ionicons name="close-circle" size={19} color="#A9E3C4"/></Pressable>:null}</View>
      {query.trim()?<View style={styles.directResults}>
        {directSearchResults.length?<>
          <View style={styles.directResultsHead}><Text style={styles.directResultsLabel}>{exactDirectMatches.length?'PRÉNOM TROUVÉ':'PROPOSITIONS'}</Text><Text style={styles.directResultsCount}>{directSearchResults.length} résultat{directSearchResults.length>1?'s':''}</Text></View>
          <View style={styles.directResultsList}>{directSearchResults.map((item,index)=><View key={`direct:${item.id}:${index}`} style={index?styles.directResultDivider:undefined}><NameRow item={item} onPress={()=>open(item.id)} favorite={favorites.includes(item.id)} onFavorite={()=>void toggle(item.id)}/></View>)}</View>
        </>:<View style={styles.directEmpty}><Ionicons name="information-circle-outline" size={18} color="#A9E3C4"/><Text style={styles.directEmptyText}>Ce prénom n’est pas encore dans la base. Essayez une autre graphie ou une variante.</Text></View>}
      </View>:<Text style={styles.searchHint}>Cette recherche est indépendante des filtres et du répertoire ci-dessous.</Text>}
    </View>

    <View style={styles.actions}>
      <Action icon="options-outline" title="Aidez-nous à choisir" subtitle="Origine, longueur, lettre, style…" onPress={()=>router.push('/prenoms/choisir')}/>
      <Action icon="shuffle-outline" title="Surprends-moi" subtitle="Découvrez un prénom au hasard" onPress={()=>router.push('/prenoms/decouvrir')}/>
      <Action icon="heart-outline" title="Mes favoris" subtitle={`${favorites.length} prénom${favorites.length>1?'s':''} sauvegardé${favorites.length>1?'s':''}`} onPress={()=>router.push('/prenoms/favoris')}/>
      <Action icon="book-outline" title="Guide des parents" subtitle="Choisir avec de bons repères" onPress={()=>router.push('/prenoms/guide')}/>
    </View>

    <SectionTitle eyebrow="À DÉCOUVRIR AUJOURD’HUI" title="Prénom du jour"/>
    <Pressable onPress={()=>open(daily.id)} style={({pressed})=>[styles.daily,pressed&&styles.pressed]}>
      <View style={styles.dailyTop}><View style={{flex:1}}><Text style={styles.dailyName}>{daily.name}</Text><Text style={styles.dailyTranslit}>{daily.transliteration}</Text></View>{daily.arabic?<Text style={styles.dailyArabic}>{daily.arabic}</Text>:null}</View>
      <Text style={styles.dailyMeaning}>{daily.meaning}</Text>
      <View style={styles.dailyBottom}><Text style={styles.dailyHint}>Voir la fiche complète</Text><Ionicons name="arrow-forward" size={16} color={colors.goldLight}/></View>
    </Pressable>

    <SectionTitle eyebrow="EXPLORER" title="Collections"/>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.collections}>
      {NAME_COLLECTIONS.map(collection=>{const count=namesForCollection(collection).length;const highlighted=collection.id==='prophets'||collection.id==='companions';return <Pressable key={collection.id} onPress={()=>{setGender(collection.gender??'all');setTag(collection.tag??null);setQuality('all');}} style={({pressed})=>[styles.collection,highlighted&&styles.collectionHighlighted,pressed&&styles.pressed]}>
        {highlighted?<View style={styles.collectionFeaturedBadge}><Ionicons name="star" size={9} color={colors.goldLight}/><Text style={styles.collectionFeaturedText}>REPÈRE</Text></View>:null}
        <View style={[styles.collectionIcon,highlighted&&styles.collectionIconHighlighted]}><Ionicons name={collection.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.goldLight}/></View>
        <Text style={styles.collectionTitle}>{collection.title}</Text><Text style={styles.collectionSub}>{collection.subtitle}</Text><Text style={styles.collectionCount}>{count} prénom{count>1?'s':''}</Text>
      </Pressable>})}
    </ScrollView>

    <Pressable onPress={()=>router.push('/prenoms/interdits')} style={({pressed})=>[styles.sensitiveBlock,pressed&&styles.pressed]} accessibilityRole="button" accessibilityLabel="Ouvrir le guide des prénoms interdits et déconseillés">
      <View style={styles.sensitiveIcon}><Ionicons name="warning-outline" size={20} color={DANGER_ACCENT}/></View>
      <View style={{flex:1}}>
        <Text style={styles.sensitiveEyebrow}>À CONNAÎTRE AVANT DE CHOISIR</Text>
        <Text style={styles.sensitiveTitle}>Prénoms interdits & à éviter</Text>
        <Text style={styles.sensitiveSubtitle}>Interdictions, auto-éloge, anges, tyrans, divination, noms d’animaux et sources.</Text>
      </View>
      <View style={styles.sensitiveArrow}><Ionicons name="arrow-forward" size={17} color={DANGER_ACCENT}/></View>
    </Pressable>

    <View style={styles.resultHeader}><View><Text style={styles.eyebrow}>RÉPERTOIRE</Text><Text style={styles.resultTitle}>{isFiltering?`${filtered.length} résultat${filtered.length>1?'s':''}`:`Tous les prénoms`}</Text></View>{isFiltering?<Pressable onPress={reset}><Text style={styles.reset}>Tout afficher</Text></Pressable>:null}</View>

    <View style={styles.sortBlock}>
      <View style={styles.sortTitleRow}><View><Text style={styles.sortEyebrow}>AFFICHAGE</Text><Text style={styles.sortTitle}>Trier les prénoms</Text></View><Text style={styles.sortCurrent}>{SORT_LABELS[sort]}</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortChips}>
        {(Object.keys(SORT_LABELS) as SortMode[]).map(mode=><ChoiceChip key={mode} label={SORT_LABELS[mode]} active={sort===mode} onPress={()=>setSort(mode)}/>) }
      </ScrollView>
    </View>
    <View style={styles.alphabetBlock}>
      <View style={styles.alphabetHead}><View><Text style={styles.sortEyebrow}>PAR LETTRE</Text><Text style={styles.alphabetTitle}>Aller directement à une initiale</Text></View>{letter?<Pressable onPress={()=>setLetter(null)}><Text style={styles.reset}>Toutes</Text></Pressable>:null}</View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.alphabetRow}>
        {alphabet.map(char=><Pressable key={char} onPress={()=>setLetter(letter===char?null:char)} style={[styles.letterChip,letter===char&&styles.letterChipActive]}><Text style={[styles.letterText,letter===char&&styles.letterTextActive]}>{char}</Text></Pressable>)}
      </ScrollView>
    </View>

    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qualityChips}>
      <ChoiceChip label="Tout" active={quality==='all'} onPress={()=>setQuality('all')}/>
      <ChoiceChip label="Fiches vérifiées" icon="shield-checkmark-outline" active={quality==='verified'} onPress={()=>setQuality(quality==='verified'?'all':'verified')}/>
      <ChoiceChip label="Catalogue culturel" icon="library-outline" active={quality==='catalogue'} onPress={()=>setQuality(quality==='catalogue'?'all':'catalogue')}/>
    </ScrollView>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {QUICK_TAGS.map(item=><ChoiceChip key={item} label={NAME_TAG_LABELS[item]} active={tag===item} onPress={()=>setTag(tag===item?null:item)}/>) }
    </ScrollView>

    {showAbdGroup?<View style={styles.abdGroup}>
      <Pressable onPress={()=>setAbdExpanded(value=>!value)} style={({pressed})=>[styles.abdHeader,pressed&&styles.pressed]} accessibilityRole="button" accessibilityState={{expanded:abdOpen}}>
        <View style={styles.abdIcon}><Text style={styles.abdIconText}>ʿAbd</Text></View>
        <View style={{flex:1}}>
          <Text style={styles.abdEyebrow}>COLLECTION GARÇON</Text>
          <Text style={styles.abdTitle}>Prénoms commençant par ʿAbd</Text>
          <Text style={styles.abdSubtitle}>{abdFiltered.length} forme{abdFiltered.length>1?'s':''} · regroupées pour garder le répertoire lisible</Text>
        </View>
        <Ionicons name={abdOpen?'chevron-up':'chevron-down'} size={20} color={BOY_ACCENT}/>
      </Pressable>
      {abdOpen?<View style={styles.abdBody}>
        <View style={styles.abdExplanation}><Ionicons name="information-circle-outline" size={17} color={BOY_ACCENT}/><Text style={styles.abdExplanationText}>La construction ʿAbd + un Nom d’Allah signifie « serviteur de… ». Abdullah et Abd ar-Rahman sont cités par le Prophète ﷺ parmi les noms les plus aimés d’Allah (Muslim 2132). Seuls les Noms retenus par Ibn ‘Uthaymîn dans al-Qawâ‘id al-Muthlâ sont proposés.</Text></View>
        <View style={styles.abdList}>{abdFiltered.map((item,index)=><NameRow key={`${item.id}:${item.arabic}:${index}`} item={item} onPress={()=>open(item.id)} favorite={favorites.includes(item.id)} onFavorite={()=>void toggle(item.id)}/>)}</View>
      </View>:null}
    </View>:null}

    {CATALOGUE_NAMES.length?<View style={styles.catalogueInfo}><Ionicons name="information-circle-outline" size={18} color={colors.goldLight}/><Text style={styles.catalogueInfoText}>Les éventuelles fiches « Catalogue » sont séparées des fiches éditoriales et n’obtiennent jamais automatiquement un statut religieux.</Text></View>:null}
  </View>;

  const Footer=<View>
    {!filtered.length?<View style={styles.empty}><Ionicons name="search-outline" size={24} color={colors.goldLight}/><Text style={styles.emptyTitle}>Aucun prénom trouvé</Text><Text style={styles.emptyText}>Essayez une autre orthographe, une variante ou retirez un filtre.</Text></View>:null}
    {recent.length?<><SectionTitle eyebrow="VOTRE HISTORIQUE" title="Consultés récemment"/><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>{recent.map(item=><Pressable key={item.id} onPress={()=>open(item.id)} style={styles.recent}>{item.arabic?<Text style={styles.recentArabic}>{item.arabic}</Text>:null}<Text style={styles.recentName}>{item.name}</Text><Text style={styles.recentMeaning} numberOfLines={2}>{item.meaning}</Text></Pressable>)}</ScrollView></>:null}
    <View style={styles.note}><Ionicons name="shield-checkmark-outline" size={21} color={colors.goldLight}/><View style={{flex:1}}><Text style={styles.noteTitle}>Des repères, pas des verdicts rapides</Text><Text style={styles.noteText}>Un mot arabe ou coranique n’est pas automatiquement un prénom recommandé. Un statut n’est affiché que lorsqu’un texte l’établit.</Text><Pressable onPress={()=>router.push('/prenoms/guide')} style={styles.noteLink}><Text style={styles.noteLinkText}>Lire le guide des parents</Text><Ionicons name="chevron-forward" size={14} color={colors.goldLight}/></Pressable></View></View>
  </View>;

  return <LinearGradient colors={[colors.background,colors.backgroundSecondary,colors.background]} style={styles.screen}><SafeAreaView style={styles.safe}>
    <View style={styles.header}><Pressable onPress={()=>router.back()} style={styles.iconButton}><Ionicons name="chevron-back" size={22} color={colors.text}/></Pressable><View style={styles.headerCopy}><Text style={styles.headerTitle}>Prénoms</Text><Text style={styles.headerSub}>Noms, sens & repères</Text></View><Pressable onPress={()=>router.push('/prenoms/favoris')} style={styles.iconButton} accessibilityLabel="Mes favoris"><Ionicons name="heart-outline" size={20} color={colors.goldLight}/>{favorites.length?<View style={styles.badge}><Text style={styles.badgeText}>{favorites.length>9?'9+':favorites.length}</Text></View>:null}</Pressable></View>
    <FlatList ref={listRef} data={regularFiltered} keyExtractor={item=>`${item.id}:${item.arabic}`} renderItem={({item})=><NameRow item={item} onPress={()=>open(item.id)} favorite={favorites.includes(item.id)} onFavorite={()=>void toggle(item.id)}/>} ItemSeparatorComponent={()=> <View style={{height:9}}/>} ListHeaderComponent={Header} ListFooterComponent={Footer} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode={Platform.OS==='ios'?'interactive':'on-drag'} automaticallyAdjustKeyboardInsets={Platform.OS==='ios'} initialNumToRender={12} maxToRenderPerBatch={14} windowSize={9} removeClippedSubviews/>
  </SafeAreaView></LinearGradient>;
}

function Stat({value,label}:{value:string;label:string}){return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>}
function GenderCard({gender,title,count,icon,active,onPress}:{gender:NameGender;title:string;count:number;icon:keyof typeof Ionicons.glyphMap;active:boolean;onPress:()=>void}){const accent=gender==='boy'?BOY_ACCENT:GIRL_ACCENT;const wash=gender==='boy'?BOY_WASH:GIRL_WASH;const border=gender==='boy'?BOY_BORDER:GIRL_BORDER;return <Pressable onPress={onPress} style={({pressed})=>[styles.genderCard,{borderColor:border,backgroundColor:active?wash:prenomTheme.card},active&&styles.genderActive,pressed&&styles.pressed]}><View style={[styles.genderIcon,{backgroundColor:wash}]}><Ionicons name={icon} size={20} color={accent}/></View><Text style={[styles.genderTitle,active&&{color:accent}]}>{title}</Text><Text style={styles.genderCount}>{count} prénoms</Text><View style={[styles.genderUnderline,{backgroundColor:accent}]}/></Pressable>}
function Action({icon,title,subtitle,onPress}:{icon:keyof typeof Ionicons.glyphMap;title:string;subtitle:string;onPress:()=>void}){return <Pressable onPress={onPress} style={({pressed})=>[styles.action,pressed&&styles.pressed]}><View style={styles.actionIcon}><Ionicons name={icon} size={18} color={colors.goldLight}/></View><Text style={styles.actionTitle}>{title}</Text><Text style={styles.actionSub}>{subtitle}</Text></Pressable>}

const styles=StyleSheet.create({
  // Restaurés depuis la version précédente (perdus lors d’un nettoyage).
  resultHeader:{marginTop:30,marginBottom:11,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between'},alphabetBlock:{marginBottom:12,padding:14,borderRadius:20,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:'rgba(255,255,255,.025)'},alphabetHead:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:12,marginBottom:10},alphabetTitle:{marginTop:3,color:colors.text,fontFamily:typography.sans,fontSize:13,fontWeight:'800'},alphabetRow:{gap:7,paddingRight:8},letterChip:{width:34,height:34,borderRadius:11,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:'rgba(255,255,255,.035)',alignItems:'center',justifyContent:'center'},letterChipActive:{borderColor:colors.goldLight,backgroundColor:prenomTheme.goldWash},letterText:{color:colors.textSecondary,fontFamily:typography.sans,fontSize:11,fontWeight:'800'},letterTextActive:{color:colors.goldLight},sortBlock:{marginBottom:12,padding:14,borderRadius:20,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:'rgba(255,255,255,.025)'},sortTitleRow:{flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between',gap:12,marginBottom:10},sortEyebrow:{color:colors.goldLight,fontFamily:typography.sans,fontSize:8.5,fontWeight:'900',letterSpacing:1.3},sortTitle:{marginTop:3,color:colors.text,fontFamily:typography.sans,fontSize:14,fontWeight:'800'},sortCurrent:{color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5},sortChips:{gap:8,paddingRight:10},resultTitle:{marginTop:4,color:colors.text,fontFamily:typography.sans,fontSize:21,fontWeight:'800'},reset:{color:colors.goldLight,fontFamily:typography.sans,fontSize:11,fontWeight:'700'},qualityChips:{gap:8,paddingRight:16,paddingBottom:8},chips:{gap:8,paddingRight:16,paddingBottom:10},
  screen:{flex:1},safe:{flex:1},pressed:{opacity:.74},header:{minHeight:70,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:12},iconButton:{width:42,height:42,borderRadius:15,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.borderSoft,backgroundColor:'rgba(255,255,255,.035)'},headerCopy:{flex:1},headerTitle:{color:colors.text,fontFamily:typography.sans,fontSize:20,fontWeight:'800'},headerSub:{marginTop:2,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5},badge:{position:'absolute',right:-3,top:-3,minWidth:18,height:18,paddingHorizontal:4,borderRadius:9,alignItems:'center',justifyContent:'center',backgroundColor:colors.goldLight,borderWidth:2,borderColor:colors.background},badgeText:{color:colors.background,fontFamily:typography.sans,fontSize:8,fontWeight:'900'},
  content:{padding:16,paddingBottom:56},hero:{padding:21,borderRadius:28,borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:prenomTheme.cardStrong},eyebrow:{color:colors.goldLight,fontFamily:typography.sans,fontSize:9,fontWeight:'800',letterSpacing:1.5},heroTitle:{marginTop:8,color:colors.text,fontFamily:typography.sans,fontSize:28,fontWeight:'800',lineHeight:34},heroText:{marginTop:9,color:colors.textSecondary,fontFamily:typography.sans,fontSize:13,lineHeight:20},heroStats:{marginTop:19,paddingTop:15,borderTopWidth:1,borderTopColor:colors.borderSoft,flexDirection:'row',alignItems:'center'},stat:{flex:1,alignItems:'center'},statValue:{color:colors.text,fontFamily:typography.sans,fontSize:18,fontWeight:'800'},statLabel:{marginTop:2,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5},statDivider:{width:1,height:28,backgroundColor:colors.borderSoft},trustLine:{marginTop:13,paddingTop:12,borderTopWidth:1,borderTopColor:colors.borderSoft,flexDirection:'row',alignItems:'center',gap:7},trustText:{flex:1,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5,lineHeight:14},
  genderRow:{marginTop:12,flexDirection:'row',gap:10},genderCard:{flex:1,padding:15,borderRadius:22,borderWidth:1,backgroundColor:prenomTheme.card,overflow:'hidden'},genderActive:{borderWidth:1.5},genderIcon:{width:35,height:35,borderRadius:12,alignItems:'center',justifyContent:'center'},genderTitle:{marginTop:10,color:colors.text,fontFamily:typography.sans,fontSize:16,fontWeight:'800'},genderCount:{marginTop:2,color:colors.textMuted,fontFamily:typography.sans,fontSize:10},genderUnderline:{position:'absolute',left:15,right:15,bottom:0,height:3,borderRadius:3},genderBanner:{marginTop:12,padding:14,borderRadius:18,borderWidth:1,flexDirection:'row',alignItems:'center',gap:10},genderBannerTitle:{fontFamily:typography.sans,fontSize:13,fontWeight:'900'},genderBannerSub:{marginTop:2,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5,lineHeight:14},
  searchSection:{marginTop:12,padding:10,borderRadius:18,borderWidth:1,borderColor:'rgba(101,211,151,.48)',backgroundColor:'rgba(35,126,82,.16)'},searchSectionHead:{height:25,flexDirection:'row',alignItems:'center',gap:8,marginBottom:7},searchBadge:{width:25,height:25,borderRadius:9,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(101,211,151,.15)',borderWidth:1,borderColor:'rgba(101,211,151,.28)'},searchEyebrow:{marginLeft:'auto',color:'rgba(169,227,196,.72)',fontFamily:typography.sans,fontSize:7.5,fontWeight:'900',letterSpacing:1.15},searchTitle:{color:colors.text,fontFamily:typography.sans,fontSize:13.5,fontWeight:'900'},search:{height:47,paddingHorizontal:13,borderRadius:14,borderWidth:1,borderColor:'rgba(135,230,178,.52)',backgroundColor:'rgba(7,31,22,.48)',flexDirection:'row',alignItems:'center',gap:9},searchInput:{height:45,flex:1,paddingVertical:0,color:'#F3FFF8',fontFamily:typography.sans,fontSize:14,fontWeight:'700'},searchHint:{marginTop:7,color:'rgba(221,249,234,.66)',fontFamily:typography.sans,fontSize:9,lineHeight:13},directResults:{marginTop:12},directResultsHead:{marginBottom:8,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},directResultsLabel:{color:'#A9E3C4',fontFamily:typography.sans,fontSize:8.5,fontWeight:'900',letterSpacing:1.2},directResultsCount:{color:'rgba(221,249,234,.64)',fontFamily:typography.sans,fontSize:9},directResultsList:{gap:8},directResultDivider:{marginTop:0},directEmpty:{padding:12,borderRadius:15,backgroundColor:'rgba(7,31,22,.35)',flexDirection:'row',alignItems:'flex-start',gap:8},directEmptyText:{flex:1,color:'rgba(221,249,234,.78)',fontFamily:typography.sans,fontSize:10.5,lineHeight:16},actions:{marginTop:12,flexDirection:'row',flexWrap:'wrap',gap:10},action:{width:'48.5%',minHeight:122,padding:15,borderRadius:21,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card},actionIcon:{width:35,height:35,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:prenomTheme.goldWash},actionTitle:{marginTop:10,color:colors.text,fontFamily:typography.sans,fontSize:14,fontWeight:'800',lineHeight:18},actionSub:{marginTop:4,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5,lineHeight:15},
  daily:{padding:18,borderRadius:24,borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:prenomTheme.goldWash},dailyTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12},dailyName:{color:colors.text,fontFamily:typography.sans,fontSize:23,fontWeight:'800'},dailyTranslit:{marginTop:3,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5},dailyArabic:{color:colors.goldLight,fontFamily:typography.arabic,fontSize:30},dailyMeaning:{marginTop:13,color:colors.textSecondary,fontFamily:typography.sans,fontSize:13,lineHeight:19},dailyBottom:{marginTop:15,paddingTop:12,borderTopWidth:1,borderTopColor:colors.borderSoft,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},dailyHint:{color:colors.goldLight,fontFamily:typography.sans,fontSize:10.5,fontWeight:'700'},collections:{gap:10,paddingRight:16},collection:{width:178,minHeight:151,padding:15,borderRadius:22,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card,overflow:'hidden'},collectionHighlighted:{borderColor:'rgba(226,187,92,.72)',borderWidth:1.5,backgroundColor:'rgba(226,187,92,.055)'},collectionFeaturedBadge:{position:'absolute',top:10,right:10,paddingHorizontal:7,height:20,borderRadius:10,borderWidth:1,borderColor:'rgba(226,187,92,.42)',backgroundColor:'rgba(226,187,92,.10)',flexDirection:'row',alignItems:'center',gap:4},collectionFeaturedText:{color:colors.goldLight,fontFamily:typography.sans,fontSize:6.5,fontWeight:'900',letterSpacing:.7},collectionIcon:{width:35,height:35,borderRadius:12,alignItems:'center',justifyContent:'center',backgroundColor:prenomTheme.goldWash},collectionIconHighlighted:{borderWidth:1,borderColor:'rgba(226,187,92,.34)'},collectionTitle:{marginTop:10,color:colors.text,fontFamily:typography.sans,fontSize:14,fontWeight:'800'},collectionSub:{marginTop:4,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5,lineHeight:15},collectionCount:{marginTop:'auto',paddingTop:10,color:colors.goldLight,fontFamily:typography.sans,fontSize:9.5,fontWeight:'700'},
  sensitiveBlock:{marginTop:14,minHeight:86,padding:14,borderRadius:22,borderWidth:1,borderColor:DANGER_BORDER,backgroundColor:DANGER_WASH,flexDirection:'row',alignItems:'center',gap:11},sensitiveIcon:{width:44,height:44,borderRadius:14,borderWidth:1,borderColor:DANGER_BORDER,backgroundColor:'rgba(255,126,134,.09)',alignItems:'center',justifyContent:'center'},sensitiveEyebrow:{color:DANGER_ACCENT,fontFamily:typography.sans,fontSize:7.5,fontWeight:'900',letterSpacing:1.15},sensitiveTitle:{marginTop:3,color:colors.text,fontFamily:typography.sans,fontSize:15,fontWeight:'900'},sensitiveSubtitle:{marginTop:3,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5,lineHeight:14},sensitiveArrow:{width:34,height:34,borderRadius:12,borderWidth:1,borderColor:DANGER_BORDER,backgroundColor:'rgba(255,126,134,.07)',alignItems:'center',justifyContent:'center'},
  abdGroup:{marginTop:14,marginBottom:12,borderRadius:22,borderWidth:1,borderColor:'rgba(214,170,90,.58)',backgroundColor:'rgba(214,170,90,.045)',overflow:'hidden'},abdHeader:{minHeight:88,padding:14,flexDirection:'row',alignItems:'center',gap:11},abdIcon:{width:48,height:48,borderRadius:15,borderWidth:1,borderColor:BOY_BORDER,backgroundColor:BOY_WASH,alignItems:'center',justifyContent:'center'},abdIconText:{color:BOY_ACCENT,fontFamily:typography.sans,fontSize:12,fontWeight:'900'},abdEyebrow:{color:BOY_ACCENT,fontFamily:typography.sans,fontSize:7.5,fontWeight:'900',letterSpacing:1.1},abdTitle:{marginTop:3,color:colors.text,fontFamily:typography.sans,fontSize:15,fontWeight:'900'},abdSubtitle:{marginTop:3,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5,lineHeight:14},abdBody:{paddingHorizontal:12,paddingBottom:12,borderTopWidth:1,borderTopColor:'rgba(110,181,255,.18)'},abdExplanation:{marginTop:12,marginBottom:10,padding:11,borderRadius:15,backgroundColor:'rgba(86,155,235,.08)',flexDirection:'row',alignItems:'flex-start',gap:8},abdExplanationText:{flex:1,color:colors.textSecondary,fontFamily:typography.sans,fontSize:9.5,lineHeight:15},abdList:{gap:9},
  catalogueInfo:{marginBottom:12,padding:13,borderRadius:17,backgroundColor:'rgba(255,255,255,.03)',flexDirection:'row',gap:8},catalogueInfoText:{flex:1,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5,lineHeight:15},empty:{marginTop:12,padding:24,alignItems:'center',borderRadius:22,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card},emptyTitle:{marginTop:8,color:colors.text,fontFamily:typography.sans,fontSize:16,fontWeight:'800'},emptyText:{marginTop:4,color:colors.textMuted,fontFamily:typography.sans,fontSize:11.5,lineHeight:17,textAlign:'center'},
  recentRow:{gap:9,paddingRight:16},recent:{width:142,minHeight:126,padding:14,borderRadius:21,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card},recentArabic:{color:colors.goldLight,fontFamily:typography.arabic,fontSize:25},recentName:{marginTop:7,color:colors.text,fontFamily:typography.sans,fontSize:15,fontWeight:'800'},recentMeaning:{marginTop:3,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5,lineHeight:14},note:{marginTop:28,padding:18,borderRadius:23,borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:prenomTheme.goldWash,flexDirection:'row',gap:12},noteTitle:{color:colors.text,fontFamily:typography.sans,fontSize:15,fontWeight:'800'},noteText:{marginTop:5,color:colors.textSecondary,fontFamily:typography.sans,fontSize:11.5,lineHeight:18},noteLink:{marginTop:12,flexDirection:'row',alignItems:'center',gap:3},noteLinkText:{color:colors.goldLight,fontFamily:typography.sans,fontSize:10.5,fontWeight:'800'},
});
