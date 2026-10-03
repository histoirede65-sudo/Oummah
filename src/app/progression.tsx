import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, router } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { DailyGoal } from "../features/daily-goals/domain/DailyGoal";
import {
  calculateBestStreak,
  calculateCurrentStreak,
  getRange,
  isSuccessfulDay,
  type DailySnapshot,
} from "../features/progression/ProgressionRepository";
import { dailyGoalDateKey } from "../features/daily-goals/data/goalStorage";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

type Period = "week" | "month" | "year";

const PERIODS: readonly Period[] = ["week", "month", "year"];
const WEEK_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTH_LABELS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00`);
}

function dateKey(date: Date) {
  return dailyGoalDateKey(date);
}

function shiftDate(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function periodBounds(period: Period, offset: number) {
  const today = new Date();
  if (period === "week") {
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset + offset * 7);
    return { start, end: shiftDate(start, 6) };
  }
  if (period === "month") {
    const start = new Date(today.getFullYear(), today.getMonth() + offset, 1);
    return { start, end: new Date(start.getFullYear(), start.getMonth() + 1, 0) };
  }
  const start = new Date(today.getFullYear() + offset, 0, 1);
  return { start, end: new Date(start.getFullYear(), 11, 31) };
}

function periodTitle(period: Period, offset: number) {
  const { start, end } = periodBounds(period, offset);
  if (period === "week") {
    return `${start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`;
  }
  if (period === "month") return start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return String(start.getFullYear());
}

function isFuture(key: string) {
  return key > dailyGoalDateKey();
}

function hasProgress(snapshot: DailySnapshot) {
  return Boolean(
    snapshot.quranVerseIds.length ||
    (snapshot.dhikrTotal ?? 0) > 0 ||
    snapshot.prayerCompletions.length ||
    snapshot.hifzReviewsCompleted ||
    snapshot.tahajjudValidated,
  );
}

function progressRatio(snapshot: DailySnapshot) {
  if (!snapshot.plan?.goals.length) return 0;
  return snapshot.plan.goals.filter((goal) => goal.progress.current >= goal.progress.target).length / snapshot.plan.goals.length;
}

function formatDay(key: string) {
  return dateFromKey(key).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function activityValue(snapshots: readonly DailySnapshot[], kind: "quran" | "dhikr" | "hifz" | "prayer" | "tahajjud") {
  const available = snapshots.filter((snapshot) => {
    if (kind === "quran") return snapshot.quranDataAvailable;
    if (kind === "dhikr") return snapshot.dhikrDataAvailable;
    if (kind === "hifz") return snapshot.hifzDataAvailable;
    if (kind === "prayer") return snapshot.prayerDataAvailable;
    return snapshot.tahajjudDataAvailable;
  });
  if (!available.length) return null;
  return available.reduce((total, snapshot) => {
    if (kind === "quran") return total + snapshot.quranVerseIds.length;
    if (kind === "dhikr") return total + (snapshot.dhikrTotal ?? 0);
    if (kind === "hifz") return total + snapshot.hifzReviewsCompleted;
    if (kind === "prayer") return total + snapshot.prayerCompletions.length;
    return total + (snapshot.tahajjudValidated ? 1 : 0);
  }, 0);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.detailRow}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

function SnapshotDetail({ snapshot }: { snapshot: DailySnapshot }) {
  const goals = snapshot.plan?.goals ?? [];
  const rows = goals.map((goal) => ({
    label: goal.metric === "quran_verses_read"
      ? "Coran"
      : goal.metric === "dhikr_count"
        ? "Dhikr"
        : goal.metric === "hifz_review_completed"
          ? "Apprendre"
          : goal.metric === "prayer_completed"
            ? "Prières"
            : goal.title,
    value: `${goal.progress.current}/${goal.progress.target}`,
  }));
  return rows.length ? <View>{rows.map((row) => <DetailRow key={row.label} {...row} />)}</View> : <Text style={styles.emptyText}>Aucun détail disponible pour cette journée.</Text>;
}

export default function ProgressionScreen() {
  const [period, setPeriod] = useState<Period>("month");
  const [offset, setOffset] = useState(0);
  const [snapshots, setSnapshots] = useState<DailySnapshot[]>([]);
  const [streakSnapshots, setStreakSnapshots] = useState<DailySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DailySnapshot | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    const { start, end } = periodBounds(period, offset);
    const today = new Date();
    const visibleEnd = end < today ? end : today;
    setLoading(true);
    void Promise.all([
      getRange(dateKey(start), dateKey(visibleEnd)),
      getRange(dateKey(shiftDate(today, -365)), dateKey(today)),
    ]).then(([visible, streak]) => {
      if (!active) return;
      setSnapshots(visible);
      setStreakSnapshots(streak);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [offset, period]));

  const { start, end } = useMemo(() => periodBounds(period, offset), [offset, period]);
  const snapshotByDate = useMemo(() => new Map(snapshots.map((snapshot) => [snapshot.dateKey, snapshot])), [snapshots]);
  const followed = snapshots.filter((snapshot) => snapshot.hasData && !isFuture(snapshot.dateKey));
  const successful = followed.filter(isSuccessfulDay).length;
  const currentStreak = calculateCurrentStreak(streakSnapshots);
  const bestStreak = calculateBestStreak(streakSnapshots);
  const activitySnapshots = snapshots.filter((snapshot) => !isFuture(snapshot.dateKey));
  const days = useMemo(() => {
    const values: string[] = [];
    for (let cursor = new Date(start); cursor <= end; cursor = shiftDate(cursor, 1)) values.push(dateKey(cursor));
    return values;
  }, [end, start]);

  const changeOffset = (direction: -1 | 1) => {
    if (direction > 0 && offset >= 0) return;
    setOffset((value) => value + direction);
  };

  const renderDay = (key: string, compact = false) => {
    const snapshot = snapshotByDate.get(key);
    const future = isFuture(key);
    const state = future || !snapshot?.hasData
      ? "unknown"
      : isSuccessfulDay(snapshot)
        ? "success"
        : hasProgress(snapshot)
          ? "partial"
          : "neutral";
    const tone = state === "unknown"
      ? styles.dayMuted
      : state === "success"
        ? styles.daySuccess
        : state === "partial"
          ? styles.dayPartial
          : styles.dayNeutral;
    return <Pressable key={key} disabled={!snapshot?.hasData || future} onPress={() => setSelected(snapshot ?? null)} style={[compact ? styles.weekDay : styles.calendarDay, tone]}>
      <Text style={styles.dayNumber}>{dateFromKey(key).getDate()}</Text>
      {!compact && <View style={[styles.dayDot, state === "success" && styles.dotSuccess, state === "partial" && styles.dotPartial, state === "neutral" && styles.dotNeutral]} />}
      {compact && <Text style={styles.weekLabel}>{WEEK_LABELS[(dateFromKey(key).getDay() + 6) % 7]}</Text>}
    </Pressable>;
  };

  const yearRows = useMemo(() => Array.from({ length: 12 }, (_, month) => {
    const monthSnapshots = snapshots.filter((snapshot) => dateFromKey(snapshot.dateKey).getMonth() === month && snapshot.hasData && !isFuture(snapshot.dateKey));
    const monthSuccessful = monthSnapshots.filter(isSuccessfulDay).length;
    return { name: MONTH_LABELS[month], followed: monthSnapshots.length, successful: monthSuccessful };
  }), [snapshots]);

  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}><Ionicons name="arrow-back" size={21} color={colors.goldLight} /></Pressable>
        <Text style={styles.title}>Ma progression</Text>
        <View style={styles.headerButton} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.periodTabs}>{PERIODS.map((item) => <Pressable key={item} onPress={() => { setPeriod(item); setOffset(0); }} style={[styles.periodTab, period === item && styles.periodTabActive]}><Text style={[styles.periodText, period === item && styles.periodTextActive]}>{item === "week" ? "Semaine" : item === "month" ? "Mois" : "Année"}</Text></Pressable>)}</View>
        <View style={styles.periodNav}><Pressable onPress={() => changeOffset(-1)} style={styles.navButton}><Ionicons name="chevron-back" size={18} color={colors.goldLight} /></Pressable><Text style={styles.periodTitle}>{periodTitle(period, offset)}</Text><Pressable disabled={offset >= 0} onPress={() => changeOffset(1)} style={[styles.navButton, offset >= 0 && styles.navDisabled]}><Ionicons name="chevron-forward" size={18} color={colors.goldLight} /></Pressable></View>
        {loading ? <View style={styles.loader}><ActivityIndicator color={colors.goldLight} /></View> : (
          <>
            <View style={styles.streakCard}><View><Text style={styles.eyebrow}>🔥 SÉRIE ACTUELLE</Text><Text style={styles.streakValue}>{currentStreak} {currentStreak === 1 ? "jour" : "jours"}</Text><Text style={styles.streakBest}>Meilleure série : {bestStreak} {bestStreak === 1 ? "jour" : "jours"}</Text></View><Ionicons name="flame-outline" size={38} color={colors.goldLight} /></View>
            <View style={styles.summaryCard}><Text style={styles.eyebrow}>RÉSUMÉ DE LA PÉRIODE</Text><Text style={styles.summaryText}>{successful} {successful === 1 ? "jour réussi" : "jours réussis"} sur {followed.length} {followed.length === 1 ? "jour suivi" : "jours suivis"}</Text></View>
            {period === "week" ? <View style={styles.card}><Text style={styles.cardTitle}>Semaine</Text><View style={styles.weekRow}>{days.map((key) => renderDay(key, true))}</View></View> : null}
            {period === "month" ? <View style={styles.card}><Text style={styles.cardTitle}>Calendrier</Text><View style={styles.legend}><View style={styles.legendItem}><View style={[styles.legendDot, styles.dotSuccess]} /><Text style={styles.legendText}>Réussi</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, styles.dotPartial]} /><Text style={styles.legendText}>Partiel</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, styles.dotNeutral]} /><Text style={styles.legendText}>Non accompli</Text></View><View style={styles.legendItem}><Text style={styles.legendDash}>—</Text><Text style={styles.legendText}>Pas de données</Text></View></View><View style={styles.calendarHeader}>{["L", "M", "M", "J", "V", "S", "D"].map((label, index) => <Text key={`${label}-${index}`} style={styles.calendarHeaderText}>{label}</Text>)}</View><View style={styles.calendarGrid}>{Array.from({ length: (dateFromKey(dateKey(start)).getDay() + 6) % 7 }, (_, index) => <View key={`empty-${index}`} style={styles.calendarDay} />)}{days.map((key) => renderDay(key))}</View></View> : null}
            {period === "year" ? <View style={styles.card}><Text style={styles.cardTitle}>Année</Text>{yearRows.map((row) => { const ratio = row.followed ? row.successful / row.followed : 0; return <View key={row.name} style={styles.monthRow}><View style={styles.monthCopy}><Text style={styles.monthName}>{row.name}</Text><Text style={styles.monthMeta}>{row.followed ? `${row.successful} réussi${row.successful > 1 ? "s" : ""} / ${row.followed} suivi${row.followed > 1 ? "s" : ""}` : "Pas encore de données"}</Text></View><View style={styles.monthTrack}><View style={[styles.monthFill, { width: `${ratio * 100}%` }]} /></View></View>; })}</View> : null}
            <Text style={styles.sectionTitle}>Activité</Text>
            <View style={styles.activityGrid}>{[
              ["Coran", "quran", "versets lus"], ["Dhikr", "dhikr", "dhikr"], ["Apprendre", "hifz", "révisions terminées"], ["Prières", "prayer", "prières validées"], ["Qiyam al-Layl", "tahajjud", "nuits"],
            ].map(([label, kind, suffix]) => { const value = activityValue(activitySnapshots, kind as "quran" | "dhikr" | "hifz" | "prayer" | "tahajjud"); return <View key={label} style={styles.activityCard}><Text style={styles.activityLabel}>{label}</Text><Text style={styles.activityValue}>{value === null ? "—" : value}</Text><Text style={styles.activitySuffix}>{value === null ? "Pas encore de données" : suffix}</Text></View>; })}</View>
            {!followed.length ? <Text style={styles.emptyText}>Aucune donnée disponible pour cette période.</Text> : null}
          </>
        )}
      </ScrollView>
      <Modal visible={Boolean(selected)} transparent animationType="fade" onRequestClose={() => setSelected(null)}><Pressable style={styles.modalBackdrop} onPress={() => setSelected(null)}><Pressable style={styles.detailCard} onPress={(event) => event.stopPropagation()}><Text style={styles.detailTitle}>{selected ? formatDay(selected.dateKey) : ""}</Text>{selected ? <SnapshotDetail snapshot={selected} /> : null}<Pressable onPress={() => setSelected(null)} style={styles.closeButton}><Text style={styles.closeText}>Fermer</Text></Pressable></Pressable></Pressable></Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 62, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 25 },
  content: { padding: 16, paddingBottom: 34, gap: 12 },
  periodTabs: { padding: 4, flexDirection: "row", borderRadius: 16, backgroundColor: colors.surface },
  periodTab: { flex: 1, minHeight: 38, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  periodTabActive: { backgroundColor: colors.goldLight },
  periodText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 13, fontWeight: "700" },
  periodTextActive: { color: colors.background },
  periodNav: { minHeight: 42, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  navButton: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.surface },
  navDisabled: { opacity: 0.3 },
  periodTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 17, textTransform: "capitalize" },
  loader: { minHeight: 260, alignItems: "center", justifyContent: "center" },
  streakCard: { padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 22, borderWidth: 1, borderColor: "rgba(227,181,90,0.24)", backgroundColor: colors.surface },
  eyebrow: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  streakValue: { marginTop: 4, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 28 },
  streakBest: { marginTop: 3, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  summaryCard: { padding: 16, borderRadius: 20, backgroundColor: "rgba(98,197,139,0.08)" },
  summaryText: { marginTop: 7, color: colors.text, fontFamily: typography.serifMedium, fontSize: 18 },
  card: { padding: 15, borderRadius: 20, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface },
  cardTitle: { marginBottom: 13, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 20 },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  weekDay: { width: 39, height: 64, alignItems: "center", justifyContent: "center", borderRadius: 14 },
  weekLabel: { position: "absolute", bottom: 5, color: colors.textMuted, fontFamily: typography.sans, fontSize: 9 },
  calendarHeader: { marginBottom: 6, flexDirection: "row" },
  calendarHeaderText: { width: "14.2857%", color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, textAlign: "center" },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarDay: { width: "14.2857%", height: 42, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  dayNumber: { color: colors.text, fontFamily: typography.sans, fontSize: 12, fontWeight: "700" },
  dayDot: { width: 5, height: 5, marginTop: 3, borderRadius: 3, backgroundColor: colors.textMuted },
  dotSuccess: { backgroundColor: colors.success },
  dotPartial: { backgroundColor: colors.goldLight },
  dotNeutral: { backgroundColor: colors.textMuted },
  legend: { marginBottom: 11, flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center" },
  legendDot: { width: 7, height: 7, marginRight: 4, borderRadius: 4 },
  legendDash: { marginRight: 4, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 },
  legendText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5 },
  daySuccess: { backgroundColor: "rgba(98,197,139,0.28)" },
  dayPartial: { backgroundColor: "rgba(227,181,90,0.24)" },
  dayNeutral: { backgroundColor: "rgba(255,255,255,0.06)" },
  dayMuted: { opacity: 0.3 },
  sectionTitle: { marginTop: 8, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 21 },
  activityGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  activityCard: { width: "48.5%", minHeight: 88, padding: 13, borderRadius: 17, backgroundColor: colors.surface },
  activityLabel: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  activityValue: { marginTop: 7, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 24 },
  activitySuffix: { marginTop: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11 },
  monthRow: { minHeight: 47, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  monthCopy: { flex: 1 },
  monthName: { color: colors.text, fontFamily: typography.sans, fontSize: 13, fontWeight: "700" },
  monthMeta: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5 },
  monthTrack: { width: 92, height: 6, marginLeft: 12, overflow: "hidden", borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)" },
  monthFill: { height: "100%", borderRadius: 3, backgroundColor: colors.success },
  emptyText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, lineHeight: 18, textAlign: "center" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(4,6,13,0.72)" },
  detailCard: { padding: 22, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: colors.surface },
  detailTitle: { marginBottom: 15, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 23, textTransform: "capitalize" },
  detailRow: { minHeight: 37, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  detailLabel: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14 },
  detailValue: { color: colors.text, fontFamily: typography.sans, fontSize: 14, fontWeight: "800" },
  closeButton: { minHeight: 44, marginTop: 18, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.goldLight },
  closeText: { color: colors.background, fontFamily: typography.sans, fontSize: 14, fontWeight: "800" },
});
