import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { router } from "expo-router";
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
          <Pressable
            onPress={() => router.push(item.route as Href)}
            style={({ pressed }) => [styles.card, { width: cardWidth, height: cardHeight }, pressed && styles.pressed]}
          >
            <Image
              source={item.image}
              contentFit="cover"
              transition={180}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={[
                "rgba(7,9,16,0.015)",
                "rgba(8,10,18,0.12)",
                "rgba(6,8,15,0.76)",
              ]}
              locations={[0, 0.42, 1]}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              pointerEvents="none"
              colors={[
                "rgba(255,255,255,0.31)",
                "rgba(255,255,255,0.075)",
                "transparent",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.82, y: 0.72 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.liquidOrb} />
            <View pointerEvents="none" style={styles.innerRim} />
            <LinearGradient
              pointerEvents="none"
              colors={["rgba(255,255,255,0.48)", "rgba(255,255,255,0.04)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.75, y: 0.75 }}
              style={styles.topBevel}
            />
            <LinearGradient
              pointerEvents="none"
              colors={["transparent", "rgba(0,0,0,0.64)"]}
              style={styles.bottomBevel}
            />

            <LinearGradient
              colors={["rgba(14,10,22,0.12)", "rgba(14,10,22,0.79)"]}
              style={styles.copy}
            >
              <View style={styles.labelReliefWrap}>
                <Text
                  accessible={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={styles.labelDepth}
                >
                  {t(item.labelKey)}
                </Text>
                <Text numberOfLines={1} adjustsFontSizeToFit style={styles.label}>
                  {t(item.labelKey)}
                </Text>
              </View>
              <View style={styles.subtitleReliefWrap}>
                <Text
                  accessible={false}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={styles.subtitleDepth}
                >
                  {t(item.subtitleKey)}
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={styles.subtitle}
                >
                  {t(item.subtitleKey)}
                </Text>
              </View>
            </LinearGradient>
          </Pressable>
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
  card: {
    width: CARD_WIDTH,
    height: 170,
    overflow: "hidden",
    borderRadius: 25,
    borderWidth: 1.5,
    borderColor: "rgba(255,236,191,0.58)",
    backgroundColor: "rgba(20,24,31,0.96)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 13 },
    shadowOpacity: 0.58,
    shadowRadius: 20,
    elevation: 16,
  },
  liquidOrb: {
    position: "absolute",
    top: -57,
    right: -34,
    width: 126,
    height: 126,
    borderRadius: 63,
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  innerRim: {
    position: "absolute",
    top: 4,
    right: 4,
    bottom: 4,
    left: 4,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  topBevel: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 52,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomBevel: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    height: 56,
  },
  copy: {
    position: "absolute",
    right: 8,
    bottom: 8,
    left: 8,
    minHeight: 62,
    paddingHorizontal: 11,
    paddingVertical: 9,
    overflow: "hidden",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,242,212,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 9,
    elevation: 8,
  },
  labelReliefWrap: { minHeight: 25, justifyContent: "center" },
  labelDepth: {
    position: "absolute",
    top: 2.2,
    left: 1.2,
    color: "rgba(38,16,5,0.96)",
    fontFamily: typography.serifSemibold,
    fontSize: 22,
    lineHeight: 25,
    letterSpacing: 0.25,
  },
  label: {
    color: "#FFF7E5",
    fontFamily: typography.serifSemibold,
    fontSize: 22,
    lineHeight: 25,
    letterSpacing: 0.25,
    textShadowColor: "rgba(255,211,113,0.52)",
    textShadowOffset: { width: 0, height: -1 },
    textShadowRadius: 2,
  },
  subtitleReliefWrap: { minHeight: 17, marginTop: 2, justifyContent: "center" },
  subtitleDepth: {
    position: "absolute",
    top: 1.5,
    left: 1,
    color: "rgba(0,0,0,0.98)",
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: "800",
  },
  subtitle: {
    color: "#F8EEF1",
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: "800",
    textShadowColor: "rgba(255,255,255,0.20)",
    textShadowOffset: { width: 0, height: -1 },
    textShadowRadius: 1,
  },
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
  pressed: { opacity: 0.76, transform: [{ scale: 0.985 }] },
});
