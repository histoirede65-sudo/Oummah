import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Keyboard, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Pressable } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { BAD_DREAM_STEPS, DREAM_CONTEXT, DREAM_SOURCES, DREAM_TYPES } from "../features/dreams";
import { analyzeDreamContext } from "../features/dreamGuidance";
import { getDreamSource, type DreamEvidenceLevel } from "../features/dreamEvidence";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

export default function DreamsScreen() {
  const [showGuide, setShowGuide] = useState(false);
  const [dreamText, setDreamText] = useState("");
  const [emotion, setEmotion] = useState<"peace" | "neutral" | "fear" | null>(null);
  const [recentEcho, setRecentEcho] = useState<boolean | null>(null);
  const [recurring, setRecurring] = useState<boolean | null>(null);
  const [decisionLinked, setDecisionLinked] = useState<boolean | null>(null);
  const [contextNote, setContextNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const dreamInputRef = useRef<TextInput>(null);
  const contextInputRef = useRef<TextInput>(null);
  const activeField = useRef<"dream" | "context" | null>(null);

  const revealFocusedField = useCallback((field: "dream" | "context") => {
    const input = field === "dream" ? dreamInputRef.current : contextInputRef.current;
    if (!input) return;

    // Let the native keyboard/inset animation settle, then ask the ScrollView
    // to reveal the actual focused input instead of relying on fixed Y offsets.
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollRef.current?.scrollResponderScrollNativeHandleToKeyboard(
          input,
          28,
          true,
        );
      }, Platform.OS === "ios" ? 90 : 180);
    });
  }, []);

  useEffect(() => {
    const eventName = Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow";
    const subscription = Keyboard.addListener(eventName, () => {
      if (activeField.current) revealFocusedField(activeField.current);
    });
    return () => subscription.remove();
  }, [revealFocusedField]);

  const canReview = dreamText.trim().length >= 20 && emotion !== null && recentEcho !== null && recurring !== null && decisionLinked !== null;
  const review = useMemo(() => {
    if (!submitted || emotion === null || recentEcho === null || recurring === null || decisionLinked === null) return null;
    return analyzeDreamContext({ dreamText, emotion, recentEcho, recurring, decisionLinked, contextNote });
  }, [submitted, dreamText, emotion, recentEcho, recurring, decisionLinked, contextNote]);

  return (
    <LinearGradient colors={[colors.background, colors.backgroundSecondary, colors.background]} style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Les rêves en Islam</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          <LinearGradient colors={["rgba(75,38,99,0.80)", "rgba(20,12,31,0.96)"]} style={styles.hero}>
            <View style={styles.heroMoon}><Ionicons name="moon" size={34} color={colors.goldLight} /></View>
            <Text style={styles.heroArabic}>الرؤيا في الإسلام</Text>
            <Text style={styles.heroTitle}>Comprendre sans prétendre savoir</Text>
            <Text style={styles.heroText}>
              Un rêve n’est jamais une certitude. Son éventuel sens ne se réduit pas à un dictionnaire de symboles : la personne, sa situation et son état comptent. On ne fonde pas une décision religieuse ou importante sur un rêve seul.
            </Text>
          </LinearGradient>

          <View style={styles.notice}>
            <Ionicons name="shield-checkmark-outline" size={22} color={colors.goldLight} />
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>Principe OUMMAH</Text>
              <Text style={styles.noticeText}>Ici, pas de prédiction, pas de “ce symbole veut forcément dire…”, et pas d’interprétation présentée comme certaine.</Text>
            </View>
          </View>

          <Pressable onPress={() => { setShowGuide((value) => !value); setSubmitted(false); }} style={({ pressed }) => [styles.analyzeButton, pressed && styles.pressed]}>
            <LinearGradient colors={[colors.goldLight, colors.gold]} style={styles.analyzeButtonGradient}>
              <View style={styles.analyzeIcon}><Ionicons name="sparkles" size={20} color={colors.background} /></View>
              <View style={styles.analyzeCopy}>
                <Text style={styles.analyzeTitle}>Raconter mon rêve</Text>
                <Text style={styles.analyzeSubtitle}>Lecture guidée · prudente · contextualisée</Text>
              </View>
              <Ionicons name={showGuide ? "chevron-up" : "chevron-forward"} size={20} color={colors.background} />
            </LinearGradient>
          </Pressable>

          {showGuide && (
            <View style={styles.guideCard}>
              <Text style={styles.guideEyebrow}>LECTURE ENCADRÉE</Text>
              <Text style={styles.guideTitle}>Votre contexte avant toute conclusion</Text>
              <Text style={styles.guideIntro}>Décrivez seulement ce dont vous vous souvenez. N’ajoutez pas de détails pour “faire correspondre” le rêve à une signification.</Text>

              <Text style={styles.fieldLabel}>Que s’est-il passé dans le rêve ?</Text>
              <View>
                <TextInput
                  ref={dreamInputRef}
                  value={dreamText}
                  onChangeText={(value) => { setDreamText(value); setSubmitted(false); }}
                  onFocus={() => { activeField.current = "dream"; revealFocusedField("dream"); }}
                  onBlur={() => { if (activeField.current === "dream") activeField.current = null; }}
                  multiline
                  maxLength={1800}
                  placeholder="Racontez les faits, les personnes, les lieux et ce que vous avez ressenti…"
                  placeholderTextColor={colors.textMuted}
                  style={styles.dreamInput}
                  textAlignVertical="top"
                />
              </View>
              <Text style={styles.counter}>{dreamText.length}/1800</Text>

              <ChoiceQuestion title="Comment vous êtes-vous réveillé ?" options={[{label:"Apaisé",value:"peace"},{label:"Neutre",value:"neutral"},{label:"Troublé / effrayé",value:"fear"}]} value={emotion} onChange={(value) => { setEmotion(value as typeof emotion); setSubmitted(false); }} />
              <BinaryQuestion title="Le rêve reprend-il clairement une préoccupation, une discussion ou un événement récent ?" value={recentEcho} onChange={(value) => { setRecentEcho(value); setSubmitted(false); }} />
              <BinaryQuestion title="Ce rêve ou ce thème revient-il régulièrement ?" value={recurring} onChange={(value) => { setRecurring(value); setSubmitted(false); }} />
              <BinaryQuestion title="Ce rêve influence-t-il une décision importante que vous envisagez de prendre ?" value={decisionLinked} onChange={(value) => { setDecisionLinked(value); setSubmitted(false); }} />

              <Text style={styles.fieldLabel}>Votre situation actuelle (facultatif)</Text>
              <View>
                <TextInput
                  ref={contextInputRef}
                  value={contextNote}
                  onChangeText={(value) => { setContextNote(value); setSubmitted(false); }}
                  onFocus={() => { activeField.current = "context"; revealFocusedField("context"); }}
                  onBlur={() => { if (activeField.current === "context") activeField.current = null; }}
                  multiline
                  maxLength={500}
                  placeholder="Ex. période de changement, préoccupation familiale, travail, voyage… N’indiquez que ce qui vous semble utile."
                  placeholderTextColor={colors.textMuted}
                  style={styles.contextInput}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.privacyNote}>
                <Ionicons name="lock-closed-outline" size={16} color={colors.goldLight} />
                <Text style={styles.privacyText}>Cette première lecture fonctionne localement : le texte saisi n’est envoyé à aucun service d’analyse.</Text>
              </View>

              <Pressable disabled={!canReview} onPress={() => setSubmitted(true)} style={({ pressed }) => [styles.reviewButton, !canReview && styles.reviewButtonDisabled, pressed && canReview && styles.pressed]}>
                <Text style={styles.reviewButtonText}>Obtenir une lecture prudente</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.background} />
              </Pressable>

              {review && (
                <View style={styles.resultCard}>
                  <View style={styles.resultBadge}><Ionicons name="shield-checkmark" size={15} color={colors.goldLight} /><Text style={styles.resultBadgeText}>{review.badge}</Text></View>
                  <Text style={styles.resultTitle}>{review.headline}</Text>
                  {review.sections.map((section, index) => (
                    <View key={`${section.title}-${index}`} style={[styles.resultSection, index > 0 && styles.resultSectionDivider]}>
                      <Text style={styles.resultSectionTitle}>{section.title}</Text>
                      <Text style={styles.resultText}>{section.text}</Text>
                      <EvidenceBadge level={section.level} />
                      {!!section.sourceIds?.length && (
                        <View style={styles.resultSource}><Ionicons name="book-outline" size={14} color={colors.goldLight} /><Text style={styles.resultSourceText}>{section.sourceIds.map((id) => getDreamSource(id)?.ref).filter(Boolean).join(" • ")}</Text></View>
                      )}
                    </View>
                  ))}
                  <Text style={styles.resultLimit}>{review.bottomLine}</Text>
                </View>
              )}
            </View>
          )}

          <SectionHeader eyebrow="D’APRÈS LA SUNNA" title="Trois catégories" />
          {DREAM_TYPES.map((item) => (
            <View key={item.title} style={styles.typeCard}>
              <View style={styles.typeIcon}><Ionicons name={item.icon} size={20} color={colors.goldLight} /></View>
              <View style={styles.typeCopy}>
                <Text style={styles.typeArabic}>{item.arabic}</Text>
                <Text style={styles.typeTitle}>{item.title}</Text>
                <Text style={styles.body}>{item.text}</Text>
                <Text style={styles.source}>{item.source}</Text>
              </View>
            </View>
          ))}

          <SectionHeader eyebrow="SI LE RÊVE VOUS TROUBLE" title="Ce que la Sunna recommande" />
          <View style={styles.stepsCard}>
            {BAD_DREAM_STEPS.map((step, index) => (
              <View key={step} style={[styles.step, index > 0 && styles.divider]}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
            <Text style={styles.source}>Sahih al-Bukhari 7044 • Sahih Muslim 2263a</Text>
          </View>

          <SectionHeader eyebrow="AVANT DE CHERCHER UN SENS" title="Le contexte compte" />
          <View style={styles.contextCard}>
            <Text style={styles.contextLead}>Deux personnes peuvent rêver d’une scène semblable sans que cela implique nécessairement le même sens.</Text>
            {DREAM_CONTEXT.map((item) => (
              <View key={item} style={styles.contextRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.goldLight} />
                <Text style={styles.contextText}>{item}</Text>
              </View>
            ))}
            <View style={styles.warningBox}>
              <Ionicons name="alert-circle-outline" size={19} color={colors.goldLight} />
              <Text style={styles.warningText}>Un rêve ne rend pas licite ce qui est interdit, n’interdit pas ce qui est licite et ne remplace ni le Coran ni la Sunna.</Text>
            </View>
          </View>

          <SectionHeader eyebrow="REPÈRES AUTHENTIQUES" title="Sources utilisées" />
          <View style={styles.sourcesCard}>
            {DREAM_SOURCES.map((source, index) => (
              <View key={source.ref} style={[styles.sourceRow, index > 0 && styles.divider]}>
                <View style={styles.sourceBadge}><Text style={styles.sourceBadgeText}>{source.ref}</Text></View>
                <Text style={styles.sourceLabel}>{source.label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.finalCard}>
            <Ionicons name="book-outline" size={22} color={colors.goldLight} />
            <Text style={styles.finalTitle}>Une approche volontairement prudente</Text>
            <Text style={styles.finalText}>Ce module transmet des repères authentiques et une méthode de prudence. Il ne remplace pas l’avis d’une personne qualifiée lorsqu’une situation nécessite un accompagnement religieux sérieux.</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function EvidenceBadge({ level }: { level: DreamEvidenceLevel }) {
  const labels: Record<DreamEvidenceLevel, string> = {
    AUTHENTIC_SOURCE: "SOURCE AUTHENTIQUE",
    CLASSICAL_INTERPRETATION: "INTERPRÉTATION CLASSIQUE",
    CONTEXT_DEPENDENT: "DÉPEND DU CONTEXTE",
    INSUFFICIENT_BASIS: "BASE INSUFFISANTE",
  };
  return <View style={styles.evidenceBadge}><Text style={styles.evidenceBadgeText}>{labels[level]}</Text></View>;
}

function ChoiceQuestion({ title, options, value, onChange }: { title: string; options: { label: string; value: string }[]; value: string | null; onChange: (value: string) => void }) {
  return <View style={styles.question}><Text style={styles.fieldLabel}>{title}</Text><View style={styles.choiceWrap}>{options.map((option) => <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.choice, value === option.value && styles.choiceSelected]}><Text style={[styles.choiceText, value === option.value && styles.choiceTextSelected]}>{option.label}</Text></Pressable>)}</View></View>;
}

function BinaryQuestion({ title, value, onChange }: { title: string; value: boolean | null; onChange: (value: boolean) => void }) {
  return <View style={styles.question}><Text style={styles.fieldLabel}>{title}</Text><View style={styles.binaryRow}><Pressable onPress={() => onChange(true)} style={[styles.binaryChoice, value === true && styles.choiceSelected]}><Text style={[styles.choiceText, value === true && styles.choiceTextSelected]}>Oui</Text></Pressable><Pressable onPress={() => onChange(false)} style={[styles.binaryChoice, value === false && styles.choiceSelected]}><Text style={[styles.choiceText, value === false && styles.choiceTextSelected]}>Non</Text></Pressable></View></View>;
}

function SectionHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, safeArea: { flex: 1 },
  header: { minHeight: 74, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  backButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.045)" },
  headerCopy: { flex: 1, alignItems: "center" }, headerSpacer: { width: 42 },
  eyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "700", letterSpacing: 1.25 },
  headerTitle: { marginTop: 3, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 },
  content: { padding: 16, paddingBottom: 140 },
  hero: { overflow: "hidden", alignItems: "center", padding: 23, borderRadius: 30, borderWidth: 1.2, borderColor: "rgba(227,181,90,0.42)" },
  heroMoon: { width: 64, height: 64, alignItems: "center", justifyContent: "center", borderRadius: 32, backgroundColor: "rgba(227,181,90,0.10)", borderWidth: 1, borderColor: "rgba(227,181,90,0.22)" },
  heroArabic: { marginTop: 14, color: colors.goldLight, fontFamily: typography.arabic, fontSize: 25, lineHeight: 39 },
  heroTitle: { marginTop: 4, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 25, lineHeight: 29, textAlign: "center" },
  heroText: { marginTop: 11, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, lineHeight: 21, textAlign: "center" },
  notice: { marginTop: 14, padding: 16, flexDirection: "row", alignItems: "flex-start", borderRadius: 22, borderWidth: 1, borderColor: "rgba(227,181,90,0.25)", backgroundColor: "rgba(227,181,90,0.055)" },
  noticeCopy: { flex: 1, marginLeft: 11 }, noticeTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 14, fontWeight: "700" },
  noticeText: { marginTop: 4, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, lineHeight: 19 },
  sectionHeader: { marginTop: 27, marginBottom: 11 }, sectionEyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "700", letterSpacing: 1.15 },
  sectionTitle: { marginTop: 3, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 24 },
  typeCard: { marginBottom: 10, padding: 16, flexDirection: "row", borderRadius: 23, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(23,16,38,0.84)" },
  typeIcon: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: "rgba(227,181,90,0.09)" },
  typeCopy: { flex: 1, marginLeft: 13 }, typeArabic: { color: colors.goldLight, fontFamily: typography.arabic, fontSize: 17, lineHeight: 25 },
  typeTitle: { marginTop: 1, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 20 }, body: { marginTop: 5, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13.5, lineHeight: 20 },
  source: { marginTop: 9, color: colors.goldMuted, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "700" },
  stepsCard: { paddingHorizontal: 16, borderRadius: 23, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(15,12,28,0.88)", paddingBottom: 15 },
  step: { flexDirection: "row", alignItems: "center", paddingVertical: 14 }, divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft },
  stepNumber: { width: 29, height: 29, alignItems: "center", justifyContent: "center", borderRadius: 10, backgroundColor: "rgba(227,181,90,0.12)" },
  stepNumberText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: "800" }, stepText: { flex: 1, marginLeft: 12, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13.5, lineHeight: 20 },
  contextCard: { padding: 17, borderRadius: 23, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(23,16,38,0.80)" },
  contextLead: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 18, lineHeight: 23 }, contextRow: { marginTop: 12, flexDirection: "row", alignItems: "flex-start" },
  contextText: { flex: 1, marginLeft: 9, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13.5, lineHeight: 19 },
  warningBox: { marginTop: 16, padding: 13, flexDirection: "row", alignItems: "flex-start", borderRadius: 17, backgroundColor: "rgba(227,181,90,0.07)" },
  warningText: { flex: 1, marginLeft: 9, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 18 },
  sourcesCard: { paddingHorizontal: 15, borderRadius: 23, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(15,12,28,0.88)" },
  sourceRow: { paddingVertical: 14 }, sourceBadge: { alignSelf: "flex-start", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, backgroundColor: "rgba(227,181,90,0.11)" },
  sourceBadgeText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "700" }, sourceLabel: { marginTop: 6, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 18 },
  finalCard: { marginTop: 20, alignItems: "center", padding: 19, borderRadius: 23, borderWidth: 1, borderColor: "rgba(227,181,90,0.23)", backgroundColor: "rgba(227,181,90,0.05)" },
  finalTitle: { marginTop: 8, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 20, textAlign: "center" }, finalText: { marginTop: 7, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12.5, lineHeight: 19, textAlign: "center" },
  analyzeButton: { marginTop: 14, borderRadius: 22, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  analyzeButtonGradient: { minHeight: 72, paddingHorizontal: 16, flexDirection: "row", alignItems: "center" },
  analyzeIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(8,7,19,0.12)" },
  analyzeCopy: { flex: 1, marginLeft: 12 }, analyzeTitle: { color: colors.background, fontFamily: typography.serifSemibold, fontSize: 21 }, analyzeSubtitle: { marginTop: 1, color: "rgba(8,7,19,0.72)", fontFamily: typography.sans, fontSize: 11.5, fontWeight: "600" },
  guideCard: { marginTop: 12, padding: 17, borderRadius: 25, borderWidth: 1, borderColor: "rgba(227,181,90,0.28)", backgroundColor: "rgba(20,12,31,0.96)" },
  guideEyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 }, guideTitle: { marginTop: 4, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 24, lineHeight: 28 }, guideIntro: { marginTop: 7, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13.5, lineHeight: 20 },
  fieldLabel: { marginTop: 18, marginBottom: 8, color: colors.text, fontFamily: typography.sans, fontSize: 13.5, lineHeight: 19, fontWeight: "700" },
  contextInput: { minHeight: 92, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.035)", color: colors.text, fontFamily: typography.sans, fontSize: 14, lineHeight: 21 },
  dreamInput: { minHeight: 145, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.035)", color: colors.text, fontFamily: typography.sans, fontSize: 15, lineHeight: 22 }, counter: { marginTop: 5, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, textAlign: "right" },
  question: { marginTop: 2 }, choiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 }, choice: { paddingHorizontal: 12, minHeight: 39, justifyContent: "center", borderRadius: 13, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.025)" }, binaryRow: { flexDirection: "row", gap: 8 }, binaryChoice: { flex: 1, minHeight: 41, alignItems: "center", justifyContent: "center", borderRadius: 13, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.025)" }, choiceSelected: { borderColor: colors.goldLight, backgroundColor: "rgba(227,181,90,0.13)" }, choiceText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12.5, fontWeight: "600" }, choiceTextSelected: { color: colors.goldLight },
  privacyNote: { marginTop: 18, padding: 11, flexDirection: "row", alignItems: "flex-start", borderRadius: 14, backgroundColor: "rgba(227,181,90,0.055)" }, privacyText: { flex: 1, marginLeft: 8, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, lineHeight: 16 },
  reviewButton: { marginTop: 13, minHeight: 50, paddingHorizontal: 16, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.goldLight }, reviewButtonDisabled: { opacity: 0.35 }, reviewButtonText: { color: colors.background, fontFamily: typography.sans, fontSize: 13.5, fontWeight: "800" }, pressed: { opacity: 0.8, transform: [{ scale: 0.992 }] },
  resultCard: { marginTop: 16, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: "rgba(98,197,139,0.32)", backgroundColor: "rgba(98,197,139,0.055)" }, resultBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10, backgroundColor: "rgba(227,181,90,0.09)" }, resultBadgeText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10, fontWeight: "800" }, resultSection: { paddingVertical: 12 }, resultSectionDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft }, resultSectionTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 13.5, fontWeight: "800" },
  evidenceBadge: { alignSelf: "flex-start", marginTop: 9, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "rgba(227,181,90,0.22)", backgroundColor: "rgba(227,181,90,0.055)" }, evidenceBadgeText: { color: colors.goldMuted, fontFamily: typography.sans, fontSize: 9.5, fontWeight: "800", letterSpacing: 0.45 },
  resultTitle: { marginTop: 11, color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22, lineHeight: 26 }, resultText: { marginTop: 7, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13.5, lineHeight: 20 }, resultContext: { marginTop: 9, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 12, lineHeight: 18, fontStyle: "italic" }, resultSource: { marginTop: 12, flexDirection: "row", alignItems: "center", gap: 6 }, resultSourceText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "700" }, resultLimit: { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSoft, color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, lineHeight: 17 },
});
