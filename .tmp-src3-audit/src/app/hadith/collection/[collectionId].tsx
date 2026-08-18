import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hadithRepository } from "../../../features/hadith-explorer/data/hadithRepository";
import type { HadithSummary } from "../../../features/hadith-explorer/domain/Hadith";
import { getHadithCollection } from "../../../features/hadith-explorer/domain/HadithCollection";
import type { HadithDocumentaryCategory } from "../../../features/hadith-explorer/domain/HadithCollection";
import HadithCard from "../../../features/hadith-explorer/presentation/HadithCard";
import HadithScreenHeader from "../../../features/hadith-explorer/presentation/HadithScreenHeader";
import { getHadithPreload } from "../../../features/hadith-explorer/services/hadithPreloader";
import { hadithLibraryService, type HadithLibraryEntry } from "../../../features/hadith-explorer/services/hadithLibraryService";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

const PAGE_SIZE = 20;
const COLLECTION_PROGRESS_PREFIX = "oumma:hadith:collection:last:v1:";

function categoryIcon(name: string): keyof typeof Ionicons.glyphMap {
  const value = name.toLocaleLowerCase("fr");
  if (/prière|adoration|mosquée/.test(value)) return "moon-outline";
  if (/foi|croyance|tawhid|iman|allah|ange/.test(value)) return "star-outline";
  if (/ablution|purif|eau/.test(value)) return "water-outline";
  if (/science|savoir|coran|quran|lecture/.test(value)) return "book-outline";
  if (/famille|enfant|parent|frère|sœur/.test(value)) return "people-outline";
  if (/commerce|argent|transaction|vente|achat|zakat|aumône/.test(value)) return "cash-outline";
  if (/invocation|dhikr|rappel|doua/.test(value)) return "hand-left-outline";
  if (/patience|comportement|morale|vertu|bonté/.test(value)) return "heart-outline";
  if (/jugement|justice|loi|droit/.test(value)) return "scale-outline";
  if (/jeûne|ramadan/.test(value)) return "moon-outline";
  if (/mariage|nikah|amour/.test(value)) return "heart-outline";
  if (/mort|paradis|enfer|résurrection/.test(value)) return "infinite-outline";
  return "sparkles-outline";
}

function collectionCover(id: string) {
  const covers: Record<string, number> = {
    bukhari: require("../../../assets/images/hadith-collections/sahih-bukhari.png"),
    muslim: require("../../../assets/images/hadith-collections/sahih-muslim.png"),
    "abu-dawud": require("../../../assets/images/hadith-collections/sunan-abu-dawud.png"),
    tirmidhi: require("../../../assets/images/hadith-collections/jami-tirmidhi.png"),
    nasai: require("../../../assets/images/hadith-collections/sunan-nasai.png"),
    "ibn-majah": require("../../../assets/images/hadith-collections/sunan-ibn-majah.png"),
    riyad: require("../../../assets/images/hadith-collections/riyad-as-salihin.png"),
    adab: require("../../../assets/images/hadith-collections/al-adab-al-mufrad.png"),
  };
  return covers[id];
}

