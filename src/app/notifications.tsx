import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { loadHifzState, type HifzState } from "../features/hifz/HifzStore";
import { syncAdhanNotifications } from "../features/adhan/AdhanNotifications";
import {
  DEFAULT_ADHAN_PREFERENCES,
  loadAdhanPreferences,
  saveAdhanPreferences,
  type AdhanPreferences,
} from "../features/adhan/AdhanPreferences";
import {
  getMosquePrayerSchedule,
  type MosquePrayerSchedule,
} from "../features/mosques/data/mosquePrayerTimes";
import { getMainMosque, type StoredMosque } from "../features/mosques/data/mosquePreferences";
import {
  buildNotificationCenterItems,
  CENTER_REMINDERS,
  DEFAULT_NOTIFICATION_CENTER_PREFERENCES,
  loadNotificationCenterPreferences,
  loadReadNotificationIds,
  requestNotificationCenterPermission,
  saveNotificationCenterPreferences,
  saveReadNotificationIds,
  syncNotificationCenterSchedule,
  type CenterAlertMode,
  type NotificationCenterItem,
  type NotificationCenterPreferences,
} from "../features/notifications/NotificationCenter";
import { colors } from "../theme/colors";
import { getActiveAnnouncements, type PublicAnnouncement } from "../features/announcements/AnnouncementService";
import { typography } from "../theme/typography";

type Filter = "all" | NotificationCenterItem["category"];

const FILTERS: ReadonlyArray<{ id: Filter; label: string }> = [
  { id: "all", label: "Tout" },
  { id: "prayer", label: "Prières" },
  { id: "dua", label: "Dou‘as" },
  { id: "learning", label: "Apprentissage" },
  { id: "inspiration", label: "Inspiration" },
];

const MODES: ReadonlyArray<{ id: CenterAlertMode; label: string; icon: "volume-high-outline" | "phone-portrait-outline" | "notifications-outline" }> = [
  { id: "sound", label: "Son", icon: "volume-high-outline" },
  { id: "vibration", label: "Vibreur", icon: "phone-portrait-outline" },
  { id: "silent", label: "Silencieux", icon: "notifications-outline" },
];

