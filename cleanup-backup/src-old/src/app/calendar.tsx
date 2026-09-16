import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
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
  findNextEvent,
  formatGregorian,
  formatHijri,
  fromDateKey,
  getEventsForDate,
  getEventDefinition,
  getHijriDate,
  isRecommendedFastDay,
  toDateKey,
  type IslamicEventDefinition,
} from "../features/calendar/IslamicCalendar";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import {
  getMosquePrayerSchedule,
  type MosquePrayerSchedule,
} from "../features/mosques/data/mosquePrayerTimes";
import { getMainMosque } from "../features/mosques/data/mosquePreferences";
import {
  dateKey,
  loadHifzState,
  type HifzState,
} from "../features/hifz/HifzStore";

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

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function eventColor(event: IslamicEventDefinition) {
  if (event.kind === "celebration") return "#F1C96E";
  if (event.kind === "recommended-fast") return "#72C694";
  return "#D9A85A";
}

export default function IslamicCalendarScreen() {
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
  const [hifzState, setHifzState] = useState<HifzState>();
  const today = new Date();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const controller = new AbortController();
      void Promise.all([
        loadCalendarSettings(),
        loadHifzState(),
        getMainMosque(),
      ]).then(([next, hifz, mosque]) => {
        if (!active) return;
        setSettings(next);
        setHifzState(hifz);
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
  const countryLabel =
    CALENDAR_COUNTRIES.find((country) => country.id === settings.country)
      ?.label ?? "Votre pays";
  const todayEvents = getEventsForDate(hijriToday);
  const fastingToday = isRecommendedFastDay(today, hijriToday);
  const isFriday = today.getDay() === 5;
  const todayHifz = hifzState?.sessions.find(
    (session) => session.date === dateKey(today),
  );

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
    const query = eventQuery.trim().toLocaleLowerCase("fr-FR");
    return (
      !query ||
      `${event.title} ${event.summary}`
        .toLocaleLowerCase("fr-FR")
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
        colors={["#09060F", "#140C20", "#07050C"]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.ambientGlowTop} />
      <View pointerEvents="none" style={styles.ambientGlowMiddle} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.circleButton}>
            <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Calendrier</Text>
            <Text style={styles.subtitle}>Votre année spirituelle</Text>
          </View>
          <Pressable
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
            <Text style={styles.heroDatePillText}>DATE PRÉVISIONNELLE</Text>
          </View>
          <View style={styles.heroCopy}>
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(35,20,49,0.42)", "rgba(10,7,16,0.84)"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.heroHijri}>{formatHijri(hijriToday)}</Text>
            <Text style={styles.heroGregorian}>{formatGregorian(today)}</Text>
            <View style={styles.heroDivider} />
            <Text style={styles.heroEvent}>
              {nextEvent
                ? `${nextEvent.event.shortTitle} ${nextEvent.days === 0 ? "est aujourd’hui" : `approche dans ${nextEvent.days} jour${nextEvent.days > 1 ? "s" : ""}`}`
                : "Votre calendrier est à jour"}
            </Text>
          </View>
        </View>

        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <View style={styles.summaryIcon}>
              <Ionicons name="moon-outline" size={17} color={colors.goldLight} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryLabel}>MOIS HÉGIRIEN</Text>
              <Text numberOfLines={1} style={styles.summaryValue}>
                {hijriToday.monthName}
              </Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <View style={styles.summaryIcon}>
              <Ionicons name="sparkles-outline" size={17} color={colors.goldLight} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryLabel}>PROCHAIN TEMPS FORT</Text>
              <Text numberOfLines={1} style={styles.summaryValue}>
                {nextEvent?.event.shortTitle ?? "À venir"}
              </Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <Pressable onPress={() => setShowSettings(true)} style={styles.summaryItem}>
            <View style={styles.summaryIcon}>
              <Ionicons name="location-outline" size={17} color={colors.goldLight} />
            </View>
            <View style={styles.summaryCopy}>
              <Text style={styles.summaryLabel}>RÉFÉRENCE</Text>
              <Text numberOfLines={1} style={styles.summaryValue}>
                {countryLabel}
              </Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.tabs}>
          {(
            [
              ["today", "Aujourd’hui", "sunny-outline"],
              ["month", "Mois", "calendar-outline"],
              ["events", "Événements", "sparkles-outline"],
              ["reminders", "Rappels", "notifications-outline"],
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
            <SectionTitle title="Aujourd’hui" hint={formatHijri(hijriToday)} />
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
                  <Text style={styles.calmTitle}>
                    Une journée à faire grandir
                  </Text>
                  <Text style={styles.calmText}>
                    Aucun événement majeur aujourd’hui. Les œuvres régulières,
                    même petites, restent précieuses.
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.todayGrid}>
              <TodayCard
                icon="restaurant-outline"
                title="Jeûne"
                value={
                  fastingToday
                    ? "Recommandé aujourd’hui"
                    : "Pas de jeûne particulier"
                }
                active={fastingToday}
              />
              <TodayCard
                icon="book-outline"
                title="Objectif"
                value={
                  isFriday
                    ? "Lire sourate Al-Kahf"
                    : hijriToday.month === 9
                      ? "Lire votre portion du Coran"
                      : "Un verset médité avec attention"
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
                <Text style={styles.prayerTitle}>Prières du jour</Text>
                <Text style={styles.prayerText}>
                  {prayerSchedule
                    ? `${prayerPlace ?? "Votre mosquée"} · horaires du jour`
                    : "Retrouvez vos horaires exacts et la prochaine prière sur l’accueil."}
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
            <View style={styles.progressCard}>
              <View style={styles.progressIcon}>
                <Ionicons
                  name="trending-up-outline"
                  size={19}
                  color={colors.goldLight}
                />
              </View>
              <View style={styles.progressCopy}>
                <Text style={styles.progressTitle}>
                  Votre progression aujourd’hui
                </Text>
                <Text style={styles.progressText}>
                  {todayHifz
                    ? `${todayHifz.learned} verset${todayHifz.learned > 1 ? "s" : ""} appris · ${todayHifz.reviewed} révisé${todayHifz.reviewed > 1 ? "s" : ""} · ${todayHifz.minutes} min`
                    : "Votre prochaine petite action peut commencer maintenant."}
                </Text>
              </View>
              <Text style={styles.progressStreak}>
                {hifzState?.streak ?? 0} j
              </Text>
            </View>
            <View style={styles.spiritualCard}>
              <Text style={styles.spiritualEyebrow}>LUMIÈRE DU JOUR</Text>
              <Text style={styles.spiritualQuote}>
                « Allah veut pour vous la facilité, Il ne veut pas la difficulté
                pour vous. »
              </Text>
              <Text style={styles.spiritualSource}>Coran · 2:185</Text>
            </View>
          </View>
        ) : null}

        {tab === "month" ? (
          <View>
            <View style={styles.monthHeader}>
              <Pressable
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
                  {new Intl.DateTimeFormat("fr-FR", {
                    month: "long",
                    year: "numeric",
                  }).format(month)}
                </Text>
                <Text style={styles.monthHint}>
                  Glissez · touchez pour revenir à aujourd’hui
                </Text>
              </Pressable>
              <Pressable
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
                {WEEKDAYS.map((day, index) => (
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
              <Legend color={colors.goldLight} label="événement" />
              <Legend color="#A66AC4" label="rappel personnel" />
              <Legend color="#72C694" label="jeûne recommandé" />
            </View>
          </View>
        ) : null}

        {tab === "events" ? (
          <View>
            <SectionTitle title="À venir" hint="dates prévisionnelles" />
            <View style={styles.eventSearch}>
              <Ionicons name="search" size={18} color={colors.goldLight} />
              <TextInput
                value={eventQuery}
                onChangeText={setEventQuery}
                placeholder="Rechercher Ramadan, jeûne, Aïd…"
                placeholderTextColor={colors.textMuted}
                style={styles.eventSearchInput}
              />
              {eventQuery ? (
                <Pressable onPress={() => setEventQuery("")}>
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
                <Text style={styles.emptyRemindersText}>
                  Aucun événement ne correspond à cette recherche.
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {tab === "reminders" ? (
          <View>
            <SectionTitle
              title="Rappels intelligents"
              hint="discrets et locaux"
            />
            <ReminderToggle
              icon="moon-outline"
              title="Jours blancs"
              subtitle="La veille des 13, 14 et 15"
              active={settings.whiteDaysReminder}
              onPress={() =>
                updateSettings({
                  whiteDaysReminder: !settings.whiteDaysReminder,
                })
              }
            />
            <ReminderToggle
              icon="calendar-outline"
              title="Chaque vendredi"
              subtitle="Lecture de sourate Al-Kahf"
              active={settings.fridayReminder}
              onPress={() =>
                updateSettings({ fridayReminder: !settings.fridayReminder })
              }
            />
            <ReminderToggle
              icon="restaurant-outline"
              title="Lundi et jeudi"
              subtitle="Rappel du jeûne recommandé"
              active={settings.mondayThursdayReminder}
              onPress={() =>
                updateSettings({
                  mondayThursdayReminder: !settings.mondayThursdayReminder,
                })
              }
            />
            <SectionTitle
              title="Mes rappels"
              hint={`${settings.personalReminders.length + activeEventReminders.length} programmé${settings.personalReminders.length + activeEventReminders.length > 1 ? "s" : ""}`}
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
                      {event.shortTitle}
                    </Text>
                    <Text style={styles.personalReminderMeta}>
                      {timing === "three-days"
                        ? "3 jours avant"
                        : timing === "eve"
                          ? "La veille"
                          : "Le matin même"}
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
                        {new Intl.DateTimeFormat("fr-FR", {
                          month: "short",
                        }).format(fromDateKey(reminder.dateKey))}
                      </Text>
                    </View>
                    <View style={styles.personalReminderCopy}>
                      <Text style={styles.personalReminderTitle}>
                        {reminder.title}
                      </Text>
                      <Text style={styles.personalReminderMeta}>
                        {formatGregorian(fromDateKey(reminder.dateKey), false)}
                      </Text>
                    </View>
                    <Pressable
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
                <Text style={styles.emptyRemindersText}>
                  Touchez un jour dans la vue Mois pour créer votre premier
                  rappel personnel.
                </Text>
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
                  {selectedDate ? formatGregorian(selectedDate) : ""}
                </Text>
                <Text style={styles.sheetHijri}>
                  {selectedHijri ? formatHijri(selectedHijri) : ""}
                </Text>
              </View>
              <Pressable
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
                        {event.shortTitle}
                      </Text>
                      <Text style={styles.sheetEventText}>
                        {event.kind === "recommended-fast"
                          ? "Jeûne recommandé"
                          : event.kind === "celebration"
                            ? "Fête islamique"
                            : "Période importante"}
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
                  <Text style={styles.sheetEmptyText}>
                    Aucun événement religieux majeur ce jour.
                  </Text>
                </View>
              )}
              {selectedReminders.map((reminder) => (
                <View key={reminder.id} style={styles.sheetReminder}>
                  <Ionicons name="notifications" size={16} color="#B77BD3" />
                  <Text style={styles.sheetReminderText}>{reminder.title}</Text>
                </View>
              ))}
              <Text style={styles.addTitle}>Ajouter un rappel personnel</Text>
              <View style={styles.addRow}>
                <TextInput
                  value={reminderTitle}
                  onChangeText={setReminderTitle}
                  placeholder="Ex. Réviser Al-Mulk"
                  placeholderTextColor={colors.textMuted}
                  style={styles.addInput}
                />
                <Pressable
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
                <Text style={styles.settingsTitle}>Date hégirienne</Text>
                <Text style={styles.settingsSubtitle}>
                  Choisissez la méthode adaptée à votre situation.
                </Text>
              </View>
              <Pressable
                onPress={() => setShowSettings(false)}
                style={styles.sheetClose}
              >
                <Ionicons name="close" size={19} color={colors.goldLight} />
              </Pressable>
            </View>
            {(
              [
                [
                  "country",
                  "Selon mon pays",
                  "Référence locale prévisionnelle",
                ],
                [
                  "astronomical",
                  "Calcul astronomique",
                  "Calendrier civil calculé",
                ],
                [
                  "manual",
                  "Ajustement manuel",
                  "Décalage conservé sur cet appareil",
                ],
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
            <Text style={styles.adjustTitle}>Pays de référence</Text>
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
                    {country.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.adjustTitle}>Ajustement local</Text>
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
                      ? "−1 jour"
                      : value === 1
                        ? "+1 jour"
                        : "Automatique"}
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
              <Text style={styles.forecastText}>
                Les grandes fêtes restent prévisionnelles jusqu’à l’annonce
                officielle de votre pays.
              </Text>
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
          {new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date)}
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
              ? "JEÛNE RECOMMANDÉ"
              : event.kind === "celebration"
                ? "FÊTE"
                : "PÉRIODE IMPORTANTE"}
          </Text>
        </View>
        <Text style={styles.eventTitle}>{event.shortTitle}</Text>
        <Text style={styles.eventMeta}>
          {days === 0
            ? "Aujourd’hui"
            : `Dans ${days} jour${days > 1 ? "s" : ""}`}{" "}
          · date prévisionnelle
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
  ambientGlowTop: {
    position: "absolute",
    top: -130,
    right: -110,
    width: 310,
    height: 310,
    borderRadius: 155,
    backgroundColor: "rgba(112,61,139,0.20)",
  },
  ambientGlowMiddle: {
    position: "absolute",
    top: 500,
    left: -150,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: "rgba(217,165,72,0.07)",
  },
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
    backgroundColor: "rgba(48,27,63,0.86)",
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
  summaryStrip: {
    minHeight: 88,
    marginTop: 12,
    paddingHorizontal: 8,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(240,207,128,0.24)",
    backgroundColor: "rgba(38,22,52,0.78)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.33,
    shadowRadius: 14,
    elevation: 9,
  },
  summaryItem: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  summaryIcon: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(241,208,128,0.24)",
    backgroundColor: "rgba(91,48,108,0.48)",
  },
  summaryCopy: { flex: 1, minWidth: 0, marginLeft: 7 },
  summaryLabel: {
    color: colors.goldMuted,
    fontFamily: typography.sans,
    fontSize: 8.5,
    fontWeight: "900",
    letterSpacing: 0.45,
  },
  summaryValue: {
    marginTop: 3,
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 13,
  },
  summaryDivider: {
    width: 1,
    height: 44,
    marginHorizontal: 5,
    backgroundColor: "rgba(255,255,255,0.10)",
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
    backgroundColor: "rgba(83,43,101,0.60)",
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
  },
  progressCard: {
    minHeight: 72,
    marginTop: 9,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(232,194,105,0.24)",
    backgroundColor: "rgba(38,22,51,0.82)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 9 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 9,
  },
  progressIcon: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(84,43,102,0.56)",
  },
  progressCopy: { flex: 1, marginHorizontal: 9 },
  progressTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  progressText: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    lineHeight: 14,
  },
  progressStreak: {
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 18,
  },
  spiritualCard: {
    marginTop: 9,
    padding: 16,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(232,194,105,0.28)",
    backgroundColor: "rgba(68,35,82,0.50)",
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
    backgroundColor: "rgba(100,53,118,0.78)",
    shadowColor: colors.goldLight,
    shadowOpacity: 0.34,
    shadowRadius: 8,
    elevation: 6,
  },
  gregorianDay: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 18,
  },
  gregorianDayToday: { color: colors.goldLight },
  hijriDay: {
    marginTop: -1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
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
    backgroundColor: "#A66AC4",
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
  eventDay: { fontFamily: typography.serifSemibold, fontSize: 26 },
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
    backgroundColor: "rgba(78,41,95,0.52)",
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
    backgroundColor: "rgba(84,43,102,0.63)",
  },
  personalReminderDay: {
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 21,
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
    backgroundColor: "rgba(54,29,68,0.74)",
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
    backgroundColor: "rgba(109,56,129,0.30)",
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
    backgroundColor: "rgba(81,42,98,0.48)",
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
    backgroundColor: "rgba(49,28,63,0.52)",
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
