import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, InteractionManager, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { PilgrimToggle } from "../components/pilgrimage/PilgrimBits";
import { pil, pilType } from "../components/pilgrimage/theme";
import { BOOKS, bookPages, HAJJ_TYPE_LABELS } from "../features/pilgrimage/pilgrimageBook";
import { getHajjSeason, type HajjSeason } from "../features/pilgrimage/pilgrimageCalendar";
import { CHECKLIST_TOTAL } from "../features/pilgrimage/pilgrimageChecklist";
import { syncHajjReminders, type HajjReminderStatus } from "../features/pilgrimage/pilgrimageReminders";
import { updatePilgrimageState, usePilgrimageState } from "../features/pilgrimage/pilgrimageStorage";
import type { Rite } from "../features/pilgrimage/pilgrimageTypes";

/** Book covers, shown whole (portrait 1122 × 1402). */
const COVER_RATIO = 1122 / 1402;
const BODY_PADDING = 18;
const SHELF_GAP = 12;
const COVERS: Record<Rite, { image: number }> = {
  umrah: { image: require("../assets/images/pilgrimage/umrah-cover.jpg") },
  hajj: { image: require("../assets/images/pilgrimage/hajj-cover.jpg") },
};

/** Virtues of the pilgrimage, one shown at a time. */
const VIRTUES = [
  { text: "Celui qui accomplit le pèlerinage sans propos indécents ni péchés revient comme au jour où sa mère l’a mis au monde.", source: "Sahîh al-Bukhârî 1521" },
  { text: "Une ‘Umra à une autre expie ce qui est entre elles, et le Hajj accepté n’a d’autre récompense que le Paradis.", source: "Sahîh al-Bukhârî 1773" },
  { text: "Il n’est pas de jour où Allah affranchit du Feu plus de serviteurs que le jour de ‘Arafa.", source: "Sahîh Muslim 1348" },
  { text: "Une ‘Umra accomplie en Ramadan équivaut à un Hajj.", source: "Sahîh al-Bukhârî 1782" },
];

const TOOLS: ReadonlyArray<{ id: string; title: string; text: string; icon: keyof typeof Ionicons.glyphMap; route: string }> = [
  { id: "tawaf", title: "Compteur de Tawâf", text: "7 tours, sans se tromper", icon: "sync-outline", route: "/pilgrimage/pilgrim-mode?tool=tawaf" },
  { id: "sai", title: "Compteur de Sa‘y", text: "Safâ ↔ Marwa, le bon sens", icon: "swap-vertical-outline", route: "/pilgrimage/pilgrim-mode?tool=sai" },
  { id: "jamarat", title: "Jamarât", text: "3 stèles, 7 cailloux", icon: "ellipsis-horizontal-circle-outline", route: "/pilgrimage/pilgrim-mode?tool=jamarat" },
  { id: "duas", title: "Invocations", text: "À lire en grand sur place", icon: "chatbubble-ellipses-outline", route: "/pilgrimage/invocations" },
  { id: "doubt", title: "J’ai un doute", text: "Que faire maintenant ?", icon: "help-buoy-outline", route: "/pilgrimage/problems" },
  { id: "bag", title: "Ma valise", text: "Ne rien oublier avant le départ", icon: "briefcase-outline", route: "/pilgrimage/checklist" },
  { id: "miqat", title: "Alerte mîqât", text: "Prévenu en avion avant la limite", icon: "airplane-outline", route: "/pilgrimage/miqat" },
];

const STARS = Array.from({ length: 34 }, (_, index) => ({
  x: (index * 97) % 100,
  y: (index * 53) % 100,
  r: index % 5 === 0 ? 1.6 : 0.9,
  o: 0.35 + ((index * 37) % 50) / 100,
}));

/** During the Hajj days, the page of the day in the Hajj book. */
const DAY_STEPS: Record<number, string> = { 8: "mina-8", 9: "arafat-9", 10: "nahr-10", 11: "tashriq-11", 12: "tashriq-12", 13: "tashriq-13" };

function reminderText(status: HajjReminderStatus | null, enabled: boolean) {
  if (!enabled) return "Une notification à chaque étape, du 8 au 13 Dhul-Hijja, à l’heure de La Mecque.";
  if (!status) return "Mise à jour…";
  if (status.kind === "denied") return "Autorisez les notifications d’OUMMAH dans les réglages du téléphone.";
  if (status.kind === "waiting") return status.days > 0 ? `Activé · programmés automatiquement dans ${status.days} jour${status.days > 1 ? "s" : ""}, à l’approche du Hajj.` : "Activé · programmés à l’approche du Hajj.";
  if (status.kind === "scheduled") return status.count ? `${status.count} rappel${status.count > 1 ? "s" : ""} programmé${status.count > 1 ? "s" : ""}, à l’heure de La Mecque.${status.approximate ? " Horaires précisés à la prochaine connexion." : ""}` : "Les jours du Hajj sont passés pour cette année.";
  return "";
}

