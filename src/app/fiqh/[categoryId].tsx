import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { FiqhBookHero } from "../../features/fiqh/components/FiqhBookHero";
import { FiqhChapterMark } from "../../features/fiqh/components/FiqhChapterMark";
import { FiqhLessonCard } from "../../features/fiqh/components/FiqhLessonCard";
import { categoryById, topicById } from "../../features/fiqh/fiqhData";
import { colors } from "../../theme/colors";

const prayerBookImage = require("../../assets/images/fiqh/prayer-book.png");
const purificationBookImage = require("../../assets/images/fiqh/purification.png");
const fastingBookImage = require("../../assets/images/fiqh/fasting.png");
const zakatBookImage = require("../../assets/images/fiqh/zakat.png");
const hajjUmraBookImage = require("../../assets/images/fiqh/hajj-umrah-final.jpg");
const bookImages: Record<string, ReturnType<typeof require>> = { funerals: require("../../assets/images/fiqh/funerals.png"), family: require("../../assets/images/fiqh/family.png"), transactions: require("../../assets/images/fiqh/transactions.png"), "food-sacrifices": require("../../assets/images/fiqh/food-sacrifices.png"), "oaths-vows": require("../../assets/images/fiqh/oaths-vows.png"), "clothing-adornment": require("../../assets/images/fiqh/clothing-adornment.png"), "daily-life": require("../../assets/images/fiqh/daily-life.png"), "justice-rights": require("../../assets/images/fiqh/justice-rights.png"), "inheritance-wills": require("../../assets/images/fiqh/inheritance-wills.png"), "hunting-animals": require("../../assets/images/fiqh/hunting-animals.png"), "siyar-relations": require("../../assets/images/fiqh/siyar-relations.png") };

// Pending book heroes will use the same filenames as the Home mapping once deposited.

