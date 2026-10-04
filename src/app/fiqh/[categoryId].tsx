import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FiqhTopBar, fq, fqType } from "../../features/fiqh/components/FiqhUI";
import { FIQH_BOOK_IMAGES, FIQH_BOOK_INTROS } from "../../features/fiqh/fiqhBooks";
import { categoryById, topicById } from "../../features/fiqh/fiqhData";
import { useFiqhReading } from "../../features/fiqh/fiqhStorage";

/** A Fiqh book: cover, reading progress, then the table of contents with every lesson. */
export default function FiqhBookScreen() {
  const { categoryId, chapter: focusChapter } = useLocalSearchParams<{ categoryId: string; chapter?: string }>();
  const category = categoryById.get(categoryId);
  const reading = useFiqhReading();
  if (!category) return <SafeAreaView style={styles.screen}><FiqhTopBar /><Text style={styles.empty}>Livre introuvable.</Text></SafeAreaView>;

  const chapters = category.chapters?.length ? category.chapters : [{ id: category.id, categoryId: category.id, title: category.title, topicIds: category.topicIds }];
  const lessons = category.topicIds.filter((id) => topicById.has(id));
  const readCount = lessons.filter((id) => reading.read.includes(id)).length;
  const nextId = lessons.find((id) => !reading.read.includes(id)) ?? lessons[0];
  const open = (id: string) => router.push({ pathname: "/fiqh/topic/[topicId]", params: { topicId: id } });
  const image = FIQH_BOOK_IMAGES[category.id];

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FiqhTopBar label="Fiqh" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.cover}>
          {image ? <Image source={image} style={styles.coverImage} resizeMode="cover" /> : null}
          <LinearGradient colors={["rgba(10,8,20,0)", "rgba(10,8,20,0.55)", fq.page]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
          <View style={styles.coverText}>
            <Text style={styles.kicker}>LIVRE DE FIQH</Text>
            <Text style={styles.title}>{category.title}</Text>
            {category.arabicTitle ? <Text style={styles.arabic}>{category.arabicTitle}</Text> : null}
          </View>
        </View>

        <Text style={styles.intro}>{FIQH_BOOK_INTROS[category.id] ?? category.summary}</Text>

        <View style={styles.stats}>
          <Text style={styles.stat}>{lessons.length} leçons</Text>
          <Text style={styles.statDot}>·</Text>
          <Text style={styles.stat}>{chapters.length} chapitre{chapters.length > 1 ? "s" : ""}</Text>
          {readCount ? <><Text style={styles.statDot}>·</Text><Text style={[styles.stat, styles.statGold]}>{readCount} lue{readCount > 1 ? "s" : ""}</Text></> : null}
        </View>
        <View style={styles.bookTrack}><View style={[styles.bookFill, { width: `${lessons.length ? (readCount / lessons.length) * 100 : 0}%` }]} /></View>

        {nextId ? (
          <Pressable onPress={() => open(nextId)} style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
            <View style={styles.flex}>
              <Text style={styles.ctaLabel}>{readCount === 0 ? "Commencer la lecture" : readCount === lessons.length ? "Relire depuis le début" : "Continuer"}</Text>
              <Text style={styles.ctaTitle} numberOfLines={1}>{topicById.get(nextId)?.title}</Text>
            </View>
            <View style={styles.ctaIcon}><Ionicons name="arrow-forward" size={18} color={fq.page} /></View>
          </Pressable>
        ) : null}

        <Text style={styles.tocTitle}>Sommaire</Text>
        {chapters.map((chapter, chapterIndex) => (
          <View key={chapter.id} style={[styles.chapter, focusChapter === chapter.id && styles.chapterFocus]}>
            <View style={styles.chapterHead}>
              <Text style={styles.chapterNumber}>{chapterIndex + 1}</Text>
              <Text style={styles.chapterTitle}>{chapter.title}</Text>
            </View>
            {chapter.topicIds.map((id) => {
              const topic = topicById.get(id);
              if (!topic) return null;
              const done = reading.read.includes(id);
              return (
                <Pressable key={id} onPress={() => open(id)} style={({ pressed }) => [styles.lesson, pressed && styles.lessonPressed]}>
                  <Ionicons name={done ? "checkmark-circle" : "ellipse-outline"} size={18} color={done ? fq.gold : fq.inkMuted} />
                  <View style={styles.flex}>
                    <Text style={[styles.lessonTitle, done && styles.lessonDone]}>{topic.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={fq.inkMuted} />
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: fq.page },
  empty: { color: fq.ink, padding: 22 },
  content: { paddingBottom: 70 },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  cover: { height: 230, justifyContent: "flex-end", overflow: "hidden" },
  coverImage: { position: "absolute", top: 0, left: 0, right: 0, width: "100%", height: 230 },
  coverText: { paddingHorizontal: 22, paddingBottom: 4 },
  kicker: { color: fq.gold, fontSize: 11, fontWeight: "800", letterSpacing: 1.4 },
  title: { color: fq.ink, fontFamily: fqType.serif, fontSize: 42, lineHeight: 47, marginTop: 4 },
  arabic: { color: fq.gold, fontFamily: fqType.arabic, fontSize: 24 },
  intro: { color: fq.inkSoft, fontSize: 16, lineHeight: 25, paddingHorizontal: 22, marginTop: 12 },
  stats: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 22, marginTop: 16 },
  stat: { color: fq.inkMuted, fontSize: 13.5, fontWeight: "600" },
  statGold: { color: fq.gold },
  statDot: { color: fq.inkMuted },
  bookTrack: { height: 3, marginHorizontal: 22, marginTop: 10, borderRadius: 2, backgroundColor: fq.lineSoft, overflow: "hidden" },
  bookFill: { height: 3, backgroundColor: fq.gold },
  cta: { flexDirection: "row", alignItems: "center", gap: 14, marginHorizontal: 22, marginTop: 20, padding: 16, borderRadius: 18, backgroundColor: fq.paperHigh, borderWidth: 1, borderColor: fq.line },
  ctaLabel: { color: fq.gold, fontSize: 12.5, fontWeight: "800" },
  ctaTitle: { color: fq.ink, fontSize: 17, fontWeight: "700", marginTop: 3 },
  ctaIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: fq.gold },
  tocTitle: { color: fq.ink, fontFamily: fqType.serif, fontSize: 28, paddingHorizontal: 22, marginTop: 34, marginBottom: 6 },
  chapter: { marginHorizontal: 22, marginTop: 14, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: fq.lineSoft },
  chapterFocus: { borderTopColor: fq.gold },
  chapterHead: { flexDirection: "row", alignItems: "baseline", gap: 12, marginBottom: 4 },
  chapterNumber: { width: 22, color: fq.gold, fontFamily: fqType.serif, fontSize: 22 },
  chapterTitle: { flex: 1, color: fq.ink, fontSize: 17, fontWeight: "700" },
  lesson: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 48, paddingLeft: 2 },
  lessonPressed: { opacity: 0.7 },
  lessonTitle: { color: fq.inkSoft, fontSize: 15.5, lineHeight: 21 },
  lessonDone: { color: fq.inkMuted },
});
