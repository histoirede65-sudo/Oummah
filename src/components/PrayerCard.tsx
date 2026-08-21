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
  Alert,
  InteractionManager,
  Modal,
  Pressable,
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
  type MosquePrayerKey,
  type MosquePrayerSchedule,
  type MosquePrayerTime,
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
import { getApprovedMosquePrayerTimes } from "../features/mosques/data/mosquePrayerUpdates";
import { syncPrayerTimesWidget } from "../features/prayer-widget/PrayerWidgetSync";
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
  requestAdhanNotificationPermission,
  syncAdhanNotifications,
} from "../features/adhan/AdhanNotifications";
import AppHeader from "./AppHeader";

const PRAYER_LABELS: Record<MosquePrayerKey, string> = {
  Fajr: "Fajr",
  Dhuhr: "Dhuhr",
  Asr: "Asr",
  Maghrib: "Maghrib",
  Isha: "Isha",
};

const ADHAN_PRAYERS: MosquePrayerKey[] = [
  "Fajr",
  "Dhuhr",
  "Asr",
  "Maghrib",
  "Isha",
];

function applyApprovedMosquePrayerTimes(
  schedule: MosquePrayerSchedule,
  approved: Awaited<ReturnType<typeof getApprovedMosquePrayerTimes>>,
) {
  if (!approved) return schedule;

  const adjust = (prayer: MosquePrayerTime) => {
    const value = approved[prayer.key.toLowerCase() as "fajr" | "dhuhr" | "asr" | "maghrib" | "isha"];
    if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return prayer;
    const [hours, minutes] = value.split(":").map(Number);
    const date = new Date(prayer.timestamp);
    date.setHours(hours, minutes, 0, 0);
    return { ...prayer, time: value, timestamp: date.getTime() };
  };

  return {
    ...schedule,
    prayers: schedule.prayers.map(adjust),
    tomorrowPrayers: schedule.tomorrowPrayers.map(adjust),
    tomorrowFajr: adjust(schedule.tomorrowFajr),
  };
}

const ADHAN_MODES: ReadonlyArray<{
  key: AdhanAlertMode;
  label: string;
  icon: "volume-high-outline" | "phone-portrait-outline" | "notifications-outline";
}> = [
  { key: "adhan", label: "Adhan", icon: "volume-high-outline" },
  { key: "notification", label: "Notification", icon: "notifications-outline" },
  { key: "vibration", label: "Vibreur", icon: "phone-portrait-outline" },
  { key: "silent", label: "Silencieux", icon: "notifications-outline" },
];

const ADHAN_LEAD_TIMES = [0, 5, 10, 15] as const;
const ADHAN_VOICES: ReadonlyArray<{ key: AdhanVoice; label: string; file: number }> = [
  { key: "makkah", label: "La Mecque", file: require("../../assets/adhan/adhan_makkah.mp3") },
  { key: "madinah", label: "Médine", file: require("../../assets/adhan/adhan_madinah.mp3") },
  { key: "egypt", label: "Égypte", file: require("../../assets/adhan/adhan_egypt.mp3") },
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

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(intervalId);
  }, []);

  return <Text style={styles.countdown}>{timestamp ? formatCountdown(timestamp - now) : "--:--:--"}</Text>;
});

