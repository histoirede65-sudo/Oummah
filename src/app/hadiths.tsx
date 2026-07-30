import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { hadithRepository } from "../features/hadith-explorer/data/hadithRepository";
import type { Hadith } from "../features/hadith-explorer/domain/Hadith";
import { HADITH_THEMES } from "../features/hadith-explorer/domain/HadithTheme";
import DailyHadithCard from "../features/hadith-explorer/presentation/DailyHadithCard";
import {
  hadithLibraryService,
  type HadithLibraryEntry,
} from "../features/hadith-explorer/services/hadithLibraryService";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const ACTIONS = [
  {
    label: "Collections",
    subtitle: "Sources",
    icon: "library-outline",
    route: "/hadith/collections",
  },
  {
    label: "Thèmes",
    subtitle: "Explorer",
    icon: "grid-outline",
    route: "/hadith/themes",
  },
  {
    label: "Recherche",
    subtitle: "Trouver",
    icon: "search-outline",
    route: "/hadith/search",
  },
] as const;

export default function HadithHomeScreen() {
  const [daily, setDaily] = useState<Hadith | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<HadithLibraryEntry[]>([]);
  const [history, setHistory] = useState<HadithLibraryEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);

      void Promise.all([
        hadithRepository.daily(),
        hadithLibraryService.favorites(),
        hadithLibraryService.history(),
      ])
        .then(([hadith, saved, recent]) => {
          if (!active) return;
          setDaily(hadith);
          setFavorites(saved);
          setHistory(recent);
          setLoading(false);
        })
        .catch(() => active && setLoading(false));

      return () => {
        active = false;
      };
    }, []),
  );

  const open = (id: string) => router.push(`/hadith/${id}` as Href);

  return (
    <LinearGradient
      colors={["#090713", "#120A1D", "#090713"]}
      style={styles.screen}
    >
      <SafeAreaView edges={["top"]} style={styles.safe}>
        <View style={styles.localHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.headerCircle,
              pressed && styles.headerPressed,
            ]}
          >
            <Ionicons name="arrow-back" size={21} color={colors.goldLight} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerEyebrow}>OUMMAH</Text>
            <Text style={styles.headerTitle}>Hadith</Text>
          </View>

          <View
            accessibilityElementsHidden
            importantForAccessibility="no"
            style={styles.headerCircle}
          >
            <Ionicons
              name="heart-outline"
              size={21}
              color={colors.goldLight}
            />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <DailyHadithCard
            hadith={daily}
            loading={loading}
            onPress={() => daily && open(daily.id)}
          />

          <View style={styles.actions}>
            {ACTIONS.map((action) => (
              <Pressable
                key={action.route}
                onPress={() => router.push(action.route as Href)}
                style={({ pressed }) => [
                  styles.action,
                  pressed && styles.pressed,
                ]}
              >
                <LinearGradient
                  colors={["rgba(73,42,91,0.88)", "rgba(27,18,40,0.96)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.actionGlow} />
                <View style={styles.actionIcon}>
                  <Ionicons
                    name={action.icon}
                    size={21}
                    color={colors.goldLight}
                  />
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </Pressable>
            ))}
          </View>

          <SectionTitle
            title="Explorer par thème"
            action="Tout voir"
            onPress={() => router.push("/hadith/themes" as Href)}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themeRow}
          >
            {HADITH_THEMES.slice(0, 7).map((theme) => (
              <Pressable
                key={theme.id}
                onPress={() =>
                  router.push({
                    pathname: "/hadith/search",
                    params: { q: theme.query, theme: theme.label },
                  })
                }
                style={({ pressed }) => [
                  styles.theme,
                  pressed && styles.themePressed,
                ]}
              >
                <View
                  style={[
                    styles.themeIcon,
                    { backgroundColor: `${theme.color}24` },
                  ]}
                >
                  <Ionicons
                    name={theme.icon as never}
                    size={19}
                    color={theme.color}
                  />
                  <LinearGradient
                    colors={["rgba(227,181,90,0)", "rgba(227,181,90,0.9)", "rgba(227,181,90,0)"]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.themeGlowLine}
                  />
                </View>
                <Text style={styles.themeLabel}>{theme.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.libraryRow}>
            <LibraryCard
              icon="bookmark-outline"
              title="Mes favoris"
              count={favorites.length}
              empty="Vos hadiths enregistrés"
              onPress={() =>
                router.push({
                  pathname: "/hadith/search",
                  params: { view: "favorites" },
                })
              }
            />
            <LibraryCard
              icon="time-outline"
              title="Continuer"
              count={history.length}
              empty="Votre historique de lecture"
              onPress={() => history[0] && open(history[0].id)}
            />
          </View>

          {history.length ? (
            <>
              <SectionTitle title="Lus récemment" />
              <View style={styles.recentList}>
                {history.slice(0, 3).map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => open(item.id)}
                    style={({ pressed }) => [
                      styles.recent,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.bookCover}>
                      <LinearGradient
                        colors={["#5A3569", "#24172F"]}
                        style={StyleSheet.absoluteFill}
                      />
                      <View style={styles.bookSpine} />
                      <Ionicons
                        name="book-outline"
                        size={22}
                        color={colors.goldLight}
                      />
                    </View>

                    <View style={styles.recentCopy}>
                      <Text numberOfLines={2} style={styles.recentTitle}>
                        {item.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.recentMeta}>
                        {item.reference}
                      </Text>
                      <View style={styles.recentGrade}>
                        <View style={styles.recentGradeDot} />
                        <Text style={styles.recentGradeText}>{item.grade}</Text>
                      </View>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={17}
                      color={colors.goldLight}
                    />
                  </Pressable>
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.trust}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#78CCA2"
            />
            <View style={styles.trustCopy}>
              <Text style={styles.trustTitle}>Une source visible, toujours</Text>
              <Text style={styles.trustText}>
                Texte, traduction, attribution et classification proviennent de
                HadeethEnc. Toute divergence indiquée par la source reste
                affichée.
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

function SectionTitle({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionAccent} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action ? (
        <Pressable onPress={onPress}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function LibraryCard({
  icon,
  title,
  count,
  empty,
  onPress,
}: {
  icon: string;
  title: string;
  count: number;
  empty: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.library,
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={["rgba(64,35,78,0.94)", "rgba(27,18,39,0.96)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.libraryGlow} />
      <View style={styles.libraryIcon}>
        <Ionicons
          name={icon as never}
          size={22}
          color={colors.goldLight}
        />
      </View>
      <Text style={styles.libraryTitle}>{title}</Text>
      <Text style={styles.libraryCount}>
        {count ? `${count} enregistré${count > 1 ? "s" : ""}` : empty}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={colors.goldLight}
        style={styles.libraryChevron}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe: { flex: 1 },

  localHeader: {
    height: 76,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerCircle: {
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 23,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.22)",
    backgroundColor: "rgba(24,13,39,0.86)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 9,
  },
  headerCenter: { alignItems: "center" },
  headerEyebrow: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 3,
  },
  headerTitle: {
    marginTop: -2,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 31,
  },
  headerPressed: { opacity: 0.58 },

  content: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },

  actions: {
    flexDirection: "row",
    gap: 9,
    marginTop: 16,
  },
  action: {
    flex: 1,
    minHeight: 108,
    borderRadius: 23,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(128,80,151,0.30)",
    padding: 13,
  },
  actionGlow: {
    position: "absolute",
    top: -28,
    right: -18,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(227,181,90,0.06)",
  },
  actionIcon: {
    width: 39,
    height: 39,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(227,181,90,0.11)",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.14)",
    marginBottom: 10,
  },
  actionLabel: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 14,
    fontWeight: "700",
  },
  actionSubtitle: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  sectionHeader: {
    marginTop: 29,
    marginBottom: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  sectionAccent: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.gold,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 21,
    fontWeight: "700",
  },
  sectionAction: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "700",
  },

  themeRow: {
    gap: 11,
    paddingRight: 20,
  },
  theme: {
    width: 84,
    alignItems: "center",
    gap: 8,
  },
  themePressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  themeIcon: {
    width: 54,
    height: 54,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
  },
  themeLabel: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "600",
  },
  themeGlowLine: {
    position: "absolute",
    bottom: 5,
    width: 28,
    height: 2,
    borderRadius: 1,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
  },

  libraryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 29,
  },
  library: {
    flex: 1,
    minHeight: 126,
    padding: 16,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.17)",
  },
  libraryGlow: {
    position: "absolute",
    top: -42,
    right: -30,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(227,181,90,0.06)",
  },
  libraryIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(227,181,90,0.10)",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.14)",
  },
  libraryTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 17,
    fontWeight: "700",
    marginTop: 13,
  },
  libraryCount: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
    lineHeight: 15,
    marginTop: 4,
    paddingRight: 18,
  },
  libraryChevron: {
    position: "absolute",
    right: 14,
    bottom: 14,
  },

  recentList: { gap: 10 },
  recent: {
    minHeight: 94,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderRadius: 21,
    backgroundColor: "rgba(28,19,41,0.82)",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.10)",
  },
  bookCover: {
    width: 54,
    height: 68,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.28)",
  },
  bookSpine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: "rgba(8,6,13,0.42)",
    borderRightWidth: 1,
    borderRightColor: "rgba(227,181,90,0.16)",
  },
  recentCopy: { flex: 1 },
  recentTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
  },
  recentMeta: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10,
    marginTop: 5,
  },
  recentGrade: {
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(87,180,130,0.10)",
    borderWidth: 1,
    borderColor: "rgba(105,203,156,0.20)",
  },
  recentGradeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#78CCA2",
  },
  recentGradeText: {
    color: "#9DE0BB",
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "700",
  },

  trust: {
    marginTop: 29,
    padding: 17,
    flexDirection: "row",
    gap: 12,
    borderRadius: 22,
    backgroundColor: "rgba(52,111,84,0.1)",
    borderWidth: 1,
    borderColor: "rgba(105,203,156,0.18)",
  },
  trustCopy: { flex: 1 },
  trustTitle: {
    color: "#9DE0BB",
    fontFamily: typography.sans,
    fontWeight: "700",
    fontSize: 12,
  },
  trustText: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
    lineHeight: 16,
    marginTop: 4,
  },
});

