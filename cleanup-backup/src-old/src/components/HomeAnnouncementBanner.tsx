import { Ionicons } from "@expo/vector-icons";
import type { Href } from "expo-router";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { getActiveAnnouncements, type PublicAnnouncement } from "../features/announcements/AnnouncementService";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export default function HomeAnnouncementBanner() {
  const [announcement,setAnnouncement]=useState<PublicAnnouncement|null>(null);
  useFocusEffect(useCallback(()=>{let active=true;void getActiveAnnouncements("home").then(rows=>{if(active)setAnnouncement(rows[0]??null)}).catch(()=>undefined);return()=>{active=false}},[]));
  if(!announcement)return null;
  return <Pressable disabled={!announcement.actionRoute} onPress={()=>announcement.actionRoute&&router.push(announcement.actionRoute as Href)} style={({pressed})=>[styles.card,pressed&&styles.pressed]}>
    <View style={styles.icon}><Ionicons name="megaphone-outline" size={21} color={colors.background}/></View>
    <View style={styles.copy}><Text style={styles.eyebrow}>ANNONCE OUMMAH</Text><Text style={styles.title}>{announcement.title}</Text><Text style={styles.body} numberOfLines={3}>{announcement.body}</Text>{announcement.actionLabel?<Text style={styles.action}>{announcement.actionLabel} →</Text>:null}</View>
  </Pressable>;
}
const styles=StyleSheet.create({card:{marginHorizontal:11,marginTop:12,padding:14,borderRadius:18,borderWidth:1,borderColor:"rgba(241,188,79,0.30)",backgroundColor:"rgba(241,188,79,0.08)",flexDirection:"row",alignItems:"flex-start"},icon:{width:42,height:42,borderRadius:14,alignItems:"center",justifyContent:"center",backgroundColor:colors.goldLight},copy:{flex:1,marginLeft:12},eyebrow:{color:colors.goldMuted,fontSize:8,fontWeight:"900",letterSpacing:1.1},title:{marginTop:3,color:colors.text,fontFamily:typography.serifMedium,fontSize:16},body:{marginTop:5,color:colors.textSecondary,fontSize:10.5,lineHeight:15},action:{marginTop:7,color:colors.goldLight,fontSize:10,fontWeight:"800"},pressed:{opacity:.78}});
