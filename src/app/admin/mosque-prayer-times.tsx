import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { adminListMosquePrayerTimeUpdates, adminReviewMosquePrayerTimeUpdate, type MosquePrayerTimeProposal } from '../../features/mosques/data/mosquePrayerUpdates';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

const KIND_LABELS: Record<MosquePrayerTimeProposal['kind'], string> = { regular: 'Horaires habituels', ramadan: 'Ramadan', eid_fitr: 'Aïd al-Fitr', eid_adha: 'Aïd al-Adha' };
const PRAYERS = [['fajr','Fajr'],['dhuhr','Dhuhr'],['asr','Asr'],['maghrib','Maghrib'],['isha','Isha']] as const;
const formatDay = (value?: string) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—';

/** What the proposal contains, as label / value / detail cells. */
function proposalItems(row: MosquePrayerTimeProposal) {
  const items: { label: string; value: string; detail?: string }[] = [];
  if (row.kind === 'regular') {
    for (const [key, label] of PRAYERS) {
      const iqama = row.iqama?.[key];
      const detail = iqama ? `Iqama ${'after' in iqama ? `+${iqama.after} min` : iqama.at}` : undefined;
      if (row[key] || detail) items.push({ label, value: row[key] ?? '—', detail });
    }
    (row.jumuahTimes ?? []).forEach((slot, index, all) => items.push({ label: all.length > 1 ? `Joumou’a ${index + 1}` : 'Joumou’a', value: slot.time, detail: slot.language }));
  } else if (row.kind === 'ramadan') {
    items.push({ label: 'Tarawih', value: row.tarawih ?? '—' });
    items.push({ label: 'Du', value: formatDay(row.validFrom) }, { label: 'Au', value: formatDay(row.validTo) });
  } else {
    items.push({ label: 'Date', value: formatDay(row.validFrom) });
    items.push({ label: 'Prière(s)', value: row.eidTimes?.join(' · ') ?? '—' });
  }
  return items;
}

export default function MosquePrayerTimesAdminScreen() {
  const [rows,setRows]=useState<MosquePrayerTimeProposal[]>([]);
  const [loading,setLoading]=useState(true); const [refreshing,setRefreshing]=useState(false); const [acting,setActing]=useState<string|null>(null);
  const load=useCallback(async(silent=false)=>{ if(!silent)setLoading(true); try{setRows(await adminListMosquePrayerTimeUpdates());}catch(e){Alert.alert('Administration',e instanceof Error?e.message:'Chargement impossible');}finally{setLoading(false);setRefreshing(false);}},[]);
  useFocusEffect(useCallback(()=>{void load();},[load]));
  const review=async(id:string,approve:boolean)=>{setActing(id);try{await adminReviewMosquePrayerTimeUpdate(id,approve);setRows((current)=>current.filter((row)=>row.id!==id));}catch(e){Alert.alert('Administration',e instanceof Error?e.message:'Action impossible');}finally{setActing(null);}};
  return <SafeAreaView edges={['top']} style={s.safe}>
    <View style={s.header}><Pressable onPress={()=>router.back()} style={s.back}><Ionicons name="arrow-back" size={23} color={colors.goldLight}/></Pressable><Text style={s.title}>Horaires des mosquées</Text><View style={s.back}/></View>
    {loading?<View style={s.center}><ActivityIndicator color={colors.goldLight}/></View>:<ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);void load(true);}}/>} contentContainerStyle={s.content}>
      {rows.length===0?<Text style={s.empty}>Aucune proposition en attente.</Text>:rows.map((row)=><View key={row.id} style={s.card}>
        <Text style={s.kind}>{KIND_LABELS[row.kind]}</Text>
        <Text style={s.mosque}>{row.mosqueName}</Text>{row.mosqueAddress?<Text style={s.address}>{row.mosqueAddress}</Text>:null}
        <View style={s.grid}>{proposalItems(row).map((item)=><View key={item.label} style={s.time}><Text style={s.timeLabel}>{item.label}</Text><Text style={s.timeValue}>{item.value}</Text>{item.detail?<Text style={s.timeDetail}>{item.detail}</Text>:null}</View>)}</View>
        {row.note?<Text style={s.note}>{row.note}</Text>:null}
        <View style={s.actions}><Pressable disabled={acting===row.id} onPress={()=>void review(row.id,false)} style={s.reject}><Text style={s.rejectText}>Refuser</Text></Pressable><Pressable disabled={acting===row.id} onPress={()=>void review(row.id,true)} style={s.approve}><Text style={s.approveText}>{acting===row.id?'…':'Valider'}</Text></Pressable></View>
      </View>)}
    </ScrollView>}
  </SafeAreaView>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:colors.background},header:{height:58,flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:14},back:{width:42,height:42,alignItems:'center',justifyContent:'center'},title:{color:colors.goldLight,fontFamily:typography.serifMedium,fontSize:21},center:{flex:1,alignItems:'center',justifyContent:'center'},content:{padding:16,paddingBottom:40},empty:{color:colors.textMuted,textAlign:'center',marginTop:60},card:{backgroundColor:'#18131F',borderRadius:20,borderWidth:1,borderColor:'rgba(242,181,61,0.2)',padding:17,marginBottom:14},mosque:{color:colors.goldLight,fontFamily:typography.sansBold,fontSize:17},address:{color:colors.textMuted,fontFamily:typography.sans,fontSize:12,marginTop:4},grid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:14},time:{minWidth:'30%',backgroundColor:'#100C16',borderRadius:11,padding:9},timeLabel:{color:colors.textMuted,fontSize:11},timeValue:{color:colors.text,fontFamily:typography.sansBold,fontSize:16,marginTop:2},timeDetail:{color:colors.goldLight,fontSize:11,marginTop:2},kind:{color:colors.goldLight,fontFamily:typography.sansBold,fontSize:11,textTransform:'uppercase',letterSpacing:0.8,marginBottom:4},note:{color:colors.text,marginTop:12,fontSize:13},actions:{flexDirection:'row',gap:10,marginTop:16},reject:{flex:1,minHeight:44,borderRadius:12,borderWidth:1,borderColor:'#F28B82',alignItems:'center',justifyContent:'center'},rejectText:{color:'#F28B82',fontFamily:typography.sansBold},approve:{flex:1,minHeight:44,borderRadius:12,backgroundColor:colors.goldLight,alignItems:'center',justifyContent:'center'},approveText:{color:colors.background,fontFamily:typography.sansBold}});
