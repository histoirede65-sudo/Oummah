import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { COMPANION_CATEGORIES, COMPANIONS } from "../features/companions/companionsData";
import type { CompanionCategory } from "../features/companions/companionsTypes";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export default function CompanionsScreen() {
  const [category, setCategory] = useState<CompanionCategory>("all");
  const visible = useMemo(() => COMPANIONS.filter((item) => category === "all" || item.categories.includes(category)), [category]);
  return <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Ionicons name="chevron-back" size={23} color={colors.text} /></Pressable><Text style={styles.headerTitle}>Les Compagnons</Text><View style={styles.spacer} /></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { overflow: "hidden" }]}>
          <Image source={require("../assets/images/home/shortcuts/companions-premium.png")} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient colors={["rgba(18,12,31,.24)", "rgba(18,12,31,.96)"]} style={styles.heroOverlay} />
          <View style={styles.heroContent}>
          <View style={styles.icon}><Ionicons name="people-outline" size={27} color={colors.goldLight} /></View>
          <Text style={styles.kicker}>AS-SAHÂBA · الصحابة</Text>
          <Text style={styles.title}>Les Compagnons</Text>
          <Text style={styles.intro}>Les Ṣaḥâba sont les hommes et les femmes qui ont rencontré le Prophète ﷺ en croyant en lui. Leur parcours transmet la foi, le sacrifice, le savoir et la responsabilité — avec la rigueur nécessaire pour distinguer les faits établis des récits discutés.</Text>
          </View>
        </View>
        <View style={styles.categoryGrid}>{COMPANION_CATEGORIES.map((item) => { const count = COMPANIONS.filter((companion) => item.id === "all" || companion.categories.includes(item.id)).length; return <Pressable key={item.id} onPress={() => setCategory(item.id)} style={({ pressed }) => [styles.categoryCard, category === item.id && styles.categoryCardActive, pressed && styles.pressed]}><Text style={[styles.categoryTitle, category === item.id && styles.categoryTitleActive]}>{item.label}</Text><Text style={styles.categorySubtitle}>{item.id === "all" ? "Tout le corpus" : item.id === "caliphs" ? "Gouverner avec justice" : "Mérites rapportés"}</Text><Text style={[styles.categoryCount, category === item.id && styles.categoryCountActive]}>{count}</Text></Pressable>; })}</View>
        <Text style={styles.count}>{visible.length} biographies</Text>
        <View style={styles.list}>{visible.map((item, index) => <Pressable key={item.id} onPress={() => router.push(`/companions/${item.id}`)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><View style={styles.number}><Text style={styles.numberText}>{String(index + 1).padStart(2, "0")}</Text></View><View style={styles.cardCopy}><Text style={styles.arabic}>{item.arabicName}</Text><Text style={styles.name}>{item.name}</Text><Text style={styles.short}>{item.shortTitle}</Text></View><Ionicons name="arrow-forward" size={18} color={colors.goldLight} /></Pressable>)}</View>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}

const styles = StyleSheet.create({ heroImage: { position: "absolute", top: 0, left: 0, right: 0, width: "100%", height: 270 }, heroOverlay: { ...StyleSheet.absoluteFillObject }, heroContent: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 22 },
  screen: { flex: 1 }, safe: { flex: 1 }, header: { minHeight: 74, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" }, back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.borderSoft, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,.04)" }, spacer: { width: 44 }, headerTitle: { flex: 1, textAlign: "center", color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 }, content: { padding: 16, paddingBottom: 60 }, hero: { height: 320, borderRadius: 28, borderWidth: 1, borderColor: "rgba(227,181,90,.32)" }, icon: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,.10)", borderWidth: 1, borderColor: "rgba(227,181,90,.22)" }, kicker: { marginTop: 16, color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "900", letterSpacing: 1.3 }, title: { marginTop: 7, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 31 }, intro: { marginTop: 11, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, lineHeight: 22 }, categoryGrid: { flexDirection: "row", gap: 8, paddingVertical: 18 }, categoryCard: { flex: 1, minHeight: 126, padding: 11, borderRadius: 18, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,.035)" }, categoryCardActive: { borderColor: colors.goldLight, backgroundColor: "rgba(227,181,90,.13)" }, categoryTitle: { color: colors.textSecondary, fontFamily: typography.serifSemibold, fontSize: 14, lineHeight: 18 }, categoryTitleActive: { color: colors.goldLight }, categorySubtitle: { marginTop: 6, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10, lineHeight: 14 }, categoryCount: { marginTop: "auto", color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 26 }, categoryCountActive: { color: colors.text }, count: { marginBottom: 10, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11 }, list: { gap: 9 }, card: { minHeight: 94, padding: 14, borderRadius: 21, borderWidth: 1, borderColor: "rgba(227,181,90,.18)", backgroundColor: "rgba(23,16,38,.82)", flexDirection: "row", alignItems: "center", gap: 12 }, number: { width: 31, height: 31, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,.10)", borderWidth: 1, borderColor: "rgba(227,181,90,.24)" }, numberText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "900" }, cardCopy: { flex: 1 }, arabic: { color: colors.goldLight, fontFamily: typography.arabic, fontSize: 19 }, name: { marginTop: 2, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 17 }, short: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11 }, pressed: { opacity: .82, transform: [{ scale: .992 }] },
});
