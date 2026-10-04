import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { InvocationCard, TextScaleContext } from "../../components/pilgrimage/PilgrimBits";
import { pil, pilType } from "../../components/pilgrimage/theme";
import { INVOCATIONS } from "../../features/pilgrimage/pilgrimageInvocations";
import { usePilgrimageState } from "../../features/pilgrimage/pilgrimageStorage";

export default function PilgrimageInvocations() {
  const insets = useSafeAreaInsets();
  const moments = useMemo(() => [...new Set(INVOCATIONS.map((item) => item.moment))], []);
  const [moment, setMoment] = useState<string | null>(null);
  const state = usePilgrimageState();
  const shown = moment ? INVOCATIONS.filter((item) => item.moment === moment) : INVOCATIONS;

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 6 }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retour" onPress={() => router.back()} hitSlop={8} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>DANS L’ORDRE DU PARCOURS</Text>
          <Text style={styles.title}>Invocations</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filtersBar}>
        {[null, ...moments].map((item) => (
          <Pressable key={item ?? "all"} onPress={() => setMoment(item)} style={[styles.filter, moment === item && styles.filterActive]}>
            <Text style={[styles.filterText, moment === item && styles.filterTextActive]}>{item ?? "Tout"}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <TextScaleContext.Provider value={state?.textScale ?? 1}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]} showsVerticalScrollIndicator={false}>
        <View style={styles.tip}>
          <Ionicons name="expand-outline" size={18} color={pil.gold} />
          <Text style={styles.tipText}>Touchez « En grand » pour lire une invocation en plein écran pendant le rite.</Text>
        </View>
        {shown.map((invocation, index) => (
          <View key={invocation.id}>
            {!moment && (index === 0 || shown[index - 1].moment !== invocation.moment) ? (
              <Text style={styles.moment}>{invocation.moment}</Text>
            ) : null}
            <InvocationCard invocation={invocation} />
          </View>
        ))}
      </ScrollView>
      </TextScaleContext.Provider>
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
  filtersBar: { flexGrow: 0, marginTop: 12 },
  filters: { paddingHorizontal: 16, gap: 8 },
  filter: { minHeight: 38, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: pil.surface },
  filterActive: { backgroundColor: pil.gold },
  filterText: { color: pil.text, fontSize: 14.5, fontWeight: "700", ...pilType.sans },
  filterTextActive: { color: pil.ink, fontWeight: "800" },
  content: { paddingHorizontal: 18, paddingTop: 14 },
  tip: { marginBottom: 6, padding: 12, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 14, backgroundColor: pil.goldSoft },
  tipText: { flex: 1, color: pil.text, fontSize: 14.5, lineHeight: 21, ...pilType.sans },
  moment: { marginTop: 18, marginBottom: 10, color: pil.text, fontSize: 24, ...pilType.display },
});
