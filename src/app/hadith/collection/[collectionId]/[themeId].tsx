import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hadithRepository } from "../../../../features/hadith-explorer/data/hadithRepository";
import type { HadithSummary } from "../../../../features/hadith-explorer/domain/Hadith";
import {
  getHadithCollection,
  getHadithCollectionTheme,
} from "../../../../features/hadith-explorer/domain/HadithCollection";
import HadithCard from "../../../../features/hadith-explorer/presentation/HadithCard";
import HadithScreenHeader from "../../../../features/hadith-explorer/presentation/HadithScreenHeader";
import { colors } from "../../../../theme/colors";
import { typography } from "../../../../theme/typography";

const PAGE_SIZE = 20;

export default function HadithCollectionThemeScreen() {
  const { collectionId, themeId } = useLocalSearchParams<{
    collectionId: string;
    themeId: string;
  }>();

  const collection = useMemo(() => getHadithCollection(collectionId), [collectionId]);
  const theme = useMemo(() => getHadithCollectionTheme(themeId), [themeId]);
  const [items, setItems] = useState<HadithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let active = true;

    if (!collection || !theme) {
      setLoading(false);
      setItems([]);
      return;
    }

    setLoading(true);
    setVisibleCount(PAGE_SIZE);

    void hadithRepository
      .searchCollectionTheme(collection, theme.query)
      .then((results) => {
        if (active) setItems(results);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [collection, theme]);

  if (!collection || !theme) {
    return (
      <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
        <SafeAreaView style={styles.center}>
          <Text style={styles.emptyTitle}>Catégorie introuvable</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const visibleItems = items.slice(0, visibleCount);

  return (
    <LinearGradient colors={["#080713", "#120A1D", "#080713"]} style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.header}>
          <HadithScreenHeader title={theme.name} subtitle={collection.name} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <LinearGradient colors={[`${collection.tone}D9`, "#201329"]} style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons name={theme.icon as never} size={25} color={colors.goldLight} />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>CATÉGORIE</Text>
              <Text style={styles.heroTitle}>{theme.name}</Text>
              <Text style={styles.heroCollection}>{collection.name}</Text>
            </View>
          </LinearGradient>

          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Hadiths de cette catégorie</Text>
            {!loading ? (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{items.length}</Text>
              </View>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={colors.goldLight} />
              <Text style={styles.stateText}>Classement des hadiths de cette catégorie…</Text>
            </View>
          ) : items.length ? (
            <View style={styles.list}>
              {visibleItems.map((item, index) => (
                <HadithCard
                  key={item.id}
                  title={item.title}
                  subtitle={`${collection.name} · ${theme.name}`}
                  index={index}
                  onPress={() => router.push(`/hadith/${item.id}` as Href)}
                />
              ))}

              {visibleCount < items.length ? (
                <Pressable
                  onPress={() => setVisibleCount((value) => value + PAGE_SIZE)}
                  style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}
                >
                  <Text style={styles.moreText}>Afficher 20 hadiths supplémentaires</Text>
                  <Ionicons name="chevron-down" size={17} color={colors.goldLight} />
                </Pressable>
              ) : null}
            </View>
          ) : (
            <View style={styles.state}>
              <Ionicons name="library-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Aucun hadith classé ici</Text>
              <Text style={styles.stateText}>
                Aucun hadith de la sélection HadeethEnc de ce recueil ne correspond actuellement à cette catégorie.
              </Text>
            </View>
          )}

          <Text style={styles.credit}>
            Classement thématique OUMMAH appliqué aux références HadeethEnc disponibles dans ce recueil.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },
  header: { paddingHorizontal: 18 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: {
    padding: 19,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,232,183,0.24)",
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20,12,28,0.28)",
    borderWidth: 1,
    borderColor: "rgba(244,213,138,0.22)",
  },
  heroCopy: { flex: 1 },
  heroEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 25,
    marginTop: 4,
  },
  heroCollection: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: typography.sans,
    fontSize: 11,
    marginTop: 4,
  },
  listHeader: {
    marginTop: 27,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 23,
  },
  countBadge: {
    minWidth: 40,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(227,181,90,0.16)",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.24)",
  },
  countText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 15,
    lineHeight: 18,
    fontWeight: "800",
    textAlign: "center",
    includeFontPadding: false,
  },
  list: { gap: 9 },
  state: { paddingVertical: 58, alignItems: "center", gap: 10 },
  stateText: {
    maxWidth: 290,
    textAlign: "center",
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11.5,
    lineHeight: 17,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 20,
  },
  moreButton: {
    marginTop: 5,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(227,181,90,0.08)",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.15)",
  },
  moreText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "700",
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.992 }] },
  credit: {
    color: "#6D6475",
    fontFamily: typography.sans,
    fontSize: 9.5,
    lineHeight: 14,
    textAlign: "center",
    marginTop: 26,
  },
});