function formatDateLabel(date: Date) {
  const formatted = new Intl.DateTimeFormat("fr-FR", {
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

export default function PrayerCard() {
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
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [calendarSettings, setCalendarSettings] = useState(
    DEFAULT_CALENDAR_SETTINGS,
  );
  const [adhanPreferences, setAdhanPreferences] = useState<AdhanPreferences>(
    DEFAULT_ADHAN_PREFERENCES,
  );
  const [adhanSettingsVisible, setAdhanSettingsVisible] = useState(false);
  const [locationOptionsVisible, setLocationOptionsVisible] = useState(false);
  const [orbitLayoutReady, setOrbitLayoutReady] = useState(false);
  const [cityQuery, setCityQuery] = useState("");
  const [cityLoading, setCityLoading] = useState(false);
  const [adhanPreferencesLoaded, setAdhanPreferencesLoaded] = useState(false);
  const adhanPlayer = useAudioPlayer(ADHAN_VOICES.find((voice) => voice.key === adhanPreferences.voice)?.file ?? ADHAN_VOICES[0].file);
  const adhanPlayerStatus = useAudioPlayerStatus(adhanPlayer);
  const orbitGlow = useRef(new Animated.Value(0.32)).current;

  useFocusEffect(
    useCallback(() => {
      setOrbitLayoutReady(false);
      const task = InteractionManager.runAfterInteractions(() => {
        setOrbitLayoutReady(true);
      });
      return () => task.cancel();
    }, []),
  );

  useEffect(() => {
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
  }, [orbitGlow]);

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
          "Autorisation nécessaire",
          "Autorisez les notifications dans les réglages de votre téléphone pour recevoir les rappels de prière.",
        );
        return;
      }

      updateAdhanPreferences((current) => ({ ...current, enabled: true }));
    },
    [updateAdhanPreferences],
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

  useEffect(() => {
    if (!schedule || !adhanPreferencesLoaded) return;
    void syncAdhanNotifications(schedule, adhanPreferences).catch(() => undefined);
  }, [adhanPreferences, adhanPreferencesLoaded, schedule]);

  useFocusEffect(
    useCallback(() => {
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
      const intervalId = setInterval(refreshNow, 60_000);

      return () => {
        clearInterval(intervalId);
        if (prayerTransitionTimeout) clearTimeout(prayerTransitionTimeout);
      };
    }, [schedule]),
  );

  useEffect(() => {
    if (!mainMosqueLoaded) return;

    const controller = new AbortController();

    const loadPrayerTimes = async () => {
      setLoading(true);
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
        );

        const approved = mainMosque && !manualSource
          ? await getApprovedMosquePrayerTimes(mainMosque.id).catch(() => null)
          : null;
        const adjustedResult = applyApprovedMosquePrayerTimes(result, approved);

        if (!controller.signal.aborted) {
          setSource(resolvedSource);
          setSchedule(adjustedResult);
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }

        if (!controller.signal.aborted) {
          setSource(null);
          setSchedule(null);
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
  }, [mainMosqueLoaded, mainMosque?.id, mainMosque?.latitude, mainMosque?.longitude, manualSource?.latitude, manualSource?.longitude, refreshKey]);

  const chooseCity = async () => {
    const query = cityQuery.trim();
    if (!query) return;
    setCityLoading(true);
    const places = await Location.geocodeAsync(query).catch(() => []);
    const place = places[0];
    if (!place) {
      Alert.alert("Ville introuvable", "Aucune ville correspondante n’a été trouvée.");
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
      ? `${nextIslamicEvent.event.shortTitle} aujourd’hui`
      : `${nextIslamicEvent.event.shortTitle} dans ${nextIslamicEvent.days} jour${
          nextIslamicEvent.days > 1 ? "s" : ""
        }`
    : "Ouvrir le calendrier islamique";

  return (
    <View style={[styles.hero, compact && styles.heroCompact]}>
      <Image
        source={require("../assets/images/home/home-mosque-sunset.jpg")}
        contentFit="cover"
        cachePolicy="memory-disk"
        priority="high"
        style={styles.background}
      />

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
          <Text style={styles.loadingText}>Calcul des horaires…</Text>
        </View>
      ) : errorMessage ? (
        <View style={styles.error}>
          <Ionicons name="warning-outline" size={20} color={colors.goldLight} />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable
            onPress={() => setRefreshKey((value) => value + 1)}
            style={styles.retry}
          >
            <Ionicons name="refresh" size={17} color={colors.background} />
          </Pressable>
        </View>
      ) : (
        <>
          <View style={styles.prayerInfo}>
            <View style={styles.prayerLabels}>
              <Text style={styles.nextLabel}>Prière du moment</Text>
              <Text style={styles.nextLabel}>Prière à venir</Text>
            </View>

            <View style={styles.prayerNameRow}>
              <View style={styles.currentPrayerValue}>
                <Text
                  numberOfLines={1}
                  style={styles.prayerName}
                >
                  {currentPrayer?.label ?? ""}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                style={[styles.prayerName, styles.upcomingPrayerName]}
              >
                {nextPrayer?.label ?? "Fajr"}
              </Text>
            </View>

            <PrayerCountdown timestamp={nextPrayer?.timestamp ?? null} />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ouvrir le calendrier islamique"
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
                <Text numberOfLines={1} style={styles.metaText}>
                  {nextPrayer?.time ?? "--:--"} · {formatDateLabel(new Date(now))}
                </Text>
                <Text numberOfLines={1} style={styles.hijriEventText}>
                  {formatHijri(hijriDate)} · {hijriEventLabel}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={14}
                color="rgba(255,249,242,0.75)"
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choisir la localisation des horaires de prière"
              onPress={() => setLocationOptionsVisible(true)}
              style={({ pressed }) => [
                styles.metaRow,
                styles.locationMetaRow,
                pressed && styles.metaRowPressed,
              ]}
            >
              <Ionicons
                name="location-outline"
                size={15}
                color={colors.goldLight}
              />
              <View style={styles.locationMetaCopy}>
                <Text numberOfLines={1} style={styles.metaText}>
                  {source?.label ?? "Votre position"}
                </Text>
                <Text numberOfLines={1} style={styles.locationMetaSubtitle}>
                  Localisation des horaires de prière
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={14}
                color="rgba(255,249,242,0.75)"
              />
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Configurer les alertes de l’adhan"
            onPress={() => setAdhanSettingsVisible(true)}
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
            <Text style={styles.adhanText}>Adhan</Text>
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
              pointerEvents="none"
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
              <Ionicons name="time-outline" size={13} color="#F2B94C" />
              <Text
                style={[
                  styles.orbitCenterText,
                  showFridayJumuah && styles.orbitCenterTextJumuah,
                ]}
              >
                {showFridayJumuah ? `Joumou’a\n${mainMosqueJumuah}` : "Cycle des prières"}
              </Text>
              <View style={styles.orbitCenterLine} />
            </View>

            <View
              style={styles.orbitStations}
            >
              {orbitLayoutReady && timeline.map((prayer, index) => (
                <View
                  key={prayer.key}
                  style={[
                    styles.orbitStation,
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
                      prayer.active && styles.orbitNodeActive,
                    ]}
                  >
                    {prayer.active ? (
                      <>
                        <Animated.View
                          style={[styles.orbitNodePulse, { opacity: orbitGlow }]}
                        />
                        <View style={styles.orbitNodeHalo} />
                      </>
                    ) : null}
                    <Ionicons
                      name={prayer.icon}
                      size={prayer.active ? 19 : 15}
                      color={prayer.active ? "#1B1220" : "#F9E8C9"}
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
                      {prayer.label}
                    </Text>
                    <Text
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
                </View>
              ))}
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
          accessibilityLabel="Fermer les options de localisation"
          onPress={() => setLocationOptionsVisible(false)}
          style={styles.locationModalBackdrop}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.locationSheet}
          >
            <View style={styles.adhanSheetHandle} />
            <Text style={styles.locationSheetTitle}>Localisation</Text>
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
                Utiliser ma position actuelle
              </Text>
            </Pressable>
            <View style={styles.cityPicker}>
              <View style={styles.locationOption}>
                <Ionicons name="search-outline" size={20} color={colors.goldLight} />
                <Text style={styles.locationOptionText}>Choisir une autre ville</Text>
              </View>
              <View style={styles.cityPickerRow}>
                <TextInput
                  value={cityQuery}
                  onChangeText={setCityQuery}
                  placeholder="Ex. Marseille"
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
                  Utiliser ma mosquée favorite
                </Text>
              </Pressable>
            ) : null}
          </Pressable>
        </Pressable>
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
          accessibilityLabel="Fermer les réglages de l’adhan"
          onPress={() => setAdhanSettingsVisible(false)}
          style={styles.adhanModalBackdrop}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={[styles.adhanSheet, { paddingBottom: 24 + insets.bottom }]}
          >
            <View style={styles.adhanSheetHandle} />
            <View style={styles.adhanSheetHeader}>
              <View style={styles.adhanSheetTitleRow}>
                <View style={styles.adhanSheetIcon}>
                  <Ionicons name="volume-high" size={21} color="#24151A" />
                </View>
                <View>
                  <Text style={styles.adhanSheetEyebrow}>RAPPEL DES PRIÈRES</Text>
                  <Text style={styles.adhanSheetTitle}>Adhan et alertes</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fermer"
                onPress={() => setAdhanSettingsVisible(false)}
                style={styles.adhanSheetClose}
              >
                <Ionicons name="close" size={21} color="#FFF7EE" />
              </Pressable>
            </View>

            <View style={styles.adhanMainToggle}>
              <View style={styles.adhanSettingCopy}>
                <Text style={styles.adhanSettingTitle}>Activer les alertes</Text>
                <Text style={styles.adhanSettingSubtitle}>
                  Vos choix seront mémorisés sur cet appareil
                </Text>
              </View>
              <Switch
                value={adhanPreferences.enabled}
                onValueChange={(enabled) => void toggleAdhanAlerts(enabled)}
                trackColor={{ false: "#423A43", true: "rgba(236,177,61,0.55)" }}
                thumbColor={adhanPreferences.enabled ? "#F2B53D" : "#918893"}
              />
            </View>

            <Text style={styles.adhanSectionLabel}>PRIÈRES CONCERNÉES</Text>
            <View style={styles.adhanPrayerGrid}>
              {ADHAN_PRAYERS.map((prayer) => {
                const selected = adhanPreferences.prayers[prayer];
                return (
                  <Pressable
                    key={prayer}
                    disabled={!adhanPreferences.enabled}
                    onPress={() =>
                      updateAdhanPreferences((current) => ({
                        ...current,
                        prayers: {
                          ...current.prayers,
                          [prayer]: !current.prayers[prayer],
                        },
                      }))
                    }
                    style={[
                      styles.adhanPrayerChoice,
                      selected && styles.adhanChoiceSelected,
                      !adhanPreferences.enabled && styles.adhanChoiceDisabled,
                    ]}
                  >
                    <Ionicons
                      name={selected ? "checkmark-circle" : "ellipse-outline"}
                      size={16}
                      color={selected ? "#F6C75D" : "#817985"}
                    />
                    <Text
                      style={[
                        styles.adhanChoiceText,
                        selected && styles.adhanChoiceTextSelected,
                      ]}
                    >
                      {PRAYER_LABELS[prayer]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={styles.adhanSectionLabel}>TYPE D’ALERTE</Text>
            <View style={styles.adhanOptionRow}>
              {ADHAN_MODES.map((mode) => {
                const selected = adhanPreferences.mode === mode.key;
                return (
                  <Pressable
                    key={mode.key}
                    disabled={!adhanPreferences.enabled}
                    onPress={() =>
                      updateAdhanPreferences((current) => ({
                        ...current,
                        mode: mode.key,
                      }))
                    }
                    style={[
                      styles.adhanModeChoice,
                      selected && styles.adhanChoiceSelected,
                      !adhanPreferences.enabled && styles.adhanChoiceDisabled,
                    ]}
                  >
                    <Ionicons
                      name={mode.icon}
                      size={18}
                      color={selected ? "#F6C75D" : "#A49BA8"}
                    />
                    <Text
                      style={[
                        styles.adhanModeText,
                        selected && styles.adhanChoiceTextSelected,
                      ]}
                    >
                      {mode.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {adhanPreferences.mode === "adhan" && (
              <>
                <Text style={styles.adhanSectionLabel}>VOIX DE L’ADHAN</Text>
                <View style={styles.adhanOptionRow}>
                  {ADHAN_VOICES.map((voice) => {
                    const selected = adhanPreferences.voice === voice.key;
                    return <Pressable key={voice.key} onPress={() => updateAdhanPreferences((current) => ({ ...current, voice: voice.key }))} style={[styles.adhanLeadChoice, selected && styles.adhanChoiceSelected]}>
                      <Text style={[styles.adhanModeText, selected && styles.adhanChoiceTextSelected]}>{voice.label}</Text>
                    </Pressable>;
                  })}
                </View>
                <Pressable
                  accessibilityLabel={adhanPlayerStatus.playing ? "Mettre l’aperçu de l’Adhan en pause" : "Écouter l’aperçu de l’Adhan"}
                  style={styles.adhanPreviewButton}
                  onPress={() => adhanPlayerStatus.playing ? adhanPlayer.pause() : adhanPlayer.play()}
                >
                  <Ionicons name={adhanPlayerStatus.playing ? "pause" : "play"} size={19} color="#281816" />
                  <Text style={styles.adhanPreviewText}>
                    {adhanPlayerStatus.playing ? "Mettre en pause" : "Écouter l’aperçu"}
                  </Text>
                </Pressable>
              </>
            )}

            <Text style={styles.adhanSectionLabel}>MOMENT DU RAPPEL</Text>
            <View style={styles.adhanOptionRow}>
              {ADHAN_LEAD_TIMES.map((minutes) => {
                const selected = adhanPreferences.leadMinutes === minutes;
                return (
                  <Pressable
                    key={minutes}
                    disabled={!adhanPreferences.enabled}
                    onPress={() =>
                      updateAdhanPreferences((current) => ({
                        ...current,
                        leadMinutes: minutes,
                      }))
                    }
                    style={[
                      styles.adhanLeadChoice,
                      selected && styles.adhanChoiceSelected,
                      !adhanPreferences.enabled && styles.adhanChoiceDisabled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.adhanModeText,
                        selected && styles.adhanChoiceTextSelected,
                      ]}
                    >
                      {minutes === 0 ? "À l’heure" : `-${minutes} min`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setAdhanSettingsVisible(false)}
              style={styles.adhanDoneButton}
            >
              <LinearGradient
                colors={["#F5D276", "#D59A35"]}
                style={StyleSheet.absoluteFill}
              />
              <Text style={styles.adhanDoneText}>Enregistrer</Text>
            </Pressable>
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
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  prayerInfo: {
    position: "absolute",
    top: 87,
    left: 18,
    width: "70%",
  },
  nextLabel: {
    width: 124,
    color: "rgba(248,240,232,0.86)",
    fontFamily: typography.serifMedium,
    fontSize: 12.5,
    letterSpacing: 0.25,
  },
  prayerLabels: {
    flexDirection: "row",
    alignItems: "center",
  },
  prayerNameRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  currentPrayerValue: {
    width: 124,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  prayerName: {
    color: "#FFF9F3",
    fontFamily: typography.serifSemibold,
    fontSize: 35,
    lineHeight: 40,
  },
  prayerSymbol: {
    marginLeft: 11,
    textShadowColor: "#E3A62E",
    textShadowRadius: 13,
  },
  upcomingPrayerName: {
    flex: 1,
    minWidth: 0,
    textAlign: "left",
  },
  countdown: {
    marginTop: 1,
    color: "#F3B83F",
    fontFamily: typography.serifSemibold,
    fontSize: 30,
    lineHeight: 35,
    letterSpacing: 1.3,
    fontVariant: ["tabular-nums"],
    textShadowColor: "rgba(225,157,34,0.35)",
    textShadowRadius: 9,
  },
  metaRow: {
    maxWidth: 285,
    minHeight: 23,
    marginTop: 5,
    paddingHorizontal: 0,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  metaText: {
    flexShrink: 1,
    marginLeft: 8,
    color: "#FFF9F2",
    fontFamily: typography.sans,
    fontSize: 12.5,
    fontWeight: "600",
    textShadowColor: "rgba(0,0,0,0.78)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  locationMetaRow: {
    maxWidth: 300,
    paddingRight: 8,
  },
  locationMetaCopy: {
    flex: 1,
    minWidth: 0,
  },
  locationMetaSubtitle: {
    marginLeft: 8,
    marginTop: 1,
    color: "rgba(242,224,202,0.78)",
    fontFamily: typography.sans,
    fontSize: 9.5,
    textShadowColor: "rgba(0,0,0,0.70)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  dateMetaRow: {
    minHeight: 37,
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
  metaRowPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },
  adhan: {
    position: "absolute",
    top: 82,
    right: 15,
    minHeight: 38,
    paddingHorizontal: 14,
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
    marginLeft: 8,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 21,
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
  adhanPreviewButton: {
    minHeight: 46,
    marginTop: 11,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(246,199,93,0.82)",
    backgroundColor: "#F2C55B",
  },
  adhanPreviewText: {
    color: "#281816",
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: "800",
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
    ...StyleSheet.absoluteFillObject,
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
    marginLeft: 4,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 11,
    lineHeight: 12,
    textAlign: "center",
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
});
