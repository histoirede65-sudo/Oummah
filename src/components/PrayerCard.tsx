import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import type { Href } from "expo-router";
import { router, useFocusEffect } from "expo-router";
import Svg, { Circle, Ellipse } from "react-native-svg";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ActivityIndicator,
  Animated,
  AppState,
  Alert,
  Easing,
  InteractionManager,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import {
  getMosquePrayerSchedule,
  getNextPrayer,
  ADHAN_SCHEDULE_DAYS,
  type MosquePrayerKey,
  type MosquePrayerSchedule,
  type MosquePrayerTime,
  type PrayerCalculationSettings,
  DEFAULT_PRAYER_CALCULATION_SETTINGS,
  loadPrayerCalculationSettings,
  savePrayerCalculationSettings,
} from "../features/mosques/data/mosquePrayerTimes";
import {
  DEFAULT_CALENDAR_SETTINGS,
  loadCalendarSettings,
} from "../features/calendar/CalendarStore";
import {
  findNextEvent,
  formatHijri,
  getHijriDate,
} from "../features/calendar/IslamicCalendar";
import {
  getMainMosque,
  type StoredMosque,
} from "../features/mosques/data/mosquePreferences";
import {
  applyApprovedMosquePrayerTimes,
  getApprovedMosquePrayerTimes,
} from "../features/mosques/data/mosquePrayerUpdates";
import { getValidSession } from "../features/auth/SupabaseAuthService";
import { syncPrayerTimesWidget } from "../features/prayer-widget/PrayerWidgetSync";
import { goalProgressBridge } from "../features/daily-goals/services/goalProgressBridge";
import {
  loadPrayerCompletions,
  REQUIRED_PRAYERS,
  togglePrayerCompletion,
} from "../features/prayers/PrayerCompletionStore";
import { storageService } from "../core/storage/StorageService";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import {
  DEFAULT_ADHAN_PREFERENCES,
  loadAdhanPreferences,
  saveAdhanPreferences,
  type AdhanAlertMode,
  type AdhanPreferences,
  type AdhanVoice,
} from "../features/adhan/AdhanPreferences";
import {
  getAdhanNotificationDiagnostics,
  requestAdhanNotificationPermission,
  scheduleAdhanTestNotification,
  syncAdhanNotifications,
} from "../features/adhan/AdhanNotifications";
import AppHeader from "./AppHeader";
import { useI18n, type TranslationKey } from "../i18n";

const PRAYER_LABEL_KEYS: Record<MosquePrayerKey, TranslationKey> = {
  Fajr: "prayer.fajr",
  Dhuhr: "prayer.dhuhr",
  Asr: "prayer.asr",
  Maghrib: "prayer.maghrib",
  Isha: "prayer.isha",
};

const HOME_NIGHT_TRANSITION_SEEN_DATE_KEY = "homeNightTransitionSeenDate";
const HOME_DAY_TRANSITION_SEEN_DATE_KEY = "homeDayTransitionSeenDate";
const HOME_TRANSITION_DEVICE_ID_KEY = "homeTransitionDeviceId";

type HomeBackgroundVisualState =
  | "steady-day"
  | "steady-night"
  | "transitioning-day-to-night"
  | "transitioning-night-to-day";

function localDateKey(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function previousLocalDateKey(timestamp: number) {
  const date = new Date(timestamp);
  date.setDate(date.getDate() - 1);
  return localDateKey(date.getTime());
}

const ADHAN_PRAYERS: MosquePrayerKey[] = [
  "Fajr",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
];

const ADHAN_MODES: ReadonlyArray<{
  key: AdhanAlertMode;
  labelKey: TranslationKey;
  icon: "volume-high-outline" | "phone-portrait-outline" | "notifications-outline" | "notifications-off-outline";
}> = [
  { key: "adhan", labelKey: "prayer.alertAdhan", icon: "volume-high-outline" },
  { key: "notification", labelKey: "prayer.alertNotification", icon: "notifications-outline" },
  { key: "vibration", labelKey: "prayer.alertVibration", icon: "phone-portrait-outline" },
  { key: "silent", labelKey: "prayer.alertSilent", icon: "notifications-off-outline" },
];

const ADHAN_LEAD_TIMES = [0, 5, 10, 15, 30] as const;
const PRAYER_ANGLES = [12, 15, 16, 17, 17.5, 18, 18.5, 19.5, 20] as const;
const CALCULATION_GUIDE_STORAGE_KEY =
  "oummah:first-visit-guide:v1:prayer-calculation-method";
const ADHAN_VOICES: ReadonlyArray<{ key: AdhanVoice; labelKey: TranslationKey; file: number }> = [
  { key: "makkah", labelKey: "prayer.voiceMakkah", file: require("../../assets/adhan/adhan_makkah.mp3") },
  { key: "madinah", labelKey: "prayer.voiceMadinah", file: require("../../assets/adhan/adhan_madinah.mp3") },
  { key: "egypt", labelKey: "prayer.voiceEgypt", file: require("../../assets/adhan/adhan_egypt.mp3") },
  { key: "birds", labelKey: "prayer.voiceBirds", file: require("../../assets/adhan/adhan_birds.wav") },
];

type PrayerSource = {
  latitude: number;
  longitude: number;
  label: string;
  type: "mosque" | "location";
};

type TimelineItem = {
  key: MosquePrayerKey | "Sunrise";
  label: string;
  time: string;
  timestamp: number;
  icon: "partly-sunny-outline" | "sunny-outline" | "moon-outline";
  active: boolean;
};

const ORBIT_POSITIONS: ReadonlyArray<{
  left: `${number}%`;
  top: number;
}> = [
  { left: "4%", top: 66 },
  { left: "19%", top: 9 },
  { left: "41%", top: 8 },
  { left: "63%", top: 9 },
  { left: "79%", top: 66 },
  { left: "41%", top: 88 },
];

const ORBIT_ANGLES = [2.96, 4.1, 4.71, 5.33, 6.46, 7.85, 9.24] as const;

function getOrbitMarker(timeline: TimelineItem[], now: number) {
  const timestamps = timeline.map((prayer) => prayer.timestamp);

  if (timestamps.length !== 6 || timestamps.some((timestamp) => !timestamp)) {
    return null;
  }

  const day = 24 * 60 * 60 * 1_000;
  let adjustedNow = now;

  if (adjustedNow < timestamps[0]) {
    adjustedNow += day;
  }

  const cycle = [...timestamps, timestamps[0] + day];
  const normalized = cycle.map((timestamp, index) =>
    index > 0 && timestamp < cycle[index - 1] ? timestamp + day : timestamp,
  );

  let segment = normalized.length - 2;

  for (let index = 0; index < normalized.length - 1; index += 1) {
    if (adjustedNow >= normalized[index] && adjustedNow <= normalized[index + 1]) {
      segment = index;
      break;
    }
  }

  const start = normalized[segment];
  const end = normalized[segment + 1];
  const progress = Math.min(1, Math.max(0, (adjustedNow - start) / (end - start)));
  const angle =
    ORBIT_ANGLES[segment] +
    (ORBIT_ANGLES[segment + 1] - ORBIT_ANGLES[segment]) * progress;

  return {
    x: 500 + 438 * Math.cos(angle),
    y: 72 + 46 * Math.sin(angle),
  };
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
}

const PrayerCountdown = memo(function PrayerCountdown({
  timestamp,
}: {
  timestamp: number | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useFocusEffect(
    useCallback(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(intervalId);
    }, []),
  );

  return <Text allowFontScaling={false} style={styles.countdown}>{timestamp ? formatCountdown(timestamp - now) : "--:--:--"}</Text>;
});

function formatDateLabel(date: Date, locale = "fr-FR") {
  const formatted = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getLocalDayStart(timestamp: number) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function getPrayerWidgetSunrise(fajr: MosquePrayerTime) {
  const sunrise = new Date(fajr.timestamp + 90 * 60 * 1_000);
  return {
    key: "Sunrise",
    label: "Chourouk",
    time: [
      String(sunrise.getHours()).padStart(2, "0"),
      String(sunrise.getMinutes()).padStart(2, "0"),
    ].join(":"),
    timestamp: sunrise.getTime(),
  };
}

function getPrayerByKey(schedule: MosquePrayerSchedule, key: MosquePrayerKey) {
  return schedule.prayers.find((prayer) => prayer.key === key);
}

function makeTimeline(
  schedule: MosquePrayerSchedule,
  currentPrayer: MosquePrayerTime | null,
): TimelineItem[] {
  const fajr = getPrayerByKey(schedule, "Fajr");
  const dhuhr = getPrayerByKey(schedule, "Dhuhr");
  const asr = getPrayerByKey(schedule, "Asr");
  const maghrib = getPrayerByKey(schedule, "Maghrib");
  const isha = getPrayerByKey(schedule, "Isha");
  const sunrise = fajr ? new Date(fajr.timestamp + 90 * 60 * 1_000) : null;
  const sunriseLabel = sunrise
    ? [
        String(sunrise.getHours()).padStart(2, "0"),
        String(sunrise.getMinutes()).padStart(2, "0"),
      ].join(":")
    : "--:--";

  const isActive = (prayer?: MosquePrayerTime) =>
    Boolean(prayer && currentPrayer?.key === prayer.key);

  return [
    {
      key: "Fajr",
      label: "Fajr",
      time: fajr?.time ?? "--:--",
      timestamp: fajr?.timestamp ?? 0,
      icon: "partly-sunny-outline",
      active: isActive(fajr),
    },
    {
      key: "Sunrise",
      label: "Chourouk",
      time: sunriseLabel,
      timestamp: sunrise?.getTime() ?? 0,
      icon: "sunny-outline",
      active: false,
    },
    {
      key: "Dhuhr",
      label: "Dhuhr",
      time: dhuhr?.time ?? "--:--",
      timestamp: dhuhr?.timestamp ?? 0,
      icon: "sunny-outline",
      active: isActive(dhuhr),
    },
    {
      key: "Asr",
      label: "Asr",
      time: asr?.time ?? "--:--",
      timestamp: asr?.timestamp ?? 0,
      icon: "partly-sunny-outline",
      active: isActive(asr),
    },
    {
      key: "Maghrib",
      label: "Maghrib",
      time: maghrib?.time ?? "--:--",
      timestamp: maghrib?.timestamp ?? 0,
      icon: "partly-sunny-outline",
      active: isActive(maghrib),
    },
    {
      key: "Isha",
      label: "Isha",
      time: isha?.time ?? "--:--",
      timestamp: isha?.timestamp ?? 0,
      icon: "moon-outline",
      active: isActive(isha),
    },
  ];
}

function getLastPassedPrayer(
  schedule: MosquePrayerSchedule,
  now: number,
): MosquePrayerTime | null {
  return (
    [...schedule.prayers]
      .filter((prayer) => prayer.timestamp <= now)
      .sort((left, right) => right.timestamp - left.timestamp)[0] ?? null
  );
}

async function resolvePrayerSource(
  mainMosque: StoredMosque | null,
): Promise<PrayerSource> {
  if (mainMosque) {
    return {
      latitude: mainMosque.latitude,
      longitude: mainMosque.longitude,
      label: mainMosque.name,
      type: "mosque",
    };
  }

  const permission = await Location.requestForegroundPermissionsAsync();

  if (!permission.granted) {
    throw new Error("LOCATION_DENIED");
  }

  const lastKnown = await Location.getLastKnownPositionAsync();
  const position =
    lastKnown ??
    (await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }));

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    label: "Votre position actuelle",
    type: "location",
  };
}

