import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SURAHS } from "../data/surahs";
import CalendarSeasonalPrompt from "../components/CalendarSeasonalPrompt";
import {
  dateKey,
  hifzLevel,
  loadHifzState,
  reviewDue,
  saveHifzState,
  type HifzState,
} from "../features/hifz/HifzStore";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const TARGETS = [1, 3, 5] as const;

type BadgeStats = {
  learned: number;
  masteredSurahs: number;
  reviews: number;
  sessions: number;
  streak: number;
};

const HIFZ_BADGES: readonly {
  id: string;
  label: string;
  detail: string;
  icon: keyof typeof Ionicons.glyphMap;
  unlocked: (stats: BadgeStats) => boolean;
}[] = [
  {
    id: "first-verse",
    label: "Premier pas",
    detail: "1 verset appris",
    icon: "leaf-outline",
    unlocked: (s) => s.learned >= 1,
  },
  {
    id: "five-verses",
    label: "Belle lancée",
    detail: "5 versets appris",
    icon: "sparkles-outline",
    unlocked: (s) => s.learned >= 5,
  },
  {
    id: "ten-verses",
    label: "Premiers fruits",
    detail: "10 versets appris",
    icon: "flower-outline",
    unlocked: (s) => s.learned >= 10,
  },
  {
    id: "thirty-three",
    label: "Persévérance",
    detail: "33 versets appris",
    icon: "footsteps-outline",
    unlocked: (s) => s.learned >= 33,
  },
  {
    id: "fifty-verses",
    label: "Cap des 50",
    detail: "50 versets appris",
    icon: "flag-outline",
    unlocked: (s) => s.learned >= 50,
  },
  {
    id: "hundred-verses",
    label: "Cent versets",
    detail: "100 versets appris",
    icon: "ribbon-outline",
    unlocked: (s) => s.learned >= 100,
  },
  {
    id: "two-fifty",
    label: "Enraciné",
    detail: "250 versets appris",
    icon: "earth-outline",
    unlocked: (s) => s.learned >= 250,
  },
  {
    id: "five-hundred",
    label: "Lumière",
    detail: "500 versets appris",
    icon: "sunny-outline",
    unlocked: (s) => s.learned >= 500,
  },
  {
    id: "thousand",
    label: "Mille versets",
    detail: "Un grand parcours",
    icon: "diamond-outline",
    unlocked: (s) => s.learned >= 1000,
  },
  {
    id: "first-surah",
    label: "Première sourate",
    detail: "Entièrement maîtrisée",
    icon: "book-outline",
    unlocked: (s) => s.masteredSurahs >= 1,
  },
  {
    id: "three-surahs",
    label: "Trois sourates",
    detail: "3 sourates maîtrisées",
    icon: "library-outline",
    unlocked: (s) => s.masteredSurahs >= 3,
  },
  {
    id: "five-surahs",
    label: "Cinq sourates",
    detail: "5 sourates maîtrisées",
    icon: "layers-outline",
    unlocked: (s) => s.masteredSurahs >= 5,
  },
  {
    id: "ten-surahs",
    label: "Dix sourates",
    detail: "10 sourates maîtrisées",
    icon: "albums-outline",
    unlocked: (s) => s.masteredSurahs >= 10,
  },
  {
    id: "whole-quran",
    label: "Coran maîtrisé",
    detail: "Les 114 sourates",
    icon: "trophy-outline",
    unlocked: (s) => s.masteredSurahs >= 114,
  },
  {
    id: "three-days",
    label: "Bon départ",
    detail: "3 jours réguliers",
    icon: "flame-outline",
    unlocked: (s) => s.streak >= 3,
  },
  {
    id: "seven-days",
    label: "Une semaine",
    detail: "7 jours réguliers",
    icon: "calendar-outline",
    unlocked: (s) => s.streak >= 7,
  },
  {
    id: "thirty-days",
    label: "Constance",
    detail: "30 jours réguliers",
    icon: "infinite-outline",
    unlocked: (s) => s.streak >= 30,
  },
  {
    id: "first-review",
    label: "Je consolide",
    detail: "Première révision",
    icon: "refresh-outline",
    unlocked: (s) => s.reviews >= 1,
  },
  {
    id: "twenty-reviews",
    label: "Mémoire solide",
    detail: "20 révisions",
    icon: "shield-checkmark-outline",
    unlocked: (s) => s.reviews >= 20,
  },
  {
    id: "fifty-sessions",
    label: "Fidèle au Hifz",
    detail: "50 journées actives",
    icon: "telescope-outline",
    unlocked: (s) => s.sessions >= 50,
  },
];

