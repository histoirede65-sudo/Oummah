import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { PROPHET_AUDIO_EPISODES } from "../features/prophets/audio/prophetAudioData";
import { MUSA_CHAPTERS, PROPHETS_PREVIEW } from "../features/prophets/prophetsData";
import { loadMusaProgress } from "../features/prophets/prophetProgress";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const MUSA_COVER = require("../assets/images/prophets/musa-scenes/moussa.jpg");
const PROPHETS_HOME_COVER = require("../assets/images/prophets/prophets-home-premium.jpg");
const CARD = "#151022";
const CARD_RAISED = "#1E1730";
const LINE = "#2B2238";

export default function ProphetsScreen() {
  const [completedCount, setCompletedCount] = useState(0);
  const [lastChapterId, setLastChapterId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    void loadMusaProgress().then((progress) => {
      setCompletedCount(progress.completed.length);
      setLastChapterId(progress.lastChapterId);
    });
  }, []);

  useFocusEffect(useCallback(() => {
    refresh();
  }, [refresh]));

  const resumeIndex = Math.max(0, MUSA_CHAPTERS.findIndex((chapter) => chapter.id === lastChapterId));
  const progress = completedCount / MUSA_CHAPTERS.length;

  return (
    <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Histoires des Prophètes</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={[CARD_RAISED, CARD]} style={styles.introCard}>
            <Image source={PROPHETS_HOME_COVER} contentFit="cover" style={StyleSheet.absoluteFill} />
            <View style={styles.introOrnament}>
              <Ionicons name="book-outline" size={28} color={colors.goldLight} />
            </View>
            <Text style={styles.eyebrow}>UN VOYAGE À TRAVERS LA RÉVÉLATION</Text>
            <Text style={styles.introTitle}>Découvrir les récits des Prophètes</Text>
            <Text style={styles.introText}>
              Parcours les prophètes nommés dans le Coran à travers une narration sourcée, immersive et respectueuse. Lis leurs récits ou écoute leurs histoires complètes, sans romancer ce que les textes ne disent pas.
            </Text>
            <View style={styles.sourceChips}>
              <View style={styles.sourceChip}><Ionicons name="book-outline" size={13} color={colors.goldLight} /><Text style={styles.sourceChipText}>CORAN</Text></View>
              <View style={styles.sourceChip}><Ionicons name="checkmark-circle-outline" size={13} color={colors.goldLight} /><Text style={styles.sourceChipText}>SUNNA AUTHENTIQUE</Text></View>
            </View>
          </LinearGradient>

          {false ? <Pressable
            onPress={() => router.push(`/prophets/musa?chapter=${resumeIndex}` as Href)}
            style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}
          >
            <Image source={MUSA_COVER} contentFit="cover" style={StyleSheet.absoluteFill} />
            <LinearGradient colors={["rgba(7,7,18,0.10)", "rgba(8,7,19,0.34)", "rgba(8,7,19,0.96)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.featuredRim} />
            <View style={styles.featuredCopy}>
              <View style={styles.availablePill}><Ionicons name="sparkles" size={12} color={colors.background} /><Text style={styles.availablePillText}>DISPONIBLE</Text></View>
              <Text style={styles.featuredArabic}>مُوسَىٰ</Text>
              <Text style={styles.featuredTitle}>Mûsâ عليه السلام</Text>
              <Text style={styles.featuredText}>Du Nil au Sinaï — 15 chapitres racontés à partir des passages du Coran.</Text>
              <View style={styles.progressRow}>
                <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(3, progress * 100)}%` }]} /></View>
                <Text style={styles.progressText}>{completedCount}/{MUSA_CHAPTERS.length}</Text>
              </View>
              <View style={styles.resumeRow}>
                <Text style={styles.resumeText}>{completedCount ? "Reprendre le récit" : "Commencer le récit"}</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.background} />
              </View>
            </View>
          </Pressable> : null}

          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderCopy}>
              <Text style={styles.eyebrow}>LES PROPHÈTES NOMMÉS DANS LE CORAN</Text>
              <Text style={styles.sectionTitle}>Choisir une histoire</Text>
            </View>
            <View style={styles.countBadge}><Text style={styles.countBadgeText}>{PROPHETS_PREVIEW.length}</Text></View>
          </View>

          <View style={styles.grid}>
            {PROPHETS_PREVIEW.map((prophet) => {
              const available = prophet.status === "available";
              const hasAudio = Boolean(PROPHET_AUDIO_EPISODES[prophet.id]);
              return (
                <Pressable
                  key={prophet.id}
                  disabled={!available}
                  onPress={() => available && router.push((prophet.id === "musa" ? `/prophets/musa?chapter=${resumeIndex}` : `/prophets/${prophet.id}?chapter=0`) as Href)}
                  style={({ pressed }) => [styles.prophetCard, prophet.id === "muhammad" && styles.prophetCardWide, available && styles.prophetCardAvailable, pressed && available && styles.pressed]}
                >
                  {prophet.coverImage ? <Image source={prophet.coverImage} contentFit="cover" transition={160} style={StyleSheet.absoluteFill} /> : null}
                  <LinearGradient colors={["rgba(8,7,19,0)", "rgba(8,7,19,0.18)", "rgba(8,7,19,0.86)"]} locations={[0, 0.42, 1]} style={StyleSheet.absoluteFill} />
                  <View style={styles.prophetCopy}>
                    <Text style={styles.prophetName} numberOfLines={1}>{prophet.name}</Text>
                    {prophet.frenchName ? <Text style={styles.prophetFrenchName} numberOfLines={1}>{prophet.frenchName}</Text> : null}
                  </View>
                  {hasAudio ? (
                    <View style={styles.audioBadge} pointerEvents="none">
                      <Ionicons name="headset-outline" size={14} color={colors.goldLight} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.discoverySection}>
            <Text style={styles.eyebrow}>POUR ALLER PLUS LOIN</Text>
            <Text style={styles.discoveryTitle}>Explorer les grandes lignées</Text>
            <Pressable onPress={() => router.push("/prophets/women" as Href)} style={({pressed})=>[styles.discoveryCard,pressed&&styles.pressed]}>
              <LinearGradient colors={[CARD_RAISED, CARD]} style={StyleSheet.absoluteFill}/><View style={styles.discoveryIcon}><Ionicons name="sparkles" size={22} color={colors.goldLight}/></View><View style={styles.discoveryCopy}><Text style={styles.discoveryKicker}>FEMMES D’EXCEPTION</Text><Text style={styles.discoveryText}>Maryam, Âsiyah, Khadîjah, Fâtimah, ‘Â’ishah et d’autres parcours remarquables.</Text></View><Ionicons name="chevron-forward" size={20} color={colors.goldLight}/>
            </Pressable>
            <Pressable onPress={() => router.push("/prophets/genealogy" as Href)} style={({pressed})=>[styles.discoveryCard,pressed&&styles.pressed]}>
              <LinearGradient colors={[CARD_RAISED, CARD]} style={StyleSheet.absoluteFill}/><View style={styles.discoveryIcon}><Ionicons name="git-network-outline" size={23} color={colors.goldLight}/></View><View style={styles.discoveryCopy}><Text style={styles.discoveryKicker}>ARBRE DES PROPHÈTES</Text><Text style={styles.discoveryText}>De Âdam à Muhammad ﷺ : chronologie, filiations et liens familiaux sourcés.</Text></View><Ionicons name="chevron-forward" size={20} color={colors.goldLight}/>
            </Pressable>
          </View>

          <View style={styles.methodCard}>
            <Ionicons name="shield-checkmark-outline" size={21} color={colors.goldLight} />
            <View style={styles.methodCopy}>
              <Text style={styles.methodTitle}>Raconter sans romancer</Text>
              <Text style={styles.methodText}>Chaque récit distingue ce qui vient du Coran, de la Sunna authentique et des explications savantes.</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  header: { minHeight: 74, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: LINE, backgroundColor: "rgba(255,255,255,0.045)" },
  headerCopy: { flex: 1, alignItems: "center" },
  headerSpacer: { width: 42 },
  headerTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21 },
  content: { padding: 16, paddingBottom: 52 },
  introCard: { padding: 22, borderRadius: 30, borderWidth: 1, borderColor: "rgba(227,181,90,0.26)", overflow: "hidden" },
  introOrnament: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 20, backgroundColor: "rgba(227,181,90,0.10)", borderWidth: 1, borderColor: "rgba(227,181,90,0.20)" },
  eyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "800", letterSpacing: 1.45 },
  introTitle: { marginTop: 8, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 31, lineHeight: 36 },
  introText: { marginTop: 12, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, lineHeight: 22 },
  sourceChips: { marginTop: 18, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sourceChip: { minHeight: 30, paddingHorizontal: 10, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(227,181,90,0.09)", borderWidth: 1, borderColor: "rgba(227,181,90,0.18)" },
  sourceChipText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 8.5, fontWeight: "800", letterSpacing: 0.8 },
  featuredCard: { minHeight: 430, marginTop: 16, borderRadius: 30, overflow: "hidden", borderWidth: 1.2, borderColor: "rgba(227,181,90,0.46)", backgroundColor: colors.surface },
  featuredRim: { position: "absolute", top: 8, right: 8, bottom: 8, left: 8, borderRadius: 23, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" },
  featuredCopy: { flex: 1, justifyContent: "flex-end", padding: 22, paddingTop: 190 },
  availablePill: { alignSelf: "flex-start", minHeight: 28, paddingHorizontal: 10, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.goldLight },
  availablePillText: { color: colors.background, fontFamily: typography.sans, fontSize: 8.5, fontWeight: "900", letterSpacing: 1 },
  featuredArabic: { marginTop: 10, color: colors.text, fontFamily: typography.arabic, fontSize: 37, lineHeight: 50 },
  featuredTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 30, lineHeight: 34 },
  featuredText: { marginTop: 7, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13.5, lineHeight: 21, maxWidth: 310 },
  progressRow: { marginTop: 17, flexDirection: "row", alignItems: "center", gap: 10 },
  progressTrack: { flex: 1, height: 6, overflow: "hidden", borderRadius: 3, backgroundColor: "rgba(255,255,255,0.14)" },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.goldLight },
  progressText: { color: colors.text, fontFamily: typography.sans, fontSize: 11, fontWeight: "800" },
  resumeRow: { marginTop: 14, alignSelf: "flex-start", minHeight: 44, paddingHorizontal: 16, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.goldLight },
  resumeText: { color: colors.background, fontFamily: typography.sans, fontSize: 12.5, fontWeight: "900" },
  sectionHeader: { marginTop: 28, marginBottom: 13, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 },
  sectionHeaderCopy: { flex: 1 },
  sectionTitle: { marginTop: 4, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 25 },
  countBadge: { minWidth: 38, height: 32, paddingHorizontal: 10, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.10)", borderWidth: 1, borderColor: "rgba(227,181,90,0.22)" },
  countBadgeText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 10 },
  prophetCard: { width: "48.7%", height: 168, justifyContent: "flex-end", padding: 14, borderRadius: 22, borderWidth: 1, borderColor: LINE, backgroundColor: CARD, overflow: "hidden" },
  prophetCardWide: { width: "100%", height: 200 },
  prophetCardAvailable: { borderColor: "rgba(227,181,90,0.30)" },
  prophetCopy: { paddingRight: 30 },
  prophetName: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21, lineHeight: 25, textShadowColor: "rgba(0,0,0,0.55)", textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  prophetFrenchName: { marginTop: 1, color: "rgba(248,244,238,0.82)", fontFamily: typography.sans, fontSize: 12.5, lineHeight: 17, textShadowColor: "rgba(0,0,0,0.55)", textShadowRadius: 6, textShadowOffset: { width: 0, height: 1 } },
  audioBadge: { position: "absolute", right: 11, bottom: 12, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,7,19,0.62)", borderWidth: 1, borderColor: "rgba(227,181,90,0.45)" },
  discoverySection: { marginTop: 24 },
  discoveryTitle: { marginTop: 5, marginBottom: 12, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 24 },
  discoveryCard: { minHeight: 100, marginTop: 10, padding: 16, borderRadius: 24, overflow: "hidden", borderWidth: 1, borderColor: "rgba(227,181,90,0.28)", flexDirection: "row", alignItems: "center", gap: 13 },
  discoveryIcon: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.10)", borderWidth: 1, borderColor: "rgba(227,181,90,0.18)" },
  discoveryCopy: { flex: 1, paddingLeft: 12, paddingRight: 8, paddingVertical: 7, borderLeftWidth: 1, borderLeftColor: "rgba(227,181,90,0.55)" },
  discoveryKicker: { color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 14, letterSpacing: 0.9 },
  discoveryText: { marginTop: 5, color: "rgba(245,241,232,0.78)", fontFamily: typography.sans, fontSize: 13, lineHeight: 19 },
  methodCard: { marginTop: 18, padding: 17, borderRadius: 24, borderWidth: 1, borderColor: LINE, backgroundColor: CARD, flexDirection: "row", gap: 12 },
  methodCopy: { flex: 1 },
  methodTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 18 },
  methodText: { marginTop: 5, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 19 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.992 }] },
});
