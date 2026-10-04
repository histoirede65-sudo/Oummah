import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { FiqhDifference } from "../fiqhTypes";
import { fq } from "./FiqhUI";

/** A question on which the schools differ: what is agreed, then each school's position on demand. */
export function FiqhDifferenceCard({ difference }: { difference: FiqhDifference }) {
  const [openPosition, setOpenPosition] = useState<string | null>(null);
  return (
    <View style={styles.box}>
      <Text style={styles.question}>{difference.question}</Text>
      {difference.established ? <Text style={styles.text}>{difference.established}</Text> : null}
      <View style={styles.positions}>
        {difference.positions.map((position) => {
          const open = openPosition === position.label;
          return (
            <View key={position.label} style={styles.position}>
              <Pressable onPress={() => setOpenPosition(open ? null : position.label)} style={styles.schoolRow} accessibilityRole="button" accessibilityState={{ expanded: open }}>
                <Text style={styles.label}>{position.label}</Text>
                <Ionicons name={open ? "remove" : "add"} size={18} color={fq.gold} />
              </Pressable>
              {open ? (
                <View style={styles.positionBody}>
                  <Text style={styles.text}>{position.position}</Text>
                  {position.consequence ? <Text style={styles.consequence}>{position.consequence}</Text> : null}
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      {difference.practicalNote ? (
        <View style={styles.practical}>
          <Ionicons name="bulb-outline" size={16} color={fq.gold} />
          <Text style={styles.practicalText}>{difference.practicalNote}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginBottom: 12, padding: 16, borderRadius: 18, backgroundColor: fq.paper, borderWidth: 1, borderColor: fq.line },
  question: { color: fq.ink, fontSize: 17, lineHeight: 24, fontWeight: "700" },
  text: { color: fq.inkSoft, fontSize: 15, lineHeight: 23, marginTop: 8 },
  positions: { marginTop: 10 },
  position: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: fq.lineSoft },
  schoolRow: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: fq.gold, fontSize: 15, fontWeight: "700" },
  positionBody: { paddingBottom: 12 },
  consequence: { color: fq.inkMuted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  practical: { flexDirection: "row", gap: 8, marginTop: 10, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: fq.lineSoft },
  practicalText: { flex: 1, color: fq.inkSoft, fontSize: 14, lineHeight: 21 },
});
