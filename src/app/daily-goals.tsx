import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { isGoalComplete, type DailyGoal } from "../features/daily-goals/domain/DailyGoal";
import type { DailyGoalSettings } from "../features/daily-goals/domain/DailyPlan";
import { goalRepository, summarizeDailyPlan } from "../features/daily-goals/data/goalRepository";
import DailyGoalCard from "../features/daily-goals/presentation/DailyGoalCard";
import DailyProgressHero from "../features/daily-goals/presentation/DailyProgressHero";
import EssentialGoalCard from "../features/daily-goals/presentation/EssentialGoalCard";
import WeeklySummaryCard from "../features/daily-goals/presentation/WeeklySummaryCard";
import { useDailyGoalsViewModel } from "../features/daily-goals/presentation/useDailyGoalsViewModel";
import { goalProgressBridge } from "../features/daily-goals/services/goalProgressBridge";
import { progressivePathRepository } from "../features/progressive-paths/data/progressivePathRepository";
import { nextProgressivePathSession, progressivePathProgress, type ProgressivePath } from "../features/progressive-paths/domain/ProgressivePath";
import { getPremiumAccess, type PremiumAccess } from "../features/premium/PremiumAccessService";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const PACES: DailyGoalSettings["dailyMinutes"][] = [5, 10, 20, 30];
const FOCUSES: Array<{
  id: DailyGoalSettings["focus"][number];
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: "quran", label: "Coran", icon: "book-outline" },
  { id: "dhikr", label: "Dhikr", icon: "ellipse-outline" },
  { id: "hifz", label: "Mémorisation", icon: "school-outline" },
  { id: "dua", label: "Dou’a", icon: "heart-outline" },
  { id: "hadith", label: "Hadith", icon: "library-outline" },
];

