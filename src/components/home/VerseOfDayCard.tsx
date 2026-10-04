import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";

import { SURAHS } from "../../data/surahs";
import { verseOfDay, verseOfDayRoute } from "../../features/notifications/NotificationCenter";
import { quranFoundationRepository } from "../../features/quranfoundation/QuranFoundationRepository";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useI18n } from "../../i18n";

type DailyVersePreview = {
  text: string;
  reference: string;
  route: string;
};

async function loadDailyVerse(
  language: "fr" | "en",
  fallbackText: string,
  surahLabel: string,
): Promise<DailyVersePreview> {
  const dailyVerse = verseOfDay();
  const surah = SURAHS.find((item) => item.id === dailyVerse.surahId);
  const verses = await quranFoundationRepository.getVerses(dailyVerse.surahId, language);
  const verse = verses.find((item) => item.verseKey === `${dailyVerse.surahId}:${dailyVerse.verse}`);
  const text = verse?.translation?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return {
    text: text || fallbackText,
    reference: `${surah?.transliteration ?? `${surahLabel} ${dailyVerse.surahId}`} — ${dailyVerse.surahId}:${dailyVerse.verse}`,
    route: verseOfDayRoute(),
  };
}

export default function VerseOfDayCard() {
  const { language, t } = useI18n();
  const [dailyVerse, setDailyVerse] = useState<DailyVersePreview | null>(null);
  const [loadedLanguage, setLoadedLanguage] = useState<typeof language | null>(null);
  const requestId = useRef(0);
  const visibleDailyVerse = loadedLanguage === language ? dailyVerse : null;

  const refresh = useCallback(async () => {
    const currentRequestId = ++requestId.current;
    try {
      const verse = await loadDailyVerse(
        language,
        t("home.verseFallback"),
        t("home.surah"),
      );
      if (currentRequestId === requestId.current) {
        setDailyVerse(verse);
        setLoadedLanguage(language);
      }
    } catch {
      const verse = verseOfDay();
      const surah = SURAHS.find((item) => item.id === verse.surahId);
      if (currentRequestId === requestId.current) {
        setDailyVerse({
          text: t("home.verseFallback"),
          reference: `${surah?.transliteration ?? `${t("home.surah")} ${verse.surahId}`} — ${verse.surahId}:${verse.verse}`,
          route: verseOfDayRoute(),
        });
        setLoadedLanguage(language);
      }
    }
  }, [language, t]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        requestId.current += 1;
      };
    }, [refresh]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("home.openVerseToday")}
      onPress={() => router.push((visibleDailyVerse?.route ?? verseOfDayRoute()) as never)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={["#1E1730", "#151022"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardHeader}>
        <Ionicons name="book-outline" size={21} color={colors.goldLight} />
        <Text style={styles.title}>{t("home.verseToday")}</Text>
      </View>
      <Text numberOfLines={3} style={styles.bodyText}>
        {visibleDailyVerse?.text ?? t("home.loadingVerse")}
      </Text>
      <Text numberOfLines={1} style={styles.reference}>
        {visibleDailyVerse?.reference ?? ""}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 11 },
  title: { color: colors.text, fontFamily: typography.sans, fontSize: 12, fontWeight: "600" },
  bodyText: { color: colors.text, fontFamily: typography.sans, fontSize: 12, fontWeight: "500", lineHeight: 17 },
  reference: { marginTop: "auto", color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "500", lineHeight: 15 },
  pressed: { opacity: 0.72 },
});
