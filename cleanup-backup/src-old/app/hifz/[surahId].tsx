import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { SURAHS } from "../../data/surahs";
import {
  loadHifzState,
  saveHifzState,
  type HifzState,
} from "../../features/hifz/HifzStore";
import { quranFoundationRepository } from "../../features/quranfoundation/QuranFoundationRepository";
import type { QuranFoundationVerse } from "../../features/quranfoundation/QuranFoundationTypes";
import { ARABIC_READING_FONT_FAMILY } from "../../features/quran/ArabicReadingPresentation";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Tab = "all" | "learned" | "review" | "new";

export default function HifzSurahDetail() {
  const { surahId: rawId } = useLocalSearchParams<{ surahId: string }>();
  const surahId = Math.max(1, Math.min(114, Number(rawId) || 1));
  const surah = SURAHS.find((item) => item.id === surahId) ?? SURAHS[0];
  const [state, setState] = useState<HifzState>();
  const [verses, setVerses] = useState<readonly QuranFoundationVerse[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(Math.min(3, surah.verses));

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadHifzState().then((next) => active && setState(next));
      return () => {
        active = false;
      };
    }, [surahId]),
  );
  useEffect(() => {
    void quranFoundationRepository
      .getVerses(surahId)
      .then(setVerses)
      .catch(() => setVerses([]));
  }, [surahId]);
  const progress = state?.progress.find((item) => item.surahId === surahId);
  const learned = new Set(progress?.learnedVerses ?? []);
  const difficult = new Set(progress?.difficultVerses ?? []);
  const filtered = useMemo(
    () =>
      verses.filter((verse) => {
        const number = Number(verse.verseKey.split(":")[1]);
        if (tab === "all") return true;
        if (tab === "learned") return learned.has(number);
        if (tab === "review") return difficult.has(number);
        return !learned.has(number);
      }),
    [difficult, learned, tab, verses],
  );
  const planRange = () => {
    if (!state) return;
    const range = { surahId, startVerse, endVerse };
    const next = {
      ...state,
      plannedRanges: [
        ...(state.plannedRanges ?? []).filter(
          (item) => item.surahId !== surahId,
        ),
        range,
      ],
    };
    setState(next);
    void saveHifzState(next);
    router.push(
      `/hifz/session?surah=${surahId}&verse=${startVerse}&end=${endVerse}`,
    );
  };
  const status = (number: number) =>
    learned.has(number)
      ? "Mémorisé"
      : difficult.has(number)
        ? "À revoir"
        : "À apprendre";
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Pressable onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
          </Pressable>
          <View style={styles.topCopy}>
            <Text style={styles.title}>{surah.transliteration}</Text>
            <Text style={styles.subtitle}>Programme de mémorisation</Text>
          </View>
          <Text style={styles.arabicHeader}>{surah.arabicName}</Text>
        </View>
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>
            {learned.size} sur {surah.verses} versets mémorisés
          </Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${(learned.size / surah.verses) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Vous avancez à votre rythme. Chaque verset compte.
          </Text>
        </View>
        <View style={styles.rangeCard}>
          <View style={styles.rangeHeader}>
            <View>
              <Text style={styles.rangeTitle}>Mon prochain passage</Text>
              <Text style={styles.rangeText}>
                Choisissez exactement les versets à travailler.
              </Text>
            </View>
            <Ionicons
              name="options-outline"
              size={19}
              color={colors.goldLight}
            />
          </View>
          <View style={styles.rangeControls}>
            <Pressable
              onPress={() => setStartVerse((value) => Math.max(1, value - 1))}
              style={styles.rangeButton}
            >
              <Ionicons name="remove" size={16} color={colors.goldLight} />
            </Pressable>
            <View style={styles.rangeValue}>
              <Text style={styles.rangeLabel}>DU</Text>
              <Text style={styles.rangeNumber}>{startVerse}</Text>
            </View>
            <Text style={styles.rangeTo}>→</Text>
            <View style={styles.rangeValue}>
              <Text style={styles.rangeLabel}>AU</Text>
              <Text style={styles.rangeNumber}>{endVerse}</Text>
            </View>
            <Pressable
              onPress={() =>
                setEndVerse((value) =>
                  Math.min(surah.verses, Math.max(value + 1, startVerse)),
                )
              }
              style={styles.rangeButton}
            >
              <Ionicons name="add" size={16} color={colors.goldLight} />
            </Pressable>
          </View>
          <Pressable onPress={planRange} style={styles.planButton}>
            <Ionicons name="play" size={16} color={colors.background} />
            <Text style={styles.planText}>
              Mémoriser les versets {startVerse} à {endVerse}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.sectionTitle}>Les versets</Text>
        <View style={styles.tabs}>
          {(
            [
              ["all", "Tous"],
              ["learned", "Mémorisés"],
              ["review", "À revoir"],
              ["new", "Nouveaux"],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setTab(id)}
              style={[styles.tab, tab === id && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, tab === id && styles.tabTextActive]}
              >
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        {!verses.length ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.goldLight} />
            <Text style={styles.loadingText}>Chargement des versets…</Text>
          </View>
        ) : (
          filtered.map((verse) => {
            const number = Number(verse.verseKey.split(":")[1]);
            const current = status(number);
            return (
              <Pressable
                key={verse.verseKey}
                onPress={() =>
                  router.push(`/hifz/session?surah=${surahId}&verse=${number}`)
                }
                style={styles.verseRow}
              >
                <View
                  style={[
                    styles.statusDot,
                    current === "Mémorisé" && styles.statusLearned,
                    current === "À revoir" && styles.statusReview,
                  ]}
                >
                  <Ionicons
                    name={
                      current === "Mémorisé"
                        ? "checkmark"
                        : current === "À revoir"
                          ? "refresh"
                          : "play"
                    }
                    size={12}
                    color={
                      current === "À apprendre"
                        ? colors.goldLight
                        : colors.background
                    }
                  />
                </View>
                <View style={styles.verseCopy}>
                  <Text style={styles.verseLabel}>
                    Verset {number} · {current}
                  </Text>
                  <Text numberOfLines={2} style={styles.verseArabic}>
                    {verse.textUthmani}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.goldLight}
                />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 14, paddingBottom: 120 },
  top: { height: 72, flexDirection: "row", alignItems: "center" },
  back: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.purpleDeep,
  },
  topCopy: { flex: 1, marginLeft: 12 },
  title: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 23,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
  },
  arabicHeader: {
    color: colors.goldMuted,
    fontFamily: typography.arabic,
    fontSize: 25,
  },
  progressCard: {
    padding: 15,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
    backgroundColor: "rgba(49,27,63,0.86)",
  },
  progressTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  track: {
    height: 5,
    marginTop: 12,
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  fill: { height: "100%", borderRadius: 3, backgroundColor: colors.goldLight },
  progressText: {
    marginTop: 8,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 9,
  },
  rangeCard: {
    marginTop: 12,
    padding: 15,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(27,17,41,0.92)",
  },
  rangeHeader: { flexDirection: "row", justifyContent: "space-between" },
  rangeTitle: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 19,
  },
  rangeText: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8.5,
  },
  rangeControls: {
    height: 50,
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  rangeButton: {
    width: 35,
    height: 35,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  rangeValue: { width: 48, alignItems: "center" },
  rangeLabel: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7,
    fontWeight: "800",
  },
  rangeNumber: {
    marginTop: 1,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 22,
  },
  rangeTo: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  planButton: {
    height: 44,
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    backgroundColor: colors.goldLight,
  },
  planText: {
    marginLeft: 7,
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  sectionTitle: {
    marginTop: 21,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 22,
  },
  tabs: { marginTop: 10, flexDirection: "row", gap: 6 },
  tab: {
    height: 34,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "rgba(54,30,68,0.72)",
  },
  tabActive: { backgroundColor: colors.goldLight },
  tabText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "700",
  },
  tabTextActive: { color: colors.background },
  verseRow: {
    minHeight: 75,
    marginTop: 8,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: "rgba(30,18,42,0.86)",
  },
  statusDot: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "rgba(70,38,85,0.75)",
  },
  statusLearned: { backgroundColor: "#72C694" },
  statusReview: { backgroundColor: colors.goldLight },
  verseCopy: { flex: 1, marginHorizontal: 9 },
  verseLabel: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
  },
  verseArabic: {
    marginTop: 4,
    color: colors.text,
    fontFamily: ARABIC_READING_FONT_FAMILY,
    fontSize: 19,
    lineHeight: 27,
    textAlign: "right",
    writingDirection: "rtl",
  },
  loading: { height: 150, alignItems: "center", justifyContent: "center" },
  loadingText: {
    marginTop: 8,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9,
  },
});
