import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import type { GoalCategory, GoalMetric } from "../features/daily-goals/domain/GoalCategory";
import { loadGoalReview, type GoalReview, type ReviewPeriod } from "../features/daily-goals/services/goalReviews";
import { useI18n } from "../i18n";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const FR = {
  eyebrow: "Objectifs", title: "Mes bilans", back: "Retour",
  periods: { week: "Semaine", month: "Mois", year: "Année" } as Record<ReviewPeriod, string>,
  activeDays: "jours actifs", of: (n: number) => `sur ${n}`,
  moreDays: (n: number, p: ReviewPeriod) => `+${n} jour${n > 1 ? "s" : ""} par rapport ${p === "week" ? "à la semaine précédente" : p === "month" ? "au mois précédent" : "à l’année précédente"}`,
  lessDays: (n: number, p: ReviewPeriod) => `${n} jour${n > 1 ? "s" : ""} de moins ${p === "week" ? "que la semaine précédente" : p === "month" ? "que le mois précédent" : "que l’année précédente"}`,
  sameDays: (p: ReviewPeriod): string => (p === "week" ? "Autant que la semaine précédente" : p === "month" ? "Autant que le mois précédent" : "Autant que l’année précédente"),
  bestDay: "Votre meilleur jour", goalsOf: (a: number, b: number) => `${a} objectif${a > 1 ? "s" : ""} sur ${b}`,
  mostFollowed: "Ce que vous avez le plus suivi", streak: "Plus longue série", streakDays: (n: number) => `${n} jour${n > 1 ? "s" : ""} de suite`,
  heatHint: "Plus la case est dorée, plus vous avez accompli d’objectifs ce jour-là.",
  empty: "Aucun objectif enregistré sur cette période. Vos bilans se remplissent à mesure que vous suivez vos objectifs du jour.",
  openGoals: "Ouvrir mes objectifs", yearSoFar: "depuis le 1er janvier", next: "Suivant", again: "Revoir",
  yourYear: (y: number) => `Votre année ${y}`, activeDaysYear: "jours actifs cette année", bestMonth: "Votre mois le plus régulier", goalsDone: "objectifs accomplis",
  moreThan: (n: number, y: number) => `C’est ${n} de plus qu’en ${y}`,
  hadith: "Rapporté par `Aisha : On a demandé au Prophète (ﷺ) : Quelles sont les actions les plus aimées d'Allah ? Il a répondu : Les actions régulières et constantes, même si elles sont peu nombreuses. Il a ajouté : Ne vous engagez que dans les actions que vous pouvez accomplir",
  hadithRef: "Sahih al-Bukhari 6465",
  metrics: { quran_verses_read: "versets lus", hifz_verses_learned: "versets mémorisés", dhikr_count: "dhikr", prayer_completed: "prières cochées", tahajjud_night: "nuits de Qiyam", hadith_read: "hadiths lus", dua_read: "duas lues", prophet_story: "histoires des prophètes" } as Partial<Record<GoalMetric, string>>,
  categories: { quran: "Coran", hifz: "Mémorisation", dhikr: "Dhikr", dua: "Duas", hadith: "Hadiths", prayer: "Prière", calendar: "Calendrier", prophets: "Prophètes", character: "Comportement", personal: "Personnel" } as Record<GoalCategory, string>,
  locale: "fr-FR",
};
const EN: typeof FR = {
  eyebrow: "Goals", title: "My reviews", back: "Back",
  periods: { week: "Week", month: "Month", year: "Year" },
  activeDays: "active days", of: (n) => `out of ${n}`,
  moreDays: (n, p) => `+${n} day${n > 1 ? "s" : ""} compared with the previous ${p}`,
  lessDays: (n, p) => `${n} day${n > 1 ? "s" : ""} fewer than the previous ${p}`,
  sameDays: (p) => `As many as the previous ${p}`,
  bestDay: "Your best day", goalsOf: (a, b) => `${a} goal${a > 1 ? "s" : ""} out of ${b}`,
  mostFollowed: "What you followed most", streak: "Longest streak", streakDays: (n) => `${n} day${n > 1 ? "s" : ""} in a row`,
  heatHint: "The more golden the square, the more goals you completed that day.",
  empty: "No goals recorded in this period. Your reviews fill up as you follow your daily goals.",
  openGoals: "Open my goals", yearSoFar: "since 1 January", next: "Next", again: "See again",
  yourYear: (y) => `Your year ${y}`, activeDaysYear: "active days this year", bestMonth: "Your most regular month", goalsDone: "goals completed",
  moreThan: (n, y) => `That is ${n} more than in ${y}`,
  hadith: "Narrated `Aisha:The Prophet (ﷺ) was asked, \"What deeds are loved most by Allah?\" He said, \"The most regular constant deeds even though they may be few.\" He added, 'Don't take upon yourselves, except the deeds which are within your ability",
  hadithRef: "Sahih al-Bukhari 6465",
  metrics: { quran_verses_read: "verses read", hifz_verses_learned: "verses memorised", dhikr_count: "dhikr", prayer_completed: "prayers ticked", tahajjud_night: "nights of Qiyam", hadith_read: "hadiths read", dua_read: "duas read", prophet_story: "stories of the prophets" },
  categories: { quran: "Quran", hifz: "Memorisation", dhikr: "Dhikr", dua: "Duas", hadith: "Hadiths", prayer: "Prayer", calendar: "Calendar", prophets: "Prophets", character: "Character", personal: "Personal" },
  locale: "en-GB",
};