export default function NotificationsScreen() {
  const [preferences, setPreferences] = useState<NotificationCenterPreferences>(
    DEFAULT_NOTIFICATION_CENTER_PREFERENCES,
  );
  const [savedPreferences, setSavedPreferences] = useState<NotificationCenterPreferences>(
    DEFAULT_NOTIFICATION_CENTER_PREFERENCES,
  );
  const [adhanPreferences, setAdhanPreferences] = useState<AdhanPreferences>(
    DEFAULT_ADHAN_PREFERENCES,
  );
  const [savedAdhanPreferences, setSavedAdhanPreferences] = useState<AdhanPreferences>(
    DEFAULT_ADHAN_PREFERENCES,
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

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void Promise.all([
        loadNotificationCenterPreferences(),
        loadAdhanPreferences(),
        loadReadNotificationIds(),
        loadHifzState(),
        getMainMosque(),
        getActiveAnnouncements("notifications").catch(() => []),
      ]).then(async ([nextPreferences, nextAdhanPreferences, nextReadIds, nextHifz, nextMosque, nextAnnouncements]) => {
        if (!active) return;
        setPreferences(nextPreferences);
        setSavedPreferences(nextPreferences);
        setAdhanPreferences(nextAdhanPreferences);
        setSavedAdhanPreferences(nextAdhanPreferences);
        setReadIds(nextReadIds);
        setHifzState(nextHifz);
        setMosque(nextMosque);
        setAdminAnnouncements(nextAnnouncements);
        setLoaded(true);

        if (nextMosque) {
          const nextSchedule = await getMosquePrayerSchedule(
            nextMosque.latitude,
            nextMosque.longitude,
          ).catch(() => null);
          if (active) setSchedule(nextSchedule);
        }
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
  const visibleItems = filter === "all" ? items : items.filter((item) => item.category === filter);
  const unreadCount = items.filter((item) => !readIds.includes(item.id)).length;

  const updatePreferences = useCallback(
    (update: (current: NotificationCenterPreferences) => NotificationCenterPreferences) => {
      setPreferences(update);
    },
    [],
  );

  const hasPendingChanges = useMemo(
    () =>
      JSON.stringify(preferences) !== JSON.stringify(savedPreferences) ||
      JSON.stringify(adhanPreferences) !== JSON.stringify(savedAdhanPreferences),
    [adhanPreferences, preferences, savedAdhanPreferences, savedPreferences],
  );

  const saveSettings = async () => {
    if (saving || !hasPendingChanges) return;
    setSaving(true);
    try {
      await Promise.all([
        saveNotificationCenterPreferences(preferences),
        saveAdhanPreferences(adhanPreferences),
      ]);
      await syncNotificationCenterSchedule(preferences, schedule, mosque?.name);
      if (schedule) await syncAdhanNotifications(schedule, adhanPreferences);
      setSavedPreferences(preferences);
      setSavedAdhanPreferences(adhanPreferences);
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
          <Text style={styles.eyebrow}>VOTRE QUOTIDIEN</Text>
          <Text style={styles.title}>Notifications</Text>
        </View>
        <Pressable onPress={() => setSettingsVisible(true)} style={styles.headerButton}>
          <Ionicons name="options-outline" size={21} color="#F2BE55" />
        </Pressable>
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
                  style={({ pressed }) => [styles.itemCard, pressed && styles.pressed]}
                >
                  <View style={[styles.itemAccent, { backgroundColor: item.accent }]} />
                  <View style={[styles.itemIcon, { backgroundColor: `${item.accent}20` }]}>
                    <Ionicons
                      name={item.icon as keyof typeof Ionicons.glyphMap}
                      size={20}
                      color={item.accent}
                    />
                  </View>
                  <View style={styles.itemCopy}>
                    <View style={styles.itemTitleRow}>
                      <Text style={styles.itemTitle}>{item.title}</Text>
                      {unread ? <View style={styles.unreadDot} /> : null}
                    </View>
                    <Text style={styles.itemBody}>{item.body}</Text>
                    <Text style={styles.itemTime}>{item.timeLabel}</Text>
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

      <Modal visible={settingsVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setSettingsVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSettingsVisible(false)} />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.eyebrow}>PERSONNALISATION</Text>
                <Text style={styles.sheetTitle}>Choisir mes rappels</Text>
              </View>
              <Pressable onPress={() => setSettingsVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={21} color="#FFF8EF" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
              <View style={styles.masterRow}>
                <View style={styles.masterCopy}>
                  <Text style={styles.settingTitle}>Notifications sur le téléphone</Text>
                  <Text style={styles.settingDescription}>Recevoir les rappels même lorsque l’application est fermée</Text>
                </View>
                <Switch
                  value={preferences.systemEnabled}
                  onValueChange={(value) => void toggleSystemNotifications(value)}
                  trackColor={{ false: "#443D47", true: "rgba(236,177,61,0.55)" }}
                  thumbColor={preferences.systemEnabled ? "#F2B53D" : "#908892"}
                />
              </View>

              <Text style={styles.sectionLabel}>MODE D’ALERTE</Text>
              <View style={styles.modeRow}>
                {MODES.map((mode) => (
                  <Pressable
                    key={mode.id}
                    onPress={() => {
                      updatePreferences((current) => ({ ...current, mode: mode.id }));
                      setAdhanPreferences((current) => ({ ...current, mode: mode.id }));
                    }}
                    style={[styles.modeChoice, preferences.mode === mode.id && styles.choiceActive]}
                  >
                    <Ionicons name={mode.icon} size={18} color={preferences.mode === mode.id ? "#F4C75E" : "#9E96A1"} />
                    <Text style={[styles.modeText, preferences.mode === mode.id && styles.choiceTextActive]}>{mode.label}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.sectionLabel}>PRIÈRES</Text>
              <View style={styles.settingsGroup}>
                <View style={styles.settingRow}>
                  <View style={styles.settingCopy}>
                    <Text style={styles.settingTitle}>Alertes de prière</Text>
                    <Text style={styles.settingDescription}>Une seule notification, au délai choisi. Aucun message après la prière.</Text>
                  </View>
                  <Switch
                    value={adhanPreferences.enabled}
                    onValueChange={(value) =>
                      setAdhanPreferences((current) => ({ ...current, enabled: value }))
                    }
                    trackColor={{ false: "#443D47", true: "rgba(236,177,61,0.50)" }}
                    thumbColor={adhanPreferences.enabled ? "#F2B53D" : "#908892"}
                  />
                </View>
                <View style={styles.prayerChoicesBlock}>
                  <Text style={styles.delayTitle}>Prières concernées</Text>
                  <View style={styles.prayerChoicesRow}>
                    {([
                      ["Fajr", "Fajr"],
                      ["Dhuhr", "Dhuhr"],
                      ["Asr", "‘Asr"],
                      ["Maghrib", "Maghrib"],
                      ["Isha", "‘Isha"],
                    ] as const).map(([key, label]) => {
                      const selected = adhanPreferences.prayers[key];
                      return (
                        <Pressable
                          key={key}
                          disabled={!adhanPreferences.enabled}
                          onPress={() =>
                            setAdhanPreferences((current) => ({
                              ...current,
                              prayers: { ...current.prayers, [key]: !current.prayers[key] },
                            }))
                          }
                          style={[
                            styles.prayerChoice,
                            selected && styles.choiceActive,
                            !adhanPreferences.enabled && styles.disabledChoice,
                          ]}
                        >
                          <Ionicons
                            name={selected ? "checkmark-circle" : "ellipse-outline"}
                            size={15}
                            color={selected ? "#F4C75E" : "#9E96A1"}
                          />
                          <Text style={[styles.delayText, selected && styles.choiceTextActive]}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
                <View style={styles.delayBlock}>
                  <Text style={styles.delayTitle}>Moment du rappel</Text>
                  <View style={styles.delayRow}>
                    {[0, 5, 10, 15, 30].map((minutes) => (
                      <Pressable
                        key={minutes}
                        disabled={!adhanPreferences.enabled}
                        onPress={() =>
                          setAdhanPreferences((current) => ({ ...current, leadMinutes: minutes }))
                        }
                        style={[
                          styles.delayChoice,
                          adhanPreferences.leadMinutes === minutes && styles.choiceActive,
                          !adhanPreferences.enabled && styles.disabledChoice,
                        ]}
                      >
                        <Text style={[styles.delayText, adhanPreferences.leadMinutes === minutes && styles.choiceTextActive]}>
                          {minutes === 0 ? "À l’heure" : `${minutes} min`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View style={styles.adhanUnavailable}>
                  <Ionicons name="information-circle-outline" size={17} color="#F2BE55" />
                  <Text style={styles.adhanUnavailableText}>Chaque alerte de prière contient un hadith authentique adapté. En mode Son, l’Adhan sélectionné est utilisé pour la notification.</Text>
                </View>
              </View>

              {["Dou‘as", "Apprentissage", "Inspiration"].map((section) => (
                <View key={section}>
                  <Text style={styles.sectionLabel}>{section.toUpperCase()}</Text>
                  <View style={styles.settingsGroup}>
                    {CENTER_REMINDERS.filter((reminder) => reminder.section === section).map((reminder) => (
                      <View key={reminder.id} style={styles.settingRow}>
                        <View style={styles.settingCopy}>
                          <Text style={styles.settingTitle}>{reminder.title}</Text>
                          <Text style={styles.settingDescription}>
                            {reminder.description}{reminder.time ? ` · ${reminder.time}` : ""}
                          </Text>
                        </View>
                        <Switch
                          value={preferences.reminders[reminder.id]}
                          onValueChange={(value) =>
                            updatePreferences((current) => ({
                              ...current,
                              reminders: { ...current.reminders, [reminder.id]: value },
                            }))
                          }
                          trackColor={{ false: "#443D47", true: "rgba(236,177,61,0.50)" }}
                          thumbColor={preferences.reminders[reminder.id] ? "#F2B53D" : "#908892"}
                        />
                      </View>
                    ))}
                  </View>
                </View>
              ))}
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
              <Ionicons name={hasPendingChanges ? "save-outline" : "checkmark-circle"} size={19} color="#172018" />
              <Text style={styles.saveButtonText}>
                {saving ? "Enregistrement…" : hasPendingChanges ? "Enregistrer mes notifications" : "Notifications enregistrées"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#10131C" },
  header: { height: 68, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  headerButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: "rgba(255,230,190,0.14)", backgroundColor: "rgba(255,255,255,0.045)" },
  headerCopy: { flex: 1, alignItems: "center" },
  eyebrow: { color: "rgba(242,190,85,0.70)", fontFamily: typography.sans, fontSize: 8.5, fontWeight: "700", letterSpacing: 1.2 },
  title: { color: "#FFF8EF", fontFamily: typography.serifSemibold, fontSize: 25 },
  content: { padding: 14, paddingBottom: 34 },
  summaryCard: { minHeight: 76, padding: 13, flexDirection: "row", alignItems: "center", borderRadius: 22, borderWidth: 1, borderColor: "rgba(245,198,96,0.20)", backgroundColor: "rgba(255,255,255,0.055)" },
  summaryIcon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "#F0B94B" },
  summaryCopy: { flex: 1, marginHorizontal: 11 },
  summaryTitle: { color: "#FFF8EF", fontFamily: typography.serifSemibold, fontSize: 16 },
  summaryText: { marginTop: 2, color: "rgba(235,225,232,0.58)", fontFamily: typography.sans, fontSize: 10.5, lineHeight: 14 },
  readAllButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "rgba(242,190,85,0.10)" },
  filters: { gap: 7, paddingVertical: 15 },
  filter: { height: 34, paddingHorizontal: 13, alignItems: "center", justifyContent: "center", borderRadius: 17, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" },
  filterActive: { borderColor: "rgba(242,190,85,0.45)", backgroundColor: "rgba(231,168,50,0.12)" },
  filterText: { color: "#9F97A3", fontFamily: typography.sans, fontSize: 10.5, fontWeight: "600" },
  filterTextActive: { color: "#FFE3A0" },
  adminAnnouncements: { marginBottom: 18 },
  adminAnnouncementsTitle: { marginBottom: 10, color: "#F2BE55", fontFamily: typography.serifMedium, fontSize: 17 },
  adminAnnouncementCard: { marginBottom: 9, padding: 13, flexDirection: "row", alignItems: "flex-start", borderRadius: 16, borderWidth: 1, borderColor: "rgba(242,190,85,0.25)", backgroundColor: "rgba(242,190,85,0.07)" },
  adminAnnouncementIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#F2BE55" },
  adminAnnouncementCopy: { flex: 1, marginLeft: 11 },
  adminAnnouncementTitle: { color: "#FFF8EF", fontSize: 12.5, fontWeight: "800" },
  adminAnnouncementBody: { marginTop: 4, color: "#C9C0C8", fontSize: 10.5, lineHeight: 15 },
  adminAnnouncementAction: { marginTop: 6, color: "#F2BE55", fontSize: 9.5, fontWeight: "800" },
  feed: { gap: 8 },
  itemCard: { minHeight: 91, overflow: "hidden", padding: 12, flexDirection: "row", alignItems: "center", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.075)", backgroundColor: "rgba(22,20,29,0.84)" },
  itemAccent: { position: "absolute", top: 16, bottom: 16, left: 0, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  itemIcon: { width: 42, height: 42, marginRight: 11, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  itemCopy: { flex: 1, paddingRight: 7 },
  itemTitleRow: { flexDirection: "row", alignItems: "center" },
  itemTitle: { flexShrink: 1, color: "#FFF7EE", fontFamily: typography.serifSemibold, fontSize: 14.5 },
  unreadDot: { width: 6, height: 6, marginLeft: 7, borderRadius: 3, backgroundColor: "#F2B53D" },
  itemBody: { marginTop: 3, color: "rgba(229,218,226,0.63)", fontFamily: typography.sans, fontSize: 10.5, lineHeight: 14 },
  itemTime: { marginTop: 4, color: "rgba(242,190,85,0.66)", fontFamily: typography.sans, fontSize: 9, fontWeight: "700" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.992 }] },
  emptyCard: { minHeight: 180, alignItems: "center", justifyContent: "center", borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.03)" },
  emptyTitle: { marginTop: 10, color: "#FFF7EE", fontFamily: typography.serifSemibold, fontSize: 17 },
  emptyText: { maxWidth: 250, marginTop: 4, color: "rgba(230,220,228,0.54)", fontFamily: typography.sans, fontSize: 11, lineHeight: 16, textAlign: "center" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(3,4,9,0.74)" },
  sheet: { height: "88%", paddingTop: 9, paddingHorizontal: 17, borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderBottomWidth: 0, borderColor: "rgba(255,227,172,0.18)", backgroundColor: "#17131C" },
  handle: { width: 42, height: 4, marginBottom: 13, alignSelf: "center", borderRadius: 2, backgroundColor: "rgba(255,255,255,0.20)" },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { marginTop: 1, color: "#FFF8EF", fontFamily: typography.serifSemibold, fontSize: 22 },
  closeButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)" },
  sheetContent: { paddingTop: 17, paddingBottom: 30 },
  masterRow: { minHeight: 66, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", borderRadius: 18, borderWidth: 1, borderColor: "rgba(246,199,93,0.18)", backgroundColor: "rgba(255,255,255,0.045)" },
  masterCopy: { flex: 1, paddingRight: 10 },
  sectionLabel: { marginTop: 18, marginBottom: 8, color: "rgba(246,199,93,0.68)", fontFamily: typography.sans, fontSize: 8.5, fontWeight: "700", letterSpacing: 1.05 },
  modeRow: { flexDirection: "row", gap: 7 },
  modeChoice: { minHeight: 50, flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.035)" },
  choiceActive: { borderColor: "rgba(246,199,93,0.46)", backgroundColor: "rgba(231,168,50,0.11)" },
  modeText: { marginTop: 3, color: "#AAA1AD", fontFamily: typography.sans, fontSize: 10.5, fontWeight: "600" },
  choiceTextActive: { color: "#FFE4A0" },
  settingsGroup: { overflow: "hidden", borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.03)" },
  settingRow: { minHeight: 61, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.07)" },
  settingCopy: { flex: 1, paddingRight: 10 },
  settingTitle: { color: "#FFF7EE", fontFamily: typography.serifMedium, fontSize: 14 },
  settingDescription: { marginTop: 2, color: "rgba(230,220,228,0.52)", fontFamily: typography.sans, fontSize: 9.5, lineHeight: 13 },
  prayerChoicesBlock: { padding: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.07)" },
  prayerChoicesRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  prayerChoice: { minHeight: 36, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.035)" },
  delayBlock: { padding: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.07)" },
  delayTitle: { marginBottom: 9, color: "#FFF7EE", fontFamily: typography.serifMedium, fontSize: 13 },
  delayRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  delayChoice: { minHeight: 36, paddingHorizontal: 11, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.035)" },
  delayText: { color: "#AAA1AD", fontFamily: typography.sans, fontSize: 10, fontWeight: "700" },
  disabledChoice: { opacity: 0.45 },
  adhanUnavailable: { padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  adhanUnavailableText: { flex: 1, color: "rgba(230,220,228,0.56)", fontFamily: typography.sans, fontSize: 9.5, lineHeight: 14 },
  saveButton: { minHeight: 54, marginBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 17 },
  saveButtonPending: { backgroundColor: "#E0A83D" },
  saveButtonSaved: { backgroundColor: "#71C99F" },
  saveButtonText: { color: "#172018", fontFamily: typography.sans, fontSize: 12, fontWeight: "800" },
});