export default function HifzScreen() {
  const [state, setState] = useState<HifzState>();
  const [showPicker, setShowPicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string>();

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadHifzState().then((next) => active && setState(next));
      return () => {
        active = false;
      };
    }, []),
  );

  const studied = state?.progress ?? [];
  const primarySurahProgress = studied[0];
  const primarySurah = primarySurahProgress
    ? SURAHS.find((item) => item.id === primarySurahProgress.surahId)
    : undefined;
  const learned = studied.reduce(
    (sum, item) => sum + item.learnedVerses.length,
    0,
  );
  const due = state ? reviewDue(state) : [];
  const annualProgress = state ? Math.min(1, learned / state.annualTarget) : 0;
  const activeSurahs = studied.filter(
    (item) => item.learnedVerses.length > 0,
  ).length;
  const masteredSurahs = studied.filter((entry) => {
    const surah = SURAHS.find((item) => item.id === entry.surahId);
    return Boolean(surah && entry.learnedVerses.length >= surah.verses);
  }).length;
  const totalReviews =
    state?.sessions.reduce((sum, session) => sum + session.reviewed, 0) ?? 0;
  const badgeStats: BadgeStats = {
    learned,
    masteredSurahs,
    reviews: totalReviews,
    sessions: state?.sessions.length ?? 0,
    streak: state?.streak ?? 0,
  };
  const unlockedBadges = HIFZ_BADGES.filter((badge) =>
    badge.unlocked(badgeStats),
  ).length;
  const today = dateKey();
  const todaySession = state?.sessions.find(
    (session) => session.date === today,
  );
  const estimatedYears = state
    ? Math.max(1, Math.ceil(6236 / (state.dailyTarget * 365)))
    : 6;
  const priorities = useMemo(
    () =>
      due
        .slice(0, 3)
        .map((entry) => SURAHS.find((surah) => surah.id === entry.surahId))
        .filter(Boolean),
    [due],
  );
  const difficultVerses = useMemo(
    () =>
      studied.flatMap((entry) =>
        entry.difficultVerses.map((verse) => ({
          surah: SURAHS.find((item) => item.id === entry.surahId),
          verse,
          reviews: entry.reviewCount,
        })),
      ),
    [studied],
  );
  const calendarDays = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 28 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - 27 + index);
      const key = dateKey(date);
      const session = state?.sessions.find((item) => item.date === key);
      const complete = (session?.learned ?? 0) >= (state?.dailyTarget ?? 1);
      return {
        key,
        label: date.toLocaleDateString("fr-FR", { weekday: "narrow" }),
        day: date.getDate(),
        state: complete ? "complete" : session ? "partial" : "rest",
      };
    });
  }, [state]);
  const selectedSession = state?.sessions.find(
    (item) => item.date === selectedCalendarDay,
  );
  const weeklyBars = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - 6 + index);
        const session = state?.sessions.find(
          (item) => item.date === dateKey(date),
        );
        return {
          label: date.toLocaleDateString("fr-FR", { weekday: "narrow" }),
          value: Math.min(
            1,
            ((session?.learned ?? 0) + (session?.reviewed ?? 0)) /
              Math.max(1, state?.dailyTarget ?? 1),
          ),
        };
      }),
    [state],
  );

  const changeTarget = (dailyTarget: number) => {
    if (!state) return;
    const next = { ...state, dailyTarget };
    setState(next);
    void saveHifzState(next);
  };

  const begin = (
    surahId = priorities[0]?.id,
    review = false,
    verse?: number,
  ) => {
    if (!surahId) {
      setShowPicker(true);
      return;
    }
    router.push(
      `/hifz/session?surah=${surahId}&review=${review ? "1" : "0"}${verse ? `&verse=${verse}` : ""}` as Href,
    );
  };
  const addSurah = (surahId: number) => {
    if (!state) return;
    const alreadyAdded = state.progress.some(
      (item) => item.surahId === surahId,
    );
    const next = alreadyAdded
      ? {
          ...state,
          progress: state.progress.filter((item) => item.surahId !== surahId),
          plannedRanges: (state.plannedRanges ?? []).filter(
            (item) => item.surahId !== surahId,
          ),
        }
      : {
          ...state,
          progress: [
            ...state.progress,
            { surahId, learnedVerses: [], difficultVerses: [], reviewCount: 0 },
          ],
        };
    setState(next);
    void saveHifzState(next);
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/" as Href)
            }
            style={styles.circleButton}
          >
            <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
          </Pressable>
          <View style={styles.titleCopy}>
            <Text style={styles.title}>Mémorisation</Text>
            <Text style={styles.subtitle}>Votre chemin de Hifz</Text>
          </View>
          <View style={styles.streakPill}>
            <Ionicons name="flame" size={14} color={colors.goldLight} />
            <Text style={styles.streakText}>{state?.streak ?? 0}</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Image
            source={require("../assets/images/home/shortcuts/hifz-real.jpg")}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={[
              "rgba(9,6,16,0.08)",
              "rgba(18,8,30,0.57)",
              "rgba(8,6,15,0.97)",
            ]}
            locations={[0, 0.48, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroGlass}>
            <Text style={styles.eyebrow}>VOTRE HIFZ</Text>
            <Text style={styles.heroTitle}>
              {activeSurahs
                ? `${activeSurahs} sourate${activeSurahs > 1 ? "s" : ""} en cours`
                : "Prêt à commencer votre Hifz"}
            </Text>
            <Text style={styles.heroMeta}>
              {Math.round(annualProgress * 100)} % de votre objectif annuel
            </Text>
            <View style={styles.track}>
              <View
                style={[styles.fill, { width: `${annualProgress * 100}%` }]}
              />
            </View>
            <View style={styles.heroActions}>
              <Pressable onPress={() => begin()} style={styles.primaryButton}>
                <Ionicons name="play" size={15} color={colors.background} />
                <Text style={styles.primaryText}>Continuer</Text>
              </Pressable>
              <Pressable
                onPress={() => begin(priorities[0]?.id, true)}
                style={styles.secondaryButton}
              >
                <Ionicons name="refresh" size={15} color={colors.goldLight} />
                <Text style={styles.secondaryText}>Réviser</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.hifzGuide}>
          <View style={styles.hifzGuideStep}><Text style={styles.hifzGuideNumber}>1</Text><Text style={styles.hifzGuideText}>Choisir une sourate</Text></View>
          <View style={styles.hifzGuideStep}><Text style={styles.hifzGuideNumber}>2</Text><Text style={styles.hifzGuideText}>Mémoriser les versets</Text></View>
          <View style={styles.hifzGuideStep}><Text style={styles.hifzGuideNumber}>3</Text><Text style={styles.hifzGuideText}>Réviser régulièrement</Text></View>
        </View>

        <View style={styles.primaryReviewRow}>
          <Pressable onPress={() => begin()} style={styles.primaryReviewCard}>
            <Ionicons name="play-circle-outline" size={24} color={colors.goldLight} />
            <View style={styles.primaryReviewCopy}>
              <Text style={styles.primaryReviewTitle}>{studied.length > 0 ? "Continuer mon Hifz" : "Commencer mon Hifz"}</Text>
              <Text style={styles.primaryReviewMeta}>
                {studied.length > 0 && primarySurah && primarySurahProgress
                  ? `${primarySurah.transliteration} • ${primarySurahProgress.learnedVerses.length}/${primarySurah.verses} versets mémorisés`
                  : "Choisir une sourate pour commencer"}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.goldLight} />
          </Pressable>
          {due.length > 0 ? <Pressable onPress={() => begin(priorities[0]?.id, true)} style={styles.primaryReviewCard}>
            <Ionicons name="refresh-circle-outline" size={24} color={colors.goldLight} />
            <View style={styles.primaryReviewCopy}>
              <Text style={styles.primaryReviewTitle}>Réviser aujourd’hui</Text>
              <Text style={styles.primaryReviewMeta}>{due.length} passage{due.length > 1 ? "s" : ""} à revoir</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.goldLight} />
          </Pressable> : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes sourates</Text>
          <Pressable onPress={() => setShowPicker(true)} style={styles.addSurahHeader}>
            <Ionicons name="add-circle-outline" size={17} color={colors.goldLight} />
            <Text style={styles.addSurahHeaderText}>Ajouter une sourate</Text>
          </Pressable>
        </View>
        {studied.slice(0, 4).map((entry) => {
          const surah = SURAHS.find((item) => item.id === entry.surahId);
          if (!surah) return null;
          return <Pressable key={entry.surahId} onPress={() => router.push(`/hifz/${surah.id}` as Href)} style={styles.compactSurahRow}>
            <View><Text style={styles.compactSurahName}>{surah.transliteration}</Text><Text style={styles.compactSurahMeta}>{entry.learnedVerses.length} / {surah.verses} versets</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.goldLight} />
          </Pressable>;
        })}
        {learned > 0 ? <Pressable onPress={() => router.push("/hifz/progress" as Href)} style={styles.progressLinkCard}>
          <View><Text style={styles.progressLinkTitle}>Progression</Text><Text style={styles.progressLinkMeta}>{learned} verset{learned > 1 ? "s" : ""} mémorisé{learned > 1 ? "s" : ""}</Text></View>
          <Ionicons name="chevron-forward" size={18} color={colors.goldLight} />
        </Pressable> : null}

        {false ? <>
        <CalendarSeasonalPrompt context="hifz" />

        <View style={styles.actionRow}>
          <InfoCard
            icon="time-outline"
            label="Dernière session"
            value={todaySession ? `${todaySession?.minutes ?? 0} min` : "À commencer"}
          />
          <InfoCard
            icon="layers-outline"
            label="À réviser"
            value={`${due.length} passage${due.length > 1 ? "s" : ""}`}
          />
          <InfoCard
            icon="sparkles-outline"
            label="Aujourd’hui"
            value={`${todaySession?.learned ?? 0} appris`}
          />
        </View>

        <View style={styles.easyStart}>
          <View style={styles.easyStartTop}>
            <View style={styles.easyStartIcon}>
              <Ionicons name="sparkles" size={17} color={colors.goldLight} />
            </View>
            <View style={styles.easyStartCopy}>
              <Text style={styles.easyStartTitle}>C’est très simple</Text>
              <Text style={styles.easyStartText}>
                Avancez un verset à la fois, à votre rythme.
              </Text>
            </View>
          </View>
          <View style={styles.stepsRow}>
            <SimpleStep number="1" label="Choisis" />
            <Ionicons name="arrow-forward" size={13} color={colors.goldMuted} />
            <SimpleStep number="2" label="Écoute" />
            <Ionicons name="arrow-forward" size={13} color={colors.goldMuted} />
            <SimpleStep number="3" label="Récite" />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mon rythme</Text>
          <Text style={styles.sectionHint}>modifiable à tout moment</Text>
        </View>
        <View style={styles.targetRow}>
          {TARGETS.map((target) => (
            <Pressable
              key={target}
              onPress={() => changeTarget(target)}
              style={[
                styles.target,
                state?.dailyTarget === target && styles.targetActive,
              ]}
            >
              <Text
                style={[
                  styles.targetValue,
                  state?.dailyTarget === target && styles.targetValueActive,
                ]}
              >
                {target}
              </Text>
              <Text
                style={[
                  styles.targetLabel,
                  state?.dailyTarget === target && styles.targetLabelActive,
                ]}
              >
                verset{target > 1 ? "s" : ""}/jour
              </Text>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setShowTargetPicker(true)}
            style={[
              styles.target,
              !TARGETS.includes((state?.dailyTarget ?? 0) as 1 | 3 | 5) &&
                styles.targetActive,
            ]}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={
                !TARGETS.includes((state?.dailyTarget ?? 0) as 1 | 3 | 5)
                  ? colors.background
                  : colors.goldLight
              }
            />
            <Text
              style={[
                styles.targetLabel,
                !TARGETS.includes((state?.dailyTarget ?? 0) as 1 | 3 | 5) &&
                  styles.targetLabelActive,
              ]}
            >
              {!TARGETS.includes((state?.dailyTarget ?? 0) as 1 | 3 | 5)
                ? `${state?.dailyTarget}`
                : "Perso"}
            </Text>
          </Pressable>
        </View>
        <View style={styles.estimate}>
          <Ionicons name="compass-outline" size={16} color={colors.goldLight} />
          <Text style={styles.estimateText}>
            À ce rythme, le Coran entier est estimé à environ{" "}
            <Text style={styles.estimateStrong}>{estimatedYears} ans</Text>.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Révisions intelligentes</Text>
          <Pressable onPress={() => begin(priorities[0]?.id, true)}>
            <Text style={styles.link}>Tout réviser</Text>
          </Pressable>
        </View>
        <Pressable
          onPress={() => begin(priorities[0]?.id, true)}
          style={styles.reviewCard}
        >
          <LinearGradient
            colors={["rgba(75,37,91,0.93)", "rgba(23,13,35,0.98)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.reviewBadge}>
            <Ionicons name="sparkles" size={15} color={colors.goldLight} />
          </View>
          <View style={styles.reviewCopy}>
            <Text style={styles.reviewTitle}>
              {due.length
                ? "Votre sélection du jour"
                : "Votre première révision vous attend"}
            </Text>
            <Text style={styles.reviewText}>
              {due.length
                ? "Choisie selon la fréquence, les oublis et votre dernière séance."
                : "Apprenez un premier passage pour activer votre programme intelligent."}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={17} color={colors.goldLight} />
        </Pressable>
        {priorities.map((surah) =>
          surah ? (
            <Pressable
              key={surah.id}
              onPress={() => begin(surah.id, true)}
              style={styles.priority}
            >
              <View style={styles.priorityNumber}>
                <Text style={styles.priorityNumberText}>{surah.id}</Text>
              </View>
              <View style={styles.priorityCopy}>
                <Text style={styles.priorityTitle}>
                  {surah.transliteration}
                </Text>
                <Text style={styles.priorityMeta}>
                  Révision ciblée · {surah.verses} versets
                </Text>
              </View>
              <Text style={styles.priorityArabic}>{surah.arabicName}</Text>
            </Pressable>
          ) : null,
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes sourates</Text>
          <Text style={styles.sectionHint}>{learned} versets mémorisés</Text>
        </View>
        {studied.map((entry) => {
          const surah = SURAHS.find((item) => item.id === entry.surahId);
          if (!surah) return null;
          const percent = Math.round(
            (entry.learnedVerses.length / surah.verses) * 100,
          );
          const level = hifzLevel(entry.learnedVerses.length, surah.verses);
          const label =
            level === "mastered"
              ? "Maîtrisée"
              : level === "review"
                ? "À consolider"
                : level === "learning"
                  ? "En cours"
                  : "À commencer";
          return (
            <Pressable
              key={entry.surahId}
              onPress={() => router.push(`/hifz/${surah.id}` as Href)}
              style={styles.surahCard}
            >
              <View style={styles.surahTop}>
                <View>
                  <Text style={styles.surahName}>{surah.transliteration}</Text>
                  <Text style={styles.surahFrench}>{surah.frenchName}</Text>
                </View>
                <Text style={styles.surahArabic}>{surah.arabicName}</Text>
              </View>
              <View style={styles.surahBottom}>
                <View style={styles.miniTrack}>
                  <View style={[styles.miniFill, { width: `${percent}%` }]} />
                </View>
                <Text style={styles.percent}>
                  {level === "mastered" ? "✓ " : ""}
                  {percent}% · {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
        <Pressable onPress={() => setShowPicker(true)} style={styles.addSurah}>
          <Ionicons name="add" size={18} color={colors.goldLight} />
          <Text style={styles.addSurahText}>Choisir mes sourates</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vos repères</Text>
          <Text style={styles.sectionHint}>sans compétition</Text>
        </View>
        <View style={styles.statsGrid}>
          <Stat
            icon="book-outline"
            value={String(learned)}
            label="versets appris"
          />
          <Stat
            icon="refresh-outline"
            value={String(todaySession?.reviewed ?? 0)}
            label="révisés aujourd’hui"
          />
          <Stat
            icon="time-outline"
            value={`${todaySession?.minutes ?? 0} min`}
            label="aujourd’hui"
          />
          <Stat
            icon="calendar-outline"
            value={`${state?.streak ?? 0} j`}
            label="régularité"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Vos encouragements</Text>
          <Text style={styles.sectionHint}>
            {unlockedBadges}/{HIFZ_BADGES.length} débloqués
          </Text>
        </View>
        <Text style={styles.rewardHint}>
          Glissez pour découvrir tous vos prochains encouragements
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rewardRow}
        >
          {HIFZ_BADGES.map((badge) => (
            <Reward
              key={badge.id}
              icon={badge.icon}
              label={badge.label}
              detail={badge.detail}
              active={badge.unlocked(badgeStats)}
            />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Calendrier</Text>
          <Text style={styles.sectionHint}>vos 28 derniers jours</Text>
        </View>
        <View style={styles.calendarCard}>
          <View style={styles.calendarLegend}>
            <Legend color="#72C694" label="objectif atteint" />
            <Legend color={colors.goldLight} label="partiel" />
            <Legend color="rgba(255,255,255,0.16)" label="repos" />
          </View>
          <View style={styles.calendarRow}>
            {calendarDays.map((day) => (
              <Pressable
                key={day.key}
                onPress={() => setSelectedCalendarDay(day.key)}
                style={styles.dayWrap}
              >
                <View
                  style={[
                    styles.day,
                    day.state === "complete" && styles.dayComplete,
                    day.state === "partial" && styles.dayPartial,
                    selectedCalendarDay === day.key && styles.daySelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,
                      day.state !== "rest" && styles.dayNumberActive,
                    ]}
                  >
                    {day.day}
                  </Text>
                </View>
                <Text style={styles.dayLabel}>{day.label}</Text>
              </Pressable>
            ))}
          </View>
          {selectedCalendarDay ? (
            <View style={styles.dayDetail}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.goldLight}
              />
              <Text style={styles.dayDetailText}>
                {selectedSession
                  ? `${selectedSession?.minutes ?? 0} min · ${selectedSession?.learned ?? 0} appris · ${selectedSession?.reviewed ?? 0} révisés`
                  : "Jour de repos — vous pourrez reprendre quand vous voulez."}
              </Text>
            </View>
          ) : null}
        </View>
        <View style={styles.weekChart}>
          {weeklyBars.map((bar, index) => (
            <View key={`${bar.label}:${index}`} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { height: `${Math.max(5, bar.value * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{bar.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>À renforcer</Text>
          <Text style={styles.sectionHint}>revient automatiquement</Text>
        </View>
        {difficultVerses.length ? (
          difficultVerses.slice(0, 4).map((item) =>
            item.surah ? (
              <Pressable
                key={`${item.surah.id}:${item.verse}`}
                onPress={() => begin(item.surah!.id, true, item.verse)}
                style={styles.difficultCard}
              >
                <View style={styles.difficultIcon}>
                  <Ionicons name="repeat" size={16} color={colors.goldLight} />
                </View>
                <View style={styles.difficultCopy}>
                  <Text style={styles.difficultTitle}>
                    {item.surah.transliteration} · verset {item.verse}
                  </Text>
                  <Text style={styles.difficultMeta}>
                    À revoir · {item.reviews} répétition
                    {item.reviews > 1 ? "s" : ""} guidée
                    {item.reviews > 1 ? "s" : ""}
                  </Text>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={colors.goldLight}
                />
              </Pressable>
            ) : null,
          )
        ) : (
          <View style={styles.noDifficulty}>
            <Ionicons name="leaf-outline" size={18} color={colors.goldLight} />
            <Text style={styles.noDifficultyText}>
              Aucun passage difficile enregistré pour le moment.
            </Text>
          </View>
        )}
        </> : null}
      </ScrollView>
      <Modal
        visible={showPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Choisir mes sourates</Text>
                <Text style={styles.modalSubtitle}>
                  Touchez + pour ajouter, ou ✓ pour retirer une sourate de votre
                  programme.
                </Text>
              </View>
              <Pressable
                onPress={() => setShowPicker(false)}
                style={styles.close}
              >
                <Ionicons name="close" size={19} color={colors.goldLight} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SURAHS.map((surah) => {
                const added = studied.some((item) => item.surahId === surah.id);
                return (
                  <Pressable
                    key={surah.id}
                    onPress={() => addSurah(surah.id)}
                    style={[styles.pickerRow, added && styles.pickerRowAdded]}
                  >
                    <View style={styles.pickerNumber}>
                      <Text style={styles.pickerNumberText}>{surah.id}</Text>
                    </View>
                    <View style={styles.pickerCopy}>
                      <Text style={styles.pickerName}>
                        {surah.transliteration}
                      </Text>
                      <Text style={styles.pickerMeta}>
                        {surah.frenchName} · {surah.verses} versets
                      </Text>
                    </View>
                    <Text style={styles.pickerArabic}>{surah.arabicName}</Text>
                    <View
                      style={[
                        styles.pickerToggle,
                        added && styles.pickerToggleAdded,
                      ]}
                    >
                      <Ionicons
                        name={added ? "checkmark" : "add"}
                        size={16}
                        color={added ? colors.background : colors.goldLight}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showTargetPicker}
        animationType="fade"
        transparent
        onRequestClose={() => setShowTargetPicker(false)}
      >
        <View style={styles.targetBackdrop}>
          <View style={styles.targetSheet}>
            <Text style={styles.targetModalTitle}>
              Votre objectif quotidien
            </Text>
            <Text style={styles.targetModalText}>
              Choisissez un rythme confortable. Il pourra changer quand vous le
              souhaitez.
            </Text>
            <View style={styles.targetChoices}>
              {[1, 2, 3, 5, 7, 10].map((target) => (
                <Pressable
                  key={target}
                  onPress={() => {
                    changeTarget(target);
                    setShowTargetPicker(false);
                  }}
                  style={[
                    styles.targetChoice,
                    state?.dailyTarget === target && styles.targetChoiceActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.targetChoiceValue,
                      state?.dailyTarget === target &&
                        styles.targetChoiceValueActive,
                    ]}
                  >
                    {target}
                  </Text>
                  <Text
                    style={[
                      styles.targetChoiceLabel,
                      state?.dailyTarget === target &&
                        styles.targetChoiceLabelActive,
                    ]}
                  >
                    verset{target > 1 ? "s" : ""}/jour
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={() => setShowTargetPicker(false)}
              style={styles.targetCancel}
            >
              <Text style={styles.targetCancelText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoCard}>
      <Ionicons name={icon} size={16} color={colors.goldLight} />
      <Text numberOfLines={1} style={styles.infoValue}>
        {value}
      </Text>
      <Text numberOfLines={1} style={styles.infoLabel}>
        {label}
      </Text>
    </View>
  );
}
function Stat({
  icon,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={17} color={colors.goldLight} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legend}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}
function SimpleStep({ number, label }: { number: string; label: string }) {
  return (
    <View style={styles.simpleStep}>
      <Text style={styles.simpleStepNumber}>{number}</Text>
      <Text style={styles.simpleStepLabel}>{label}</Text>
    </View>
  );
}
function Reward({
  icon,
  label,
  detail,
  active,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail: string;
  active: boolean;
}) {
  return (
    <View style={[styles.reward, active && styles.rewardActive]}>
      <View style={[styles.rewardIcon, active && styles.rewardIconActive]}>
        <Ionicons
          name={active ? icon : "lock-closed-outline"}
          size={21}
          color={active ? colors.goldLight : "rgba(255,255,255,0.28)"}
        />
      </View>
      <Text
        numberOfLines={2}
        style={[styles.rewardText, active && styles.rewardTextActive]}
      >
        {label}
      </Text>
      <Text
        numberOfLines={2}
        style={[styles.rewardDetail, active && styles.rewardDetailActive]}
      >
        {detail}
      </Text>
      {active ? (
        <View style={styles.rewardCheck}>
          <Ionicons name="checkmark" size={10} color={colors.background} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 14, paddingBottom: 120 },
  progressToggle: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.28)",
    backgroundColor: "rgba(42,23,56,0.72)",
  },
  primaryReviewRow: { marginTop: 16, gap: 10 },
  primaryReviewCard: { minHeight: 70, paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", alignItems: "center", borderRadius: 18, borderWidth: 1, borderColor: "rgba(227,181,90,0.28)", backgroundColor: "rgba(42,23,56,0.72)" },
  primaryReviewCopy: { flex: 1, marginHorizontal: 11 },
  primaryReviewTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 16 },
  primaryReviewMeta: { marginTop: 4, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  hifzGuide: { marginTop: 12, flexDirection: "row", justifyContent: "space-between" },
  hifzGuideStep: { flex: 1, alignItems: "center" },
  hifzGuideNumber: { color: colors.goldMuted, fontFamily: typography.sansBold, fontSize: 11 },
  hifzGuideText: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 9, textAlign: "center" },
  compactSurahRow: { minHeight: 62, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  compactSurahName: { color: colors.text, fontFamily: typography.sans, fontSize: 15, fontWeight: "700" },
  compactSurahMeta: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  progressLinkCard: { minHeight: 60, marginTop: 14, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 17, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  progressLinkTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 17 },
  progressLinkMeta: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  addSurahHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: "rgba(227,181,90,0.35)", backgroundColor: "rgba(42,23,56,0.72)" },
  addSurahHeaderText: { marginLeft: 5, color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "700" },
  progressToggleTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  progressToggleSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  topBar: { height: 70, flexDirection: "row", alignItems: "center" },
  circleButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.purpleDeep,
  },
  titleCopy: { flex: 1, marginLeft: 12 },
  title: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 28,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
  },
  streakPill: {
    height: 35,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  streakText: {
    marginLeft: 4,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "800",
  },
  hero: {
    height: 260,
    overflow: "hidden",
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.32)",
  },
  heroGlass: {
    position: "absolute",
    right: 11,
    bottom: 11,
    left: 11,
    padding: 15,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,246,228,0.24)",
    backgroundColor: "rgba(12,8,21,0.74)",
  },
  eyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  heroTitle: {
    marginTop: 5,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 25,
  },
  heroMeta: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
  },
  track: {
    height: 4,
    marginTop: 12,
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  fill: { height: "100%", borderRadius: 3, backgroundColor: colors.goldLight },
  heroActions: { display: "none" },
  primaryButton: {
    height: 38,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 19,
    backgroundColor: colors.goldLight,
  },
  primaryText: {
    marginLeft: 6,
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  secondaryButton: {
    height: 38,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(240,204,124,0.44)",
    backgroundColor: "rgba(71,38,84,0.66)",
  },
  secondaryText: {
    marginLeft: 6,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  actionRow: { height: 78, marginTop: 10, flexDirection: "row", gap: 7 },
  infoCard: {
    flex: 1,
    minWidth: 0,
    padding: 9,
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(29,17,43,0.82)",
  },
  infoValue: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 13,
  },
  infoLabel: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
  },
  sectionHeader: {
    marginTop: 22,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 22,
  },
  sectionHint: {
    marginBottom: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8,
  },
  targetRow: { marginTop: 10, flexDirection: "row", gap: 7 },
  target: {
    flex: 1,
    height: 68,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,242,220,0.18)",
    backgroundColor: "rgba(43,25,56,0.78)",
  },
  targetActive: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  targetValue: {
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 20,
  },
  targetValueActive: { color: colors.background },
  targetLabel: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7,
    textAlign: "center",
  },
  targetLabelActive: { color: "rgba(8,6,15,0.70)" },
  estimate: {
    minHeight: 46,
    marginTop: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "rgba(81,41,98,0.35)",
  },
  estimateText: {
    flex: 1,
    marginLeft: 8,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 9,
    lineHeight: 13,
  },
  estimateStrong: { color: colors.goldLight, fontWeight: "800" },
  link: {
    marginBottom: 3,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "800",
  },
  reviewCard: {
    minHeight: 84,
    marginTop: 10,
    padding: 13,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
  },
  reviewBadge: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: "rgba(10,7,18,0.55)",
  },
  reviewCopy: { flex: 1, marginHorizontal: 10 },
  reviewTitle: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 15,
  },
  reviewText: {
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 8.3,
    lineHeight: 12,
  },
  priority: {
    minHeight: 58,
    marginTop: 7,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  priorityNumber: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(85,43,104,0.66)",
  },
  priorityNumberText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "800",
  },
  priorityCopy: { flex: 1, marginLeft: 9 },
  priorityTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 14,
  },
  priorityMeta: {
    marginTop: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
  },
  priorityArabic: {
    color: colors.goldMuted,
    fontFamily: typography.arabic,
    fontSize: 18,
  },
  surahCard: {
    minHeight: 86,
    marginTop: 9,
    padding: 13,
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,242,220,0.18)",
    backgroundColor: "rgba(35,20,48,0.86)",
  },
  surahTop: { flexDirection: "row", justifyContent: "space-between" },
  surahName: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 17,
  },
  surahFrench: {
    marginTop: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8.5,
  },
  surahArabic: {
    color: colors.goldMuted,
    fontFamily: typography.arabic,
    fontSize: 23,
  },
  surahBottom: { marginTop: 11, flexDirection: "row", alignItems: "center" },
  miniTrack: {
    flex: 1,
    height: 4,
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  miniFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.goldLight,
  },
  percent: {
    width: 88,
    marginLeft: 9,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 8,
    textAlign: "right",
  },
  addSurah: {
    height: 50,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.35)",
    borderStyle: "dashed",
  },
  addSurahText: {
    marginLeft: 7,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "700",
  },
  statsGrid: { marginTop: 10, flexDirection: "row", flexWrap: "wrap", gap: 8 },
  stat: {
    width: "48.8%",
    height: 94,
    padding: 12,
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(27,16,40,0.88)",
  },
  statValue: {
    marginTop: 6,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 21,
  },
  statLabel: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8,
  },
  calendarCard: {
    marginTop: 10,
    padding: 13,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(27,16,40,0.88)",
  },
  calendarLegend: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  legend: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: {
    marginLeft: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
  },
  calendarRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 9,
  },
  dayWrap: { width: "13.5%", alignItems: "center" },
  day: {
    width: 25,
    height: 25,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  dayComplete: { backgroundColor: "#72C694" },
  dayPartial: { backgroundColor: colors.goldLight },
  daySelected: { borderWidth: 2, borderColor: "#FFF7E8" },
  dayNumber: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
    fontWeight: "800",
  },
  dayNumberActive: { color: colors.background },
  dayLabel: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7,
  },
  dayDetail: {
    minHeight: 37,
    marginTop: 13,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: "rgba(82,43,99,0.45)",
  },
  dayDetailText: {
    flex: 1,
    marginLeft: 6,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 8,
  },
  weekChart: {
    height: 105,
    marginTop: 9,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(27,16,40,0.72)",
  },
  barColumn: {
    width: "10%",
    height: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  barTrack: {
    width: 10,
    height: 65,
    overflow: "hidden",
    justifyContent: "flex-end",
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  barFill: {
    width: "100%",
    borderRadius: 6,
    backgroundColor: colors.goldLight,
  },
  barLabel: {
    marginTop: 5,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7,
  },
  difficultCard: {
    minHeight: 58,
    marginTop: 8,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.25)",
    backgroundColor: "rgba(43,24,57,0.78)",
  },
  difficultIcon: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "rgba(11,8,19,0.55)",
  },
  difficultCopy: { flex: 1, marginLeft: 9 },
  difficultTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 14,
  },
  difficultMeta: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
  },
  noDifficulty: {
    minHeight: 53,
    marginTop: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: "rgba(41,25,55,0.62)",
  },
  noDifficultyText: {
    marginLeft: 8,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 9,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  modalSheet: {
    height: "84%",
    padding: 16,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
    backgroundColor: "#120B1B",
  },
  modalHeader: {
    paddingBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 25,
  },
  modalSubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
  },
  close: {
    width: 37,
    height: 37,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  pickerRow: {
    minHeight: 63,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  pickerRowAdded: { backgroundColor: "rgba(87,46,105,0.32)" },
  pickerNumber: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(83,42,103,0.68)",
  },
  pickerNumberText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "800",
  },
  pickerCopy: { flex: 1, marginLeft: 9 },
  pickerName: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 15,
  },
  pickerMeta: {
    marginTop: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
  },
  pickerArabic: {
    marginRight: 9,
    color: colors.goldMuted,
    fontFamily: typography.arabic,
    fontSize: 21,
  },
  pickerToggle: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.40)",
  },
  pickerToggleAdded: { borderColor: "#72C694", backgroundColor: "#72C694" },
  easyStart: {
    marginTop: 12,
    padding: 13,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.26)",
    backgroundColor: "rgba(48,27,62,0.76)",
  },
  easyStartTop: { flexDirection: "row", alignItems: "center" },
  easyStartIcon: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(12,8,21,0.58)",
  },
  easyStartCopy: { flex: 1, marginLeft: 9 },
  easyStartTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 17,
  },
  easyStartText: {
    marginTop: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8.5,
  },
  stepsRow: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  simpleStep: { alignItems: "center" },
  simpleStepNumber: {
    width: 21,
    height: 21,
    overflow: "hidden",
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "900",
    lineHeight: 21,
    textAlign: "center",
    borderRadius: 11,
    backgroundColor: colors.goldLight,
  },
  simpleStepLabel: {
    marginTop: 4,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "800",
  },
  rewardHint: {
    marginTop: 5,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8,
  },
  rewardRow: { paddingTop: 10, paddingRight: 14, paddingBottom: 3, gap: 9 },
  reward: {
    width: 116,
    height: 132,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
    backgroundColor: "rgba(25,19,31,0.76)",
  },
  rewardActive: {
    borderColor: "rgba(235,199,114,0.52)",
    backgroundColor: "rgba(75,39,91,0.88)",
    shadowColor: colors.goldLight,
    shadowOpacity: 0.2,
    shadowRadius: 9,
  },
  rewardIcon: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  rewardIconActive: {
    borderColor: "rgba(235,199,114,0.48)",
    backgroundColor: "rgba(235,199,114,0.10)",
  },
  rewardText: {
    minHeight: 22,
    marginTop: 7,
    color: "rgba(255,255,255,0.32)",
    fontFamily: typography.serifMedium,
    fontSize: 10.5,
    lineHeight: 12,
    textAlign: "center",
  },
  rewardTextActive: { color: colors.goldLight },
  rewardDetail: {
    minHeight: 18,
    marginTop: 3,
    color: "rgba(255,255,255,0.22)",
    fontFamily: typography.sans,
    fontSize: 6.8,
    lineHeight: 9,
    textAlign: "center",
  },
  rewardDetailActive: { color: colors.textSecondary },
  rewardCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
    backgroundColor: colors.goldLight,
  },
  targetBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.72)",
  },
  targetSheet: {
    width: "100%",
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.36)",
    backgroundColor: "#1A1025",
  },
  targetModalTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 24,
    textAlign: "center",
  },
  targetModalText: {
    marginTop: 6,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
  },
  targetChoices: {
    marginTop: 17,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  targetChoice: {
    width: "31.5%",
    height: 67,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(49,28,63,0.74)",
  },
  targetChoiceActive: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  targetChoiceValue: {
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 20,
  },
  targetChoiceValueActive: { color: colors.background },
  targetChoiceLabel: {
    marginTop: 1,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7,
  },
  targetChoiceLabelActive: { color: "rgba(8,6,15,0.70)" },
  targetCancel: {
    height: 42,
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  targetCancelText: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "700",
  },
});
