import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";
import { useI18n, type TranslationKey } from "../../i18n";

export type QuranTab = "surahs" | "juz" | "favorites" | "bookmarks";

type QuranQuickActionsProps = {
  activeTab: QuranTab;
  onTabChange: (tab: QuranTab) => void;
  onBookmarkPress: () => void;
  onAudioPress: () => void;
  onHifzPress: () => void;
};

const tabs: {
  id: QuranTab;
  labelKey: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "surahs", labelKey: "quran.surahs", icon: "book-outline" },
  { id: "juz", labelKey: "quran.juz", icon: "albums-outline" },
  { id: "favorites", labelKey: "common.favorites", icon: "heart-outline" },
];

export default function QuranQuickActions({
  activeTab,
  onTabChange,
  onBookmarkPress,
  onAudioPress,
  onHifzPress,
}: QuranQuickActionsProps) {
  const { t } = useI18n();

  return (
    <>
      <View style={styles.utilities}>
        <Pressable
          onPress={onBookmarkPress}
          style={({ pressed }) => [
            styles.utility,
            activeTab === "bookmarks" && styles.utilityActive,
            pressed && styles.pressed,
          ]}
        >
          <LinearGradient
            colors={
              activeTab === "bookmarks"
                ? ["rgba(111,51,131,0.88)", "rgba(48,24,66,0.96)"]
                : ["rgba(39,25,52,0.84)", "rgba(19,15,29,0.96)"]
            }
            style={StyleSheet.absoluteFill}
          />
          <Ionicons
            name="bookmark-outline"
            size={19}
            color={colors.goldLight}
          />
          <View style={styles.utilityCopy}>
            <Text style={styles.utilityTitle}>{t("common.bookmarks")}</Text>
            <Text style={styles.utilitySubtitle}>Vos versets enregistrés</Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={onAudioPress}
          style={({ pressed }) => [styles.utility, pressed && styles.pressed]}
        >
          <LinearGradient
            colors={["rgba(39,25,52,0.84)", "rgba(19,15,29,0.96)"]}
            style={StyleSheet.absoluteFill}
          />
          <Ionicons name="headset-outline" size={20} color={colors.goldLight} />
          <View style={styles.utilityCopy}>
            <Text style={styles.utilityTitle}>Écouter</Text>
            <Text style={styles.utilitySubtitle}>Récitateurs & audio</Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
        </Pressable>
      </View>
      <Pressable
        onPress={onHifzPress}
        style={({ pressed }) => [styles.hifzUtility, pressed && styles.pressed]}
      >
        <LinearGradient
          colors={["rgba(87,43,106,0.86)", "rgba(28,16,41,0.96)"]}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="school-outline" size={20} color={colors.goldLight} />
        <View style={styles.utilityCopy}>
          <Text style={styles.utilityTitle}>Mémoriser</Text>
          <Text style={styles.utilitySubtitle}>Mon programme de Hifz</Text>
        </View>
        <Ionicons name="arrow-forward" size={15} color={colors.goldLight} />
      </Pressable>

      <View style={styles.tabs}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={[styles.tab, active && styles.tabActive]}
            >
              {active ? (
                <LinearGradient
                  colors={["#4D245F", "#281536"]}
                  style={[StyleSheet.absoluteFill, styles.tabGradient]}
                />
              ) : null}
              <Ionicons
                name={
                  active
                    ? (tab.icon.replace(
                        "-outline",
                        "",
                      ) as keyof typeof Ionicons.glyphMap)
                    : tab.icon
                }
                size={18}
                color={active ? colors.goldLight : colors.textMuted}
              />
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                {t(tab.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  utilities: {
    height: 62,
    marginTop: 10,
    flexDirection: "row",
    gap: 7,
  },
  hifzUtility: {
    height: 56,
    marginTop: 8,
    overflow: "hidden",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.35)",
  },
  utility: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(123,78,145,0.34)",
  },
  utilityActive: { borderColor: "rgba(227,181,90,0.50)" },
  utilityCopy: { flex: 1, minWidth: 0, marginLeft: 8 },
  utilityTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 10.5,
    fontWeight: "700",
  },
  utilitySubtitle: {
    marginTop: 2,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
  },
  tabs: {
    height: 58,
    marginTop: 10,
    marginBottom: 12,
    padding: 4,
    flexDirection: "row",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(76,44,98,0.42)",
    backgroundColor: "rgba(19,11,31,0.92)",
  },
  tab: {
    flex: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  tabActive: {
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.26)",
    shadowColor: colors.goldLight,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  tabGradient: { borderRadius: 12 },
  tabLabel: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    marginTop: 3,
    fontSize: 12.5,
    fontWeight: "700",
  },
  tabLabelActive: { color: colors.goldLight },
  pressed: { opacity: 0.6 },
});
