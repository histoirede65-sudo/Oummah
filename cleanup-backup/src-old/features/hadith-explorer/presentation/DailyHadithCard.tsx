import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { WasilContextButton } from "../../../components/wasil/WasilContextButton";
import type { Hadith } from "../domain/Hadith";
import HadithGradeBadge from "./HadithGradeBadge";

export default function DailyHadithCard({
  hadith,
  loading,
  onPress,
  wasilPrompt,
}: {
  hadith: Hadith | null;
  loading: boolean;
  onPress: () => void;
  wasilPrompt?: string;
}) {
  return (
    <Pressable
      disabled={!hadith}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={["#442655", "#21142F", "#100C1C"]}
        locations={[0, 0.52, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.header}>
        <View>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrow}>HADITH DU JOUR</Text>
          </View>
          <Text style={styles.date}>
            {new Intl.DateTimeFormat("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(new Date())}
          </Text>
        </View>

        <View style={styles.emblem}>
          <Text style={styles.emblemText}>ﷺ</Text>
        </View>
      </View>

      {loading ? (
        <Text style={styles.empty}>Chargement du hadith authentifié…</Text>
      ) : hadith ? (
        <>
          <Text numberOfLines={5} style={styles.french}>
            {hadith.french || hadith.title}
          </Text>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <HadithGradeBadge
              grade={hadith.grade}
              kind={hadith.gradeKind}
            />

            <View style={styles.read}>
              <Text style={styles.readText}>Lire & comprendre</Text>
              <View style={styles.readArrow}>
                <Ionicons
                  name="arrow-forward"
                  size={14}
                  color={colors.goldLight}
                />
              </View>
            </View>
          </View>
          {wasilPrompt ? <View style={styles.wasilSection}>
            <View style={styles.wasilDivider} />
            <WasilContextButton largeLabel prompt={wasilPrompt} />
            <Text style={styles.wasilSubtitle}>Comprendre le sens, le contexte et les enseignements du hadith.</Text>
          </View> : null}
        </>
      ) : (
        <Text style={styles.empty}>
          Connectez-vous une première fois pour rendre le hadith du jour
          disponible hors ligne.
        </Text>
      )}

      <Text style={styles.credit}>Texte et classification : HadeethEnc</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 285,
    borderRadius: 30,
    overflow: "hidden",
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(233,197,122,0.42)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.44,
    shadowRadius: 24,
    elevation: 14,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.992 }],
  },
  glowTop: {
    position: "absolute",
    top: -66,
    right: -28,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: "rgba(227,181,90,0.11)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -110,
    left: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(103,56,124,0.16)",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.gold,
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 5,
  },
  eyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.7,
  },
  date: {
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    textTransform: "capitalize",
  },
  emblem: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(227,181,90,0.13)",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.28)",
  },
  emblemText: {
    color: colors.goldLight,
    fontFamily: typography.arabic,
    fontSize: 21,
  },
  arabicBlock: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
    backgroundColor: "rgba(10,7,17,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.045)",
  },
  arabic: {
    color: "#FFF8EB",
    textAlign: "right",
    writingDirection: "rtl",
    fontFamily: "UthmanicHafs",
    fontSize: 22,
    lineHeight: 38,
  },
  french: {
    color: "#F0EAF2",
    fontFamily: typography.sans,
    fontSize: 17,
    lineHeight: 24,
  },
  empty: {
    flex: 1,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 17,
    lineHeight: 25,
    paddingVertical: 28,
  },
  divider: {
    height: 1,
    marginTop: 18,
    backgroundColor: "rgba(227,181,90,0.13)",
  },
  footer: {
    marginTop: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  wasilSection: { marginTop: 13 },
  wasilDivider: { height: 1, marginBottom: 10, backgroundColor: "rgba(227,181,90,0.18)" },
  wasilSubtitle: { color: "#FFF1C9", fontFamily: typography.sans, fontSize: 10.5, lineHeight: 15, fontWeight: "600", textAlign: "center", marginTop: 5 },
  read: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  readText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "700",
  },
  readArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(227,181,90,0.10)",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.16)",
  },
  credit: {
    color: "#71677B",
    fontFamily: typography.sans,
    fontSize: 9.5,
    marginTop: 15,
  },
});
