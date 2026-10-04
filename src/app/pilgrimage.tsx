import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, InteractionManager, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { pil, pilType } from "../components/pilgrimage/theme";
import { BOOKS, bookPages, HAJJ_TYPE_LABELS } from "../features/pilgrimage/pilgrimageBook";
import { getHajjSeason, type HajjSeason } from "../features/pilgrimage/pilgrimageCalendar";
import { CHECKLIST_TOTAL } from "../features/pilgrimage/pilgrimageChecklist";
import { usePilgrimageState } from "../features/pilgrimage/pilgrimageStorage";
import type { Rite } from "../features/pilgrimage/pilgrimageTypes";

const UMRAH_COVER = require("../assets/images/home/shortcuts/pilgrimage-premium.png");

const HAJJ_COVER = require("../assets/images/pilgrimage/hajj-cover.jpg");

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
];

const STARS = Array.from({ length: 34 }, (_, index) => ({
  x: (index * 97) % 100,
  y: (index * 53) % 100,
  r: index % 5 === 0 ? 1.6 : 0.9,
  o: 0.35 + ((index * 37) % 50) / 100,
}));

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
  const state = usePilgrimageState();
  const [season, setSeason] = useState<HajjSeason | null>(null);
  const [virtue, setVirtue] = useState(() => Math.floor(Date.now() / 86_400_000) % VIRTUES.length);

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
          {seasonCopy ? (
            <View style={styles.season}>
              <Ionicons name="moon" size={18} color={pil.gold} />
              <View style={styles.seasonCopy}>
                <Text style={styles.seasonTitle}>{seasonCopy.title}</Text>
                <Text style={styles.seasonText}>{seasonCopy.text}</Text>
              </View>
            </View>
          ) : null}
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} style={[styles.back, { top: insets.top + 8 }]}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>

        <View style={styles.body}>
          <Text style={styles.section}>Vos deux livres</Text>
          {(["umrah", "hajj"] as const).map((rite) => {
            const book = BOOKS[rite];
            const item = progress[rite];
            const ratio = item.total ? item.done / item.total : 0;
            return (
              <Pressable
                key={rite}
                accessibilityRole="button"
                onPress={() => router.push(`/pilgrimage/book?rite=${rite}`)}
                style={({ pressed }) => [styles.cover, pressed && styles.pressed]}
              >
                <View style={styles.coverImage}>
                  <Image source={rite === "umrah" ? UMRAH_COVER : HAJJ_COVER} resizeMode="cover" style={StyleSheet.absoluteFill} />
                  <LinearGradient colors={["rgba(12,10,18,0.05)", "rgba(12,10,18,0.55)", "rgba(12,10,18,0.97)"]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
                  <View style={styles.coverSpine} />
                  <View style={styles.coverContent}>
                    <Text style={styles.coverArabic}>{book.arabic}</Text>
                    <Text style={styles.coverTitle}>{book.title}</Text>
                    <Text style={styles.coverMeta}>
                      {book.chapters.length} chapitres · {item.total} étapes
                      {rite === "hajj" && state?.hajjType ? ` · ${HAJJ_TYPE_LABELS[state.hajjType].title}` : rite === "hajj" ? " · 3 types" : ""}
                    </Text>
                    <View style={styles.coverFooter}>
                      <View style={styles.coverBar}><View style={[styles.coverBarFill, { width: `${ratio * 100}%` }]} /></View>
                      <View style={styles.coverAction}>
                        <Text style={styles.coverActionText}>{item.resume ?? (item.done ? "Continuer" : "Ouvrir le livre")}</Text>
                        <Ionicons name="arrow-forward" size={16} color={pil.ink} />
                      </View>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          })}

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
  seasonTitle: { color: pil.text, fontSize: 17, fontWeight: "800", ...pilType.sans },
  seasonText: { marginTop: 2, color: pil.textSoft, fontSize: 14, lineHeight: 20, ...pilType.sans },
  back: { position: "absolute", left: 16, width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "rgba(33,27,44,0.9)" },
  body: { paddingHorizontal: 18 },
  section: { marginTop: 26, marginBottom: 12, color: pil.text, fontSize: 28, ...pilType.display },
  cover: { height: 236, marginBottom: 14, overflow: "hidden", borderRadius: 26, borderWidth: 1, borderColor: pil.goldLine },
  coverImage: { flex: 1 },
  coverSpine: { position: "absolute", left: 0, top: 0, bottom: 0, width: 7, backgroundColor: pil.gold, opacity: 0.85 },
  coverContent: { flex: 1, justifyContent: "flex-end", padding: 18, paddingLeft: 24 },
  coverArabic: { color: pil.gold, fontSize: 26, ...pilType.arabic },
  coverTitle: { color: pil.text, fontSize: 38, lineHeight: 42, ...pilType.display },
  coverMeta: { marginTop: 2, color: pil.text, fontSize: 14.5, fontWeight: "600", ...pilType.sans },
  coverFooter: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  coverBar: { flex: 1, height: 5, overflow: "hidden", borderRadius: 3, backgroundColor: "rgba(255,255,255,0.22)" },
  coverBarFill: { height: "100%", borderRadius: 3, backgroundColor: pil.gold },
  coverAction: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18, backgroundColor: pil.gold },
  coverActionText: { color: pil.ink, fontSize: 14, fontWeight: "800", ...pilType.sans },
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