export default function PrayerCard({ onScheduleChange }: { onScheduleChange?: (schedule: MosquePrayerSchedule) => void }) {
  const { language, t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const compact = width < 375 || height < 700;
  // The prayer orbit has a deliberately dense layout. Scale it down on
  // narrow phones so labels remain inside the card instead of being clipped.
  const orbitScale = Math.min(1, Math.max(0.72, (width - 32) / 343));
  const [mainMosque, setMainMosque] = useState<StoredMosque | null>(null);
  const [mainMosqueLoaded, setMainMosqueLoaded] = useState(false);
  const [mainMosqueJumuah, setMainMosqueJumuah] = useState<string | null>(null);
  const [source, setSource] = useState<PrayerSource | null>(null);
  const [manualSource, setManualSource] = useState<PrayerSource | null>(null);
  const [schedule, setSchedule] = useState<MosquePrayerSchedule | null>(null);
  const [completedPrayers, setCompletedPrayers] = useState<MosquePrayerKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [calculationSettings, setCalculationSettings] = useState<PrayerCalculationSettings>(DEFAULT_PRAYER_CALCULATION_SETTINGS);
  const [now, setNow] = useState(() => Date.now());
  const [transitionStorageReady, setTransitionStorageReady] = useState(false);
  const [nightTransitionSeenDate, setNightTransitionSeenDate] = useState<string | null>(null);
  const [dayTransitionSeenDate, setDayTransitionSeenDate] = useState<string | null>(null);
  const [cardSize, setCardSize] = useState({ width: 0, height: 0 });
  const [transitionStorageKeys, setTransitionStorageKeys] = useState<{
    night: string;
    day: string;
  } | null>(null);
  const [transitionState, setTransitionState] = useState<HomeBackgroundVisualState | null>(null);
  const [calendarSettings, setCalendarSettings] = useState(
    DEFAULT_CALENDAR_SETTINGS,
  );
  const [adhanPreferences, setAdhanPreferences] = useState<AdhanPreferences>(
    DEFAULT_ADHAN_PREFERENCES,
  );
  const [adhanSettingsVisible, setAdhanSettingsVisible] = useState(false);
  const [calculationOptionsVisible, setCalculationOptionsVisible] = useState(false);
  const [calculationGuideVisible, setCalculationGuideVisible] = useState(false);
  const [locationOptionsVisible, setLocationOptionsVisible] = useState(false);
  const [orbitLayoutReady, setOrbitLayoutReady] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [cityLoading, setCityLoading] = useState(false);
  const [adhanPreferencesLoaded, setAdhanPreferencesLoaded] = useState(false);
  const [adhanTestUnlocked, setAdhanTestUnlocked] = useState(false);
  const [adhanCoverageLoading, setAdhanCoverageLoading] = useState(false);
  const [adhanCoverage, setAdhanCoverage] = useState<Awaited<ReturnType<typeof getAdhanNotificationDiagnostics>> | null>(null);
  const [adhanCoverageError, setAdhanCoverageError] = useState(false);
  // One player for every voice preview: the ▶ of a voice loads that voice.
  const adhanPlayer = useAudioPlayer(ADHAN_VOICES[0].file);
  const adhanPlayerStatus = useAudioPlayerStatus(adhanPlayer);
  const [previewVoice, setPreviewVoice] = useState<AdhanVoice | null>(null);
  const adhanScrollRef = useRef<ScrollView>(null);
  const calculationSectionY = useRef(0);
  const scrollToCalculation = useRef(false);

  // The preview stops when the sheet closes.
  useEffect(() => {
    if (!adhanSettingsVisible && adhanPlayerStatus.playing) adhanPlayer.pause();
  }, [adhanPlayer, adhanPlayerStatus.playing, adhanSettingsVisible]);

  /** « Prochaine alerte : Asr à 15:42 · Oiseaux apaisants » — reassures that the settings work. */
  const nextAdhanAlert = useMemo(() => {
    if (!schedule || !adhanPreferences.enabled) return null;
    const lead = adhanPreferences.leadMinutes * 60_000;
    const next = [...schedule.prayers, ...schedule.tomorrowPrayers, ...(schedule.futurePrayers ?? [])]
      .filter((prayer) => adhanPreferences.prayers[prayer.key] && prayer.timestamp - lead > now)
      .sort((left, right) => left.timestamp - right.timestamp)[0];
    if (!next) return null;
    const at = new Date(next.timestamp - lead);
    const today = new Date(now);
    const time = at.toLocaleTimeString(language === "en" ? "en-GB" : "fr-FR", { hour: "2-digit", minute: "2-digit" });
    const prayer = t(PRAYER_LABEL_KEYS[next.key]);
    const label = at.toDateString() === today.toDateString()
      ? t("prayer.nextAlert", { prayer, time })
      : t("prayer.nextAlertTomorrow", { prayer, time });
    const kind = adhanPreferences.mode === "adhan"
      ? t(ADHAN_VOICES.find((voice) => voice.key === adhanPreferences.voice)?.labelKey ?? "prayer.alertAdhan")
      : t(ADHAN_MODES.find((mode) => mode.key === adhanPreferences.mode)?.labelKey ?? "prayer.alertNotification");
    return `${label} · ${kind}`;
  }, [adhanPreferences, language, now, schedule, t]);
  const orbitGlow = useRef(new Animated.Value(0.32)).current;
  const waitingForLocationSettingsRef = useRef(false);
  const adhanTitleTapCountRef = useRef(0);
  const adhanTitleTapResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prayerDateKey = localDateKey(now);

  const testSelectedAdhan = useCallback(async () => {
    try {
      await scheduleAdhanTestNotification();
      Alert.alert("Test Adhan programmé", "La notification va apparaître dans environ 18 secondes.");
    } catch (error) {
      Alert.alert("Test Adhan impossible", error instanceof Error ? error.message : "Notifications non disponibles.");
    }
  }, []);

  const inspectAdhanCoverage = useCallback(async () => {
    if (!__DEV__) return;
    if (__DEV__) console.log("[AdhanCoverage] press");
    setAdhanCoverage(null);
    setAdhanCoverageError(false);
    setAdhanCoverageLoading(true);
    try {
      const diagnostics = await getAdhanNotificationDiagnostics();
      if (__DEV__) console.log("[AdhanCoverage] result", diagnostics);
      setAdhanCoverage(diagnostics);
    } catch (error) {
      setAdhanCoverageError(true);
      if (__DEV__) console.error("[Adhan coverage diagnostic]", error);
    } finally {
      setAdhanCoverageLoading(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (adhanTitleTapResetRef.current) clearTimeout(adhanTitleTapResetRef.current);
    };
  }, []);

  const handleAdhanTitlePress = useCallback(() => {
    if (!__DEV__ || adhanTestUnlocked) return;
    adhanTitleTapCountRef.current += 1;
    if (adhanTitleTapResetRef.current) clearTimeout(adhanTitleTapResetRef.current);
    if (adhanTitleTapCountRef.current >= 7) {
      adhanTitleTapCountRef.current = 0;
      setAdhanTestUnlocked(true);
      return;
    }
    adhanTitleTapResetRef.current = setTimeout(() => {
      adhanTitleTapCountRef.current = 0;
    }, 3000);
  }, [adhanTestUnlocked]);

  useEffect(() => {
    let active = true;
    void loadPrayerCompletions(prayerDateKey).then(async (completed) => {
      if (!active) return;
      setCompletedPrayers(completed);
      await Promise.all(
        completed.map((prayer) =>
          goalProgressBridge.setEvidence(
            "prayer_completed",
            `prayer:${prayerDateKey}:${prayer.toLowerCase()}`,
            true,
          ),
        ),
      );
    });
    return () => {
      active = false;
    };
  }, [prayerDateKey]);

  const togglePrayer = useCallback(async (prayer: MosquePrayerKey) => {
    if (!REQUIRED_PRAYERS.includes(prayer)) return;
    const completed = await togglePrayerCompletion(prayerDateKey, prayer);
    setCompletedPrayers(completed);
    await goalProgressBridge.setEvidence(
      "prayer_completed",
      `prayer:${prayerDateKey}:${prayer.toLowerCase()}`,
      completed.includes(prayer),
    );
  }, [prayerDateKey]);

  // Reloaded on every app resume: readiness is not reset, so a running day/night animation is not
  // cut and replayed from the start.
  const loadTransitionMarkers = useCallback(async () => {
    try {
      const session = await getValidSession().catch(() => null);
      let identity = session?.user.id ?? await storageService.getString(HOME_TRANSITION_DEVICE_ID_KEY);
      if (!identity) {
        identity = `anonymous-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        await storageService.setString(HOME_TRANSITION_DEVICE_ID_KEY, identity);
      }

      const keys = {
        night: `${HOME_NIGHT_TRANSITION_SEEN_DATE_KEY}:${identity}`,
        day: `${HOME_DAY_TRANSITION_SEEN_DATE_KEY}:${identity}`,
      };
      const [nightSeenDate, daySeenDate] = await Promise.all([
        storageService.getString(keys.night),
        storageService.getString(keys.day),
      ]);
      setTransitionStorageKeys(keys);
      setNightTransitionSeenDate(nightSeenDate);
      setDayTransitionSeenDate(daySeenDate);
    } catch {
      setTransitionStorageKeys(null);
      setNightTransitionSeenDate(null);
      setDayTransitionSeenDate(null);
    } finally {
      setTransitionStorageReady(true);
    }
  }, []);

  useEffect(() => {
    void loadTransitionMarkers();
  }, [loadTransitionMarkers]);

  const retryLocationAccess = useCallback(async () => {
    const current = await Location.getForegroundPermissionsAsync().catch(() => null);

    if (current?.granted) {
      setRefreshKey((value) => value + 1);
      return;
    }

    const requested = current?.canAskAgain
      ? await Location.requestForegroundPermissionsAsync().catch(() => null)
      : current;

    if (requested?.granted) {
      setRefreshKey((value) => value + 1);
      return;
    }

    Alert.alert(
      "Localisation nécessaire",
      "Autorisez la localisation dans les réglages du téléphone pour afficher les horaires de prière.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Ouvrir les réglages",
          onPress: () => {
            waitingForLocationSettingsRef.current = true;
            void Linking.openSettings().catch(() => undefined);
          },
        },
      ],
    );
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active" || !waitingForLocationSettingsRef.current) return;
      waitingForLocationSettingsRef.current = false;
      void Location.getForegroundPermissionsAsync()
        .then((permission) => {
          if (permission.granted) setRefreshKey((value) => value + 1);
        })
        .catch(() => undefined);
    });

    return () => subscription.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      setOrbitLayoutReady(false);
      const task = InteractionManager.runAfterInteractions(() => {
        setOrbitLayoutReady(true);
      });
      return () => task.cancel();
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(orbitGlow, {
          toValue: 0.82,
          duration: 1450,
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(orbitGlow, {
          toValue: 0.32,
          duration: 1450,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ]),
    );

    pulse.start();
    return () => pulse.stop();
    }, [orbitGlow]),
  );

  const updateAdhanPreferences = useCallback(
    (update: (current: AdhanPreferences) => AdhanPreferences) => {
      setAdhanPreferences((current) => {
        const next = update(current);
        void saveAdhanPreferences(next).catch(() => undefined);
        return next;
      });
    },
    [],
  );

  const toggleAdhanAlerts = useCallback(
    async (enabled: boolean) => {
      if (!enabled) {
        updateAdhanPreferences((current) => ({ ...current, enabled: false }));
        return;
      }

      const permissionGranted = await requestAdhanNotificationPermission().catch(
        () => false,
      );

      if (!permissionGranted) {
        Alert.alert(
          t("prayer.permissionRequired"),
          t("prayer.notificationPermissionMessage"),
        );
        return;
      }

      updateAdhanPreferences((current) => ({ ...current, enabled: true }));
    },
    [t, updateAdhanPreferences],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        const mosque = await getMainMosque().catch(() => null);

        if (active) {
          setMainMosque(mosque);
          if (mosque) {
            const approved = await getApprovedMosquePrayerTimes(mosque.id).catch(() => null);
            if (active) setMainMosqueJumuah(approved?.jumuah ?? null);
          } else {
            setMainMosqueJumuah(null);
          }
          setMainMosqueLoaded(true);
        }
      };

      void load();

      return () => {
        active = false;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      void loadCalendarSettings()
        .then((settings) => {
          if (active) setCalendarSettings(settings);
        })
        .catch(() => undefined);

      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    let active = true;

    void loadAdhanPreferences().then((preferences) => {
      if (active) setAdhanPreferences(preferences);
    }).finally(() => {
      if (active) setAdhanPreferencesLoaded(true);
    });

    return () => {
      active = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadPrayerCalculationSettings()
        .then((settings) => {
          if (active) setCalculationSettings(settings);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []),
  );

  useEffect(() => {
    if (!schedule || !adhanPreferencesLoaded) return;
    void syncAdhanNotifications(schedule, adhanPreferences).catch(() => undefined);
  }, [adhanPreferences, adhanPreferencesLoaded, schedule]);

  // New day: reload once tomorrow's Fajr has passed. Checked on every clock tick (30 s, prayer
  // transitions, app resume) instead of a multi-hour timer, which Android delays or drops while the
  // phone sleeps. A failed reload (no network on wake-up) is retried at most once a minute.
  const lastScheduleRefreshAttemptRef = useRef(0);
  useEffect(() => {
    if (!schedule || now < schedule.tomorrowFajr.timestamp) return;
    if (Date.now() - lastScheduleRefreshAttemptRef.current < 60_000) return;
    lastScheduleRefreshAttemptRef.current = Date.now();
    setRefreshKey((value) => value + 1);
  }, [now, schedule]);

  useEffect(() => {
    const maghrib = schedule?.prayers.find((prayer) => prayer.key === "Maghrib")?.timestamp;
    const isha = schedule?.prayers.find((prayer) => prayer.key === "Isha")?.timestamp;
    if (!maghrib || !isha || isha <= maghrib) return;
    const delay = maghrib + (isha - maghrib) / 2 - Date.now();
    if (delay <= 0) return;
    const timer = setTimeout(() => setNow(Date.now()), delay + 50);
    return () => clearTimeout(timer);
  }, [schedule]);

  useEffect(() => {
      let prayerTransitionTimeout: ReturnType<typeof setTimeout> | null = null;

      const refreshNow = () => setNow(Date.now());
      const schedulePrayerTransition = () => {
        if (!schedule) return;

        const nextPrayer = getNextPrayer(schedule);
        if (!nextPrayer) return;

        prayerTransitionTimeout = setTimeout(() => {
          refreshNow();
          schedulePrayerTransition();
        }, Math.max(100, nextPrayer.timestamp - Date.now() + 50));
      };

      refreshNow();
      schedulePrayerTransition();
      const intervalId = setInterval(refreshNow, 30_000);
      const appStateSubscription = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          refreshNow();
          void loadTransitionMarkers();
          if (schedule && adhanPreferencesLoaded) {
            void syncAdhanNotifications(schedule, adhanPreferences).catch(() => undefined);
          }
        }
      });

      return () => {
        clearInterval(intervalId);
        appStateSubscription.remove();
        if (prayerTransitionTimeout) clearTimeout(prayerTransitionTimeout);
      };
    }, [adhanPreferences, adhanPreferencesLoaded, loadTransitionMarkers, schedule]);

  useEffect(() => {
    if (!mainMosqueLoaded) return;

    const controller = new AbortController();

    const loadPrayerTimes = async () => {
      if (!schedule) setLoading(true);
      setErrorMessage("");

      try {
        const resolvedSource = manualSource ?? await resolvePrayerSource(mainMosque);
        if (resolvedSource.type === "location" && !manualSource) {
          const places = await Location.reverseGeocodeAsync({
            latitude: resolvedSource.latitude,
            longitude: resolvedSource.longitude,
          }).catch(() => []);
          const place = places[0];
          const label = [place?.city, place?.country].filter(Boolean).join(", ");
          if (label) resolvedSource.label = label;
        }
        const result = await getMosquePrayerSchedule(
          resolvedSource.latitude,
          resolvedSource.longitude,
          controller.signal,
          calculationSettings,
          ADHAN_SCHEDULE_DAYS,
        );

        const approved = mainMosque && !manualSource
          ? await getApprovedMosquePrayerTimes(mainMosque.id).catch(() => null)
          : null;
        const adjustedResult = calculationSettings.scheduleSource === "mosque"
          ? applyApprovedMosquePrayerTimes(result, approved)
          : result;

        if (!controller.signal.aborted) {
          setSource(resolvedSource);
          setSchedule(adjustedResult);
          onScheduleChange?.(adjustedResult);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (!controller.signal.aborted) {
          setErrorMessage(
            error instanceof Error && error.message === "LOCATION_DENIED"
              ? "Autorisez la localisation ou choisissez votre mosquée."
              : "Les horaires sont momentanément indisponibles.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadPrayerTimes();

    return () => controller.abort();
  }, [mainMosqueLoaded, mainMosque?.id, mainMosque?.latitude, mainMosque?.longitude, manualSource?.latitude, manualSource?.longitude, refreshKey, calculationSettings]);

  const openCalculationSettings = async () => {
    const seen = await storageService
      .get<boolean>(CALCULATION_GUIDE_STORAGE_KEY)
      .catch(() => false);

    if (seen === true) {
      setCalculationOptionsVisible(true);
      scrollToCalculation.current = true;
      setAdhanSettingsVisible(true);
      return;
    }

    setCalculationGuideVisible(true);
  };

  const closeCalculationGuideAndOpenSettings = async () => {
    setCalculationGuideVisible(false);
    await storageService
      .set(CALCULATION_GUIDE_STORAGE_KEY, true)
      .catch(() => undefined);
    setCalculationOptionsVisible(true);
    scrollToCalculation.current = true;
    setAdhanSettingsVisible(true);
  };

  const updateCalculationSettings = (patch: Partial<PrayerCalculationSettings>) => {
    const next: PrayerCalculationSettings = { ...calculationSettings, mode: "custom", ...patch };
    setCalculationSettings(next);
    void savePrayerCalculationSettings(next);
  };

  const togglePreview = (voice: AdhanVoice) => {
    if (previewVoice === voice && adhanPlayerStatus.playing) {
      adhanPlayer.pause();
      return;
    }
    if (previewVoice !== voice) {
      adhanPlayer.replace(ADHAN_VOICES.find((item) => item.key === voice)?.file ?? ADHAN_VOICES[0].file);
      setPreviewVoice(voice);
    } else {
      void adhanPlayer.seekTo(0);
    }
    adhanPlayer.play();
  };

  const usesMosqueTimes = calculationSettings.scheduleSource === "mosque" && source?.type === "mosque";

  const chooseCity = async () => {
    const query = cityQuery.trim();
    if (!query) return;
    setCityLoading(true);
    const places = await Location.geocodeAsync(query).catch(() => []);
    const place = places[0];
    if (!place) {
      Alert.alert(t("prayer.cityNotFound"), t("prayer.cityNotFoundMessage"));
      setCityLoading(false);
      return;
    }
    const reversePlaces = await Location.reverseGeocodeAsync({
      latitude: place.latitude,
      longitude: place.longitude,
    }).catch(() => []);
    const reversePlace = reversePlaces[0];
    const label = [reversePlace?.city, reversePlace?.country]
      .filter(Boolean)
      .join(", ") || query;
    setManualSource({
      latitude: place.latitude,
      longitude: place.longitude,
      label,
      type: "location",
    });
    setCityQuery("");
    setCityLoading(false);
    setLocationOptionsVisible(false);
  };

  const fridayJumuahPrayer = useMemo(() => {
    if (
      !schedule ||
      new Date(now).getDay() !== 5 ||
      !mainMosqueJumuah ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(mainMosqueJumuah)
    ) {
      return null;
    }

    const dhuhr = getPrayerByKey(schedule, "Dhuhr");
    if (!dhuhr) return null;
    const [hours, minutes] = mainMosqueJumuah.split(":").map(Number);
    const jumuahDate = new Date(dhuhr.timestamp);
    jumuahDate.setHours(hours, minutes, 0, 0);
    return {
      ...dhuhr,
      label: "Joumou’a",
      time: mainMosqueJumuah,
      timestamp: jumuahDate.getTime(),
    };
  }, [mainMosqueJumuah, now, schedule]);
  const nextPrayer = useMemo(() => {
    if (!schedule) return null;
    const scheduledNextPrayer = getNextPrayer(schedule, now);
    const fajr = getPrayerByKey(schedule, "Fajr");
    if (
      fridayJumuahPrayer &&
      fajr &&
      now >= fajr.timestamp &&
      now < fridayJumuahPrayer.timestamp
    ) {
      return fridayJumuahPrayer;
    }
    return scheduledNextPrayer;
  }, [fridayJumuahPrayer, now, schedule]);
  const currentPrayer = useMemo(
    () => {
      if (!schedule) return null;

      const lastPrayer =
        getLastPassedPrayer(schedule, now) ??
        schedule.prayers[schedule.prayers.length - 1] ??
        null;

      if (!lastPrayer) return null;

      if (lastPrayer.key === "Fajr") {
        if (now > lastPrayer.timestamp + 60 * 60 * 1000) {
          return null;
        }
      }

      if (lastPrayer.key === "Isha") {
        const fajr = getPrayerByKey(schedule, "Fajr");
        if (fajr) {
          const midpoint = lastPrayer.timestamp + ((fajr.timestamp + 24 * 60 * 60 * 1000) - lastPrayer.timestamp) / 2;
          const adjustedNow = now < fajr.timestamp ? now + 24 * 60 * 60 * 1000 : now;
          if (adjustedNow > midpoint) {
            return null;
          }
        }
      }

      return lastPrayer;
    },
    [now, schedule],
  );
  const timeline = useMemo(
    () => (schedule ? makeTimeline(schedule, currentPrayer) : []),
    [currentPrayer, schedule],
  );
  const orbitMarker = useMemo(() => getOrbitMarker(timeline, now), [now, timeline]);
  const jumuahMinutes = mainMosqueJumuah
    ? Number(mainMosqueJumuah.slice(0, 2)) * 60 + Number(mainMosqueJumuah.slice(3, 5))
    : null;
  const currentMinutes = new Date(now).getHours() * 60 + new Date(now).getMinutes();
  const showFridayJumuah =
    new Date(now).getDay() === 5 &&
    jumuahMinutes !== null &&
    currentMinutes < jumuahMinutes;
  const calendarDate = useMemo(() => new Date(now), [now]);
  const hijriDate = useMemo(
    () =>
      getHijriDate(
        calendarDate,
        calendarSettings.method,
        calendarSettings.adjustment,
        calendarSettings.country,
      ),
    [calendarDate, calendarSettings],
  );
  useEffect(() => {
    const todayAnchor = schedule?.prayers[0];
    const tomorrowAnchor = schedule?.tomorrowPrayers[0];
    if (!schedule || !todayAnchor || !tomorrowAnchor) return;

    const todayDate = new Date(todayAnchor.timestamp);
    const tomorrowDate = new Date(tomorrowAnchor.timestamp);
    const tomorrowHijriDate = getHijriDate(
      tomorrowDate,
      calendarSettings.method,
      calendarSettings.adjustment,
      calendarSettings.country,
    );

    void syncPrayerTimesWidget({
      today: {
        dateKey: schedule.dateKey,
        startTimestamp: getLocalDayStart(todayAnchor.timestamp),
        frenchDate: formatDateLabel(todayDate),
        hijriDate: formatHijri(getHijriDate(
          todayDate,
          calendarSettings.method,
          calendarSettings.adjustment,
          calendarSettings.country,
        )),
        prayers: schedule.prayers,
        sunrise: getPrayerWidgetSunrise(todayAnchor),
      },
      tomorrow: {
        dateKey: tomorrowDate.toISOString().slice(0, 10),
        startTimestamp: getLocalDayStart(tomorrowAnchor.timestamp),
        frenchDate: formatDateLabel(tomorrowDate),
        hijriDate: formatHijri(tomorrowHijriDate),
        prayers: schedule.tomorrowPrayers,
        sunrise: getPrayerWidgetSunrise(tomorrowAnchor),
      },
    });
  }, [calendarSettings, schedule]);
  const nextIslamicEvent = useMemo(
    () =>
      findNextEvent(
        calendarDate,
        calendarSettings.method,
        calendarSettings.adjustment,
        calendarSettings.country,
      ),
    [calendarDate, calendarSettings],
  );
  const hijriEventLabel = nextIslamicEvent
    ? nextIslamicEvent.days === 0
      ? t("prayer.eventToday", { event: nextIslamicEvent.event.shortTitle })
      : t("prayer.eventInDays", {
          event: nextIslamicEvent.event.shortTitle,
          days: nextIslamicEvent.days,
        })
    : t("prayer.openIslamicCalendar");

  const translatedPrayerLabel = (key: MosquePrayerKey | "Sunrise", label?: string) => {
    if (label === "Joumou’a") return t("prayer.jumuah");
    if (key === "Sunrise") return t("prayer.sunrise");
    return t(PRAYER_LABEL_KEYS[key]);
  };

  const maghribTime = schedule?.prayers.find((prayer) => prayer.key === "Maghrib")?.timestamp;
  const ishaTime = schedule?.prayers.find((prayer) => prayer.key === "Isha")?.timestamp;
  const fajrTime = schedule?.prayers.find((prayer) => prayer.key === "Fajr")?.timestamp;
  const nightStartsAt = maghribTime && ishaTime && ishaTime > maghribTime
    ? maghribTime + (ishaTime - maghribTime) / 2
    : null;
  const isBeforeTodayFajr = Boolean(fajrTime && now < fajrTime);
  const isAfterNightStartBeforeTomorrowFajr = Boolean(
    nightStartsAt &&
    schedule?.tomorrowFajr &&
    now >= nightStartsAt &&
    now < schedule.tomorrowFajr.timestamp,
  );
  const isNightBackground = isBeforeTodayFajr || isAfterNightStartBeforeTomorrowFajr;
  const daySource = require("../assets/images/home/home-mosque-sunset.jpg");
  const nightSource = require("../assets/images/home/home-mosque-night.jpg");
  const nightRevealProgress = useRef(new Animated.Value(0)).current;
  const nightTransitionDateKey = isBeforeTodayFajr && fajrTime
    ? previousLocalDateKey(fajrTime)
    : nightStartsAt
      ? localDateKey(nightStartsAt)
      : null;
  const dayTransitionDateKey = fajrTime ? localDateKey(fajrTime) : null;
  const transitionDateKey = isNightBackground ? nightTransitionDateKey : dayTransitionDateKey;
  const transitionSeenDate = isNightBackground ? nightTransitionSeenDate : dayTransitionSeenDate;
  const transitionStorageKey = isNightBackground
    ? transitionStorageKeys?.night
    : transitionStorageKeys?.day;

  useEffect(() => {
    if (
      !transitionStorageReady ||
      !transitionDateKey ||
      !transitionStorageKey ||
      cardSize.width <= 0 ||
      cardSize.height <= 0
    ) return;

    nightRevealProgress.stopAnimation();
    if (transitionSeenDate === transitionDateKey) {
      setTransitionState(isNightBackground ? "steady-night" : "steady-day");
      nightRevealProgress.setValue(isNightBackground ? 1 : 0);
      return;
    }

    setTransitionState(
      isNightBackground
        ? "transitioning-day-to-night"
        : "transitioning-night-to-day",
    );
    nightRevealProgress.setValue(isNightBackground ? 0 : 1);

    const animation = Animated.timing(nightRevealProgress, {
      toValue: isNightBackground ? 1 : 0,
      duration: 2800,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    });
    animation.start(({ finished }) => {
      if (!finished) return;

      if (isNightBackground) {
        setNightTransitionSeenDate(transitionDateKey);
        setTransitionState("steady-night");
      } else {
        setDayTransitionSeenDate(transitionDateKey);
        setTransitionState("steady-day");
      }
      void storageService.setString(transitionStorageKey, transitionDateKey).catch(() => undefined);
    });

    return () => animation.stop();
  }, [
    dayTransitionSeenDate,
    isNightBackground,
    nightRevealProgress,
    cardSize.height,
    cardSize.width,
    transitionDateKey,
    transitionSeenDate,
    transitionStorageKeys,
    transitionStorageKey,
    transitionStorageReady,
  ]);

  const isDayToNightTransition = transitionState === "transitioning-day-to-night";
  const isNightToDayTransition = transitionState === "transitioning-night-to-day";
  // Until the transition state is known (cold start), show the image matching the time of day
  // instead of always the day one.
  const baseSource = transitionState === "steady-night" || isNightToDayTransition || (transitionState === null && isNightBackground)
    ? nightSource
    : daySource;
  const overlaySource = isNightToDayTransition ? daySource : nightSource;
  const showNightOverlay = isDayToNightTransition || isNightToDayTransition;
  const nightRevealHeight = nightRevealProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, cardSize.height],
  });

  return (
    <View
      onLayout={({ nativeEvent: { layout } }) => {
        if (layout.width === cardSize.width && layout.height === cardSize.height) return;
        setCardSize({ width: layout.width, height: layout.height });
      }}
      style={[styles.hero, compact && styles.heroCompact]}
    >
      <Image
        source={baseSource}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
        style={styles.background}
      />
      {showNightOverlay ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.nightRevealClip,
            isDayToNightTransition && styles.nightRevealClipTop,
            isNightToDayTransition && styles.nightRevealClipBottom,
            { height: nightRevealHeight },
          ]}
        >
          <Image
            source={overlaySource}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            style={[
              styles.nightRevealImage,
              isDayToNightTransition && styles.nightRevealImageTop,
              isNightToDayTransition && styles.nightRevealImageBottom,
              { width: cardSize.width, height: cardSize.height },
            ]}
          />
          <LinearGradient
            colors={isNightToDayTransition
              ? ["rgba(7,16,30,0.24)", "rgba(7,16,30,0)"]
              : ["rgba(7,16,30,0)", "rgba(7,16,30,0.24)"]}
            locations={[0, 1]}
            style={[
              styles.nightRevealEdge,
              isDayToNightTransition && styles.nightRevealEdgeBottom,
              isNightToDayTransition && styles.nightRevealEdgeTop,
            ]}
          />
        </Animated.View>
      ) : null}

      <LinearGradient
        colors={["rgba(2,9,22,0.58)", "rgba(4,8,19,0.03)", "rgba(4,7,17,0.22)"]}
        locations={[0, 0.42, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(4,7,17,0.65)", "rgba(4,7,17,0.30)", "transparent"]}
        locations={[0, 0.48, 0.82]}
        start={{ x: 0, y: 0.46 }}
        end={{ x: 1, y: 0.46 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["transparent", "rgba(5,7,17,0.05)", "rgba(5,7,17,0.62)"]}
        locations={[0, 0.58, 1]}
        style={StyleSheet.absoluteFill}
      />

      <AppHeader />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="small" color={colors.goldLight} />
          <Text style={styles.loadingText}>{t("prayer.calculatingTimes")}</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.error}>
          <Ionicons name="warning-outline" size={20} color={colors.goldLight} />
          <Text style={styles.errorText}>
            {errorMessage === "Autorisez la localisation ou choisissez votre mosquée."
              ? t("prayer.locationRequired")
              : t("prayer.timesUnavailable")}
          </Text>
          <Pressable
            onPress={() => void retryLocationAccess()}
            style={styles.retry}
          >
            <Ionicons name="refresh" size={17} color={colors.background} />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.prayerInfo}>
            <View style={styles.nextPrayerBlock}>
              <Text
                allowFontScaling={false}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.72}
                style={styles.nextPrayerName}
              >
                {nextPrayer ? translatedPrayerLabel(nextPrayer.key, nextPrayer.label) : t("prayer.fajr")}
              </Text>
              <View style={styles.countdownRow}>
                <Text allowFontScaling={false} style={styles.countdownPrefix}>{t("prayer.in")}</Text>
                <PrayerCountdown timestamp={nextPrayer?.timestamp ?? null} />
              </View>
              <View style={styles.currentPrayerRow}>
                <Ionicons name="time-outline" size={16} color={colors.goldLight} />
                <Text allowFontScaling={false} style={styles.currentPrayerLabel}>{t("prayer.currentPrayer")}</Text>
                <Text allowFontScaling={false} numberOfLines={1} style={styles.currentPrayerName}>
                  {currentPrayer ? translatedPrayerLabel(currentPrayer.key, currentPrayer.label) : "—"}
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("prayer.openIslamicCalendar")}
              onPress={() => router.push("/calendar" as Href)}
              style={({ pressed }) => [
                styles.metaRow,
                styles.dateMetaRow,
                pressed && styles.metaRowPressed,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={15}
                color={colors.goldLight}
              />
              <View style={styles.hijriCopy}>
                <Text allowFontScaling={false} numberOfLines={1} style={styles.metaText}>
                  {formatDateLabel(new Date(now), language === "en" ? "en-GB" : "fr-FR")}
                </Text>
                <Text allowFontScaling={false} numberOfLines={1} style={styles.hijriEventText}>
                  {formatHijri(hijriDate)} · {hijriEventLabel}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={12}
                color="rgba(255,249,242,0.75)"
              />
            </Pressable>

            <View style={styles.metaChipsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("prayer.chooseCalculationMethod")}
                onPress={() => void openCalculationSettings()}
                style={({ pressed }) => [styles.metaChip, pressed && styles.metaRowPressed]}
              >
                <Ionicons name="calculator-outline" size={16} color={colors.goldLight} />
                <View style={styles.metaChipCopy}>
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.metaChipTitle}>
                    {t("prayer.adjustCalculation")}
                  </Text>
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.metaChipSubtitle}>
                    {calculationSettings.scheduleSource === "mosque" && source?.type === "mosque"
                      ? t("prayer.mosqueTimes")
                      : t("prayer.automaticAnglesDetail", { fajr: calculationSettings.fajrAngle, isha: calculationSettings.ishaAngle })}
                  </Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("prayer.chooseLocation")}
                onPress={() => setLocationOptionsVisible(true)}
                style={({ pressed }) => [styles.metaChip, pressed && styles.metaRowPressed]}
              >
                <Ionicons name="location-outline" size={16} color={colors.goldLight} />
                <View style={styles.metaChipCopy}>
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.metaChipTitle}>
                    {source?.type === "location" && source.label === "Votre position actuelle"
                      ? t("prayer.currentLocation")
                      : source?.label ?? t("prayer.yourLocation")}
                  </Text>
                  <Text allowFontScaling={false} numberOfLines={1} style={styles.metaChipSubtitle}>
                    {t("prayer.timesLocation")}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("prayer.configureAdhanAlerts")}
            onPress={() => {
              setCalculationOptionsVisible(false);
              setAdhanSettingsVisible(true);
            }}
            style={({ pressed }) => [styles.adhan, pressed && styles.adhanPressed]}
          >
            <Ionicons
              name={
                adhanPreferences.enabled
                  ? "volume-high-outline"
                  : "volume-mute-outline"
              }
              size={19}
              color={colors.goldLight}
            />
            <Text allowFontScaling={false} style={styles.adhanText}>{t("prayer.adhan")}</Text>
          </Pressable>

          <View style={styles.glass}>
            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(255,255,255,0.14)",
                "rgba(255,255,255,0.025)",
                "transparent",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.72, y: 0.9 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              pointerEvents="box-none"
              style={[styles.orbitContent, { transform: [{ scale: orbitScale }] }]}
            >
            <View pointerEvents="none" style={styles.orbitRail}>
              <Svg
                width="100%"
                height="100%"
                viewBox="0 0 1000 144"
                preserveAspectRatio="none"
              >
                <Ellipse
                  cx="500"
                  cy="72"
                  rx="438"
                  ry="46"
                  fill="rgba(9,9,17,0.10)"
                  stroke="rgba(234,174,58,0.12)"
                  strokeWidth={18}
                />
                <Ellipse
                  cx="500"
                  cy="72"
                  rx="438"
                  ry="46"
                  fill="none"
                  stroke="rgba(255,239,204,0.28)"
                  strokeWidth={6}
                />
                <Ellipse
                  cx="500"
                  cy="72"
                  rx="438"
                  ry="46"
                  fill="none"
                  stroke="rgba(238,178,66,0.88)"
                  strokeWidth={2.2}
                />
                {orbitMarker ? (
                  <>
                    <Circle
                      cx={orbitMarker.x}
                      cy={orbitMarker.y}
                      r="19"
                      fill="rgba(255,190,58,0.13)"
                    />
                    <Circle
                      cx={orbitMarker.x}
                      cy={orbitMarker.y}
                      r="10"
                      fill="rgba(255,215,112,0.28)"
                      stroke="rgba(255,239,190,0.72)"
                      strokeWidth="2"
                    />
                    <Circle
                      cx={orbitMarker.x}
                      cy={orbitMarker.y}
                      r="4.5"
                      fill="#FFF3C4"
                    />
                  </>
                ) : null}
              </Svg>
            </View>

            <View pointerEvents="none" style={styles.orbitCenter}>
              <View style={styles.orbitCenterLine} />
              <Text
                style={[
                  styles.orbitCenterText,
                  showFridayJumuah && styles.orbitCenterTextJumuah,
                ]}
              >
                {showFridayJumuah
                  ? `${t("prayer.jumuah")}\n${mainMosqueJumuah}`
                  : t("prayer.prayerCycle")}
              </Text>
              <View style={styles.orbitCenterLine} />
            </View>

            <View
              style={styles.orbitStations}
            >
              {orbitLayoutReady && timeline.map((prayer, index) => {
                const trackable = REQUIRED_PRAYERS.includes(prayer.key as MosquePrayerKey);
                const completed = trackable && completedPrayers.includes(prayer.key as MosquePrayerKey);
                return (
                <Pressable
                  key={prayer.key}
                  accessibilityRole={REQUIRED_PRAYERS.includes(prayer.key as MosquePrayerKey) ? "button" : undefined}
                  accessibilityLabel={`${translatedPrayerLabel(prayer.key, prayer.label)}${REQUIRED_PRAYERS.includes(prayer.key as MosquePrayerKey) ? completedPrayers.includes(prayer.key as MosquePrayerKey) ? " — validée" : " — non validée" : ""}`}
                  disabled={!REQUIRED_PRAYERS.includes(prayer.key as MosquePrayerKey)}
                  onPress={() => void togglePrayer(prayer.key as MosquePrayerKey)}
                  style={[
                    styles.orbitStation,
                    prayer.key === "Fajr" && styles.orbitStationFajr,
                    prayer.key === "Maghrib" && styles.orbitStationMaghrib,
                    {
                      left: ORBIT_POSITIONS[index]?.left ?? "41%",
                      top: ORBIT_POSITIONS[index]?.top ?? 2,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.orbitNode,
                      ["Sunrise", "Dhuhr", "Asr"].includes(prayer.key) &&
                        styles.orbitNodeUpper,
                      completed && styles.orbitNodeCompleted,
                      prayer.active && styles.orbitNodeActive,
                    ]}
                  >
                    {completed ? <View style={styles.orbitNodeCompletedHalo} /> : null}
                    {prayer.active ? (
                      <>
                        <Animated.View
                          style={[styles.orbitNodePulse, { opacity: orbitGlow }]}
                        />
                        <View style={styles.orbitNodeHalo} />
                      </>
                    ) : null}
                    <Ionicons
                      name={completed ? "checkmark" : prayer.icon}
                      size={prayer.active ? 19 : 15}
                      color={completed ? "#071B12" : prayer.active ? "#1B1220" : "#F9E8C9"}
                    />
                  </View>
                  <View
                    style={[
                      styles.orbitTextGroup,
                      prayer.key === "Sunrise" && styles.orbitTextLeft,
                      prayer.key === "Dhuhr" && styles.orbitTextAbove,
                      prayer.key === "Asr" && styles.orbitTextRight,
                    ]}
                  >
                    <Text
                      allowFontScaling={false}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={[
                        styles.orbitName,
                        prayer.active && styles.orbitNameActive,
                        prayer.key === "Isha" && styles.orbitNameIsha,
                        prayer.key === "Fajr" && styles.orbitNameFajr,
                        prayer.key === "Dhuhr" && styles.orbitNameDhuhr,
                        prayer.key === "Sunrise" && styles.orbitNameSunrise,
                        prayer.key === "Asr" && styles.orbitNameAsr,
                        prayer.key === "Maghrib" && styles.orbitNameMaghrib,
                      ]}
                    >
                      {translatedPrayerLabel(prayer.key, prayer.label)}
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={[
                        styles.orbitTime,
                        prayer.active && styles.orbitTimeActive,
                        prayer.key === "Isha" && styles.orbitTimeIsha,
                        prayer.key === "Fajr" && styles.orbitTimeFajr,
                        prayer.key === "Dhuhr" && styles.orbitTimeDhuhr,
                        prayer.key === "Maghrib" && styles.orbitTimeMaghribLarge,
                        prayer.key === "Sunrise" && styles.orbitTimeSunrise,
                        prayer.key === "Asr" && styles.orbitTimeAsr,
                        prayer.key === "Maghrib" && styles.orbitTimeMaghrib,
                      ]}
                    >
                      {prayer.time}
                    </Text>
                  </View>
                </Pressable>
                );
              })}
            </View>
            </View>
          </View>
        </>
      )}

      <Modal
        visible={locationOptionsVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setLocationOptionsVisible(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("prayer.closeLocationOptions")}
          onPress={() => setLocationOptionsVisible(false)}
          style={styles.locationModalBackdrop}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.locationSheet}
          >
            <View style={styles.adhanSheetHandle} />
            <Text style={styles.locationSheetTitle}>{t("prayer.locationTitle")}</Text>
            <Pressable
              onPress={() => {
                setMainMosque(null);
                setManualSource(null);
                setRefreshKey((value) => value + 1);
                setLocationOptionsVisible(false);
              }}
              style={({ pressed }) => [
                styles.locationOption,
                pressed && styles.metaRowPressed,
              ]}
            >
              <Ionicons name="locate-outline" size={20} color={colors.goldLight} />
              <Text style={styles.locationOptionText}>
                {t("prayer.useCurrentLocation")}
              </Text>
            </Pressable>
            <View style={styles.cityPicker}>
              <View style={styles.locationOption}>
                <Ionicons name="search-outline" size={20} color={colors.goldLight} />
                <Text style={styles.locationOptionText}>{t("prayer.chooseAnotherCity")}</Text>
              </View>
              <View style={styles.cityPickerRow}>
                <TextInput
                  value={cityQuery}
                  onChangeText={setCityQuery}
                  placeholder={t("prayer.cityExample")}
                  placeholderTextColor={colors.textMuted}
                  style={styles.cityInput}
                />
                <Pressable
                  disabled={cityLoading || !cityQuery.trim()}
                  onPress={() => void chooseCity()}
                  style={[styles.cityButton, (cityLoading || !cityQuery.trim()) && styles.locationOptionDisabled]}
                >
                  <Text style={styles.cityButtonText}>{cityLoading ? "…" : "OK"}</Text>
                </Pressable>
              </View>
            </View>
            {mainMosque ? (
              <Pressable
                onPress={() => {
                  setMainMosque(mainMosque);
                  setManualSource(null);
                  const next = { ...calculationSettings, scheduleSource: "mosque" as const };
                  setCalculationSettings(next);
                  void savePrayerCalculationSettings(next);
                  setRefreshKey((value) => value + 1);
                  setLocationOptionsVisible(false);
                }}
                style={({ pressed }) => [
                  styles.locationOption,
                  pressed && styles.metaRowPressed,
                ]}
              >
                <Ionicons name="business-outline" size={20} color={colors.goldLight} />
                <Text style={styles.locationOptionText}>
                  {t("prayer.useFavoriteMosque")}
                </Text>
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        animationType="fade"
        onRequestClose={() => setCalculationGuideVisible(false)}
        statusBarTranslucent
        transparent
        visible={calculationGuideVisible}
      >
        <View style={styles.calculationGuideBackdrop}>
          <View style={styles.calculationGuideCard}>
            <View style={styles.calculationGuideGlow} />
            <View style={styles.calculationGuideIcon}>
              <Ionicons name="calculator-outline" size={28} color={colors.goldLight} />
            </View>

            <Text style={styles.calculationGuideEyebrow}>{t("prayer.prayerTimesUpper")}</Text>
            <Text style={styles.calculationGuideTitle}>
              {t("prayer.chooseSuitableMethod")}
            </Text>
            <Text style={styles.calculationGuideDescription}>
              {t("prayer.calculationGuideDescription")}
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => void closeCalculationGuideAndOpenSettings()}
              style={({ pressed }) => [
                styles.calculationGuideButton,
                pressed && styles.calculationGuidePressed,
              ]}
            >
              <Text style={styles.calculationGuideButtonText}>{t("prayer.discover")}</Text>
              <Ionicons name="checkmark" size={18} color="#17111C" />
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal
        visible={adhanSettingsVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setAdhanSettingsVisible(false)}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("prayer.closeAdhanSettings")}
          onPress={() => setAdhanSettingsVisible(false)}
          style={styles.adhanModalBackdrop}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[styles.adhanSheet, { maxHeight: Math.max(320, height - insets.top - insets.bottom - 12) }]}
          >
            <ScrollView
              ref={adhanScrollRef}
              style={styles.adhanScroll}
              scrollEnabled
              nestedScrollEnabled
              bounces
              alwaysBounceVertical
              directionalLockEnabled
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[styles.adhanScrollContent, { paddingBottom: 44 + insets.bottom }]}
            >
              <View style={styles.adhanSheetHandle} />
            <View style={styles.adhanSheetHeader}>
              <View style={styles.adhanSheetTitleRow}>
                <View style={styles.adhanSheetIcon}>
                  <Ionicons name="volume-high" size={21} color="#24151A" />
                </View>
                <View>
                  <Text style={styles.adhanSheetEyebrow}>{t("prayer.prayerRemindersUpper")}</Text>
                  <Pressable onPress={handleAdhanTitlePress}>
                    <Text style={styles.adhanSheetTitle}>{t("prayer.adhanAndAlerts")}</Text>
                  </Pressable>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("prayer.close")}
                onPress={() => setAdhanSettingsVisible(false)}
                style={styles.adhanSheetClose}
              >
                <Ionicons name="close" size={21} color="#FFF7EE" />
              </Pressable>
            </View>

            {adhanTestUnlocked ? (
              <View style={styles.hiddenAdhanActions}>
                <Pressable onPress={() => void testSelectedAdhan()} style={styles.hiddenAdhanTestButton}>
                  <Text style={styles.hiddenAdhanTestText}>Tester mon Adhan</Text>
                </Pressable>
                <Pressable onPress={() => void inspectAdhanCoverage()} style={styles.hiddenAdhanTestButton}>
                  <Text style={styles.hiddenAdhanTestText}>
                    {adhanCoverageLoading ? "Lecture…" : "Vérifier la couverture Adhan"}
                  </Text>
                </Pressable>
                {adhanCoverageLoading || adhanCoverage || adhanCoverageError ? (
                  <View style={styles.adhanCoverageInline}>
                    <Text style={styles.adhanCoverageTitle}>Couverture Adhan</Text>
                    {adhanCoverageError ? (
                      <Text style={styles.adhanCoverageError}>Impossible de lire la couverture Adhan</Text>
                    ) : adhanCoverageLoading ? (
                      <Text style={styles.adhanCoverageMeta}>Lecture en cours…</Text>
                    ) : adhanCoverage ? (
                      <>
                        <Text style={styles.adhanCoverageMeta}>
                          Première : {adhanCoverage.firstScheduledAt ? new Date(adhanCoverage.firstScheduledAt).toLocaleString() : "—"}
                        </Text>
                        <Text style={styles.adhanCoverageMeta}>
                          Dernière : {adhanCoverage.lastScheduledAt ? new Date(adhanCoverage.lastScheduledAt).toLocaleString() : "—"}
                        </Text>
                        {adhanCoverage.coverage.map((day) => (
                          <Text key={day.dateKey} style={styles.adhanCoverageDay}>
                            {day.dateKey} : {day.count}/5
                          </Text>
                        ))}
                        <Text style={styles.adhanCoverageSummary}>Total : {adhanCoverage.scheduledCount}</Text>
                        <Text style={styles.adhanCoverageSummary}>Doublons : {adhanCoverage.duplicateCount}</Text>
                        <Pressable
                          onPress={() => setAdhanCoverage(null)}
                          style={styles.adhanCoverageHide}
                        >
                          <Text style={styles.adhanCoverageHideText}>Masquer</Text>
                        </Pressable>
                      </>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}

            <View style={styles.adhanMainToggle}>
              <View style={styles.adhanSettingCopy}>
                <Text style={styles.adhanSettingTitle}>{t("prayer.enableAlerts")}</Text>
                <Text style={styles.adhanSettingSubtitle}>
                  {t("prayer.choicesSavedDevice")}
                </Text>
              </View>
              <Switch
                value={adhanPreferences.enabled}
                onValueChange={(enabled) => void toggleAdhanAlerts(enabled)}
                trackColor={{ false: "#423A43", true: "rgba(236,177,61,0.55)" }}
                thumbColor={adhanPreferences.enabled ? "#F2B53D" : "#918893"}
              />
            </View>

            {nextAdhanAlert ? (
              <View style={styles.adhanNextAlert}>
                <Ionicons name="time-outline" size={16} color="#F6C75D" />
                <Text style={styles.adhanNextAlertText}>{nextAdhanAlert}</Text>
              </View>
            ) : null}

            <View style={!adhanPreferences.enabled && styles.adhanChoiceDisabled} pointerEvents={adhanPreferences.enabled ? "auto" : "none"}>
              <Text style={styles.adhanSectionLabel}>{t("prayer.alertTypeUpper")}</Text>
              <View style={styles.adhanOptionRow}>
                {ADHAN_MODES.map((mode) => {
                  const selected = adhanPreferences.mode === mode.key;
                  return (
                    <Pressable
                      key={mode.key}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => updateAdhanPreferences((current) => ({ ...current, mode: mode.key }))}
                      style={[styles.adhanModeChoice, selected && styles.adhanChoiceSelected]}
                    >
                      <Ionicons name={mode.icon} size={18} color={selected ? "#F6C75D" : "#A49BA8"} />
                      <Text style={[styles.adhanModeText, selected && styles.adhanChoiceTextSelected]}>
                        {t(mode.labelKey)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {Platform.OS === "ios" && (adhanPreferences.mode === "adhan" || adhanPreferences.mode === "notification") ? (
                <Text style={styles.adhanNote}>{t("prayer.iosSilentNote")}</Text>
              ) : null}

              {adhanPreferences.mode === "adhan" ? (
                <>
                  <Text style={styles.adhanSectionLabel}>{t("prayer.adhanVoiceUpper")}</Text>
                  <View style={styles.adhanVoiceGrid}>
                    {ADHAN_VOICES.map((voice) => {
                      const selected = adhanPreferences.voice === voice.key;
                      const playing = previewVoice === voice.key && adhanPlayerStatus.playing;
                      return (
                        <Pressable
                          key={voice.key}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => updateAdhanPreferences((current) => ({ ...current, voice: voice.key }))}
                          style={[styles.adhanVoiceChoice, selected && styles.adhanChoiceSelected]}
                        >
                          <Ionicons
                            name={selected ? "checkmark-circle" : "ellipse-outline"}
                            size={16}
                            color={selected ? "#F6C75D" : "#817985"}
                          />
                          <Text numberOfLines={2} style={[styles.adhanVoiceText, selected && styles.adhanChoiceTextSelected]}>
                            {t(voice.labelKey)}
                          </Text>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={playing ? t("prayer.pauseAdhanPreview") : t("prayer.listenAdhanPreview")}
                            hitSlop={8}
                            onPress={() => togglePreview(voice.key)}
                            style={[styles.adhanVoicePlay, playing && styles.adhanVoicePlayActive]}
                          >
                            <Ionicons name={playing ? "pause" : "play"} size={14} color={playing ? "#281816" : "#F6C75D"} />
                          </Pressable>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}

              <Text style={styles.adhanSectionLabel}>{t("prayer.selectedPrayersUpper")}</Text>
              <View style={styles.adhanPrayerGrid}>
                {ADHAN_PRAYERS.map((prayer) => {
                  const selected = adhanPreferences.prayers[prayer];
                  return (
                    <Pressable
                      key={prayer}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() =>
                        updateAdhanPreferences((current) => ({
                          ...current,
                          prayers: { ...current.prayers, [prayer]: !current.prayers[prayer] },
                        }))
                      }
                      style={[styles.adhanPrayerChoice, selected && styles.adhanChoiceSelected]}
                    >
                      <Ionicons
                        name={selected ? "checkmark-circle" : "ellipse-outline"}
                        size={16}
                        color={selected ? "#F6C75D" : "#817985"}
                      />
                      <Text style={[styles.adhanChoiceText, selected && styles.adhanChoiceTextSelected]}>
                        {t(PRAYER_LABEL_KEYS[prayer])}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.adhanSectionLabel}>{t("prayer.reminderTimeUpper")}</Text>
              <View style={styles.adhanOptionRow}>
                {ADHAN_LEAD_TIMES.map((minutes) => {
                  const selected = adhanPreferences.leadMinutes === minutes;
                  return (
                    <Pressable
                      key={minutes}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => updateAdhanPreferences((current) => ({ ...current, leadMinutes: minutes }))}
                      style={[styles.adhanLeadChoice, selected && styles.adhanChoiceSelected]}
                    >
                      <Text
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        style={[styles.adhanModeText, selected && styles.adhanChoiceTextSelected]}
                      >
                        {minutes === 0 ? t("prayer.onTime") : `-${minutes} min`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View
              onLayout={(event) => {
                calculationSectionY.current = event.nativeEvent.layout.y;
                if (scrollToCalculation.current) {
                  scrollToCalculation.current = false;
                  adhanScrollRef.current?.scrollTo({ y: Math.max(0, event.nativeEvent.layout.y - 12), animated: true });
                }
              }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: calculationOptionsVisible }}
                onPress={() => setCalculationOptionsVisible(!calculationOptionsVisible)}
                style={styles.calculationDisclosure}
              >
                <Ionicons name="calculator-outline" size={18} color={colors.goldLight} style={styles.calculationIcon} />
                <View style={styles.calculationDisclosureCopy}>
                  <Text style={styles.adhanSettingTitle}>{t("prayer.calculationTitle")}</Text>
                  <Text style={styles.adhanSettingSubtitle}>
                    {usesMosqueTimes
                      ? t("prayer.mosqueTimes")
                      : t("prayer.anglesDetail", { fajr: calculationSettings.fajrAngle, isha: calculationSettings.ishaAngle })}
                  </Text>
                </View>
                <Ionicons name={calculationOptionsVisible ? "chevron-up" : "chevron-down"} size={18} color={colors.goldLight} />
              </Pressable>
              {calculationOptionsVisible ? (
                <View style={styles.calculationPanel}>
                  {source?.type === "mosque" ? (
                    <View style={styles.adhanOptionRow}>
                      {(["mosque", "calculation"] as const).map((scheduleSource) => {
                        const selected = calculationSettings.scheduleSource === scheduleSource;
                        return (
                          <Pressable
                            key={scheduleSource}
                            accessibilityRole="button"
                            accessibilityState={{ selected }}
                            onPress={() => updateCalculationSettings({ scheduleSource })}
                            style={[styles.adhanLeadChoice, selected && styles.adhanChoiceSelected]}
                          >
                            <Text style={[styles.adhanModeText, selected && styles.adhanChoiceTextSelected]}>
                              {scheduleSource === "mosque" ? t("prayer.mosqueTimes") : t("prayer.calculationByDegrees")}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ) : null}
                  {usesMosqueTimes ? (
                    <Text style={styles.calculationHint}>{t("prayer.mosqueTimesExplanation")}</Text>
                  ) : (
                    <>
                      {(["fajrAngle", "ishaAngle"] as const).map((key) => {
                        const index = PRAYER_ANGLES.indexOf(calculationSettings[key] as (typeof PRAYER_ANGLES)[number]);
                        const step = (delta: number) => {
                          const next = PRAYER_ANGLES[Math.min(PRAYER_ANGLES.length - 1, Math.max(0, (index < 0 ? 1 : index) + delta))];
                          updateCalculationSettings({ scheduleSource: "calculation", [key]: next });
                        };
                        const label = key === "fajrAngle" ? "Fajr" : "Isha";
                        return (
                          <View key={key} style={styles.angleStepper}>
                            <Text style={styles.angleStepperLabel}>{label}</Text>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`${label} −`}
                              disabled={index === 0}
                              onPress={() => step(-1)}
                              style={[styles.angleStepButton, index === 0 && styles.adhanChoiceDisabled]}
                            >
                              <Ionicons name="remove" size={18} color="#F6C75D" />
                            </Pressable>
                            <Text style={styles.angleStepperValue}>{calculationSettings[key]}°</Text>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel={`${label} +`}
                              disabled={index === PRAYER_ANGLES.length - 1}
                              onPress={() => step(1)}
                              style={[styles.angleStepButton, index === PRAYER_ANGLES.length - 1 && styles.adhanChoiceDisabled]}
                            >
                              <Ionicons name="add" size={18} color="#F6C75D" />
                            </Pressable>
                          </View>
                        );
                      })}
                      <Text style={styles.calculationHint}>{t("prayer.degreesExplanation")}</Text>
                      {calculationSettings.fajrAngle !== DEFAULT_PRAYER_CALCULATION_SETTINGS.fajrAngle
                        || calculationSettings.ishaAngle !== DEFAULT_PRAYER_CALCULATION_SETTINGS.ishaAngle ? (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => updateCalculationSettings({
                            fajrAngle: DEFAULT_PRAYER_CALCULATION_SETTINGS.fajrAngle,
                            ishaAngle: DEFAULT_PRAYER_CALCULATION_SETTINGS.ishaAngle,
                          })}
                          hitSlop={6}
                        >
                          <Text style={styles.calculationReset}>{t("prayer.resetDegrees", {
                            fajr: DEFAULT_PRAYER_CALCULATION_SETTINGS.fajrAngle,
                            isha: DEFAULT_PRAYER_CALCULATION_SETTINGS.ishaAngle,
                          })}</Text>
                        </Pressable>
                      ) : null}
                    </>
                  )}
                </View>
              ) : null}
            </View>

              <Pressable
              onPress={() => {
                setErrorMessage("");
                setLoading(true);
                setRefreshKey((value) => value + 1);
                setAdhanSettingsVisible(false);
              }}
              style={styles.adhanDoneButton}
              >
              <LinearGradient
                colors={["#F5D276", "#D59A35"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.adhanDoneText}>{t("prayer.done")}</Text>
              </Pressable>

            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 489,
    overflow: "hidden",
    backgroundColor: "#07101E",
  },
  heroCompact: {
    height: 476,
  },
  background: {
    position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
    width: "100%",
    height: "100%",
  },
  nightRevealClip: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  nightRevealClipTop: {
    top: 0,
  },
  nightRevealClipBottom: {
    bottom: 0,
  },
  nightRevealImage: {
    position: "absolute",
    left: 0,
    width: "100%",
  },
  nightRevealImageTop: {
    top: 0,
  },
  nightRevealImageBottom: {
    bottom: 0,
  },
  nightRevealEdge: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 42,
  },
  nightRevealEdgeBottom: {
    bottom: 0,
  },
  nightRevealEdgeTop: {
    top: 0,
  },
  prayerInfo: {
    position: "absolute",
    top: 84,
    left: 18,
    right: 18,
  },
  nextPrayerBlock: {
    width: "64%",
  },
  nextPrayerName: {
    color: "#FFF9F3",
    fontFamily: typography.serifSemibold,
    fontSize: 31,
    lineHeight: 34,
    textShadowColor: "rgba(0,0,0,0.78)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  countdownRow: {
    marginTop: 1,
    flexDirection: "row",
    alignItems: "baseline",
  },
  countdownPrefix: {
    marginRight: 8,
    color: "rgba(248,240,232,0.86)",
    fontFamily: typography.serifMedium,
    fontSize: 19,
    lineHeight: 27,
  },
  countdown: {
    color: "#F3B83F",
    fontFamily: typography.serifSemibold,
    fontSize: 27,
    lineHeight: 31,
    letterSpacing: 1,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(225,157,34,0.35)",
    textShadowRadius: 9,
  },
  currentPrayerRow: {
    alignSelf: "flex-start",
    minHeight: 27,
    marginTop: 4,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    backgroundColor: "rgba(8,7,19,0.32)",
  },
  currentPrayerLabel: {
    marginLeft: 6,
    color: "rgba(255,249,243,0.92)",
    fontFamily: typography.serifMedium,
    fontSize: 14,
  },
  currentPrayerName: {
    marginLeft: 5,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 17,
    fontWeight: "700",
  },
  metaRow: {
    minHeight: 34,
    marginTop: 7,
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    flexShrink: 1,
    marginLeft: 8,
    color: "#FFF9F2",
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.78)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  dateMetaRow: {
    width: "100%",
    minHeight: 34,
    paddingRight: 0,
  },
  hijriCopy: {
    flex: 1,
    minWidth: 0,
  },
  hijriEventText: {
    marginTop: 1,
    marginLeft: 8,
    color: "rgba(242,224,202,0.82)",
    fontFamily: typography.sans,
    fontSize: 8.8,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.82)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  metaChipsRow: {
    marginTop: 16,
    flexDirection: "row",
    gap: 8,
  },
  metaChip: {
    flex: 1,
    minWidth: 0,
    height: 47,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,236,209,0.22)",
    backgroundColor: "rgba(20,17,28,0.62)",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 3 },
  },
  metaChipCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 7,
  },
  metaChipTitle: {
    color: "#FFF9F2",
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "700",
  },
  metaChipSubtitle: {
    marginTop: 2,
    color: "rgba(242,224,202,0.76)",
    fontFamily: typography.sans,
    fontSize: 8.7,
  },
  calculationHint: {
    marginTop: 8,
    color: "rgba(242,224,202,0.72)",
    fontFamily: typography.sans,
    fontSize: 10,
    lineHeight: 14,
  },
  metaRowPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  adhan: {
    position: "absolute",
    top: 91,
    right: 15,
    minHeight: 34,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,239,213,0.24)",
    backgroundColor: "rgba(24,17,34,0.48)",
    shadowColor: "#000",
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
  },
  adhanText: {
    marginLeft: 7,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 18,
  },
  adhanPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
  adhanStatus: {
    position: "absolute",
    top: 6,
    right: 7,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#756E78",
  },
  adhanStatusEnabled: {
    backgroundColor: "#66D99A",
    shadowColor: "#66D99A",
    shadowOpacity: 0.9,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  adhanModalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(4,5,11,0.72)",
  },
  adhanSheet: {
    flexShrink: 1,
    paddingTop: 9,
    paddingRight: 18,
    paddingBottom: 24,
    paddingLeft: 18,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,230,185,0.20)",
    backgroundColor: "#17131C",
    shadowColor: "#000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
  },
  adhanScroll: {
    flexShrink: 1,
    width: "100%",
  },
  adhanScrollContent: {
    flexGrow: 1,
  },
  locationModalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(4,5,11,0.72)",
  },
  locationSheet: {
    paddingTop: 9,
    paddingRight: 18,
    paddingBottom: 24,
    paddingLeft: 18,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,230,185,0.20)",
    backgroundColor: "#17131C",
  },
  locationSheetTitle: {
    marginBottom: 10,
    color: "#FFF9F2",
    fontFamily: typography.serifSemibold,
    fontSize: 22,
  },
  locationOption: {
    minHeight: 52,
    paddingHorizontal: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  locationOptionText: {
    flex: 1,
    color: "#FFF9F2",
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: "600",
  },
  locationOptionCopy: {
    flex: 1,
  },
  locationOptionHint: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
  },
  locationOptionDisabled: {
    opacity: 0.52,
  },
  cityPicker: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  cityPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingBottom: 10,
    paddingLeft: 35,
  },
  cityInput: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    color: "#FFF9F2",
    fontFamily: typography.sans,
    fontSize: 13,
  },
  cityButton: {
    minWidth: 48,
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.goldLight,
  },
  cityButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "800",
  },
  adhanSheetHandle: {
    width: 42,
    height: 4,
    marginBottom: 15,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  adhanSheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  adhanSheetTitleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  adhanSheetIcon: {
    width: 42,
    height: 42,
    marginRight: 11,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#F1BB4B",
  },
  adhanSheetEyebrow: {
    color: "rgba(241,187,75,0.76)",
    fontFamily: typography.sans,
    fontSize: 8.5,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  adhanSheetTitle: {
    marginTop: 1,
    color: "#FFF8EF",
    fontFamily: typography.serifSemibold,
    fontSize: 22,
  },
  adhanSheetClose: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  adhanMainToggle: {
    minHeight: 62,
    marginTop: 18,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(246,199,93,0.18)",
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  adhanSettingCopy: {
    flex: 1,
    paddingRight: 12,
  },
  adhanSettingTitle: {
    color: "#FFF7EE",
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  adhanSettingSubtitle: {
    marginTop: 2,
    color: "rgba(236,226,232,0.58)",
    fontFamily: typography.sans,
    fontSize: 10,
  },
  adhanSectionLabel: {
    marginTop: 17,
    marginBottom: 8,
    color: "rgba(246,199,93,0.68)",
    fontFamily: typography.sans,
    fontSize: 8.5,
    fontWeight: "700",
    letterSpacing: 1.05,
  },
  adhanPrayerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  adhanPrayerChoice: {
    minHeight: 36,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  adhanChoiceSelected: {
    borderColor: "rgba(246,199,93,0.46)",
    backgroundColor: "rgba(231,168,50,0.11)",
  },
  adhanChoiceDisabled: {
    opacity: 0.38,
  },
  adhanChoiceText: {
    marginLeft: 6,
    color: "#AAA1AD",
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: "600",
  },
  adhanChoiceTextSelected: {
    color: "#FFE4A0",
  },
  adhanOptionRow: {
    flexDirection: "row",
    gap: 7,
  },
  adhanNextAlert: { marginTop: 10, paddingHorizontal: 13, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 13, backgroundColor: "rgba(231,168,50,0.11)" },
  adhanNextAlertText: { flex: 1, color: "#FFE4A0", fontFamily: typography.sans, fontSize: 11.5, fontWeight: "700" },
  adhanNote: { marginTop: 8, color: "rgba(242,224,202,0.72)", fontFamily: typography.sans, fontSize: 10, lineHeight: 14 },
  adhanVoiceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  adhanVoiceChoice: { width: "48.5%", minHeight: 48, paddingLeft: 11, paddingRight: 7, flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.035)" },
  adhanVoiceText: { flex: 1, color: "#AAA1AD", fontFamily: typography.sans, fontSize: 11, fontWeight: "600" },
  adhanVoicePlay: { width: 30, height: 30, alignItems: "center", justifyContent: "center", borderRadius: 15, borderWidth: 1, borderColor: "rgba(246,199,93,0.55)" },
  adhanVoicePlayActive: { backgroundColor: "#F2C55B", borderColor: "#F2C55B" },
  calculationIcon: { marginRight: 10 },
  calculationPanel: { marginTop: 8, padding: 12, gap: 8, borderRadius: 13, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.025)" },
  angleStepper: { flexDirection: "row", alignItems: "center", gap: 10 },
  angleStepperLabel: { flex: 1, color: "#FFF7EE", fontFamily: typography.serifMedium, fontSize: 15 },
  angleStepButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, borderWidth: 1, borderColor: "rgba(246,199,93,0.46)", backgroundColor: "rgba(231,168,50,0.11)" },
  angleStepperValue: { minWidth: 52, color: "#FFE4A0", fontFamily: typography.sans, fontSize: 16, fontWeight: "800", textAlign: "center", fontVariant: ["tabular-nums"] },
  calculationReset: { marginTop: 2, color: "#F6C75D", fontFamily: typography.sans, fontSize: 10.5, fontWeight: "700", textDecorationLine: "underline" },
  calculationDisclosure: { minHeight: 54, marginTop: 17, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 13, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.035)" },
  calculationDisclosureCopy: { flex: 1, paddingVertical: 8, paddingRight: 10 },
  adhanModeChoice: {
    minHeight: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  adhanModeText: {
    marginTop: 3,
    color: "#AAA1AD",
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "600",
  },
  adhanBirdText: {
    width: "100%",
    textAlign: "center",
  },
  adhanLeadChoice: {
    minHeight: 38,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  adhanDoneButton: {
    minHeight: 48,
    marginTop: 21,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
  },
  adhanDoneText: {
    color: "#281816",
    fontFamily: typography.serifSemibold,
    fontSize: 15,
  },
  hiddenAdhanTestButton: { minHeight: 34, marginTop: 10, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: "rgba(242,190,85,0.26)", backgroundColor: "rgba(242,190,85,0.08)" },
  hiddenAdhanTestText: { color: "#F2BE55", fontFamily: typography.sans, fontSize: 11, fontWeight: "800" },
  hiddenAdhanActions: { gap: 7 },
  adhanCoverageInline: { marginTop: 8, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: "rgba(242,190,85,0.25)", backgroundColor: "rgba(242,190,85,0.06)" },
  adhanCoverageTitle: { color: "#FFF9F2", fontFamily: typography.serifSemibold, fontSize: 22, textAlign: "center" },
  adhanCoverageMeta: { marginTop: 5, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11 },
  adhanCoverageError: { marginTop: 18, color: "#FFB4A8", fontFamily: typography.sans, fontSize: 12, textAlign: "center" },
  adhanCoverageDay: { marginTop: 8, color: "#FFE4A0", fontFamily: typography.sans, fontSize: 12, fontWeight: "700" },
  adhanCoverageSummary: { marginTop: 14, color: "#FFF9F2", fontFamily: typography.sans, fontSize: 12, fontWeight: "800" },
  adhanCoverageHide: { alignSelf: "flex-start", marginTop: 12, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, backgroundColor: "rgba(255,255,255,0.08)" },
  adhanCoverageHideText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "800" },
  glass: {
    position: "absolute",
    right: 16,
    bottom: 1,
    left: 16,
    height: 178,
    overflow: "hidden",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,236,209,0.30)",
    backgroundColor: "rgba(20,19,25,0.52)",
    shadowColor: "#000",
    shadowOpacity: 0.36,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 9 },
  },
  orbitContent: {
    position: "absolute", top: 0, right: 0, bottom: 0, left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  orbitRail: {
    position: "absolute",
    top: 27,
    right: 3,
    left: 3,
    height: 138,
  },
  orbitStations: {
    position: "absolute",
    top: 22,
    right: 0,
    left: 0,
    height: 148,
    zIndex: 3,
  },
  orbitStation: {
    position: "absolute",
    width: 62,
    alignItems: "center",
  },
  orbitStationFajr: {
    transform: [{ translateX: -19 }],
  },
  orbitStationMaghrib: {
    transform: [{ translateX: 12 }],
  },
  orbitNode: {
    width: 31,
    height: 31,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(248,213,145,0.72)",
    backgroundColor: "rgba(25,19,27,0.94)",
    shadowColor: "#000",
    shadowOpacity: 0.38,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  orbitNodeActive: {
    width: 31,
    height: 31,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#FFE39B",
    backgroundColor: "#F2B43D",
    shadowColor: "#F5AE27",
    shadowOpacity: 0.92,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  orbitNodeCompleted: {
    borderColor: "#8CE6A8",
    backgroundColor: "#63CF89",
    shadowColor: "#63CF89",
    shadowOpacity: 0.82,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 },
  },
  orbitNodeCompletedHalo: {
    position: "absolute",
    top: -7,
    right: -7,
    bottom: -7,
    left: -7,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: "rgba(99,207,137,0.72)",
  },
  orbitNodeHalo: {
    position: "absolute",
    top: -6,
    right: -6,
    bottom: -6,
    left: -6,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,220,135,0.38)",
  },
  orbitNodePulse: {
    position: "absolute",
    top: -10,
    right: -10,
    bottom: -10,
    left: -10,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "#FFE59B",
    shadowColor: "#F7B62D",
    shadowOpacity: 0.95,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  orbitNodeUpper: {
    position: "relative",
    top: 2,
  },
  orbitTextGroup: {
    width: "100%",
    alignItems: "center",
  },
  orbitTextLeft: {
    position: "absolute",
    top: 3,
    right: "75%",
    width: 72,
    alignItems: "flex-end",
  },
  orbitTextAbove: {
    position: "absolute",
    bottom: "100%",
    left: "50%",
    width: 84,
    alignItems: "center",
    transform: [{ translateX: -42 }],
  },
  orbitTextRight: {
    position: "absolute",
    top: 3,
    left: "75%",
    width: 72,
    alignItems: "flex-start",
  },
  orbitName: {
    width: "100%",
    marginTop: 2,
    color: "#FFF7EF",
    fontFamily: typography.serifMedium,
    fontSize: 13.5,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.92)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  orbitNameActive: {
    color: "#FFD160",
    fontSize: 15.5,
  },
  orbitTime: {
    color: "#E6DCE1",
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(0,0,0,0.92)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  orbitTimeActive: {
    color: "#FFD160",
    fontSize: 10,
  },
  orbitNameIsha: {
    fontSize: 24.15,
    position: "relative",
    top: -5,
  },
  orbitNameFajr: {
    fontSize: 24.15,
  },
  orbitNameDhuhr: {
    fontSize: 24.15,
    position: "relative",
    top: 10,
  },
  orbitNameAsr: {
    fontSize: 21,
    position: "relative",
    left: -18,
    top: -14,
  },
  orbitNameMaghrib: {
    fontSize: 24.15,
    position: "relative",
    top: 3,
  },
  orbitTimeMaghrib: {
    position: "relative",
    top: 3,
  },
  orbitNameSunrise: {
    position: "relative",
    left: 6,
  },
  orbitTimeIsha: {
    fontSize: 12.65,
    position: "relative",
    top: -12,
  },
  orbitTimeAsr: {
    fontSize: 12.65,
    position: "relative",
    left: 5,
    top: -14,
  },
  orbitTimeFajr: {
    fontSize: 12.65,
  },
  orbitTimeDhuhr: {
    fontSize: 12.65,
    position: "relative",
    top: 2,
  },
  orbitTimeMaghribLarge: {
    fontSize: 12.65,
  },
  orbitTimeSunrise: {
    position: "relative",
    left: -8,
  },
  orbitCenter: {
    position: "absolute",
    zIndex: 2,
    top: 82,
    right: 98,
    left: 98,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  orbitCenterLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 6,
    backgroundColor: "rgba(234,181,81,0.27)",
  },
  orbitCenterText: {
    maxWidth: 140,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 13,
    lineHeight: 15,
    textAlign: "center",
    transform: [{ translateY: -7 }],
    letterSpacing: 0.35,
    textShadowColor: "rgba(242,185,76,0.72)",
    textShadowRadius: 5,
  },
  orbitCenterTextJumuah: {
    fontSize: 14,
    lineHeight: 16,
    transform: [{ translateY: -10 }],
  },
  loading: {
    position: "absolute",
    top: 148,
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(9,8,18,0.76)",
  },
  loadingText: {
    marginLeft: 9,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12,
  },
  error: {
    position: "absolute",
    top: 124,
    right: 20,
    left: 20,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.40)",
    backgroundColor: "rgba(9,8,18,0.82)",
  },
  errorText: {
    flex: 1,
    marginHorizontal: 10,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 17,
  },
  retry: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: colors.goldLight,
  },
  calculationGuideBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    backgroundColor: "rgba(5, 3, 13, 0.82)",
  },
  calculationGuideCard: {
    width: "100%",
    maxWidth: 390,
    overflow: "hidden",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(239, 190, 74, 0.42)",
    backgroundColor: "#17111F",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 18,
  },
  calculationGuideGlow: {
    position: "absolute",
    top: -90,
    width: 220,
    height: 180,
    borderRadius: 110,
    backgroundColor: "rgba(116, 47, 145, 0.22)",
  },
  calculationGuideIcon: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(239, 190, 74, 0.34)",
    backgroundColor: "rgba(82, 39, 101, 0.70)",
  },
  calculationGuideEyebrow: {
    marginTop: 17,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 2.2,
    textAlign: "center",
  },
  calculationGuideTitle: {
    marginTop: 8,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 25,
    lineHeight: 30,
    textAlign: "center",
  },
  calculationGuideDescription: {
    marginTop: 10,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  calculationGuideButton: {
    width: "100%",
    minHeight: 50,
    marginTop: 22,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 18,
    backgroundColor: colors.goldLight,
  },
  calculationGuideButtonText: {
    color: "#17111C",
    fontFamily: typography.sans,
    fontSize: 14,
    fontWeight: "800",
  },
  calculationGuidePressed: {
    opacity: 0.72,
  },
});
