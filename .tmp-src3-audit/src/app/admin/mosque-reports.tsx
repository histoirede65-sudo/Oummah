import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getValidSession } from "../../features/auth/SupabaseAuthService";
import { isOummahAdminSession } from "../../features/auth/AdminAccess";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Status="pending"|"resolved"|"ignored";
type Row={id:string;mosque_id:string;mosque_name:string;mosque_address:string;reason:string;details:string|null;reporter_email:string|null;created_at:string};
const labels:Record<string,string>={wrong_address:"Mauvaise adresse",wrong_hours:"Horaires incorrects",closed:"Mosquée fermée",duplicate:"Doublon",wrong_information:"Informations erronées",other:"Autre problème"};

async function rpc<T>(name:string,body:Record<string,unknown>={}):Promise<T>{
  const session=await getValidSession(true);
  if(!isOummahAdminSession(session))throw new Error("ADMIN_FORBIDDEN");
  const url=process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/,"");
  const key=(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY??process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
  if(!url||!key)throw new Error("ADMIN_SUPABASE_NOT_CONFIGURED");
  const r=await fetch(`${url}/rest/v1/rpc/${name}`,{method:"POST",headers:{apikey:key,Authorization:`Bearer ${session!.accessToken}`,"Content-Type":"application/json"},body:JSON.stringify(body)});
  if(!r.ok)throw new Error(await r.text());return await r.json() as T;
}

export default function AdminReports(){
  const [status,setStatus]=useState<Status>("pending"),[rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false),[acting,setActing]=useState<string|null>(null);
  const load=useCallback(async(silent=false)=>{if(!silent)setLoading(true);try{setRows(await rpc<Row[]>("admin_list_mosque_reports",{p_status:status}));}catch(e){Alert.alert("Administration",e instanceof Error?e.message:"Erreur");}finally{setLoading(false);setRefreshing(false);}},[status]);
  useFocusEffect(useCallback(()=>{void load();},[load]));
  const update=async(row:Row,next:"resolved"|"ignored",hide=false)=>{setActing(row.id);try{await rpc("admin_review_mosque_report",{p_report_id:row.id,p_status:next,p_hide_mosque:hide});await load(true);}catch(e){Alert.alert("Action impossible",e instanceof Error?e.message:"Erreur");}finally{setActing(null);}};

  return <SafeAreaView style={s.safe} edges={["top"]}>
    <View style={s.header}><Pressable onPress={()=>router.back()} style={s.back}><Ionicons name="arrow-back" size={22} color={colors.goldLight}/></Pressable><View style={{alignItems:"center"}}><Text style={s.eye}>ADMINISTRATION</Text><Text style={s.title}>Signalements</Text></View><Pressable onPress={()=>void load()} style={s.back}><Ionicons name="refresh" size={20} color={colors.goldLight}/></Pressable></View>
    <View style={s.tabs}>{(["pending","resolved","ignored"] as const).map(x=><Pressable key={x} onPress={()=>setStatus(x)} style={[s.tab,status===x&&s.active]}><Text style={[s.tabText,status===x&&s.activeText]}>{x==="pending"?"En attente":x==="resolved"?"Résolus":"Ignorés"}</Text></Pressable>)}</View>
    {loading?<ActivityIndicator style={{marginTop:70}} color={colors.goldLight}/>:<ScrollView contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>{setRefreshing(true);void load(true);}} tintColor={colors.goldLight}/>}>
      {rows.length===0?<Text style={s.empty}>Aucun signalement.</Text>:rows.map(row=><View key={row.id} style={s.card}>
        <Text style={s.badge}>{labels[row.reason]??row.reason}</Text><Text style={s.name}>{row.mosque_name}</Text><Text style={s.address}>{row.mosque_address}</Text>{row.details?<Text style={s.details}>{row.details}</Text>:null}<Text style={s.reporter}>Signalé par {row.reporter_email??"un utilisateur"}</Text>
        {status==="pending"?<><View style={s.actions}><Pressable disabled={acting===row.id} onPress={()=>void update(row,"ignored")} style={[s.btn,s.outline]}><Text style={s.outlineText}>Ignorer</Text></Pressable><Pressable disabled={acting===row.id} onPress={()=>void update(row,"resolved")} style={s.btn}><Text style={s.btnText}>{acting===row.id?"…":"Résolu"}</Text></Pressable></View>{row.reason==="closed"?<Pressable onPress={()=>Alert.alert("Masquer la mosquée","Elle sera masquée du public.",[{text:"Annuler",style:"cancel"},{text:"Masquer",style:"destructive",onPress:()=>void update(row,"resolved",true)}])} style={s.hide}><Text style={s.hideText}>Masquer du public</Text></Pressable>:null}</>:null}
      </View>)}
    </ScrollView>}
  </SafeAreaView>;
}
const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.background},header:{minHeight:70,paddingHorizontal:18,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:colors.border},back:{width:42,height:42,borderRadius:21,alignItems:"center",justifyContent:"center",backgroundColor:colors.card},eye:{color:colors.goldMuted,fontSize:8,fontWeight:"800",letterSpacing:1.2},title:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:23},
  tabs:{padding:12,flexDirection:"row",gap:8},tab:{flex:1,minHeight:44,alignItems:"center",justifyContent:"center",borderRadius:13,backgroundColor:colors.card},active:{backgroundColor:colors.goldLight},tabText:{color:colors.textMuted,fontWeight:"800"},activeText:{color:colors.background},content:{padding:18,paddingBottom:50},empty:{paddingTop:70,textAlign:"center",color:colors.textMuted},
  card:{marginBottom:12,padding:15,borderRadius:18,borderWidth:1,borderColor:colors.border,backgroundColor:colors.card},badge:{alignSelf:"flex-start",padding:6,color:"#F28B82",fontSize:9,fontWeight:"800",borderRadius:8,backgroundColor:"rgba(242,139,130,0.10)"},name:{marginTop:12,color:colors.text,fontFamily:typography.serifMedium,fontSize:17},address:{marginTop:4,color:colors.textMuted,fontSize:10.5},details:{marginTop:11,padding:11,color:colors.textSecondary,fontSize:11,borderRadius:12,backgroundColor:colors.background},reporter:{marginTop:10,color:colors.textMuted,fontSize:9},actions:{marginTop:13,flexDirection:"row",gap:8},btn:{flex:1,minHeight:42,alignItems:"center",justifyContent:"center",borderRadius:12,backgroundColor:colors.goldLight},btnText:{color:colors.background,fontWeight:"800"},outline:{borderWidth:1,borderColor:colors.border,backgroundColor:"transparent"},outlineText:{color:colors.textSecondary,fontWeight:"800"},hide:{marginTop:9,minHeight:42,alignItems:"center",justifyContent:"center",borderRadius:12,borderWidth:1,borderColor:"#F28B82"},hideText:{color:"#F28B82",fontWeight:"800"}
});
