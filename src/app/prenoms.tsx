import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Platform, Pressable, SafeAreaView, ScrollView, SectionList, StyleSheet, Text, TextInput, View } from 'react-native';

import { NAME_COLLECTIONS, inCollection, namesForCollection } from '../features/muslim-names/collections';
import { MUSLIM_NAMES, isAbdName, normalizeNameSearch, searchMuslimNames } from '../features/muslim-names/data';
import { loadNameFavorites, toggleNameFavorite } from '../features/muslim-names/storage';
import type { MuslimName, NameGender } from '../features/muslim-names/types';
import { ChoiceChip, GENDER_ACCENT, NameRow } from '../features/muslim-names/ui';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type GenderFilter = 'all' | NameGender;
const GENDERS: { id: GenderFilter; label: string }[] = [{ id:'all', label:'Tous' }, { id:'boy', label:'Garçons' }, { id:'girl', label:'Filles' }];
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const collator = new Intl.Collator('fr', { sensitivity:'base' });
const initialOf = (item: MuslimName) => normalizeNameSearch(item.name).charAt(0).toUpperCase();

export default function PrenomsScreen(){
  const [query,setQuery]=useState('');
  const [gender,setGender]=useState<GenderFilter>('all');
  const [collectionId,setCollectionId]=useState<string|null>(null);
  const [letter,setLetter]=useState<string|null>(null);
  const [favorites,setFavorites]=useState<string[]>([]);
  const [openLetters,setOpenLetters]=useState<string[]>([]);

  useFocusEffect(useCallback(()=>{void loadNameFavorites().then(setFavorites);},[]));

  const collection=NAME_COLLECTIONS.find(item=>item.id===collectionId)??null;
  const searching=Boolean(query.trim());

  const visible=useMemo(()=>{
    if(searching){
      const normalized=normalizeNameSearch(query.trim());
      const score=(item:MuslimName)=>{
        const values=[item.name,item.transliteration,...item.variants].filter(Boolean).map(value=>normalizeNameSearch(String(value)));
        if(values.some(value=>value===normalized)) return 0;
        if(values.some(value=>value.startsWith(normalized))) return 1;
        if(values.some(value=>value.includes(normalized))) return 2;
        return 3;
      };
      return searchMuslimNames(query,MUSLIM_NAMES)
        .filter(item=>gender==='all'||item.gender===gender)
        .sort((a,b)=>score(a)-score(b)||collator.compare(a.name,b.name));
    }
    return MUSLIM_NAMES
      .filter(item=>gender==='all'||item.gender===gender)
      .filter(item=>collection?inCollection(collection,item):!isAbdName(item))
      .filter(item=>!letter||initialOf(item)===letter)
      .sort((a,b)=>collator.compare(a.name,b.name));
  },[query,searching,gender,collection,letter]);

  // Letters are folded by default; a short list (one letter, a small collection) opens by itself.
  const autoOpen=Boolean(letter)||visible.length<=40;
  const sections=useMemo(()=>{
    if(searching) return visible.length?[{title:'',count:visible.length,data:visible}]:[];
    const groups=new Map<string,MuslimName[]>();
    for(const item of visible){const key=initialOf(item)||'#';groups.set(key,[...(groups.get(key)??[]),item]);}
    return [...groups.entries()].map(([title,data])=>({title,count:data.length,data:autoOpen||openLetters.includes(title)?data:[]}));
  },[visible,searching,autoOpen,openLetters]);
  const allOpen=sections.length>0&&sections.every(section=>section.data.length===section.count);
  const toggleLetter=(title:string)=>setOpenLetters(current=>current.includes(title)?current.filter(value=>value!==title):[...current,title]);
  const toggleAll=()=>setOpenLetters(allOpen?[]:sections.map(section=>section.title));

  const abdCount=useMemo(()=>MUSLIM_NAMES.filter(isAbdName).length,[]);
  const counts=useMemo(()=>Object.fromEntries(NAME_COLLECTIONS.map(item=>[item.id,namesForCollection(item).filter(name=>gender==='all'||name.gender===gender).length])),[gender]);
  const open=(id:string)=>router.push(`/prenoms/${id}` as Href);
  const toggleFavorite=async(id:string)=>setFavorites(await toggleNameFavorite(id));
  const showAbdEntry=!searching&&!collection&&gender!=='girl'&&(!letter||letter==='A');

  const Header=<View>
    <Text style={styles.title}>Prénoms</Text>
    <Text style={styles.sub}>{MUSLIM_NAMES.length} fiches · sens, écriture arabe, variantes, sources</Text>

    <View style={styles.search}>
      <Ionicons name="search" size={18} color={colors.goldLight}/>
      <TextInput value={query} onChangeText={setQuery} placeholder="Rechercher : Yusuf, Maryam, Youssef…" placeholderTextColor={colors.textMuted} style={styles.searchInput} autoCorrect={false} autoCapitalize="words" autoComplete="off" returnKeyType="search" accessibilityLabel="Rechercher un prénom"/>
      {query?<Pressable onPress={()=>setQuery('')} hitSlop={10} accessibilityLabel="Effacer la recherche"><Ionicons name="close-circle" size={19} color={colors.textMuted}/></Pressable>:null}
    </View>

    <View style={styles.segment}>
      {GENDERS.map(item=>{const active=gender===item.id;return <Pressable key={item.id} onPress={()=>setGender(item.id)} style={[styles.segmentItem,active&&styles.segmentActive]} accessibilityRole="button" accessibilityState={{selected:active}}>
        {item.id!=='all'?<View style={[styles.segmentDot,{backgroundColor:GENDER_ACCENT[item.id]}]}/>:null}
        <Text style={[styles.segmentText,active&&styles.segmentTextActive]}>{item.label}</Text>
      </Pressable>;})}
    </View>

    {!searching?<>
      <Text style={styles.label}>COLLECTIONS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} keyboardShouldPersistTaps="handled">
        {NAME_COLLECTIONS.filter(item=>counts[item.id]>0).map(item=><ChoiceChip key={item.id} label={item.title} count={counts[item.id]} active={collectionId===item.id} onPress={()=>{setCollectionId(collectionId===item.id?null:item.id);setLetter(null);}}/>)}
      </ScrollView>

      <View style={styles.links}>
        <LinkTile title="Aidez-nous à choisir" subtitle="Origine, longueur, lettre" onPress={()=>router.push('/prenoms/choisir')}/>
        <LinkTile title="Avant de choisir" subtitle="Repères, prénoms à éviter, avis des savants" tone="warn" onPress={()=>router.push('/prenoms/guide')}/>
      </View>

      {!collection?<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.letters} keyboardShouldPersistTaps="handled">
        {ALPHABET.map(char=>{const active=letter===char;return <Pressable key={char} onPress={()=>setLetter(active?null:char)} style={[styles.letter,active&&styles.letterActive]} accessibilityRole="button" accessibilityLabel={`Lettre ${char}`} accessibilityState={{selected:active}}><Text style={[styles.letterText,active&&styles.letterTextActive]}>{char}</Text></Pressable>;})}
      </ScrollView>:null}

      {showAbdEntry?<Pressable onPress={()=>{setCollectionId('abd');setLetter(null);}} style={({pressed})=>[styles.abdEntry,pressed&&styles.pressed]}>
        <View style={{flex:1}}><Text style={styles.abdTitle}>ʿAbd + Nom d’Allah</Text><Text style={styles.abdSub}>{abdCount} prénoms « serviteur de… », regroupés à part</Text></View>
        <Ionicons name="chevron-forward" size={17} color={colors.goldLight}/>
      </Pressable>:null}
    </>:null}

    {searching||collection?<View style={styles.resultHead}>
      <Text style={styles.resultText}>{visible.length} résultat{visible.length>1?'s':''}{collection?` · ${collection.title}`:''}</Text>
      {collection?<Pressable onPress={()=>setCollectionId(null)} hitSlop={8}><Text style={styles.reset}>Tout afficher</Text></Pressable>:null}
    </View>:null}

    {!searching&&!autoOpen&&sections.length>1?<View style={styles.foldBar}>
      <Text style={styles.foldHint}>Touchez une lettre pour voir ses prénoms</Text>
      <Pressable onPress={toggleAll} hitSlop={8}><Text style={styles.reset}>{allOpen?'Tout replier':'Tout déplier'}</Text></Pressable>
    </View>:null}
  </View>;

  const Empty=<View style={styles.empty}>
    <Text style={styles.emptyTitle}>Aucun prénom trouvé</Text>
    <Text style={styles.emptyText}>Essayez une autre graphie ou une variante (Youssef, Yusuf, Yousef…).</Text>
  </View>;

  return <LinearGradient colors={[colors.background,colors.backgroundSecondary,colors.background]} style={styles.screen}><SafeAreaView style={styles.safe}>
    <View style={styles.header}>
      <Pressable onPress={()=>router.back()} style={styles.iconButton} accessibilityLabel="Retour"><Ionicons name="chevron-back" size={22} color={colors.text}/></Pressable>
      <View style={{flex:1}}/>
      <Pressable onPress={()=>router.push('/prenoms/decouvrir')} style={styles.iconButton} accessibilityLabel="Un prénom au hasard"><Ionicons name="shuffle" size={19} color={colors.goldLight}/></Pressable>
      <Pressable onPress={()=>router.push('/prenoms/favoris')} style={styles.iconButton} accessibilityLabel="Mes favoris"><Ionicons name="heart-outline" size={20} color={colors.goldLight}/>{favorites.length?<View style={styles.badge}><Text style={styles.badgeText}>{favorites.length>9?'9+':favorites.length}</Text></View>:null}</Pressable>
    </View>
    <SectionList
      sections={sections}
      keyExtractor={(item,index)=>`${item.id}:${index}`}
      renderItem={({item})=><NameRow item={item} onPress={()=>open(item.id)} favorite={favorites.includes(item.id)} onFavorite={()=>void toggleFavorite(item.id)}/>}
      renderSectionHeader={({section})=>{
        if(!section.title) return null;
        const opened=section.data.length>0;
        return <Pressable disabled={autoOpen} onPress={()=>toggleLetter(section.title)} style={({pressed})=>[styles.sectionHead,pressed&&styles.pressed]} accessibilityRole="button" accessibilityState={{expanded:opened}} accessibilityLabel={`Lettre ${section.title}, ${section.count} prénoms`}>
          <Text style={styles.sectionLetter}>{section.title}</Text>
          <Text style={styles.sectionCount}>{section.count} prénom{section.count>1?'s':''}</Text>
          {!autoOpen?<Ionicons name={opened?'chevron-up':'chevron-down'} size={18} color={colors.goldLight} style={styles.sectionChevron}/>:null}
        </Pressable>;
      }}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={Header}
      ListEmptyComponent={Empty}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS==='ios'?'interactive':'on-drag'}
      automaticallyAdjustKeyboardInsets={Platform.OS==='ios'}
      initialNumToRender={16}
      maxToRenderPerBatch={20}
      windowSize={9}
    />
  </SafeAreaView></LinearGradient>;
}

