import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, InteractionManager, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { PilgrimToggle } from "../components/pilgrimage/PilgrimBits";
import { pil, pilType } from "../components/pilgrimage/theme";
import { bookPages } from "../features/pilgrimage/pilgrimageBook";
import { getHajjSeason, type HajjSeason } from "../features/pilgrimage/pilgrimageCalendar";
import { CHECKLIST_TOTAL } from "../features/pilgrimage/pilgrimageChecklist";
import { syncHajjReminders, type HajjReminderStatus } from "../features/pilgrimage/pilgrimageReminders";
import { updatePilgrimageState, usePilgrimageState } from "../features/pilgrimage/pilgrimageStorage";
import { sourceReference, usePilgrimageContent } from "../features/pilgrimage/pilgrimageI18n";
import type { Rite } from "../features/pilgrimage/pilgrimageTypes";
import { useI18n, type LanguageCode, type TranslationKey } from "../i18n";

/** Book covers, shown whole (portrait 1122 × 1402). */
const COVER_RATIO = 1122 / 1402;
const BODY_PADDING = 18;
const SHELF_GAP = 12;
const COVERS: Record<Rite, { image: number }> = {
  umrah: { image: require("../assets/images/pilgrimage/umrah-cover.jpg") },
  hajj: { image: require("../assets/images/pilgrimage/hajj-cover.jpg") },
};

/** Virtues of the pilgrimage, one shown at a time, in the words of the collections. */
const VIRTUES: ReadonlyArray<{ text: Record<LanguageCode, string>; source: string }> = [
  {
    text: {
      fr: "Celui qui accomplit le Hajj pour plaire à Allah, sans avoir de relations intimes avec sa femme, sans commettre de mauvaises actions ni de péchés, reviendra (du Hajj pur de tout péché) comme au jour où il est né.",
      en: "Whoever performs Hajj for Allah's pleasure and does not have sexual relations with his wife, and does not do evil or sins then he will return (after Hajj free from all sins) as if he were born anew.",
    },
    source: "Sahîh al-Bukhârî 1521",
  },
  {
    text: {
      fr: "La ‘Umra efface les péchés commis entre elle et la précédente. Et la récompense d’un Hajj Mabrur (accepté par Allah) n’est rien d’autre que le Paradis.",
      en: "(The performance of) ‘Umra is an expiation for the sins committed (between it and the previous one). And the reward of Hajj Mabrur (the one accepted by Allah) is nothing except Paradise.",
    },
    source: "Sahîh al-Bukhârî 1773",
  },
  {
    text: {
      fr: "Il n’y a pas de jour où Allah affranchit plus de gens de l’Enfer que le jour de ‘Arafa.",
      en: "There is no day when God sets free more servants from Hell than the Day of ‘Arafa.",
    },
    source: "Sahîh Muslim 1348",
  },
  {
    text: {
      fr: "La ‘Umra pendant le Ramadan équivaut au Hajj (en récompense).",
      en: "‘Umra in Ramadan is equal to Hajj (in reward).",
    },
    source: "Sahîh al-Bukhârî 1782",
  },
];

const TOOLS: ReadonlyArray<{ id: string; title: TranslationKey; text: TranslationKey; icon: keyof typeof Ionicons.glyphMap; route: string }> = [
  { id: "tawaf", title: "pilgrimage.tool.tawaf", text: "pilgrimage.tool.tawafText", icon: "sync-outline", route: "/pilgrimage/pilgrim-mode?tool=tawaf" },
  { id: "sai", title: "pilgrimage.tool.sai", text: "pilgrimage.tool.saiText", icon: "swap-vertical-outline", route: "/pilgrimage/pilgrim-mode?tool=sai" },
  { id: "jamarat", title: "pilgrimage.tool.jamarat", text: "pilgrimage.tool.jamaratText", icon: "ellipsis-horizontal-circle-outline", route: "/pilgrimage/pilgrim-mode?tool=jamarat" },
  { id: "duas", title: "pilgrimage.tool.duas", text: "pilgrimage.tool.duasText", icon: "chatbubble-ellipses-outline", route: "/pilgrimage/invocations" },
  { id: "doubt", title: "pilgrimage.tool.doubt", text: "pilgrimage.tool.doubtText", icon: "help-buoy-outline", route: "/pilgrimage/problems" },
  { id: "bag", title: "pilgrimage.tool.bag", text: "pilgrimage.tool.bagText", icon: "briefcase-outline", route: "/pilgrimage/checklist" },
  { id: "miqat", title: "pilgrimage.tool.miqat", text: "pilgrimage.tool.miqatText", icon: "airplane-outline", route: "/pilgrimage/miqat" },
  { id: "medina", title: "pilgrimage.tool.medina", text: "pilgrimage.tool.medinaText", icon: "star-outline", route: "/pilgrimage/book?rite=umrah&step=arrive-medina" },
];

