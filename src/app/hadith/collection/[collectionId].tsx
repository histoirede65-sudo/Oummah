import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hadithRepository } from "../../../features/hadith-explorer/data/hadithRepository";
import type { HadithSummary } from "../../../features/hadith-explorer/domain/Hadith";
import { getHadithCollection, HADITH_COLLECTION_THEMES } from "../../../features/hadith-explorer/domain/HadithCollection";
import HadithCard from "../../../features/hadith-explorer/presentation/HadithCard";
import HadithScreenHeader from "../../../features/hadith-explorer/presentation/HadithScreenHeader";
import { hadithLibraryService, type HadithLibraryEntry } from "../../../features/hadith-explorer/services/hadithLibraryService";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

const PAGE_SIZE = 20;
const COLLECTION_PROGRESS_PREFIX = "oumma:hadith:collection:last:v1:";

export default function HadithCollectionDetailScreen() {
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();
  const collection = useMemo(() => getHadithCollection(collectionId), [collectionId]);
  const [items, setItems] = useState<HadithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [lastRead, setLastRead] = useState<HadithLibraryEntry | null>(null);

  useEffect(() => {
    let active = true;
    if (!collection) {
      setLoading(false);
      return;
    }

    setLoading(true);
    void Promise.all([
      hadithRepository.searchCollection(collection),
      hadithLibraryService.history(),
      AsyncStorage.getItem(`${COLLECTION_PROGRESS_PREFIX}${collection.id}`),
    ])
      .then(([results, history, storedId]) => {
        if (!active) return;
        setItems(results);
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

  const visible = items.slice(0, visibleCount);

  return (
    <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}>
          <HadithScreenHeader title={collection.name} subtitle={collection.arabicName} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <LinearGradient colors={[`${collection.tone}E6`, "#201329"]} style={styles.hero}>
            <Text style={styles.heroArabic}>{collection.arabicName}</Text>
            <Text style={styles.heroTitle}>{collection.name}</Text>
            <Text style={styles.heroDescription}>{collection.description}</Text>
            <View style={styles.heroMeta}>
              <Ionicons name="library-outline" size={16} color="#F4D58A" />
              <Text style={styles.heroMetaText}>
                {loading ? "Chargement…" : `${items.length} hadith${items.length > 1 ? "s" : ""} disponibles`}
              </Text>
            </View>
          </LinearGradient>

          {lastRead ? (
            <Pressable onPress={() => openHadith(lastRead.id)} style={({ pressed }) => [styles.lastCard, pressed && styles.pressed]}>
              <View style={styles.lastIcon}>
                <Ionicons name="bookmark-outline" size={20} color={colors.goldLight} />
              </View>
              <View style={styles.lastCopy}>
                <Text style={styles.lastEyebrow}>DERNIER HADITH CONSULTÉ</Text>
                <Text numberOfLines={2} style={styles.lastTitle}>{lastRead.title}</Text>
                <Text numberOfLines={1} style={styles.lastReference}>{lastRead.reference}</Text>
              </View>
              <Ionicons name="arrow-forward" size={18} color={colors.goldLight} />
            </Pressable>
          ) : null}

          <View style={styles.searchRow}>
            <Pressable
              onPress={() => router.push({ pathname: "/hadith/search", params: { q: collection.query, collection: collection.name, collectionId: collection.id } })}
              style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]}
            >
              <Ionicons name="search-outline" size={19} color={colors.goldLight} />
              <Text style={styles.searchText}>Rechercher dans ce recueil</Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Explorer par catégorie</Text>
          <View style={styles.themeGrid}>
            {HADITH_COLLECTION_THEMES.map((theme) => (
              <Pressable
                key={theme.id}
                onPress={() => router.push(`/hadith/collection/${collection.id}/${theme.id}` as Href)}
                style={({ pressed }) => [styles.themeCard, pressed && styles.pressed]}
              >
                <View style={styles.themeIcon}>
                  <Ionicons name={theme.icon as never} size={19} color={colors.goldLight} />
                </View>
                <Text style={styles.themeName}>{theme.name}</Text>
                <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Tous les hadiths disponibles</Text>
            {!loading ? <Text style={styles.count}>{items.length}</Text> : null}
          </View>

          {loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.goldLight} />
              <Text style={styles.stateText}>Chargement des références…</Text>
            </View>
          ) : items.length ? (
            <View style={styles.list}>
              {visible.map((item, index) => (
                <HadithCard
                  key={item.id}
                  title={item.title}
                  subtitle={`Référence HadeethEnc · ${item.id}`}
                  index={index}
                  onPress={() => openHadith(item.id)}
                />
              ))}
              {visibleCount < items.length ? (
                <Pressable onPress={() => setVisibleCount((value) => value + PAGE_SIZE)} style={styles.moreButton}>
                  <Text style={styles.moreText}>Afficher 20 hadiths supplémentaires</Text>
                  <Ionicons name="chevron-down" size={17} color={colors.goldLight} />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.state}>
              <Ionicons name="cloud-offline-outline" size={31} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Aucune référence chargée</Text>
              <Text style={styles.stateText}>Vérifiez la connexion puis revenez sur ce recueil.</Text>
            </View>
          )}

          <Text style={styles.credit}>Sélection française HadeethEnc · un hadith peut être référencé dans plusieurs recueils.</Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, safe: { flex: 1 }, header: { paddingHorizontal: 18 }, content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { padding: 22, borderRadius: 27, borderWidth: 1, borderColor: "rgba(255,232,183,0.24)" }, heroArabic: { color: "#FFF8EC", fontFamily: "UthmanicHafs", fontSize: 28, textAlign: "right" }, heroTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 27, marginTop: 13 }, heroDescription: { color: "rgba(255,255,255,0.74)", fontFamily: typography.sans, fontSize: 12, lineHeight: 18, marginTop: 8 }, heroMeta: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 18 }, heroMetaText: { color: "#F4D58A", fontFamily: typography.sans, fontSize: 11, fontWeight: "700" },
  lastCard: { marginTop: 13, padding: 15, borderRadius: 21, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(34,23,48,0.94)", borderWidth: 1, borderColor: "rgba(227,181,90,0.17)" }, lastIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.1)" }, lastCopy: { flex: 1 }, lastEyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 8.5, letterSpacing: 1.1, fontWeight: "800" }, lastTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 14, lineHeight: 19, marginTop: 4 }, lastReference: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5, marginTop: 3 },
  searchRow: { marginTop: 13 }, searchButton: { height: 50, borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, backgroundColor: "rgba(227,181,90,0.09)", borderWidth: 1, borderColor: "rgba(227,181,90,0.16)" }, searchText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12, fontWeight: "700" },
  sectionTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 21, marginTop: 26, marginBottom: 12 }, themeGrid: { gap: 8 }, themeCard: { minHeight: 58, borderRadius: 18, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "rgba(29,20,42,0.86)", borderWidth: 1, borderColor: "rgba(139,103,158,0.16)" }, themeIcon: { width: 36, height: 36, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.08)" }, themeName: { flex: 1, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13 },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, count: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "800", marginTop: 14 }, list: { gap: 9 }, state: { paddingVertical: 42, alignItems: "center", gap: 10 }, stateText: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, textAlign: "center" }, emptyTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 20 }, moreButton: { height: 48, borderRadius: 17, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "rgba(227,181,90,0.08)", marginTop: 4 }, moreText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "700" }, credit: { color: "#6D6475", fontFamily: typography.sans, fontSize: 9.5, textAlign: "center", lineHeight: 14, marginTop: 25 }, pressed: { opacity: 0.82 },
});
