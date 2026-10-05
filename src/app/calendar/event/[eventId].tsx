import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DEFAULT_CALENDAR_SETTINGS,
  loadCalendarSettings,
  saveCalendarSettings,
  type CalendarSettings,
  type ReminderTiming,
} from "../../../features/calendar/CalendarStore";
import { refreshCalendarReminders } from "../../../features/calendar/calendarReminders";
import {
  formatGregorian,
  formatHijri,
  fromDateKey,
  getEventDefinition,
  getHijriDate,
  localizeEvent,
} from "../../../features/calendar/IslamicCalendar";
import { useI18n } from "../../../i18n";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

const EVENT_IMAGES: Record<string, number> = {
  "hijri-new-year": require("../../../assets/images/mosques/mosque-a-04.jpg"),
  ashura: require("../../../assets/images/mosques/mosque-b-05.jpg"),
  "ramadan-start": require("../../../assets/images/home/home-mosque-sunset.jpg"),
  "laylat-al-qadr": require("../../../assets/images/home/shortcuts/quran-real.jpg"),
  "eid-al-fitr": require("../../../assets/images/mosques/mosque-coastal.jpg"),
  "dhul-hijjah-start": require("../../../assets/images/home/shortcuts/qibla-real.jpg"),
  arafah: require("../../../assets/images/home/shortcuts/qibla-real.jpg"),
  "eid-al-adha": require("../../../assets/images/mosques/mosque-hero-premium.jpg"),
  tashriq: require("../../../assets/images/mosques/mosque-a-10.jpg"),
  "white-days": require("../../../assets/images/mosques/mosque-b-02.jpg"),
};

const TIMINGS = [
  { id: "three-days", labelKey: "calendar.timingThreeDays" },
  { id: "eve", labelKey: "calendar.timingEve" },
  { id: "morning", labelKey: "calendar.timingMorning" },
] as const satisfies readonly { id: ReminderTiming; labelKey: string }[];

