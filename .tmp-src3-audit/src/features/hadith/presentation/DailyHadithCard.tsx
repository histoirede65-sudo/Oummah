import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import type { Hadith } from "../domain/Hadith";
import HadithGradeBadge from "./HadithGradeBadge";

export default function DailyHadithCard({ hadith, loading, onPress }: { hadith: Hadith | null; loading: boolean; onPress: () => void }) {
  return (
    <Pressable disabled={!hadith} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <LinearGradient colors={["#362044", "#1A1128", "#100C1C"]} locations={[0, 0.52, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.glow} />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>HADITH DU JOUR</Text>
          <Text style={styles.date}>{new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</Text>
        </View>
        <View style={styles.emblem}><Text style={styles.emblemText}>ﷺ</Text></View>
      </View>
      {loading ? <Text style={styles.empty}>Chargement du hadith authentifié…</Text> : hadith ? (
        <>
          {hadith.arabic ? <Text numberOfLines={4} style={styles.arabic}>{hadith.arabic}</Text> : null}
          <Text numberOfLines={5} style={styles.french}>{hadith.french || hadith.title}</Text>
          <View style={styles.footer}>
            <HadithGradeBadge grade={hadith.grade} kind={hadith.gradeKind} />
            <View style={styles.read}><Text style={styles.readText}>Lire & comprendre</Text><Ionicons name="arrow-forward" size={14} color={colors.goldLight} /></View>
          </View>
        </>
      ) : <Text style={styles.empty}>Connectez-vous une première fois pour rendre le hadith du jour disponible hors ligne.</Text>}
      <Text style={styles.credit}>Texte et classification : HadeethEnc</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 320, borderRadius: 30, overflow: "hidden", padding: 22, borderWidth: 1, borderColor: "rgba(233,197,122,0.38)", shadowColor: "#000", shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.42, shadowRadius: 24, elevation: 14 },
  pressed: { opacity: 0.88 },
  glow: { position: "absolute", top: -60, right: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: "rgba(227,181,90,0.09)" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  eyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "800", letterSpacing: 1.7 },
  date: { marginTop: 5, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, textTransform: "capitalize" },
  emblem: { width: 45, height: 45, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.12)", borderWidth: 1, borderColor: "rgba(227,181,90,0.25)" },
  emblemText: { color: colors.goldLight, fontFamily: typography.arabic, fontSize: 21 },
  arabic: { color: "#FFF8EB", textAlign: "right", writingDirection: "rtl", fontFamily: "UthmanicHafs", fontSize: 22, lineHeight: 38, marginBottom: 13 },
  french: { color: "#EAE3ED", fontFamily: typography.serif, fontSize: 17.5, lineHeight: 24, fontStyle: "italic" },
  empty: { flex: 1, color: colors.textSecondary, fontFamily: typography.serifMedium, fontSize: 18, lineHeight: 25, paddingVertical: 28 },
  footer: { marginTop: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  read: { flexDirection: "row", alignItems: "center", gap: 5 },
  readText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "700" },
  credit: { color: "#71677B", fontFamily: typography.sans, fontSize: 9.5, marginTop: 15 },
});
