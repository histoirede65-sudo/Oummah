import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useLocalSearchParams, router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
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
import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Tab = "all" | "learned" | "review" | "new";

export default function HifzSurahDetail() {
  const { t } = useI18n();
  const { surahId: rawId } = useLocalSearchParams<{ surahId: string }>();
  const surahId = Math.max(1, Math.min(114, Number(rawId) || 1));
  const surah = SURAHS.find((item) => item.id === surahId) ?? SURAHS[0];
  const [state, setState] = useState<HifzState>();
  const [verses, setVerses] = useState<readonly QuranFoundationVerse[]>([]);
  const [tab, setTab] = useState<Tab>("all");
  const [startVerse, setStartVerse] = useState(1);
  const [endVerse, setEndVerse] = useState(surah.verses);
  const [versePickerVisible, setVersePickerVisible] = useState(false);
  const [versePickerTarget, setVersePickerTarget] = useState<"start" | "end">("start");
  const versePickerListRef = useRef<FlatList<QuranFoundationVerse>>(null);
  const rangeRestoredRef = useRef(false);

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
  useEffect(() => {
    if (!state || rangeRestoredRef.current) return;
    const savedRange = state.plannedRanges?.find((item) => item.surahId === surahId);
    if (
      savedRange &&
      savedRange.startVerse >= 1 &&
      savedRange.endVerse <= surah.verses &&
      savedRange.startVerse <= savedRange.endVerse
    ) {
      setStartVerse(savedRange.startVerse);
      setEndVerse(savedRange.endVerse);
    }
    rangeRestoredRef.current = true;
  }, [state, surah.verses, surahId]);
  const progress = state?.progress.find((item) => item.surahId === surahId);
  const learned = new Set(progress?.learnedVerses ?? []);
  const difficult = new Set(progress?.difficultVerses ?? []);
  const filtered = useMemo(
    () =>
      verses.filter((verse) => {
        const number = Number(verse.verseKey.split(":")[1]);
        if (number < startVerse || number > endVerse) return false;
        if (tab === "all") return true;
        if (tab === "learned") return learned.has(number);
        if (tab === "review") return difficult.has(number);
        return !learned.has(number);
      }),
    [difficult, endVerse, learned, startVerse, tab, verses],
  );
  const persistRange = (nextStart: number, nextEnd: number) => {
    setStartVerse(nextStart);
    setEndVerse(nextEnd);
    if (!state) return;
    const next = {
      ...state,
      plannedRanges: [
        ...(state.plannedRanges ?? []).filter((item) => item.surahId !== surahId),
        { surahId, startVerse: nextStart, endVerse: nextEnd },
      ],
    };
    setState(next);
    void saveHifzState(next);
  };
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
      `/hifz/session?surah=${surahId}&verse=${startVerse}&end=${endVerse}&repeat=3&reciter=&portion=portion`,
    );
  };
  const openVersePicker = (target: "start" | "end") => {
    setVersePickerTarget(target);
    setVersePickerVisible(true);
  };
  useEffect(() => {
    if (!versePickerVisible || verses.length === 0) return;
    const selectedVerse = versePickerTarget === "start" ? startVerse : endVerse;
    const index = verses.findIndex(
      (verse) => Number(verse.verseKey.split(":")[1]) === selectedVerse,
    );
    if (index >= 0) {
      requestAnimationFrame(() => versePickerListRef.current?.scrollToIndex({ index, animated: false }));
    }
  }, [endVerse, startVerse, versePickerTarget, versePickerVisible, verses]);
  const selectVerse = (value: number) => {
    const nextStart = versePickerTarget === "start" ? value : startVerse;
    const nextEnd = versePickerTarget === "end" ? value : endVerse;
    const coherentStart = versePickerTarget === "end" && nextEnd < nextStart ? nextEnd : nextStart;
    const coherentEnd = versePickerTarget === "start" && nextStart > nextEnd ? nextStart : nextEnd;
    persistRange(coherentStart, coherentEnd);
    setVersePickerVisible(false);
  };
  const status = (number: number) =>
    learned.has(number) ? "learned" : difficult.has(number) ? "review" : "new";
  const statusLabel = {
    learned: t("hifz.surah.statusLearned"),
    review: t("hifz.surah.statusReview"),
    new: t("hifz.surah.statusNew"),
  } as const;
  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.top}>
          <Pressable accessibilityLabel={t("common.back")} onPress={() => router.back()} style={styles.back}>
            <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
          </Pressable>
          <View style={styles.topCopy}>
            <Text style={styles.title}>{surah.transliteration}</Text>
            <Text style={styles.subtitle}>{t("hifz.surah.subtitle")}</Text>
          </View>
          <Text style={styles.arabicHeader}>{surah.arabicName}</Text>
        </View>
        <View style={styles.progressCard}>
          <Text style={styles.progressTitle}>
            {t("hifz.surah.learnedProgress", { learned: learned.size, total: surah.verses })}
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
            {t("hifz.surah.encouragement")}
          </Text>
        </View>
        <View style={styles.rangeCard}>
          <View style={styles.rangeHeader}>
            <View>
              <Text style={styles.rangeTitle}>{t("hifz.surah.nextPassage")}</Text>
              <Text style={styles.rangeText}>
                {t("hifz.surah.nextPassageText")}
              </Text>
            </View>
          </View>
          <View style={styles.rangeControls}>
            <Pressable
              accessibilityLabel={t("hifz.surah.removeVerse")}
              disabled={endVerse <= startVerse}
              onPress={() => persistRange(startVerse, Math.max(startVerse, endVerse - 1))}
              style={[styles.rangeButton, endVerse <= startVerse && styles.rangeButtonDisabled]}
            >
              <Ionicons name="remove" size={22} color={colors.goldLight} />
            </Pressable>
            <Pressable
              onPress={() => openVersePicker("start")}
              style={({ pressed }) => [styles.rangeValue, pressed && styles.rangeValuePressed]}
            >
              <Text style={styles.rangeLabel}>{t("hifz.surah.start")}</Text>
              <View style={styles.rangeNumberRow}>
                <Text style={styles.rangeNumber}>{startVerse}</Text>
                <Ionicons name="chevron-down" size={19} color={colors.goldLight} />
              </View>
            </Pressable>
            <Text style={styles.rangeTo}>→</Text>
            <Pressable
              onPress={() => openVersePicker("end")}
              style={({ pressed }) => [styles.rangeValue, pressed && styles.rangeValuePressed]}
            >
              <Text style={styles.rangeLabel}>{t("hifz.surah.end")}</Text>
              <View style={styles.rangeNumberRow}>
                <Text style={styles.rangeNumber}>{endVerse}</Text>
                <Ionicons name="chevron-down" size={19} color={colors.goldLight} />
              </View>
            </Pressable>
            <Pressable
              accessibilityLabel={t("hifz.surah.addVerse")}
              onPress={() =>
                persistRange(startVerse, Math.min(surah.verses, Math.max(endVerse + 1, startVerse)))
              }
              style={styles.rangeButton}
            >
              <Ionicons name="add" size={22} color={colors.goldLight} />
            </Pressable>
          </View>
          <Pressable onPress={planRange} style={styles.planButton}>
            <Ionicons name="play" size={16} color={colors.background} />
            <Text style={styles.planText}>
              {startVerse === endVerse
                ? t("hifz.surah.memorizeOne", { verse: startVerse })
                : t("hifz.surah.memorizeRange", { start: startVerse, end: endVerse })}
            </Text>
          </Pressable>
          <Text style={styles.rangeHint}>{t("hifz.surah.rangeHint")}</Text>
        </View>
        <Modal visible={versePickerVisible} transparent animationType="slide" onRequestClose={() => setVersePickerVisible(false)}>
          <View style={styles.versePickerBackdrop}>
            <View style={styles.versePickerCard}>
              <View style={styles.optionsHeader}>
                <Text style={styles.optionsTitle}>{versePickerTarget === "start" ? t("hifz.surah.pickStart") : t("hifz.surah.pickEnd")}</Text>
                <Pressable accessibilityLabel={t("hifz.session.close")} onPress={() => setVersePickerVisible(false)} hitSlop={8}>
                  <Ionicons name="close" size={21} color={colors.textMuted} />
                </Pressable>
              </View>
              <FlatList
                ref={versePickerListRef}
                data={verses}
                keyExtractor={(verse) => verse.verseKey}
                style={styles.versePickerList}
                contentContainerStyle={styles.versePickerContent}
                getItemLayout={(_, index) => ({ length: 63, offset: 63 * index, index })}
                onScrollToIndexFailed={({ index }) => {
                  setTimeout(() => versePickerListRef.current?.scrollToIndex({ index, animated: false }), 50);
                }}
                renderItem={({ item: verse }) => {
                  const value = Number(verse.verseKey.split(":")[1]);
                  const selected = value === (versePickerTarget === "start" ? startVerse : endVerse);
                  return (
                    <Pressable onPress={() => selectVerse(value)} style={[styles.versePickerItem, selected && styles.versePickerItemSelected]}>
                      <Text style={[styles.versePickerItemNumber, selected && styles.versePickerItemTextSelected]}>{value}</Text>
                      <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.versePickerItemText, selected && styles.versePickerItemTextSelected]}>{verse.textUthmani}</Text>
                    </Pressable>
                  );
                }}
              />
            </View>
          </View>
        </Modal>
        <Text style={styles.sectionTitle}>{t("hifz.surah.verses")}</Text>
        <View style={styles.tabs}>
          {(
            [
              ["all", t("hifz.surah.tabAll")],
              ["learned", t("hifz.surah.tabLearned")],
              ["review", t("hifz.surah.tabReview")],
              ["new", t("hifz.surah.tabNew")],
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
            <Text style={styles.loadingText}>{t("hifz.surah.loading")}</Text>
          </View>
        ) : (
          filtered.map((verse) => {
            const number = Number(verse.verseKey.split(":")[1]);
            const current = status(number);
            const selectedInRange = number >= startVerse && number <= endVerse;
            return (
              <Pressable
                key={verse.verseKey}
                onPress={() => {
                  router.push(`/hifz/session?surah=${surahId}&verse=${number}&end=${endVerse}`);
                }}
                style={[styles.verseRow, selectedInRange && styles.verseRowSelected]}
              >
                <View
                  style={[
                    styles.statusDot,
                    current === "learned" && styles.statusLearned,
                    current === "review" && styles.statusReview,
                  ]}
                >
                  <Ionicons
                    name={
                      current === "learned"
                        ? "checkmark"
                        : current === "review"
                          ? "refresh"
                          : "play"
                    }
                    size={12}
                    color={
                      current === "new"
                        ? colors.goldLight
                        : colors.background
                    }
                  />
                </View>
                <View style={styles.verseCopy}>
                  <Text style={styles.verseLabel}>
                    {t("hifz.surah.verseRow", { verse: number, status: statusLabel[current] })}
                  </Text>
                  <Text numberOfLines={2} style={styles.verseArabic}>
                    {verse.textUthmani}
                  </Text>
                  {selectedInRange && (
                    <Text style={styles.selectedRangeBadge}>{t("hifz.surah.selectedPassage")}</Text>
                  )}
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
    marginTop: 3,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10.5,
  },
  rangeControls: {
    height: 68,
    marginTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  rangeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.42)",
    backgroundColor: "rgba(227,181,90,0.06)",
  },
  rangeButtonDisabled: { opacity: 0.35 },
  rangeValuePressed: { opacity: 0.65 },
  rangeNumberRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  rangeHint: { marginTop: 10, color: colors.text, fontFamily: typography.sansBold, fontSize: 11, lineHeight: 16, textAlign: "center" },
  versePickerBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(7,5,11,0.72)" },
  versePickerCard: { maxHeight: "78%", padding: 22, paddingBottom: 28, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: colors.surface },
  versePickerList: { marginTop: 14 },
  versePickerContent: { paddingBottom: 8 },
  versePickerItem: { minHeight: 58, marginBottom: 5, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.background },
  versePickerItemSelected: { borderColor: colors.goldLight, backgroundColor: "rgba(227,181,90,0.12)" },
  versePickerItemNumber: { width: 30, color: colors.textMuted, fontFamily: typography.sansBold, fontSize: 12 },
  versePickerItemText: { flex: 1, color: colors.textMuted, fontFamily: ARABIC_READING_FONT_FAMILY, fontSize: 25, lineHeight: 38, textAlign: "right", writingDirection: "rtl" },
  versePickerItemTextSelected: { color: colors.goldLight, fontFamily: typography.sansBold },
  optionsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  optionsTitle: { color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 22 },
  rangeValue: {
    width: 78,
    minHeight: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.38)",
    backgroundColor: "rgba(227,181,90,0.07)",
  },
  rangeLabel: {
    color: colors.goldLight,
    fontFamily: typography.sansBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },
  rangeNumber: {
    marginTop: 1,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 31,
    lineHeight: 35,
  },
  rangeTo: {
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 25,
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
  verseRowSelected: { borderColor: colors.goldLight, borderWidth: 1 },
  selectedRangeBadge: { marginTop: 4, color: colors.goldLight, fontFamily: typography.sansBold, fontSize: 10 },
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