export default function HadithCollectionDetailScreen() {
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();
  const collection = useMemo(() => getHadithCollection(collectionId), [collectionId]);
  const [items, setItems] = useState<HadithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [partialDisplayed, setPartialDisplayed] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lastRead, setLastRead] = useState<HadithLibraryEntry | null>(null);
  const [categories, setCategories] = useState<HadithDocumentaryCategory[]>([]);

  useEffect(() => {
    let active = true;
    if (!collection) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void getHadithPreload(collection.id).then((preload) => {
      if (!active || !preload?.items.length) return;
      setItems(preload.items);
      setPartialDisplayed(true);
      setLoading(false);
    }).then(() => Promise.all([
      hadithRepository.searchCollection(collection),
      hadithRepository.listCollectionCategories(collection),
      hadithLibraryService.history(),
      AsyncStorage.getItem(`${COLLECTION_PROGRESS_PREFIX}${collection.id}`),
    ]))
      .then(([results, loadedCategories, history, storedId]) => {
        if (!active) return;
        setItems(results);
        setPartialDisplayed(false);
        setCategories(loadedCategories);
        const direct = storedId ? history.find((entry) => entry.id === storedId) : undefined;
        setLastRead(direct ?? history.find((entry) => results.some((item) => item.id === entry.id)) ?? null);
      })
      .catch(() => active && setItems([]))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [collection]);

  if (!collection) {
    return (
      <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.emptyTitle}>Recueil introuvable</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const openHadith = async (id: string) => {
    await AsyncStorage.setItem(`${COLLECTION_PROGRESS_PREFIX}${collection.id}`, id);
    router.push(`/hadith/${id}` as Href);
  };

  const popularCategories = useMemo(
    () => categories.slice().sort((left, right) => right.hadithCount - left.hadithCount).slice(0, 6),
    [categories],
  );
  const visible = items.slice(0, visibleCount);
  const isNawawi = collection.id === "nawawi";

  return (
    <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}>
          <HadithScreenHeader
            title={collection.name}
            subtitle={collection.arabicName}
            right={(
              <View style={styles.headerActions}>
                <View style={styles.headerAction}>
                  <Ionicons name="bookmark-outline" size={21} color={colors.goldLight} />
                </View>
              </View>
            )}
          />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <LinearGradient colors={[`${collection.tone}E6`, "#201329"]} style={styles.hero}>
            {collectionCover(collection.id) ? <Image source={collectionCover(collection.id)} resizeMode="contain" style={styles.cover} /> : null}
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>{collection.name}</Text>
              <Text style={styles.heroDescription}>{collection.description}</Text>
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Ionicons name="book-outline" size={19} color={colors.goldLight} />
                  <Text style={styles.heroStatValue}>{loading ? "—" : items.length}</Text>
                  <Text style={styles.heroStatLabel}>hadiths</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Ionicons name="grid-outline" size={19} color={colors.goldLight} />
                  <Text style={styles.heroStatValue}>{categories.length}</Text>
                  <Text style={styles.heroStatLabel}>catégories</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroStat}>
                  <Ionicons name="shield-checkmark-outline" size={19} color={colors.goldLight} />
                  <Text style={styles.heroStatValue}>✓</Text>
                  <Text style={styles.heroStatLabel}>Authentique</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <Text style={styles.sectionTitle}>Explorer par catégorie</Text>
          <View style={styles.categoryGrid}>
            {popularCategories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => router.push(`/hadith/collection/${collection.id}/${category.id}` as Href)}
                style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]}
              >
                <View style={styles.categoryHeader}>
                  <Ionicons name={categoryIcon(category.name)} size={22} color={colors.goldLight} />
                  <Ionicons name="chevron-forward" size={17} color={colors.goldLight} />
                </View>
                <Text style={styles.categoryName}>{category.name?.trim() || "Catégorie documentaire"}</Text>
                <Text style={styles.categoryCount}>{category.hadithCount} hadiths</Text>
              </Pressable>
            ))}
          </View>

          {categories.length > popularCategories.length ? (
            <Pressable
              onPress={() => router.push(`/hadith/collection/${collection.id}/categories` as Href)}
              style={({ pressed }) => [styles.allCategoriesButton, pressed && styles.pressed]}
            >
              <Ionicons name="grid-outline" size={21} color={colors.goldLight} />
              <Text style={styles.allCategoriesText}>Voir toutes les catégories ({categories.length})</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.goldLight} />
            </Pressable>
          ) : null}

          {lastRead ? (
            <Pressable onPress={() => openHadith(lastRead.id)} style={({ pressed }) => [styles.lastCard, pressed && styles.pressed]}>
              <View style={styles.lastCopy}>
                <Text style={styles.lastEyebrow}>DERNIER HADITH CONSULTÉ</Text>
                <Text style={styles.lastTitle}>{isNawawi ? lastRead.title?.trim() || `Hadith ${items.findIndex((item) => item.id === lastRead.id) + 1}` : lastRead.title?.trim() || lastRead.reference}</Text>
                {!isNawawi ? <Text numberOfLines={1} style={styles.lastReference}>{lastRead.reference}</Text> : null}
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.goldLight} />
            </Pressable>
          ) : null}

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Tous les hadiths disponibles</Text>
            {!loading && !partialDisplayed ? <Text style={styles.count}>{items.length}</Text> : partialDisplayed || loading ? <ActivityIndicator color={colors.goldLight} /> : null}
          </View>

          {loading ? (
            <View style={styles.state}><ActivityIndicator color={colors.goldLight} /><Text style={styles.stateText}>Chargement des références…</Text></View>
          ) : items.length ? (
            <View style={styles.list}>
              {visible.map((item, index) => <HadithCard key={item.id} title={isNawawi ? `Hadith ${index + 1}` : item.title} subtitle={isNawawi ? undefined : `Référence HadeethEnc · ${item.id}`} index={index} onPress={() => openHadith(item.id)} />)}
              {visibleCount < items.length ? <Pressable onPress={() => setVisibleCount((value) => value + PAGE_SIZE)} style={styles.moreButton}><Text style={styles.moreText}>Afficher 20 hadiths supplémentaires</Text><Ionicons name="chevron-down" size={17} color={colors.goldLight} /></Pressable> : null}
            </View>
          ) : (
            <View style={styles.state}><Ionicons name="cloud-offline-outline" size={31} color={colors.textMuted} /><Text style={styles.emptyTitle}>Aucune référence chargée</Text><Text style={styles.stateText}>Vérifiez la connexion puis revenez sur ce recueil.</Text></View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, safe: { flex: 1 }, header: { paddingHorizontal: 18 }, headerActions: { flexDirection: "row", alignItems: "center", gap: 8 }, headerAction: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(35,23,49,0.92)", borderWidth: 1, borderColor: "rgba(227,181,90,0.2)" }, content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110 }, center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { padding: 16, borderRadius: 27, borderWidth: 1, borderColor: "rgba(255,232,183,0.24)", flexDirection: "row", gap: 14 }, cover: { width: 92, height: 132, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.2)" }, heroCopy: { flex: 1 }, heroTitle: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 20, fontWeight: "800" }, heroDescription: { color: "rgba(255,255,255,0.86)", fontFamily: typography.sans, fontSize: 11, lineHeight: 16, marginTop: 8 }, heroStats: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 }, heroStat: { flex: 1, alignItems: "center", gap: 2 }, heroStatValue: { color: colors.text, fontFamily: typography.sans, fontSize: 15, fontWeight: "800" }, heroStatLabel: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 8, textAlign: "center" }, heroDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.12)" },
  searchRow: { marginTop: 13 }, searchButton: { height: 50, borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: "rgba(227,181,90,0.09)", borderWidth: 1, borderColor: "rgba(227,181,90,0.16)" }, searchText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: "700" }, sectionTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 21, marginTop: 24, marginBottom: 12 }, categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, categoryCard: { width: "48%", minHeight: 100, borderRadius: 18, padding: 14, backgroundColor: "rgba(29,20,42,0.86)", borderWidth: 1, borderColor: "rgba(139,103,158,0.16)" }, categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, categoryName: { color: colors.text, fontFamily: typography.sans, fontSize: 14, lineHeight: 19, marginTop: 12 }, categoryCount: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11, marginTop: 7 }, allCategoriesButton: { minHeight: 58, marginTop: 14, paddingHorizontal: 15, borderRadius: 18, flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "rgba(29,20,42,0.86)", borderWidth: 1, borderColor: "rgba(227,181,90,0.2)" }, allCategoriesText: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 13, fontWeight: "700" },
  lastCard: { marginTop: 14, padding: 14, borderRadius: 18, flexDirection: "row", alignItems: "center", backgroundColor: "rgba(34,23,48,0.94)", borderWidth: 1, borderColor: "rgba(227,181,90,0.17)" }, lastCopy: { flex: 1 }, lastEyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 8.5, letterSpacing: 1.1, fontWeight: "800" }, lastTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 14, lineHeight: 19, marginTop: 4 }, lastReference: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5, marginTop: 3 }, listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, count: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "800", marginTop: 14 }, list: { gap: 9 }, state: { paddingVertical: 42, alignItems: "center", gap: 10 }, stateText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, textAlign: "center" }, emptyTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 20 }, moreButton: { height: 48, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "rgba(227,181,90,0.08)", marginTop: 4 }, moreText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "700" }, pressed: { opacity: 0.82 },
});
