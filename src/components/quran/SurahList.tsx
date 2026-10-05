import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Surah } from "../../data/surahs";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useI18n } from "../../i18n";

type SurahListProps = {
  data: Surah[];
  header: React.ReactElement;
  getSurahDisplayName: (surah: Surah) => string;
  onSurahPress: (surah: Surah) => void;
  favoriteSurahIds: Set<number>;
  onToggleFavorite: (surahId: number) => void;
  emptyMessage?: string;
};

export default function SurahList({
  data,
  header,
  getSurahDisplayName,
  onSurahPress,
  favoriteSurahIds,
  onToggleFavorite,
  emptyMessage,
}: SurahListProps) {
  const { t } = useI18n();

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="search-outline"
              size={27}
              color={colors.goldLight}
            />
          </View>
          <Text style={styles.emptyText}>
            {emptyMessage ?? t("quran.empty")}
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const favorite = favoriteSurahIds.has(item.id);
        return (
          // Favorites are toggled with a long press; only favorite surahs show a heart.
          <Pressable
            accessibilityRole="button"
            accessibilityHint={favorite ? t("quran.removeSurahFavorite") : t("quran.addSurahFavorite")}
            accessibilityActions={[{ name: "longpress", label: favorite ? t("quran.removeSurahFavorite") : t("quran.addSurahFavorite") }]}
            onAccessibilityAction={() => onToggleFavorite(item.id)}
            onPress={() => onSurahPress(item)}
            onLongPress={() => onToggleFavorite(item.id)}
            delayLongPress={350}
            style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
          >
            <Text style={styles.numberText}>{item.id}</Text>

            <View style={styles.main}>
              <View style={styles.titleRow}>
                <Text numberOfLines={1} style={styles.transliteration}>
                  {item.transliteration}
                </Text>
                {favorite ? (
                  <Ionicons name="heart" size={12} color={colors.goldLight} />
                ) : null}
              </View>
              <Text numberOfLines={1} style={styles.meta}>
                {getSurahDisplayName(item)}
                {"  ·  "}
                {t("common.verseCount", { count: item.verses })}
              </Text>
            </View>

            <Text numberOfLines={1} style={styles.arabic}>
              {item.arabicName}
            </Text>
          </Pressable>
        );
      }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      initialNumToRender={12}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={40}
      windowSize={7}
      removeClippedSubviews
    />
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 18, paddingBottom: 108 },
  cell: {
    minHeight: 72,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(227,181,90,0.18)",
  },
  numberText: {
    width: 32,
    color: "rgba(227,181,90,0.75)",
    fontFamily: typography.sans,
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  main: { flex: 1, minWidth: 0, marginLeft: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  transliteration: {
    flexShrink: 1,
    color: "#FFF8F1",
    fontFamily: typography.serifMedium,
    fontSize: 22,
    lineHeight: 27,
  },
  meta: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 13,
  },
  arabic: {
    maxWidth: "38%",
    marginLeft: 12,
    color: "#F2C86C",
    fontFamily: typography.arabic,
    fontSize: 26,
    lineHeight: 38,
    textAlign: "right",
    writingDirection: "rtl",
  },
  pressed: { opacity: 0.6 },
  empty: { paddingVertical: 55, alignItems: "center" },
  emptyIcon: {
    width: 58,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 29,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  emptyText: {
    marginTop: 11,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
  },
});