export default function FiqhCategory() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const category = categoryById.get(categoryId);
  const [selectedId, setSelectedId] = useState("");
  if (!category) return <SafeAreaView style={s.screen}><Text style={s.empty}>Catégorie introuvable.</Text></SafeAreaView>;
  const chapters = category.chapters ?? [];
  const heroImage =
    category.id === "prayer" ? prayerBookImage
      : category.id === "purification" ? purificationBookImage
        : category.id === "fasting" ? fastingBookImage
          : category.id === "zakat" ? zakatBookImage
            : category.id === "hajj-umra" ? hajjUmraBookImage
              : bookImages[category.id];
  if (!chapters.length) return <SafeAreaView style={s.screen}><ScrollView contentContainerStyle={s.content}><Pressable onPress={() => router.back()}><Text style={s.back}>‹ Retour</Text></Pressable><FiqhBookHero title={category.title} arabicTitle={category.arabicTitle} description={category.summary} chapterLabel="CATÉGORIE" countLabel={`${category.topicIds.length} sujets`} imageSource={heroImage} visualKey={category.id} />{category.topicIds.map((id, index) => { const topic = topicById.get(id); return topic ? <Pressable key={id} onPress={() => router.push(`/fiqh/topic/${id}`)} style={({ pressed }) => [s.topic, pressed && s.pressed]}><Text style={s.number}>{String(index + 1).padStart(2, "0")}</Text><View style={s.topicCopy}><Text style={s.topicTitle}>{topic.title}</Text><Text style={s.topicText}>{topic.summary}</Text></View><Ionicons name="chevron-forward" size={19} color={colors.goldLight} /></Pressable> : null; })}</ScrollView></SafeAreaView>;
  const activeId = selectedId || chapters[0].id;
  const activeChapter = chapters.find((chapter) => chapter.id === activeId) ?? chapters[0];
  return <SafeAreaView style={s.screen}><ScrollView contentContainerStyle={s.content}><Pressable onPress={() => router.back()}><Text style={s.back}>‹ Retour</Text></Pressable><FiqhBookHero title={category.title} arabicTitle={category.arabicTitle} description={category.summary} chapterLabel="LIVRE DE FIQH" countLabel={`${category.topicIds.length} sujets · ${chapters.length} chapitres`} imageSource={heroImage} visualKey={category.id} /><Text style={s.sectionTitle}>Table des matières</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail}>{chapters.map((chapter, index) => <Pressable key={chapter.id} onPress={() => setSelectedId(chapter.id)} style={({ pressed }) => [s.chapter, category.id !== "prayer" && s.chapterPurification, chapter.id === activeId && s.chapterActive, pressed && s.pressed]}>{category.id !== "prayer" ? <View style={s.chapterTop}><FiqhChapterMark chapterId={chapter.id} compact /><Text style={s.number}>{String(index + 1).padStart(2, "0")}</Text></View> : <Text style={s.number}>{String(index + 1).padStart(2, "0")}</Text>}<Text style={[s.chapterTitle, category.id !== "prayer" && s.chapterTitlePurification]} numberOfLines={2}>{chapter.title}</Text><View style={s.chapterBottom}><Text style={s.chapterCount}>{chapter.topicIds.length} sujet{chapter.topicIds.length > 1 ? "s" : ""}</Text><Ionicons name="arrow-forward" size={16} color={colors.goldLight} /></View></Pressable>)}</ScrollView><Text style={s.activeLabel}>Parcours sélectionné · {activeChapter.title}</Text><View style={[s.preview, category.id !== "prayer" && s.previewPurification]}>{category.id !== "prayer" ? <FiqhChapterMark chapterId={activeChapter.id} /> : null}<Text style={s.previewKicker}>CHAPITRE {String(chapters.indexOf(activeChapter) + 1).padStart(2, "0")}</Text><Text style={s.previewTitle}>{activeChapter.title}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.lessonRail}>{activeChapter.topicIds.map((id, index) => { const topic = topicById.get(id); return topic ? <FiqhLessonCard key={id} topic={topic} index={index} onPress={() => router.push({ pathname: "/fiqh/topic/[topicId]", params: { topicId: id, chapter: activeChapter.id } })} /> : null; })}</ScrollView><Pressable onPress={() => router.push({ pathname: "/fiqh/chapter/[chapterId]", params: { chapterId: activeChapter.id } })} style={s.openButton}><Text style={s.openText}>Ouvrir le chapitre</Text><Ionicons name="arrow-forward" size={16} color={colors.goldLight} /></Pressable></View></ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.background }, content: { padding: 22, paddingBottom: 60 }, back: { color: colors.goldLight, fontSize: 18, marginBottom: 20 }, sectionTitle: { color: colors.goldLight, fontSize: 14, fontWeight: "800", letterSpacing: 1, marginTop: 28, marginBottom: 10 }, rail: { gap: 10, paddingRight: 38 }, chapter: { width: 190, minHeight: 142, padding: 16, borderRadius: 20, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.borderSoft }, chapterActive: { borderColor: colors.goldLight, backgroundColor: colors.surface },
  chapterPurification: { width: 202, minHeight: 154, borderColor: colors.goldDark, backgroundColor: colors.purpleDeep },
  chapterTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chapterBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto" },
  chapterTitlePurification: { marginTop: 14, lineHeight: 23 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] }, number: { color: colors.goldLight, fontSize: 12, fontWeight: "800" }, chapterTitle: { color: colors.text, fontSize: 18, fontWeight: "800", marginTop: 17 }, chapterCount: { color: colors.textSecondary, fontSize: 13, marginTop: 7, marginBottom: 10 }, activeLabel: { color: colors.textSecondary, fontSize: 13, marginTop: 14 }, preview: { marginTop: 10, padding: 18, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft },
  previewPurification: { backgroundColor: colors.purpleDeep, borderColor: colors.goldDark },
  previewKicker: { color: colors.goldLight, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 }, previewTitle: { color: colors.text, fontSize: 25, fontWeight: "800", marginTop: 7, marginBottom: 10 }, lessonRail: { gap: 12, paddingRight: 15 }, openButton: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 16, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.borderSoft }, openText: { color: colors.goldLight, fontSize: 14, fontWeight: "800" }, topic: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.borderSoft }, topicCopy: { flex: 1 }, topicTitle: { color: colors.text, fontSize: 17, fontWeight: "800" }, topicText: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 }, empty: { color: colors.text, padding: 22 } });
