import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type {
  AgeRange,
  CurrentRegularity,
  DeclaredLevel,
  LearningPreference,
  ProgressDomain,
} from "../../core/repositories/UserRepository";
import { getValidSession } from "../../features/auth/SupabaseAuthService";
import {
  createProfileDraft,
  getCurrentUserProfile,
  markProfileCompleted,
  updateProfile,
} from "../../features/profile/UserProfileRepository";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const TOTAL_STEPS = 5;

const AGE_OPTIONS: { value: AgeRange; label: string }[] = [
  { value: "under_18", label: "Moins de 18 ans" },
  { value: "18_24", label: "18 à 24 ans" },
  { value: "25_34", label: "25 à 34 ans" },
  { value: "35_44", label: "35 à 44 ans" },
  { value: "45_54", label: "45 à 54 ans" },
  { value: "55_plus", label: "55 ans et plus" },
  { value: "prefer_not_to_say", label: "Je préfère ne pas répondre" },
];

const LEVEL_OPTIONS: { value: DeclaredLevel; label: string }[] = [
  { value: "beginner", label: "J’apprends encore les bases" },
  {
    value: "foundations",
    label: "Je connais l’essentiel mais je manque de régularité",
  },
  {
    value: "intermediate",
    label: "Je pratique régulièrement et je souhaite progresser",
  },
  {
    value: "advanced",
    label:
      "J’ai de bonnes connaissances et je cherche un accompagnement plus approfondi",
  },
  {
    value: "adaptive",
    label: "Je préfère que Wasil évalue progressivement mon niveau",
  },
];

const REGULARITY_OPTIONS: {
  value: CurrentRegularity;
  label: string;
}[] = [
  { value: "not_regular", label: "Pas encore régulier" },
  { value: "occasionally", label: "Occasionnellement" },
  { value: "weekly", label: "Chaque semaine" },
  { value: "almost_daily", label: "Presque tous les jours" },
  { value: "daily", label: "Tous les jours" },
];

const TIME_OPTIONS = [5, 10, 15, 20, 30, 45, 60] as const;

const GOAL_OPTIONS: { value: ProgressDomain; label: string }[] = [
  { value: "prayer", label: "Améliorer mes prières" },
  { value: "quran_reading", label: "Lire davantage le Coran" },
  { value: "quran_memorization", label: "Mémoriser le Coran" },
  { value: "arabic", label: "Apprendre l’arabe" },
  { value: "hadith", label: "Apprendre les hadiths" },
  { value: "dua", label: "Mémoriser des invocations" },
  { value: "aqida", label: "Approfondir la croyance" },
  { value: "fiqh", label: "Apprendre le fiqh" },
  { value: "character", label: "Améliorer mon comportement" },
  { value: "regularity", label: "Devenir plus régulier" },
];

const PREFERENCE_OPTIONS: {
  value: LearningPreference;
  label: string;
}[] = [
  { value: "short_sessions", label: "Sessions courtes" },
  { value: "structured_program", label: "Programme structuré" },
  { value: "audio", label: "Audio" },
  { value: "reading", label: "Lecture" },
  { value: "memorization", label: "Mémorisation" },
  { value: "revision", label: "Révision" },
  { value: "questions_with_wasil", label: "Questions avec Wasil" },
];

type ChoiceProps = {
  label: string;
  selected: boolean;
  onPress(): void;
};

function Choice({ label, selected, onPress }: ChoiceProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={4}
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        selected && styles.choiceSelected,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>
        {label}
      </Text>
      <Ionicons
        color={selected ? colors.goldLight : colors.textMuted}
        name={selected ? "checkmark-circle" : "ellipse-outline"}
        size={21}
      />
    </Pressable>
  );
}

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function normalizedStep(value: number) {
  return Math.min(TOTAL_STEPS, Math.max(1, Math.trunc(value)));
}

