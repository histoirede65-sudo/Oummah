import { Ionicons } from "@expo/vector-icons";
import { Image, ImageSourcePropType, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

type IconName = keyof typeof Ionicons.glyphMap;

const bookIcons: Record<string, IconName> = {
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

export function FiqhBookHero({
  title,
  arabicTitle,
  description,
  countLabel,
  chapterLabel,
  imageSource,
  visualKey,
}: {
  title: string;
  arabicTitle?: string;
  description: string;
  countLabel: string;
  chapterLabel: string;
  imageSource?: ImageSourcePropType;
  visualKey?: string;
}) {
  const fallbackIcon = bookIcons[visualKey ?? ""] ?? "book-outline";
  return (
    <View style={styles.hero}>
      <View style={styles.visual}>
        {imageSource ? (
          <>
            <Image source={imageSource} style={styles.image} resizeMode="cover" />
            <View style={styles.imageShade} />
          </>
        ) : (
          <View style={styles.fallbackVisual}>
            <View style={styles.fallbackHalo} />
            <Ionicons name={fallbackIcon} size={112} color="rgba(216, 181, 105, 0.16)" />
            <View style={styles.fallbackLineOne} />
            <View style={styles.fallbackLineTwo} />
          </View>
        )}
      </View>
      <View style={styles.content}>
        <View style={styles.icon}><Ionicons name={fallbackIcon} size={20} color={colors.goldLight} /></View>
        <Text style={styles.kicker}>{chapterLabel}</Text>
        <Text style={styles.title}>{title}</Text>
        {arabicTitle ? <Text style={styles.arabic}>{arabicTitle}</Text> : null}
        <Text style={styles.description}>{description}</Text>
        <View style={styles.meta}><View style={styles.line} /><Text style={styles.count}>{countLabel}</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { overflow: "hidden", borderRadius: 28, backgroundColor: colors.purpleDeep, borderWidth: 1, borderColor: colors.border },
  visual: { position: "relative", height: 190, overflow: "hidden", backgroundColor: "#231334" },
  image: { width: "100%", height: "100%" },
  imageShade: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(28, 14, 43, 0.28)" },
  fallbackVisual: { ...StyleSheet.absoluteFill, alignItems: "flex-end", justifyContent: "center", paddingRight: 18, backgroundColor: "#231334" },
  fallbackHalo: { position: "absolute", right: -34, top: 18, width: 210, height: 210, borderRadius: 105, backgroundColor: "rgba(111, 68, 151, 0.18)", borderWidth: 1, borderColor: "rgba(216, 181, 105, 0.12)" },
  fallbackLineOne: { position: "absolute", right: 28, bottom: 28, width: 132, height: 1, backgroundColor: "rgba(216, 181, 105, 0.18)", transform: [{ rotate: "-18deg" }] },
  fallbackLineTwo: { position: "absolute", right: -4, bottom: 58, width: 154, height: 1, backgroundColor: "rgba(137, 87, 181, 0.22)", transform: [{ rotate: "24deg" }] },
  content: { padding: 22 },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(29, 18, 43, 0.76)", borderWidth: 1, borderColor: colors.goldDark, marginBottom: 18 },
  kicker: { color: colors.goldLight, fontSize: 11, fontWeight: "800", letterSpacing: 1.6 },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 38, lineHeight: 45, marginTop: 7 },
  arabic: { color: colors.goldLight, fontFamily: typography.arabic, fontSize: 28 },
  description: { color: colors.textSecondary, fontSize: 16, lineHeight: 25, marginTop: 13 },
  meta: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20 },
  line: { width: 34, height: 2, backgroundColor: colors.goldLight },
  count: { color: colors.textMuted, fontSize: 13 },
});
