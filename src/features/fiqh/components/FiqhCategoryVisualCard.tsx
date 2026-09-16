import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

type IconName = keyof typeof Ionicons.glyphMap;

const fallbackIcons: Record<string, IconName> = {
  funerals: "leaf-outline",
  family: "heart-outline",
  transactions: "swap-horizontal-outline",
  "food-sacrifices": "restaurant-outline",
  "oaths-vows": "ribbon-outline",
  "clothing-adornment": "shirt-outline",
  "daily-life": "home-outline",
  "justice-rights": "scale-outline",
  "inheritance-wills": "git-branch-outline",
  "hunting-animals": "paw-outline",
  "siyar-relations": "shield-checkmark-outline",
};

type Props = {
  categoryId: string;
  title: string;
  arabicTitle?: string;
  summary: string;
  image?: ImageSourcePropType;
  onPress: () => void;
};

export function FiqhCategoryVisualCard({ categoryId, title, arabicTitle, summary, image, onPress }: Props) {
  const tall = title.length > 18;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.illustration}>
        {image ? (
          <Image source={image} style={styles.image} resizeMode="cover" />
        ) : (
          <LinearGradient colors={["#39205a", "#21132f"]} style={styles.fallback}>
            <View style={styles.fallbackRing}>
              <Ionicons name={fallbackIcons[categoryId] ?? "book-outline"} size={34} color={colors.goldLight} />
            </View>
            <View style={styles.fallbackGlow} />
          </LinearGradient>
        )}
      </View>
      <LinearGradient colors={["rgba(25, 12, 42, 0.02)", "rgba(25, 12, 42, 0.88)", colors.surfaceAlt]} locations={[0, 0.48, 1]} style={styles.blend} />
      <View style={styles.copy}>
        <Text style={[styles.title, tall && styles.titleLong]} numberOfLines={2}>{title}</Text>
        {arabicTitle ? <Text style={styles.arabic} numberOfLines={1}>{arabicTitle}</Text> : null}
        <Text style={styles.summary} numberOfLines={2}>{summary}</Text>
      </View>
      <Ionicons name="chevron-forward" size={25} color={colors.goldLight} style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 120,
    maxHeight: 120,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.goldDark,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "stretch",
  },
  illustration: { position: "absolute", left: 0, top: 0, bottom: 0, width: "35%", overflow: "hidden" },
  image: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  fallback: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  fallbackRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(20, 11, 32, 0.58)",
    borderWidth: 1,
    borderColor: colors.goldDark,
  },
  fallbackGlow: {
    position: "absolute",
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: "rgba(216, 181, 105, 0.12)",
  },
  blend: { position: "absolute", left: "21%", top: 0, bottom: 0, width: "44%" },
  copy: { flex: 1, justifyContent: "center", paddingVertical: 11, paddingLeft: "35%", paddingRight: 4 },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 20, lineHeight: 24 },
  titleLong: { fontSize: 18, lineHeight: 21 },
  arabic: { color: colors.goldLight, fontFamily: typography.arabic, fontSize: 18, lineHeight: 23, marginTop: 1 },
  summary: { color: colors.textSecondary, fontSize: 12.5, lineHeight: 17, marginTop: 3 },
  chevron: { alignSelf: "center", marginRight: 14 },
  pressed: { opacity: 0.84, transform: [{ scale: 0.988 }] },
});
