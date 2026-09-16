import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { NAME_STATUS_META, type MuslimName, type NameStatus } from './types';

export const prenomTheme = {
  card: 'rgba(23,16,38,0.88)',
  cardStrong: 'rgba(30,19,46,0.96)',
  goldWash: 'rgba(227,181,90,0.08)',
  borderGold: 'rgba(227,181,90,0.36)',
};

export function ScreenHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return <View style={s.header}>
    <Pressable onPress={onBack} style={({pressed})=>[s.iconButton,pressed&&s.pressed]} accessibilityRole="button" accessibilityLabel="Retour">
      <Ionicons name="chevron-back" size={22} color={colors.text}/>
    </Pressable>
    <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
    <View style={s.headerRight}>{right ?? <View style={s.spacer}/>}</View>
  </View>;
}

export function StatusPill({ status, compact = false }: { status: NameStatus; compact?: boolean }) {
  const meta = NAME_STATUS_META[status];
  const tone = status === 'forbidden' ? colors.danger : status === 'discouraged' || status === 'note' ? colors.goldLight : colors.success;
  return <View style={[s.statusPill,{borderColor:`${tone}55`,backgroundColor:`${tone}12`},compact&&s.statusCompact]}>
    <Text style={[s.statusText,{color:tone},compact&&s.statusTextCompact]}>{meta.symbol} {meta.label}</Text>
  </View>;
}


export function EditorialPill({ item, compact = false }: { item: MuslimName; compact?: boolean }) {
  const level = item.editorialLevel ?? 'reviewed';
  if (level === 'catalogue') {
    return <View style={[s.editorialPill, compact && s.statusCompact]}><Ionicons name="library-outline" size={compact?10:12} color={colors.goldLight}/><Text style={[s.editorialText,compact&&s.statusTextCompact]}>Catalogue</Text></View>;
  }
  const sourced = level === 'sourced';
  return <View style={[s.editorialPill,s.editorialVerified, compact && s.statusCompact]}><Ionicons name={sourced?'shield-checkmark-outline':'checkmark-circle-outline'} size={compact?10:12} color={colors.success}/><Text style={[s.editorialText,{color:colors.success},compact&&s.statusTextCompact]}>{sourced?'Sourcé':'Vérifié'}</Text></View>;
}

export function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  return <View style={s.sectionHead}>
    <View style={{flex:1}}>{eyebrow ? <Text style={s.eyebrow}>{eyebrow}</Text> : null}<Text style={s.sectionTitle}>{title}</Text></View>
    {action && onAction ? <Pressable onPress={onAction} hitSlop={8}><Text style={s.sectionAction}>{action}</Text></Pressable> : null}
  </View>;
}

export function NameRow({ item, onPress, favorite, onFavorite }: { item: MuslimName; onPress: () => void; favorite?: boolean; onFavorite?: () => void }) {
  const genderAccent=item.gender==='boy'?'#78B9FF':'#F2A6C7';
  const genderWash=item.gender==='boy'?'rgba(86,155,235,.065)':'rgba(231,126,174,.065)';
  return <Pressable onPress={onPress} style={({pressed})=>[s.nameRow,{backgroundColor:genderWash},pressed&&s.pressed]}>
    <View style={[s.genderRail,{backgroundColor:genderAccent}]}/>
    <View style={s.nameMain}>
      <View style={s.nameLine}><Text style={s.name}>{item.name}</Text><Text style={s.arabic}>{item.arabic}</Text></View>
      <Text style={s.meaning} numberOfLines={2}>{item.meaning}</Text>
      {item.story && item.story !== item.meaning ? <Text style={s.story} numberOfLines={2}>{item.story}</Text> : null}
      <View style={s.metaLine}>{item.editorialLevel==='catalogue'?<EditorialPill item={item} compact/>:<StatusPill status={item.status} compact/>}<Text style={s.origin} numberOfLines={1}>{item.origin.join(' · ')}</Text></View>
    </View>
    {onFavorite ? <Pressable onPress={(e)=>{e.stopPropagation();onFavorite();}} style={s.favoriteButton} hitSlop={8} accessibilityRole="button" accessibilityLabel={favorite?'Retirer des favoris':'Ajouter aux favoris'}>
      <Ionicons name={favorite?'heart':'heart-outline'} size={19} color={favorite?colors.goldLight:colors.textMuted}/>
    </Pressable> : <Ionicons name="chevron-forward" size={17} color={colors.textMuted}/>} 
  </Pressable>;
}

