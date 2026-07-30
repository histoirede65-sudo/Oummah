import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

export default function WeeklySummaryCard({ activeDays, regularity }: { activeDays: number; regularity: number }) {
  return <View style={styles.card}><View><Text style={styles.eyebrow}>BILAN DE LA SEMAINE</Text><Text style={styles.title}>{activeDays} jours actifs</Text></View><View style={styles.divider} /><View><Text style={styles.value}>{regularity}%</Text><Text style={styles.label}>de régularité</Text></View></View>;
}
const styles = StyleSheet.create({
  card: { minHeight: 82, paddingHorizontal: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.025)" },
  eyebrow: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 9.5, fontWeight: "800", letterSpacing: 1 },
  title: { marginTop: 4, color: colors.text, fontFamily: typography.serifMedium, fontSize: 18 },
  divider: { width: 1, height: 34, backgroundColor: "rgba(255,255,255,0.08)" },
  value: { color: colors.goldLight, fontFamily: typography.serifSemibold, fontSize: 21, textAlign: "right" },
  label: { color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5 },
});
