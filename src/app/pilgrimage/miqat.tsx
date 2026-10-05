import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useKeepAwake } from "expo-keep-awake";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, Vibration, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { SourceLine } from "../../components/pilgrimage/PilgrimBits";
import { pil, pilType } from "../../components/pilgrimage/theme";
import { ensureReminderChannel, reminderChannelId } from "../../features/notifications/notificationChannels";
import { alignedMiqat, kmToMiqat, MIQATS, type Miqat } from "../../features/pilgrimage/pilgrimageMiqat";
import { useI18n, type TranslationKey } from "../../i18n";

/** Typical cruise speed when the GPS gives none (m/s, ≈ 830 km/h). */
const DEFAULT_SPEED = 230;
const PREPARE_MINUTES = 30;
const NOW_MINUTES = 10;

type Stage = "far" | "prepare" | "now" | "passed";

const NOTES: TranslationKey[] = ["pilgrimage.miqat.note1", "pilgrimage.miqat.note2", "pilgrimage.miqat.note3"];

async function alert(title: string, body: string) {
  Vibration.vibrate([0, 500, 250, 500, 250, 800]);
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
  await ensureReminderChannel("sound");
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: "default",
      data: { route: "/pilgrimage/miqat" },
      ...(Platform.OS === "ios" ? { interruptionLevel: "timeSensitive" as const } : {}),
    },
    trigger: Platform.OS === "android" ? { channelId: reminderChannelId("sound") } : null,
  }).catch(() => undefined);
}

