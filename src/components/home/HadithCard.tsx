import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

export default function HadithCard() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le hadith du jour"
      onPress={() => router.push("/hadith")}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={["#28183F", "#1A1231"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardHeader}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={21}
          color={colors.primaryLight}
        />
        <Text style={styles.title}>Hadith du jour</Text>
      </View>
      <Text numberOfLines={3} style={styles.bodyText}>
        Les meilleures œuvres sont celles accomplies régulièrement…
      </Text>
      <Text style={styles.reference}>Bukhari &amp; Muslim</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    padding: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(229,193,255,0.12)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 7,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 11,
  },
  title: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "600",
  },
  bodyText: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 17,
  },
  reference: {
    marginTop: "auto",
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 15,
  },
  pressed: { opacity: 0.72 },
});
