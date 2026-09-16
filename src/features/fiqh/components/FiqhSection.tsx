import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";

type FiqhSectionVariant = "plain" | "card" | "soft";

export function FiqhSection({
  title,
  items,
  variant = "plain",
}: {
  title: string;
  items: string[];
  variant?: FiqhSectionVariant;
}) {
  if (!items.length) return null;

  return (
    <View style={[styles.section, variant === "card" && styles.card, variant === "soft" && styles.soft]}>
      <View style={styles.heading}>{variant === "soft" ? <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} /> : <View style={styles.rule} />}<Text style={[styles.title, variant === "soft" && styles.softTitle]}>{title}</Text></View>
      <View style={styles.list}>
        {items.map((item, index) => (
          <View key={`${title}-${index}`} style={styles.row}>
            <View style={styles.dot} />
            <Text style={variant === "soft" ? styles.softText : styles.text}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  card: {
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  soft: {
    padding: 15,
    borderRadius: 18,
    backgroundColor: "rgba(14,10,27,0.72)",
    borderWidth: 1,
    borderColor: "rgba(126,78,151,0.22)",
  },
  heading: { flexDirection: "row", alignItems: "center", gap: 9 },
  rule: { width: 18, height: 2, backgroundColor: colors.goldLight, opacity: 0.8 },
  title: {
    color: colors.goldLight,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 12,
  },
  softTitle: { color: colors.textMuted, fontSize: 12, letterSpacing: 0.9 },
  list: { gap: 12 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.goldLight,
    marginTop: 9,
  },
  text: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    lineHeight: 25,
  },
  softText: { color: colors.textSecondary, fontSize: 14.5, lineHeight: 23 },
});
