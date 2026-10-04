import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useI18n, type TranslationKey } from "../../i18n";

export type QuranTab = "surahs" | "juz" | "favorites" | "bookmarks";

type QuranQuickActionsProps = {
  activeTab: QuranTab;
  onTabChange: (tab: QuranTab) => void;
};

const tabs: {
  id: QuranTab;
  labelKey: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "surahs", labelKey: "quran.surahs", icon: "book-outline" },
  { id: "juz", labelKey: "quran.juz", icon: "albums-outline" },
  { id: "favorites", labelKey: "common.favorites", icon: "heart-outline" },
  { id: "bookmarks", labelKey: "common.bookmarks", icon: "bookmark-outline" },
];

/** The four ways to browse the Quran: surahs, juz, favourite surahs, bookmarked verses. */
export default function QuranQuickActions({ activeTab, onTabChange }: QuranQuickActionsProps) {
  const { t } = useI18n();

  return (
    <View accessibilityRole="tablist" style={styles.tabs}>
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onTabChange(tab.id)}
            style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && styles.pressed]}
          >
            <Ionicons
              name={active ? (tab.icon.replace("-outline", "") as keyof typeof Ionicons.glyphMap) : tab.icon}
              size={17}
              color={active ? colors.goldLight : colors.textMuted}
            />
            <Text numberOfLines={1} style={[styles.tabLabel, active && styles.tabLabelActive]}>
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    height: 54,
    marginTop: 10,
    marginBottom: 14,
    padding: 4,
    flexDirection: "row",
    gap: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    backgroundColor: colors.surface,
  },
  tab: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  tabActive: {
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.35)",
    backgroundColor: "rgba(227,181,90,0.12)",
  },
  tabLabel: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11.5,
    fontWeight: "700",
  },
  tabLabelActive: { color: colors.goldLight },
  pressed: { opacity: 0.6 },
});
