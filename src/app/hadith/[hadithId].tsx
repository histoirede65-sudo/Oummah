import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hadithRepository } from "../../features/hadith-explorer/data/hadithRepository";
import type { Hadith } from "../../features/hadith-explorer/domain/Hadith";
import HadithGradeBadge from "../../features/hadith-explorer/presentation/HadithGradeBadge";
import { cleanHadithLabel, hadithDisplayTitle, isReferenceTitle, knownAttribution, knownReference } from "../../features/hadith-explorer/domain/hadithDisplay";
import HadithScreenHeader from "../../features/hadith-explorer/presentation/HadithScreenHeader";
import { WasilContextButton } from "../../components/wasil/WasilContextButton";
import { hadithLibraryService } from "../../features/hadith-explorer/services/hadithLibraryService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useI18n } from "../../i18n";
import { goalProgressBridge } from "../../features/daily-goals/services/goalProgressBridge";
import { loadReadConfirmations, onLocalMidnight, setReadConfirmation } from "../../features/reading-progress/ReadingValidationStore";

export default function HadithDetailScreen() {
  const { language, t } = useI18n();
  const { hadithId } = useLocalSearchParams<{ hadithId: string }>();
  const [hadith, setHadith] = useState<Hadith | null>(null);
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState(false);
  const [arabicVisible, setArabicVisible] = useState(false);
  const [readingConfirmed, setReadingConfirmed] = useState(false);
  const [savingReading, setSavingReading] = useState(false);
  useFocusEffect(useCallback(() => {
    if (!hadith) return;
    let active = true;
    void loadReadConfirmations('hadith').then(ids => {
      if (active) setReadingConfirmed(ids.has(String(hadith.id)));
    });
    return () => { active = false; };
  }, [hadith]));
  useEffect(() => onLocalMidnight(() => setReadingConfirmed(false)), []);

  useEffect(() => {
    let active = true;
    if (!hadithId) return;
    setError(false);
    setReadingConfirmed(false);
    void Promise.all([hadithRepository.get(hadithId, language), hadithLibraryService.isFavorite(hadithId)]).then(([value, saved]) => {
      if (!active) return;
      setHadith(value); setFavorite(saved); void hadithLibraryService.markRead(value);
      void loadReadConfirmations('hadith').then(ids => {
        if (active) setReadingConfirmed(ids.has(String(value.id)));
      });
    }).catch(() => active && setError(true));
    return () => { active = false; };
  }, [hadithId, language]);

  const toggleFavorite = async () => {
    if (!hadith) return;
    setFavorite(await hadithLibraryService.toggleFavorite(hadith));
  };
  const share = () => hadith && Share.share({ message: `${hadith.arabic ? `${hadith.arabic}\n\n` : ""}${hadith.french}\n\n${hadith.attribution}\n${hadith.grade}\n${hadith.reference}\n${t("hadith.source")}: HadeethEnc — ${hadith.sourceUrl}` });
  const confirmReading = async () => {
    if (!hadith || savingReading) return;
    const id = String(hadith.id);
    const selected = !readingConfirmed;
    setSavingReading(true);
    try {
      await setReadConfirmation('hadith', id, selected);
      await goalProgressBridge.setEvidence('hadith_read', id, selected);
      setReadingConfirmed(selected);
    } catch {
      await setReadConfirmation('hadith', id, !selected).catch(() => undefined);
      Alert.alert(t("hadith.saveFailedTitle"), t("hadith.saveFailedBody"));
    } finally { setSavingReading(false); }
  };

  return (
    <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.headerWrap}>
          <HadithScreenHeader title={t("hadith.detailTitle")} subtitle={hadith ? knownReference(hadith.reference) || t("hadith.verifiableSource") : t("hadith.verifiableSource")} right={hadith ? <View style={styles.headerActions}><Pressable accessibilityLabel={t("hadith.save")} onPress={toggleFavorite} style={styles.round}><Ionicons name={favorite ? "bookmark" : "bookmark-outline"} size={19} color={colors.goldLight} /></Pressable><Pressable accessibilityLabel={t("common.share")} onPress={share} style={styles.round}><Ionicons name="share-social-outline" size={19} color={colors.goldLight} /></Pressable></View> : null} />
        </View>
        {!hadith && !error ? <View style={styles.center}><ActivityIndicator color={colors.goldLight} /><Text style={styles.loading}>{t("hadith.loadingReference")}</Text></View> : error ? <View style={styles.center}><Ionicons name="cloud-offline-outline" size={34} color={colors.textMuted} /><Text style={styles.errorTitle}>{t("hadith.detailUnavailable")}</Text><Text style={styles.errorText}>{t("hadith.firstViewConnection")}</Text></View> : hadith ? (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.sourceLine}><HadithGradeBadge grade={hadith.grade} kind={hadith.gradeKind} /><Text numberOfLines={2} style={styles.attribution}>{knownAttribution(hadith.attribution)}</Text></View>
            {isReferenceTitle(hadith.title, hadith.reference) ? null : <Text style={styles.title}>{hadithDisplayTitle(hadith)}</Text>}

            <View style={styles.translationCard}><Text style={styles.label}>{t("hadith.translationLabel")}</Text><Text style={styles.french}>{hadith.french}</Text></View>
            <View style={styles.actionsRow}>
              <Pressable accessibilityRole="button" accessibilityState={{ checked: readingConfirmed }} accessibilityLabel={readingConfirmed ? t("hadith.unmarkRead") : t("hadith.markRead")} onPress={() => void confirmReading()} disabled={savingReading} style={({ pressed }) => [styles.readButton, readingConfirmed && styles.readButtonDone, pressed && styles.pressed]}>
                <Ionicons name={readingConfirmed ? "checkmark-circle" : "ellipse-outline"} size={18} color={readingConfirmed ? colors.success : colors.goldLight} />
                <Text style={[styles.readButtonText, readingConfirmed && styles.readButtonTextDone]}>{readingConfirmed ? t("hadith.readDone") : t("hadith.markRead")}</Text>
              </Pressable>
              <WasilContextButton largeLabel prompt={t("hadith.detailWasilPrompt", { id: hadith.id, reference: hadith.reference, text: hadith.french, arabic: hadith.arabic, attribution: hadith.attribution })} />
            </View>

            {hadith.arabic ? <>
              <Pressable onPress={() => setArabicVisible((value) => !value)} style={styles.arabicToggle}>
                <Text style={styles.arabicToggleText}>{arabicVisible ? t("hadith.hideArabic") : t("hadith.showArabic")}</Text>
                <Ionicons name={arabicVisible ? "chevron-up" : "chevron-down"} size={17} color={colors.goldLight} />
              </Pressable>
              {arabicVisible ? <View style={styles.arabicCard}><Text style={styles.arabic}>{hadith.arabic}</Text></View> : null}
            </> : null}

            <SectionTitle icon="bulb-outline" title={t("hadith.understandThisHadith")} />
            <View style={styles.bodyCard}><Text style={styles.explanation}>{hadith.explanation || t("hadith.noExplanation")}</Text></View>

            {hadith.lessons.length ? <><SectionTitle icon="leaf-outline" title={t("hadith.lessons")} /><View style={styles.bodyCard}>{hadith.lessons.map((lesson, index) => <View key={`${index}-${lesson.slice(0, 12)}`} style={styles.lesson}><View style={styles.lessonNumber}><Text style={styles.lessonNumberText}>{index + 1}</Text></View><Text style={styles.lessonText}>{lesson}</Text></View>)}</View></> : null}

            <SectionTitle icon="finger-print-outline" title={t("hadith.referenceAndAuthenticity")} />
            <View style={styles.referenceCard}>
              <ReferenceRow label={t("hadith.authenticity")} value={cleanHadithLabel(hadith.grade)} />
              {knownAttribution(hadith.attribution) ? <ReferenceRow label={t("hadith.attribution")} value={knownAttribution(hadith.attribution)} /> : null}
              {knownReference(hadith.reference) ? <ReferenceRow label={t("hadith.reference")} value={knownReference(hadith.reference)} /> : null}
              <ReferenceRow label={t("hadith.dataSource")} value="HadeethEnc" last />
              <Pressable onPress={() => Linking.openURL(hadith.sourceUrl)} style={styles.sourceButton}><Ionicons name="open-outline" size={16} color={colors.goldLight} /><Text style={styles.sourceButtonText}>{t("hadith.verifyOriginalSource")}</Text></Pressable>
            </View>

            <View style={styles.disclaimer}><Ionicons name="information-circle-outline" size={19} color="#BBA6C8" /><Text style={styles.disclaimerText}>{t("hadith.classificationDisclaimer")}</Text></View>
          </ScrollView>
        ) : null}
      </SafeAreaView>
    </LinearGradient>
  );
}

