import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { ImageBackground, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { AKHIRA_PARTS } from "../features/akhira/akhiraContent";
import { useI18n } from "../i18n";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const TEXT = {
  fr: { title: "L’au-delà", lead: "De la mort à la demeure éternelle, étape par étape, avec le Coran et les hadiths authentiques.", back: "Retour" },
  en: { title: "The Hereafter", lead: "From death to the eternal abode, step by step, with the Quran and authentic hadiths.", back: "Back" },
};

export default function AkhiraScreen() {
  const { language } = useI18n();
  const en = language !== "fr";
  const tx = en ? TEXT.en : TEXT.fr;

  return (
    <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <ImageBackground source={require("../assets/images/akhira/hero.jpg")} style={styles.hero} imageStyle={styles.heroImage}>
            <LinearGradient colors={["rgba(8,7,19,0.10)", "rgba(8,7,19,0.35)", colors.background]} style={styles.heroShade}>
              <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={tx.back}>
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </Pressable>
              <View style={styles.heroText}>
                <Text style={styles.arabicTitle}>الآخرة</Text>
                <Text style={styles.title}>{tx.title}</Text>
              </View>
            </LinearGradient>
          </ImageBackground>
          <View style={styles.content}>
          <Text style={styles.lead}>{tx.lead}</Text>

          {AKHIRA_PARTS.map((part, partIndex) => (
            <View key={part.id} style={styles.part}>
              <Text style={styles.partTitle}>{(en ? part.titleEn : part.title).toUpperCase()}</Text>
              {part.note ? <Text style={styles.partNote}>{en ? part.noteEn : part.note}</Text> : null}
              {part.stages.map((stage, index) => {
                const first = stage.texts[0];
                const lastOfAll = partIndex === AKHIRA_PARTS.length - 1 && index === part.stages.length - 1;
                return (
                  <Pressable
                    key={stage.id}
                    onPress={() => router.push(`/akhira/${stage.id}` as Href)}
                    style={({ pressed }) => [styles.stage, pressed && styles.pressed]}
                    accessibilityRole="button"
                  >
                    <View style={styles.rail}>
                      <View style={styles.dot} />
                      {!lastOfAll ? <View style={styles.line} /> : null}
                    </View>
                    <View style={styles.stageBody}>
                      <View style={styles.stageTop}>
                        <Text style={styles.stageTitle}>{en ? stage.titleEn : stage.title}</Text>
                        <Text style={styles.stageArabic}>{stage.arabic}</Text>
                      </View>
                      <Text style={styles.stageLine} numberOfLines={2}>“{en ? first.highlightEn : first.highlight}”</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} style={styles.chevron} />
                  </Pressable>
                );
              })}
            </View>
          ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  pressed: { opacity: 0.7 },
  scroll: { paddingBottom: 70 },
  hero: { height: 300 },
  heroImage: { resizeMode: "cover" },
  heroShade: { flex: 1, paddingHorizontal: 16, paddingTop: 8, justifyContent: "space-between" },
  heroText: { paddingHorizontal: 6, paddingBottom: 4 },
  iconButton: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)", backgroundColor: "rgba(8,7,19,0.35)" },
  content: { paddingHorizontal: 22 },
  partNote: { marginBottom: 8, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 18 },
  arabicTitle: { color: colors.goldLight, fontFamily: typography.arabic, fontSize: 40, lineHeight: 62 },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 42, lineHeight: 46 },
  lead: { marginTop: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15.5, lineHeight: 23 },
  part: { marginTop: 34 },
  partTitle: { marginBottom: 6, color: colors.goldLight, fontFamily: typography.sans, fontSize: 11.5, fontWeight: "800", letterSpacing: 1.6 },
  stage: { flexDirection: "row", alignItems: "stretch", gap: 14 },
  rail: { width: 14, alignItems: "center", paddingTop: 22 },
  dot: { width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: colors.goldLight, backgroundColor: colors.background },
  line: { flex: 1, width: 1, marginTop: 4, backgroundColor: "rgba(227,181,90,0.30)" },
  stageBody: { flex: 1, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(227,181,90,0.18)" },
  stageTop: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 10 },
  stageTitle: { flexShrink: 1, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 24, lineHeight: 29 },
  stageArabic: { color: colors.goldLight, fontFamily: typography.arabic, fontSize: 19 },
  stageLine: { marginTop: 4, color: colors.textMuted, fontFamily: typography.sans, fontSize: 13.5, lineHeight: 19, fontStyle: "italic" },
  chevron: { alignSelf: "center" },
});
