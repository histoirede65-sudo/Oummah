import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useI18n } from "../i18n";
import HomeModuleCard from "./home/HomeModuleCard";

const CARD_WIDTH = 150;
const CARD_GAP = 8;

const shortcuts = [
  {
    labelKey: "home.shortcutQuran",
    subtitleKey: "home.shortcutQuranSubtitle",
    route: "/quran",
    image: require("../assets/images/home/shortcuts/quran-real.jpg"),
  },
  {
    labelKey: "home.shortcutHadith",
    subtitleKey: "home.shortcutHadithSubtitle",
    route: "/hadith",
    image: require("../assets/images/home/shortcuts/hadith-premium.jpg"),
  },
  {
    labelKey: "home.shortcutDhikr",
    subtitleKey: "home.shortcutDhikrCounterSubtitle",
    route: "/dhikr",
    image: require("../assets/images/home/shortcuts/dhikr-real.jpg"),
  },
  {
    labelKey: "home.shortcutHifz",
    subtitleKey: "home.shortcutHifzSubtitle",
    route: "/hifz",
    image: require("../assets/images/home/shortcuts/hifz-real.jpg"),
  },
  {
    labelKey: "home.shortcutDua",
    subtitleKey: "home.shortcutDuaSubtitle",
    route: "/dua",
    image: require("../assets/images/home/shortcuts/dua-real.jpg"),
  },
  {
    labelKey: "home.shortcutMosques",
    subtitleKey: "home.shortcutMosquesSubtitle",
    route: "/mosques",
    image: require("../assets/images/mosques/mosque-hero-premium.jpg"),
  },
  {
    labelKey: "home.shortcutQibla",
    subtitleKey: "home.shortcutQiblaSubtitle",
    route: "/qibla",
    image: require("../assets/images/home/shortcuts/qibla-real.jpg"),
  },
  {
    labelKey: "home.shortcutCalendar",
    subtitleKey: "home.shortcutCalendarSubtitle",
    route: "/calendar",
    image: require("../assets/images/home/shortcuts/calendar-real.jpg"),
  },
  {
    labelKey: "home.shortcutZakat",
    subtitleKey: "home.shortcutZakatSubtitle",
    route: "/zakat",
    image: require("../assets/images/dua/guides/debt.jpg"),
  },
  {
    labelKey: "home.shortcutZawaj",
    subtitleKey: "home.shortcutZawajSubtitle",
    route: "/zawaj",
    image: require("../assets/images/dua/guides/marriage.jpg"),
  },
] as const;

export default function HomeShortcuts() {
  const { t } = useI18n();
  const { width } = useWindowDimensions();
  const cardWidth = width < 350 ? 132 : width < 390 ? 142 : width > 430 ? 160 : CARD_WIDTH;
  const cardHeight = width < 350 ? 154 : width < 390 ? 162 : 170;
  const snapInterval = cardWidth + CARD_GAP;
  const [activeIndex, setActiveIndex] = useState(0);
  const viewportWidthRef = useRef(0);
  const contentWidthRef = useRef(0);

  const updateActiveIndex = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const maxOffset = Math.max(
      0,
      contentWidthRef.current - viewportWidthRef.current,
    );
    const progress =
      maxOffset > 0 ? event.nativeEvent.contentOffset.x / maxOffset : 0;
    const nextIndex = Math.round(progress * (shortcuts.length - 1));
    const boundedIndex = Math.max(
      0,
      Math.min(shortcuts.length - 1, nextIndex),
    );

    setActiveIndex((currentIndex) =>
      currentIndex === boundedIndex ? currentIndex : boundedIndex,
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.heading}>{t("home.essentials")}</Text>
        <View style={styles.swipeHint}>
          <Text style={styles.swipeText}>{t("home.swipeToDiscover")}</Text>
          <Ionicons name="arrow-forward" size={15} color={colors.goldLight} />
        </View>
      </View>

      <FlatList
        data={shortcuts}
        keyExtractor={(item) => item.labelKey}
        initialNumToRender={3}
        maxToRenderPerBatch={3}
        windowSize={5}
        removeClippedSubviews
        horizontal
        contentContainerStyle={styles.row}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        scrollEventThrottle={16}
        onLayout={(event) => {
          viewportWidthRef.current = event.nativeEvent.layout.width;
        }}
        onContentSizeChange={(width) => {
          contentWidthRef.current = width;
        }}
        onScroll={updateActiveIndex}
        onMomentumScrollEnd={updateActiveIndex}
        renderItem={({ item }) => (
          <HomeModuleCard
            label={t(item.labelKey)}
            subtitle={t(item.subtitleKey)}
            route={item.route}
            image={item.image}
            width={cardWidth}
            height={cardHeight}
          />
        )}
      />

      <View style={styles.pagination}>
        {shortcuts.map((item, index) => (
          <View
            key={item.labelKey}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 11 },
  header: {
    height: 30,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heading: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  swipeHint: { flexDirection: "row", alignItems: "center", gap: 5 },
  swipeText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "600",
  },
  row: { paddingTop: 5, paddingRight: 36, gap: CARD_GAP },
  pagination: {
    height: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(227,181,90,0.28)",
  },
  dotActive: {
    width: 17,
    backgroundColor: colors.goldLight,
    shadowColor: colors.goldLight,
    shadowOpacity: 0.8,
    shadowRadius: 5,
  },
});
