import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { getValidSession } from "../../features/auth/SupabaseAuthService";
import { goalProgressBridge } from "../../features/daily-goals/services/goalProgressBridge";
import { goalRepository } from "../../features/daily-goals/data/goalRepository";
import type { DailyGoalSettings } from "../../features/daily-goals/domain/DailyPlan";
import {
  DEFAULT_NOTIFICATION_CENTER_PREFERENCES,
  saveNotificationCenterPreferences,
} from "../../features/notifications/NotificationCenter";
import {
  createProfileDraft,
  getCurrentUserProfile,
  updateProfile,
} from "../../features/profile/UserProfileRepository";
import type { ProgressDomain } from "../../core/repositories/UserRepository";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Focus = DailyGoalSettings["focus"][number];

function progressDomainForFocus(focus: Focus): ProgressDomain {
  if (focus === "prayer") return "prayer";
  if (focus === "quran") return "quran_reading";
  if (focus === "hifz") return "quran_memorization";
  if (focus === "dhikr") return "regularity";
  return focus;
}

const steps = [
  { title: "Quel est ton objectif principal ?", options: [
    ["prayer", "Être plus régulier dans mes prières"],
    ["quran", "Lire plus de Coran"],
    ["dhikr", "Faire plus de Dhikr"],
    ["dua", "Apprendre des dou'as"],
    ["hifz", "Mémoriser le Coran"],
  ] as [Focus, string][] },
  { title: "Combien de temps peux-tu consacrer chaque jour ?", options: [
    ["5", "5 min"], ["10", "10 min"], ["20", "20 min"], ["30", "30 min+"],
  ] as [string, string][] },
  { title: "Souhaites-tu recevoir des rappels ?", options: [["yes", "Oui"], ["no", "Non"]] as [string, string][] },
] as const;

function Choice({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.choiceSelected, pressed && styles.pressed]}>
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
      <Ionicons name={selected ? "checkmark-circle" : "ellipse-outline"} size={22} color={selected ? colors.goldLight : colors.textMuted} />
    </Pressable>
  );
}

