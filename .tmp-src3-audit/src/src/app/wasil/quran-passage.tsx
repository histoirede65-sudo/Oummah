import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SURAHS } from "../../data/surahs";
import { QuranArabicText } from "../../features/quran/QuranArabicText";
import { sanitizeTranslationText } from "../../features/quran/TranslationText";
import { readingQuranRepository } from "../../features/quran/ReadingQuranRepository";
import type { QuranFoundationVerse } from "../../features/quranfoundation/QuranFoundationTypes";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function positiveInteger(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function verseNumber(verse: QuranFoundationVerse) {
  const parsed = Number(verse.verseKey.split(":")[1]);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : verse.id;
}

export default function WasilQuranPassageScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{
    id?: string | string[];
    verseStart?: string | string[];
    verseEnd?: string | string[];
  }>();
  const surahId = positiveInteger(singleParam(params.id));
  const requestedStart = positiveInteger(singleParam(params.verseStart));
  const requestedEnd = positiveInteger(singleParam(params.verseEnd));
  const surah = useMemo(
    () => SURAHS.find((item) => item.id === surahId),
    [surahId],
  );
  const verseStart = requestedStart ?? 1;
  const verseEnd = Math.max(verseStart, requestedEnd ?? verseStart);

  const [verses, setVerses] = useState<QuranFoundationVerse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const load = useCallback(async () => {
    if (
      !surah ||
      verseStart < 1 ||
      verseEnd > surah.verses ||
      verseEnd < verseStart
    ) {
      setError("Ce passage coranique est invalide.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(undefined);
    try {
      const response = (await readingQuranRepository.getVerses(
        surah.id,
      )) as unknown as
        | QuranFoundationVerse[]
        | { verses?: QuranFoundationVerse[] };
      const allVerses = Array.isArray(response)
        ? response
        : (response.verses ?? []);
      const passage = allVerses.filter((verse) => {
        const number = verseNumber(verse);
        return number >= verseStart && number <= verseEnd;
      });
      if (passage.length !== verseEnd - verseStart + 1) {
        throw new Error("Le passage demandé est incomplet.");
      }
      setVerses(passage);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible de charger ce passage.",
      );
    } finally {
      setLoading(false);
    }
  }, [surah, verseEnd, verseStart]);

  useEffect(() => {
    void load();
  }, [load]);

  const passageLabel =
    verseEnd === verseStart
      ? `Verset ${verseStart}`
      : `Versets ${verseStart} à ${verseEnd}`;

  const openFullSurah = useCallback(() => {
    if (!surah) return;
    router.push({
      pathname: "/surah/[id]",
      params: { id: String(surah.id) },
    });
  }, [surah]);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Retour vers Wasil"
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>OUMMAH</Text>
          <Text style={styles.title} numberOfLines={1}>
            {surah ? `Sourate ${surah.transliteration}` : "Passage coranique"}
          </Text>
          <Text style={styles.subtitle}>{passageLabel}</Text>
        </View>
        <View style={styles.iconBadge}>
          <Ionicons name="book-outline" size={20} color={colors.goldLight} />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>Ouverture du passage…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={36}
            color={colors.goldLight}
          />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.surahIdentity}>
            <Text style={styles.arabicSurahName}>{surah?.arabicName}</Text>
            <Text style={styles.frenchSurahName}>{surah?.frenchName}</Text>
          </View>

          {verses.map((verse) => {
            const number = verseNumber(verse);
            const translation = sanitizeTranslationText(
              verse.translation || verse.translations?.[0]?.text,
            );
            return (
              <View key={verse.verseKey} style={styles.verseCard}>
                <View style={styles.verseHeader}>
                  <View style={styles.verseNumberBadge}>
                    <Text style={styles.verseNumber}>{number}</Text>
                  </View>
                  <Text style={styles.verseKey}>{verse.verseKey}</Text>
                </View>
                <QuranArabicText
                  selectable
                  preferredSize={30}
                  screenWidth={screenWidth}
                >
                  {verse.textUthmani}
                </QuranArabicText>
                {translation ? (
                  <Text selectable style={styles.translation}>
                    {translation}
                  </Text>
                ) : null}
              </View>
            );
          })}

          <Pressable onPress={openFullSurah} style={styles.fullSurahButton}>
            <Ionicons name="library-outline" size={18} color={colors.goldLight} />
            <Text style={styles.fullSurahButtonText}>
              Voir la sourate complète
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 84,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(214, 177, 88, 0.24)",
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(214, 177, 88, 0.10)",
  },
  headerCopy: { flex: 1, paddingHorizontal: 14 },
  eyebrow: {
    color: colors.gold,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  title: {
    color: colors.text,
    fontSize: 19,
    fontFamily: typography.serifSemibold,
    fontWeight: "700",
  },
  subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(214, 177, 88, 0.28)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 14,
  },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  errorText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  primaryButton: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.gold,
  },
  primaryButtonText: { color: colors.background, fontWeight: "800" },
  content: { padding: 18, paddingBottom: 36, gap: 14 },
  surahIdentity: { alignItems: "center", paddingVertical: 12 },
  arabicSurahName: {
    color: colors.goldLight,
    fontSize: 30,
    fontWeight: "700",
    marginBottom: 5,
  },
  frenchSurahName: { color: colors.textSecondary, fontSize: 14 },
  verseCard: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: "rgba(214, 177, 88, 0.18)",
    gap: 16,
  },
  verseHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  verseNumberBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(214, 177, 88, 0.14)",
  },
  verseNumber: { color: colors.goldLight, fontSize: 13, fontWeight: "800" },
  verseKey: { color: colors.textSecondary, fontSize: 12 },
  translation: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 25,
  },
  fullSurahButton: {
    marginTop: 4,
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(214, 177, 88, 0.35)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  fullSurahButtonText: {
    color: colors.goldLight,
    fontSize: 15,
    fontWeight: "700",
  },
});
