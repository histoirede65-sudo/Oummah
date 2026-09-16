import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createMosqueReport, type MosqueReportReason } from "../../features/mosques/data/mosqueReports";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const REASONS: Array<{value:MosqueReportReason;label:string;icon:keyof typeof Ionicons.glyphMap}> = [
  { value:"wrong_address", label:"Mauvaise adresse", icon:"location-outline" },
  { value:"wrong_hours", label:"Horaires incorrects", icon:"time-outline" },
  { value:"closed", label:"Mosquée fermée", icon:"lock-closed-outline" },
  { value:"duplicate", label:"Doublon", icon:"copy-outline" },
  { value:"wrong_information", label:"Informations erronées", icon:"alert-circle-outline" },
  { value:"other", label:"Autre problème", icon:"ellipsis-horizontal-circle-outline" },
];
const one=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;

export default function MosqueReportScreen() {
  const p=useLocalSearchParams<{mosqueId?:string;mosqueName?:string;mosqueAddress?:string;latitude?:string;longitude?:string}>();
  const mosque=useMemo(()=> {
    const id=one(p.mosqueId), name=one(p.mosqueName), address=one(p.mosqueAddress);
    const latitude=Number(one(p.latitude)), longitude=Number(one(p.longitude));
    return id&&name&&address&&Number.isFinite(latitude)&&Number.isFinite(longitude)?{id,name,address,latitude,longitude}:null;
  },[p]);
  const [reason,setReason]=useState<MosqueReportReason|null>(null);
  const [details,setDetails]=useState("");
  const [sending,setSending]=useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const subscription = Keyboard.addListener("keyboardDidShow", () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({animated:true}), 120);
    });
    return () => subscription.remove();
  }, []);

  const submit=async()=>{
    if(!mosque||!reason||sending)return;
    setSending(true);
    try{
      await createMosqueReport({mosqueId:mosque.id,mosqueName:mosque.name,mosqueAddress:mosque.address,latitude:mosque.latitude,longitude:mosque.longitude,reason,details});
      Alert.alert("Signalement envoyé","Merci. Il sera vérifié par l’équipe OUMMAH.",[{text:"OK",onPress:()=>router.back()}]);
    }catch{
      Alert.alert("Envoi impossible","Réessayez dans quelques instants.");
    }finally{setSending(false);}
  };

  return <SafeAreaView style={s.safe} edges={["top"]}>
    <View style={s.header}>
      <Pressable onPress={()=>router.back()} style={s.back}><Ionicons name="arrow-back" size={22} color={colors.goldLight}/></Pressable>
      <Text style={s.title}>Signaler un problème</Text><View style={{width:42}}/>
    </View>
    <KeyboardAvoidingView
      style={s.keyboard}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
    <ScrollView
      ref={scrollRef}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
      automaticallyAdjustKeyboardInsets
    >
      <View style={s.mosque}><Ionicons name="business-outline" size={22} color={colors.goldLight}/><View style={{flex:1,marginLeft:12}}><Text style={s.name}>{mosque?.name??"Mosquée"}</Text><Text style={s.address}>{mosque?.address??""}</Text></View></View>
      <Text style={s.section}>Quel est le problème ?</Text>
      {REASONS.map(x=><Pressable key={x.value} onPress={()=>setReason(x.value)} style={[s.reason,reason===x.value&&s.selected]}>
        <Ionicons name={x.icon} size={19} color={colors.goldLight}/><Text style={s.reasonText}>{x.label}</Text><Ionicons name={reason===x.value?"checkmark-circle":"ellipse-outline"} size={20} color={reason===x.value?colors.goldLight:colors.textMuted}/>
      </Pressable>)}
      <Text style={s.section}>Précisions</Text>
      <TextInput value={details} onChangeText={setDetails} multiline maxLength={1000} placeholder="Expliquez brièvement…" placeholderTextColor={colors.textMuted} style={s.area}/>
      <Pressable disabled={!reason||sending||!mosque} onPress={()=>void submit()} style={[s.submit,(!reason||sending||!mosque)&&{opacity:.45}]}>
        {sending?<ActivityIndicator color={colors.background}/>:<Ionicons name="send-outline" size={18} color={colors.background}/>}
        <Text style={s.submitText}>{sending?"Envoi…":"Envoyer le signalement"}</Text>
      </Pressable>
    </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
const s=StyleSheet.create({
  safe:{flex:1,backgroundColor:colors.background},keyboard:{flex:1},header:{minHeight:68,paddingHorizontal:18,flexDirection:"row",alignItems:"center",justifyContent:"space-between",borderBottomWidth:1,borderBottomColor:colors.border},
  back:{width:42,height:42,borderRadius:21,alignItems:"center",justifyContent:"center",backgroundColor:colors.card},title:{color:colors.text,fontFamily:typography.serifSemibold,fontSize:21},
  content:{flexGrow:1,padding:18,paddingBottom:220},mosque:{padding:15,flexDirection:"row",alignItems:"center",borderRadius:17,borderWidth:1,borderColor:colors.border,backgroundColor:colors.card},
  name:{color:colors.text,fontWeight:"800"},address:{marginTop:4,color:colors.textMuted,fontSize:10.5},section:{marginTop:22,marginBottom:11,color:colors.goldLight,fontFamily:typography.serifMedium,fontSize:18},
  reason:{minHeight:58,marginBottom:9,paddingHorizontal:13,flexDirection:"row",alignItems:"center",gap:11,borderRadius:14,borderWidth:1,borderColor:colors.border,backgroundColor:colors.card},
  selected:{borderColor:colors.goldLight,backgroundColor:"rgba(241,188,79,0.08)"},reasonText:{flex:1,color:colors.text,fontWeight:"700"},area:{minHeight:120,padding:13,color:colors.text,textAlignVertical:"top",borderRadius:15,borderWidth:1,borderColor:colors.border,backgroundColor:colors.card},
  submit:{minHeight:52,marginTop:21,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,borderRadius:15,backgroundColor:colors.goldLight},submitText:{color:colors.background,fontWeight:"800"}
});