function LinkTile({title,subtitle,onPress,tone}:{title:string;subtitle:string;onPress:()=>void;tone?:'warn'}){
  return <Pressable onPress={onPress} style={({pressed})=>[styles.linkTile,tone==='warn'&&styles.linkWarn,pressed&&styles.pressed]} accessibilityRole="button">
    <Text style={styles.linkTitle}>{title}</Text>
    <Text style={[styles.linkSub,tone==='warn'&&styles.linkSubWarn]}>{subtitle}</Text>
  </Pressable>;
}

const styles=StyleSheet.create({
  screen:{flex:1},safe:{flex:1},pressed:{opacity:.72},
  header:{minHeight:60,paddingHorizontal:16,flexDirection:'row',alignItems:'center',gap:8},
  iconButton:{width:40,height:40,borderRadius:14,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.borderSoft,backgroundColor:'rgba(255,255,255,.035)'},
  badge:{position:'absolute',right:-3,top:-3,minWidth:18,height:18,paddingHorizontal:4,borderRadius:9,alignItems:'center',justifyContent:'center',backgroundColor:colors.goldLight,borderWidth:2,borderColor:colors.background},
  badgeText:{color:colors.background,fontFamily:typography.sans,fontSize:8,fontWeight:'900'},
  content:{paddingHorizontal:18,paddingBottom:56},
  title:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:42,lineHeight:46},
  sub:{marginTop:2,color:colors.textMuted,fontFamily:typography.sans,fontSize:12},
  search:{marginTop:16,height:50,paddingHorizontal:14,borderRadius:16,borderWidth:1,borderColor:'rgba(227,181,90,.5)',backgroundColor:'rgba(227,181,90,.05)',flexDirection:'row',alignItems:'center',gap:10},
  searchInput:{flex:1,height:48,paddingVertical:0,color:colors.text,fontFamily:typography.sans,fontSize:14.5},
  segment:{marginTop:12,padding:3,borderRadius:14,borderWidth:1,borderColor:'rgba(126,78,151,.25)',backgroundColor:'rgba(255,255,255,.035)',flexDirection:'row'},
  segmentItem:{flex:1,height:36,borderRadius:11,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:6},
  segmentActive:{backgroundColor:colors.goldLight},
  segmentDot:{width:6,height:6,borderRadius:3},
  segmentText:{color:colors.textSecondary,fontFamily:typography.sans,fontSize:12.5,fontWeight:'700'},
  segmentTextActive:{color:colors.background,fontWeight:'900'},
  label:{marginTop:22,marginBottom:9,color:colors.goldLight,fontFamily:typography.sans,fontSize:9.5,fontWeight:'800',letterSpacing:1.4},
  chips:{gap:7,paddingRight:18},
  links:{marginTop:14,flexDirection:'row',gap:8},
  linkTile:{flex:1,padding:12,borderRadius:15,borderWidth:1,borderColor:'rgba(126,78,151,.25)',backgroundColor:'rgba(255,255,255,.025)'},
  linkWarn:{borderColor:'rgba(233,107,114,.38)'},
  linkTitle:{color:colors.text,fontFamily:typography.sans,fontSize:12.5,fontWeight:'800',lineHeight:17},
  linkSub:{marginTop:2,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5,lineHeight:14},
  linkSubWarn:{color:'#D79297'},
  letters:{marginTop:16,gap:5,paddingRight:18},
  letter:{width:30,height:32,borderRadius:9,alignItems:'center',justifyContent:'center'},
  letterActive:{backgroundColor:colors.goldLight},
  letterText:{color:colors.textSecondary,fontFamily:typography.sans,fontSize:12,fontWeight:'700'},
  letterTextActive:{color:colors.background,fontWeight:'900'},
  abdEntry:{marginTop:14,paddingVertical:12,paddingHorizontal:14,borderRadius:15,borderWidth:1,borderColor:'rgba(227,181,90,.30)',backgroundColor:'rgba(227,181,90,.05)',flexDirection:'row',alignItems:'center',gap:10},
  abdTitle:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:19},
  abdSub:{marginTop:1,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5},
  foldBar:{marginTop:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10},
  foldHint:{flex:1,color:colors.textMuted,fontFamily:typography.sans,fontSize:11.5},
  sectionChevron:{marginLeft:'auto',alignSelf:'center'},
  resultHead:{marginTop:18,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  resultText:{color:colors.textSecondary,fontFamily:typography.sans,fontSize:12,fontWeight:'700'},
  reset:{color:colors.goldLight,fontFamily:typography.sans,fontSize:11.5,fontWeight:'800'},
  sectionHead:{marginTop:6,paddingTop:10,paddingBottom:8,borderBottomWidth:1,borderBottomColor:colors.borderSoft,flexDirection:'row',alignItems:'baseline',gap:10},
  sectionLetter:{color:colors.goldLight,fontFamily:typography.serifSemibold,fontSize:32,lineHeight:36},
  sectionCount:{color:colors.textMuted,fontFamily:typography.sans,fontSize:11,fontVariant:['tabular-nums']},
  empty:{marginTop:26,alignItems:'center'},
  emptyTitle:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:22},
  emptyText:{marginTop:4,color:colors.textMuted,fontFamily:typography.sans,fontSize:12,lineHeight:18,textAlign:'center'},
});
