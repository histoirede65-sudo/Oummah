import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../theme/colors";
import { sourceById } from "../fiqhSources";

const TECHNICAL_STATUSES = new Set(["PRIMARY_PASSAGE_EXTERNALLY_VERIFIED", "PRIMARY_PASSAGE_EDITION_UNCERTAIN", "VERIFIED_PRIMARY_PASSAGE", "SECONDARY_ATTRIBUTION_ONLY", "PARTIALLY_VERIFIED", "NOT_VERIFIED", "verified_primary", "externally_verified_primary", "partial"]);

function sourceRoute(id: string) {
  const source = sourceById.get(id);
  if (!source) return null;
  if (source.target?.type === "hadith" && source.target.hadithId.trim()) return `/hadith/${encodeURIComponent(source.target.hadithId.trim())}`;
  const match = /^quran-(\d+)-(\d+)$/.exec(id);
  return match ? `/surah/${match[1]}?verse=${match[2]}` : null;
}

export function FiqhSourceCard({ ids }: { ids: string[] }) {
  return <View style={styles.box}><Text style={styles.heading}>PREUVES</Text>{ids.map((id) => {
    const source = sourceById.get(id);
    if (!source) return null;
    const route = sourceRoute(id);
    const authenticity = source.authenticity && !TECHNICAL_STATUSES.has(source.authenticity) ? ` (${source.authenticity})` : "";
    const content = <><View style={styles.copy}><Text style={styles.source}>{source.reference}{source.author ? ` — ${source.author}` : ""}{authenticity}</Text></View>{route ? <Ionicons name="chevron-forward" size={17} color={colors.goldLight} /> : null}</>;
    return route ? <Pressable key={id} accessibilityRole="link" onPress={() => router.push(route as never)} style={styles.row}>{content}</Pressable> : <View key={id} style={styles.row}>{content}</View>;
  })}</View>;
}

const styles = StyleSheet.create({ box: { marginTop: 22, padding: 16, borderRadius: 16, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border }, heading: { color: colors.goldLight, fontSize: 12, fontWeight: "800", letterSpacing: 1 }, row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 }, copy: { flex: 1 }, source: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 } });
