import type { ReactNode } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { MuslimName } from './types';
import { UNDOCUMENTED_MEANING, getNameMeaning, getStatusBasis } from './presentation';

export const prenomTheme = {
  card: 'rgba(23,16,38,0.88)',
  cardStrong: 'rgba(30,19,46,0.96)',
  goldWash: 'rgba(227,181,90,0.08)',
  borderGold: 'rgba(227,181,90,0.36)',
};

export const GENDER_ACCENT = { boy: '#78B9FF', girl: '#F2A6C7' } as const;

export function ScreenHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return <View style={s.header}>
    <Pressable onPress={onBack} style={({pressed})=>[s.iconButton,pressed&&s.pressed]} accessibilityRole="button" accessibilityLabel="Retour">
      <Ionicons name="chevron-back" size={22} color={colors.text}/>
    </Pressable>
    <Text style={s.headerTitle} numberOfLines={1}>{title}</Text>
    <View style={s.headerRight}>{right ?? <View style={s.spacer}/>}</View>
  </View>;
}

/** « ✓ Recommandé », shown only when a text establishes it (getStatusBasis). */
export function RecommendedPill({ compact = false }: { compact?: boolean }) {
  return <View style={[s.recommended, compact && s.recommendedCompact]}>
    <Text style={[s.recommendedText, compact && s.recommendedTextCompact]}>✓ Recommandé</Text>
  </View>;
}

/** One dictionary entry: gender dot, name, Arabic, meaning on one line. */
export function NameRow({ item, onPress, favorite, onFavorite }: { item: MuslimName; onPress: () => void; favorite?: boolean; onFavorite?: () => void }) {
  const basis = getStatusBasis(item);
  const meaning = getNameMeaning(item);
  return <Pressable onPress={onPress} style={({pressed})=>[s.row,pressed&&s.pressed]} accessibilityRole="button" accessibilityLabel={`${item.name}, ${meaning?.text ?? UNDOCUMENTED_MEANING}`}>
    <View style={s.rowMain}>
      <View style={s.rowTop}>
        <View style={[s.dot,{backgroundColor:GENDER_ACCENT[item.gender]}]}/>
        <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
        {basis ? <Text style={s.rowCheck}>✓</Text> : null}
        {item.arabic && item.arabic !== '—' ? <Text style={s.rowArabic} numberOfLines={1}>{item.arabic}</Text> : null}
      </View>
      <Text style={[s.rowMeaning,!meaning&&s.rowMeaningMissing]} numberOfLines={1}>{meaning?.text ?? UNDOCUMENTED_MEANING}</Text>
    </View>
    {onFavorite ? <Pressable onPress={(e)=>{e.stopPropagation();onFavorite();}} style={s.heart} hitSlop={10} accessibilityRole="button" accessibilityLabel={favorite?'Retirer des favoris':'Ajouter aux favoris'}>
      <Ionicons name={favorite?'heart':'heart-outline'} size={18} color={favorite?colors.goldLight:colors.textMuted}/>
    </Pressable> : null}
  </Pressable>;
}

export function ChoiceChip({ label, active, onPress, icon, count }: { label: string; active?: boolean; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; count?: number }) {
  return <Pressable onPress={onPress} style={({pressed})=>[s.chip,active&&s.chipActive,pressed&&s.pressed]} accessibilityRole="button" accessibilityState={{selected:Boolean(active)}}>
    {icon ? <Ionicons name={icon} size={14} color={active?colors.background:colors.textSecondary}/> : null}
    <Text style={[s.chipText,active&&s.chipTextActive]}>{label}</Text>
    {count !== undefined ? <Text style={[s.chipCount,active&&s.chipTextActive]}>{count}</Text> : null}
  </Pressable>;
}

const s=StyleSheet.create({
  header:{minHeight:64,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
  iconButton:{width:42,height:42,borderRadius:15,alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:colors.borderSoft,backgroundColor:'rgba(255,255,255,0.035)'},
  headerTitle:{flex:1,textAlign:'center',paddingHorizontal:10,color:colors.text,fontFamily:typography.sans,fontSize:17,fontWeight:'700'},
  headerRight:{minWidth:42,alignItems:'flex-end'},spacer:{width:42,height:42},pressed:{opacity:.72},
  recommended:{alignSelf:'flex-start',paddingHorizontal:10,paddingVertical:5,borderRadius:999,borderWidth:1,borderColor:'rgba(98,197,139,.45)',backgroundColor:'rgba(98,197,139,.08)'},
  recommendedCompact:{paddingHorizontal:7,paddingVertical:3},
  recommendedText:{color:colors.success,fontFamily:typography.sans,fontSize:11,fontWeight:'800'},recommendedTextCompact:{fontSize:9.5},
  row:{minHeight:66,paddingVertical:11,borderBottomWidth:1,borderBottomColor:'rgba(126,78,151,.20)',flexDirection:'row',alignItems:'center',gap:10},
  rowMain:{flex:1,minWidth:0},
  rowTop:{flexDirection:'row',alignItems:'center',gap:7},
  dot:{width:6,height:6,borderRadius:3},
  rowName:{flexShrink:1,color:colors.text,fontFamily:typography.serifSemibold,fontSize:22,lineHeight:27},
  rowCheck:{color:colors.success,fontFamily:typography.sans,fontSize:12,fontWeight:'900'},
  rowArabic:{marginLeft:'auto',maxWidth:'45%',color:colors.goldLight,fontFamily:typography.arabic,fontSize:20},
  rowMeaning:{marginTop:2,marginLeft:13,color:colors.textSecondary,fontFamily:typography.sans,fontSize:12.5,lineHeight:18},
  rowMeaningMissing:{color:colors.textMuted,fontStyle:'italic'},
  heart:{width:34,height:34,alignItems:'center',justifyContent:'center'},
  chip:{paddingHorizontal:12,paddingVertical:8,borderRadius:999,borderWidth:1,borderColor:colors.borderSoft,backgroundColor:'rgba(255,255,255,0.03)',flexDirection:'row',alignItems:'center',gap:6},
  chipActive:{borderColor:colors.goldLight,backgroundColor:colors.goldLight},
  chipText:{color:colors.textSecondary,fontFamily:typography.sans,fontSize:12,fontWeight:'600'},
  chipCount:{color:colors.textMuted,fontFamily:typography.sans,fontSize:11,fontVariant:['tabular-nums']},
  chipTextActive:{color:colors.background,fontWeight:'800'},
});
