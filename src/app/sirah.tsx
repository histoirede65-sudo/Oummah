import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { SIRAH_PERIODS } from "../features/sirah/sirahData";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const hero = require("../assets/images/home/shortcuts/sirah-premium.png");

export default function SirahHome() {
  return <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
    <Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={24} color={colors.text} /></Pressable>
    <Text style={styles.eyebrow}>AS-SÎRA AN-NABAWIYYA</Text>
    <Text style={styles.title}>La Sîra du Prophète ﷺ</Text>
    <Text style={styles.arabic}>السيرة النبوية</Text>
    <View style={styles.hero}>
      <Image source={hero} contentFit="cover" transition={180} style={StyleSheet.absoluteFill} />
      <View style={styles.heroCopy}><Text style={styles.heroLabel}>UN CHEMIN DE LUMIÈRE</Text><Text style={styles.heroText}>Découvrir une vie transmise par le Coran, les hadiths authentiques et une lecture prudente de l’histoire.</Text></View>
    </View>
    <Text style={styles.sectionTitle}>Les grandes périodes</Text>
    {SIRAH_PERIODS.map((period, index) => <Pressable key={period.id} onPress={() => router.push(`/sirah/${period.id}`)} style={({ pressed }) => [styles.period, period.era === "hijra" && styles.hijraPeriod, pressed && styles.pressed]}>
      <View style={styles.dot}><Text style={styles.dotText}>{String(index + 1).padStart(2, "0")}</Text></View>
      <View style={styles.periodCopy}><Text style={styles.periodTitle}>{period.title}</Text><Text style={styles.periodSubtitle}>{period.subtitle}</Text><Text style={styles.chapterCount}>{period.chapters.length} chapitres</Text></View>
      <Ionicons name="arrow-forward" size={18} color={colors.goldLight} />
    </Pressable>)}
  </ScrollView>;
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: "#080611" }, content: { padding: 22, paddingTop: 62, paddingBottom: 48 }, back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "rgba(209,165,80,0.36)", alignItems: "center", justifyContent: "center", marginBottom: 22 }, eyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "700", letterSpacing: 2 }, title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 31, marginTop: 8 }, arabic: { color: "#D8B66A", fontSize: 25, marginTop: 7 }, hero: { height: 300, marginTop: 24, overflow: "hidden", borderRadius: 26, borderWidth: 1, borderColor: "rgba(214,171,82,0.58)" }, heroCopy: { position: "absolute", left: 20, right: 20, bottom: 20 }, heroLabel: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "700", letterSpacing: 1.8 }, heroText: { color: "#FFF7E7", fontFamily: typography.serifMedium, fontSize: 20, lineHeight: 27, marginTop: 8 }, sectionTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22, marginTop: 28, marginBottom: 12 }, period: { flexDirection: "row", alignItems: "center", gap: 13, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "rgba(224,187,111,0.27)", backgroundColor: "#110D1C", marginBottom: 10 }, hijraPeriod: { borderColor: "rgba(224,187,111,0.82)", backgroundColor: "#1B1320" }, dot: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#24172A", borderWidth: 1, borderColor: "#D5A94F" }, dotText: { color: colors.goldLight, fontFamily: typography.sans, fontWeight: "700", fontSize: 11 }, periodCopy: { flex: 1 }, periodTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 18 }, periodSubtitle: { color: "#B9AEC8", fontFamily: typography.sans, fontSize: 12, marginTop: 3 }, chapterCount: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, marginTop: 8, fontWeight: "700" }, pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] } });