export default function DailyGoalsScreen() {
  const model = useDailyGoalsViewModel();
  const [addVisible, setAddVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [premiumProgramVisible, setPremiumProgramVisible] = useState(false);
  const [personalTitle, setPersonalTitle] = useState("");
  const [settings, setSettings] = useState<DailyGoalSettings | null>(null);
  const [weekly, setWeekly] = useState({ activeDays: 0, regularity: 0 });
  const [progressivePath, setProgressivePath] = useState<ProgressivePath | null>(null);
  const [premiumAccess, setPremiumAccess] = useState<PremiumAccess | null>(null);

  useEffect(() => {
    void Promise.all([
      goalRepository.readSettings(),
      goalRepository.recent(),
      progressivePathRepository.getActive(),
      getPremiumAccess(),
    ]).then(
      ([storedSettings, plans, activePath, access]) => {
        setSettings(storedSettings);
        const active = plans.filter((plan) => plan.goals.some(isGoalComplete));
        const summaries = plans.map(summarizeDailyPlan);
        const average = summaries.length
          ? Math.round(
              (summaries.reduce((sum, summary) => sum + summary.progress, 0) /
                summaries.length) *
                100,
            )
          : 0;
        setWeekly({ activeDays: active.length, regularity: average });
        setProgressivePath(activePath);
        setPremiumAccess(access);
      },
    );
  }, [model.plan?.updatedAt]);

  const orderedGoals = useMemo(() => {
    if (!model.plan) return [];
    const hour = new Date().getHours();
    const priority = (goal: DailyGoal) => {
      if (isGoalComplete(goal)) return 10;
      if (hour < 11 && goal.category === "quran") return 0;
      if (hour >= 18 && (goal.category === "dhikr" || goal.category === "hifz")) return 0;
      return goal.essential ? 1 : 2;
    };
    return [...model.plan.goals].sort((left, right) => priority(left) - priority(right));
  }, [model.plan]);
  const pathProgress = useMemo(() => progressivePath ? progressivePathProgress(progressivePath) : null, [progressivePath]);
  const nextPathSession = useMemo(() => progressivePath ? nextProgressivePathSession(progressivePath) : null, [progressivePath]);
  const pathLocked = !premiumAccess?.isPremium;

  const devotedMinutes = useMemo(
    () =>
      model.plan?.goals.reduce(
        (total, goal) => total + (isGoalComplete(goal) ? goal.estimatedMinutes : 0),
        0,
      ) ?? 0,
    [model.plan],
  );

  const openGoal = async (goal: DailyGoal) => {
    if (goal.validation === "manual") {
      await model.toggle(goal.id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      return;
    }
    if (goal.sourceRoute) router.push(goal.sourceRoute as Href);
  };

  const completePathSession = async (feedback: "easy" | "normal" | "difficult") => {
    if (!progressivePath || pathLocked) return;
    const updated = await progressivePathRepository.completeNext(progressivePath.id, feedback);
    if (updated) setProgressivePath(updated);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  };

  const postponePathSession = async () => {
    if (!progressivePath || pathLocked) return;
    const updated = await progressivePathRepository.postponeNext(progressivePath.id);
    if (updated) setProgressivePath(updated);
  };

  const addGoal = async () => {
    const title = personalTitle.trim();
    if (!title) return;
    await model.addPersonal(title);
    setPersonalTitle("");
    setAddVisible(false);
  };

  const choosePace = async (dailyMinutes: DailyGoalSettings["dailyMinutes"]) => {
    const next = {
      ...(settings ?? {
        focus: ["quran", "dhikr", "hifz", "dua", "hadith"] as DailyGoalSettings["focus"],
        onboardingComplete: true,
      }),
      dailyMinutes,
      onboardingComplete: true,
    };
    setSettings(next);
    const plan = await goalRepository.updateProgram(next);
    goalProgressBridge.notify(plan);
    await model.refresh();
  };

  const toggleFocus = async (focus: DailyGoalSettings["focus"][number]) => {
    if (!settings) return;
    const selected = settings.focus.includes(focus);
    if (selected && settings.focus.length === 1) return;
    const next = {
      ...settings,
      focus: selected
        ? settings.focus.filter((item) => item !== focus)
        : [...settings.focus, focus],
      onboardingComplete: true,
    };
    setSettings(next);
    const plan = await goalRepository.updateProgram(next);
    goalProgressBridge.notify(plan);
    await model.refresh();
  };

  if (model.loading || !model.plan || !model.summary || !model.essential) {
    return <SafeAreaView style={styles.safe}><ActivityIndicator color={colors.goldLight} style={styles.loader} /></SafeAreaView>;
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}><Ionicons name="arrow-back" size={21} color={colors.goldLight} /></Pressable>
        <View style={styles.headerCopy}><Text style={styles.headerTitle}>Objectifs du jour</Text><Text style={styles.headerSubtitle}>Avancez à votre rythme, avec constance</Text></View>
        <Pressable onPress={() => setSettingsVisible(true)} style={styles.headerButton}><Ionicons name="options-outline" size={20} color={colors.goldLight} /></Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <DailyProgressHero summary={model.summary} streak={weekly.activeDays} />
        <Pressable
          onPress={() => {
            if (premiumAccess?.isPremium) {
              router.push({ pathname: "/dalil", params: { prompt: "Je souhaite créer un programme personnalisé progressif" } } as Href);
              return;
            }
            setPremiumProgramVisible(true);
          }}
          style={styles.createProgramCard}
        >
          <View style={styles.createProgramIcon}>
            <Ionicons name="sparkles-outline" size={22} color={colors.goldLight} />
          </View>
          <View style={styles.createProgramCopy}>
            <View style={styles.createProgramTitleRow}>
              <Text style={styles.createProgramTitle}>Créer un programme personnalisé avec Wasil</Text>
              <View style={styles.createProgramBadge}>
                <Ionicons name="diamond-outline" size={12} color={colors.goldLight} />
                <Text style={styles.createProgramBadgeText}>PREMIUM</Text>
              </View>
            </View>
            <Text style={styles.createProgramText}>Un parcours adapté à votre objectif, votre rythme et votre progression.</Text>
          </View>
          <Ionicons name="chevron-forward" size={19} color={colors.goldMuted} />
        </Pressable>
        {progressivePath && pathProgress && nextPathSession ? (
          <>
            <Text style={styles.sectionLabel}>PARCOURS PREMIUM</Text>
            <View style={styles.pathCard}>
              <View style={styles.pathTop}>
                <View style={styles.pathBadge}><Ionicons name="diamond-outline" size={13} color={colors.goldLight} /><Text style={styles.pathBadgeText}>PREMIUM</Text></View>
                <Text style={styles.pathMeta}>{pathProgress.completed}/{pathProgress.total} séances</Text>
              </View>
              <Text style={styles.pathTitle}>{progressivePath.title}</Text>
              <Text style={styles.pathSubtitle}>{nextPathSession.title}</Text>
              <Text style={styles.pathDescription}>{nextPathSession.description}</Text>
              <View style={styles.pathTrack}><View style={[styles.pathFill, { width: `${Math.round(pathProgress.ratio * 100)}%` }]} /></View>
              {pathLocked ? (
                <View style={styles.pathLockedBox}>
                  <Ionicons name="lock-closed-outline" size={17} color={colors.goldLight} />
                  <View style={styles.pathLockedCopy}>
                    <Text style={styles.pathLockedTitle}>Parcours verrouillé</Text>
                    <Text style={styles.pathLockedText}>Un abonnement Premium actif est nécessaire pour poursuivre les séances et les révisions.</Text>
                  </View>
                  <Pressable onPress={() => router.push(premiumAccess?.reason === "signed-out" ? "/profile" : "/premium")} style={styles.pathLockedButton}>
                    <Text style={styles.pathLockedButtonText}>{premiumAccess?.reason === "signed-out" ? "Connexion" : "Premium"}</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.pathActions}>
                  <Pressable onPress={() => void postponePathSession()} style={styles.pathSecondary}><Text style={styles.pathSecondaryText}>Reporter</Text></Pressable>
                  <Pressable onPress={() => void completePathSession("difficult")} style={styles.pathSecondary}><Text style={styles.pathSecondaryText}>Difficile</Text></Pressable>
                  <Pressable onPress={() => void completePathSession("normal")} style={styles.pathPrimary}><Text style={styles.pathPrimaryText}>Séance terminée</Text></Pressable>
                </View>
              )}
            </View>
          </>
        ) : null}
        <Text style={styles.sectionLabel}>VOTRE PRIORITÉ</Text>
        <EssentialGoalCard goal={model.essential} onPress={() => void openGoal(model.essential!)} />
        <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Aujourd’hui</Text><Text style={styles.sectionMeta}>{model.summary.completed}/{model.summary.total} terminés</Text></View>
        <View style={styles.goals}>{orderedGoals.map((goal) => <DailyGoalCard key={goal.id} goal={goal} onPress={() => void openGoal(goal)} />)}</View>
        <Pressable onPress={() => setAddVisible(true)} style={styles.addButton}><Ionicons name="add" size={18} color={colors.goldLight} /><Text style={styles.addText}>Ajouter un objectif personnel</Text></Pressable>
        <Text style={styles.sectionLabel}>VOTRE RÉGULARITÉ</Text>
        <WeeklySummaryCard activeDays={weekly.activeDays} regularity={weekly.regularity} />
        <View style={styles.eveningCard}>
          <View style={styles.eveningIcon}><Ionicons name="moon-outline" size={19} color={colors.goldLight} /></View>
          <View style={styles.eveningCopy}>
            <Text style={styles.eveningEyebrow}>BILAN DE VOTRE JOURNÉE</Text>
            <Text style={styles.eveningTitle}>{model.summary.completed} objectifs sur {model.summary.total} · {devotedMinutes} min consacrées</Text>
            <Text style={styles.eveningText}>{model.summary.progress >= 1 ? "Votre journée est complète. Accueillez demain avec sérénité." : "Ce qui n’est pas terminé restera ici, sans dette pour demain."}</Text>
          </View>
        </View>
        <Text style={styles.footerNote}>Une nouvelle journée commence toujours sans dette. Les objectifs non terminés ne s’accumulent pas automatiquement.</Text>
      </ScrollView>

      <Modal visible={premiumProgramVisible} transparent animationType="fade" onRequestClose={() => setPremiumProgramVisible(false)}>
        <Pressable onPress={() => setPremiumProgramVisible(false)} style={styles.backdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.modalCard}>
            <View style={styles.premiumModalIcon}>
              <Ionicons name="diamond-outline" size={25} color={colors.goldLight} />
            </View>
            <Text style={styles.modalEyebrow}>WASIL PREMIUM</Text>
            <Text style={styles.modalTitle}>Votre programme sur mesure</Text>
            <Text style={styles.modalText}>La création de programmes progressifs personnalisés avec Wasil est réservée aux membres Premium.</Text>
            <Text style={styles.premiumModalDetail}>Wasil organise vos séances, vos révisions et adapte le parcours selon votre avancement.</Text>
            <View style={styles.modalActions}>
              <Pressable onPress={() => setPremiumProgramVisible(false)} style={styles.secondaryButton}>
                <Text style={styles.secondaryText}>Plus tard</Text>
              </Pressable>
              <Pressable onPress={() => { setPremiumProgramVisible(false); router.push(premiumAccess?.reason === "signed-out" ? "/profile" : "/premium"); }} style={styles.primaryButton}>
                <Text style={styles.primaryText}>{premiumAccess?.reason === "signed-out" ? "Se connecter" : "Découvrir Premium"}</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={addVisible} transparent animationType="fade" onRequestClose={() => setAddVisible(false)}>
        <Pressable onPress={() => setAddVisible(false)} style={styles.backdrop}><Pressable onPress={(event) => event.stopPropagation()} style={styles.modalCard}>
          <Text style={styles.modalEyebrow}>MES OBJECTIFS</Text><Text style={styles.modalTitle}>Ajouter une intention</Text><Text style={styles.modalText}>Une action simple, personnelle et réaliste pour aujourd’hui.</Text>
          <TextInput value={personalTitle} onChangeText={setPersonalTitle} placeholder="Ex. Appeler mes parents" placeholderTextColor={colors.textMuted} autoFocus style={styles.input} />
          <View style={styles.modalActions}><Pressable onPress={() => setAddVisible(false)} style={styles.secondaryButton}><Text style={styles.secondaryText}>Annuler</Text></Pressable><Pressable onPress={() => void addGoal()} style={styles.primaryButton}><Text style={styles.primaryText}>Ajouter</Text></Pressable></View>
        </Pressable></Pressable>
      </Modal>

      <Modal visible={settingsVisible} transparent animationType="slide" onRequestClose={() => setSettingsVisible(false)}>
        <Pressable onPress={() => setSettingsVisible(false)} style={styles.backdrop}><Pressable onPress={(event) => event.stopPropagation()} style={styles.settingsSheet}>
          <View style={styles.handle} /><Text style={styles.modalEyebrow}>PROGRAMME OUMMAH</Text><Text style={styles.modalTitle}>Votre rythme quotidien</Text><Text style={styles.modalText}>Combien de temps souhaitez-vous consacrer chaque jour ?</Text>
          <View style={styles.paces}>{PACES.map((minutes) => { const active = settings?.dailyMinutes === minutes; return <Pressable key={minutes} onPress={() => void choosePace(minutes)} style={[styles.pace, active && styles.paceActive]}><Text style={[styles.paceValue, active && styles.paceValueActive]}>{minutes}</Text><Text style={[styles.paceLabel, active && styles.paceLabelActive]}>MIN</Text></Pressable>; })}</View>
          <Text style={styles.focusTitle}>Sur quoi souhaitez-vous progresser ?</Text>
          <View style={styles.focuses}>{FOCUSES.map((focus) => { const active = settings?.focus.includes(focus.id); return <Pressable key={focus.id} onPress={() => void toggleFocus(focus.id)} style={[styles.focus, active && styles.focusActive]}><Ionicons name={focus.icon} size={15} color={active ? colors.goldLight : colors.textMuted} /><Text style={[styles.focusText, active && styles.focusTextActive]}>{focus.label}</Text></Pressable>; })}</View>
          <Text style={styles.calmNote}>Le programme s’adapte sans supprimer vos objectifs personnels ni votre progression du jour.</Text>
          <Pressable onPress={() => setSettingsVisible(false)} style={styles.primaryButtonWide}><Text style={styles.primaryText}>Terminer</Text></Pressable>
        </Pressable></Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, loader: { flex: 1 },
  header: { minHeight: 68, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  headerButton: { width: 39, height: 39, alignItems: "center", justifyContent: "center", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.09)", backgroundColor: "rgba(255,255,255,0.035)" },
  headerCopy: { flex: 1, minWidth: 0, marginHorizontal: 12 }, headerTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 25 }, headerSubtitle: { marginTop: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5 },
  content: { paddingHorizontal: 13, paddingBottom: 32 },
  createProgramCard: { minHeight: 94, marginTop: 13, padding: 14, flexDirection: "row", alignItems: "center", borderRadius: 21, borderWidth: 1, borderColor: "rgba(241,188,79,0.24)", backgroundColor: "rgba(74,40,88,0.18)" },
  createProgramIcon: { width: 47, height: 47, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: "rgba(241,188,79,0.10)" },
  createProgramCopy: { flex: 1, minWidth: 0, marginHorizontal: 11 },
  createProgramTitleRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  createProgramTitle: { flex: 1, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 17, lineHeight: 21 },
  createProgramBadge: { minHeight: 23, paddingHorizontal: 7, flexDirection: "row", alignItems: "center", borderRadius: 11, backgroundColor: "rgba(241,188,79,0.10)" },
  createProgramBadgeText: { marginLeft: 4, color: colors.goldLight, fontFamily: typography.sans, fontSize: 8.5, fontWeight: "800", letterSpacing: 0.65 },
  createProgramText: { marginTop: 5, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 16 },
  pathCard: { padding: 15, borderRadius: 21, borderWidth: 1, borderColor: "rgba(241,188,79,0.24)", backgroundColor: "rgba(74,40,88,0.18)" },
  pathTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pathBadge: { minHeight: 25, paddingHorizontal: 9, flexDirection: "row", alignItems: "center", borderRadius: 12, backgroundColor: "rgba(241,188,79,0.10)" },
  pathBadgeText: { marginLeft: 5, color: colors.goldLight, fontFamily: typography.sans, fontSize: 9.5, fontWeight: "800", letterSpacing: 0.8 },
  pathMeta: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11 },
  pathTitle: { marginTop: 12, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 },
  pathSubtitle: { marginTop: 7, color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 15 },
  pathDescription: { marginTop: 5, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 15 },
  pathTrack: { height: 5, marginTop: 13, overflow: "hidden", borderRadius: 3, backgroundColor: "rgba(255,255,255,0.07)" },
  pathFill: { height: "100%", borderRadius: 3, backgroundColor: colors.goldLight },
  pathActions: { marginTop: 13, flexDirection: "row", gap: 7 },
  pathLockedBox: { minHeight: 58, marginTop: 13, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", borderRadius: 15, borderWidth: 1, borderColor: "rgba(241,188,79,0.20)", backgroundColor: "rgba(8,7,15,0.28)" },
  pathLockedCopy: { flex: 1, minWidth: 0, marginHorizontal: 9 },
  pathLockedTitle: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11.5, fontWeight: "800" },
  pathLockedText: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, lineHeight: 12.5 },
  pathLockedButton: { minHeight: 32, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: colors.goldLight },
  pathLockedButtonText: { color: colors.background, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "800" },
  pathSecondary: { minHeight: 40, paddingHorizontal: 11, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: "rgba(255,255,255,0.055)" },
  pathSecondaryText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 11, fontWeight: "700" },
  pathPrimary: { minHeight: 40, flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: colors.goldLight },
  pathPrimaryText: { color: colors.background, fontFamily: typography.sans, fontSize: 11, fontWeight: "800" },
  sectionLabel: { marginTop: 19, marginBottom: 8, color: colors.goldMuted, fontFamily: typography.sans, fontSize: 10, fontWeight: "800", letterSpacing: 1.05 },
  sectionHeading: { marginTop: 22, marginBottom: 9, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sectionTitle: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 }, sectionMeta: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5 },
  goals: { gap: 8 }, addButton: { minHeight: 48, marginTop: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", borderRadius: 17, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(241,188,79,0.30)" }, addText: { marginLeft: 7, color: colors.goldLight, fontFamily: typography.sans, fontSize: 13, fontWeight: "700" },
  footerNote: { marginTop: 15, color: colors.textMuted, fontFamily: typography.serifMedium, fontSize: 11.5, lineHeight: 15, textAlign: "center" },
  eveningCard: { minHeight: 92, marginTop: 10, padding: 13, flexDirection: "row", alignItems: "center", borderRadius: 20, borderWidth: 1, borderColor: "rgba(241,188,79,0.13)", backgroundColor: "rgba(74,40,88,0.16)" }, eveningIcon: { width: 39, height: 39, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "rgba(241,188,79,0.08)" }, eveningCopy: { flex: 1, minWidth: 0, marginLeft: 11 }, eveningEyebrow: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 9.5, fontWeight: "800", letterSpacing: 0.9 }, eveningTitle: { marginTop: 4, color: colors.text, fontFamily: typography.serifMedium, fontSize: 15 }, eveningText: { marginTop: 4, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.2, lineHeight: 14 },
  backdrop: { flex: 1, justifyContent: "flex-end", padding: 12, backgroundColor: "rgba(3,4,10,0.74)" }, modalCard: { padding: 20, borderRadius: 25, borderWidth: 1, borderColor: "rgba(241,188,79,0.20)", backgroundColor: colors.backgroundSecondary },
  premiumModalIcon: { width: 52, height: 52, marginBottom: 15, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "rgba(241,188,79,0.10)" },
  premiumModalDetail: { marginTop: 12, padding: 12, borderRadius: 15, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 17, backgroundColor: "rgba(255,255,255,0.035)" },
  modalEyebrow: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 10, fontWeight: "800", letterSpacing: 1.1 }, modalTitle: { marginTop: 4, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 25 }, modalText: { marginTop: 7, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 17 },
  input: { height: 50, marginTop: 17, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.04)", color: colors.text, fontFamily: typography.sans, fontSize: 15 }, modalActions: { marginTop: 15, flexDirection: "row", gap: 8 },
  secondaryButton: { minHeight: 46, flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: "rgba(255,255,255,0.06)" }, secondaryText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, fontWeight: "700" }, primaryButton: { minHeight: 46, flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 15, backgroundColor: colors.goldLight }, primaryText: { color: colors.background, fontFamily: typography.sans, fontSize: 13, fontWeight: "800" },
  settingsSheet: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 26, borderRadius: 28, borderWidth: 1, borderColor: "rgba(241,188,79,0.20)", backgroundColor: colors.backgroundSecondary }, handle: { width: 42, height: 4, marginBottom: 18, alignSelf: "center", borderRadius: 2, backgroundColor: "rgba(255,255,255,0.18)" }, paces: { marginTop: 18, flexDirection: "row", gap: 7 }, pace: { height: 65, flex: 1, alignItems: "center", justifyContent: "center", borderRadius: 17, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.035)" }, paceActive: { borderColor: colors.goldLight, backgroundColor: "rgba(241,188,79,0.11)" }, paceValue: { color: colors.textSecondary, fontFamily: typography.serifSemibold, fontSize: 22 }, paceValueActive: { color: colors.goldLight }, paceLabel: { marginTop: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 9, fontWeight: "800" }, paceLabelActive: { color: colors.goldMuted }, calmNote: { marginTop: 15, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 15 }, primaryButtonWide: { minHeight: 48, marginTop: 17, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.goldLight },
  focusTitle: { marginTop: 19, marginBottom: 9, color: colors.textSecondary, fontFamily: typography.serifMedium, fontSize: 16 }, focuses: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, focus: { minHeight: 38, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", borderRadius: 13, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.03)" }, focusActive: { borderColor: "rgba(241,188,79,0.42)", backgroundColor: "rgba(241,188,79,0.09)" }, focusText: { marginLeft: 6, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, fontWeight: "700" }, focusTextActive: { color: colors.goldLight },
});