export default function MiqatScreen() {
  useKeepAwake();
  const insets = useSafeAreaInsets();
  const { language, t } = useI18n();
  const [tracking, setTracking] = useState(false);
  const [denied, setDenied] = useState(false);
  const [position, setPosition] = useState<{ latitude: number; longitude: number; speed: number | null } | null>(null);
  const [manual, setManual] = useState<Miqat | null>(null);
  const alerted = useRef<{ prepare: boolean; now: boolean }>({ prepare: false, now: false });
  const subscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => () => subscription.current?.remove(), []);

  const start = async () => {
    const permission = await Location.requestForegroundPermissionsAsync().catch(() => null);
    if (!permission?.granted) {
      setDenied(true);
      return;
    }
    setDenied(false);
    alerted.current = { prepare: false, now: false };
    await Notifications.requestPermissionsAsync().catch(() => undefined);
    subscription.current?.remove();
    subscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 10_000, distanceInterval: 500 },
      (location) => setPosition({ latitude: location.coords.latitude, longitude: location.coords.longitude, speed: location.coords.speed }),
    );
    setTracking(true);
  };

  const stop = () => {
    subscription.current?.remove();
    subscription.current = null;
    setTracking(false);
  };

  const miqat = manual ?? (position ? alignedMiqat(position) : null);
  const km = position && miqat ? kmToMiqat(position, miqat) : null;
  const speed = position?.speed && position.speed > 40 ? position.speed : DEFAULT_SPEED;
  const minutes = km === null ? null : Math.round((km * 1000) / speed / 60);
  const stage: Stage = km === null || minutes === null ? "far" : km <= 0 ? "passed" : minutes <= NOW_MINUTES ? "now" : minutes <= PREPARE_MINUTES ? "prepare" : "far";

  // Each alert once per flight.
  useEffect(() => {
    if (!tracking || !miqat) return;
    if ((stage === "prepare" || stage === "now") && !alerted.current.prepare) {
      alerted.current.prepare = true;
      if (stage === "prepare") void alert(t("pilgrimage.miqat.prepareTitle"), t("pilgrimage.miqat.prepareBody", { name: miqat.name, minutes: minutes ?? 0 }));
    }
    if (stage === "now" && !alerted.current.now) {
      alerted.current.now = true;
      void alert(t("pilgrimage.miqat.nowTitle"), t("pilgrimage.miqat.nowBody", { name: miqat.name, minutes: minutes ?? 0 }));
    }
  }, [miqat, minutes, stage, t, tracking]);

  const ring = 2 * Math.PI * 92;
  const progress = km === null ? 0 : Math.max(0, Math.min(1, 1 - km / 1500));
  const stageCopy: Record<Stage, { title: string; text: string; color: string }> = {
    far: tracking
      ? { title: t("pilgrimage.miqat.farOn"), text: t("pilgrimage.miqat.farOnText"), color: pil.gold }
      : { title: t("pilgrimage.miqat.farOff"), text: t("pilgrimage.miqat.farOffText"), color: pil.gold },
    prepare: { title: t("pilgrimage.miqat.prepareTitle"), text: t("pilgrimage.miqat.prepareText"), color: pil.gold },
    now: { title: t("pilgrimage.miqat.nowTitle"), text: t("pilgrimage.miqat.nowText"), color: pil.green },
    passed: { title: t("pilgrimage.miqat.passed"), text: t("pilgrimage.miqat.passedText"), color: pil.red },
  };
  const copy = stageCopy[stage];

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t("common.back")} onPress={() => router.back()} hitSlop={8} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>{t("pilgrimage.miqat.eyebrow")}</Text>
          <Text style={styles.title}>{t("pilgrimage.tool.miqat")}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.gauge}>
          <Svg width={220} height={220}>
            <Circle cx={110} cy={110} r={92} stroke="rgba(255,255,255,0.1)" strokeWidth={12} fill="none" />
            <Circle
              cx={110}
              cy={110}
              r={92}
              stroke={copy.color}
              strokeWidth={12}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${ring * progress} ${ring}`}
              transform="rotate(-90 110 110)"
            />
          </Svg>
          <View style={styles.gaugeCenter} pointerEvents="none">
            <Ionicons name="airplane" size={26} color={copy.color} />
            <Text style={styles.gaugeValue}>{km === null ? "—" : `${Math.round(km)} km`}</Text>
            <Text style={styles.gaugeLabel}>{minutes === null ? t("pilgrimage.miqat.beforeMiqat") : stage === "passed" ? t("pilgrimage.miqat.crossed") : `≈ ${minutes} min`}</Text>
          </View>
        </View>

        <View style={[styles.status, { borderColor: copy.color }]}>
          <Text style={[styles.statusTitle, { color: copy.color }]}>{copy.title}</Text>
          <Text style={styles.statusText}>{copy.text}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => (tracking ? stop() : void start())}
          style={({ pressed }) => [styles.primary, tracking && styles.primaryStop, pressed && styles.pressed]}
        >
          <Ionicons name={tracking ? "stop-circle-outline" : "navigate-outline"} size={22} color={tracking ? "#FFFFFF" : pil.ink} />
          <Text style={[styles.primaryText, tracking && styles.primaryTextStop]}>{tracking ? t("pilgrimage.miqat.stop") : t("pilgrimage.miqat.start")}</Text>
        </Pressable>
        {denied ? <Text style={styles.denied}>{t("pilgrimage.miqat.denied")}</Text> : null}

        <Text style={styles.section}>{t("pilgrimage.miqat.yours")}</Text>
        <View style={styles.miqats}>
          {MIQATS.map((item) => {
            const selected = miqat?.id === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => setManual(manual?.id === item.id ? null : item)}
                style={[styles.miqat, selected && styles.miqatSelected]}
              >
                <View style={styles.miqatHead}>
                  <Text style={styles.miqatName}>{item.name}</Text>
                  <Text style={styles.miqatArabic}>{item.arabic}</Text>
                </View>
                <Text style={styles.miqatText}>{item.people[language]} · {item.place[language]}</Text>
                {selected ? <Text style={styles.miqatBadge}>{manual ? t("pilgrimage.miqat.manual") : t("pilgrimage.miqat.detected")}</Text> : null}
              </Pressable>
            );
          })}
        </View>
        <SourceLine sources={[{ kind: "AUTHENTIC_HADITH", reference: "Sahîh al-Bukhârî 1526" }, { kind: "AUTHENTIC_HADITH", reference: "Sahîh al-Bukhârî 1531" }]} />

        <Pressable onPress={() => void alert(t("pilgrimage.miqat.testTitle"), t("pilgrimage.miqat.testBody"))} style={styles.test}>
          <Ionicons name="volume-high-outline" size={18} color={pil.gold} />
          <Text style={styles.testText}>{t("pilgrimage.miqat.test")}</Text>
        </Pressable>

        <View style={styles.notes}>
          {NOTES.map((key) => (
            <View key={key} style={styles.note}>
              <Ionicons name="information-circle-outline" size={17} color={pil.gold} />
              <Text style={styles.noteText}>{t(key)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: pil.bg },
  header: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: pil.surfaceHigh },
  headerCopy: { flex: 1 },
  eyebrow: { color: pil.gold, fontSize: 12, fontWeight: "800", letterSpacing: 1.3, ...pilType.sans },
  title: { color: pil.text, fontSize: 30, ...pilType.display },
  content: { paddingHorizontal: 18, paddingTop: 14 },
  gauge: { alignSelf: "center", width: 220, height: 220, alignItems: "center", justifyContent: "center" },
  gaugeCenter: { position: "absolute", alignItems: "center", gap: 2 },
  gaugeValue: { color: pil.text, fontSize: 34, fontWeight: "900", ...pilType.sans },
  gaugeLabel: { color: pil.textSoft, fontSize: 14, fontWeight: "700", ...pilType.sans },
  status: { marginTop: 12, padding: 16, borderRadius: 20, borderWidth: 1.5, backgroundColor: pil.surface },
  statusTitle: { fontSize: 21, fontWeight: "800", ...pilType.sans },
  statusText: { marginTop: 4, color: pil.text, fontSize: 15.5, lineHeight: 23, ...pilType.sans },
  primary: { marginTop: 14, minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderRadius: 29, backgroundColor: pil.gold },
  primaryStop: { backgroundColor: pil.surfaceHigh },
  primaryText: { color: pil.ink, fontSize: 17, fontWeight: "800", ...pilType.sans },
  primaryTextStop: { color: "#FFFFFF" },
  denied: { marginTop: 8, color: pil.red, fontSize: 14, textAlign: "center", ...pilType.sans },
  section: { marginTop: 26, marginBottom: 10, color: pil.text, fontSize: 24, ...pilType.display },
  miqats: { gap: 8 },
  miqat: { padding: 14, borderRadius: 18, borderWidth: 1, borderColor: pil.line, backgroundColor: pil.surface },
  miqatSelected: { borderColor: pil.gold, backgroundColor: pil.surfaceHigh },
  miqatHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  miqatName: { color: pil.text, fontSize: 17, fontWeight: "800", ...pilType.sans },
  miqatArabic: { color: pil.gold, fontSize: 19, ...pilType.arabic },
  miqatText: { marginTop: 3, color: pil.textSoft, fontSize: 14, ...pilType.sans },
  miqatBadge: { marginTop: 8, alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 3, overflow: "hidden", borderRadius: 8, color: pil.ink, backgroundColor: pil.gold, fontSize: 12, fontWeight: "800", ...pilType.sans },
  test: { marginTop: 18, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 24, borderWidth: 1, borderColor: pil.goldLine },
  testText: { color: pil.gold, fontSize: 15, fontWeight: "800", ...pilType.sans },
  notes: { marginTop: 18, gap: 10 },
  note: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  noteText: { flex: 1, color: pil.textSoft, fontSize: 14, lineHeight: 20, ...pilType.sans },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
