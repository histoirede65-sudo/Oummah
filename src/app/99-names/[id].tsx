import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { ALLAH_NAMES_SOURCE, getAllahName } from "../../features/99-names/names";
import { markAllahNameOpened } from "../../features/99-names/namesStorage";
import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const CARD = "#151022";
const CARD_RAISED = "#1E1730";
const LINE = "#2B2238";

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

async function openSourceSafely() {
  try {
    if (await Linking.canOpenURL(ALLAH_NAMES_SOURCE.url)) await Linking.openURL(ALLAH_NAMES_SOURCE.url);
  } catch {
    // External source access is optional; never interrupt the module if it fails.
  }
}

export default function AllahNameDetailScreen() {
  const { language, t } = useI18n();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const numericId = Number(id);
  const name = Number.isInteger(numericId) && numericId >= 1 && numericId <= 99 ? getAllahName(numericId, language) : undefined;

  useEffect(() => {
    if (name) void markAllahNameOpened(name.id);
  }, [name]);

  if (!name) {
    return (
      <SafeAreaView style={styles.missingScreen}>
        <Text style={styles.missingTitle}>{t("names99.notFound")}</Text>
        <Pressable onPress={() => router.back()} style={styles.missingButton}>
          <Text style={styles.missingButtonText}>{t("common.back")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const previous = name.id > 1 ? getAllahName(name.id - 1, language) : undefined;
  const next = name.id < 99 ? getAllahName(name.id + 1, language) : undefined;
  const evidence = name.evidence;

  return (
    <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel={t("common.back")}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerCounter}>{name.id} / 99</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <LinearGradient colors={[CARD_RAISED, CARD]} style={StyleSheet.absoluteFill} />
            <Text style={styles.heroArabic}>{name.arabic}</Text>
            <Text style={styles.heroTransliteration}>{name.transliteration}</Text>
            <Text style={styles.heroTranslation}>{name.translation}</Text>
          </View>

          <Section icon="book-outline" eyebrow={t("names99.understand")} title={t("names99.understandTitle")}>
            <View style={styles.evidence}>
              {evidence.kind === "quran" ? (
                <>
                  <Text style={styles.evidenceArabic}>{evidence.arabic}</Text>
                  <Text style={styles.evidenceText}>{t("names99.quote", { text: evidence.text })}</Text>
                  <Text style={styles.evidenceReference}>{evidence.surah} · {evidence.ref}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.evidenceText}>{evidence.text}</Text>
                  <Text style={styles.evidenceReference}>{t("names99.reportedBy", { source: evidence.source })}</Text>
                </>
              )}
            </View>
          </Section>

          {name.reflection ? (
            <Section icon="heart-outline" eyebrow={t("names99.reflect")} title={t("names99.reflectTitle")}>
              <Text style={styles.paragraph}>{name.reflection}</Text>
            </Section>
          ) : null}

          <Pressable onPress={() => void openSourceSafely()} style={styles.sourceLine} accessibilityRole="link">
            <Text style={styles.sourceText}>
              {t("names99.sourceLine", { source: ALLAH_NAMES_SOURCE.label, reviewer: ALLAH_NAMES_SOURCE.reviewer })}
            </Text>
            <Ionicons name="open-outline" size={14} color={colors.textMuted} />
          </Pressable>

          <View style={styles.navigationRow}>
            <Pressable
              disabled={!previous}
              onPress={() => router.replace(`/99-names/${name.id - 1}` as Href)}
              style={({ pressed }) => [styles.navButton, !previous && styles.navButtonDisabled, pressed && styles.pressed]}
            >
              <Text style={[styles.navKicker, !previous && styles.navTextDisabled]}>{t("names99.previous")}</Text>
              {previous ? <Text style={styles.navName} numberOfLines={1}>{previous.transliteration}</Text> : null}
            </Pressable>
            <Pressable
              disabled={!next}
              onPress={() => router.replace(`/99-names/${name.id + 1}` as Href)}
              style={({ pressed }) => [styles.navButton, styles.navButtonNext, !next && styles.navButtonDisabled, pressed && styles.pressed]}
            >
              <Text style={[styles.navKicker, !next && styles.navTextDisabled]}>{t("names99.next")}</Text>
              {next ? <Text style={styles.navName} numberOfLines={1}>{next.transliteration}</Text> : null}
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
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: LINE, backgroundColor: "rgba(255,255,255,0.045)" },
  headerCounter: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "700", letterSpacing: 1.1, fontVariant: ["tabular-nums"] },
  headerSpacer: { width: 42 },
  content: { padding: 16, paddingBottom: 44 },
  hero: { overflow: "hidden", alignItems: "center", justifyContent: "center", paddingHorizontal: 24, paddingVertical: 26, borderRadius: 28, borderWidth: 1.2, borderColor: "rgba(227,181,90,0.42)" },
  heroArabic: { color: colors.text, fontFamily: typography.arabic, fontSize: 50, lineHeight: 78, textAlign: "center" },
  heroTransliteration: { color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 30, textAlign: "center" },
  heroTranslation: { marginTop: 5, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, textAlign: "center" },
  sectionCard: { marginTop: 14, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: LINE, backgroundColor: CARD },
  sectionHeader: { flexDirection: "row", alignItems: "center" },
  sectionIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "rgba(227,181,90,0.09)" },
  sectionHeadingCopy: { flex: 1, marginLeft: 11 },
  sectionEyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 8.5, fontWeight: "700", letterSpacing: 1.1, textTransform: "uppercase" },
  sectionTitle: { marginTop: 2, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 19 },
  sectionBody: { marginTop: 13 },
  paragraph: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13.5, lineHeight: 21 },
  evidence: { marginTop: 14, padding: 14, gap: 6, borderRadius: 17, borderWidth: 1, borderColor: "rgba(227,181,90,0.20)", backgroundColor: "rgba(227,181,90,0.055)" },
  evidenceArabic: { color: colors.text, fontFamily: typography.arabic, fontSize: 21, lineHeight: 38, textAlign: "right", writingDirection: "rtl" },
  evidenceText: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 16.5, lineHeight: 22 },
  evidenceReference: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "700" },
  sourceLine: { marginTop: 18, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  sourceText: { flexShrink: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, lineHeight: 16, textAlign: "center" },
  navigationRow: { marginTop: 18, flexDirection: "row", gap: 10 },
  navButton: { flex: 1, minHeight: 56, paddingHorizontal: 14, paddingVertical: 9, justifyContent: "center", borderRadius: 17, borderWidth: 1, borderColor: LINE, backgroundColor: CARD },
  navButtonNext: { alignItems: "flex-end" },
  navButtonDisabled: { opacity: 0.38 },
  navKicker: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11.5, fontWeight: "700" },
  navName: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11 },
  navTextDisabled: { color: colors.textMuted },
  pressed: { opacity: 0.78, transform: [{ scale: 0.992 }] },
  missingScreen: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, padding: 24 },
  missingTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 24 },
  missingButton: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 14, backgroundColor: colors.goldLight },
  missingButtonText: { color: colors.background, fontFamily: typography.sans, fontWeight: "700" },
});
