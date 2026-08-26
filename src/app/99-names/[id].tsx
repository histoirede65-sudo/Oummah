import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { ALLAH_NAMES_SOURCE, getAllahName } from "../../features/99-names/names";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

function Section({ icon, eyebrow, title, children }: { icon: keyof typeof Ionicons.glyphMap; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={18} color={colors.goldLight} />
        </View>
        <View style={styles.sectionHeadingCopy}>
          <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

export default function AllahNameDetailScreen() {
  const openSourceSafely = async () => {
    try {
      const canOpen = await Linking.canOpenURL(ALLAH_NAMES_SOURCE.url);
      if (!canOpen) return;
      await Linking.openURL(ALLAH_NAMES_SOURCE.url);
    } catch {
      // External source access is optional; never interrupt the module if it fails.
    }
  };

  const { id } = useLocalSearchParams<{ id?: string }>();
  const numericId = Number(id);
  const name = getAllahName(numericId);

  if (!name) {
    return (
      <SafeAreaView style={styles.missingScreen}>
        <Text style={styles.missingTitle}>Nom introuvable</Text>
        <Pressable onPress={() => router.back()} style={styles.missingButton}>
          <Text style={styles.missingButtonText}>Retour</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerCounter}>{name.id} / 99</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <LinearGradient colors={["rgba(80,38,104,0.74)", "rgba(20,12,31,0.97)"]} style={StyleSheet.absoluteFill} />
            <View style={styles.heroGlow} />
            <View style={styles.heroRim} />
            <Text style={styles.heroIndex}>NOM {String(name.id).padStart(2, "0")}</Text>
            <Text style={styles.heroArabic}>{name.arabic}</Text>
            <Text style={styles.heroTransliteration}>{name.transliteration}</Text>
            <Text style={styles.heroTranslation}>{name.translation}</Text>
          </View>

          <Section icon="book-outline" eyebrow="COMPRENDRE" title="Le sens de ce nom">
            <Text style={styles.paragraph}>{name.explanation}</Text>
          </Section>

          <Section icon="heart-outline" eyebrow="MÉDITER" title="Ce que ce nom rappelle au cœur">
            <Text style={styles.paragraph}>{name.reflection}</Text>
          </Section>

          <Section icon="footsteps-outline" eyebrow="VIVRE AVEC CE NOM" title="Un enseignement pour le quotidien">
            <Text style={styles.paragraph}>{name.practice}</Text>
          </Section>

          <Section icon="sparkles-outline" eyebrow="INVOQUER ALLAH" title="Invoquer par Ses beaux noms">
            <Text style={styles.paragraph}>
              Allah nous enseigne de L’invoquer par Ses plus beaux noms. Utilisez ce nom avec respect dans vos invocations lorsque son sens correspond à ce que vous demandez, sans formule inventée présentée comme une pratique prophétique.
            </Text>
            <View style={styles.verseNote}>
              <Text style={styles.verseReference}>Al-A‘rāf · 7:180</Text>
              <Text style={styles.verseText}>« À Allah appartiennent les plus beaux noms : invoquez-Le par ces noms. »</Text>
            </View>
          </Section>

          <Section icon="shield-checkmark-outline" eyebrow="SOURCE & MÉTHODE" title="Une fiche pédagogique et sourcée">
            <Text style={styles.paragraph}>
              Le nom, sa translittération et son sens de base suivent le catalogue scholar-verified d’Islamic Relief UK. Les explications proposées ici sont des synthèses pédagogiques et ne remplacent pas un commentaire savant détaillé.
            </Text>
            <Pressable onPress={() => void openSourceSafely()} style={styles.sourceButton}>
              <View style={styles.sourceButtonCopy}>
                <Text style={styles.sourceButtonTitle}>{ALLAH_NAMES_SOURCE.label}</Text>
                <Text style={styles.sourceButtonSubtitle}>Relecture : {ALLAH_NAMES_SOURCE.reviewer}</Text>
              </View>
              <Ionicons name="open-outline" size={18} color={colors.goldLight} />
            </Pressable>
          </Section>

          <View style={styles.navigationRow}>
            <Pressable
              disabled={name.id === 1}
              onPress={() => router.replace(`/99-names/${name.id - 1}` as Href)}
              style={({ pressed }) => [styles.navButton, name.id === 1 && styles.navButtonDisabled, pressed && styles.pressed]}
            >
              <Ionicons name="arrow-back" size={17} color={name.id === 1 ? colors.textMuted : colors.goldLight} />
              <Text style={[styles.navButtonText, name.id === 1 && styles.navButtonTextDisabled]}>Précédent</Text>
            </Pressable>
            <Pressable
              disabled={name.id === 99}
              onPress={() => router.replace(`/99-names/${name.id + 1}` as Href)}
              style={({ pressed }) => [styles.navButton, name.id === 99 && styles.navButtonDisabled, pressed && styles.pressed]}
            >
              <Text style={[styles.navButtonText, name.id === 99 && styles.navButtonTextDisabled]}>Suivant</Text>
              <Ionicons name="arrow-forward" size={17} color={name.id === 99 ? colors.textMuted : colors.goldLight} />
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  header: { minHeight: 66, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.045)" },
  headerCounter: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "700", letterSpacing: 1.1 },
  headerSpacer: { width: 42 },
  content: { padding: 16, paddingBottom: 44 },
  hero: { minHeight: 286, overflow: "hidden", alignItems: "center", justifyContent: "center", padding: 24, borderRadius: 31, borderWidth: 1.2, borderColor: "rgba(227,181,90,0.48)" },
  heroGlow: { position: "absolute", top: -92, width: 280, height: 280, borderRadius: 140, backgroundColor: "rgba(227,181,90,0.055)" },
  heroRim: { position: "absolute", top: 8, right: 8, bottom: 8, left: 8, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  heroIndex: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 9, fontWeight: "700", letterSpacing: 1.35 },
  heroArabic: { marginTop: 12, color: colors.text, fontFamily: typography.arabic, fontSize: 52, lineHeight: 78, textAlign: "center" },
  heroTransliteration: { marginTop: 3, color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 30, textAlign: "center" },
  heroTranslation: { marginTop: 6, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, textAlign: "center" },
  sectionCard: { marginTop: 14, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(23,16,38,0.84)" },
  sectionHeader: { flexDirection: "row", alignItems: "center" },
  sectionIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "rgba(227,181,90,0.09)" },
  sectionHeadingCopy: { flex: 1, marginLeft: 11 },
  sectionEyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 8.5, fontWeight: "700", letterSpacing: 1.1 },
  sectionTitle: { marginTop: 2, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 19 },
  sectionBody: { marginTop: 13 },
  paragraph: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 20 },
  verseNote: { marginTop: 13, padding: 13, borderRadius: 17, borderWidth: 1, borderColor: "rgba(227,181,90,0.20)", backgroundColor: "rgba(227,181,90,0.055)" },
  verseReference: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "700" },
  verseText: { marginTop: 5, color: colors.text, fontFamily: typography.serifMedium, fontSize: 16, lineHeight: 21 },
  sourceButton: { marginTop: 14, padding: 13, flexDirection: "row", alignItems: "center", borderRadius: 17, borderWidth: 1, borderColor: "rgba(227,181,90,0.25)", backgroundColor: "rgba(227,181,90,0.045)" },
  sourceButtonCopy: { flex: 1, paddingRight: 10 },
  sourceButtonTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 11.5, fontWeight: "700" },
  sourceButtonSubtitle: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5 },
  navigationRow: { marginTop: 18, flexDirection: "row", gap: 10 },
  navButton: { flex: 1, height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 17, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(23,16,38,0.84)" },
  navButtonDisabled: { opacity: 0.38 },
  navButtonText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11.5, fontWeight: "700" },
  navButtonTextDisabled: { color: colors.textMuted },
  pressed: { opacity: 0.78, transform: [{ scale: 0.992 }] },
  missingScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 24 },
  missingTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 24 },
  missingButton: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 14, backgroundColor: colors.goldLight },
  missingButtonText: { color: colors.background, fontFamily: typography.sans, fontWeight: "700" },
});
