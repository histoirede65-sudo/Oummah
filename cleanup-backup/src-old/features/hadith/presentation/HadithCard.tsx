import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

export default function HadithCard({ title, subtitle, onPress, index = 0 }: { title: string; subtitle?: string; onPress: () => void; index?: number }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <LinearGradient colors={["rgba(46,27,62,0.96)", "rgba(20,15,32,0.98)"]} style={StyleSheet.absoluteFill} />
      <View style={styles.number}><Text style={styles.numberText}>{String(index + 1).padStart(2, "0")}</Text></View>
      <View style={styles.copy}>
        <Text numberOfLines={3} style={styles.title}>{title}</Text>
        {subtitle ? <Text numberOfLines={2} style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.goldLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 92, overflow: "hidden", borderRadius: 22, borderWidth: 1, borderColor: "rgba(151,104,173,0.26)", padding: 15, flexDirection: "row", alignItems: "center", gap: 13 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  number: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(227,181,90,0.1)", borderWidth: 1, borderColor: "rgba(227,181,90,0.22)" },
  numberText: { color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 16 },
  copy: { flex: 1, gap: 5 },
  title: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 17, lineHeight: 20 },
  subtitle: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 11.5, lineHeight: 16 },
});

