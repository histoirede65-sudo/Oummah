import { Ionicons } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useI18n } from "../i18n";
import HomeModuleCard from "./home/HomeModuleCard";
import { HOME_DEEPER } from "./home/homeModules";
import { router } from "expo-router";

const CARD_WIDTH = 150;
const CARD_GAP = 8;

export default function AllahNamesHomeSection() {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const cardWidth = width < 350 ? 132 : width < 390 ? 142 : width > 430 ? 160 : CARD_WIDTH;
  const cardHeight = width < 350 ? 154 : width < 390 ? 162 : 170;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.heading}>{t("home.goDeeper")}</Text>
        <Pressable
          accessibilityRole="link"
          hitSlop={10}
          onPress={() => router.push("/modules")}
          style={({ pressed }) => [styles.swipeHint, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.swipeText}>{t("home.seeAll")}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.goldLight} />
        </Pressable>
      </View>

      <FlatList
        data={HOME_DEEPER}
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
  swipeHint: { flexDirection: "row", alignItems: "center", gap: 2 },
  swipeText: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 12.5, fontWeight: "600" },
  row: { paddingTop: 5, paddingRight: 36, gap: CARD_GAP },
});