export default function ProfileOnboardingScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [declaredLevel, setDeclaredLevel] =
    useState<DeclaredLevel | null>(null);
  const [regularity, setRegularity] =
    useState<CurrentRegularity | null>(null);
  const [dailyMinutes, setDailyMinutes] = useState<number | null>(null);
  const [goals, setGoals] = useState<ProgressDomain[]>([]);
  const [preferences, setPreferences] = useState<LearningPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const session = await getValidSession();
        if (!session) {
          router.replace("/profile");
          return;
        }
        const profile =
          (await getCurrentUserProfile()) ??
          (await createProfileDraft(session.user.id));
        if (!active) return;
        if (profile.profileCompleted) {
          router.replace("/profile");
          return;
        }
        setUserId(session.user.id);
        setDisplayName(profile.displayName ?? "");
        setAgeRange(profile.ageRange);
        setDeclaredLevel(profile.declaredLevel);
        setRegularity(profile.currentRegularity);
        setDailyMinutes(profile.dailyTimeMinutes);
        setGoals(profile.primaryGoals);
        setPreferences(profile.learningPreferences);
        setStep(normalizedStep(profile.onboardingStep));
      } catch {
        if (active) {
          setError("Le profil n’a pas pu être chargé. Vérifiez votre connexion.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const validationMessage = () => {
    if (step === TOTAL_STEPS) {
      if (!displayName.trim()) return "Indiquez votre prénom ou votre pseudonyme.";
      if (!ageRange) return "Choisissez une tranche d’âge.";
      if (!declaredLevel) return "Choisissez la proposition qui vous correspond.";
      if (!regularity) return "Indiquez votre régularité actuelle.";
      if (dailyMinutes === null) return "Choisissez le temps disponible chaque jour.";
      if (goals.length === 0) return "Choisissez au moins un objectif principal.";
      if (preferences.length === 0) {
        return "Choisissez au moins une préférence d’apprentissage.";
      }
    }
    if (step === 1 && !displayName.trim()) {
      return "Indiquez votre prénom ou votre pseudonyme.";
    }
    if (step === 1 && !ageRange) return "Choisissez une tranche d’âge.";
    if (step === 2 && !declaredLevel) return "Choisissez la proposition qui vous correspond.";
    if (step === 3 && !regularity) return "Indiquez votre régularité actuelle.";
    if (step === 3 && dailyMinutes === null) return "Choisissez le temps disponible chaque jour.";
    if (step === 4 && goals.length === 0) return "Choisissez au moins un objectif principal.";
    if (step === 5 && preferences.length === 0) return "Choisissez au moins une préférence d’apprentissage.";
    return null;
  };

  const saveCurrentStep = async () => {
    if (!userId || savingRef.current) return;
    const validationError = validationMessage();
    if (validationError) {
      setError(validationError);
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setError(null);
    try {
      if (step === 1) {
        await updateProfile(userId, {
          displayName: displayName.trim(),
          ageRange,
          onboardingStep: 2,
        });
        setStep(2);
      } else if (step === 2) {
        await updateProfile(userId, {
          declaredLevel,
          adaptiveLevelEnabled: declaredLevel === "adaptive",
          onboardingStep: 3,
        });
        setStep(3);
      } else if (step === 3) {
        await updateProfile(userId, {
          currentRegularity: regularity,
          dailyTimeMinutes: dailyMinutes,
          weeklyTimeMinutes: (dailyMinutes ?? 0) * 7,
          onboardingStep: 4,
        });
        setStep(4);
      } else if (step === 4) {
        await updateProfile(userId, {
          primaryGoals: goals,
          progressDomains: goals,
          onboardingStep: 5,
        });
        setStep(5);
      } else {
        await updateProfile(userId, {
          learningPreferences: preferences,
          onboardingStep: 5,
        });
        await markProfileCompleted(userId);
        router.replace({ pathname: "/", params: { welcome: "1" } });
      }
    } catch {
      setError("La sauvegarde a échoué. Vérifiez votre connexion puis réessayez.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const goBack = () => {
    if (savingRef.current) return;
    setError(null);
    if (step > 1) setStep((current) => current - 1);
    else router.replace("/profile");
  };

  const title = [
    "Faisons connaissance",
    "Votre point de départ",
    "Votre rythme actuel",
    "Vos objectifs principaux",
    "Votre façon d’apprendre",
  ][step - 1];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingView}>
          <ActivityIndicator color={colors.goldLight} size="large" />
          <Text style={styles.loadingText}>Préparation de votre profil…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Revenir à l’étape précédente"
            accessibilityRole="button"
            hitSlop={10}
            onPress={goBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
            <Text style={styles.backButtonText}>Retour</Text>
          </Pressable>
          <Text style={styles.stepLabel}>
            ÉTAPE {step} SUR {TOTAL_STEPS}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[styles.progressValue, { width: `${(step / TOTAL_STEPS) * 100}%` }]}
          />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.eyebrow}>PROFIL OUMMAH</Text>
          <Text style={styles.title}>{title}</Text>

          {step === 1 ? (
            <View style={styles.section}>
              <Text style={styles.label}>Prénom ou pseudonyme</Text>
              <TextInput
                accessibilityLabel="Prénom ou pseudonyme"
                autoCapitalize="words"
                maxLength={50}
                onChangeText={setDisplayName}
                placeholder="Comment souhaitez-vous être appelé ?"
                placeholderTextColor={colors.textMuted}
                returnKeyType="done"
                style={styles.input}
                value={displayName}
              />
              <Text style={styles.label}>Tranche d’âge</Text>
              {AGE_OPTIONS.map((option) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  onPress={() => setAgeRange(option.value)}
                  selected={ageRange === option.value}
                />
              ))}
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.section}>
              <Text style={styles.helper}>
                Il n’y a pas de bonne ou de mauvaise réponse. Choisissez ce qui
                décrit le mieux votre situation actuelle.
              </Text>
              {LEVEL_OPTIONS.map((option) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  onPress={() => setDeclaredLevel(option.value)}
                  selected={declaredLevel === option.value}
                />
              ))}
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.section}>
              <Text style={styles.label}>Régularité actuelle</Text>
              {REGULARITY_OPTIONS.map((option) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  onPress={() => setRegularity(option.value)}
                  selected={regularity === option.value}
                />
              ))}
              <Text style={styles.label}>Temps disponible chaque jour</Text>
              <View style={styles.timeGrid}>
                {TIME_OPTIONS.map((minutes) => {
                  const selected = dailyMinutes === minutes;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      key={minutes}
                      onPress={() => setDailyMinutes(minutes)}
                      style={({ pressed }) => [
                        styles.timeChoice,
                        selected && styles.timeChoiceSelected,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          selected && styles.timeTextSelected,
                        ]}
                      >
                        {minutes} min
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ) : null}

          {step === 4 ? (
            <View style={styles.section}>
              <Text style={styles.helper}>Vous pouvez choisir plusieurs objectifs.</Text>
              {GOAL_OPTIONS.map((option) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  onPress={() => setGoals(toggleValue(goals, option.value))}
                  selected={goals.includes(option.value)}
                />
              ))}
            </View>
          ) : null}

          {step === 5 ? (
            <View style={styles.section}>
              <Text style={styles.helper}>
                Choisissez les formats qui vous aident le plus à progresser.
              </Text>
              {PREFERENCE_OPTIONS.map((option) => (
                <Choice
                  key={option.value}
                  label={option.label}
                  onPress={() =>
                    setPreferences(toggleValue(preferences, option.value))
                  }
                  selected={preferences.includes(option.value)}
                />
              ))}
            </View>
          ) : null}

          {error ? (
            <View accessibilityLiveRegion="polite" style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={19}
                color={colors.danger}
              />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            accessibilityRole="button"
            disabled={saving || !userId}
            onPress={() => void saveCurrentStep()}
            style={({ pressed }) => [
              styles.primaryButton,
              (saving || !userId) && styles.buttonDisabled,
              pressed && styles.pressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>
                  {step === TOTAL_STEPS ? "Terminer" : "Continuer"}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.background}
                />
              </>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.background },
  loadingView: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 14,
    marginTop: 14,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 54,
    paddingHorizontal: 18,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 18,
    flexDirection: "row",
    height: 40,
    justifyContent: "center",
    paddingHorizontal: 11,
  },
  backButtonText: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 2,
  },
  stepLabel: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    textAlign: "center",
  },
  headerSpacer: { width: 70 },
  progressTrack: {
    backgroundColor: colors.surfaceAlt,
    height: 3,
    marginHorizontal: 18,
  },
  progressValue: { backgroundColor: colors.goldLight, height: 3 },
  content: { paddingBottom: 28, paddingHorizontal: 18, paddingTop: 26 },
  eyebrow: {
    color: colors.gold,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
  },
  title: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 34,
    lineHeight: 39,
    marginTop: 4,
  },
  section: { marginTop: 22 },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 9,
    marginTop: 12,
  },
  helper: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 15,
    borderWidth: 1,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 15,
    minHeight: 52,
    paddingHorizontal: 15,
  },
  choice: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 15,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 9,
    minHeight: 52,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  choiceSelected: {
    backgroundColor: "rgba(227,181,90,0.09)",
    borderColor: colors.gold,
  },
  choiceText: {
    color: colors.textSecondary,
    flex: 1,
    fontFamily: typography.sans,
    fontSize: 13,
    lineHeight: 18,
    marginRight: 12,
  },
  choiceTextSelected: { color: colors.text, fontWeight: "600" },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  timeChoice: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.borderSoft,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 46,
    minWidth: 82,
    paddingHorizontal: 13,
  },
  timeChoiceSelected: {
    backgroundColor: "rgba(227,181,90,0.09)",
    borderColor: colors.gold,
  },
  timeText: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: "600",
  },
  timeTextSelected: { color: colors.goldLight },
  errorBox: {
    alignItems: "flex-start",
    backgroundColor: "rgba(233,107,114,0.09)",
    borderColor: "rgba(233,107,114,0.3)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginTop: 18,
    padding: 12,
  },
  errorText: {
    color: colors.textSecondary,
    flex: 1,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 17,
    marginLeft: 8,
  },
  footer: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: colors.goldLight,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 52,
  },
  primaryButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 14,
    fontWeight: "700",
    marginRight: 8,
  },
  buttonDisabled: { opacity: 0.55 },
  pressed: { opacity: 0.82 },
});
