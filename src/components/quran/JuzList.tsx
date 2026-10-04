import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import type { Juz } from "../../data/juz";
import { SURAHS } from "../../data/surahs";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useI18n } from "../../i18n";

type JuzListProps = {
  data: readonly Juz[];
  header: React.ReactElement;
  getSurahDisplayName: (surah: (typeof SURAHS)[number]) => string;
  onJuzPress: (juz: Juz) => void;
};

export default function JuzList({ data, header, getSurahDisplayName, onJuzPress }: JuzListProps) {
  const { t } = useI18n();
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Text style={styles.empty}>{t("quran.juzSearchEmpty")}</Text>
      }
      renderItem={({ item }) => {
        const surah =
          SURAHS.find((candidate) => candidate.id === item.startSurahId) ??
          SURAHS[0];
        return (
          <Pressable
            accessibilityRole="button"
            onPress={() => onJuzPress(item)}
            style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
          >
            <View style={styles.number}>
              <Text style={styles.numberLabel}>JUZ</Text>
              <Text style={styles.numberText}>{item.id}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>Juz {item.id}</Text>
              <Text style={styles.subtitle}>
                {t("quran.startsAt", { surah: surah.transliteration })}
              </Text>
              <Text style={styles.meta}>
                {t("quran.juzStartVerse", {
                  surah: getSurahDisplayName(surah),
                  verse: item.startVerse,
                })}
              </Text>
            </View>
            <Text numberOfLines={1} style={styles.arabic}>
              {surah.arabicName}
            </Text>
          </Pressable>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      initialNumToRender={12}
      maxToRenderPerBatch={10}
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
    width: 50,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#B78028",
    backgroundColor: "rgba(15,9,26,0.82)",
  },
  numberLabel: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 1.3,
  },
  numberText: {
    marginTop: 1,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 23,
  },
  copy: { flex: 1, minWidth: 0, marginLeft: 12 },
  title: { color: "#FFF8F1", fontFamily: typography.serifMedium, fontSize: 19 },
  subtitle: {
    marginTop: 2,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "700",
  },
  meta: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
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
  separator: { height: 8 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.992 }] },
  empty: {
    paddingVertical: 55,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 12,
    textAlign: "center",
  },
});
