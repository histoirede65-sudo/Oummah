import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import type { Juz } from "../../data/juz";
import { SURAHS } from "../../data/surahs";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type JuzListProps = {
  data: readonly Juz[];
  header: React.ReactElement;
  onJuzPress: (juz: Juz) => void;
};

export default function JuzList({ data, header, onJuzPress }: JuzListProps) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={header}
      ListEmptyComponent={
        <Text style={styles.empty}>
          Aucun Juz ne correspond à cette recherche.
        </Text>
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
            <LinearGradient
              colors={["rgba(42,25,54,0.97)", "rgba(17,13,27,0.99)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.glow} />
            <View style={styles.number}>
              <Text style={styles.numberLabel}>JUZ</Text>
              <Text style={styles.numberText}>{item.id}</Text>
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>Juz {item.id}</Text>
              <Text style={styles.subtitle}>
                Commence à {surah.transliteration}
              </Text>
              <Text style={styles.meta}>
                {surah.frenchName} · Verset {item.startVerse}
              </Text>
            </View>
            <View style={styles.arabicPill}>
              <Text numberOfLines={1} style={styles.arabic}>
                {surah.arabicName}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={16} color={colors.goldLight} />
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
    height: 96,
    overflow: "hidden",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(190,139,56,0.38)",
    backgroundColor: colors.surface,
  },
  glow: {
    position: "absolute",
    top: -40,
    right: 32,
    width: 150,
    height: 94,
    borderRadius: 75,
    backgroundColor: "rgba(229,182,81,0.055)",
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
  arabicPill: {
    maxWidth: "27%",
    marginRight: 9,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(229,182,81,0.25)",
    backgroundColor: "rgba(229,182,81,0.07)",
  },
  arabic: {
    color: "#F0C66A",
    fontFamily: typography.arabic,
    fontSize: 19,
    textAlign: "right",
    writingDirection: "rtl",
    textShadowColor: "rgba(229,182,81,0.45)",
    textShadowRadius: 8,
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
