import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Href, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MUSLIM_NAMES, searchMuslimNames } from '../../features/muslim-names/data';
import { loadNameFavorites, toggleNameFavorite } from '../../features/muslim-names/storage';
import { usePrenomsText } from '../../features/muslim-names/i18n';
import { NameRow, ScreenHeader, prenomTheme } from '../../features/muslim-names/ui';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function FavoritesScreen(){
  const { tx } = usePrenomsText();
  const [ids,setIds]=useState<string[]>([]);const [query,setQuery]=useState('');
  useFocusEffect(useCallback(()=>{void loadNameFavorites().then(setIds);},[]));
  const all=ids.map(id=>MUSLIM_NAMES.find(x=>x.id===id)).filter((x):x is (typeof MUSLIM_NAMES)[number]=>Boolean(x));
  const names=useMemo(()=>searchMuslimNames(query,all),[query,ids]);
  const toggle=async(id:string)=>setIds(await toggleNameFavorite(id));
  return <LinearGradient colors={[colors.background,colors.backgroundSecondary,colors.background]} style={styles.screen}><SafeAreaView style={styles.safe}><ScreenHeader title={tx.favoritesHeader} onBack={()=>router.back()}/><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>{tx.favoritesEyebrow}</Text><Text style={styles.title}>{all.length?tx.favoritesCount(all.length):tx.favoritesEmptyTitle}</Text><Text style={styles.subtitle}>{tx.favoritesSub}</Text>
    {all.length>5?<View style={styles.search}><Ionicons name="search-outline" size={18} color={colors.textMuted}/><TextInput value={query} onChangeText={setQuery} style={styles.input} placeholder={tx.favoritesSearch} placeholderTextColor={colors.textMuted}/></View>:null}
    {names.length?<View style={styles.list}>{names.map(item=><NameRow key={item.id} item={item} onPress={()=>router.push(`/prenoms/${item.id}` as Href)} favorite onFavorite={()=>void toggle(item.id)}/>)}</View>:all.length?null:<View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="heart-outline" size={25} color={colors.goldLight}/></View><Text style={styles.emptyTitle}>{tx.favoritesStart}</Text><Text style={styles.emptyText}>{tx.favoritesStartText}</Text><Pressable onPress={()=>router.replace('/prenoms')} style={styles.button}><Text style={styles.buttonText}>{tx.explore}</Text></Pressable></View>}
    {all.length?<View style={styles.tip}><Ionicons name="bulb-outline" size={18} color={colors.goldLight}/><Text style={styles.tipText}>{tx.favoritesTip}</Text></View>:null}
  </ScrollView></SafeAreaView></LinearGradient>;
}
const styles=StyleSheet.create({screen:{flex:1},safe:{flex:1},content:{padding:16,paddingBottom:50},eyebrow:{color:colors.goldLight,fontFamily:typography.sans,fontSize:9,fontWeight:'800',letterSpacing:1.4},title:{marginTop:5,color:colors.text,fontFamily:typography.sans,fontSize:25,fontWeight:'800'},subtitle:{marginTop:6,color:colors.textSecondary,fontFamily:typography.sans,fontSize:12.5,lineHeight:19},search:{marginTop:16,height:50,paddingHorizontal:14,borderRadius:17,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:'rgba(255,255,255,.04)',flexDirection:'row',alignItems:'center',gap:9},input:{flex:1,color:colors.text,fontFamily:typography.sans,fontSize:13},list:{marginTop:18,gap:9},empty:{marginTop:30,padding:26,alignItems:'center',borderRadius:27,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card},emptyIcon:{width:52,height:52,borderRadius:18,alignItems:'center',justifyContent:'center',backgroundColor:prenomTheme.goldWash},emptyTitle:{marginTop:13,color:colors.text,fontFamily:typography.sans,fontSize:18,fontWeight:'800'},emptyText:{marginTop:6,color:colors.textMuted,fontFamily:typography.sans,fontSize:11.5,lineHeight:18,textAlign:'center'},button:{marginTop:18,paddingHorizontal:18,paddingVertical:12,borderRadius:15,backgroundColor:colors.goldLight},buttonText:{color:colors.background,fontFamily:typography.sans,fontSize:11.5,fontWeight:'800'},tip:{marginTop:18,padding:16,borderRadius:20,backgroundColor:prenomTheme.goldWash,flexDirection:'row',gap:10},tipText:{flex:1,color:colors.textSecondary,fontFamily:typography.sans,fontSize:10.5,lineHeight:16}});
