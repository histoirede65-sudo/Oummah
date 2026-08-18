import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import {
  DEFAULT_CALENDAR_SETTINGS,
  loadCalendarSettings,
} from "../features/calendar/CalendarStore";
import {
  addDays,
  findNextEvent,
  formatHijri,
  getEventsForDate,
  getHijriDate,
} from "../features/calendar/IslamicCalendar";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export default function CalendarHomeBanner() {
  const [settings, setSettings] = useState(DEFAULT_CALENDAR_SETTINGS);
  useFocusEffect(
    useCallback(() => {
      void loadCalendarSettings().then(setSettings);
    }, []),
  );
  const today = new Date();
  const hijri = getHijriDate(
    today,
    settings.method,
    settings.adjustment,
    settings.country,
  );
  const next = findNextEvent(
    today,
    settings.method,
    settings.adjustment,
    settings.country,
  );
  const tomorrow = addDays(today, 1);
  const tomorrowHijri = getHijriDate(
    tomorrow,
    settings.method,
    settings.adjustment,
    settings.country,
  );
  let reminderMessage: string | undefined;
  for (let offset = 0; offset <= 3 && !reminderMessage; offset += 1) {
    const date = addDays(today, offset);
    const hijriDate = getHijriDate(
      date,
      settings.method,
      settings.adjustment,
      settings.country,
    );
    const event = getEventsForDate(hijriDate).find((item) => {
      const timing = settings.eventReminders[item.id];
      return (
        (timing === "morning" && offset === 0) ||
        (timing === "eve" && offset === 1) ||
        (timing === "three-days" && offset === 3)
      );
    });
    if (event) {
      reminderMessage = `${event.shortTitle} ${
        offset === 0
          ? "est aujourd’hui"
          : `approche dans ${offset} jour${offset > 1 ? "s" : ""}`
      }`;
    }
  }
  if (
    !reminderMessage &&
    settings.whiteDaysReminder &&
    tomorrowHijri.day === 13
  ) {
    reminderMessage = `Demain commencent les jours blancs de ${tomorrowHijri.monthName}`;
  }
  if (!reminderMessage && settings.fridayReminder && tomorrow.getDay() === 5) {
    reminderMessage = "Demain est vendredi — pensez à sourate Al-Kahf";
  }
  if (
    !reminderMessage &&
    settings.mondayThursdayReminder &&
    (tomorrow.getDay() === 1 || tomorrow.getDay() === 4)
  ) {
    reminderMessage = `Demain est ${
      tomorrow.getDay() === 1 ? "lundi" : "jeudi"
    } — jeûne recommandé`;
  }
  return (
    <Pressable
      onPress={() => router.push("/calendar" as Href)}
      style={styles.card}
    >
      <LinearGradient
        colors={["rgba(89,45,107,0.84)", "rgba(29,18,42,0.94)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.icon}>
        <Ionicons name="moon" size={19} color={colors.goldLight} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.date}>{formatHijri(hijri)}</Text>
        <Text numberOfLines={1} style={styles.event}>
          {reminderMessage ??
            (next
              ? `${next.event.shortTitle} ${next.days === 0 ? "aujourd’hui" : `dans ${next.days} jour${next.days > 1 ? "s" : ""}`}`
              : "Votre calendrier islamique")}
        </Text>
      </View>
      <View style={styles.open}>
        <Ionicons name="arrow-forward" size={16} color={colors.goldLight} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 70,
    marginBottom: 10,
    paddingHorizontal: 11,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(232,194,105,0.30)",
  },
  icon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(7,5,13,0.48)",
  },
  copy: { flex: 1, marginLeft: 10 },
  date: {
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 17,
  },
  event: {
    marginTop: 2,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 8.5,
  },
  open: {
    width: 31,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
});
