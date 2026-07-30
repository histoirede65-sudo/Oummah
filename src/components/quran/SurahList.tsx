import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
  onSurahPress: (surah: Surah) => void;
  favoriteSurahIds: Set<number>;
  onToggleFavorite: (surahId: number) => void;
  emptyMessage?: string;
};

export default function SurahList({
  data,
  header,
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
          <LinearGradient
            colors={["rgba(36,23,49,0.96)", "rgba(18,14,29,0.98)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.cellGradient]}
          />
          <Image
            pointerEvents="none"
            source={require("../../assets/images/home/shortcuts/quran-real.jpg")}
            contentFit="cover"
            contentPosition={item.id % 2 === 0 ? "70% center" : "55% center"}
            style={[
              styles.quranTexture,
              item.id % 2 === 0 && styles.quranTextureAlternate,
            ]}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(27,17,39,0.99)",
              "rgba(31,18,44,0.88)",
              "rgba(35,18,48,0.40)",
            ]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={[StyleSheet.absoluteFill, styles.quranVeil]}
          />
          <View pointerEvents="none" style={styles.liquidOrb} />

          <View style={styles.number}>
            <Text style={styles.numberText}>{item.id}</Text>
          </View>

          <View style={styles.main}>
            <Text numberOfLines={1} style={styles.french}>
              {item.frenchName}
            </Text>
            <Text numberOfLines={1} style={styles.transliteration}>
              {item.transliteration}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{item.verses} versets</Text>
              <View style={styles.metaDot} />
              <Text style={styles.meta}>{item.revelationType}</Text>
              <View style={styles.juzPill}>
                <Text style={styles.juzText}>Juz {item.juzStart}</Text>
              </View>
            </View>
          </View>

          <View style={styles.arabicBlock}>
            <View style={styles.arabicGlow}>
              <View pointerEvents="none" style={styles.arabicShine} />
              <Text numberOfLines={1} style={styles.arabic}>
                {item.arabicName}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                favoriteSurahIds.has(item.id)
                  ? "Retirer cette sourate des favoris"
                  : "Ajouter cette sourate aux favoris"
              }
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
                size={19}
                color={colors.goldLight}
              />
            </Pressable>
            <Ionicons
              name="arrow-forward"
              size={14}
              color="rgba(227,181,90,0.70)"
            />
          </View>
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
    height: 96,
    overflow: "hidden",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(100,58,122,0.48)",
    backgroundColor: colors.surface,
  },
  cellGradient: { borderRadius: 19 },
  quranTexture: {
    position: "absolute",
    top: -12,
    right: -18,
    width: "48%",
    height: 122,
    opacity: 0.23,
    transform: [{ rotate: "-2deg" }],
  },
  quranTextureAlternate: {
    top: -19,
    right: -4,
    opacity: 0.19,
    transform: [{ rotate: "2deg" }],
  },
  quranVeil: { borderRadius: 19 },
  liquidOrb: {
    position: "absolute",
    top: -52,
    right: 56,
    width: 132,
    height: 102,
    borderRadius: 66,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  number: {
    width: 47,
    height: 47,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 1.2,
    borderColor: "#B78028",
    backgroundColor: "rgba(18,10,30,0.82)",
  },
  numberText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "800",
  },
  main: { flex: 1, minWidth: 0, marginLeft: 12 },
  french: {
    color: "#FFF8F1",
    fontFamily: typography.serifMedium,
    fontSize: 20,
    lineHeight: 23,
  },
  transliteration: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: "600",
  },
  metaRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  meta: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
  },
  metaDot: {
    width: 3,
    height: 3,
    marginHorizontal: 5,
    borderRadius: 2,
    backgroundColor: "#A77A37",
  },
  juzPill: {
    marginLeft: 7,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
    backgroundColor: "rgba(137,83,155,0.18)",
  },
  juzText: {
    color: "#BBAFC2",
    fontFamily: typography.sans,
    fontSize: 8.5,
    fontWeight: "600",
  },
  arabicBlock: {
    maxWidth: "39%",
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  favoriteButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(227,181,90,0.08)",
  },
  arabicGlow: {
    minWidth: 72,
    maxWidth: 116,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(229,182,81,0.32)",
    backgroundColor: "rgba(229,182,81,0.075)",
    shadowColor: "#E5B651",
    shadowOpacity: 0.24,
    shadowRadius: 10,
  },
  arabicShine: {
    position: "absolute",
    top: -22,
    right: -12,
    width: 62,
    height: 48,
    borderRadius: 31,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  arabic: {
    color: "#F2C86C",
    fontFamily: typography.arabic,
    fontSize: 24,
    lineHeight: 30,
    textAlign: "right",
    writingDirection: "rtl",
    textShadowColor: "rgba(229,182,81,0.48)",
    textShadowRadius: 9,
  },
  separator: { height: 7 },
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
