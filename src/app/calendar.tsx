import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  DEFAULT_CALENDAR_SETTINGS,
  loadCalendarSettings,
  saveCalendarSettings,
  type CalendarSettings,
} from "../features/calendar/CalendarStore";
import {
  addDays,
  CALENDAR_COUNTRIES,
  countryLabel as localizedCountryLabel,
  findNextEvent,
  formatGregorian,
  formatHijri,
  fromDateKey,
  getEventsForDate,
  getEventDefinition,
  getHijriDate,
  isRecommendedFastDay,
  localizeEvent,
  toDateKey,
  type IslamicEventDefinition,
} from "../features/calendar/IslamicCalendar";
import { useI18n } from "../i18n";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import {
  getMosquePrayerSchedule,
  type MosquePrayerSchedule,
} from "../features/mosques/data/mosquePrayerTimes";
import { getMainMosque } from "../features/mosques/data/mosquePreferences";

type CalendarTab = "today" | "month" | "events" | "reminders";

const MONTH_IMAGES = [
  require("../assets/images/mosques/mosque-a-00.jpg"),
  require("../assets/images/mosques/mosque-b-02.jpg"),
  require("../assets/images/mosques/mosque-a-04.jpg"),
  require("../assets/images/mosques/mosque-b-05.jpg"),
  require("../assets/images/mosques/mosque-a-06.jpg"),
  require("../assets/images/mosques/mosque-b-07.jpg"),
  require("../assets/images/mosques/mosque-a-08.jpg"),
  require("../assets/images/home/shortcuts/quran-real.jpg"),
  require("../assets/images/home/home-mosque-sunset.jpg"),
  require("../assets/images/mosques/mosque-coastal.jpg"),
  require("../assets/images/mosques/mosque-a-10.jpg"),
  require("../assets/images/home/shortcuts/qibla-real.jpg"),
] as const;

const WEEKDAYS = {
  fr: ["L", "M", "M", "J", "V", "S", "D"],
  en: ["M", "T", "W", "T", "F", "S", "S"],
} as const;

const PERSONAL_COLOR = "#7FB3D5";

function eventColor(event: IslamicEventDefinition) {
  if (event.kind === "celebration") return "#F1C96E";
  if (event.kind === "recommended-fast") return "#72C694";
  return "#D9A85A";
}

