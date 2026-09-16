import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { FiqhCategoryVisualCard } from "../features/fiqh/components/FiqhCategoryVisualCard";
import { FiqhHomeHero } from "../features/fiqh/components/FiqhHomeHero";
import { FIQH_CATEGORIES } from "../features/fiqh/fiqhData";
import { searchFiqhTopics } from "../features/fiqh/fiqhSearch";
import { colors } from "../theme/colors";

const images: Record<string, ReturnType<typeof require>> = { purification: require("../assets/images/fiqh/purification.png"), prayer: require("../assets/images/fiqh/prayer.png"), fasting: require("../assets/images/fiqh/fasting.png"), zakat: require("../assets/images/fiqh/zakat.png"), "hajj-umra": require("../assets/images/fiqh/hajj-umrah-final.jpg"), funerals: require("../assets/images/fiqh/funerals.png"), family: require("../assets/images/fiqh/family.png"), transactions: require("../assets/images/fiqh/transactions.png"), "food-sacrifices": require("../assets/images/fiqh/food-sacrifices.png"), "oaths-vows": require("../assets/images/fiqh/oaths-vows.png"), "clothing-adornment": require("../assets/images/fiqh/clothing-adornment.png"), "daily-life": require("../assets/images/fiqh/daily-life.png"), "justice-rights": require("../assets/images/fiqh/justice-rights.png"), "inheritance-wills": require("../assets/images/fiqh/inheritance-wills.png"), "hunting-animals": require("../assets/images/fiqh/hunting-animals.png"), "siyar-relations": require("../assets/images/fiqh/siyar-relations.png") };

// Pending local assets: activate each require only after the corresponding file is deposited.
export const PENDING_FIQH_IMAGE_FILES = {
  funerals: "funerals.png",
  family: "family.png",
  transactions: "transactions.png",
  "food-sacrifices": "food-sacrifices.png",
  "oaths-vows": "oaths-vows.png",
  "clothing-adornment": "clothing-adornment.png",
  "daily-life": "daily-life.png",
  "justice-rights": "justice-rights.png",
  "inheritance-wills": "inheritance-wills.png",
  "hunting-animals": "hunting-animals.png",
  "siyar-relations": "siyar-relations.png",
} as const;

export default function FiqhHome() { const [query,setQuery]=useState(""); const results=useMemo(()=>searchFiqhTopics(query),[query]); const coreCategories=FIQH_CATEGORIES.slice(0,5); const otherCategories=FIQH_CATEGORIES.slice(5); return <SafeAreaView style={s.screen}><ScrollView contentContainerStyle={s.content}><Pressable onPress={()=>router.back()}><Text style={s.back}>‹ Retour</Text></Pressable><FiqhHomeHero/><View style={s.methodology}><Text style={s.methodologyTitle}>Sources et méthodologie</Text><Text style={s.methodologyText}>Les fiches de ce module sont documentées à partir du Coran et de hadiths authentifiés Sahîh issus des recueils reconnus de la Sunnah. Lorsque l’interprétation juridique nécessite du fiqh, seules des références sunnites identifiables et vérifiables sont utilisées.</Text></View><View style={s.search}><Ionicons name="search" size={19} color={colors.goldLight}/><TextInput value={query} onChangeText={setQuery} placeholder="Rechercher : ablutions, tayammum…" placeholderTextColor={colors.textMuted} style={s.input}/></View><Text style={s.sectionTitle}>Livres principaux</Text>{coreCategories.map(category=><FiqhCategoryVisualCard key={category.id} categoryId={category.id} title={category.title} arabicTitle={category.arabicTitle} summary={category.summary} image={images[category.id]} onPress={()=>router.push(`/fiqh/${category.id}`)}/>)}{otherCategories.length?<><Text style={s.sectionTitle}>Bibliothèque de fiqh</Text><Text style={s.libraryIntro}>Les autres grands domaines disposent maintenant d’une première base documentaire prudente, organisée en livres et chapitres.</Text>{otherCategories.map(category=><FiqhCategoryVisualCard key={category.id} categoryId={category.id} title={category.title} arabicTitle={category.arabicTitle} summary={category.summary} image={images[category.id]} onPress={()=>router.push(`/fiqh/${category.id}`)}/>)}</>:null}{query?<Text style={s.sectionTitle}>Résultats</Text>:null}{query?results.map(topic=><Pressable key={topic.id} onPress={()=>router.push(`/fiqh/topic/${topic.id}`)} style={s.topic}><View style={s.topicCopy}><Text style={s.topicTitle}>{topic.title}</Text><Text style={s.topicSummary}>{topic.summary}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.goldLight} style={s.topicChevron}/></Pressable>):null}</ScrollView></SafeAreaView>; }
const s=StyleSheet.create({screen:{flex:1,backgroundColor:colors.background},content:{padding:22,paddingBottom:60},back:{color:colors.goldLight,fontSize:18,marginBottom:20},methodology:{marginTop:16,padding:16,borderRadius:20,backgroundColor:colors.surfaceAlt,borderWidth:1,borderColor:colors.border},methodologyTitle:{color:colors.goldLight,fontSize:15,fontWeight:"800"},methodologyText:{color:colors.textSecondary,fontSize:13,lineHeight:20,marginTop:7},search:{flexDirection:"row",alignItems:"center",gap:9,marginTop:18,paddingHorizontal:14,height:52,borderRadius:17,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border},input:{flex:1,color:colors.text,fontSize:15},sectionTitle:{color:colors.goldLight,fontSize:15,fontWeight:"800",letterSpacing:1,marginTop:26,marginBottom:10},libraryIntro:{color:colors.textMuted,fontSize:13,lineHeight:19,marginBottom:12},topic:{flexDirection:"row",alignItems:"center",paddingVertical:15,borderBottomWidth:1,borderBottomColor:colors.borderSoft},topicCopy:{flex:1},topicTitle:{color:colors.text,fontSize:17,fontWeight:"700"},topicSummary:{color:colors.textSecondary,fontSize:14,lineHeight:20,marginTop:4}});
