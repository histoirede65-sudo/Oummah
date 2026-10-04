import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import type { Href } from "expo-router";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  AppState,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { loadHifzState, type HifzState } from "../features/hifz/HifzStore";
import {
  getMosquePrayerSchedule,
  ADHAN_SCHEDULE_DAYS,
  loadPrayerCalculationSettings,
  type MosquePrayerSchedule,
} from "../features/mosques/data/mosquePrayerTimes";
import { getMainMosque, type StoredMosque } from "../features/mosques/data/mosquePreferences";
import {
  applyApprovedMosquePrayerTimes,
  getApprovedMosquePrayerTimes,
} from "../features/mosques/data/mosquePrayerUpdates";
import {
  buildNotificationCenterItems,
  CENTER_REMINDERS,
  DEFAULT_NOTIFICATION_CENTER_PREFERENCES,
  loadNotificationCenterPreferences,
  loadReadNotificationIds,
  requestNotificationCenterPermission,
  saveNotificationCenterPreferences,
  saveReadNotificationIds,
  subscribeNotificationReadStatus,
  syncNotificationCenterSchedule,
  type CenterAlertMode,
  type CenterReminderId,
  type NotificationCenterItem,
  type NotificationCenterPreferences,
} from "../features/notifications/NotificationCenter";
import {
  getNotificationReliability,
  openBatteryOptimizationSettings,
  openExactAlarmSettings,
  type NotificationReliability,
} from "../features/notifications/notificationReliability";
import { resyncWasilReminders } from "../features/wasil/WasilReminderService";
import { colors } from "../theme/colors";
import { getActiveAnnouncements, type PublicAnnouncement } from "../features/announcements/AnnouncementService";
import { typography } from "../theme/typography";

type Filter = "all" | NotificationCenterItem["category"];

async function getNotificationPrayerLocation(mosque: StoredMosque | null) {
  if (mosque) return { latitude: mosque.latitude, longitude: mosque.longitude };

  const permission = await Location.getForegroundPermissionsAsync().catch(() => null);
  if (!permission?.granted) return null;

  const lastKnown = await Location.getLastKnownPositionAsync().catch(() => null);
  const position = lastKnown ?? await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  }).catch(() => null);

  return position
    ? { latitude: position.coords.latitude, longitude: position.coords.longitude }
    : null;
}

const FILTERS: ReadonlyArray<{ id: Filter; label: string }> = [
  { id: "all", label: "Tout" },
  { id: "prayer", label: "Prières" },
  { id: "dua", label: "Dou‘as" },
  { id: "learning", label: "Apprentissage" },
  { id: "inspiration", label: "Inspiration" },
];

const MODES: ReadonlyArray<{ id: CenterAlertMode; label: string; icon: "volume-high-outline" | "phone-portrait-outline" | "notifications-off-outline" }> = [
  { id: "sound", label: "Son", icon: "volume-high-outline" },
  { id: "vibration", label: "Vibreur", icon: "phone-portrait-outline" },
  { id: "silent", label: "Silencieux", icon: "notifications-off-outline" },
];

const REMINDER_SECTIONS = [
  { id: "Objectifs", label: "Objectifs" },
  { id: "Dou‘as", label: "Dou‘as du quotidien" },
  { id: "Apprentissage", label: "Apprentissage" },
  { id: "Inspiration", label: "Inspiration" },
] as const;

type IconName = keyof typeof Ionicons.glyphMap;

const REMINDER_LOOKS: Record<CenterReminderId, { icon: IconName; accent: string }> = {
  jummah: { icon: "business-outline", accent: "#E8B84E" },
  "daily-goals": { icon: "flag-outline", accent: "#72C7A7" },
  "wake-up-dua": { icon: "sunny-outline", accent: "#F4C95D" },
  "morning-dua": { icon: "partly-sunny-outline", accent: "#F4C95D" },
  "leave-home-dua": { icon: "exit-outline", accent: "#E3A85F" },
  "before-meal-dua": { icon: "restaurant-outline", accent: "#CF9561" },
  "enter-home-dua": { icon: "home-outline", accent: "#D8A767" },
  "evening-dua": { icon: "moon-outline", accent: "#8D78CB" },
  "sleep-dua": { icon: "bed-outline", accent: "#9C8FE0" },
  hifz: { icon: "school-outline", accent: "#6BBCA8" },
  "verse-of-day": { icon: "book-outline", accent: "#B98BE0" },
  "hadith-of-day": { icon: "chatbubble-ellipses-outline", accent: "#D89BC8" },
};

