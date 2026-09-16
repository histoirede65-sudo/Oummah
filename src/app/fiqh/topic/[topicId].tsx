import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { FiqhDifferenceCard } from "../../../features/fiqh/components/FiqhDifferenceCard";
import { FiqhPersonalCaseNotice } from "../../../features/fiqh/components/FiqhPersonalCaseNotice";
import { FiqhSection } from "../../../features/fiqh/components/FiqhSection";
import { FiqhSourceCard } from "../../../features/fiqh/components/FiqhSourceCard";
import { FiqhWasilCTA } from "../../../features/fiqh/components/FiqhWasilCTA";
import { categoryById, chapterById, topicById } from "../../../features/fiqh/fiqhData";
import { saveFiqhProgress } from "../../../features/fiqh/fiqhStorage";
import { colors } from "../../../theme/colors";

export default function FiqhTopic() {
  const { topicId, chapter: chapterParam } = useLocalSearchParams<{ topicId: string; chapter?: string }>();
  const topic = topicById.get(topicId);
  const [openQuestion, setOpenQuestion] = useState<string | null>(null);

  useEffect(() => {
    if (topic) void saveFiqhProgress({ lastTopicId: topic.id, lastCategoryId: topic.categoryId });
  }, [topic]);

  if (!topic) return <SafeAreaView style={s.screen}><Text style={s.text}>Sujet introuvable.</Text></SafeAreaView>;
  if (topic.publicationStatus === "coming_soon" || topic.publicationStatus === "blocked") {
    return <SafeAreaView style={s.screen}><View style={s.content}><Pressable onPress={() => router.back()}><Text style={s.back}>‹ Retour</Text></Pressable><Text style={s.title}>{topic.title}</Text><Text style={s.lead}>Bientôt disponible.</Text></View></SafeAreaView>;
  }

  const content = topic.content;
  const category = categoryById.get(topic.categoryId);
  const chapter = (chapterParam ? chapterById.get(chapterParam) : undefined) ?? Array.from(chapterById.values()).find((item) => item.topicIds.includes(topic.id));
  const index = chapter?.topicIds.indexOf(topic.id) ?? -1;
  const previousId = index > 0 ? chapter?.topicIds[index - 1] : undefined;
  const nextId = chapter && index >= 0 && index < chapter.topicIds.length - 1 ? chapter.topicIds[index + 1] : undefined;
  const previous = previousId ? topicById.get(previousId) : undefined;
  const next = nextId ? topicById.get(nextId) : undefined;

  const established = content?.ceQuiEstEtabli?.map((claim) => claim.text) ?? topic.established;
  const practice = content?.pratique?.map((claim) => claim.text) ?? topic.howTo;
  const teachings = content?.enseignements?.map((claim) => claim.text) ?? topic.takeaway;
  const knowledge = [...(content?.limites ?? []), ...(content?.divergences?.map((claim) => claim.text) ?? []), ...(content?.casPersonnel ? [content.casPersonnel] : [])];
  const lead = content?.introduction?.trim() || null;
  const lessonNumber = chapter && index >= 0 ? `${String(index + 1).padStart(2, "0")} / ${String(chapter.topicIds.length).padStart(2, "0")}` : null;

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.content}>
        <Pressable onPress={() => router.back()}><Text style={s.back}>‹ Retour</Text></Pressable>

        {chapter ? (
          <View style={s.metaRow}>
            <Text style={s.chapterLabel} numberOfLines={1}>{chapter.title}</Text>
            {lessonNumber ? <View style={s.progressWrap}><Text style={s.lessonNumber}>Leçon {lessonNumber.replace(" / ", " sur ")}</Text><View style={s.progressTrack}><View style={[s.progressFill, { width: `${((index + 1) / (chapter?.topicIds.length || 1)) * 100}%` }]} /></View></View> : null}
          </View>
        ) : null}

        <Text style={s.title}>{topic.title}</Text>
        {topic.arabicTerm ? <Text style={s.arabic}>{topic.arabicTerm}</Text> : null}
        {lead ? <Text style={s.lead}>{lead}</Text> : null}

        <FiqhSection title="L’ESSENTIEL" items={established} variant="card" />
        <FiqhSection title="COMPRENDRE" items={(content?.definition ?? []).map((claim) => claim.text)} />
        <FiqhSection title="EN PRATIQUE" items={practice} />
        <FiqhSection title="À RETENIR" items={teachings} variant={teachings.length ? "soft" : "plain"} />
        <FiqhSection title="CONDITIONS" items={topic.conditions} />
        <FiqhSection title="CE QUI INVALIDE" items={topic.invalidators} />
        <FiqhSection title="ERREURS À ÉVITER" items={topic.commonMistakes} />
        <FiqhSection title="CAS PARTICULIERS" items={topic.specialCases} />

        {topic.differences.map((difference) => <FiqhDifferenceCard key={difference.question} difference={difference} />)}

        <FiqhSection title="À SAVOIR" items={knowledge} variant={knowledge.length ? "soft" : "plain"} />

        {content?.questions?.length ? (
          <View style={s.faq}>
            <Text style={s.faqTitle}>QUESTIONS FRÉQUENTES</Text>
            {content.questions.map((question) => (
              <View key={question.id} style={s.faqItem}>
                <Pressable
                  onPress={() => setOpenQuestion(openQuestion === question.id ? null : question.id)}
                  style={s.questionButton}
                >
                  <Text style={s.question} numberOfLines={2}>{question.question}</Text>
                  <Text style={s.toggle}>{openQuestion === question.id ? "−" : "+"}</Text>
                </Pressable>
                {openQuestion === question.id ? (
                  <View style={s.answerWrap}>
                    {question.answer.map((claim, claimIndex) => (
                      <Text key={`${question.id}-${claimIndex}`} style={s.answer}>{claim.text}</Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {topic.sensitive ? <FiqhPersonalCaseNotice /> : null}
        <FiqhSourceCard ids={topic.sourceIds} />
        <FiqhWasilCTA enabled prompt={`Contexte : Fiqh → ${category?.title ?? "Fiqh"} → ${chapter?.title ?? "Leçon"} → ${topic.title}.\n\nJe souhaite approfondir cette leçon et poser ma question :`} />

        {chapter ? (
          <View style={s.navigation}>
            {previousId ? (
              <Pressable onPress={() => router.replace({ pathname: "/fiqh/topic/[topicId]", params: { topicId: previousId, chapter: chapter.id } })} style={s.navButton}>
                <Text style={s.navKicker}>PRÉCÉDENT</Text>
                <Text style={s.nav} numberOfLines={2}>‹ {previous?.title}</Text>
              </Pressable>
            ) : <View style={s.navButton} />}
            {nextId ? (
              <Pressable onPress={() => router.replace({ pathname: "/fiqh/topic/[topicId]", params: { topicId: nextId, chapter: chapter.id } })} style={[s.navButton, s.navRight]}>
                <Text style={s.navKicker}>SUIVANT</Text>
                <Text style={[s.nav, s.navTextRight]} numberOfLines={2}>{next?.title} ›</Text>
              </Pressable>
            ) : (
              <Pressable onPress={() => router.push({ pathname: "/fiqh/chapter/[chapterId]", params: { chapterId: chapter.id } })} style={[s.navButton, s.navRight]}>
                <Text style={s.navKicker}>RETOUR</Text>
                <Text style={[s.nav, s.navTextRight]}>Chapitre ›</Text>
              </Pressable>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 72 },
  back: { color: colors.goldLight, fontSize: 18, marginBottom: 22 },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  progressWrap: { alignItems: "flex-end", gap: 6 },
  progressTrack: { width: 92, height: 3, borderRadius: 2, backgroundColor: colors.surfaceLight, overflow: "hidden" },
  progressFill: { height: 3, borderRadius: 2, backgroundColor: colors.goldLight },
  chapterLabel: { color: colors.textMuted, fontSize: 13, flex: 1 },
  lessonNumber: { color: colors.goldLight, fontSize: 12, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.text, fontSize: 35, lineHeight: 41, fontWeight: "800", marginTop: 2 },
  arabic: { color: colors.goldLight, fontSize: 25, marginTop: 5 },
  lead: { color: colors.textSecondary, fontSize: 17, lineHeight: 26, marginTop: 14 },
  faq: { marginTop: 28 },
  faqTitle: { color: colors.goldLight, fontSize: 13, fontWeight: "800", letterSpacing: 1.1, marginBottom: 4 },
  faqItem: { marginTop: 8, padding: 14, borderRadius: 17, backgroundColor: colors.surfaceAlt },
  questionButton: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  question: { color: colors.text, fontSize: 16, lineHeight: 22, fontWeight: "700", flex: 1 },
  toggle: { color: colors.goldLight, fontSize: 23, lineHeight: 24 },
  answerWrap: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSoft, gap: 8 },
  answer: { color: colors.textSecondary, fontSize: 15, lineHeight: 23 },
  navigation: { flexDirection: "row", justifyContent: "space-between", marginTop: 28, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  navButton: { width: "47%", minHeight: 64, justifyContent: "center", paddingHorizontal: 8, borderRadius: 14, backgroundColor: colors.surfaceAlt },
  navRight: { alignItems: "flex-end" },
  navKicker: { color: colors.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 0.9, marginBottom: 5 },
  nav: { color: colors.goldLight, fontSize: 14, lineHeight: 20, fontWeight: "700", textAlign: "left" },
  navTextRight: { textAlign: "right" },
  text: { color: colors.text },
});