function SectionTitle({ icon, title }: { icon: string; title: string }) { return <View style={styles.sectionTitle}><Ionicons name={icon as never} size={18} color={colors.goldLight} /><Text style={styles.sectionTitleText}>{title}</Text></View>; }
function ReferenceRow({ label, value, last }: { label: string; value: string; last?: boolean }) { return <View style={[styles.referenceRow, last && { borderBottomWidth: 0 }]}><Text style={styles.referenceLabel}>{label}</Text><Text selectable style={styles.referenceValue}>{value}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1 }, safe: { flex: 1 }, headerWrap: { paddingHorizontal: 18 }, headerActions: { flexDirection: "row", gap: 7 }, round: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(35,23,49,0.92)", borderWidth: 1, borderColor: "rgba(227,181,90,0.18)" },
  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 110 }, center: { flex: 1, paddingHorizontal: 40, alignItems: "center", justifyContent: "center", gap: 12 }, loading: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12 }, errorTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 22 }, errorText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, lineHeight: 18, textAlign: "center" },
  sourceLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, attribution: { flex: 1, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, textAlign: "right" }, title: { color: colors.text, fontFamily: typography.sans, fontSize: 25, lineHeight: 30, marginTop: 17, marginBottom: 17 },
  arabicCard: { padding: 22, borderRadius: 25, backgroundColor: "rgba(46,29,58,0.82)", borderWidth: 1, borderColor: "rgba(227,181,90,0.24)" }, arabicToggle: { minHeight: 42, marginTop: 11, paddingHorizontal: 15, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(227,181,90,0.08)", borderWidth: 1, borderColor: "rgba(227,181,90,0.18)" }, arabicToggleText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "700" }, arabic: { color: "#FFF8EC", textAlign: "right", writingDirection: "rtl", fontFamily: "UthmanicHafs", fontSize: 25, lineHeight: 46 },
  translationCard: { marginTop: 11, padding: 21, borderRadius: 25, backgroundColor: "rgba(25,18,37,0.9)", borderWidth: 1, borderColor: "rgba(124,82,146,0.22)" }, label: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 9, fontWeight: "800", letterSpacing: 1.4, marginBottom: 12 }, french: { color: colors.text, fontFamily: typography.sans, fontSize: 19, lineHeight: 28 },
  actionsRow: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 8 },
  readButton: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 14, borderWidth: 1, borderColor: "rgba(227,181,90,0.35)", paddingHorizontal: 13, backgroundColor: "rgba(227,181,90,0.06)" },
  readButtonDone: { borderColor: "rgba(98,197,139,0.55)", backgroundColor: "rgba(98,197,139,0.1)" },
  readButtonText: { color: colors.text, fontFamily: typography.sans, fontSize: 13, fontWeight: "700" },
  readButtonTextDone: { color: colors.success },
  pressed: { opacity: 0.72 },
  sectionTitle: { marginTop: 28, marginBottom: 11, flexDirection: "row", alignItems: "center", gap: 8 }, sectionTitleText: { color: colors.text, fontFamily: typography.sans, fontSize: 20 }, bodyCard: { padding: 19, borderRadius: 22, backgroundColor: "rgba(28,19,41,0.76)" }, explanation: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 16, lineHeight: 25 },
  lesson: { flexDirection: "row", alignItems: "flex-start", gap: 11, marginBottom: 13 }, lessonNumber: { width: 23, height: 23, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.11)" }, lessonNumberText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "700" }, lessonText: { flex: 1, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 16, lineHeight: 25 },
  referenceCard: { padding: 17, borderRadius: 23, backgroundColor: "rgba(25,18,37,0.9)", borderWidth: 1, borderColor: "rgba(98,197,139,0.16)" }, referenceRow: { paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.08)", gap: 5 }, referenceLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5, textTransform: "uppercase", letterSpacing: 0.7 }, referenceValue: { color: colors.text, fontFamily: typography.sans, fontSize: 12, lineHeight: 17 }, sourceButton: { marginTop: 14, height: 44, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "rgba(227,181,90,0.09)" }, sourceButtonText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "700" }, disclaimer: { marginTop: 17, flexDirection: "row", gap: 10, padding: 15, borderRadius: 19, backgroundColor: "rgba(139,103,158,0.1)" }, disclaimerText: { flex: 1, color: "#A99DAF", fontFamily: typography.sans, fontSize: 10.5, lineHeight: 16 },
});
