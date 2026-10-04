import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { FiqhTopBar, fq, fqType } from "../features/fiqh/components/FiqhUI";
import { FIQH_BOOK_IMAGES, FIQH_BOOK_INTROS, FIQH_WORSHIP_BOOKS } from "../features/fiqh/fiqhBooks";
import { FIQH_CATEGORIES, categoryById, topicById } from "../features/fiqh/fiqhData";
import { lessonOf } from "../features/fiqh/fiqhLessons";
import { searchFiqhTopics } from "../features/fiqh/fiqhSearch";
import { useFiqhReading } from "../features/fiqh/fiqhStorage";

/** Fiqh library: search, last lesson, then the books grouped in two shelves. */
export default function FiqhHome() {
  const [query, setQuery] = useState("");
  const [showMethod, setShowMethod] = useState(false);
  const reading = useFiqhReading();
  const results = useMemo(() => (query.trim() ? searchFiqhTopics(query).slice(0, 30) : []), [query]);
  const last = reading.lastTopicId ? topicById.get(reading.lastTopicId) : undefined;
  const worship = FIQH_CATEGORIES.filter((category) => FIQH_WORSHIP_BOOKS.includes(category.id));
  const life = FIQH_CATEGORIES.filter((category) => !FIQH_WORSHIP_BOOKS.includes(category.id));
  const openLesson = (id: string) => router.push({ pathname: "/fiqh/topic/[topicId]", params: { topicId: id } });

  const shelf = (title: string, books: typeof FIQH_CATEGORIES) => (
    <View style={styles.shelf}>
      <Text style={styles.shelfTitle}>{title}</Text>
      {books.map((book) => {
        const total = book.topicIds.length;
        const done = book.topicIds.filter((id) => reading.read.includes(id)).length;
        return (
          <Pressable key={book.id} onPress={() => router.push(`/fiqh/${book.id}`)} style={({ pressed }) => [styles.book, pressed && styles.pressed]}>
            <View style={styles.thumb}>
              {FIQH_BOOK_IMAGES[book.id] ? <Image source={FIQH_BOOK_IMAGES[book.id]} style={styles.thumbImage} resizeMode="cover" /> : null}
            </View>
            <View style={styles.flex}>
              <View style={styles.bookTop}>
                <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
                {book.arabicTitle ? <Text style={styles.bookArabic} numberOfLines={1}>{book.arabicTitle}</Text> : null}
              </View>
              <Text style={styles.bookIntro} numberOfLines={2}>{FIQH_BOOK_INTROS[book.id] ?? book.summary}</Text>
              <Text style={styles.bookMeta}>{done ? `${done} / ${total} leçons lues` : `${total} leçons`}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FiqhTopBar />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Fiqh</Text>
        <Text style={styles.arabic}>الفقه</Text>
        <Text style={styles.lead}>Les règles de la pratique, expliquées simplement, avec leurs preuves.</Text>

        <View style={styles.search}>
          <Ionicons name="search" size={18} color={fq.inkMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Ablutions, voyage, zakât de l’or…"
            placeholderTextColor={fq.inkMuted}
            style={styles.input}
            returnKeyType="search"
            accessibilityLabel="Rechercher une leçon"
          />
          {query ? <Pressable hitSlop={8} onPress={() => setQuery("")} accessibilityLabel="Effacer"><Ionicons name="close-circle" size={18} color={fq.inkMuted} /></Pressable> : null}
        </View>

        {query.trim() ? (
          <View style={styles.results}>
            <Text style={styles.resultsCount}>{results.length ? `${results.length} leçon${results.length > 1 ? "s" : ""}` : "Aucune leçon ne correspond. Essayez un autre mot."}</Text>
            {results.map((topic) => (
              <Pressable key={topic.id} onPress={() => openLesson(topic.id)} style={({ pressed }) => [styles.result, pressed && styles.pressed]}>
                <Text style={styles.resultBook}>{categoryById.get(topic.categoryId)?.title}</Text>
                <Text style={styles.resultTitle}>{topic.title}</Text>
                <Text style={styles.resultText} numberOfLines={2}>{lessonOf(topic).short}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <>
            {last ? (
              <Pressable onPress={() => openLesson(last.id)} style={({ pressed }) => [styles.resume, pressed && styles.pressed]}>
                <Ionicons name="bookmark" size={18} color={fq.gold} />
                <View style={styles.flex}>
                  <Text style={styles.resumeLabel}>Reprendre · {categoryById.get(last.categoryId)?.title}</Text>
                  <Text style={styles.resumeTitle} numberOfLines={1}>{last.title}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={fq.gold} />
              </Pressable>
            ) : null}

            {shelf("Les actes d’adoration", worship)}
            {shelf("La vie du musulman", life)}

            <Pressable onPress={() => setShowMethod((value) => !value)} style={styles.method} accessibilityRole="button" accessibilityState={{ expanded: showMethod }}>
              <Ionicons name="library-outline" size={18} color={fq.gold} />
              <Text style={styles.methodTitle}>D’où vient ce contenu ?</Text>
              <Ionicons name={showMethod ? "chevron-up" : "chevron-down"} size={17} color={fq.inkMuted} />
            </Pressable>
            {showMethod ? (
              <View style={styles.methodBody}>
                <Text style={styles.methodText}>Chaque règle renvoie au Coran ou à un hadith authentique (Bukhârî, Muslim, ou les Sunan avec le jugement d’al-Albânî). Touchez une référence pour la consulter.</Text>
                <Text style={styles.methodText}>Le livre de référence est Al-Wajîz fî Fiqh as-Sunna wa-l-Kitâb al-‘Azîz de ‘Abd al-‘Azîm Badawî. Quand les écoles divergent, leurs avis sont présentés d’après leurs ouvrages : Badâ’i‘ as-Sanâ’i‘ (hanafite), Al-Mudawwana et Mawâhib al-Jalîl (malikite), Al-Majmû‘ (shafi‘ite) et Al-Mughnî (hanbalite).</Text>
                <Text style={styles.methodText}>Ces leçons enseignent les règles générales. Pour une situation personnelle, adressez-vous à une personne de science qualifiée.</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: fq.page },
  content: { paddingHorizontal: 22, paddingBottom: 70 },
  flex: { flex: 1 },
  pressed: { opacity: 0.85 },
  title: { color: fq.ink, fontFamily: fqType.serif, fontSize: 46, lineHeight: 50, marginTop: 4 },
  arabic: { color: fq.gold, fontFamily: fqType.arabic, fontSize: 26 },
  lead: { color: fq.inkSoft, fontSize: 16, lineHeight: 24, marginTop: 8 },
  search: { flexDirection: "row", alignItems: "center", gap: 10, height: 50, marginTop: 22, paddingHorizontal: 15, borderRadius: 16, backgroundColor: fq.paper, borderWidth: 1, borderColor: fq.lineSoft },
  input: { flex: 1, color: fq.ink, fontSize: 16 },
  results: { marginTop: 18 },
  resultsCount: { color: fq.inkMuted, fontSize: 13.5, marginBottom: 6 },
  result: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: fq.lineSoft },
  resultBook: { color: fq.gold, fontSize: 11.5, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  resultTitle: { color: fq.ink, fontSize: 17, fontWeight: "700", marginTop: 3 },
  resultText: { color: fq.inkSoft, fontSize: 14.5, lineHeight: 21, marginTop: 3 },
  resume: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18, padding: 15, borderRadius: 16, backgroundColor: fq.paperHigh, borderWidth: 1, borderColor: fq.line },
  resumeLabel: { color: fq.gold, fontSize: 12.5, fontWeight: "700" },
  resumeTitle: { color: fq.ink, fontSize: 16, fontWeight: "700", marginTop: 2 },
  shelf: { marginTop: 30 },
  shelfTitle: { color: fq.ink, fontFamily: fqType.serif, fontSize: 25, marginBottom: 6 },
  book: { flexDirection: "row", gap: 14, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: fq.lineSoft },
  thumb: { width: 62, height: 78, borderRadius: 12, overflow: "hidden", backgroundColor: fq.paperHigh },
  thumbImage: { width: 62, height: 78 },
  bookTop: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  bookTitle: { flexShrink: 1, color: fq.ink, fontSize: 17, fontWeight: "700" },
  bookArabic: { color: fq.gold, fontFamily: fqType.arabic, fontSize: 16 },
  bookIntro: { color: fq.inkSoft, fontSize: 14, lineHeight: 20, marginTop: 3 },
  bookMeta: { color: fq.inkMuted, fontSize: 12.5, fontWeight: "600", marginTop: 6 },
  method: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 30, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: fq.lineSoft },
  methodTitle: { flex: 1, color: fq.ink, fontSize: 15, fontWeight: "700" },
  methodBody: { gap: 10 },
  methodText: { color: fq.inkSoft, fontSize: 14.5, lineHeight: 22 },
});
