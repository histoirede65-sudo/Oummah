import { Ionicons } from "@expo/vector-icons";
import { useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { colors } from "../theme/colors";
import { typography } from "../theme/typography";
import { useI18n } from "../i18n";
import HomeModuleCard from "./home/HomeModuleCard";
import { HOME_ESSENTIALS } from "./home/homeModules";
import { router } from "expo-router";

const CARD_WIDTH = 150;
const CARD_GAP = 8;

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
    const nextIndex = Math.round(progress * (HOME_ESSENTIALS.length - 1));
    const boundedIndex = Math.max(
      0,
      Math.min(HOME_ESSENTIALS.length - 1, nextIndex),
    );

    setActiveIndex((currentIndex) =>
      currentIndex === boundedIndex ? currentIndex : boundedIndex,
    );
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.heading}>{t("home.essentials")}</Text>
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
        data={HOME_ESSENTIALS}
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
        {HOME_ESSENTIALS.map((item, index) => (
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
  swipeHint: { flexDirection: "row", alignItems: "center", gap: 2 },
  swipeText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12.5,
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
