import { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { premiumAnimations } from "../../core/animations";
import type { Verse } from "../../data/verses/al-fatiha";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import VerseHighlighter from "./VerseHighlighter";

function TadabburVerseFocus({
  verses,
  activeVerseId,
  progress,
}: {
  verses: readonly Verse[];
  activeVerseId: number;
  progress: number;
}) {
  const entrance = useRef(premiumAnimations.createValues("fadeIn")).current;
  const activeIndex = Math.max(
    0,
    verses.findIndex((verse) => verse.id === activeVerseId),
  );
  const visible = [
    verses[activeIndex - 1],
    verses[activeIndex],
    verses[activeIndex + 1],
  ].filter((verse): verse is Verse => Boolean(verse));

  useEffect(() => {
    const animation = premiumAnimations.start("fadeIn", entrance);
    return () => animation.stop();
  }, [entrance]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { opacity: entrance.opacity }]}
    >
      {visible.map((verse) => {
        const active = verse.id === activeVerseId;
        return (
          <VerseHighlighter
            key={verse.id}
            verseId={verse.id}
            isActive={active}
            progress={active ? progress : 0}
            highlightMode="focus"
          >
            <View style={styles.verse}>
              <Text
                numberOfLines={active ? 5 : 1}
                style={[styles.arabic, active && styles.activeArabic]}
              >
                {verse.arabic}
              </Text>
              {active ? (
                <Text numberOfLines={3} style={styles.translation}>
                  {verse.french}
                </Text>
              ) : null}
            </View>
          </VerseHighlighter>
        );
      })}
    </Animated.View>
  );
}

export default memo(TadabburVerseFocus);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    paddingHorizontal: 18,
    alignItems: "stretch",
    justifyContent: "center",
    gap: 10,
  },
  verse: { paddingHorizontal: 8, paddingVertical: 5, alignItems: "center" },
  arabic: {
    color: colors.textSecondary,
    fontFamily: typography.arabic,
    fontSize: 21,
    lineHeight: 32,
    textAlign: "center",
    writingDirection: "rtl",
  },
  activeArabic: { color: colors.goldMuted, fontSize: 35, lineHeight: 50 },
  translation: {
    marginTop: 8,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
});
