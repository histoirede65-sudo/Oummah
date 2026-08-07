import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { TadabburPauseSeconds } from "../../core/audio";
import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export default function TadabburControls({
  isActive,
  pauseSeconds,
  onToggle,
  onCyclePause,
}: {
  isActive: boolean;
  pauseSeconds: TadabburPauseSeconds;
  onToggle: () => void;
  onCyclePause: () => void;
}) {
  const { t } = useI18n();
  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="switch"
        accessibilityState={{ checked: isActive }}
        accessibilityLabel={t("tadabbur.mode")}
        onPress={onToggle}
        style={({ pressed }) => [
          styles.button,
          isActive && styles.active,
          pressed && styles.pressed,
        ]}
      >
        <Ionicons
          name={isActive ? "moon" : "moon-outline"}
          size={11}
          color={colors.goldMuted}
        />
        <Text style={styles.label}>{t("tadabbur.mode")}</Text>
      </Pressable>
      {isActive ? (
        <Pressable
          accessibilityLabel={t("tadabbur.pauseAfterVerse")}
          onPress={onCyclePause}
          style={({ pressed }) => [
            styles.pauseButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.pauseLabel}>
            {t("tadabbur.pauseSeconds", { seconds: pauseSeconds })}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 23,
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  button: {
    height: 22,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.purpleDeep,
  },
  active: { borderColor: colors.goldDark, backgroundColor: colors.surfaceAlt },
  label: {
    marginLeft: 4,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 7.5,
    fontWeight: "600",
  },
  pauseButton: {
    height: 22,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  pauseLabel: {
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 7.5,
    fontWeight: "500",
  },
  pressed: { opacity: 0.65 },
});
