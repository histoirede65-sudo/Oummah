import { Ionicons } from "@expo/vector-icons";
import { FlatList, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useI18n } from "../i18n";
import HomeModuleCard from "./home/HomeModuleCard";

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
          <HomeModuleCard
            label={t(item.labelKey)}
            subtitle={t(item.subtitleKey)}
            route={item.route}
            image={item.image}
            width={cardWidth}
            height={cardHeight}
            labelLines={2}
          />
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
});