export default function DailyGoalsOnboardingScreen() {
  const { fresh } = useLocalSearchParams<{ fresh?: string }>();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [selectedGoals, setSelectedGoals] = useState<Focus[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const current = steps[step];

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (fresh !== "1") {
          router.replace("/daily-goals");
          return;
        }
        const session = await getValidSession();
        if (!session) {
          router.replace("/profile");
          return;
        }
        const profile = (await getCurrentUserProfile()) ?? (await createProfileDraft(session.user.id));
        if (profile.profileCompleted) {
          router.replace("/daily-goals");
          return;
        }
        if (active) setUserId(session.user.id);
      } catch {
        if (active) setError("L’onboarding n’a pas pu être chargé. Réessaie.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [fresh]);

  const selected = step === 0 ? selectedGoals.length > 0 : answers[step];
  const summary = useMemo(() => [
    selectedGoals.map((goal) => steps[0].options.find(([value]) => value === goal)?.[1]).filter(Boolean).join(", "),
    steps[1].options.find(([value]) => value === answers[1])?.[1],
    steps[2].options.find(([value]) => value === answers[2])?.[1],
  ].filter(Boolean) as string[], [answers, selectedGoals]);

  const finish = async () => {
    if (!userId) return;
    setSaving(true);
    setError(null);
    try {
      const focus = selectedGoals;
      const settings: DailyGoalSettings = {
        focus,
        dailyMinutes: Number(answers[1]) as DailyGoalSettings["dailyMinutes"],
        onboardingComplete: true,
      };
      const plan = await goalRepository.updateProgram(settings);
      goalProgressBridge.notify(plan);
      const reminders = answers[2] === "yes";
      await saveNotificationCenterPreferences({
        ...DEFAULT_NOTIFICATION_CENTER_PREFERENCES,
        systemEnabled: reminders,
        reminders: Object.fromEntries(Object.keys(DEFAULT_NOTIFICATION_CENTER_PREFERENCES.reminders).map((key) => [key, reminders])) as typeof DEFAULT_NOTIFICATION_CENTER_PREFERENCES.reminders,
      });
      await updateProfile(userId, {
        dailyTimeMinutes: settings.dailyMinutes,
        weeklyTimeMinutes: settings.dailyMinutes * 7,
        primaryGoals: focus.map(progressDomainForFocus),
        progressDomains: [],
        onboardingStep: 5,
        profileCompleted: true,
        completedAt: new Date().toISOString(),
      });
      router.replace("/daily-goals");
    } catch {
      setError("La création de ton programme a échoué. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (!selected) {
      setError("Choisis une réponse pour continuer.");
      return;
    }
    setError(null);
    if (step === steps.length - 1) void finish();
    else setStep((value) => value + 1);
  };

  if (loading) return <SafeAreaView style={styles.safe}><ActivityIndicator color={colors.goldLight} size="large" /></SafeAreaView>;
  if (step === steps.length) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => step ? setStep((value) => value - 1) : router.replace("/profile")} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
          <Text style={styles.backText}>Retour</Text>
        </Pressable>
        <Text style={styles.step}>ÉTAPE {step + 1} SUR {steps.length}</Text>
      </View>
      <View style={styles.track}><View style={[styles.progress, { width: `${((step + 1) / steps.length) * 100}%` }]} /></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 0 ? <Text style={styles.eyebrow}>BIENVENUE DANS OUMMAH</Text> : null}
        <Text style={styles.title}>{current.title}</Text>
        {step === 0 ? <><Text style={styles.helper}>Quels objectifs souhaites-tu travailler ?</Text><Text style={styles.hint}>Tu peux en choisir plusieurs.</Text></> : null}
        <View style={styles.options}>{current.options.map(([value, label]) => <Choice key={value} label={label} selected={step === 0 ? selectedGoals.includes(value as Focus) : selected === value} onPress={() => {
          if (step === 0) {
            const goal = value as Focus;
            setSelectedGoals((old) => old.includes(goal) ? old.filter((item) => item !== goal) : [...old, goal]);
          } else {
            setAnswers((old) => ({ ...old, [step]: value }));
          }
        }} />)}</View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {step === steps.length - 1 && answers[2] ? <View style={styles.summary}><Text style={styles.summaryTitle}>BarakAllahou fik, ton programme est prêt</Text>{summary.map((item) => <Text key={item} style={styles.summaryItem}>• {item}</Text>)}</View> : null}
      </ScrollView>
      <View style={styles.footer}><Pressable disabled={saving || (step === 0 && selectedGoals.length === 0)} onPress={next} style={({ pressed }) => [styles.button, (saving || (step === 0 && selectedGoals.length === 0)) && styles.disabled, pressed && styles.pressed]}>{saving ? <ActivityIndicator color={colors.background} /> : <><Text style={styles.buttonText}>{step === steps.length - 1 ? "Commencer" : "Continuer"}</Text><Ionicons name="arrow-forward" size={18} color={colors.background} /></>}</Pressable></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { alignItems: "center", flexDirection: "row", minHeight: 58, paddingHorizontal: 18 },
  back: { alignItems: "center", backgroundColor: colors.surface, borderRadius: 18, flexDirection: "row", paddingHorizontal: 10, paddingVertical: 9 },
  backText: { color: colors.text, fontFamily: typography.sans, fontSize: 12 },
  step: { color: colors.textMuted, flex: 1, fontFamily: typography.sans, fontSize: 10, fontWeight: "700", letterSpacing: 1.2, textAlign: "center" },
  track: { backgroundColor: colors.surfaceAlt, height: 3, marginHorizontal: 18 },
  progress: { backgroundColor: colors.goldLight, height: 3 },
  content: { paddingBottom: 30, paddingHorizontal: 18, paddingTop: 32 },
  eyebrow: { color: colors.gold, fontFamily: typography.sans, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 34, lineHeight: 40, marginTop: 8 },
  helper: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15, lineHeight: 21, marginTop: 22 },
  hint: { alignSelf: "flex-start", backgroundColor: "rgba(242,181,61,0.14)", borderColor: "rgba(242,181,61,0.38)", borderRadius: 10, borderWidth: 1, color: colors.goldLight, fontFamily: typography.sans, fontSize: 14, fontWeight: "700", marginTop: 9, paddingHorizontal: 11, paddingVertical: 7 },
  options: { gap: 12, marginTop: 30 },
  choice: { alignItems: "center", backgroundColor: colors.surface, borderColor: colors.borderSoft, borderRadius: 16, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 17 },
  choiceSelected: { backgroundColor: "rgba(242,181,61,0.13)", borderColor: colors.goldLight },
  choiceText: { color: colors.textSecondary, flex: 1, fontFamily: typography.sans, fontSize: 15 },
  choiceTextSelected: { color: colors.text, fontWeight: "700" },
  summary: { backgroundColor: "rgba(112,68,137,0.24)", borderColor: colors.borderSoft, borderRadius: 18, borderWidth: 1, marginTop: 28, padding: 18 },
  summaryTitle: { color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 22, lineHeight: 27, marginBottom: 12 },
  summaryItem: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, lineHeight: 24 },
  error: { color: colors.danger, fontFamily: typography.sans, fontSize: 13, marginTop: 18 },
  footer: { padding: 18 },
  button: { alignItems: "center", backgroundColor: colors.goldLight, borderRadius: 16, flexDirection: "row", justifyContent: "center", minHeight: 54, gap: 10 },
  buttonText: { color: colors.background, fontFamily: typography.sans, fontSize: 15, fontWeight: "800" },
  disabled: { opacity: 0.6 },
  pressed: { opacity: 0.78 },
});
