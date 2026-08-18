import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";

import type { TadabburDisplayVerse } from "./SyncedVerseList";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type TadabburPlayerBarProps = {
  verses: readonly TadabburDisplayVerse[];
  activeVerseId: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSelectVerse: (verse: TadabburDisplayVerse) => void;
};

export default function TadabburPlayerBar({
  verses,
  activeVerseId,
  isPlaying,
  onTogglePlay,
  onSelectVerse,
}: TadabburPlayerBarProps) {
  const [pickerVisible, setPickerVisible] = useState(false);
  const activeIndex = Math.max(
    0,
    verses.findIndex((verse) => verse.id === activeVerseId),
  );
  const previous = verses[activeIndex - 1];
  const next = verses[activeIndex + 1];

  const selectVerse = (verse: TadabburDisplayVerse) => {
    setPickerVisible(false);
    onSelectVerse(verse);
  };

  return (
    <>
      <View style={styles.bar}>
        <LinearGradient
          pointerEvents="none"
          colors={["rgba(46,25,63,0.92)", "rgba(15,10,27,0.97)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <Pressable
          disabled={!previous}
          onPress={() => previous && selectVerse(previous)}
          style={({ pressed }) => [
            styles.sideButton,
            !previous && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="play-back" size={18} color={colors.goldLight} />
        </Pressable>

        <Pressable
          onPress={onTogglePlay}
          style={({ pressed }) => [
            styles.playButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={25}
            color={colors.background}
          />
        </Pressable>

        <Pressable
          disabled={!next}
          onPress={() => next && selectVerse(next)}
          style={({ pressed }) => [
            styles.sideButton,
            !next && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="play-forward" size={18} color={colors.goldLight} />
        </Pressable>

        <Pressable
          onPress={() => setPickerVisible(true)}
          style={({ pressed }) => [
            styles.verseButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.verseLabel}>VERSET</Text>
          <Text style={styles.verseNumber}>{activeVerseId}</Text>
          <Ionicons name="chevron-up" size={12} color={colors.goldMuted} />
        </Pressable>
      </View>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable
          onPress={() => setPickerVisible(false)}
          style={styles.backdrop}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.sheet}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>Choisir un verset</Text>
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {verses.map((verse) => {
                const active = verse.id === activeVerseId;
                return (
                  <Pressable
                    key={verse.id}
                    onPress={() => selectVerse(verse)}
                    style={({ pressed }) => [
                      styles.verseRow,
                      active && styles.verseRowActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View
                      style={[
                        styles.rowNumber,
                        active && styles.rowNumberActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.rowNumberText,
                          active && styles.rowNumberTextActive,
                        ]}
                      >
                        {verse.id}
                      </Text>
                    </View>
                    <Text numberOfLines={1} style={styles.rowArabic}>
                      {verse.arabic}
                    </Text>
                    {active ? (
                      <Ionicons
                        name="volume-high"
                        size={16}
                        color={colors.goldLight}
                      />
                    ) : (
                      <Ionicons
                        name="play-outline"
                        size={16}
                        color={colors.textMuted}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 56,
    marginTop: 5,
    marginBottom: 7,
    paddingHorizontal: 8,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(190,139,66,0.34)",
  },
  sideButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    backgroundColor: "rgba(91,49,111,0.42)",
  },
  playButton: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: colors.goldLight,
    shadowColor: colors.goldLight,
    shadowOpacity: 0.42,
    shadowRadius: 9,
    elevation: 5,
  },
  verseButton: {
    minWidth: 75,
    height: 38,
    marginLeft: 4,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.30)",
    backgroundColor: "rgba(19,12,31,0.78)",
  },
  verseLabel: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7,
    fontWeight: "700",
  },
  verseNumber: {
    marginHorizontal: 6,
    color: colors.goldLight,
    fontFamily: typography.serifSemibold,
    fontSize: 18,
  },
  disabled: { opacity: 0.25 },
  pressed: { opacity: 0.62 },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 14,
    backgroundColor: "rgba(5,4,13,0.74)",
  },
  sheet: {
    maxHeight: "66%",
    padding: 14,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.32)",
    backgroundColor: colors.surfaceAlt,
  },
  handle: {
    alignSelf: "center",
    width: 38,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  title: {
    marginVertical: 13,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 20,
    textAlign: "center",
  },
  list: { maxHeight: 390 },
  listContent: { paddingBottom: 8 },
  verseRow: {
    minHeight: 54,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSoft,
  },
  verseRowActive: {
    borderRadius: 14,
    borderBottomColor: "transparent",
    backgroundColor: "rgba(116,63,137,0.25)",
  },
  rowNumber: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  rowNumberActive: { borderColor: colors.goldMuted },
  rowNumberText: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "800",
  },
  rowNumberTextActive: { color: colors.goldLight },
  rowArabic: {
    flex: 1,
    marginHorizontal: 11,
    color: colors.text,
    fontFamily: typography.arabic,
    fontSize: 20,
    lineHeight: 30,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
