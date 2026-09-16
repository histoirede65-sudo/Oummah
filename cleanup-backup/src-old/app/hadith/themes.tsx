import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { HADITH_THEMES } from "../../features/hadith-explorer/domain/HadithTheme";
import HadithScreenHeader from "../../features/hadith-explorer/presentation/HadithScreenHeader";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export default function HadithThemesScreen() {
  return <LinearGradient colors={["#080713", "#11091C", "#080713"]} style={styles.screen}><SafeAreaView edges={["top"]} style={styles.safe}><View style={styles.header}><HadithScreenHeader title="Thèmes" subtitle="Des repères pour la vie quotidienne" /></View><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><Text style={styles.intro}>Choisissez un thème pour retrouver les paroles qui l’éclairent.</Text><View style={styles.grid}>{HADITH_THEMES.map((theme) => <Pressable key={theme.id} onPress={() => router.push({ pathname: "/hadith/search", params: { q: theme.query, theme: theme.label } })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}><LinearGradient colors={[`${theme.color}2B`, "rgba(26,18,39,0.94)"]} style={StyleSheet.absoluteFill} /><View style={[styles.icon, { backgroundColor: `${theme.color}24`, borderColor: `${theme.color}4D` }]}><Ionicons name={theme.icon as never} size={22} color={theme.color} /></View><Text style={styles.label}>{theme.label}</Text><Ionicons name="arrow-forward" size={15} color={colors.textMuted} /></Pressable>)}</View><View style={styles.tip}><Ionicons name="search-outline" size={18} color={colors.goldLight} /><Text style={styles.tipText}>Un sujet manque ? La recherche permet d’écrire librement un mot ou une expression.</Text></View></ScrollView></SafeAreaView></LinearGradient>;
}

const styles = StyleSheet.create({ screen: { flex: 1 }, safe: { flex: 1 }, header: { paddingHorizontal: 18 }, content: { paddingHorizontal: 18, paddingTop: 15, paddingBottom: 110 }, intro: { color: colors.textSecondary, fontFamily: typography.serif, fontSize: 18, lineHeight: 24, marginBottom: 18 }, grid: { flexDirection: "row", flexWrap: "wrap", gap: 9 }, card: { width: "48.6%", minHeight: 110, overflow: "hidden", borderRadius: 23, padding: 15, borderWidth: 1, borderColor: "rgba(145,99,167,0.2)" }, pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] }, icon: { width: 41, height: 41, borderRadius: 15, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 11 }, label: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 17, flex: 1 }, tip: { marginTop: 22, borderRadius: 19, padding: 15, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(227,181,90,0.07)" }, tipText: { flex: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, lineHeight: 16 } });