const STARS = Array.from({ length: 34 }, (_, index) => ({
  x: (index * 97) % 100,
  y: (index * 53) % 100,
  r: index % 5 === 0 ? 1.6 : 0.9,
  o: 0.35 + ((index * 37) % 50) / 100,
}));

/** During the Hajj days, the page of the day in the Hajj book. */
const DAY_STEPS: Record<number, string> = { 8: "mina-8", 9: "arafat-9", 10: "nahr-10", 11: "tashriq-11", 12: "tashriq-12", 13: "tashriq-13" };

type Translate = ReturnType<typeof useI18n>["t"];

function reminderText(t: Translate, status: HajjReminderStatus | null, enabled: boolean) {
  if (!enabled) return t("pilgrimage.remindersOff");
  if (!status) return t("pilgrimage.remindersUpdating");
  if (status.kind === "denied") return t("pilgrimage.remindersDenied");
  if (status.kind === "waiting") {
    if (status.days <= 0) return t("pilgrimage.remindersWaiting");
    return status.days > 1 ? t("pilgrimage.remindersWaitingMany", { count: status.days }) : t("pilgrimage.remindersWaitingOne");
  }
  if (status.kind === "scheduled") {
    if (!status.count) return t("pilgrimage.remindersPast");
    const scheduled = status.count > 1 ? t("pilgrimage.remindersScheduledMany", { count: status.count }) : t("pilgrimage.remindersScheduledOne");
    return status.approximate ? scheduled + t("pilgrimage.remindersApproximate") : scheduled;
  }
  return "";
}

const DAY_LABELS: Record<number, TranslationKey> = {
  8: "pilgrimage.day.8", 9: "pilgrimage.day.9", 10: "pilgrimage.day.10", 11: "pilgrimage.day.11", 12: "pilgrimage.day.12", 13: "pilgrimage.day.13",
};

