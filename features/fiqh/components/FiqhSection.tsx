import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
export function FiqhSection({ title, items }: { title: string; items: string[] }) { if (!items.length) return null; return <View style={styles.section}><Text style={styles.title}>{title}</Text>{items.map((item, index) => <Text key={`${title}-${index}`} style={styles.text}>• {item}</Text>)}</View>; }
const styles = StyleSheet.create({ section: { marginTop: 20 }, title: { color: colors.goldLight, fontSize: 14, fontWeight: "800", letterSpacing: 1, marginBottom: 8 }, text: { color: colors.text, fontSize: 16, lineHeight: 25, marginBottom: 7 } });
