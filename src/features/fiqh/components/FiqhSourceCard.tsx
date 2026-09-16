import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
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
  const [open, setOpen] = useState(false);
  const available = ids.filter((id) => sourceById.has(id));
  if (!available.length) return null;

  return (
    <View style={styles.box}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((value) => !value)}
        style={styles.header}
      >
        <View>
          <Text style={styles.heading}>SOURCES</Text>
          <Text style={styles.caption}>{available.length} référence{available.length > 1 ? "s" : ""} liée{available.length > 1 ? "s" : ""} à cette leçon</Text>
        </View>
        <Text style={styles.toggle}>{open ? "−" : "+"}</Text>
      </Pressable>

      {open ? available.map((id) => {
        const source = sourceById.get(id);
        if (!source) return null;
        const route = sourceRoute(id);
        const authenticity = source.authenticity && !TECHNICAL_STATUSES.has(source.authenticity) ? ` (${source.authenticity})` : "";
        const content = <><View style={styles.copy}><Text style={styles.source}>{source.reference}{source.author ? ` — ${source.author}` : ""}{authenticity}</Text></View>{route ? <Ionicons name="chevron-forward" size={17} color={colors.goldLight} /> : null}</>;
        return route ? <Pressable key={id} accessibilityRole="link" onPress={() => router.push(route as never)} style={styles.row}>{content}</Pressable> : <View key={id} style={styles.row}>{content}</View>;
      }) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: 28,
    padding: 17,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  heading: { color: colors.goldLight, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  caption: { color: colors.textMuted, fontSize: 12.5, marginTop: 5 },
  toggle: { color: colors.goldLight, fontSize: 23, lineHeight: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  copy: { flex: 1 },
  source: { color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
});
