import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { HOME_DEEPER, HOME_ESSENTIALS, type HomeModule } from "../components/home/homeModules";
import { type TranslationKey, useI18n } from "../i18n";
import { colors } from "../theme/colors";
import { typography } from "../theme/typography";

const COLUMNS = 3;
const GAP = 10;
const SIDE = 16;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’'‘]/g, "").trim();
}

/** Every module of the app on one page, in the two groups of the home screen, with a search field. */
export default function ModulesScreen() {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const tileWidth = Math.floor((Math.min(width, 520) - SIDE * 2 - GAP * (COLUMNS - 1)) / COLUMNS);

  const groups = useMemo(() => {
    const search = normalize(query);
    const keep = (item: HomeModule) =>
      !search || normalize(`${t(item.labelKey as TranslationKey)} ${t(item.subtitleKey as TranslationKey)}`).includes(search);
    return [
      { title: t("home.essentials"), items: HOME_ESSENTIALS.filter(keep) },
      { title: t("home.goDeeper"), items: HOME_DEEPER.filter(keep) },
    ].filter((group) => group.items.length > 0);
  }, [query, t]);

  return (
    <SafeAreaView edges={["top"]} style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" hitSlop={8} onPress={() => router.back()} style={styles.back}>
          <Ionicons name="chevron-back" size={22} color={colors.goldLight} />
        </Pressable>
        <Text style={styles.title}>{t("modules.title")}</Text>
      </View>

      <View style={styles.search}>
        <Ionicons name="search" size={17} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t("modules.search")}
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCorrect={false}
          returnKeyType="search"
        />
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Effacer" hitSlop={8} onPress={() => setQuery("")}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.grid}>
              {group.items.map((item) => {
                const label = t(item.labelKey as TranslationKey);
                return (
                  <Pressable
                    key={item.labelKey}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    onPress={() => router.push(item.route as Href)}
                    style={({ pressed }) => [{ width: tileWidth }, pressed && styles.pressed]}
                  >
                    <Image source={item.image} contentFit="cover" transition={150} style={[styles.tileImage, { height: tileWidth }]} />
                    <Text numberOfLines={2} style={styles.tileLabel}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
        {groups.length === 0 ? <Text style={styles.empty}>{t("modules.empty", { query })}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: SIDE, paddingTop: 6, paddingBottom: 12 },
  back: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.35)",
  },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 28 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: SIDE,
    marginBottom: 6,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: colors.surface,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 15, paddingVertical: 0 },
  content: { paddingHorizontal: SIDE, paddingBottom: 40 },
  group: { marginTop: 18 },
  groupTitle: {
    marginBottom: 12,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP, rowGap: 16 },
  tileImage: { width: "100%", borderRadius: 16, borderWidth: 1, borderColor: "rgba(227,181,90,0.22)", backgroundColor: colors.surface },
  tileLabel: { marginTop: 7, color: colors.text, fontFamily: typography.sans, fontSize: 12.5, fontWeight: "500", textAlign: "center" },
  empty: { marginTop: 30, color: colors.textMuted, fontFamily: typography.sans, fontSize: 14, textAlign: "center" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
