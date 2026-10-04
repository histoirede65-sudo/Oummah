import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FiqhDifferenceCard } from "../../../features/fiqh/components/FiqhDifferenceCard";
import { FiqhTopBar, SourceChips, SourceSheet, TextSizeButton, fq, fqType, useSourceSheet } from "../../../features/fiqh/components/FiqhUI";
import { FiqhWasilCTA } from "../../../features/fiqh/components/FiqhWasilCTA";
import { bookOrder, categoryById, chapterById, topicById } from "../../../features/fiqh/fiqhData";
import { lessonOf, lessonSourceIds, sourceShortLabel } from "../../../features/fiqh/fiqhLessons";
import { markFiqhLessonRead, saveFiqhProgress, useFiqhReading } from "../../../features/fiqh/fiqhStorage";

export default function FiqhLessonScreen() {
  const { topicId, chapter: chapterParam } = useLocalSearchParams<{ topicId: string; chapter?: string }>();
  const topic = topicById.get(topicId);
  const reading = useFiqhReading();
  const { sourceId, openSource, closeSource } = useSourceSheet();
  const [openCase, setOpenCase] = useState<number | null>(0);
  const [showSources, setShowSources] = useState(false);

  useEffect(() => {
    if (!topic) return;
    void markFiqhLessonRead(topic.id);
    void saveFiqhProgress({ lastTopicId: topic.id, lastCategoryId: topic.categoryId });
    setOpenCase(0);
    setShowSources(false);
  }, [topic]);

  const lesson = useMemo(() => (topic ? lessonOf(topic) : null), [topic]);

  if (!topic || !lesson) {
    return <SafeAreaView style={styles.screen}><FiqhTopBar /><Text style={styles.empty}>Leçon introuvable.</Text></SafeAreaView>;
  }

  const k = reading.textScale;
  const category = categoryById.get(topic.categoryId);
  const chapter = (chapterParam ? chapterById.get(chapterParam) : undefined) ?? Array.from(chapterById.values()).find((item) => item.topicIds.includes(topic.id));
  const chapterIndex = chapter && category?.chapters ? category.chapters.findIndex((item) => item.id === chapter.id) : -1;
  const lessonIndex = chapter ? chapter.topicIds.indexOf(topic.id) : -1;
  const book = bookOrder(topic.categoryId);
  const bookIndex = book.indexOf(topic.id);
  const previousId = bookIndex > 0 ? book[bookIndex - 1] : undefined;
  const nextId = bookIndex >= 0 && bookIndex < book.length - 1 ? book[bookIndex + 1] : undefined;
  const sources = lessonSourceIds(topic, lesson);
  const go = (id: string) => router.replace({ pathname: "/fiqh/topic/[topicId]", params: { topicId: id } });

  const body = { fontSize: 16.5 * k, lineHeight: 26 * k };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FiqhTopBar label={category?.title} right={<TextSizeButton scale={k} />} />
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${book.length ? ((bookIndex + 1) / book.length) * 100 : 0}%` }]} /></View>

      <ScrollView contentContainerStyle={styles.content}>
        {chapter ? (
          <Text style={styles.kicker}>
            {chapterIndex >= 0 ? `CHAPITRE ${chapterIndex + 1} · ` : ""}{chapter.title.toUpperCase()}
            {lessonIndex >= 0 && chapter.topicIds.length > 1 ? `  ·  ${lessonIndex + 1}/${chapter.topicIds.length}` : ""}
          </Text>
        ) : null}
        <Text style={[styles.title, { fontSize: 34 * Math.min(k, 1.12), lineHeight: 39 * Math.min(k, 1.12) }]}>{topic.title}</Text>
        {topic.arabicTerm ? <Text style={styles.arabic}>{topic.arabicTerm}</Text> : null}

        <View style={styles.short}>
          <Text style={styles.shortLabel}>EN BREF</Text>
          <Text style={[styles.shortText, { fontSize: 18 * k, lineHeight: 28 * k }]}>{lesson.short}</Text>
        </View>

        {lesson.rules.length ? (
          <Section title="Les règles">
            {lesson.rules.map((point, index) => (
              <View key={index} style={styles.rule}>
                <View style={styles.ruleDot} />
                <View style={styles.flex}>
                  <Text style={[styles.body, body]}>{point.text}</Text>
                  <SourceChips ids={point.ids} onOpen={openSource} />
                </View>
              </View>
            ))}
          </Section>
        ) : null}

        {lesson.steps?.length ? (
          <Section title="Comment faire">
            {lesson.steps.map((point, index) => (
              <View key={index} style={styles.step}>
                <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{index + 1}</Text></View>
                <View style={styles.flex}>
                  <Text style={[styles.body, body]}>{point.text}</Text>
                  <SourceChips ids={point.ids} onOpen={openSource} />
                </View>
              </View>
            ))}
          </Section>
        ) : null}

        {lesson.cases?.length ? (
          <Section title="Cas fréquents">
            {lesson.cases.map((item, index) => {
              const open = openCase === index;
              return (
                <View key={index} style={[styles.case, open && styles.caseOpen]}>
                  <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpenCase(open ? null : index)} style={styles.caseHead}>
                    <Text style={[styles.caseQuestion, { fontSize: 16 * k, lineHeight: 23 * k }]}>{item.q}</Text>
                    <Ionicons name={open ? "remove" : "add"} size={20} color={fq.gold} />
                  </Pressable>
                  {open ? (
                    <View style={styles.caseAnswer}>
                      <Text style={[styles.body, body]}>{item.a}</Text>
                      <SourceChips ids={item.ids} onOpen={openSource} />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </Section>
        ) : null}

        {lesson.avoid?.length ? (
          <Section title="À éviter">
            {lesson.avoid.map((text, index) => (
              <View key={index} style={styles.rule}>
                <Ionicons name="close" size={16} color={fq.red} style={styles.avoidIcon} />
                <Text style={[styles.body, styles.flex, body]}>{text}</Text>
              </View>
            ))}
          </Section>
        ) : null}

        {topic.differences.length ? (
          <Section title="Les avis des écoles">
            {topic.differences.map((difference) => <FiqhDifferenceCard key={difference.question} difference={difference} />)}
          </Section>
        ) : null}

        {lesson.note?.length ? (
          <View style={styles.note}>
            <Text style={styles.noteLabel}>BON À SAVOIR</Text>
            {lesson.note.map((text, index) => <Text key={index} style={[styles.noteText, { fontSize: 15 * k, lineHeight: 23 * k }]}>{text}</Text>)}
          </View>
        ) : null}

        {topic.sensitive ? (
          <View style={styles.personal}>
            <Ionicons name="person-circle-outline" size={20} color={fq.gold} />
            <Text style={styles.personalText}>Pour une situation réelle, exposez votre cas complet à une personne de science qualifiée.</Text>
          </View>
        ) : null}

        {topic.link || topic.categoryId === "hajj-umra" ? (
          <Pressable onPress={() => router.push((topic.link?.route ?? "/pilgrimage") as never)} style={styles.guide}>
            <Ionicons name="map-outline" size={19} color={fq.gold} />
            <Text style={styles.guideText}>{topic.link?.label ?? "Ouvrir le guide pas à pas Hajj & ‘Umra"}</Text>
            <Ionicons name="chevron-forward" size={17} color={fq.gold} />
          </Pressable>
        ) : null}

        {sources.length ? (
          <View style={styles.sources}>
            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showSources }} onPress={() => setShowSources((value) => !value)} style={styles.sourcesHead}>
              <Text style={styles.sourcesTitle}>Sources de la leçon</Text>
              <Text style={styles.sourcesCount}>{sources.length}</Text>
              <Ionicons name={showSources ? "chevron-up" : "chevron-down"} size={18} color={fq.inkMuted} />
            </Pressable>
            {showSources ? sources.map((id) => (
              <Pressable key={id} onPress={() => openSource(id)} style={styles.sourceRow}>
                <Text style={styles.sourceLabel}>{sourceShortLabel(id)}</Text>
                <Ionicons name="information-circle-outline" size={17} color={fq.inkMuted} />
              </Pressable>
            )) : null}
          </View>
        ) : null}

        <FiqhWasilCTA enabled prompt={`Contexte : Fiqh → ${category?.title ?? "Fiqh"} → ${chapter?.title ?? "Leçon"} → ${topic.title}.\n\nJe souhaite approfondir cette leçon et poser ma question :`} />

        <View style={styles.nav}>
          {previousId ? (
            <Pressable onPress={() => go(previousId)} style={styles.navButton}>
              <Text style={styles.navKicker}>‹ Précédent</Text>
              <Text style={styles.navTitle} numberOfLines={2}>{topicById.get(previousId)?.title}</Text>
            </Pressable>
          ) : <View style={styles.navSpacer} />}
          {nextId ? (
            <Pressable onPress={() => go(nextId)} style={[styles.navButton, styles.navNext]}>
              <Text style={[styles.navKicker, styles.navKickerNext]}>Suivant ›</Text>
              <Text style={[styles.navTitle, styles.navTitleNext]} numberOfLines={2}>{topicById.get(nextId)?.title}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => router.back()} style={[styles.navButton, styles.navNext]}>
              <Text style={[styles.navKicker, styles.navKickerNext]}>Fin du livre</Text>
              <Text style={[styles.navTitle, styles.navTitleNext]}>Retour au sommaire</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
      <SourceSheet id={sourceId} onClose={closeSource} />
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: fq.page },
  empty: { color: fq.ink, padding: 22 },
  progressTrack: { height: 2, backgroundColor: fq.lineSoft },
  progressFill: { height: 2, backgroundColor: fq.gold },
  content: { paddingHorizontal: 22, paddingTop: 22, paddingBottom: 80 },
  flex: { flex: 1 },
  kicker: { color: fq.gold, fontSize: 11.5, fontWeight: "800", letterSpacing: 1.1 },
  title: { color: fq.ink, fontFamily: fqType.serif, marginTop: 10 },
  arabic: { color: fq.gold, fontFamily: fqType.arabic, fontSize: 24, marginTop: 4 },
  short: { marginTop: 22, padding: 18, borderRadius: 20, backgroundColor: fq.paper, borderWidth: 1, borderColor: fq.line },
  shortLabel: { color: fq.gold, fontSize: 11, fontWeight: "800", letterSpacing: 1.3, marginBottom: 8 },
  shortText: { color: fq.ink, fontWeight: "500" },
  section: { marginTop: 32 },
  sectionTitle: { color: fq.ink, fontFamily: fqType.serif, fontSize: 25, marginBottom: 12 },
  body: { color: fq.inkSoft },
  rule: { flexDirection: "row", gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: fq.lineSoft },
  ruleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: fq.gold, marginTop: 10 },
  avoidIcon: { marginTop: 5 },
  step: { flexDirection: "row", gap: 12, paddingVertical: 9 },
  stepNumber: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: fq.goldSoft, marginTop: 1 },
  stepNumberText: { color: fq.gold, fontSize: 13, fontWeight: "800" },
  case: { marginBottom: 8, borderRadius: 16, backgroundColor: fq.paper, borderWidth: 1, borderColor: fq.lineSoft },
  caseOpen: { borderColor: fq.line },
  caseHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 15, paddingVertical: 14 },
  caseQuestion: { flex: 1, color: fq.ink, fontWeight: "700" },
  caseAnswer: { paddingHorizontal: 15, paddingBottom: 15 },
  note: { marginTop: 32, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: fq.lineSoft, gap: 8 },
  noteLabel: { color: fq.inkMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  noteText: { color: fq.inkMuted },
  personal: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 24, padding: 14, borderRadius: 16, backgroundColor: fq.goldSoft },
  personalText: { flex: 1, color: fq.ink, fontSize: 14.5, lineHeight: 21 },
  guide: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 24, padding: 15, borderRadius: 16, borderWidth: 1, borderColor: fq.line },
  guideText: { flex: 1, color: fq.ink, fontSize: 15, fontWeight: "700" },
  sources: { marginTop: 28, borderRadius: 16, backgroundColor: fq.paper, paddingHorizontal: 15 },
  sourcesHead: { flexDirection: "row", alignItems: "center", gap: 8, height: 52 },
  sourcesTitle: { flex: 1, color: fq.ink, fontSize: 15, fontWeight: "700" },
  sourcesCount: { color: fq.inkMuted, fontSize: 14, fontWeight: "700" },
  sourceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: fq.lineSoft },
  sourceLabel: { color: fq.inkSoft, fontSize: 14.5 },
  nav: { flexDirection: "row", gap: 10, marginTop: 30 },
  navButton: { flex: 1, minHeight: 72, padding: 14, borderRadius: 16, backgroundColor: fq.paper, borderWidth: 1, borderColor: fq.lineSoft },
  navNext: { alignItems: "flex-end", borderColor: fq.line },
  navSpacer: { flex: 1 },
  navKicker: { color: fq.inkMuted, fontSize: 12, fontWeight: "700" },
  navKickerNext: { color: fq.gold },
  navTitle: { color: fq.ink, fontSize: 14.5, lineHeight: 20, fontWeight: "700", marginTop: 5 },
  navTitleNext: { textAlign: "right" },
});
