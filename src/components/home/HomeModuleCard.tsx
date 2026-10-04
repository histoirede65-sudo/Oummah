import { Image, type ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Props = {
  label: string;
  subtitle: string;
  route: string;
  image: ImageSource | number;
  width: number;
  height: number;
  labelLines?: number;
};

/** Home module card: the image, one dark gradient at the bottom, a title and a short subtitle. */
export default function HomeModuleCard({ label, subtitle, route, image, width, height, labelLines = 1 }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${subtitle}`}
      onPress={() => router.push(route as Href)}
      style={({ pressed }) => [styles.card, { width, height }, pressed && styles.pressed]}
    >
      <Image source={image} contentFit="cover" transition={180} style={StyleSheet.absoluteFill} />
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(8,7,19,0)", "rgba(8,7,19,0.35)", "rgba(8,7,19,0.94)"]}
        locations={[0.3, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.copy}>
        <Text numberOfLines={labelLines} style={styles.label}>{label}</Text>
        <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.28)",
    backgroundColor: colors.surface,
  },
  copy: { position: "absolute", right: 12, bottom: 11, left: 12 },
  label: {
    color: "#FFF7E5",
    fontFamily: typography.serifSemibold,
    fontSize: 21,
    lineHeight: 23,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    marginTop: 3,
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: "600",
  },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
});
