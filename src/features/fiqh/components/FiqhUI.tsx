import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useState, type ReactNode } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useI18n } from "../../../i18n";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";
import { sourceRoute, sourceShortLabel, sunnahUrl } from "../fiqhLessons";
import { localizeSource } from "../fiqhLocalization";
import { sourceById } from "../fiqhSources";
import { FIQH_TEXT_SCALES, updateFiqhReading } from "../fiqhStorage";

/** Sober reading palette of the Fiqh module. */
export const fq = {
  page: "#0A0814",
  paper: "#130E20",
  paperHigh: "#1B1429",
  line: "rgba(227, 181, 90, 0.16)",
  lineSoft: "rgba(255, 255, 255, 0.07)",
  ink: "#F5F0E8",
  inkSoft: "#D3CAD9",
  inkMuted: "#958AA3",
  gold: "#E3B55A",
  goldSoft: "rgba(227, 181, 90, 0.12)",
  red: "#E58C86",
  redSoft: "rgba(229, 140, 134, 0.10)",
};

export const fqType = {
  serif: typography.serifSemibold,
  arabic: typography.arabic,
};

export function FiqhTopBar({ label, right }: { label?: string; right?: ReactNode }) {
  const { t } = useI18n();
  return (
    <View style={styles.topBar}>
      <Pressable accessibilityRole="button" accessibilityLabel={t("common.back")} hitSlop={10} onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={fq.ink} />
      </Pressable>
      <Text style={styles.topLabel} numberOfLines={1}>{label ?? ""}</Text>
      <View style={styles.topRight}>{right}</View>
    </View>
  );
}

/** « Aa » button cycling through the reading sizes. */
export function TextSizeButton({ scale }: { scale: number }) {
  const { t } = useI18n();
  const index = Math.max(0, FIQH_TEXT_SCALES.indexOf(scale));
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t("fiqh.textSize")}
      hitSlop={8}
      onPress={() => void updateFiqhReading((value) => ({ ...value, textScale: FIQH_TEXT_SCALES[(index + 1) % FIQH_TEXT_SCALES.length] }))}
      style={styles.sizeButton}
    >
      <Text style={styles.sizeSmall}>A</Text>
      <Text style={styles.sizeBig}>A</Text>
      <View style={styles.sizeDots}>
        {FIQH_TEXT_SCALES.map((value, dot) => <View key={value} style={[styles.sizeDot, dot <= index && styles.sizeDotOn]} />)}
      </View>
    </Pressable>
  );
}