function seasonText(t: Translate, language: LanguageCode, season: HajjSeason) {
  if (season.kind === "days") {
    return {
      title: t("pilgrimage.seasonDayTitle", { day: season.dhulHijja, year: season.hijriYear }),
      text: t(DAY_LABELS[season.dhulHijja] ?? "pilgrimage.day.1"),
    };
  }
  const date = season.arafa.toLocaleDateString(language === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return {
    title: season.days === 0 ? t("pilgrimage.seasonToday") : season.days > 1 ? t("pilgrimage.seasonInMany", { count: season.days }) : t("pilgrimage.seasonInOne"),
    text: season.ramadan ? t("pilgrimage.seasonRamadan", { date }) : t("pilgrimage.seasonDate", { year: season.hijriYear, date }),
  };
}

export default function PilgrimageHome() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  // Explicit size: the picture is drawn exactly in its box (an absolute fill let it overflow).
  const coverWidth = Math.floor((screenWidth - BODY_PADDING * 2 - SHELF_GAP) / 2);
  const coverHeight = Math.round(coverWidth / COVER_RATIO);
  const { t } = useI18n();
  const { language, books, typeLabel } = usePilgrimageContent();
  const state = usePilgrimageState();
  const [season, setSeason] = useState<HajjSeason | null>(null);
  const [virtue, setVirtue] = useState(() => Math.floor(Date.now() / 86_400_000) % VIRTUES.length);
  const [reminderStatus, setReminderStatus] = useState<HajjReminderStatus | null>(null);
  const remindersEnabled = state?.hajjReminders ?? false;

  // Refresh at each visit: dates come closer, times get precise once online.
  useEffect(() => {
    if (!state) return;
    const task = InteractionManager.runAfterInteractions(() => {
      void syncHajjReminders(state.hajjReminders).then(setReminderStatus).catch(() => undefined);
    });
    return () => task.cancel();
    // Only when the switch changes or the screen first gets its state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.hajjReminders, Boolean(state)]);

  const toggleReminders = (value: boolean) => {
    setReminderStatus(null);
    void updatePilgrimageState((current) => ({ ...current, hajjReminders: value }));
    void syncHajjReminders(value, true).then(setReminderStatus).catch(() => undefined);
  };

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      void getHajjSeason().then(setSeason).catch(() => undefined);
    });
    return () => task.cancel();
  }, []);

  const progress = useMemo(() => {
    const result = {} as Record<Rite, { total: number; done: number; resume: string | null }>;
    for (const rite of ["umrah", "hajj"] as const) {
      const pages = bookPages(books[rite], rite === "hajj" ? state?.hajjType ?? null : null);
      const done = new Set(state?.reading[rite].done ?? []);
      const stepId = state?.reading[rite].stepId ?? null;
      const resume = stepId ? pages.find((page) => page.step.id === stepId) : null;
      result[rite] = {
        total: pages.length,
        done: pages.filter((page) => done.has(page.step.id)).length,
        resume: resume && resume.index > 0 ? t("pilgrimage.resumeStep", { step: resume.index + 1 }) : null,
      };
    }
    return result;
  }, [books, state, t]);

  const seasonCopy = season ? seasonText(t, language, season) : null;
  const checklistDone = state?.checklist.length ?? 0;
  const pendingDuas = state?.duaRequests.filter((item) => !item.doneAt).length ?? 0;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Night sky with the talbiya. */}
        <View style={[styles.hero, { paddingTop: insets.top + 64 }]}>
          <LinearGradient colors={["#1B1328", "#120E1C", pil.bg]} style={StyleSheet.absoluteFill} />
          <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
            {STARS.map((star, index) => <Circle key={index} cx={star.x} cy={star.y * 0.7} r={star.r * 0.25} fill="#FFFFFF" opacity={star.o} />)}
          </Svg>
          <Text style={styles.heroArabic}>لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ</Text>
          <Text style={styles.heroEyebrow}>{t("pilgrimage.heroEyebrow")}</Text>
          <Text style={styles.heroTitle}>{t("pilgrimage.heroTitle")}</Text>
          <Text style={styles.heroText}>{t("pilgrimage.heroText")}</Text>
          {seasonCopy && season ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                const step = season.kind === "days" ? DAY_STEPS[season.dhulHijja] ?? "types" : null;
                router.push(step ? `/pilgrimage/book?rite=hajj&step=${step}` : "/pilgrimage/book?rite=hajj");
              }}
              style={({ pressed }) => [styles.season, season.kind === "days" && styles.seasonLive, pressed && styles.pressed]}
            >
              <Ionicons name={season.kind === "days" ? "radio-button-on" : "moon"} size={18} color={pil.gold} />
              <View style={styles.seasonCopy}>
                <Text style={styles.seasonTitle}>{seasonCopy.title}</Text>
                <Text style={styles.seasonText}>{seasonCopy.text}</Text>
                {season.kind === "days" ? <Text style={styles.seasonAction}>{t("pilgrimage.openTodayChapter")}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={pil.gold} />
            </Pressable>
          ) : null}
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel={t("common.back")} onPress={() => router.back()} style={[styles.back, { top: insets.top + 8 }]}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.body}>
          <View style={styles.reminders}>
            <View style={styles.remindersIcon}><Ionicons name="notifications" size={19} color={pil.ink} /></View>
            <View style={styles.remindersCopy}>
              <Text style={styles.remindersTitle}>{t("pilgrimage.remindersTitle")}</Text>
              <Text style={styles.remindersText}>{reminderText(t, reminderStatus, remindersEnabled)}</Text>
            </View>
            <PilgrimToggle value={remindersEnabled} onValueChange={toggleReminders} accessibilityLabel={t("pilgrimage.remindersTitle")} />
          </View>

          <Text style={styles.section}>{t("pilgrimage.booksSection")}</Text>
          {/* Two covers side by side, like books on a shelf; each picture shown whole. */}
          <View style={styles.shelf}>
            {(["umrah", "hajj"] as const).map((rite) => {
              const book = books[rite];
              const item = progress[rite];
              const ratio = item.total ? item.done / item.total : 0;
              return (
                <Pressable
                  key={rite}
                  accessibilityRole="button"
                  accessibilityLabel={t("pilgrimage.openBook", { title: book.title })}
                  onPress={() => router.push(`/pilgrimage/book?rite=${rite}`)}
                  style={({ pressed }) => [styles.cover, { width: coverWidth }, pressed && styles.pressed]}
                >
                  <Image source={COVERS[rite].image} resizeMode="cover" style={[styles.coverImage, { width: coverWidth, height: coverHeight }]} />
                  <View style={styles.coverPanel}>
                    <View style={styles.coverTitleRow}>
                      <Text style={styles.coverTitle}>{book.title}</Text>
                      <Text style={styles.coverArabic}>{book.arabic}</Text>
                    </View>
                    <Text numberOfLines={1} style={styles.coverMeta}>
                      {t("pilgrimage.stepsCount", { count: item.total })}{rite === "hajj" && state?.hajjType ? ` · ${typeLabel(state.hajjType).title}` : ""}
                    </Text>
                    <View style={styles.coverBar}><View style={[styles.coverBarFill, { width: `${ratio * 100}%` }]} /></View>
                    <View style={styles.coverAction}>
                      <Text numberOfLines={1} style={styles.coverActionText}>{item.resume ?? (item.done ? t("pilgrimage.continue") : t("pilgrimage.open"))}</Text>
                      <Ionicons name="arrow-forward" size={14} color={pil.ink} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/pilgrimage/duas")}
            style={({ pressed }) => [styles.duaCard, pressed && styles.pressed]}
          >
            <View style={styles.duaIcon}><Ionicons name="heart" size={22} color={pil.ink} /></View>
            <View style={styles.duaCopy}>
              <Text style={styles.duaTitle}>{t("pilgrimage.duasTitle")}</Text>
              <Text style={styles.duaText}>
                {pendingDuas
                  ? pendingDuas > 1 ? t("pilgrimage.duasPendingMany", { count: pendingDuas }) : t("pilgrimage.duasPendingOne")
                  : t("pilgrimage.duasEmptyHint")}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={pil.gold} />
          </Pressable>

          <Text style={styles.section}>{t("pilgrimage.onSite")}</Text>
          <View style={styles.tools}>
            {TOOLS.map((tool) => (
              <Pressable
                key={tool.id}
                accessibilityRole="button"
                onPress={() => router.push(tool.route as never)}
                style={({ pressed }) => [styles.tool, tool.id === "doubt" && styles.toolDoubt, pressed && styles.pressed]}
              >
                <View style={[styles.toolIcon, tool.id === "doubt" && styles.toolIconDoubt]}>
                  <Ionicons name={tool.icon} size={22} color={pil.ink} />
                </View>
                <Text style={styles.toolTitle}>{t(tool.title)}</Text>
                <Text style={styles.toolText}>
                  {tool.id === "bag" && checklistDone ? t("pilgrimage.checklistReady", { done: checklistDone, total: CHECKLIST_TOTAL }) : t(tool.text)}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityHint={t("pilgrimage.nextVirtue")}
            onPress={() => setVirtue((value) => (value + 1) % VIRTUES.length)}
            style={styles.virtue}
          >
            <Ionicons name="sparkles" size={18} color={pil.gold} />
            <Text style={styles.virtueText}>{language === "fr" ? `« ${VIRTUES[virtue].text.fr} »` : `“${VIRTUES[virtue].text.en}”`}</Text>
            <View style={styles.virtueFooter}>
              <Text style={styles.virtueSource}>{sourceReference(VIRTUES[virtue].source, language)}</Text>
              <View style={styles.virtueDots}>
                {VIRTUES.map((_, index) => <View key={index} style={[styles.virtueDot, index === virtue && styles.virtueDotActive]} />)}
              </View>
            </View>
          </Pressable>

          <Text style={styles.disclaimer}>{t("pilgrimage.disclaimer")}</Text>
        </View>
      </ScrollView>
      {/* Keeps the clock and battery readable over the scrolling page. */}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(12,10,18,0.98)", "rgba(12,10,18,0.85)", "rgba(12,10,18,0)"]}
        locations={[0, 0.6, 1]}
        style={[styles.statusShade, { height: insets.top + 18 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: pil.bg },
  hero: { paddingHorizontal: 22, paddingBottom: 26, overflow: "hidden" },
  heroArabic: { color: pil.gold, fontSize: 34, lineHeight: 64, textAlign: "center", ...pilType.arabic },
  heroEyebrow: { marginTop: 18, color: pil.gold, fontSize: 12.5, fontWeight: "800", letterSpacing: 2.2, ...pilType.sans },
  heroTitle: { marginTop: 4, color: pil.text, fontSize: 48, lineHeight: 52, ...pilType.display },
  heroText: { marginTop: 8, color: pil.textSoft, fontSize: 17, lineHeight: 25, ...pilType.sans },
  season: { marginTop: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 18, borderWidth: 1, borderColor: pil.goldLine, backgroundColor: "rgba(232,187,98,0.10)" },
  seasonCopy: { flex: 1 },
  seasonLive: { borderColor: pil.gold, backgroundColor: "rgba(232,187,98,0.18)" },
  seasonAction: { marginTop: 6, color: pil.gold, fontSize: 13.5, fontWeight: "800", ...pilType.sans },
  statusShade: { position: "absolute", top: 0, left: 0, right: 0 },
  seasonTitle: { color: pil.text, fontSize: 17, fontWeight: "800", ...pilType.sans },
  seasonText: { marginTop: 2, color: pil.textSoft, fontSize: 14, lineHeight: 20, ...pilType.sans },
  back: { position: "absolute", left: 16, width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "rgba(33,27,44,0.9)" },
  body: { paddingHorizontal: BODY_PADDING },
  section: { marginTop: 26, marginBottom: 12, color: pil.text, fontSize: 28, ...pilType.display },
  shelf: { flexDirection: "row", gap: SHELF_GAP },
  cover: { overflow: "hidden", borderRadius: 20, borderWidth: 1, borderColor: pil.goldLine, backgroundColor: pil.surfaceHigh },
  coverImage: { backgroundColor: pil.surface },
  coverPanel: { padding: 12, gap: 7 },
  coverTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 },
  coverTitle: { color: pil.text, fontSize: 24, lineHeight: 28, ...pilType.display },
  coverArabic: { color: pil.gold, fontSize: 18, ...pilType.arabic },
  coverMeta: { color: pil.textSoft, fontSize: 12.5, fontWeight: "600", ...pilType.sans },
  coverBar: { height: 4, overflow: "hidden", borderRadius: 2, backgroundColor: "rgba(255,255,255,0.14)" },
  coverBarFill: { height: "100%", borderRadius: 2, backgroundColor: pil.gold },
  coverAction: { minHeight: 34, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderRadius: 17, backgroundColor: pil.gold },
  coverActionText: { color: pil.ink, fontSize: 13, fontWeight: "800", ...pilType.sans },
  reminders: { marginTop: 6, padding: 14, flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 20, backgroundColor: pil.surface },
  remindersIcon: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: pil.gold },
  remindersCopy: { flex: 1 },
  remindersTitle: { color: pil.text, fontSize: 16, fontWeight: "800", ...pilType.sans },
  remindersText: { marginTop: 3, color: pil.textSoft, fontSize: 13.5, lineHeight: 19, ...pilType.sans },
  duaCard: { marginTop: 18, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 22, borderWidth: 1, borderColor: pil.goldLine, backgroundColor: pil.surfaceHigh },
  duaIcon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 23, backgroundColor: pil.gold },
  duaCopy: { flex: 1 },
  duaTitle: { color: pil.text, fontSize: 17, fontWeight: "800", ...pilType.sans },
  duaText: { marginTop: 3, color: pil.textSoft, fontSize: 14, lineHeight: 20, ...pilType.sans },
  tools: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tool: { width: "48.4%", minHeight: 128, padding: 14, borderRadius: 22, borderWidth: 1, borderColor: pil.line, backgroundColor: pil.surface },
  toolDoubt: { borderColor: "rgba(242,165,155,0.35)" },
  toolIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: pil.gold },
  toolIconDoubt: { backgroundColor: pil.red },
  toolTitle: { marginTop: 12, color: pil.text, fontSize: 16, fontWeight: "800", ...pilType.sans },
  toolText: { marginTop: 3, color: pil.textSoft, fontSize: 13.5, lineHeight: 19, ...pilType.sans },
  virtue: { marginTop: 22, padding: 18, gap: 10, borderRadius: 24, borderWidth: 1, borderColor: pil.goldLine, backgroundColor: pil.surfaceHigh },
  virtueText: { color: pil.text, fontSize: 19, lineHeight: 28, ...pilType.display },
  virtueFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  virtueSource: { color: pil.gold, fontSize: 13, fontWeight: "800", ...pilType.sans },
  virtueDots: { flexDirection: "row", gap: 5 },
  virtueDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)" },
  virtueDotActive: { width: 16, backgroundColor: pil.gold },
  disclaimer: { marginTop: 22, color: pil.muted, fontSize: 13, lineHeight: 19, textAlign: "center", ...pilType.sans },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
});