function seasonText(season: HajjSeason) {
  if (season.kind === "days") return { title: `${season.dhulHijja} Dhul-Hijja ${season.hijriYear}`, text: season.label };
  const date = season.arafa.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return {
    title: season.days === 0 ? "Aujourd’hui, jour de ‘Arafa" : `‘Arafa dans ${season.days} jour${season.days > 1 ? "s" : ""}`,
    text: season.ramadan ? `Vers le ${date}. Et une ‘Umra en Ramadan équivaut à un Hajj.` : `Hajj ${season.hijriYear} · vers le ${date}, selon votre calendrier`,
  };
}

export default function PilgrimageHome() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  // Explicit size: the picture is drawn exactly in its box (an absolute fill let it overflow).
  const coverWidth = Math.floor((screenWidth - BODY_PADDING * 2 - SHELF_GAP) / 2);
  const coverHeight = Math.round(coverWidth / COVER_RATIO);
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
      const pages = bookPages(BOOKS[rite], rite === "hajj" ? state?.hajjType ?? null : null);
      const done = new Set(state?.reading[rite].done ?? []);
      const stepId = state?.reading[rite].stepId ?? null;
      const resume = stepId ? pages.find((page) => page.step.id === stepId) : null;
      result[rite] = {
        total: pages.length,
        done: pages.filter((page) => done.has(page.step.id)).length,
        resume: resume && resume.index > 0 ? `Reprendre · étape ${resume.index + 1}` : null,
      };
    }
    return result;
  }, [state]);

  const seasonCopy = season ? seasonText(season) : null;
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
          <Text style={styles.heroEyebrow}>GUIDE DU PÈLERIN</Text>
          <Text style={styles.heroTitle}>Hajj & ‘Umra</Text>
          <Text style={styles.heroText}>Deux livres à suivre pas à pas, des compteurs pour le jour J et des réponses quand on doute.</Text>
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
                {season.kind === "days" ? <Text style={styles.seasonAction}>Ouvrir le chapitre du jour</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={pil.gold} />
            </Pressable>
          ) : null}
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={[styles.back, { top: insets.top + 8 }]}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.body}>
          <View style={styles.reminders}>
            <View style={styles.remindersIcon}><Ionicons name="notifications" size={19} color={pil.ink} /></View>
            <View style={styles.remindersCopy}>
              <Text style={styles.remindersTitle}>Rappels des jours du Hajj</Text>
              <Text style={styles.remindersText}>{reminderText(reminderStatus, remindersEnabled)}</Text>
            </View>
            <PilgrimToggle value={remindersEnabled} onValueChange={toggleReminders} accessibilityLabel="Rappels des jours du Hajj" />
          </View>

          <Text style={styles.section}>Vos deux livres</Text>
          {/* Two covers side by side, like books on a shelf; each picture shown whole. */}
          <View style={styles.shelf}>
            {(["umrah", "hajj"] as const).map((rite) => {
              const book = BOOKS[rite];
              const item = progress[rite];
              const ratio = item.total ? item.done / item.total : 0;
              return (
                <Pressable
                  key={rite}
                  accessibilityRole="button"
                  accessibilityLabel={`Ouvrir le livre ${book.title}`}
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
                      {item.total} étapes{rite === "hajj" && state?.hajjType ? ` · ${HAJJ_TYPE_LABELS[state.hajjType].title}` : ""}
                    </Text>
                    <View style={styles.coverBar}><View style={[styles.coverBarFill, { width: `${ratio * 100}%` }]} /></View>
                    <View style={styles.coverAction}>
                      <Text numberOfLines={1} style={styles.coverActionText}>{item.resume ?? (item.done ? "Continuer" : "Ouvrir")}</Text>
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
              <Text style={styles.duaTitle}>Mes dou‘as à faire</Text>
              <Text style={styles.duaText}>
                {pendingDuas
                  ? `${pendingDuas} dou‘a${pendingDuas > 1 ? "s" : ""} confiée${pendingDuas > 1 ? "s" : ""} par vos proches`
                  : "Notez les dou‘as que vos proches vous confient"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={pil.gold} />
          </Pressable>

          <Text style={styles.section}>Sur place</Text>
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
                <Text style={styles.toolTitle}>{tool.title}</Text>
                <Text style={styles.toolText}>
                  {tool.id === "bag" && checklistDone ? `${checklistDone} / ${CHECKLIST_TOTAL} prêts` : tool.text}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityHint="Afficher une autre parole"
            onPress={() => setVirtue((value) => (value + 1) % VIRTUES.length)}
            style={styles.virtue}
          >
            <Ionicons name="sparkles" size={18} color={pil.gold} />
            <Text style={styles.virtueText}>« {VIRTUES[virtue].text} »</Text>
            <View style={styles.virtueFooter}>
              <Text style={styles.virtueSource}>{VIRTUES[virtue].source}</Text>
              <View style={styles.virtueDots}>
                {VIRTUES.map((_, index) => <View key={index} style={[styles.virtueDot, index === virtue && styles.virtueDotActive]} />)}
              </View>
            </View>
          </Pressable>

          <Text style={styles.disclaimer}>
            Ce guide aide à se repérer et cite ses sources. Pour une situation particulière pendant le pèlerinage, demandez l’avis d’une personne qualifiée.
          </Text>
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