/** Small source references under a point; a tap opens the reference card. */
export function SourceChips({ ids, onOpen }: { ids?: string[]; onOpen: (id: string) => void }) {
  const { language, t } = useI18n();
  const shown = Array.from(new Set((ids ?? []).filter((id) => sourceById.has(id))));
  if (!shown.length) return null;
  return (
    <View style={styles.chips}>
      {shown.map((id) => (
        <Pressable key={id} accessibilityRole="button" accessibilityLabel={t("fiqh.sourceA11y", { label: sourceShortLabel(id, language) })} hitSlop={6} onPress={() => onOpen(id)} style={styles.chip}>
          <Text style={styles.chipText}>{sourceShortLabel(id, language)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Bottom sheet describing one source, with a link to read it in the app when possible. */
export function SourceSheet({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { language, t } = useI18n();
  const insets = useSafeAreaInsets();
  const found = id ? sourceById.get(id) : undefined;
  const source = found && localizeSource(found, language);
  const route = id ? sourceRoute(id) : null;
  const external = id ? sunnahUrl(id) : null;
  const kind = t(source?.kind === "quran" ? "fiqh.kindQuran" : source?.kind === "hadith" ? "fiqh.kindHadith" : source?.kind === "scholar" ? "fiqh.kindScholar" : "fiqh.kindBook");
  return (
    <Modal visible={!!source} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} accessibilityLabel={t("fiqh.close")} />
      {source ? (
        <View style={[styles.sheet, { paddingBottom: 22 + insets.bottom }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetKind}>{kind.toUpperCase()}</Text>
          <Text style={styles.sheetTitle}>{source.reference}</Text>
          {source.author ? <Text style={styles.sheetMeta}>{source.author}</Text> : null}
          {source.authenticity && /sah|hasan/i.test(source.authenticity) ? (
            <View style={styles.sheetBadge}><Ionicons name="checkmark-circle" size={14} color={fq.gold} /><Text style={styles.sheetBadgeText}>{source.authenticity}</Text></View>
          ) : null}
          {source.scope ? <Text style={styles.sheetBody}>{capitalize(source.scope)}.</Text> : null}
          {source.limits ? <Text style={styles.sheetLimits}>{source.limits}</Text> : null}
          {route ? (
            <Pressable accessibilityRole="link" onPress={() => { onClose(); router.push(route as never); }} style={styles.sheetLink}>
              <Text style={styles.sheetLinkText}>{t(source.kind === "quran" ? "fiqh.readVerse" : "fiqh.readHadith")}</Text>
              <Ionicons name="arrow-forward" size={16} color={fq.page} />
            </Pressable>
          ) : null}
          {external ? (
            <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(external)} style={route ? styles.sheetLinkSecondary : styles.sheetLink}>
              <Text style={route ? styles.sheetLinkSecondaryText : styles.sheetLinkText}>{t("fiqh.readSunnah")}</Text>
              <Ionicons name="open-outline" size={16} color={route ? fq.gold : fq.page} />
            </Pressable>
          ) : null}
          {external ? <Text style={styles.sheetHint}>{t("fiqh.sunnahHint")}</Text> : null}
        </View>
      ) : null}
    </Modal>
  );
}

export function useSourceSheet() {
  const [sourceId, setSourceId] = useState<string | null>(null);
  return { sourceId, openSource: setSourceId, closeSource: () => setSourceId(null) };
}

function capitalize(value: string) {
  return value ? value[0].toUpperCase() + value.slice(1) : value;
}

const styles = StyleSheet.create({
  topBar: { height: 52, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
  back: { width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: 20 },
  topLabel: { flex: 1, color: fq.inkMuted, fontSize: 13.5, fontWeight: "600", textAlign: "center" },
  topRight: { minWidth: 40, alignItems: "flex-end" },
  sizeButton: { height: 40, minWidth: 44, alignItems: "center", justifyContent: "center", flexDirection: "row", paddingHorizontal: 8 },
  sizeSmall: { color: fq.ink, fontSize: 13, fontWeight: "700" },
  sizeBig: { color: fq.ink, fontSize: 19, fontWeight: "700", marginLeft: 1 },
  sizeDots: { position: "absolute", bottom: 2, flexDirection: "row", gap: 3 },
  sizeDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: fq.lineSoft },
  sizeDotOn: { backgroundColor: fq.gold },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  chip: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: fq.goldSoft },
  chipText: { color: fq.gold, fontSize: 12, fontWeight: "700" },
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(4, 3, 10, 0.6)" },
  sheet: { paddingHorizontal: 22, paddingTop: 10, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: fq.paperHigh, borderWidth: 1, borderColor: fq.line },
  sheetHandle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: fq.lineSoft, marginBottom: 18 },
  sheetKind: { color: fq.gold, fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  sheetTitle: { color: fq.ink, fontSize: 20, lineHeight: 27, fontWeight: "700", marginTop: 6 },
  sheetMeta: { color: fq.inkSoft, fontSize: 14.5, marginTop: 4 },
  sheetBadge: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: fq.goldSoft },
  sheetBadgeText: { color: fq.gold, fontSize: 12.5, fontWeight: "700" },
  sheetBody: { color: fq.inkSoft, fontSize: 15.5, lineHeight: 24, marginTop: 14 },
  sheetLimits: { color: fq.inkMuted, fontSize: 13.5, lineHeight: 21, marginTop: 10 },
  sheetLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, marginTop: 20, borderRadius: 16, backgroundColor: fq.gold },
  sheetLinkText: { color: fq.page, fontSize: 15.5, fontWeight: "800" },
  sheetLinkSecondary: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 48, marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: fq.gold },
  sheetLinkSecondaryText: { color: fq.gold, fontSize: 15, fontWeight: "700" },
  sheetHint: { color: fq.inkMuted, fontSize: 12.5, textAlign: "center", marginTop: 8 },
});
