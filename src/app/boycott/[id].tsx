import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getBoycottCatalog } from '../../features/boycott/data/BoycottRepository';
import { BOYCOTT_CATEGORY_LABELS, boycottSummary, type BoycottEntity } from '../../features/boycott/domain/BoycottEntity';
import { useI18n } from '../../i18n';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export default function BoycottDetailScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<BoycottEntity | null>(null);
  useEffect(() => { void getBoycottCatalog().then((items) => setItem(items.find((x) => x.id === id) ?? null)); }, [id]);

  return <LinearGradient colors={['#090713', '#120A1D', '#090713']} style={styles.screen}><SafeAreaView edges={['top']} style={styles.safe}>
    <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.headerButton}><Ionicons name="arrow-back" size={21} color={colors.goldLight} /></Pressable><Text style={styles.headerTitle}>{t("boycottDetail.title")}</Text><View style={styles.headerButton} /></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      {item ? <>
        <View style={styles.identity}><View style={styles.monogram}><Text style={styles.monogramText}>{item.name[0]}</Text></View><Text style={styles.name}>{item.name}</Text><Text style={styles.meta}>{BOYCOTT_CATEGORY_LABELS[item.category]}{item.parentGroup ? ` · ${t('boycottDetail.group', { group: item.parentGroup })}` : ''}</Text><View style={styles.redBadge}><View style={styles.redDot}/><Text style={styles.redText}>{t("scan.badgeBoycott")}</Text></View></View>
        <View style={styles.card}><Text style={styles.cardEyebrow}>{t("boycottDetail.why")}</Text><Text style={styles.summary}>{boycottSummary(item)}</Text></View>
        <View style={styles.card}><Text style={styles.cardEyebrow}>{t("boycottDetail.sources")}</Text>{item.sources.map((source, index) => <Pressable key={`${source.url}-${index}`} onPress={() => void Linking.openURL(source.url)} style={styles.source}><View style={styles.sourceIcon}><Ionicons name="document-text-outline" size={18} color={colors.goldLight} /></View><View style={{flex:1}}><Text style={styles.sourceTitle}>{source.label}</Text>{source.publishedAt ? <Text style={styles.sourceDate}>{source.publishedAt}</Text> : null}</View><Ionicons name="open-outline" size={17} color={colors.textMuted} /></Pressable>)}</View>
        <View style={styles.notice}><Ionicons name="shield-checkmark-outline" size={20} color={colors.goldLight}/><Text style={styles.noticeText}>{t("boycottDetail.notice")}</Text></View>
        <Text style={styles.verified}>{t('boycottDetail.lastCheck', { date: item.lastVerifiedAt })}</Text>
      </> : <Text style={styles.missing}>{t("boycottDetail.notFound")}</Text>}
    </ScrollView>
  </SafeAreaView></LinearGradient>;
}

const styles = StyleSheet.create({
  screen:{flex:1}, safe:{flex:1}, header:{height:58,paddingHorizontal:16,flexDirection:'row',alignItems:'center',justifyContent:'space-between'}, headerButton:{width:42,height:42,borderRadius:16,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,0.045)',borderWidth:1,borderColor:'rgba(255,255,255,0.07)'}, headerTitle:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:22}, content:{padding:16,paddingBottom:42},
  identity:{alignItems:'center',paddingVertical:22}, monogram:{width:78,height:78,borderRadius:26,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,0.05)',borderWidth:1,borderColor:'rgba(255,255,255,0.08)'}, monogramText:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:38}, name:{marginTop:14,color:colors.text,fontFamily:typography.serifSemibold,fontSize:30}, meta:{marginTop:4,color:colors.textMuted,fontFamily:typography.sans,fontSize:12.5,textAlign:'center'}, redBadge:{marginTop:14,height:34,paddingHorizontal:14,borderRadius:17,flexDirection:'row',alignItems:'center',gap:7,backgroundColor:'rgba(175,35,44,0.18)',borderWidth:1,borderColor:'rgba(236,79,87,0.38)'}, redDot:{width:8,height:8,borderRadius:4,backgroundColor:'#EF5960'}, redText:{color:'#FF8A90',fontFamily:typography.sans,fontSize:11,fontWeight:'900',letterSpacing:1},
  card:{marginTop:10,padding:18,borderRadius:24,backgroundColor:'rgba(24,17,34,0.9)',borderWidth:1,borderColor:'rgba(255,255,255,0.07)'}, cardEyebrow:{color:colors.goldLight,fontFamily:typography.sans,fontSize:10.5,fontWeight:'800',letterSpacing:1.2}, summary:{marginTop:9,color:colors.textSecondary,fontFamily:typography.sans,fontSize:15,lineHeight:23}, source:{minHeight:62,marginTop:10,flexDirection:'row',alignItems:'center',gap:11}, sourceIcon:{width:40,height:40,borderRadius:14,alignItems:'center',justifyContent:'center',backgroundColor:'rgba(221,183,101,0.09)'}, sourceTitle:{color:colors.text,fontFamily:typography.sans,fontSize:13,fontWeight:'700'}, sourceDate:{marginTop:2,color:colors.textMuted,fontFamily:typography.sans,fontSize:10.5}, notice:{marginTop:14,padding:15,borderRadius:20,flexDirection:'row',gap:10,backgroundColor:'rgba(221,183,101,0.06)',borderWidth:1,borderColor:'rgba(221,183,101,0.14)'}, noticeText:{flex:1,color:colors.textMuted,fontFamily:typography.sans,fontSize:11.5,lineHeight:17}, verified:{marginTop:14,textAlign:'center',color:'#665E6D',fontFamily:typography.sans,fontSize:10.5}, missing:{color:colors.textMuted,fontFamily:typography.sans,textAlign:'center',marginTop:40}
});