export default function IslamicCalendarScreen() {
  const { language, t } = useI18n();
  const locale = language === "fr" ? "fr-FR" : "en-GB";
  const [settings, setSettings] = useState<CalendarSettings>(
    DEFAULT_CALENDAR_SETTINGS,
  );
  const [tab, setTab] = useState<CalendarTab>("today");
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1, 12),
  );
  const [selectedKey, setSelectedKey] = useState<string>();
  const [showSettings, setShowSettings] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [eventQuery, setEventQuery] = useState("");
  const [prayerSchedule, setPrayerSchedule] = useState<MosquePrayerSchedule>();
  const [prayerPlace, setPrayerPlace] = useState<string>();
  const today = new Date();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const controller = new AbortController();
      void Promise.all([
        loadCalendarSettings(),
        getMainMosque(),
      ]).then(([next, mosque]) => {
        if (!active) return;
        setSettings(next);
        if (!mosque) return;
        setPrayerPlace(mosque.name);
        void getMosquePrayerSchedule(
          mosque.latitude,
          mosque.longitude,
          controller.signal,
        )
          .then((schedule) => active && setPrayerSchedule(schedule))
          .catch(() => undefined);
      });
      return () => {
        active = false;
        controller.abort();
      };
    }, []),
  );

  const updateSettings = (update: Partial<CalendarSettings>) => {
    const next = { ...settings, ...update };
    setSettings(next);
    void saveCalendarSettings(next);
  };

  const hijriToday = getHijriDate(
    today,
    settings.method,
    settings.adjustment,
    settings.country,
  );
  const nextEvent = findNextEvent(
    today,
    settings.method,
    settings.adjustment,
    settings.country,
  );
  const todayEvents = getEventsForDate(hijriToday);
  const fastingToday = isRecommendedFastDay(today, hijriToday);
  const ramadanToday = hijriToday.month === 9;
  const isFriday = today.getDay() === 5;

  const monthDays = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1, 12);
    const mondayOffset = (first.getDay() + 6) % 7;
    const gridStart = addDays(first, -mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = addDays(gridStart, index);
      const hijri = getHijriDate(
        date,
        settings.method,
        settings.adjustment,
        settings.country,
      );
      const events = getEventsForDate(hijri);
      const key = toDateKey(date);
      return {
        date,
        key,
        hijri,
        events,
        currentMonth: date.getMonth() === month.getMonth(),
        today: key === toDateKey(today),
        personal: settings.personalReminders.some(
          (item) => item.dateKey === key,
        ),
      };
    });
  }, [
    month,
    settings.adjustment,
    settings.country,
    settings.method,
    settings.personalReminders,
  ]);

  const upcomingEvents = useMemo(() => {
    const occurrences: {
      event: IslamicEventDefinition;
      date: Date;
      hijriLabel: string;
      days: number;
    }[] = [];
    const seen = new Set<string>();
    for (
      let offset = 0;
      offset <= 390 && occurrences.length < 18;
      offset += 1
    ) {
      const date = addDays(today, offset);
      const hijri = getHijriDate(
        date,
        settings.method,
        settings.adjustment,
        settings.country,
      );
      for (const event of getEventsForDate(hijri)) {
        const occurrenceId = `${event.id}:${hijri.year}:${event.id === "white-days" ? hijri.month : ""}`;
        if (seen.has(occurrenceId)) continue;
        seen.add(occurrenceId);
        occurrences.push({
          event,
          date,
          hijriLabel: formatHijri(hijri),
          days: offset,
        });
      }
    }
    return occurrences.sort(
      (left, right) => left.date.getTime() - right.date.getTime(),
    );
  }, [settings.adjustment, settings.country, settings.method]);

  const visibleUpcomingEvents = upcomingEvents.filter(({ event }) => {
    const query = eventQuery.trim().toLocaleLowerCase(locale);
    const text = localizeEvent(event, language);
    return (
      !query ||
      `${event.title} ${event.summary} ${text.title} ${text.summary}`
        .toLocaleLowerCase(locale)
        .includes(query)
    );
  });

  const selectedDate = selectedKey ? fromDateKey(selectedKey) : undefined;
  const selectedHijri = selectedDate
    ? getHijriDate(
        selectedDate,
        settings.method,
        settings.adjustment,
        settings.country,
      )
    : undefined;
  const selectedEvents = selectedHijri ? getEventsForDate(selectedHijri) : [];
  const selectedReminders = selectedKey
    ? settings.personalReminders.filter((item) => item.dateKey === selectedKey)
    : [];
  const activeEventReminders = Object.entries(settings.eventReminders)
    .map(([id, timing]) => ({
      event: getEventDefinition(id),
      timing,
      occurrence: upcomingEvents.find((item) => item.event.id === id),
    }))
    .filter((item) => Boolean(item.event));

  const shiftMonth = (amount: number) => {
    setMonth(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + amount, 1, 12),
    );
  };
  const swipe = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dx) > 25 &&
        Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -55) shiftMonth(1);
        if (gesture.dx > 55) shiftMonth(-1);
      },
    }),
  ).current;

  const addPersonalReminder = () => {
    const title = reminderTitle.trim();
    if (!selectedKey || !title) return;
    updateSettings({
      personalReminders: [
        ...settings.personalReminders,
        { id: `${selectedKey}:${Date.now()}`, dateKey: selectedKey, title },
      ],
    });
    setReminderTitle("");
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <LinearGradient
        pointerEvents="none"
        colors={["#09070F", "#100C19", "#07060C"]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable accessibilityLabel={t("common.back")} onPress={() => router.back()} style={styles.circleButton}>
            <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>{t("calendar.title")}</Text>
            <Text style={styles.subtitle}>{t("calendar.subtitle")}</Text>
          </View>
          <Pressable
            accessibilityLabel={t("calendar.settingsTitle")}
            onPress={() => setShowSettings(true)}
            style={styles.circleButton}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={colors.goldLight}
            />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Image
            source={MONTH_IMAGES[hijriToday.month - 1]}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[
              "rgba(5,3,10,0.06)",
              "rgba(12,7,20,0.44)",
              "rgba(8,5,14,0.96)",
            ]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroDatePill}>
            <Ionicons name="moon" size={12} color={colors.goldLight} />
            <Text style={styles.heroDatePillText}>
              {t("calendar.estimatedDate")} · {localizedCountryLabel(settings.country, language) ?? ""}
            </Text>
          </View>
          <View style={styles.heroCopy}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(35,20,49,0.42)", "rgba(10,7,16,0.84)"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.heroHijri}>{formatHijri(hijriToday, language)}</Text>
            <Text style={styles.heroGregorian}>{formatGregorian(today, true, language)}</Text>
            <View style={styles.heroDivider} />
            <Text style={styles.heroEvent}>
              {nextEvent
                ? nextEvent.days === 0
                  ? t("calendar.eventToday", { event: localizeEvent(nextEvent.event, language).shortTitle })
                  : t(nextEvent.days > 1 ? "calendar.eventInDays" : "calendar.eventInDay", {
                      event: localizeEvent(nextEvent.event, language).shortTitle,
                      count: nextEvent.days,
                    })
                : t("calendar.upToDate")}
            </Text>
          </View>
        </View>

        <View style={styles.tabs}>
          {(
            [
              ["today", t("calendar.tabToday"), "sunny-outline"],
              ["month", t("calendar.tabMonth"), "calendar-outline"],
              ["events", t("calendar.tabEvents"), "sparkles-outline"],
              ["reminders", t("calendar.tabReminders"), "notifications-outline"],
            ] as const
          ).map(([id, label, icon]) => (
            <Pressable
              key={id}
              onPress={() => setTab(id)}
              style={[styles.tab, tab === id && styles.tabActive]}
            >
              {tab === id ? (
                <LinearGradient
                  pointerEvents="none"
                  colors={["#F5D889", "#D4A449"]}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              <Ionicons
                name={icon}
                size={15}
                color={tab === id ? colors.background : colors.textMuted}
              />
              <Text
                style={[styles.tabText, tab === id && styles.tabTextActive]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === "today" ? (
          <View>
            <SectionTitle title={t("calendar.tabToday")} hint={formatHijri(hijriToday, language)} />
            {todayEvents.length ? (
              todayEvents.map((event) => (
                <EventCard key={event.id} event={event} date={today} days={0} />
              ))
            ) : (
              <View style={styles.calmCard}>
                <Ionicons
                  name="moon-outline"
                  size={23}
                  color={colors.goldLight}
                />
                <View style={styles.calmCopy}>
                  <Text style={styles.calmTitle}>{t("calendar.calmTitle")}</Text>
                  <Text style={styles.calmText}>{t("calendar.calmText")}</Text>
                </View>
              </View>
            )}
            <View style={styles.todayGrid}>
              <TodayCard
                icon="restaurant-outline"
                title={t("calendar.fasting")}
                value={
                  ramadanToday
                    ? t("calendar.fastingRamadan")
                    : fastingToday
                      ? t("calendar.fastingRecommended")
                      : t("calendar.fastingNone")
                }
                active={fastingToday || ramadanToday}
              />
              <TodayCard
                icon="book-outline"
                title={t("calendar.goal")}
                value={
                  isFriday
                    ? t("calendar.goalKahf")
                    : hijriToday.month === 9
                      ? t("calendar.goalRamadan")
                      : t("calendar.goalVerse")
                }
                active
              />
            </View>
            <Pressable
              onPress={() => router.replace("/" as Href)}
              style={styles.prayerCard}
            >
              <View style={styles.prayerIcon}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={colors.goldLight}
                />
              </View>
              <View style={styles.prayerCopy}>
                <Text style={styles.prayerTitle}>{t("calendar.prayersTitle")}</Text>
                <Text style={styles.prayerText}>
                  {prayerSchedule
                    ? t("calendar.prayersAt", { place: prayerPlace ?? t("calendar.yourMosque") })
                    : t("calendar.prayersHint")}
                </Text>
              </View>
              <Ionicons
                name="arrow-forward"
                size={17}
                color={colors.goldLight}
              />
            </Pressable>
            {prayerSchedule ? (
              <View style={styles.prayerTimes}>
                {prayerSchedule.prayers.map((prayer) => (
                  <View key={prayer.key} style={styles.prayerTime}>
                    <Text style={styles.prayerTimeName}>{prayer.label}</Text>
                    <Text style={styles.prayerTimeValue}>{prayer.time}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <View style={styles.spiritualCard}>
              <Text style={styles.spiritualEyebrow}>{t("calendar.lightEyebrow")}</Text>
              <Text style={styles.spiritualQuote}>{t("calendar.lightQuote")}</Text>
              <Text style={styles.spiritualSource}>{t("calendar.lightSource")}</Text>
            </View>
          </View>
        ) : null}

        {tab === "month" ? (
          <View>
            <View style={styles.monthHeader}>
              <Pressable
                accessibilityLabel={t("calendar.previousMonth")}
                onPress={() => shiftMonth(-1)}
                style={styles.monthArrow}
              >
                <Ionicons
                  name="chevron-back"
                  size={19}
                  color={colors.goldLight}
                />
              </Pressable>
              <Pressable
                onPress={() =>
                  setMonth(
                    new Date(today.getFullYear(), today.getMonth(), 1, 12),
                  )
                }
              >
                <Text style={styles.monthTitle}>
                  {new Intl.DateTimeFormat(locale, {
                    month: "long",
                    year: "numeric",
                  }).format(month)}
                </Text>
                <Text style={styles.monthHint}>
                  {t("calendar.monthHint")}
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel={t("calendar.nextMonth")}
                onPress={() => shiftMonth(1)}
                style={styles.monthArrow}
              >
                <Ionicons
                  name="chevron-forward"
                  size={19}
                  color={colors.goldLight}
                />
              </Pressable>
            </View>
            <View style={styles.calendar} {...swipe.panHandlers}>
              <View style={styles.weekRow}>
                {WEEKDAYS[language].map((day, index) => (
                  <Text key={`${day}:${index}`} style={styles.weekday}>
                    {day}
                  </Text>
                ))}
              </View>
              <View style={styles.daysGrid}>
                {monthDays.map((day) => (
                  <Pressable
                    key={day.key}
                    onPress={() => setSelectedKey(day.key)}
                    style={[
                      styles.day,
                      !day.currentMonth && styles.dayOutside,
                      day.today && styles.dayToday,
                    ]}
                  >
                    <Text
                      style={[
                        styles.gregorianDay,
                        day.today && styles.gregorianDayToday,
                      ]}
                    >
                      {day.date.getDate()}
                    </Text>
                    <Text style={styles.hijriDay}>{day.hijri.day}</Text>
                    <View style={styles.dots}>
                      {day.events.slice(0, 2).map((event) => (
                        <View
                          key={event.id}
                          style={[
                            styles.eventDot,
                            { backgroundColor: eventColor(event) },
                          ]}
                        />
                      ))}
                      {day.personal ? (
                        <View style={styles.personalDot} />
                      ) : null}
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.legendRow}>
              <Legend color={colors.goldLight} label={t("calendar.legendEvent")} />
              <Legend color={PERSONAL_COLOR} label={t("calendar.legendPersonal")} />
              <Legend color="#72C694" label={t("calendar.legendFast")} />
            </View>
          </View>
        ) : null}

        {tab === "events" ? (
          <View>
            <SectionTitle title={t("calendar.upcoming")} hint={t("calendar.estimatedDates")} />
            <View style={styles.eventSearch}>
              <Ionicons name="search" size={18} color={colors.goldLight} />
              <TextInput
                value={eventQuery}
                onChangeText={setEventQuery}
                placeholder={t("calendar.searchPlaceholder")}
                placeholderTextColor={colors.textMuted}
                style={styles.eventSearchInput}
              />
              {eventQuery ? (
                <Pressable accessibilityLabel={t("calendar.clearSearch")} onPress={() => setEventQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={17}
                    color={colors.textMuted}
                  />
                </Pressable>
              ) : null}
            </View>
            {visibleUpcomingEvents.map(({ event, date, days }) => (
              <EventCard
                key={`${event.id}:${toDateKey(date)}`}
                event={event}
                date={date}
                days={days}
              />
            ))}
            {!visibleUpcomingEvents.length ? (
              <View style={styles.emptyReminders}>
                <Ionicons
                  name="search-outline"
                  size={22}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyRemindersText}>{t("calendar.noEventMatch")}</Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {tab === "reminders" ? (
          <View>
            <SectionTitle title={t("calendar.smartReminders")} hint={t("calendar.smartRemindersHint")} />
            <ReminderToggle
              icon="moon-outline"
              title={t("calendar.whiteDays")}
              subtitle={t("calendar.whiteDaysText")}
              active={settings.whiteDaysReminder}
              onPress={() =>
                updateSettings({
                  whiteDaysReminder: !settings.whiteDaysReminder,
                })
              }
            />
            <ReminderToggle
              icon="calendar-outline"
              title={t("calendar.everyFriday")}
              subtitle={t("calendar.everyFridayText")}
              active={settings.fridayReminder}
              onPress={() =>
                updateSettings({ fridayReminder: !settings.fridayReminder })
              }
            />
            <ReminderToggle
              icon="restaurant-outline"
              title={t("calendar.mondayThursday")}
              subtitle={t("calendar.mondayThursdayText")}
              active={settings.mondayThursdayReminder}
              onPress={() =>
                updateSettings({
                  mondayThursdayReminder: !settings.mondayThursdayReminder,
                })
              }
            />
            <SectionTitle
              title={t("calendar.myReminders")}
              hint={t(
                settings.personalReminders.length + activeEventReminders.length > 1
                  ? "calendar.scheduledMany"
                  : "calendar.scheduledOne",
                { count: settings.personalReminders.length + activeEventReminders.length },
              )}
            />
            {activeEventReminders.map(({ event, timing, occurrence }) =>
              event ? (
                <Pressable
                  key={event.id}
                  onPress={() =>
                    router.push(
                      `/calendar/event/${event.id}${occurrence ? `?date=${toDateKey(occurrence.date)}` : ""}` as Href,
                    )
                  }
                  style={styles.personalReminder}
                >
                  <View style={styles.personalReminderDate}>
                    <Ionicons
                      name="notifications"
                      size={18}
                      color={colors.goldLight}
                    />
                  </View>
                  <View style={styles.personalReminderCopy}>
                    <Text style={styles.personalReminderTitle}>
                      {localizeEvent(event, language).shortTitle}
                    </Text>
                    <Text style={styles.personalReminderMeta}>
                      {timing === "three-days"
                        ? t("calendar.timingThreeDays")
                        : timing === "eve"
                          ? t("calendar.timingEve")
                          : t("calendar.timingMorning")}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.goldLight}
                  />
                </Pressable>
              ) : null,
            )}
            {settings.personalReminders.length ? (
              [...settings.personalReminders]
                .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
                .map((reminder) => (
                  <View key={reminder.id} style={styles.personalReminder}>
                    <View style={styles.personalReminderDate}>
                      <Text style={styles.personalReminderDay}>
                        {fromDateKey(reminder.dateKey).getDate()}
                      </Text>
                      <Text style={styles.personalReminderMonth}>
                        {new Intl.DateTimeFormat(locale, {
                          month: "short",
                        }).format(fromDateKey(reminder.dateKey))}
                      </Text>
                    </View>
                    <View style={styles.personalReminderCopy}>
                      <Text style={styles.personalReminderTitle}>
                        {reminder.title}
                      </Text>
                      <Text style={styles.personalReminderMeta}>
                        {formatGregorian(fromDateKey(reminder.dateKey), false, language)}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityLabel={t("calendar.deleteReminder")}
                      onPress={() =>
                        updateSettings({
                          personalReminders: settings.personalReminders.filter(
                            (item) => item.id !== reminder.id,
                          ),
                        })
                      }
                      style={styles.deleteReminder}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color={colors.textMuted}
                      />
                    </Pressable>
                  </View>
                ))
            ) : activeEventReminders.length ? null : (
              <View style={styles.emptyReminders}>
                <Ionicons
                  name="notifications-off-outline"
                  size={22}
                  color={colors.textMuted}
                />
                <Text style={styles.emptyRemindersText}>{t("calendar.noReminders")}</Text>
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>

      <Modal
        visible={Boolean(selectedDate)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedKey(undefined)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.daySheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>
                  {selectedDate ? formatGregorian(selectedDate, true, language) : ""}
                </Text>
                <Text style={styles.sheetHijri}>
                  {selectedHijri ? formatHijri(selectedHijri, language) : ""}
                </Text>
              </View>
              <Pressable
                accessibilityLabel={t("hifz.session.close")}
                onPress={() => setSelectedKey(undefined)}
                style={styles.sheetClose}
              >
                <Ionicons name="close" size={19} color={colors.goldLight} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedEvents.length ? (
                selectedEvents.map((event) => (
                  <Pressable
                    key={event.id}
                    onPress={() =>
                      router.push(
                        `/calendar/event/${event.id}?date=${selectedKey}` as Href,
                      )
                    }
                    style={styles.sheetEvent}
                  >
                    <View
                      style={[
                        styles.sheetEventDot,
                        { backgroundColor: eventColor(event) },
                      ]}
                    />
                    <View style={styles.sheetEventCopy}>
                      <Text style={styles.sheetEventTitle}>
                        {localizeEvent(event, language).shortTitle}
                      </Text>
                      <Text style={styles.sheetEventText}>
                        {event.kind === "recommended-fast"
                          ? t("calendar.kindFast")
                          : event.kind === "celebration"
                            ? t("calendar.kindCelebration")
                            : t("calendar.kindPeriod")}
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.goldLight}
                    />
                  </Pressable>
                ))
              ) : (
                <View style={styles.sheetEmpty}>
                  <Ionicons
                    name="leaf-outline"
                    size={17}
                    color={colors.goldLight}
                  />
                  <Text style={styles.sheetEmptyText}>{t("calendar.noEventDay")}</Text>
                </View>
              )}
              {selectedReminders.map((reminder) => (
                <View key={reminder.id} style={styles.sheetReminder}>
                  <Ionicons name="notifications" size={16} color={PERSONAL_COLOR} />
                  <Text style={styles.sheetReminderText}>{reminder.title}</Text>
                </View>
              ))}
              <Text style={styles.addTitle}>{t("calendar.addReminder")}</Text>
              <View style={styles.addRow}>
                <TextInput
                  value={reminderTitle}
                  onChangeText={setReminderTitle}
                  placeholder={t("calendar.addReminderPlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  style={styles.addInput}
                />
                <Pressable
                  accessibilityLabel={t("calendar.addReminder")}
                  onPress={addPersonalReminder}
                  style={[
                    styles.addButton,
                    !reminderTitle.trim() && styles.disabled,
                  ]}
                >
                  <Ionicons name="add" size={19} color={colors.background} />
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.settingsBackdrop}>
          <View style={styles.settingsCard}>
            <View style={styles.settingsHeader}>
              <View>
                <Text style={styles.settingsTitle}>{t("calendar.settingsTitle")}</Text>
                <Text style={styles.settingsSubtitle}>{t("calendar.settingsSubtitle")}</Text>
              </View>
              <Pressable
                accessibilityLabel={t("hifz.session.close")}
                onPress={() => setShowSettings(false)}
                style={styles.sheetClose}
              >
                <Ionicons name="close" size={19} color={colors.goldLight} />
              </Pressable>
            </View>
            {(
              [
                ["country", t("calendar.methodCountry"), t("calendar.methodCountryText")],
                ["astronomical", t("calendar.methodAstronomical"), t("calendar.methodAstronomicalText")],
                ["manual", t("calendar.methodManual"), t("calendar.methodManualText")],
              ] as const
            ).map(([id, label, subtitle]) => (
              <Pressable
                key={id}
                onPress={() => updateSettings({ method: id })}
                style={[
                  styles.method,
                  settings.method === id && styles.methodActive,
                ]}
              >
                <View
                  style={[
                    styles.radio,
                    settings.method === id && styles.radioActive,
                  ]}
                >
                  {settings.method === id ? (
                    <View style={styles.radioCore} />
                  ) : null}
                </View>
                <View style={styles.methodCopy}>
                  <Text style={styles.methodTitle}>{label}</Text>
                  <Text style={styles.methodSubtitle}>{subtitle}</Text>
                </View>
              </Pressable>
            ))}
            <Text style={styles.adjustTitle}>{t("calendar.referenceCountry")}</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.countryRow}
            >
              {CALENDAR_COUNTRIES.map((country) => (
                <Pressable
                  key={country.id}
                  onPress={() =>
                    updateSettings({ country: country.id, method: "country" })
                  }
                  style={[
                    styles.country,
                    settings.country === country.id && styles.countryActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.countryText,
                      settings.country === country.id &&
                        styles.countryTextActive,
                    ]}
                  >
                    {language === "fr" ? country.label : country.labelEn}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.adjustTitle}>{t("calendar.localAdjustment")}</Text>
            <View style={styles.adjustRow}>
              {([-1, 0, 1] as const).map((value) => (
                <Pressable
                  key={value}
                  onPress={() =>
                    updateSettings({
                      adjustment: value,
                      method: value === 0 ? settings.method : "manual",
                    })
                  }
                  style={[
                    styles.adjust,
                    settings.adjustment === value && styles.adjustActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.adjustText,
                      settings.adjustment === value && styles.adjustTextActive,
                    ]}
                  >
                    {value === -1
                      ? t("calendar.minusDay")
                      : value === 1
                        ? t("calendar.plusDay")
                        : t("calendar.automatic")}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.forecastNotice}>
              <Ionicons
                name="moon-outline"
                size={16}
                color={colors.goldLight}
              />
              <Text style={styles.forecastText}>{t("calendar.forecastNotice")}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SectionTitle({ title, hint }: { title: string; hint: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionHint}>{hint}</Text>
    </View>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}
function TodayCard({
  icon,
  title,
  value,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  active?: boolean;
}) {
  return (
    <View style={[styles.todayCard, active && styles.todayCardActive]}>
      <Ionicons
        name={icon}
        size={19}
        color={active ? colors.goldLight : colors.textMuted}
      />
      <Text style={styles.todayCardTitle}>{title}</Text>
      <Text style={styles.todayCardValue}>{value}</Text>
    </View>
  );
}
function EventCard({
  event,
  date,
  days,
}: {
  event: IslamicEventDefinition;
  date: Date;
  days: number;
}) {
  const { language, t } = useI18n();
  return (
    <Pressable
      onPress={() =>
        router.push(
          `/calendar/event/${event.id}?date=${toDateKey(date)}` as Href,
        )
      }
      style={styles.eventCard}
    >
      <View style={[styles.eventDate, { borderColor: eventColor(event) }]}>
        <Text style={[styles.eventDay, { color: eventColor(event) }]}>
          {date.getDate()}
        </Text>
        <Text style={styles.eventMonth}>
          {new Intl.DateTimeFormat(language === "fr" ? "fr-FR" : "en-GB", { month: "short" }).format(date)}
        </Text>
      </View>
      <View style={styles.eventCopy}>
        <View style={styles.eventLabelRow}>
          <View
            style={[
              styles.eventKindDot,
              { backgroundColor: eventColor(event) },
            ]}
          />
          <Text style={styles.eventKind}>
            {event.kind === "recommended-fast"
              ? t("calendar.kindFastUpper")
              : event.kind === "celebration"
                ? t("calendar.kindCelebrationUpper")
                : t("calendar.kindPeriodUpper")}
          </Text>
        </View>
        <Text style={styles.eventTitle}>{localizeEvent(event, language).shortTitle}</Text>
        <Text style={styles.eventMeta}>
          {days === 0
            ? t("calendar.tabToday")
            : t(days > 1 ? "calendar.inDays" : "calendar.inDay", { count: days })}
          {" · "}
          {t("calendar.estimatedDateLower")}
        </Text>
      </View>
      <Ionicons name="arrow-forward" size={17} color={colors.goldLight} />
    </Pressable>
  );
}
function ReminderToggle({
  icon,
  title,
  subtitle,
  active,
  onPress,
  compact,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  active: boolean;
  onPress: () => void;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.reminderToggle, compact && styles.reminderToggleCompact]}
    >
      <View style={styles.reminderIcon}>
        <Ionicons
          name={icon}
          size={18}
          color={active ? colors.goldLight : colors.textMuted}
        />
      </View>
      <View style={styles.reminderCopy}>
        <Text style={styles.reminderTitle}>{title}</Text>
        <Text style={styles.reminderSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.switch, active && styles.switchActive]}>
        <View style={[styles.switchKnob, active && styles.switchKnobActive]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#08050D" },
  content: { paddingHorizontal: 15, paddingBottom: 140 },
  header: { height: 72, flexDirection: "row", alignItems: "center" },
  circleButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(243,211,135,0.38)",
    backgroundColor: "rgba(30,23,48,0.86)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.42,
    shadowRadius: 11,
    elevation: 8,
  },
  headerCopy: { flex: 1, marginLeft: 12 },
  title: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 30,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  hero: {
    height: 286,
    overflow: "hidden",
    borderRadius: 31,
    borderWidth: 1.25,
    borderColor: "rgba(245,211,130,0.58)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.52,
    shadowRadius: 22,
    elevation: 16,
  },
  heroDatePill: {
    position: "absolute",
    top: 13,
    left: 13,
    height: 28,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "rgba(10,7,17,0.62)",
  },
  heroDatePillText: {
    marginLeft: 5,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  heroCopy: {
    position: "absolute",
    right: 13,
    bottom: 13,
    left: 13,
    paddingHorizontal: 15,
    paddingVertical: 14,
    overflow: "hidden",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(255,242,211,0.24)",
  },
  heroHijri: {
    color: "#FFF8EA",
    fontFamily: typography.serifSemibold,
    fontSize: 33,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  heroGregorian: {
    marginTop: 2,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
  },
  heroDivider: {
    width: 38,
    height: 2,
    marginVertical: 12,
    borderRadius: 2,
    backgroundColor: colors.goldLight,
  },
  heroEvent: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 20,
  },
  tabs: {
    height: 78,
    marginTop: 12,
    padding: 6,
    flexDirection: "row",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,238,204,0.18)",
    backgroundColor: "rgba(31,18,44,0.86)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 10,
  },
  tab: {
    flex: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
  },
  tabActive: {
    borderWidth: 1,
    borderColor: "rgba(255,250,226,0.70)",
    shadowColor: colors.goldLight,
    shadowOpacity: 0.42,
    shadowRadius: 9,
    elevation: 7,
  },
  tabText: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: "800",
  },
  tabTextActive: { color: colors.background },
  sectionHeader: {
    marginTop: 23,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 25,
  },
  sectionHint: {
    marginBottom: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
  },
  calmCard: {
    minHeight: 85,
    marginTop: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(229,191,105,0.27)",
    backgroundColor: "rgba(39,23,53,0.80)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 9,
  },
  calmCopy: { flex: 1, marginLeft: 12 },
  calmTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  calmText: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
    lineHeight: 16,
  },
  todayGrid: { marginTop: 9, flexDirection: "row", gap: 8 },
  todayCard: {
    flex: 1,
    minHeight: 112,
    padding: 13,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(26,17,37,0.86)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 9,
  },
  todayCardActive: { borderColor: "rgba(232,194,105,0.31)" },
  todayCardTitle: {
    marginTop: 9,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "800",
  },
  todayCardValue: {
    marginTop: 5,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
    lineHeight: 21,
  },
  prayerCard: {
    minHeight: 76,
    marginTop: 9,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(32,19,45,0.82)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 9,
  },
  prayerIcon: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    backgroundColor: "rgba(30,23,48,0.60)",
  },
  prayerCopy: { flex: 1, marginHorizontal: 10 },
  prayerTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  prayerText: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
    lineHeight: 15,
  },
  prayerTimes: {
    marginTop: 7,
    padding: 9,
    flexDirection: "row",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(26,16,38,0.78)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 9,
  },
  prayerTime: { flex: 1, alignItems: "center" },
  prayerTimeName: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
  },
  prayerTimeValue: {
    marginTop: 3,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 15,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  spiritualCard: {
    marginTop: 9,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(232,194,105,0.28)",
    backgroundColor: "rgba(30,23,48,0.50)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 9,
  },
  spiritualEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1,
  },
  spiritualQuote: {
    marginTop: 8,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 19,
    lineHeight: 26,
  },
  spiritualSource: {
    marginTop: 7,
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
  },
  monthHeader: {
    marginTop: 23,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  monthArrow: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  monthTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 24,
    textAlign: "center",
    textTransform: "capitalize",
  },
  monthHint: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
    textAlign: "center",
  },
  calendar: {
    marginTop: 12,
    padding: 12,
    borderRadius: 27,
    borderWidth: 1.25,
    borderColor: "rgba(240,207,128,0.30)",
    backgroundColor: "rgba(28,17,41,0.91)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.40,
    shadowRadius: 18,
    elevation: 12,
  },
  weekRow: { height: 34, flexDirection: "row", alignItems: "center" },
  weekday: {
    width: "14.285%",
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "900",
    textAlign: "center",
  },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  day: {
    width: "14.285%",
    height: 66,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
  },
  dayOutside: { opacity: 0.28 },
  dayToday: {
    borderWidth: 1.5,
    borderColor: colors.goldLight,
    backgroundColor: "rgba(30,23,48,0.78)",
    shadowColor: colors.goldLight,
    shadowOpacity: 0.34,
    shadowRadius: 8,
    elevation: 6,
  },
  gregorianDay: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 18,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  gregorianDayToday: { color: colors.goldLight },
  hijriDay: {
    marginTop: -1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  dots: {
    height: 6,
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  eventDot: { width: 4, height: 4, borderRadius: 2 },
  personalDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: PERSONAL_COLOR,
  },
  legendRow: {
    marginTop: 9,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  legend: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: {
    marginLeft: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
  },
  eventCard: {
    minHeight: 98,
    marginTop: 9,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(29,18,41,0.88)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 9,
  },
  eventSearch: {
    height: 48,
    marginTop: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(29,18,41,0.88)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 9,
  },
  eventSearchInput: {
    flex: 1,
    marginHorizontal: 9,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  eventDate: {
    width: 51,
    height: 59,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    backgroundColor: "rgba(8,6,14,0.35)",
  },
  eventDay: { fontFamily: typography.serifSemibold, fontSize: 26, fontVariant: ["lining-nums", "tabular-nums"] },
  eventMonth: {
    marginTop: -2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
    textTransform: "uppercase",
  },
  eventCopy: { flex: 1, marginHorizontal: 11 },
  eventLabelRow: { flexDirection: "row", alignItems: "center" },
  eventKindDot: { width: 5, height: 5, borderRadius: 3 },
  eventKind: {
    marginLeft: 5,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  eventTitle: {
    marginTop: 5,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 19,
  },
  eventMeta: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
  },
  reminderToggle: {
    minHeight: 72,
    marginTop: 9,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(29,18,41,0.86)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 9,
  },
  reminderToggleCompact: { marginTop: 14 },
  reminderIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(30,23,48,0.52)",
  },
  reminderCopy: { flex: 1, marginLeft: 10 },
  reminderTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  reminderSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
  },
  switch: {
    width: 41,
    height: 24,
    padding: 3,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  switchActive: { backgroundColor: colors.goldLight },
  switchKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.textMuted,
  },
  switchKnobActive: { marginLeft: 17, backgroundColor: colors.background },
  personalReminder: {
    minHeight: 67,
    marginTop: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(31,19,44,0.86)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 9,
  },
  personalReminderDate: {
    width: 43,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "rgba(30,23,48,0.63)",
  },
  personalReminderDay: {
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 21,
    fontVariant: ["lining-nums", "tabular-nums"],
  },
  personalReminderMonth: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
    textTransform: "uppercase",
  },
  personalReminderCopy: { flex: 1, marginLeft: 10 },
  personalReminderTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  personalReminderMeta: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
  },
  deleteReminder: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyReminders: {
    minHeight: 100,
    marginTop: 9,
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.borderSoft,
  },
  emptyRemindersText: {
    marginTop: 8,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
    lineHeight: 16,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(2,1,5,0.74)",
  },
  daySheet: {
    maxHeight: "72%",
    paddingHorizontal: 16,
    paddingBottom: 28,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(232,194,105,0.32)",
    backgroundColor: "#140C1E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 9,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    marginTop: 9,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  sheetHeader: {
    paddingVertical: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 24,
    textTransform: "capitalize",
  },
  sheetHijri: {
    marginTop: 2,
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  sheetClose: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  sheetEvent: {
    minHeight: 66,
    marginBottom: 8,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(30,23,48,0.74)",
  },
  sheetEventDot: { width: 9, height: 9, borderRadius: 5 },
  sheetEventCopy: { flex: 1, marginLeft: 10 },
  sheetEventTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  sheetEventText: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
  },
  sheetEmpty: {
    height: 55,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  sheetEmptyText: {
    marginLeft: 8,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
  },
  sheetReminder: {
    height: 48,
    marginTop: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "rgba(30,23,48,0.30)",
  },
  sheetReminderText: {
    marginLeft: 8,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  addTitle: {
    marginTop: 18,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 19,
  },
  addRow: { height: 46, marginTop: 8, flexDirection: "row", gap: 7 },
  addInput: {
    flex: 1,
    paddingHorizontal: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 11,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  addButton: {
    width: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: colors.goldLight,
  },
  disabled: { opacity: 0.4 },
  settingsBackdrop: {
    flex: 1,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,1,5,0.82)",
  },
  settingsCard: {
    width: "100%",
    maxWidth: 410,
    padding: 17,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(232,194,105,0.34)",
    backgroundColor: "#180F22",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 9,
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingsTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 26,
  },
  settingsSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
  },
  method: {
    minHeight: 61,
    marginTop: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  methodActive: {
    borderColor: "rgba(232,194,105,0.48)",
    backgroundColor: "rgba(30,23,48,0.48)",
  },
  radio: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.textMuted,
  },
  radioActive: { borderColor: colors.goldLight },
  radioCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.goldLight,
  },
  methodCopy: { marginLeft: 10 },
  methodTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 16,
  },
  methodSubtitle: {
    marginTop: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
  },
  adjustTitle: {
    marginTop: 16,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 19,
  },
  countryRow: { paddingTop: 8, paddingRight: 8, gap: 6 },
  country: {
    height: 35,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(30,23,48,0.52)",
  },
  countryActive: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  countryText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "800",
  },
  countryTextActive: { color: colors.background },
  adjustRow: { height: 39, marginTop: 7, flexDirection: "row", gap: 6 },
  adjust: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  adjustActive: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  adjustText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "800",
  },
  adjustTextActive: { color: colors.background },
  forecastNotice: {
    minHeight: 50,
    marginTop: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "rgba(232,194,105,0.08)",
  },
  forecastText: {
    flex: 1,
    marginLeft: 8,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    lineHeight: 14,
  },
});
