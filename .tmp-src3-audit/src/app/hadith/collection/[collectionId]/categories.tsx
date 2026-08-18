import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hadithRepository } from "../../../../features/hadith-explorer/data/hadithRepository";
import { getHadithCollection } from "../../../../features/hadith-explorer/domain/HadithCollection";
import type { HadithDocumentaryCategory } from "../../../../features/hadith-explorer/domain/HadithCollection";
import HadithScreenHeader from "../../../../features/hadith-explorer/presentation/HadithScreenHeader";
import { colors } from "../../../../theme/colors";
import { typography } from "../../../../theme/typography";

function categoryIcon(name: string): keyof typeof Ionicons.glyphMap {
  const value = name.toLocaleLowerCase("fr");
  if (/foi|croyance|tawhid|iman|allah|ange/.test(value)) return "star-outline";
  if (/pri|adoration|salat/.test(value)) return "hand-left-outline";
  if (/jeûne|ramadan/.test(value)) return "moon-outline";
  if (/mariage|nikah|amour/.test(value)) return "heart-outline";
  if (/famille|enfant|parent|fratern|voisin/.test(value)) return "people-outline";
  if (/commerce|argent|transaction|vente|achat|zakat|aumône/.test(value)) return "cash-outline";
  if (/justice|jugement|loi|droit/.test(value)) return "scale-outline";
  if (/coran|quran|science|savoir|lecture/.test(value)) return "book-outline";
  if (/mosquée|minaret|vendredi/.test(value)) return "business-outline";
  if (/invocation|dhikr|rappel|dou[aâ]/.test(value)) return "hand-left-outline";
  if (/ablution|purif|eau/.test(value)) return "water-outline";
  if (/patience|comportement|morale|vertu|bonté/.test(value)) return "heart-outline";
  if (/mort|paradis|enfer|résurrection/.test(value)) return "infinite-outline";

  const fallbackIcons: Array<keyof typeof Ionicons.glyphMap> = [
    "sparkles-outline",
    "flame-outline",
    "leaf-outline",
    "sunny-outline",
    "compass-outline",
    "ribbon-outline",
    "diamond-outline",
  ];
  const hash = [...value].reduce((total, character) => total + character.charCodeAt(0), 0);
  return fallbackIcons[hash % fallbackIcons.length];
}

export default function HadithCollectionCategoriesScreen() {
  const { collectionId, uxTitle, uxTerms } = useLocalSearchParams<{
    collectionId: string;
    uxTitle?: string;
    uxTerms?: string;
  }>();
  const collection = useMemo(() => getHadithCollection(collectionId), [collectionId]);
  const [categories, setCategories] = useState<HadithDocumentaryCategory[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!collection) {
      setLoading(false);
      return;
    }
    void hadithRepository.listCollectionCategories(collection)
      .then((value) => active && setCategories(value))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [collection]);

  const visibleCategories = useMemo(() => {
    const terms = uxTerms?.split(",").filter(Boolean);
    const normalizedSearch = searchText.trim().toLocaleLowerCase("fr");
    return categories
      .filter((category) => !terms?.length || terms.some((term) => category.name.toLocaleLowerCase("fr").includes(term)))
      .filter((category) => !normalizedSearch || category.name.toLocaleLowerCase("fr").includes(normalizedSearch))
      .sort((left, right) => right.hadithCount - left.hadithCount);
  }, [categories, searchText, uxTerms]);

  if (!collection) {
    return <View style={styles.center}><Text style={styles.title}>Recueil introuvable</Text></View>;
  }

  const pageTitle = uxTitle || "Toutes les catégories";

  return (
    <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}>
          <HadithScreenHeader title={pageTitle} subtitle={collection.name} />
        </View>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.goldLight} />
            <Text style={styles.muted}>Chargement des catégories…</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={21} color={colors.goldLight} />
              <TextInput
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Rechercher une catégorie…"
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
            </View>
            <Text style={styles.muted}>{visibleCategories.length} catégories disponibles</Text>
            <View style={styles.grid}>
              {visibleCategories.map((category) => (
                <Pressable
                  key={category.id}
                  onPress={() => router.push(`/hadith/collection/${collection.id}/${category.id}` as never)}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                >
                  <View style={styles.cardTopRow}>
                    <View style={styles.iconBox}>
                      <Ionicons name={categoryIcon(category.name)} size={25} color={colors.goldLight} />
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
                  </View>
                  <Text allowFontScaling={false} style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{category.hadithCount} hadiths</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: { paddingHorizontal: 18 },
  content: { padding: 18, paddingBottom: 110 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  title: { color: colors.text, fontFamily: typography.sans, fontSize: 23 },
  muted: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 12, marginTop: 12 },
  searchBox: { height: 58, marginTop: 18, borderRadius: 20, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "rgba(29,20,42,0.9)", borderWidth: 1, borderColor: "rgba(139,103,158,0.28)" },
  searchInput: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 15 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginTop: 20 },
  card: { width: "47.5%", minHeight: 190, marginBottom: 12, padding: 18, alignItems: "stretch", justifyContent: "flex-start", borderRadius: 21, backgroundColor: "rgba(29,20,42,0.9)", borderWidth: 1, borderColor: "rgba(139,103,158,0.22)" },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  iconBox: { width: 46, height: 46, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.1)" },
  categoryName: { width: "100%", flexShrink: 1, color: colors.text, fontFamily: typography.sans, fontSize: 16, lineHeight: 22, textAlign: "left", marginTop: 16, fontWeight: "700" },
  categoryCount: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, marginTop: 10 },
  pressed: { opacity: 0.82 },
});