/** Gold toggle drawn in JS: aligned on every iOS version (the native switch overflows its box). */
function GoldToggle({ value, onValueChange, accessibilityLabel }: {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel: string;
}) {
  const position = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(position, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [position, value]);
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      hitSlop={8}
      onPress={() => onValueChange(!value)}
      style={[styles.toggleTrack, value && styles.toggleTrackOn]}
    >
      <Animated.View
        style={[
          styles.toggleThumb,
          {
            backgroundColor: value ? "#F2B53D" : "#C9C1CB",
            transform: [{ translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, 20] }) }],
          },
        ]}
      />
    </Pressable>
  );
}

function notificationTimeValue(timeLabel: string) {
  const [hours, minutes] = timeLabel.split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes)
    ? hours * 60 + minutes
    : -1;
}

export default function NotificationsScreen() {
  const [preferences, setPreferences] = useState<NotificationCenterPreferences>(
    DEFAULT_NOTIFICATION_CENTER_PREFERENCES,
  );
  const [savedPreferences, setSavedPreferences] = useState<NotificationCenterPreferences>(
    DEFAULT_NOTIFICATION_CENTER_PREFERENCES,
  );
  const [saving, setSaving] = useState(false);
  const [schedule, setSchedule] = useState<MosquePrayerSchedule | null>(null);
  const [mosque, setMosque] = useState<StoredMosque | null>(null);
  const [hifzState, setHifzState] = useState<HifzState | null>(null);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [adminAnnouncements, setAdminAnnouncements] = useState<PublicAnnouncement[]>([]);
  const [timePickerReminder, setTimePickerReminder] = useState<CenterReminderId | null>(null);
  const [timePickerHour, setTimePickerHour] = useState(0);
  const [timePickerMinute, setTimePickerMinute] = useState(0);
  const [reliability, setReliability] = useState<NotificationReliability | null>(null);

  const refreshReliability = useCallback(() => {
    void getNotificationReliability().then(setReliability).catch(() => undefined);
  }, []);

  useFocusEffect(refreshReliability);

  useEffect(() => {
    // Back from the phone settings: show the new state.
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshReliability();
    });
    return () => subscription.remove();
  }, [refreshReliability]);

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeNotificationReadStatus(() => {
      void loadReadNotificationIds().then((ids) => {
        if (active) setReadIds(ids);
      });
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([
        loadNotificationCenterPreferences(),
        loadHifzState(),
        getMainMosque(),
        getActiveAnnouncements("notifications").catch(() => []),
      ]).then(async ([nextPreferences, nextHifz, nextMosque, nextAnnouncements]) => {
        if (!active) return;
        setPreferences(nextPreferences);
        setSavedPreferences(nextPreferences);
        const latestReadIds = await loadReadNotificationIds();
        if (!active) return;
        setReadIds(latestReadIds);
        setHifzState(nextHifz);
        setMosque(nextMosque);
        setAdminAnnouncements(nextAnnouncements);
        setLoaded(true);

        const prayerLocation = await getNotificationPrayerLocation(nextMosque);
        if (prayerLocation) {
          const calculation = await loadPrayerCalculationSettings();
          const calculatedSchedule = await getMosquePrayerSchedule(
            prayerLocation.latitude,
            prayerLocation.longitude,
            undefined,
            calculation,
            ADHAN_SCHEDULE_DAYS,
          ).catch(() => null);
          const approved = nextMosque
            ? await getApprovedMosquePrayerTimes(nextMosque.id).catch(() => null)
            : null;
          const nextSchedule = calculatedSchedule
            ? nextMosque && calculation.scheduleSource === "mosque"
              ? applyApprovedMosquePrayerTimes(calculatedSchedule, approved)
              : calculatedSchedule
            : null;
          if (active) setSchedule(nextSchedule);
        } else if (active) setSchedule(null);
      });
      return () => {
        active = false;
      };
    }, []),
  );



  const items = useMemo(
    () =>
      buildNotificationCenterItems({
        preferences,
        schedule,
        hifzState,
        mosqueName: mosque?.name,
      }),
    [hifzState, mosque?.name, preferences, schedule],
  );
  const visibleItems = useMemo(() => {
    const filtered = filter === "all"
      ? items
      : items.filter((item) => item.category === filter);
    return [...filtered].sort(
      (left, right) => notificationTimeValue(right.timeLabel) - notificationTimeValue(left.timeLabel),
    );
  }, [filter, items]);
  const unreadCount = items.filter((item) => !readIds.includes(item.id)).length;

  const updatePreferences = useCallback(
    (update: (current: NotificationCenterPreferences) => NotificationCenterPreferences) => {
      setPreferences(update);
    },
    [],
  );

  const openReminderTimePicker = (reminder: (typeof CENTER_REMINDERS)[number]) => {
    const [hour, minute] = (preferences.reminderTimes?.[reminder.id] ?? reminder.time ?? "00:00").split(":").map(Number);
    setTimePickerReminder(reminder.id);
    setTimePickerHour(Number.isFinite(hour) ? hour : 0);
    setTimePickerMinute(Number.isFinite(minute) ? minute : 0);
  };

  const saveReminderTime = async () => {
    if (!timePickerReminder || saving) return;
    const time = `${String(timePickerHour).padStart(2, "0")}:${String(timePickerMinute).padStart(2, "0")}`;
    const nextPreferences: NotificationCenterPreferences = {
      ...preferences,
      reminderTimes: { ...preferences.reminderTimes, [timePickerReminder]: time },
    };

    setSaving(true);
    setPreferences(nextPreferences);
    setTimePickerReminder(null);
    try {
      await saveNotificationCenterPreferences(nextPreferences);
      await syncNotificationCenterSchedule(nextPreferences, schedule, mosque?.name, hifzState);
      setSavedPreferences(nextPreferences);
    } catch {
      Alert.alert(
        "Horaire non enregistré",
        "Impossible d’enregistrer ce nouvel horaire pour le moment. Réessayez dans quelques instants.",
      );
    } finally {
      setSaving(false);
    }
  };

  const hasPendingChanges = useMemo(
    () =>
      JSON.stringify(preferences) !== JSON.stringify(savedPreferences),
    [preferences, savedPreferences],
  );

  const saveSettings = async () => {
    if (saving || !hasPendingChanges) return;
    setSaving(true);
    try {
      await saveNotificationCenterPreferences(preferences);
      await syncNotificationCenterSchedule(preferences, schedule, mosque?.name, hifzState);
      await resyncWasilReminders(preferences.mode).catch(() => undefined);
      setSavedPreferences(preferences);
    } finally {
      setSaving(false);
    }
  };


  const toggleSystemNotifications = async (enabled: boolean) => {
    if (!enabled) {
      updatePreferences((current) => ({ ...current, systemEnabled: false }));
      return;
    }
    const granted = await requestNotificationCenterPermission(preferences.mode).catch(
      () => false,
    );
    if (!granted) {
      Alert.alert(
        "Autorisation nécessaire",
        "Autorisez les notifications pour recevoir vos rappels même lorsque l’application est fermée.",
      );
      return;
    }
    updatePreferences((current) => ({ ...current, systemEnabled: true }));
  };

  const openItem = (item: NotificationCenterItem) => {
    const nextReadIds = [...new Set([...readIds, item.id])];
    setReadIds(nextReadIds);
    void saveReadNotificationIds(nextReadIds).catch(() => undefined);
    router.push(item.route as Href);
  };

  const markAllRead = () => {
    const nextReadIds = [...new Set([...readIds, ...items.map((item) => item.id)])];
    setReadIds(nextReadIds);
    void saveReadNotificationIds(nextReadIds).catch(() => undefined);
  };

  const openSettings = () => {
    setSettingsVisible(true);
  };

  const closeSettings = () => {
    setTimePickerReminder(null);
    setSettingsVisible(false);
  };

  const activeTimeReminder = timePickerReminder
    ? CENTER_REMINDERS.find((reminder) => reminder.id === timePickerReminder) ?? null
    : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#211526", "#10131C", "#091816"]}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="chevron-back" size={22} color="#FFF8EF" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text allowFontScaling={false} style={styles.eyebrow}>VOTRE QUOTIDIEN</Text>
          <Text allowFontScaling={false} numberOfLines={1} style={styles.title}>Notifications</Text>
          <Pressable onPress={openSettings} style={styles.editNotificationsButton}>
            <Ionicons name="options-outline" size={18} color="#F2BE55" />
            <Text allowFontScaling={false} style={styles.editNotificationsText}>Modifier mes notifications</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="notifications" size={23} color="#26181C" />
          </View>
          <View style={styles.summaryCopy}>
            <Text style={styles.summaryTitle}>
              {unreadCount ? `${unreadCount} rappel${unreadCount > 1 ? "s" : ""} à voir` : "Vous êtes à jour"}
            </Text>
            <Text style={styles.summaryText}>
              {preferences.systemEnabled
                ? "Les rappels choisis sont actifs sur cet appareil."
                : "Activez les alertes système depuis les réglages."}
            </Text>
          </View>
          {unreadCount ? (
            <Pressable onPress={markAllRead} style={styles.readAllButton}>
              <Ionicons name="checkmark-done" size={18} color="#F2BE55" />
            </Pressable>
          ) : null}
        </View>

        {reliability && (!reliability.exactAlarms || !reliability.batteryUnrestricted || !reliability.soundAllowed) ? (
          <View style={styles.reliabilityCard}>
            <View style={styles.reliabilityHead}>
              <Ionicons name="alarm-outline" size={19} color="#F4C75E" />
              <Text style={styles.reliabilityTitle}>Recevoir chaque alerte à l’heure</Text>
            </View>
            {!reliability.exactAlarms ? (
              <Pressable onPress={() => void openExactAlarmSettings()} style={({ pressed }) => [styles.reliabilityRow, pressed && styles.pressed]}>
                <View style={styles.reliabilityCopy}>
                  <Text style={styles.reliabilityLabel}>Autoriser « Alarmes et rappels »</Text>
                  <Text style={styles.reliabilityText}>Sans cette autorisation, Android peut retarder l’adhan de plusieurs minutes quand le téléphone est en veille.</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#F4C75E" />
              </Pressable>
            ) : null}
            {!reliability.batteryUnrestricted ? (
              <Pressable onPress={() => void openBatteryOptimizationSettings()} style={({ pressed }) => [styles.reliabilityRow, pressed && styles.pressed]}>
                <View style={styles.reliabilityCopy}>
                  <Text style={styles.reliabilityLabel}>Retirer OUMMAH de l’optimisation de batterie</Text>
                  <Text style={styles.reliabilityText}>Certains téléphones (Samsung, Xiaomi, Huawei…) bloquent les alertes des applications « optimisées ». Choisissez OUMMAH puis « Ne pas optimiser » ou « Aucune restriction ».</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#F4C75E" />
              </Pressable>
            ) : null}
            {!reliability.soundAllowed ? (
              <Pressable onPress={() => void Linking.openSettings().catch(() => undefined)} style={({ pressed }) => [styles.reliabilityRow, pressed && styles.pressed]}>
                <View style={styles.reliabilityCopy}>
                  <Text style={styles.reliabilityLabel}>Activer les sons d’OUMMAH</Text>
                  <Text style={styles.reliabilityText}>Les sons des notifications sont coupés pour OUMMAH dans les réglages de l’iPhone : l’adhan et la vibration ne peuvent pas se déclencher.</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#F4C75E" />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => setFilter(item.id)}
              style={[styles.filter, filter === item.id && styles.filterActive]}
            >
              <Text style={[styles.filterText, filter === item.id && styles.filterTextActive]}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {adminAnnouncements.length ? (
          <View style={styles.adminAnnouncements}>
            <Text style={styles.adminAnnouncementsTitle}>Communications OUMMAH</Text>
            {adminAnnouncements.map((announcement) => (
              <Pressable key={announcement.id} disabled={!announcement.actionRoute} onPress={() => announcement.actionRoute && router.push(announcement.actionRoute as Href)} style={styles.adminAnnouncementCard}>
                <View style={styles.adminAnnouncementIcon}><Ionicons name="megaphone-outline" size={18} color="#26181C" /></View>
                <View style={styles.adminAnnouncementCopy}><Text style={styles.adminAnnouncementTitle}>{announcement.title}</Text><Text style={styles.adminAnnouncementBody}>{announcement.body}</Text>{announcement.actionLabel ? <Text style={styles.adminAnnouncementAction}>{announcement.actionLabel} →</Text> : null}</View>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.feed}>
          {visibleItems.length ? (
            visibleItems.map((item) => {
              const unread = !readIds.includes(item.id);
              return (
                <Pressable
                  key={item.id}
                  onPress={() => openItem(item)}
                  style={({ pressed }) => [
                    styles.itemCard,
                    unread && styles.itemCardUnread,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={[styles.itemAccent, unread && styles.itemAccentUnread, { backgroundColor: item.accent }]} />
                  <View style={[styles.itemIcon, unread && styles.itemIconUnread, { backgroundColor: `${item.accent}20` }]}>
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={item.accent}
                    />
                  </View>
                  <View style={styles.itemCopy}>
                    <View style={styles.itemTitleRow}>
                      <Text style={[styles.itemTitle, unread && styles.itemTitleUnread]}>{item.title}</Text>
                      {unread ? <Text style={styles.unreadBadge}>NOUVEAU</Text> : null}
                    </View>
                    <Text style={[styles.itemBody, unread && styles.itemBodyUnread]}>{item.body}</Text>
                    <Text style={[styles.itemTime, unread && styles.itemTimeUnread]}>{item.timeLabel}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.28)" />
                </Pressable>
              );
            })
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={34} color="#72C7A7" />
              <Text style={styles.emptyTitle}>Rien à signaler ici</Text>
              <Text style={styles.emptyText}>Les prochains rappels apparaîtront au bon moment de la journée.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={settingsVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={closeSettings}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSettings} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetTitle}>Mes rappels</Text>
                <Text style={styles.sheetSubtitle}>Touchez une heure pour la changer</Text>
              </View>
              <Pressable onPress={closeSettings} hitSlop={8} style={styles.closeButton}>
                <Ionicons name="close" size={21} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              <View style={styles.masterRow}>
                <View style={styles.masterIcon}>
                  <Ionicons name="notifications" size={18} color="#26181C" />
                </View>
                <Text style={styles.masterTitle}>Rappels sur le téléphone</Text>
                <GoldToggle
                  value={preferences.systemEnabled}
                  onValueChange={(value) => void toggleSystemNotifications(value)}
                  accessibilityLabel="Rappels sur le téléphone"
                />
              </View>

              <View style={styles.segmented}>
                {MODES.map((mode) => {
                  const selected = preferences.mode === mode.id;
                  return (
                    <Pressable
                      key={mode.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => updatePreferences((current) => ({ ...current, mode: mode.id }))}
                      style={[styles.segment, selected && styles.segmentActive]}
                    >
                      <Ionicons name={mode.icon} size={16} color={selected ? "#26181C" : "#FFFFFF"} />
                      <Text style={[styles.segmentText, selected && styles.segmentTextActive]}>{mode.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.adhanHintText}>L’adhan se règle depuis la carte des prières de l’accueil.</Text>

              <View style={!preferences.systemEnabled && styles.disabledChoice}>
                {REMINDER_SECTIONS.map((section) => (
                  <View key={section.id}>
                    <Text style={styles.sectionLabel}>{section.label}</Text>
                    <View style={styles.settingsGroup}>
                      {CENTER_REMINDERS.filter((reminder) => reminder.section === section.id).map((reminder, index) => {
                        const enabled = preferences.reminders[reminder.id];
                        const look = REMINDER_LOOKS[reminder.id];
                        return (
                          <View key={reminder.id} style={[styles.settingRow, index > 0 && styles.settingRowDivider]}>
                            <View style={[styles.rowIcon, { backgroundColor: `${look.accent}26` }]}>
                              <Ionicons name={look.icon} size={17} color={look.accent} />
                            </View>
                            <Text numberOfLines={1} style={[styles.settingTitle, !enabled && styles.settingTitleOff]}>
                              {reminder.title}
                            </Text>
                            {reminder.time && enabled ? (
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Changer l’heure : ${reminder.title}`}
                                hitSlop={6}
                                onPress={() => openReminderTimePicker(reminder)}
                                style={({ pressed }) => [styles.timePill, pressed && styles.reminderTimeButtonPressed]}
                              >
                                <Text style={styles.timePillText}>{preferences.reminderTimes?.[reminder.id] ?? reminder.time}</Text>
                              </Pressable>
                            ) : null}
                            <GoldToggle
                              value={enabled}
                              onValueChange={(value) =>
                                updatePreferences((current) => ({
                                  ...current,
                                  reminders: { ...current.reminders, [reminder.id]: value },
                                }))
                              }
                              accessibilityLabel={reminder.title}
                            />
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
            <Pressable
              disabled={saving || !hasPendingChanges}
              onPress={() => void saveSettings()}
              style={[
                styles.saveButton,
                hasPendingChanges ? styles.saveButtonPending : styles.saveButtonSaved,
                saving && styles.disabledChoice,
              ]}
            >
              <Ionicons name={hasPendingChanges ? "checkmark" : "checkmark-circle"} size={19} color={hasPendingChanges ? "#172018" : "#72C7A7"} />
              <Text style={[styles.saveButtonText, !hasPendingChanges && styles.saveButtonTextSaved]}>
                {saving ? "Enregistrement…" : hasPendingChanges ? "Enregistrer" : "Enregistré"}
              </Text>
            </Pressable>
          </View>

          {timePickerReminder !== null ? (
            <View style={styles.timePickerOverlay}>
              <Pressable style={StyleSheet.absoluteFill} onPress={() => setTimePickerReminder(null)} />
              <View style={styles.timePickerCard}>
                <Text style={styles.timePickerEyebrow}>HORAIRE DE LA NOTIFICATION</Text>
                <Text style={styles.timePickerTitle}>{activeTimeReminder?.title ?? "Choisir l’heure"}</Text>
                <Text style={styles.timePickerSubtitle}>Choisissez l’heure à laquelle vous souhaitez recevoir ce rappel.</Text>
                <View style={styles.timePickerValues}>
                  <View style={styles.timePickerColumn}>
                    <Pressable onPress={() => setTimePickerHour((value) => (value + 1) % 24)} style={styles.timePickerAdjust}><Ionicons name="chevron-up" size={22} color="#F4C75E" /></Pressable>
                    <Text style={styles.timePickerValue}>{String(timePickerHour).padStart(2, "0")}</Text>
                    <Pressable onPress={() => setTimePickerHour((value) => (value + 23) % 24)} style={styles.timePickerAdjust}><Ionicons name="chevron-down" size={22} color="#F4C75E" /></Pressable>
                  </View>
                  <Text style={styles.timePickerSeparator}>:</Text>
                  <View style={styles.timePickerColumn}>
                    <Pressable onPress={() => setTimePickerMinute((value) => (value + 1) % 60)} style={styles.timePickerAdjust}><Ionicons name="chevron-up" size={22} color="#F4C75E" /></Pressable>
                    <Text style={styles.timePickerValue}>{String(timePickerMinute).padStart(2, "0")}</Text>
                    <Pressable onPress={() => setTimePickerMinute((value) => (value + 59) % 60)} style={styles.timePickerAdjust}><Ionicons name="chevron-down" size={22} color="#F4C75E" /></Pressable>
                  </View>
                </View>
                <Pressable disabled={saving} onPress={() => void saveReminderTime()} style={[styles.timePickerDone, saving && styles.disabledChoice]}>
                  <Text style={styles.timePickerDoneText}>{saving ? "Enregistrement…" : "Valider cette heure"}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#10131C" },
  header: { minHeight: 108, paddingHorizontal: 16, paddingVertical: 10, flexDirection: "row", alignItems: "center" },
  headerButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: "rgba(255,230,190,0.14)", backgroundColor: "rgba(255,255,255,0.045)" },
  editNotificationsButton: { minHeight: 44, marginTop: 7, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 14, borderWidth: 1, borderColor: "rgba(242,190,85,0.34)", backgroundColor: "rgba(242,190,85,0.12)" },
  editNotificationsText: { color: "#F2BE55", fontFamily: typography.sans, fontSize: 15, lineHeight: 21, fontWeight: "800" },
  headerCopy: { flex: 1, alignItems: "center", minWidth: 0 },
  eyebrow: { color: "#F6C75D", fontFamily: typography.sans, fontSize: 12, fontWeight: "700", letterSpacing: 1.2 },
  title: { color: "#FFFFFF", fontFamily: typography.sans, fontSize: 25, flexShrink: 1, textAlign: "center", fontWeight: "600" },
  content: { padding: 14, paddingBottom: 34 },
  summaryCard: { minHeight: 76, padding: 13, flexDirection: "row", alignItems: "center", borderRadius: 22, borderWidth: 1, borderColor: "rgba(245,198,96,0.20)", backgroundColor: "rgba(255,255,255,0.055)" },
  summaryIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#F0B94B" },
  summaryCopy: { flex: 1, marginHorizontal: 11 },
  summaryTitle: { color: "#FFFFFF", fontFamily: typography.sans, fontSize: 18, fontWeight: "600" },
  summaryText: { marginTop: 2, color: "#FFFFFF", fontFamily: typography.sans, fontSize: 13, lineHeight: 18, fontWeight: "500" },
  reliabilityCard: { marginTop: 12, padding: 13, borderRadius: 20, borderWidth: 1, borderColor: "rgba(242,190,85,0.42)", backgroundColor: "rgba(65,43,31,0.93)" },
  reliabilityHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  reliabilityTitle: { flex: 1, color: "#FFFFFF", fontFamily: typography.sans, fontSize: 17.5, fontWeight: "600" },
  reliabilityRow: { marginTop: 10, padding: 11, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)" },
  reliabilityCopy: { flex: 1 },
  reliabilityLabel: { color: "#FFE4A0", fontFamily: typography.sans, fontSize: 15, fontWeight: "800" },
  reliabilityText: { marginTop: 3, color: "#FFFFFF", fontFamily: typography.sans, fontSize: 13, lineHeight: 18, fontWeight: "500" },
  readAllButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "rgba(242,190,85,0.10)" },
  filters: { gap: 7, paddingVertical: 15 },
  filter: { height: 34, paddingHorizontal: 13, alignItems: "center", justifyContent: "center", borderRadius: 17, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" },
  filterActive: { borderColor: "rgba(242,190,85,0.45)", backgroundColor: "rgba(231,168,50,0.12)" },
  filterText: { color: "#FFFFFF", fontFamily: typography.sans, fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: "#FFE3A0" },
  adminAnnouncements: { marginBottom: 18 },
  adminAnnouncementsTitle: { marginBottom: 10, color: "#F2BE55", fontFamily: typography.sans, fontSize: 19, fontWeight: "600" },
  adminAnnouncementCard: { marginBottom: 9, padding: 13, flexDirection: "row", alignItems: "flex-start", borderRadius: 16, borderWidth: 1, borderColor: "rgba(242,190,85,0.25)", backgroundColor: "rgba(242,190,85,0.07)" },
  adminAnnouncementIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#F2BE55" },
  adminAnnouncementCopy: { flex: 1, marginLeft: 11 },
  adminAnnouncementTitle: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  adminAnnouncementBody: { marginTop: 4, color: "#FFFFFF", fontSize: 13, lineHeight: 18, fontWeight: "500" },
  adminAnnouncementAction: { marginTop: 6, color: "#F2BE55", fontSize: 13, fontWeight: "800" },
  feed: { gap: 8 },
  itemCard: { minHeight: 91, overflow: "hidden", padding: 12, flexDirection: "row", alignItems: "center", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.075)", backgroundColor: "rgba(22,20,29,0.84)" },
  itemCardUnread: { borderColor: "rgba(242,190,85,0.66)", borderWidth: 1.5, backgroundColor: "rgba(65,43,31,0.93)", shadowColor: "#F2B53D", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 9, elevation: 4 },
  itemAccent: { position: "absolute", top: 16, bottom: 16, left: 0, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  itemAccentUnread: { top: 10, bottom: 10, width: 5, borderTopRightRadius: 4, borderBottomRightRadius: 4 },
  itemIcon: { width: 42, height: 42, marginRight: 11, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  itemIconUnread: { borderWidth: 1, borderColor: "rgba(255,234,179,0.48)" },
  itemCopy: { flex: 1, paddingRight: 7 },
  itemTitleRow: { flexDirection: "row", alignItems: "center" },
  itemTitle: { flexShrink: 1, color: "#FFFFFF", fontFamily: typography.sans, fontSize: 16.5, fontWeight: "600" },
  itemTitleUnread: { color: "#FFFFFF", fontSize: 17.5, fontWeight: "600" },
  unreadBadge: { marginLeft: 7, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, overflow: "hidden", color: "#20160F", backgroundColor: "#F2B53D", fontFamily: typography.sans, fontSize: 11, fontWeight: "900", letterSpacing: 0.6 },
  itemBody: { marginTop: 3, color: "#FFFFFF", fontFamily: typography.sans, fontSize: 13, lineHeight: 18, fontWeight: "500" },
  itemBodyUnread: { color: "rgba(255,245,235,0.82)" },
  itemTime: { marginTop: 4, color: "#F6C75D", fontFamily: typography.sans, fontSize: 12.5, fontWeight: "700" },
  itemTimeUnread: { color: "#FFDA7E", fontSize: 13, fontWeight: "600" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.992 }] },
  emptyCard: { minHeight: 180, alignItems: "center", justifyContent: "center", borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.03)" },
  emptyTitle: { marginTop: 10, color: "#FFFFFF", fontFamily: typography.sans, fontSize: 19, fontWeight: "600" },
  emptyText: { maxWidth: 250, marginTop: 4, color: "#FFFFFF", fontFamily: typography.sans, fontSize: 13.5, lineHeight: 19, textAlign: "center", fontWeight: "500" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(3,4,9,0.74)" },
  sheet: { height: "88%", paddingTop: 10, paddingHorizontal: 18, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderBottomWidth: 0, borderColor: "rgba(255,227,172,0.16)", backgroundColor: "#15121B" },
  handle: { width: 42, height: 4, marginBottom: 13, alignSelf: "center", borderRadius: 2, backgroundColor: "rgba(255,255,255,0.20)" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 },
  sheetTitle: { color: "#FFFFFF", fontFamily: typography.sans, fontSize: 24, fontWeight: "700", letterSpacing: -0.3 },
  closeButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)" },
  sheetContent: { paddingTop: 14, paddingBottom: 28 },
  masterRow: { minHeight: 60, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, backgroundColor: "rgba(242,190,85,0.10)" },
  sectionLabel: { marginTop: 24, marginBottom: 8, paddingHorizontal: 4, color: "#F6C75D", fontFamily: typography.sans, fontSize: 14, fontWeight: "700" },
  settingsGroup: { overflow: "hidden", borderRadius: 18, backgroundColor: "rgba(255,255,255,0.045)" },
  settingRow: { minHeight: 58, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 11 },
  settingTitle: { flex: 1, color: "#FFFFFF", fontFamily: typography.sans, fontSize: 15.5, fontWeight: "600" },
  reminderTimeButtonPressed: { opacity: 0.72 },
  timePickerOverlay: { ...StyleSheet.absoluteFill, zIndex: 100, elevation: 100, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "rgba(3,4,9,0.88)" },
  timePickerCard: { width: "100%", maxWidth: 330, padding: 20, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,227,172,0.24)", backgroundColor: "#17131C" },
  timePickerEyebrow: { color: "#F6C75D", fontFamily: typography.sans, fontSize: 11.7, fontWeight: "900", letterSpacing: 0.95, textAlign: "center" },
  timePickerTitle: { marginTop: 4, color: "#FFFFFF", fontFamily: typography.sans, fontSize: 20, textAlign: "center", fontWeight: "600" },
  timePickerSubtitle: { maxWidth: 250, marginTop: 6, alignSelf: "center", color: "#FFFFFF", fontFamily: typography.sans, fontSize: 13.3, lineHeight: 18, textAlign: "center", fontWeight: "500" },
  timePickerValues: { marginTop: 17, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  timePickerColumn: { alignItems: "center" },
  timePickerAdjust: { width: 52, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "rgba(242,190,85,0.08)" },
  timePickerValue: { minWidth: 68, marginVertical: 5, color: "#FFFFFF", fontFamily: typography.sans, fontSize: 30, fontWeight: "800", textAlign: "center", fontVariant: ["tabular-nums"] },
  timePickerSeparator: { marginHorizontal: 8, color: "#F4C75E", fontFamily: typography.sans, fontSize: 28, fontWeight: "800" },
  timePickerDone: { minHeight: 46, marginTop: 18, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#F2C55B" },
  timePickerDoneText: { color: "#172018", fontFamily: typography.sans, fontSize: 15.5, fontWeight: "800" },
  disabledChoice: { opacity: 0.45 },
  adhanHintText: { marginTop: 8, paddingHorizontal: 4, color: "rgba(255,255,255,0.62)", fontFamily: typography.sans, fontSize: 12.5 },
  sheetHeaderCopy: { flex: 1, paddingRight: 12 },
  sheetSubtitle: { marginTop: 3, color: "rgba(255,255,255,0.72)", fontFamily: typography.sans, fontSize: 13.5 },
  masterIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#F0B94B" },
  masterTitle: { flex: 1, color: "#FFFFFF", fontFamily: typography.sans, fontSize: 16, fontWeight: "700" },
  segmented: { marginTop: 14, padding: 4, flexDirection: "row", gap: 4, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.06)" },
  segment: { minHeight: 42, flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 12 },
  segmentActive: { backgroundColor: "#F2C55B" },
  segmentText: { color: "#FFFFFF", fontFamily: typography.sans, fontSize: 14, fontWeight: "600" },
  segmentTextActive: { color: "#26181C", fontWeight: "800" },
  settingRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.09)" },
  rowIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  settingTitleOff: { color: "rgba(255,255,255,0.55)" },
  timePill: { minWidth: 60, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center", borderRadius: 10, backgroundColor: "rgba(242,190,85,0.14)" },
  timePillText: { color: "#FFD978", fontFamily: typography.sans, fontSize: 14.5, fontWeight: "800", fontVariant: ["tabular-nums"] },
  toggleTrack: { width: 48, height: 28, padding: 2, justifyContent: "center", borderRadius: 14, backgroundColor: "#3E3743" },
  toggleTrackOn: { backgroundColor: "rgba(236,177,61,0.42)" },
  toggleThumb: { width: 24, height: 24, borderRadius: 12 },
  saveButtonTextSaved: { color: "#72C7A7" },
  saveButton: { minHeight: 52, marginBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 16 },
  saveButtonPending: { backgroundColor: "#E0A83D" },
  saveButtonSaved: { backgroundColor: "rgba(114,199,167,0.12)" },
  saveButtonText: { color: "#172018", fontFamily: typography.sans, fontSize: 14.5, fontWeight: "800" },
});