const METRIC_ICONS: Partial<Record<GoalMetric, keyof typeof Ionicons.glyphMap>> = {
  quran_verses_read: "book-outline", hifz_verses_learned: "school-outline", dhikr_count: "ellipse-outline", prayer_completed: "checkmark-circle-outline",
  tahajjud_night: "moon-outline", hadith_read: "library-outline", dua_read: "hand-left-outline", prophet_story: "sparkles-outline",
};

const PERIODS: ReviewPeriod[] = ["week", "month", "year"];

export default function ReviewsScreen() {
  const { language } = useI18n();
  const tx = language === "en" ? EN : FR;
  const params = useLocalSearchParams<{ period?: string }>();
  const initial = PERIODS.includes(params.period as ReviewPeriod) ? (params.period as ReviewPeriod) : "week";
  const [period, setPeriod] = useState<ReviewPeriod>(initial);
  const [offset, setOffset] = useState(0);
  const [review, setReview] = useState<GoalReview | null>(null);

  useEffect(() => {
    let active = true;
    void loadGoalReview(period, offset).then((value) => active && setReview(value));
    return () => {
      active = false;
    };
  }, [period, offset]);

  const choose = (value: ReviewPeriod) => {
    setPeriod(value);
    setOffset(0);
    setReview(null);
  };
  const move = (step: number) => {
    setOffset((value) => Math.max(0, value + step));
    setReview(null);
  };

  const label = review ? periodLabel(review, tx) : "";

  return (
    <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.iconButton} accessibilityRole="button" accessibilityLabel={tx.back}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <View>
              <Text style={styles.eyebrow}>{tx.eyebrow}</Text>
              <Text style={styles.title}>{tx.title}</Text>
            </View>
          </View>

          <View style={styles.segment}>
            {PERIODS.map((item) => (
              <Pressable key={item} onPress={() => choose(item)} style={[styles.segmentItem, period === item && styles.segmentOn]} accessibilityRole="tab" accessibilityState={{ selected: period === item }}>
                <Text style={[styles.segmentText, period === item && styles.segmentTextOn]}>{tx.periods[item]}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.periodRow}>
            <Pressable onPress={() => move(1)} hitSlop={10} accessibilityRole="button" accessibilityLabel="‹">
              <Ionicons name="chevron-back" size={20} color={colors.goldLight} />
            </Pressable>
            <Text style={styles.periodLabel}>{label}</Text>
            <Pressable onPress={() => move(-1)} disabled={offset === 0} hitSlop={10} accessibilityRole="button" accessibilityLabel="›">
              <Ionicons name="chevron-forward" size={20} color={offset === 0 ? "rgba(255,255,255,0.15)" : colors.goldLight} />
            </Pressable>
          </View>

          {!review ? (
            <View style={styles.loader}><ActivityIndicator color={colors.goldLight} /></View>
          ) : review.activeDays === 0 && review.completedGoals === 0 ? (
            <View style={styles.card}>
              <Ionicons name="leaf-outline" size={26} color={colors.goldLight} />
              <Text style={styles.emptyText}>{tx.empty}</Text>
              <Pressable onPress={() => router.push("/daily-goals")} style={styles.linkButton}>
                <Text style={styles.linkText}>{tx.openGoals}</Text>
              </Pressable>
            </View>
          ) : review.period === "year" ? (
            <YearStory review={review} tx={tx} />
          ) : (
            <PeriodReview review={review} tx={tx} />
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function periodLabel(review: GoalReview, tx: typeof FR) {
  const day = (date: Date, withMonth = true) => date.toLocaleDateString(tx.locale, withMonth ? { weekday: "long", day: "numeric", month: "short" } : { weekday: "long", day: "numeric" });
  if (review.period === "week") return `${day(review.start, review.start.getMonth() !== review.end.getMonth())} – ${day(review.end)}`;
  if (review.period === "month") {
    const text = review.start.toLocaleDateString(tx.locale, { month: "long", year: "numeric" });
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  return review.ongoing ? `${review.start.getFullYear()} · ${tx.yearSoFar}` : String(review.start.getFullYear());
}

function Comparison({ review, tx }: { review: GoalReview; tx: typeof FR }) {
  if (review.previousActiveDays === null) return null;
  const delta = review.activeDays - review.previousActiveDays;
  return (
    <Text style={[styles.compare, delta > 0 && styles.compareUp]}>
      {delta > 0 ? tx.moreDays(delta, review.period) : delta < 0 ? tx.lessDays(-delta, review.period) : tx.sameDays(review.period)}
    </Text>
  );
}

function Metrics({ review, tx }: { review: GoalReview; tx: typeof FR }) {
  const items = (Object.keys(tx.metrics) as GoalMetric[]).filter((metric) => (review.totals[metric] ?? 0) > 0);
  if (!items.length) return null;
  return (
    <View style={styles.metrics}>
      {items.map((metric) => (
        <View key={metric} style={styles.metric}>
          <Ionicons name={METRIC_ICONS[metric] ?? "ellipse-outline"} size={17} color={colors.goldLight} />
          <Text style={styles.metricValue}>{Math.round(review.totals[metric] ?? 0).toLocaleString(tx.locale)}</Text>
          <Text style={styles.metricLabel}>{tx.metrics[metric]}</Text>
        </View>
      ))}
    </View>
  );
}

function PeriodReview({ review, tx }: { review: GoalReview; tx: typeof FR }) {
  const week = review.period === "week";
  return (
    <>
      <View style={[styles.card, styles.cardGold]}>
        <View style={styles.bigRow}>
          <Text style={styles.big}>{review.activeDays}</Text>
          <Text style={styles.bigLabel}>{tx.activeDays}{"\n"}{tx.of(review.dayCount)}</Text>
        </View>
        <Comparison review={review} tx={tx} />
        {week ? (
          <View style={styles.weekRow}>
            {review.days.map((day) => (
              <View key={day.key} style={styles.weekItem}>
                <View style={[styles.moon, day.completed > 0 && styles.moonOn]} />
                <Text style={styles.weekDay}>{new Date(`${day.key}T12:00:00`).toLocaleDateString(tx.locale, { weekday: "narrow" })}</Text>
              </View>
            ))}
          </View>
        ) : (
          <>
            <Heatmap review={review} />
            <Text style={styles.hint}>{tx.heatHint}</Text>
          </>
        )}
      </View>

      <Metrics review={review} tx={tx} />

      {!week && review.categories.length ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{tx.mostFollowed}</Text>
          {review.categories.slice(0, 4).map((item) => (
            <View key={item.category} style={styles.catRow}>
              <View style={styles.catHead}>
                <Text style={styles.catName}>{tx.categories[item.category]}</Text>
                <Text style={styles.catRate}>{item.rate} %</Text>
              </View>
              <View style={styles.bar}><View style={[styles.barFill, { width: `${item.rate}%` }]} /></View>
            </View>
          ))}
        </View>
      ) : null}

      {week && review.bestDay ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{tx.bestDay}</Text>
          <Text style={styles.cardValue}>
            {capitalize(new Date(`${review.bestDay.key}T12:00:00`).toLocaleDateString(tx.locale, { weekday: "long" }))} · {tx.goalsOf(review.bestDay.completed, review.bestDay.total)}
          </Text>
        </View>
      ) : null}

      {!week && review.longestStreak > 1 ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{tx.streak}</Text>
          <Text style={styles.cardValue}>{tx.streakDays(review.longestStreak)}</Text>
        </View>
      ) : null}
    </>
  );
}

/** Month at a glance, Monday-first; the gold deepens with the share of goals completed that day. */
function Heatmap({ review }: { review: GoalReview }) {
  const lead = (review.start.getDay() + 6) % 7;
  const cells: (GoalReview["days"][number] | null)[] = [...new Array<null>(lead).fill(null), ...review.days];
  return (
    <View style={styles.heat}>
      {cells.map((day, index) => {
        const share = day && day.total ? day.completed / day.total : 0;
        return (
          <View key={day?.key ?? `lead-${index}`} style={styles.heatCell}>
            <View style={[styles.heatInner, !day && styles.heatBlank, day && share > 0 && { backgroundColor: `rgba(227,181,90,${0.28 + 0.72 * share})` }]} />
          </View>
        );
      })}
    </View>
  );
}

/** Year: a few pages, one figure each, swiped like a story. */
function YearStory({ review, tx }: { review: GoalReview; tx: typeof FR }) {
  const { width } = useWindowDimensions();
  const pageWidth = width - 44;
  const [page, setPage] = useState(0);
  const [scroller, setScroller] = useState<ScrollView | null>(null);
  const year = review.start.getFullYear();
  const verses = review.totals.quran_verses_read ?? 0;
  const versesBefore = review.previousTotals?.quran_verses_read ?? 0;
  const monthName = review.bestMonth === null ? null : capitalize(new Date(year, review.bestMonth, 1).toLocaleDateString(tx.locale, { month: "long" }));

  const pages: { big: string; label: string; note?: string }[] = [
    { big: String(review.activeDays), label: tx.activeDaysYear, note: review.previousActiveDays !== null && review.activeDays > review.previousActiveDays ? tx.moreThan(review.activeDays - review.previousActiveDays, year - 1) : undefined },
    { big: review.completedGoals.toLocaleString(tx.locale), label: tx.goalsDone },
    ...(verses > 0 ? [{ big: verses.toLocaleString(tx.locale), label: tx.metrics.quran_verses_read ?? "", note: review.previousTotals && verses > versesBefore ? tx.moreThan(verses - versesBefore, year - 1) : undefined }] : []),
    ...(review.longestStreak > 1 ? [{ big: String(review.longestStreak), label: tx.streak, note: tx.streakDays(review.longestStreak) }] : []),
    ...(monthName ? [{ big: monthName, label: tx.bestMonth }] : []),
  ];
  const last = page >= pages.length - 1;
  const goTo = (index: number) => {
    scroller?.scrollTo({ x: index * pageWidth, animated: true });
    setPage(index);
  };

  return (
    <>
      <View style={styles.dots}>
        {pages.map((item, index) => <View key={item.label} style={[styles.dot, index === page && styles.dotOn]} />)}
      </View>
      <ScrollView
        ref={setScroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / pageWidth))}
        style={{ width: pageWidth }}
      >
        {pages.map((item) => (
          <LinearGradient key={item.label} colors={["#1B1033", "#0B0818"]} style={[styles.story, { width: pageWidth }]}>
            <Text style={styles.eyebrow}>{tx.yourYear(year)}</Text>
            <Text style={[styles.storyBig, item.big.length > 6 && styles.storyBigWord]} adjustsFontSizeToFit numberOfLines={1}>{item.big}</Text>
            <Text style={styles.storyLabel}>{item.label}</Text>
            {item.note ? <Text style={styles.storyNote}>{item.note}</Text> : null}
          </LinearGradient>
        ))}
      </ScrollView>
      <Pressable onPress={() => goTo(last ? 0 : page + 1)} style={({ pressed }) => [pressed && styles.pressed]}>
        <LinearGradient colors={["#F3D79A", colors.goldLight]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextButton}>
          <Text style={styles.nextText}>{last ? tx.again : tx.next}</Text>
        </LinearGradient>
      </Pressable>
      <View style={[styles.card, styles.cardGold]}>
        <Text style={styles.hadith}>{tx.hadith}</Text>
        <Text style={styles.hadithRef}>{tx.hadithRef}</Text>
      </View>
    </>
  );
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  content: { paddingHorizontal: 22, paddingBottom: 60, gap: 14 },
  pressed: { opacity: 0.75 },
  header: { marginTop: 8, flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderSoft },
  eyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase" },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 36, lineHeight: 40 },
  segment: { flexDirection: "row", padding: 4, borderRadius: 18, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.04)" },
  segmentItem: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  segmentOn: { backgroundColor: colors.goldLight },
  segmentText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15, fontWeight: "700" },
  segmentTextOn: { color: "#1A1206" },
  periodRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 4 },
  periodLabel: { flex: 1, textAlign: "center", color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14.5, fontWeight: "700" },
  loader: { height: 240, alignItems: "center", justifyContent: "center" },
  card: { padding: 16, borderRadius: 22, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.03)", gap: 6 },
  cardGold: { borderColor: "rgba(227,181,90,0.35)", backgroundColor: "rgba(227,181,90,0.07)" },
  cardLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 13.5 },
  cardValue: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 23 },
  bigRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  big: { color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 68, lineHeight: 70 },
  bigLabel: { marginBottom: 8, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15, lineHeight: 19 },
  compare: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 13.5 },
  compareUp: { color: colors.success, fontWeight: "700" },
  weekRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
  weekItem: { alignItems: "center", gap: 5 },
  moon: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: "rgba(183,171,242,0.3)" },
  moonOn: { backgroundColor: colors.goldLight, borderColor: colors.goldLight, shadowColor: colors.goldLight, shadowOpacity: 0.7, shadowRadius: 8, shadowOffset: { width: 0, height: 0 }, elevation: 4 },
  weekDay: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5, fontWeight: "700", textTransform: "uppercase" },
  heat: { marginTop: 10, flexDirection: "row", flexWrap: "wrap" },
  heatCell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2.5 },
  heatInner: { flex: 1, borderRadius: 7, backgroundColor: "rgba(255,255,255,0.05)" },
  heatBlank: { backgroundColor: "transparent" },
  hint: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 17 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metric: { width: "47%", flexGrow: 1, padding: 14, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.03)", gap: 2 },
  metricValue: { marginTop: 4, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 30 },
  metricLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 13 },
  catRow: { marginTop: 8 },
  catHead: { flexDirection: "row", justifyContent: "space-between" },
  catName: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14.5 },
  catRate: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14.5, fontWeight: "700" },
  bar: { marginTop: 5, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, backgroundColor: colors.goldLight },
  emptyText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15.5, lineHeight: 22 },
  linkButton: { marginTop: 6, alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16, borderWidth: 1, borderColor: "rgba(227,181,90,0.4)" },
  linkText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 14.5, fontWeight: "700" },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.2)" },
  dotOn: { width: 18, backgroundColor: colors.goldLight },
  story: { minHeight: 340, padding: 24, borderRadius: 28, borderWidth: 1, borderColor: "rgba(227,181,90,0.3)", alignItems: "center", justifyContent: "center", gap: 10 },
  storyBig: { color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 92, lineHeight: 100, textAlign: "center" },
  storyBigWord: { fontSize: 64, lineHeight: 72 },
  storyLabel: { color: colors.text, fontFamily: typography.sans, fontSize: 18, textAlign: "center" },
  storyNote: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 14, textAlign: "center" },
  nextButton: { minHeight: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  nextText: { color: "#1A1206", fontFamily: typography.sans, fontSize: 16, fontWeight: "800" },
  hadith: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 19, lineHeight: 26 },
  hadithRef: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 13, fontWeight: "700" },
});
