import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  ALLAH_NAMES,
  ALLAH_NAMES_FOUNDATION,
} from "../features/99-names/names";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

function normalize(value: string) {
  return value
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘']/g, "");
}

export default function AllahNamesScreen() {
  const [query, setQuery] = useState("");
  const filteredNames = useMemo(() => {
    const normalized = normalize(query.trim());
    if (!normalized) return ALLAH_NAMES;
    return ALLAH_NAMES.filter((name) =>
      [name.transliteration, name.translation, name.arabic]
        .map(normalize)
        .some((value) => value.includes(normalized)),
    );
  }, [query]);

  const featured = ALLAH_NAMES[0];

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundSecondary, colors.background]}
      style={styles.screen}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Les 99 noms d’Allah</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <Ionicons name="sparkles-outline" size={20} color={colors.goldLight} />
            </View>
            <Text style={styles.introTitle}>Connaître Allah par Ses plus beaux noms</Text>
            <Text style={styles.introText}>
              Découvrez les noms d’Allah, leur sens et ce qu’ils nous enseignent. Chaque fiche est pensée pour être simple à lire, profonde et propice à la méditation.
            </Text>
          </View>

          <Pressable
            onPress={() => router.push(`/99-names/${featured.id}` as Href)}
            style={({ pressed }) => [styles.featuredCard, pressed && styles.pressed]}
          >
            <LinearGradient
              colors={["rgba(74,36,97,0.72)", "rgba(20,12,31,0.96)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.featuredGlow} />
            <View style={styles.featuredRim} />
            <Text style={styles.featuredNumber}>١</Text>
            <Text style={styles.featuredArabic}>{featured.arabic}</Text>
            <Text style={styles.featuredTransliteration}>{featured.transliteration}</Text>
            <Text style={styles.featuredTranslation}>{featured.translation}</Text>
            <View style={styles.featuredAction}>
              <Text style={styles.featuredActionText}>Découvrir ce nom</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.goldLight} />
            </View>
          </Pressable>

          <View style={styles.foundationCard}>
            <Text style={styles.foundationEyebrow}>DANS LE CORAN</Text>
            {ALLAH_NAMES_FOUNDATION.map((reference, index) => (
              <View key={reference.verse} style={[styles.referenceRow, index > 0 && styles.referenceDivider]}>
                <View style={styles.referenceBadge}>
                  <Text style={styles.referenceBadgeText}>{reference.verse}</Text>
                </View>
                <View style={styles.referenceCopy}>
                  <Text style={styles.referenceTitle}>{reference.surah}</Text>
                  <Text style={styles.referenceText}>{reference.note}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={18} color={colors.textMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Rechercher un nom ou un sens"
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.listHeader}>
            <View>
              <Text style={styles.sectionLabel}>LES 99 NOMS</Text>
              <Text style={styles.sectionTitle}>Explorer & méditer</Text>
            </View>
            <Text style={styles.count}>{filteredNames.length} noms</Text>
          </View>

          <View style={styles.grid}>
            {filteredNames.map((name) => (
              <Pressable
                key={name.id}
                onPress={() => router.push(`/99-names/${name.id}` as Href)}
                style={({ pressed }) => [styles.nameCard, pressed && styles.pressed]}
              >
                <LinearGradient
                  colors={["rgba(43,21,63,0.82)", "rgba(18,12,29,0.94)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardNumberBadge}>
                  <Text style={styles.cardNumber}>{name.id}</Text>
                </View>
                <Text style={styles.arabic}>{name.arabic}</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.transliteration}>
                  {name.transliteration}
                </Text>
                <Text numberOfLines={2} style={styles.translation}>{name.translation}</Text>
                <View style={styles.cardArrow}>
                  <Ionicons name="chevron-forward" size={14} color={colors.goldLight} />
                </View>
              </Pressable>
            ))}
          </View>

          {filteredNames.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={24} color={colors.goldLight} />
              <Text style={styles.emptyTitle}>Aucun nom trouvé</Text>
              <Text style={styles.emptyText}>Essayez une autre recherche.</Text>
            </View>
          ) : null}

          <View style={styles.methodCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.goldLight} />
            <View style={styles.methodCopy}>
              <Text style={styles.methodTitle}>Une approche claire et prudente</Text>
              <Text style={styles.methodText}>
                Le catalogue suit une liste de référence relue par un savant. Les fiches sont des résumés pédagogiques : elles ne remplacent pas l’étude auprès de personnes qualifiées.
              </Text>
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
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.045)" },
  headerCopy: { flex: 1, alignItems: "center" },
  headerSpacer: { width: 42 },
  eyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9, fontWeight: "700", letterSpacing: 1.45 },
  headerTitle: { marginTop: 3, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21 },
  content: { padding: 16, paddingBottom: 44 },
  introCard: { padding: 18, borderRadius: 24, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(23,16,38,0.82)" },
  introIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "rgba(227,181,90,0.10)" },
  introTitle: { marginTop: 13, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21, lineHeight: 25 },
  introText: { marginTop: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 20 },
  featuredCard: { marginTop: 16, minHeight: 260, overflow: "hidden", alignItems: "center", justifyContent: "center", padding: 24, borderRadius: 30, borderWidth: 1.2, borderColor: "rgba(227,181,90,0.46)", shadowColor: "#000", shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.42, shadowRadius: 22, elevation: 16 },
  featuredGlow: { position: "absolute", top: -92, width: 260, height: 260, borderRadius: 130, backgroundColor: "rgba(227,181,90,0.055)" },
  featuredRim: { position: "absolute", top: 8, right: 8, bottom: 8, left: 8, borderRadius: 23, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  featuredNumber: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  featuredArabic: { marginTop: 8, color: colors.text, fontFamily: typography.arabic, fontSize: 48, lineHeight: 70, textAlign: "center" },
  featuredTransliteration: { marginTop: 2, color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 27 },
  featuredTranslation: { marginTop: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, textAlign: "center" },
  featuredAction: { marginTop: 18, flexDirection: "row", alignItems: "center", gap: 6 },
  featuredActionText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: "700" },
  foundationCard: { marginTop: 16, padding: 16, borderRadius: 24, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(15,12,28,0.86)" },
  foundationEyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9, fontWeight: "700", letterSpacing: 1.2 },
  referenceRow: { flexDirection: "row", paddingVertical: 13 },
  referenceDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft },
  referenceBadge: { minWidth: 52, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(227,181,90,0.12)" },
  referenceBadgeText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "700" },
  referenceCopy: { flex: 1, marginLeft: 12 },
  referenceTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 12, fontWeight: "700" },
  referenceText: { marginTop: 3, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 17 },
  searchWrap: { marginTop: 18, height: 48, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 17, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(23,16,38,0.78)" },
  searchInput: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 13 },
  listHeader: { marginTop: 24, marginBottom: 11, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  sectionLabel: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9, fontWeight: "700", letterSpacing: 1.2 },
  sectionTitle: { marginTop: 3, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 },
  count: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  nameCard: { width: "48.5%", minHeight: 176, overflow: "hidden", alignItems: "center", paddingHorizontal: 12, paddingVertical: 13, borderRadius: 22, borderWidth: 1, borderColor: colors.borderSoft },
  cardNumberBadge: { alignSelf: "flex-start", minWidth: 28, height: 22, paddingHorizontal: 6, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: "rgba(227,181,90,0.10)" },
  cardNumber: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9, fontWeight: "700" },
  arabic: { marginTop: 12, color: colors.text, fontFamily: typography.arabic, fontSize: 28, lineHeight: 43, textAlign: "center" },
  transliteration: { marginTop: 7, color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 18, textAlign: "center" },
  translation: { marginTop: 4, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, lineHeight: 14, textAlign: "center" },
  cardArrow: { position: "absolute", right: 9, bottom: 9, width: 24, height: 24, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "rgba(227,181,90,0.08)" },
  emptyState: { marginTop: 24, alignItems: "center", padding: 24, borderRadius: 22, borderWidth: 1, borderColor: colors.borderSoft },
  emptyTitle: { marginTop: 8, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 18 },
  emptyText: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11 },
  methodCard: { marginTop: 18, padding: 16, flexDirection: "row", alignItems: "flex-start", borderRadius: 22, borderWidth: 1, borderColor: "rgba(227,181,90,0.22)", backgroundColor: "rgba(227,181,90,0.055)" },
  methodCopy: { flex: 1, marginLeft: 11 },
  methodTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 12.5, fontWeight: "700" },
  methodText: { marginTop: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 17 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.992 }] },
});
