import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams, type Href } from "expo-router";
import { Alert, Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

import { AKHIRA_PARTS, AKHIRA_STAGES, getAkhiraStage, type AkhiraText } from "../../features/akhira/akhiraContent";
import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const TEXT = {
  fr: { literal: "Traduction littérale de l’arabe ci-dessus.", back: "Retour", previous: "Étape précédente", next: "Étape suivante", overview: "Toutes les étapes", unavailableTitle: "Source indisponible", unavailableText: "Impossible d’ouvrir cette source pour le moment.", notFound: "Étape introuvable" },
  en: { literal: "Literal translation of the Arabic above.", back: "Back", previous: "Previous step", next: "Next step", overview: "All steps", unavailableTitle: "Source unavailable", unavailableText: "This source cannot be opened right now.", notFound: "Step not found" },
};

export default function AkhiraStageScreen() {
  const { language } = useI18n();
  const en = language !== "fr";
  const tx = en ? TEXT.en : TEXT.fr;
  const params = useLocalSearchParams<{ stage: string }>();
  const stage = getAkhiraStage(Array.isArray(params.stage) ? params.stage[0] : params.stage);
  const index = stage ? AKHIRA_STAGES.indexOf(stage) : -1;
  const previous = index > 0 ? AKHIRA_STAGES[index - 1] : null;
  const next = index >= 0 && index < AKHIRA_STAGES.length - 1 ? AKHIRA_STAGES[index + 1] : null;
  const part = AKHIRA_PARTS.find((item) => item.stages.some((candidate) => candidate.id === stage?.id));

  const openSource = (item: AkhiraText) => {
    Linking.openURL(item.url).catch(() => Alert.alert(tx.unavailableTitle, tx.unavailableText));
  };
  const go = (id: string) => router.replace(`/akhira/${id}` as Href);

  return (
    <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={tx.back}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{part ? (en ? part.titleEn : part.title) : ""}</Text>
          <View style={styles.iconSpacer} />
        </View>

        {!stage ? <Text style={styles.notFound}>{tx.notFound}</Text> : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.arabicTitle}>{stage.arabic}</Text>
            <Text style={styles.title}>{en ? stage.titleEn : stage.title}</Text>

            {stage.texts.map((item) => (
              <View key={item.id} style={styles.entry}>
                <View style={styles.highlight}>
                  <Text style={styles.highlightText}>“{en ? item.highlightEn : item.highlight}”</Text>
                </View>
                {item.arabic ? <Text style={styles.arabic}>{item.arabic}</Text> : null}
                <Text style={styles.body}>{en ? item.en : item.fr}</Text>
                {item.kind === "scholar" ? <Text style={styles.literal}>{tx.literal}</Text> : null}
                <Pressable onPress={() => openSource(item)} style={({ pressed }) => [styles.ref, pressed && styles.pressed]} accessibilityRole="link" hitSlop={6}>
                  <Ionicons name={item.kind === "quran" ? "book-outline" : item.kind === "scholar" ? "person-outline" : "document-text-outline"} size={13} color={colors.goldLight} />
                  <Text style={styles.refText}>{en ? item.refEn ?? item.ref : item.ref}</Text>
                  <Ionicons name="open-outline" size={12} color={colors.goldLight} />
                </Pressable>
              </View>
            ))}

            <View style={styles.nav}>
              {previous ? (
                <Pressable onPress={() => go(previous.id)} style={({ pressed }) => [styles.navButton, pressed && styles.pressed]}>
                  <Text style={styles.navLabel}>{tx.previous}</Text>
                  <Text style={styles.navTitle} numberOfLines={1}>‹ {en ? previous.titleEn : previous.title}</Text>
                </Pressable>
              ) : <View style={styles.navSpacer} />}
              {next ? (
                <Pressable onPress={() => go(next.id)} style={({ pressed }) => [styles.navButton, styles.navNext, pressed && styles.pressed]}>
                  <Text style={[styles.navLabel, styles.navLabelNext]}>{tx.next}</Text>
                  <Text style={[styles.navTitle, styles.navTitleNext]} numberOfLines={1}>{en ? next.titleEn : next.title} ›</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.navButton, styles.navNext, pressed && styles.pressed]}>
                  <Text style={[styles.navLabel, styles.navLabelNext]}>{tx.overview}</Text>
                  <Text style={[styles.navTitle, styles.navTitleNext]} numberOfLines={1}>الآخرة</Text>
                </Pressable>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  pressed: { opacity: 0.7 },
  header: { minHeight: 56, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  iconButton: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderSoft },
  iconSpacer: { width: 42 },
  headerTitle: { flex: 1, textAlign: "center", color: colors.goldLight, fontFamily: typography.sans, fontSize: 11.5, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" },
  notFound: { margin: 24, color: colors.textMuted, fontFamily: typography.sans, fontSize: 15 },
  content: { paddingHorizontal: 22, paddingBottom: 60 },
  arabicTitle: { color: colors.goldLight, fontFamily: typography.arabic, fontSize: 34, lineHeight: 54 },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 40, lineHeight: 44 },
  entry: { marginTop: 30, paddingBottom: 26, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(227,181,90,0.20)" },
  highlight: { paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: colors.goldLight },
  highlightText: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 24, lineHeight: 31 },
  arabic: { marginTop: 16, color: colors.text, fontFamily: typography.arabic, fontSize: 23, lineHeight: 42, textAlign: "right", writingDirection: "rtl" },
  body: { marginTop: 14, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15.5, lineHeight: 24 },
  literal: { marginTop: 6, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, lineHeight: 17 },
  ref: { marginTop: 12, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: "rgba(227,181,90,0.36)", backgroundColor: "rgba(227,181,90,0.07)" },
  refText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12.5, fontWeight: "800" },
  nav: { marginTop: 30, flexDirection: "row", gap: 10 },
  navSpacer: { flex: 1 },
  navButton: { flex: 1, minHeight: 64, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.borderSoft, justifyContent: "center" },
  navNext: { backgroundColor: colors.goldLight, borderColor: colors.goldLight },
  navLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, fontWeight: "700" },
  navLabelNext: { color: "rgba(8,7,19,0.65)" },
  navTitle: { marginTop: 2, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 18 },
  navTitleNext: { color: colors.background },
});
