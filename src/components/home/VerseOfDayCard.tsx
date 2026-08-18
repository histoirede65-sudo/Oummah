import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, Pressable, StyleSheet, Text, View } from "react-native";

import { SURAHS } from "../../data/surahs";
import { verseOfDay, verseOfDayRoute } from "../../features/notifications/NotificationCenter";
import { quranFoundationRepository } from "../../features/quranfoundation/QuranFoundationRepository";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type DailyVersePreview = {
  text: string;
  reference: string;
  route: string;
};

async function loadDailyVerse(): Promise<DailyVersePreview> {
  const dailyVerse = verseOfDay();
  const surah = SURAHS.find((item) => item.id === dailyVerse.surahId);
  const verses = await quranFoundationRepository.getVerses(dailyVerse.surahId);
  const verse = verses.find((item) => item.verseKey === `${dailyVerse.surahId}:${dailyVerse.verse}`);
  const text = verse?.translation?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

  return {
    text: text || "Découvrez le verset sélectionné pour aujourd’hui.",
    reference: `${surah?.transliteration ?? `Sourate ${dailyVerse.surahId}`} — ${dailyVerse.surahId}:${dailyVerse.verse}`,
    route: verseOfDayRoute(),
  };
}

export default function VerseOfDayCard() {
  const [dailyVerse, setDailyVerse] = useState<DailyVersePreview | null>(null);

  const refresh = useCallback(async () => {
    try {
      setDailyVerse(await loadDailyVerse());
    } catch {
      const verse = verseOfDay();
      const surah = SURAHS.find((item) => item.id === verse.surahId);
      setDailyVerse({
        text: "Découvrez le verset sélectionné pour aujourd’hui.",
        reference: `${surah?.transliteration ?? `Sourate ${verse.surahId}`} — ${verse.surahId}:${verse.verse}`,
        route: verseOfDayRoute(),
      });
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le verset du jour"
      onPress={() => router.push((dailyVerse?.route ?? verseOfDayRoute()) as never)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={["#233A45", "#172A35"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardHeader}>
        <Ionicons name="book-outline" size={21} color={colors.goldLight} />
        <Text style={styles.title}>Verset du jour</Text>
      </View>
      <Text numberOfLines={3} style={styles.bodyText}>
        {dailyVerse?.text ?? "Chargement du verset du jour…"}
      </Text>
      <Text numberOfLines={1} style={styles.reference}>
        {dailyVerse?.reference ?? ""}
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
    borderColor: "rgba(242,197,91,0.16)",
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
