import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import { pil, pilType } from "../../components/pilgrimage/theme";
import { CHECKLIST, CHECKLIST_TOTAL } from "../../features/pilgrimage/pilgrimageChecklist";
import { updatePilgrimageState, usePilgrimageState } from "../../features/pilgrimage/pilgrimageStorage";

export default function PilgrimageChecklist() {
  const insets = useSafeAreaInsets();
  const state = usePilgrimageState();
  const checked = new Set(state?.checklist ?? []);
  const ratio = checked.size / CHECKLIST_TOTAL;
  const ring = 2 * Math.PI * 34;

  const toggle = (id: string) => {
    void Haptics.selectionAsync().catch(() => undefined);
    void updatePilgrimageState((current) => ({
      ...current,
      checklist: current.checklist.includes(id) ? current.checklist.filter((item) => item !== id) : [...current.checklist, id],
    }));
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} hitSlop={8} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>AVANT LE DÉPART</Text>
          <Text style={styles.title}>Ma valise</Text>
        </View>
        <View style={styles.ring}>
          <Svg width={80} height={80}>
            <Circle cx={40} cy={40} r={34} stroke="rgba(255,255,255,0.12)" strokeWidth={7} fill="none" />
            <Circle
              cx={40}
              cy={40}
              r={34}
              stroke={ratio >= 1 ? pil.green : pil.gold}
              strokeWidth={7}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${ring * ratio} ${ring}`}
              transform="rotate(-90 40 40)"
            />
          </Svg>
          <Text style={styles.ringText}>{checked.size}/{CHECKLIST_TOTAL}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>
        {CHECKLIST.map((section) => {
          const sectionDone = section.items.filter((item) => checked.has(item.id)).length;
          return (
            <View key={section.id}>
              <View style={styles.sectionHead}>
                <Ionicons name={section.icon as keyof typeof Ionicons.glyphMap} size={18} color={pil.gold} />
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={[styles.sectionCount, sectionDone === section.items.length && styles.sectionCountDone]}>{sectionDone}/{section.items.length}</Text>
              </View>
              <View style={styles.group}>
                {section.items.map((item, index) => {
                  const isChecked = checked.has(item.id);
                  return (
                    <Pressable
                      key={item.id}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isChecked }}
                      onPress={() => toggle(item.id)}
                      style={[styles.row, index > 0 && styles.rowDivider]}
                    >
                      <View style={[styles.box, isChecked && styles.boxChecked]}>
                        {isChecked ? <Ionicons name="checkmark" size={17} color={pil.ink} /> : null}
                      </View>
                      <View style={styles.rowCopy}>
                        <Text style={[styles.rowLabel, isChecked && styles.rowLabelChecked]}>{item.label}</Text>
                        {item.hint ? <Text style={styles.rowHint}>{item.hint}</Text> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: pil.bg },
  header: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: pil.surfaceHigh },
  headerCopy: { flex: 1 },
  eyebrow: { color: pil.gold, fontSize: 12, fontWeight: "800", letterSpacing: 1.3, ...pilType.sans },
  title: { color: pil.text, fontSize: 32, ...pilType.display },
  ring: { width: 80, height: 80, alignItems: "center", justifyContent: "center" },
  ringText: { position: "absolute", color: pil.text, fontSize: 15, fontWeight: "800", ...pilType.sans },
  content: { paddingHorizontal: 18, paddingTop: 8 },
  sectionHead: { marginTop: 20, marginBottom: 9, flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { flex: 1, color: pil.text, fontSize: 18, fontWeight: "800", ...pilType.sans },
  sectionCount: { color: pil.textSoft, fontSize: 14, fontWeight: "700", ...pilType.sans },
  sectionCountDone: { color: pil.green },
  group: { overflow: "hidden", borderRadius: 20, backgroundColor: pil.surface },
  row: { minHeight: 56, paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: pil.line },
  box: { width: 26, height: 26, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1.5, borderColor: pil.goldLine },
  boxChecked: { borderColor: pil.gold, backgroundColor: pil.gold },
  rowCopy: { flex: 1 },
  rowLabel: { color: pil.text, fontSize: 16, ...pilType.sans },
  rowLabelChecked: { color: pil.muted, textDecorationLine: "line-through" },
  rowHint: { marginTop: 2, color: pil.textSoft, fontSize: 13, lineHeight: 18, ...pilType.sans },
});
