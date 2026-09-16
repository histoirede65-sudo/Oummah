import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

export default function HadithScreenHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Retour" onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={21} color={colors.goldLight} />
      </Pressable>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={1} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 58, flexDirection: "row", alignItems: "center", gap: 12 },
  back: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(35,23,49,0.92)", borderWidth: 1, borderColor: "rgba(227,181,90,0.2)" },
  copy: { flex: 1 },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 23 },
  subtitle: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5, marginTop: 1 },
  right: { minWidth: 42, alignItems: "flex-end" },
});