export function ChoiceChip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap }) {
  return <Pressable onPress={onPress} style={({pressed})=>[s.chip,active&&s.chipActive,pressed&&s.pressed]}>
    {icon ? <Ionicons name={icon} size={14} color={active?colors.background:colors.textSecondary}/> : null}
    <Text style={[s.chipText,active&&s.chipTextActive]}>{label}</Text>
  </Pressable>;
}

const s=StyleSheet.create({
  header:{minHeight:68,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  iconButton:{width:42,height:42,borderRadius:15,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.borderSoft,backgroundColor:'rgba(255,255,255,0.035)'},
  headerTitle:{flex:1,textAlign:'center',paddingHorizontal:10,color:colors.text,fontFamily:typography.sans,fontSize:17,fontWeight:'700'},
  headerRight:{width:42,alignItems:'flex-end'},spacer:{width:42,height:42},pressed:{opacity:.72},
  statusPill:{alignSelf:'flex-start',paddingHorizontal:10,paddingVertical:6,borderRadius:999,borderWidth:1},statusCompact:{paddingHorizontal:7,paddingVertical:4},
  statusText:{fontFamily:typography.sans,fontSize:11,fontWeight:'800'},statusTextCompact:{fontSize:9.5},editorialPill:{alignSelf:'flex-start',paddingHorizontal:9,paddingVertical:5,borderRadius:999,borderWidth:1,borderColor:prenomTheme.borderGold,backgroundColor:prenomTheme.goldWash,flexDirection:'row',alignItems:'center',gap:4},editorialVerified:{borderColor:'rgba(69,194,134,.32)',backgroundColor:'rgba(69,194,134,.08)'},editorialText:{color:colors.goldLight,fontFamily:typography.sans,fontSize:10,fontWeight:'800'},
  sectionHead:{marginTop:28,marginBottom:11,flexDirection:'row',alignItems:'flex-end',gap:12},eyebrow:{color:colors.goldLight,fontFamily:typography.sans,fontSize:9,fontWeight:'800',letterSpacing:1.5},sectionTitle:{marginTop:4,color:colors.text,fontFamily:typography.sans,fontSize:21,fontWeight:'800',lineHeight:26},sectionAction:{color:colors.goldLight,fontFamily:typography.sans,fontSize:11.5,fontWeight:'700'},
  nameRow:{minHeight:124,padding:15,borderRadius:22,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:prenomTheme.card,flexDirection:'row',alignItems:'center',gap:10,overflow:'hidden'},genderRail:{position:'absolute',left:0,top:16,bottom:16,width:3,borderRadius:3},nameMain:{flex:1},nameLine:{flexDirection:'row',justifyContent:'space-between',alignItems:'baseline',gap:10},name:{color:colors.text,fontFamily:typography.sans,fontSize:19,fontWeight:'800'},arabic:{color:colors.goldLight,fontFamily:typography.arabic,fontSize:22},meaning:{marginTop:5,color:colors.textSecondary,fontFamily:typography.sans,fontSize:12.5,lineHeight:18},story:{marginTop:4,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5,lineHeight:15},metaLine:{marginTop:9,flexDirection:'row',alignItems:'center',gap:8},origin:{flex:1,color:colors.textMuted,fontFamily:typography.sans,fontSize:9.5},favoriteButton:{width:38,height:38,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,0.035)'},
  chip:{paddingHorizontal:13,paddingVertical:9,borderRadius:999,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:'rgba(255,255,255,0.035)',flexDirection:'row',alignItems:'center',gap:6},chipActive:{borderColor:colors.goldLight,backgroundColor:colors.goldLight},chipText:{color:colors.textSecondary,fontFamily:typography.sans,fontSize:11,fontWeight:'600'},chipTextActive:{color:colors.background,fontWeight:'800'},
});
