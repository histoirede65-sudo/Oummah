import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Props = {
  prompt: string;
  compact?: boolean;
};

export function WasilContextButton({ prompt, compact = false }: Props) {
  const openWasil = () => {
    router.push({
      pathname: "/dalil",
      params: { prompt: prompt.slice(0, 1200) },
    });
  };

  return (
    <Pressable
      accessibilityLabel="Demander une explication à Wasil"
      accessibilityRole="button"
      onPress={openWasil}
      hitSlop={8}
      style={({ pressed }) => [
        compact ? styles.compact : styles.button,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons
        name="sparkles"
        size={compact ? 15 : 16}
        color={colors.goldLight}
      />
      {!compact ? <Text style={styles.label}>Expliquer avec Wasil</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 40,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.24)",
    backgroundColor: "rgba(227,181,90,0.08)",
  },
  compact: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.24)",
    backgroundColor: "rgba(227,181,90,0.08)",
  },
  label: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
});
