import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { pil, pilType } from "../../components/pilgrimage/theme";
import { PROBLEM_CATEGORIES, PROBLEMS, PROBLEMS_DISCLAIMER, WHEN_TO_SEEK_HELP } from "../../features/pilgrimage/pilgrimageProblems";
import type { ProblemCategory } from "../../features/pilgrimage/pilgrimageTypes";

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ‘’']/g, "").toLowerCase();

export default function PilgrimageProblems() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProblemCategory | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const shown = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    return PROBLEMS.filter((problem) =>
      (!category || problem.category === category)
      && words.every((word) => normalize(`${problem.question} ${problem.whatToKnow} ${problem.whatToDoNow}`).includes(word)));
  }, [category, query]);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((current) => (current === id ? null : id));
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} hitSlop={8} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>PAS DE PANIQUE</Text>
          <Text style={styles.title}>J’ai un doute</Text>
        </View>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={pil.gold} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Parfum, tours, mîqât, règles…"
          placeholderTextColor="rgba(255,255,255,0.55)"
          style={styles.searchInput}
          returnKeyType="search"
        />
        {query ? (
          <Pressable onPress={() => setQuery("")} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color="#FFFFFF" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersBar} contentContainerStyle={styles.filters}>
        {[null, ...PROBLEM_CATEGORIES].map((item) => {
          const id = item?.id ?? null;
          const active = category === id;
          return (
            <Pressable key={id ?? "all"} onPress={() => setCategory(id)} style={[styles.filter, active && styles.filterActive]}>
              {item ? <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={15} color={active ? pil.ink : "#FFFFFF"} /> : null}
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{item?.label ?? "Tout"}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.notice}>
          <Ionicons name="shield-checkmark-outline" size={20} color={pil.gold} />
          <Text style={styles.noticeText}>{PROBLEMS_DISCLAIMER}</Text>
        </View>

        {shown.map((problem) => {
          const expanded = open === problem.id;
          return (
            <Pressable key={problem.id} onPress={() => toggle(problem.id)} style={[styles.card, expanded && styles.cardOpen]}>
              <View style={styles.question}>
                <Text style={styles.questionText}>{problem.question}</Text>
                <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={20} color={pil.gold} />
              </View>
              {expanded ? (
                <>
                  <View style={styles.block}>
                    <Text style={styles.blockLabel}>Ce qu’il faut savoir</Text>
                    <Text style={styles.blockText}>{problem.whatToKnow}</Text>
                  </View>
                  <View style={[styles.block, styles.blockAction]}>
                    <Text style={[styles.blockLabel, styles.blockLabelAction]}>Que faire maintenant</Text>
                    <Text style={styles.blockText}>{problem.whatToDoNow}</Text>
                  </View>
                  <View style={styles.help}>
                    <Ionicons name="people-outline" size={17} color={pil.red} />
                    <Text style={styles.helpText}>{WHEN_TO_SEEK_HELP}</Text>
                  </View>
                </>
              ) : null}
            </Pressable>
          );
        })}
        {shown.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={30} color={pil.gold} />
            <Text style={styles.emptyText}>Aucune situation ne correspond. Pour un cas particulier, demandez à votre guide ou à une personne qualifiée.</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: pil.bg },
  header: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: pil.surfaceHigh },
  headerCopy: { flex: 1 },
  eyebrow: { color: pil.gold, fontSize: 12, fontWeight: "800", letterSpacing: 1.3, ...pilType.sans },
  title: { color: pil.text, fontSize: 32, ...pilType.display },
  search: { marginTop: 14, marginHorizontal: 16, minHeight: 50, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 18, borderWidth: 1, borderColor: pil.line, backgroundColor: pil.surface },
  searchInput: { flex: 1, color: pil.text, fontSize: 16, ...pilType.sans },
  filtersBar: { flexGrow: 0, marginTop: 10 },
  filters: { paddingHorizontal: 16, gap: 8 },
  filter: { minHeight: 38, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 19, backgroundColor: pil.surface },
  filterActive: { backgroundColor: pil.gold },
  filterText: { color: pil.text, fontSize: 14.5, fontWeight: "700", ...pilType.sans },
  filterTextActive: { color: pil.ink, fontWeight: "800" },
  content: { paddingHorizontal: 18, paddingTop: 14, gap: 10 },
  notice: { padding: 13, flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 16, backgroundColor: pil.goldSoft },
  noticeText: { flex: 1, color: pil.text, fontSize: 14.5, lineHeight: 21, ...pilType.sans },
  card: { padding: 16, borderRadius: 20, borderWidth: 1, borderColor: pil.line, backgroundColor: pil.surface },
  cardOpen: { borderColor: pil.goldLine, backgroundColor: pil.surfaceHigh },
  question: { flexDirection: "row", alignItems: "center", gap: 10 },
  questionText: { flex: 1, color: pil.text, fontSize: 17, lineHeight: 24, fontWeight: "700", ...pilType.sans },
  block: { marginTop: 14 },
  blockAction: { padding: 13, borderRadius: 14, backgroundColor: pil.greenSoft },
  blockLabel: { color: pil.gold, fontSize: 13, fontWeight: "800", letterSpacing: 0.4, ...pilType.sans },
  blockLabelAction: { color: pil.green },
  blockText: { marginTop: 5, color: pil.text, fontSize: 16, lineHeight: 24, ...pilType.sans },
  help: { marginTop: 12, flexDirection: "row", alignItems: "flex-start", gap: 8 },
  helpText: { flex: 1, color: pil.textSoft, fontSize: 14, lineHeight: 20, ...pilType.sans },
  empty: { marginTop: 20, alignItems: "center", gap: 10, padding: 20 },
  emptyText: { color: pil.textSoft, fontSize: 15, lineHeight: 22, textAlign: "center", ...pilType.sans },
});
