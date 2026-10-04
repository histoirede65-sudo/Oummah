import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Invocation, Point, Source } from "../../features/pilgrimage/pilgrimageTypes";
import { sourceLabel } from "../../features/pilgrimage/pilgrimageTypes";
import { pil, pilType } from "./theme";

/** « Coran 2:196 · Hadith — Sahîh Muslim 1218 » on one discreet line. */
export function SourceLine({ sources }: { sources?: Source[] }) {
  if (!sources?.length) return null;
  return (
    <View style={styles.sources}>
      {sources.map((source) => (
        <View key={`${source.kind}-${source.reference}`} style={styles.sourceChip}>
          <Text style={styles.sourceKind}>{sourceLabel(source.kind)}</Text>
          <Text style={styles.sourceRef}>{source.reference.replace(/^Coran /, "")}</Text>
        </View>
      ))}
    </View>
  );
}

export function SectionTitle({ icon, children, color = pil.gold }: { icon: keyof typeof Ionicons.glyphMap; children: string; color?: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Ionicons name={icon} size={17} color={color} />
      <Text style={[styles.sectionTitleText, { color }]}>{children}</Text>
    </View>
  );
}

/** A statement with its sources and, when relevant, its weight (pillar, obligation…). */
export function PointRow({ point, index, bullet }: { point: Point; index?: number; bullet?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.point}>
      {index !== undefined ? (
        <View style={styles.pointNumber}><Text style={styles.pointNumberText}>{index + 1}</Text></View>
      ) : (
        <Ionicons name={bullet ?? "ellipse"} size={bullet ? 16 : 7} color={pil.gold} style={bullet ? styles.pointIcon : styles.pointDot} />
      )}
      <View style={styles.pointBody}>
        {point.importance ? (
          <Text style={[styles.importance, point.importance === "PILIER" && styles.importancePillar]}>{point.importance}</Text>
        ) : null}
        <Text style={styles.pointText}>{point.text}</Text>
        <SourceLine sources={point.sources} />
      </View>
    </View>
  );
}

/** Arabic, phonetics and meaning, with a large reading mode for use during the rite. */
export function InvocationCard({ invocation }: { invocation: Invocation }) {
  const [large, setLarge] = useState(false);
  const insets = useSafeAreaInsets();
  const free = !invocation.arabic;
  return (
    <View style={styles.invocation}>
      <View style={styles.invocationHead}>
        <Text style={styles.invocationStatus}>{invocation.status}</Text>
        {!free ? (
          <Pressable accessibilityRole="button" onPress={() => setLarge(true)} hitSlop={8} style={styles.largeButton}>
            <Ionicons name="expand-outline" size={15} color={pil.gold} />
            <Text style={styles.largeButtonText}>En grand</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.invocationTitle}>{invocation.title}</Text>
      {free ? (
        <View style={styles.freeRow}>
          <Ionicons name="chatbubbles-outline" size={22} color={pil.gold} />
          <Text style={styles.invocationTranslation}>{invocation.translation}</Text>
        </View>
      ) : (
        <>
          <Text style={styles.arabic}>{invocation.arabic}</Text>
          <Text style={styles.transliteration}>{invocation.transliteration}</Text>
          <Text style={styles.invocationTranslation}>{invocation.translation}</Text>
        </>
      )}
      <Text style={styles.invocationContext}>{invocation.context}</Text>
      <SourceLine sources={invocation.sources} />

      <Modal visible={large} animationType="fade" onRequestClose={() => setLarge(false)} statusBarTranslucent>
        <View style={[styles.largeScreen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.largeHead}>
            <Text style={styles.largeTitle}>{invocation.title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={() => setLarge(false)} hitSlop={10} style={styles.largeClose}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.largeContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.largeArabic}>{invocation.arabic}</Text>
            <Text style={styles.largeTransliteration}>{invocation.transliteration}</Text>
            <Text style={styles.largeTranslation}>{invocation.translation}</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  sources: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  sourceChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)" },
  sourceKind: { color: pil.gold, fontSize: 11, fontWeight: "800", ...pilType.sans },
  sourceRef: { color: pil.textSoft, fontSize: 12, fontWeight: "600", ...pilType.sans },
  sectionTitle: { marginTop: 26, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitleText: { fontSize: 15, fontWeight: "800", letterSpacing: 0.3, ...pilType.sans },
  point: { flexDirection: "row", gap: 12, paddingVertical: 10 },
  pointNumber: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: pil.goldSoft },
  pointNumberText: { color: pil.gold, fontSize: 14, fontWeight: "800", ...pilType.sans },
  pointIcon: { marginTop: 3 },
  pointDot: { marginTop: 9, marginHorizontal: 4 },
  pointBody: { flex: 1 },
  importance: { alignSelf: "flex-start", marginBottom: 6, paddingHorizontal: 8, paddingVertical: 3, overflow: "hidden", borderRadius: 7, color: pil.gold, backgroundColor: pil.goldSoft, fontSize: 11, fontWeight: "800", letterSpacing: 0.6, ...pilType.sans },
  importancePillar: { color: pil.ink, backgroundColor: pil.gold },
  pointText: { color: pil.text, fontSize: 17, lineHeight: 26, ...pilType.sans },
  invocation: { marginBottom: 12, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: pil.goldLine, backgroundColor: pil.surfaceHigh },
  invocationHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  invocationStatus: { color: pil.gold, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, ...pilType.sans },
  largeButton: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: pil.goldSoft },
  largeButtonText: { color: pil.gold, fontSize: 12.5, fontWeight: "800", ...pilType.sans },
  invocationTitle: { marginTop: 8, color: pil.text, fontSize: 18, fontWeight: "700", ...pilType.sans },
  arabic: { marginTop: 14, color: pil.text, fontSize: 25, lineHeight: 48, textAlign: "right", writingDirection: "rtl", ...pilType.arabic },
  transliteration: { marginTop: 10, color: pil.gold, fontSize: 16, lineHeight: 24, fontStyle: "italic", ...pilType.sans },
  invocationTranslation: { flex: 1, marginTop: 8, color: pil.text, fontSize: 16.5, lineHeight: 25, ...pilType.sans },
  freeRow: { marginTop: 4, flexDirection: "row", alignItems: "center", gap: 12 },
  invocationContext: { marginTop: 10, color: pil.textSoft, fontSize: 14.5, lineHeight: 22, ...pilType.sans },
  largeScreen: { flex: 1, paddingHorizontal: 22, backgroundColor: pil.bg },
  largeHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  largeTitle: { flex: 1, color: pil.gold, fontSize: 17, fontWeight: "800", ...pilType.sans },
  largeClose: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: pil.surfaceHigh },
  largeContent: { flexGrow: 1, justifyContent: "center", paddingVertical: 24 },
  largeArabic: { color: pil.text, fontSize: 38, lineHeight: 72, textAlign: "center", writingDirection: "rtl", ...pilType.arabic },
  largeTransliteration: { marginTop: 26, color: pil.gold, fontSize: 21, lineHeight: 31, textAlign: "center", fontStyle: "italic", ...pilType.sans },
  largeTranslation: { marginTop: 18, color: pil.text, fontSize: 19, lineHeight: 29, textAlign: "center", ...pilType.sans },
});
