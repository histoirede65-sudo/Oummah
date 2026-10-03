import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useI18n } from "../i18n";

const CARD_WIDTH = 150;
const CARD_GAP = 8;

const learningModules = [
  {
    labelKey: "home.moduleHalal",
    subtitleKey: "home.moduleHalalSubtitle",
    route: "/halal",
    image: require("../assets/images/dua/guides/food.jpg"),
  },
  {
    labelKey: "home.moduleFiqh",
    subtitleKey: "home.moduleFiqhSubtitle",
    route: "/fiqh",
    image: require("../assets/images/fiqh/fiqh-home.png"),
  },
  {
    labelKey: "home.moduleNamesAllah",
    subtitleKey: "home.moduleNamesAllahSubtitle",
    route: "/99-names",
    image: require("../assets/images/home/shortcuts/allah-names-premium.png"),
  },
  {
    labelKey: "home.moduleProphets",
    subtitleKey: "home.moduleProphetsSubtitle",
    route: "/prophets",
    image: require("../assets/images/prophets/prophets-home-premium.jpg"),
  },
  {
    labelKey: "home.moduleCompanions",
    subtitleKey: "home.moduleCompanionsSubtitle",
    route: "/companions",
    image: require("../assets/images/home/shortcuts/companions-premium.png"),
  },
  {
    labelKey: "home.moduleSirah",
    subtitleKey: "home.moduleSirahSubtitle",
    route: "/sirah",
    image: require("../assets/images/home/shortcuts/sirah-premium.png"),
  },
  {
    labelKey: "home.modulePilgrimage",
    subtitleKey: "home.modulePilgrimageSubtitle",
    route: "/pilgrimage",
    image: require("../assets/images/home/shortcuts/pilgrimage-premium.png"),
  },
  {
    labelKey: "home.moduleNames",
    subtitleKey: "home.moduleNamesSubtitle",
    route: "/prenoms",
    image: require("../assets/images/fiqh/family.png"),
  },
  {
    labelKey: "home.moduleDreams",
    subtitleKey: "home.moduleDreamsSubtitle",
    route: "/dreams",
    image: require("../assets/images/dua/guides/sleep.jpg"),
  },
] as const;

export default function AllahNamesHomeSection() {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const cardWidth = width < 350 ? 132 : width < 390 ? 142 : width > 430 ? 160 : CARD_WIDTH;
  const cardHeight = width < 350 ? 154 : width < 390 ? 162 : 170;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.heading}>{t("home.goDeeper")}</Text>
        <View style={styles.swipeHint}>
          <Text style={styles.swipeText}>{t("home.swipeToDiscover")}</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.goldLight} />
        </View>
      </View>

      <FlatList
        data={learningModules}
        keyExtractor={(item) => item.labelKey}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(item.route as Href)}
            style={({ pressed }) => [styles.card, { width: cardWidth, height: cardHeight }, pressed && styles.pressed]}
          >
            {item.image ? (
              <Image source={item.image} contentFit="cover" transition={180} style={StyleSheet.absoluteFill} />
            ) : (
              <LinearGradient colors={["#2B153F", "#0E0A1B"]} style={StyleSheet.absoluteFill} />
            )}
            <LinearGradient
              colors={["rgba(7,9,16,0.02)", "rgba(8,10,18,0.11)", "rgba(6,8,15,0.80)"]}
              locations={[0, 0.44, 1]}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(255,255,255,0.26)", "rgba(255,255,255,0.06)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.82, y: 0.72 }}
              style={StyleSheet.absoluteFill}
            />
            <View pointerEvents="none" style={styles.liquidOrb} />
            <View pointerEvents="none" style={styles.innerRim} />
            <LinearGradient
              pointerEvents="none"
              colors={["transparent", "rgba(0,0,0,0.70)"]}
              style={styles.bottomBevel}
            />
            <LinearGradient
              colors={["rgba(14,10,22,0.10)", "rgba(14,10,22,0.82)"]}
              style={styles.copy}
            >
              <View style={styles.labelReliefWrap}>
                <Text accessible={false} numberOfLines={2} style={styles.labelDepth}>{t(item.labelKey)}</Text>
                <Text numberOfLines={2} style={styles.label}>{t(item.labelKey)}</Text>
              </View>
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.subtitle}>{t(item.subtitleKey)}</Text>
            </LinearGradient>
          </Pressable>
        )}
        horizontal
        contentContainerStyle={styles.row}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + CARD_GAP}
        snapToAlignment="start"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 11 },
  header: { height: 30, paddingHorizontal: 2, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heading: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 18 },
  swipeHint: { flexDirection: "row", alignItems: "center", gap: 5 },
  swipeText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 10.5, fontWeight: "600" },
  row: { paddingTop: 5, paddingRight: 36, gap: CARD_GAP },
  card: { width: CARD_WIDTH, height: 170, overflow: "hidden", borderRadius: 25, borderWidth: 1.5, borderColor: "rgba(255,236,191,0.58)", backgroundColor: "rgba(20,24,31,0.96)", shadowColor: "#000", shadowOffset: { width: 0, height: 13 }, shadowOpacity: 0.58, shadowRadius: 20, elevation: 16 },

  liquidOrb: { position: "absolute", top: -57, right: -34, width: 126, height: 126, borderRadius: 63, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.11)" },
  innerRim: { position: "absolute", top: 6, right: 6, bottom: 6, left: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.13)" },
  bottomBevel: { position: "absolute", right: 0, bottom: 0, left: 0, height: 96 },
  copy: { flex: 1, justifyContent: "flex-end", padding: 13, paddingTop: 78 },
  labelReliefWrap: { position: "relative" },
  labelDepth: { position: "absolute", top: 1, left: 0, right: 0, color: "rgba(0,0,0,0.66)", fontFamily: typography.serifSemibold, fontSize: 19, lineHeight: 21 },
  label: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 19, lineHeight: 21, textShadowColor: "rgba(0,0,0,0.72)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  subtitle: { marginTop: 5, color: colors.goldLight, fontFamily: typography.sans, fontSize: 11.5, fontWeight: "700" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.992 }] },
});
