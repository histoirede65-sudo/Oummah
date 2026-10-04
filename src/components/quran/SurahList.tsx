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
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => onSurahPress(item)}
          style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
        >
          <View style={styles.number}>
            <Text style={styles.numberText}>{item.id}</Text>
          </View>

          <View style={styles.main}>
            <Text numberOfLines={1} style={styles.french}>
              {getSurahDisplayName(item)}
            </Text>
            <Text numberOfLines={1} style={styles.transliteration}>
              {item.transliteration}
            </Text>
            <Text numberOfLines={1} style={styles.meta}>
              {t("common.verseCount", { count: item.verses })}
              {"  ·  "}
              {item.revelationType === "Médine"
                ? t("surahReader.medina")
                : t("surahReader.mecca")}
              {"  ·  "}
              Juz {item.juzStart}
            </Text>
          </View>

          <Text numberOfLines={1} style={styles.arabic}>
            {item.arabicName}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              favoriteSurahIds.has(item.id)
                ? t("quran.removeSurahFavorite")
                : t("quran.addSurahFavorite")
            }
            hitSlop={8}
            onPress={(event) => {
              event.stopPropagation();
              onToggleFavorite(item.id);
            }}
            style={({ pressed }) => [
              styles.favoriteButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={favoriteSurahIds.has(item.id) ? "heart" : "heart-outline"}
              size={18}
              color={favoriteSurahIds.has(item.id) ? colors.goldLight : "rgba(227,181,90,0.55)"}
            />
          </Pressable>
        </Pressable>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
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
  content: { paddingHorizontal: 14, paddingBottom: 108 },
  cell: {
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.13)",
    backgroundColor: colors.surface,
  },
  number: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.55)",
  },
  numberText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  main: { flex: 1, minWidth: 0, marginLeft: 12 },
  french: {
    color: "#FFF8F1",
    fontFamily: typography.serifMedium,
    fontSize: 19,
    lineHeight: 22,
  },
  transliteration: {
    marginTop: 1,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: "600",
  },
  meta: {
    marginTop: 4,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
  },
  arabic: {
    maxWidth: "34%",
    marginLeft: 10,
    color: "#F2C86C",
    fontFamily: typography.arabic,
    fontSize: 23,
    lineHeight: 34,
    textAlign: "right",
    writingDirection: "rtl",
  },
  favoriteButton: {
    width: 32,
    height: 32,
    marginLeft: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  separator: { height: 8 },
  pressed: { opacity: 0.68, transform: [{ scale: 0.992 }] },
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