export default function CalendarEventDetail() {
  const { language, t } = useI18n();
  const { eventId, date: rawDate } = useLocalSearchParams<{
    eventId: string;
    date?: string;
  }>();
  const event = getEventDefinition(eventId);
  const date = rawDate ? fromDateKey(rawDate) : new Date();
  const [settings, setSettings] = useState<CalendarSettings>(
    DEFAULT_CALENDAR_SETTINGS,
  );

  useEffect(() => {
    void loadCalendarSettings().then(setSettings);
  }, []);

  if (!event) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>{t("calendar.eventNotFound")}</Text>
          <Pressable
            onPress={() => router.back()}
            style={styles.backTextButton}
          >
            <Text style={styles.backText}>{t("calendar.backToCalendar")}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const hijri = getHijriDate(
    date,
    settings.method,
    settings.adjustment,
    settings.country,
  );
  const reminder = settings.eventReminders[event.id];
  const text = localizeEvent(event, language);
  const setReminder = (timing: ReminderTiming) => {
    const eventReminders = { ...settings.eventReminders };
    if (reminder === timing) delete eventReminders[event.id];
    else eventReminders[event.id] = timing;
    const next = { ...settings, eventReminders };
    setSettings(next);
    void saveCalendarSettings(next);
    void refreshCalendarReminders(next, { force: true, askPermission: true });
  };

  const askWasil = () => {
    const prompt = encodeURIComponent(
      t("calendar.wasilPrompt", { event: text.title }),
    );
    router.push(`/dalil?prompt=${prompt}` as Href);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <LinearGradient
        pointerEvents="none"
        colors={["#09070F", "#100C19", "#07060C"]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel={t("common.back")} onPress={() => router.back()} style={styles.circle}>
            <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
          </Pressable>
          <Text style={styles.headerTitle}>{t("calendar.eventTitle")}</Text>
          <View style={styles.circlePlaceholder} />
        </View>
        <View style={styles.hero}>
          <Image
            source={EVENT_IMAGES[event.id] ?? EVENT_IMAGES["hijri-new-year"]}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[
              "rgba(5,3,9,0.02)",
              "rgba(9,5,15,0.52)",
              "rgba(8,5,14,0.98)",
            ]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.kindPill}>
            <Ionicons
              name={
                event.kind === "recommended-fast"
                  ? "restaurant-outline"
                  : event.kind === "celebration"
                    ? "sparkles"
                    : "moon"
              }
              size={13}
              color={colors.goldLight}
            />
            <Text style={styles.kindText}>
              {event.kind === "recommended-fast"
                ? t("calendar.kindFastUpper")
                : event.kind === "celebration"
                  ? t("calendar.kindCelebrationIslamicUpper")
                  : t("calendar.kindPeriodUpper")}
            </Text>
          </View>
          <View style={styles.heroCopy}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(30,23,48,0.40)", "rgba(8,7,14,0.88)"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.heroTitle}>{text.title}</Text>
            <Text style={styles.heroHijri}>{formatHijri(hijri, language)}</Text>
            <Text style={styles.heroDate}>{formatGregorian(date, true, language)}</Text>
          </View>
        </View>
        {event.estimated ? (
          <View style={styles.estimated}>
            <Ionicons
              name="information-circle-outline"
              size={17}
              color={colors.goldLight}
            />
            <Text style={styles.estimatedText}>{t("calendar.estimatedNotice")}</Text>
          </View>
        ) : null}
        <Text style={styles.sectionTitle}>{t("calendar.about")}</Text>
        <Text style={styles.summary}>{text.summary}</Text>
        <Text style={styles.sectionTitle}>{t("calendar.recommendedActions")}</Text>
        <View style={styles.actions}>
          {text.actions.map((action, index) => (
            <View key={action} style={styles.action}>
              <View style={styles.actionNumber}>
                <Text style={styles.actionNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.sectionTitle}>{t("calendar.remindMe")}</Text>
        <View style={styles.timings}>
          {TIMINGS.map((timing) => (
            <Pressable
              key={timing.id}
              onPress={() => setReminder(timing.id)}
              style={[
                styles.timing,
                reminder === timing.id && styles.timingActive,
              ]}
            >
              <Ionicons
                name={
                  reminder === timing.id
                    ? "notifications"
                    : "notifications-outline"
                }
                size={16}
                color={
                  reminder === timing.id ? colors.background : colors.goldLight
                }
              />
              <Text
                style={[
                  styles.timingText,
                  reminder === timing.id && styles.timingTextActive,
                ]}
              >
                {t(timing.labelKey)}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.sectionTitle}>{t("calendar.sources")}</Text>
        {text.sources.map((source) => (
          <Pressable
            key={source.url}
            onPress={() => void Linking.openURL(source.url)}
            style={styles.source}
          >
            <Ionicons name="book-outline" size={17} color={colors.goldLight} />
            <Text style={styles.sourceText}>{source.label}</Text>
            <Ionicons name="open-outline" size={15} color={colors.textMuted} />
          </Pressable>
        ))}
        <Pressable onPress={askWasil} style={styles.wasil}>
          <LinearGradient
            colors={["#EAC466", "#C6933E"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.wasilIcon}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={19}
              color={colors.goldLight}
            />
          </View>
          <View style={styles.wasilCopy}>
            <Text style={styles.wasilTitle}>{t("calendar.askWasil")}</Text>
            <Text style={styles.wasilText}>{t("calendar.askWasilText")}</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.background} />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#08050D" },
  content: { paddingHorizontal: 15, paddingBottom: 130 },
  header: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  circle: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "#151022",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 9,
  },
  circlePlaceholder: { width: 42 },
  headerTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 23,
  },
  hero: {
    height: 330,
    overflow: "hidden",
    borderRadius: 31,
    borderWidth: 1.25,
    borderColor: "rgba(245,211,130,0.56)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.50,
    shadowRadius: 22,
    elevation: 15,
  },
  kindPill: {
    position: "absolute",
    top: 14,
    left: 14,
    height: 30,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    backgroundColor: "rgba(8,5,14,0.64)",
  },
  kindText: {
    marginLeft: 5,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  heroCopy: {
    position: "absolute",
    right: 14,
    bottom: 14,
    left: 14,
    padding: 15,
    overflow: "hidden",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(255,242,211,0.24)",
  },
  heroTitle: {
    color: "#FFF8EA",
    fontFamily: typography.serifSemibold,
    fontSize: 32,
    lineHeight: 38,
  },
  heroHijri: {
    marginTop: 8,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 19,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  heroDate: {
    marginTop: 2,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
    textTransform: "capitalize",
  },
  estimated: {
    minHeight: 55,
    marginTop: 9,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(232,194,105,0.09)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 9,
  },
  estimatedText: {
    flex: 1,
    marginLeft: 8,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
    lineHeight: 15,
  },
  sectionTitle: {
    marginTop: 23,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 24,
  },
  summary: {
    marginTop: 8,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 21,
  },
  actions: {
    marginTop: 8,
    padding: 13,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(28,17,40,0.84)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 9,
  },
  action: { minHeight: 45, flexDirection: "row", alignItems: "center" },
  actionNumber: {
    width: 27,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(30,23,48,0.66)",
  },
  actionNumberText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "900",
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  actionText: {
    flex: 1,
    marginLeft: 10,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  timings: { marginTop: 9, flexDirection: "row", gap: 7 },
  timing: {
    flex: 1,
    minHeight: 59,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(31,19,44,0.84)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 9,
  },
  timingActive: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  timingText: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.7,
    fontWeight: "800",
    textAlign: "center",
  },
  timingTextActive: { color: colors.background },
  source: {
    minHeight: 58,
    marginTop: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(30,18,42,0.82)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 9,
  },
  sourceText: {
    flex: 1,
    marginHorizontal: 9,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10.5,
  },
  wasil: {
    minHeight: 82,
    marginTop: 24,
    padding: 12,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 23,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 9,
  },
  wasilIcon: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    backgroundColor: colors.background,
  },
  wasilCopy: { flex: 1, marginHorizontal: 10 },
  wasilTitle: {
    color: colors.background,
    fontFamily: typography.serifSemibold,
    fontSize: 20,
  },
  wasilText: {
    marginTop: 2,
    color: "rgba(10,7,17,0.70)",
    fontFamily: typography.sans,
    fontSize: 10,
    lineHeight: 14,
  },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 26,
  },
  backTextButton: { marginTop: 14, padding: 12 },
  backText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
  },
});
