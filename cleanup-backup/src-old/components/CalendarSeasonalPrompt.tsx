import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  DEFAULT_CALENDAR_SETTINGS,
  loadCalendarSettings,
} from "../features/calendar/CalendarStore";
import { getHijriDate } from "../features/calendar/IslamicCalendar";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export default function CalendarSeasonalPrompt({
  context,
}: {
  context: "quran" | "hifz";
}) {
  const [settings, setSettings] = useState(DEFAULT_CALENDAR_SETTINGS);
  useFocusEffect(
    useCallback(() => {
      void loadCalendarSettings().then(setSettings);
    }, []),
  );
  const hijri = getHijriDate(
    new Date(),
    settings.method,
    settings.adjustment,
    settings.country,
  );
  const ramadan = hijri.month === 9;
  const dhulHijjah = hijri.month === 12 && hijri.day <= 10;
  if (!ramadan && !dhulHijjah) return null;
  const title = ramadan
    ? "Votre rythme de Ramadan"
    : "Les dix jours de Dhul-Hijja";
  const text =
    context === "quran"
      ? ramadan
        ? "Construisez une lecture régulière et réaliste du Coran."
        : "Accompagnez ces jours précieux par une lecture attentive."
      : ramadan
        ? "Adaptez votre objectif de mémorisation sans vous surcharger."
        : "Consolidez quelques versets avec constance.";
  return (
    <Pressable
      onPress={() => router.push("/calendar" as Href)}
      style={styles.card}
    >
      <View style={styles.icon}>
        <Ionicons name="moon" size={17} color={colors.goldLight} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.text}>{text}</Text>
      </View>
      <Ionicons name="arrow-forward" size={16} color={colors.goldLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 68,
    marginTop: 10,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(232,194,105,0.30)",
    backgroundColor: "rgba(62,32,76,0.62)",
  },
  icon: {
    width: 37,
    height: 37,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(8,6,14,0.42)",
  },
  copy: { flex: 1, marginHorizontal: 9 },
  title: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  text: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
    lineHeight: 11,
  },
});
