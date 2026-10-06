import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

/**
 * Shared pieces of the admin space: one header, one confirmation banner after every action, and an
 * action button that handles waiting and errors by itself (no action can fail silently).
 */

type Toast = { id: number; text: string; tone: "ok" | "error" };
const ToastContext = createContext<(text: string, tone?: Toast["tone"]) => void>(() => undefined);

export function useAdminToast() {
  return useContext(ToastContext);
}

export function AdminScreen({ title, eyebrow = "Administration", children, onRefresh, refreshing = false, back = true, right }: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  back?: boolean;
  right?: ReactNode;
}) {
  const [toast, setToast] = useState<Toast | null>(null);
  const counter = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    counter.current += 1;
    setToast({ id: counter.current, text, tone });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), tone === "error" ? 6000 : 2600);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.header}>
          {back ? (
            <Pressable onPress={() => router.back()} style={styles.headerButton} accessibilityRole="button" accessibilityLabel="Retour" hitSlop={6}>
              <Ionicons name="chevron-back" size={22} color={colors.goldLight} />
            </Pressable>
          ) : null}
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>
          {right}
        </View>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={onRefresh ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.goldLight} /> : undefined}
        >
          {children}
        </ScrollView>
        {toast ? (
          <Animated.View key={toast.id} entering={FadeInUp.duration(180)} exiting={FadeOutUp.duration(180)} style={[styles.toast, toast.tone === "error" && styles.toastError]} pointerEvents="none">
            <Ionicons name={toast.tone === "ok" ? "checkmark-circle" : "alert-circle"} size={20} color={toast.tone === "ok" ? colors.success : colors.danger} />
            <Text style={styles.toastText}>{toast.text}</Text>
          </Animated.View>
        ) : null}
      </SafeAreaView>
    </ToastContext.Provider>
  );
}

/** Button that runs an async action: shows a spinner, blocks double taps, confirms or explains the error. */
export function ActionButton({ label, onPress, done, tone = "gold", icon, compact = false, disabled = false }: {
  label: string;
  onPress: () => Promise<unknown>;
  /** Message shown when the action succeeded. */
  done?: string;
  tone?: "gold" | "outline" | "danger";
  icon?: keyof typeof Ionicons.glyphMap;
  compact?: boolean;
  disabled?: boolean;
}) {
  const toast = useAdminToast();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (busy || disabled) return;
    setBusy(true);
    try {
      await onPress();
      if (done) toast(done);
    } catch (error) {
      toast(error instanceof Error ? error.message : "L’action n’a pas abouti. Réessayez.", "error");
    } finally {
      setBusy(false);
    }
  };
  const color = tone === "gold" ? colors.background : tone === "danger" ? colors.danger : colors.text;
  return (
    <Pressable
      onPress={() => void run()}
      disabled={busy || disabled}
      accessibilityRole="button"
      style={({ pressed }) => [styles.button, compact && styles.buttonCompact, tone === "gold" ? styles.buttonGold : tone === "danger" ? styles.buttonDanger : styles.buttonOutline, (pressed || busy || disabled) && styles.pressed]}
    >
      {busy ? <ActivityIndicator size="small" color={color} /> : icon ? <Ionicons name={icon} size={17} color={color} /> : null}
      <Text style={[styles.buttonText, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.section}>{children}</Text>
      {count ? <View style={styles.count}><Text style={styles.countText}>{count}</Text></View> : null}
    </View>
  );
}

export function Card({ children, gold = false }: { children: ReactNode; gold?: boolean }) {
  return <View style={[styles.card, gold && styles.cardGold]}>{children}</View>;
}

export function EmptyState({ text, icon = "checkmark-done-outline" }: { text: string; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={styles.empty}>
      <Ionicons name={icon} size={28} color={colors.goldLight} />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export function ErrorState({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <View style={styles.empty}>
      <Ionicons name="cloud-offline-outline" size={28} color={colors.danger} />
      <Text style={styles.emptyText}>{text}</Text>
      <Pressable onPress={onRetry} style={[styles.button, styles.buttonOutline, styles.buttonCompact]}>
        <Text style={[styles.buttonText, { color: colors.text }]}>Réessayer</Text>
      </Pressable>
    </View>
  );
}

export function Loading() {
  return <View style={styles.loading}><ActivityIndicator color={colors.goldLight} /></View>;
}

export const adminStyles = StyleSheet.create({
  rowTitle: { color: colors.text, fontFamily: typography.sans, fontSize: 16, fontWeight: "700" },
  rowText: { marginTop: 3, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 14, lineHeight: 19 },
  meta: { marginTop: 6, color: colors.textMuted, fontFamily: typography.sans, fontSize: 12.5 },
  tag: { alignSelf: "flex-start", marginBottom: 6, color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  actions: { marginTop: 12, flexDirection: "row", gap: 8 },
  input: { minHeight: 48, paddingHorizontal: 14, color: colors.text, fontFamily: typography.sans, fontSize: 15, borderRadius: 14, borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: "rgba(255,255,255,0.04)" },
  label: { marginTop: 12, marginBottom: 6, color: colors.textSecondary, fontFamily: typography.sans, fontSize: 13, fontWeight: "700" },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 64, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  headerButton: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.borderSoft },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.goldLight, fontFamily: typography.sans, fontSize: 11, fontWeight: "800", letterSpacing: 1.3, textTransform: "uppercase" },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 28, lineHeight: 32 },
  content: { paddingHorizontal: 16, paddingBottom: 60, gap: 10 },
  toast: { position: "absolute", top: 70, left: 16, right: 16, flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: "rgba(98,197,139,0.4)", backgroundColor: "#122019" },
  toastError: { borderColor: "rgba(233,107,114,0.45)", backgroundColor: "#24121A" },
  toastText: { flex: 1, color: colors.text, fontFamily: typography.sans, fontSize: 14.5, lineHeight: 19 },
  button: { flex: 1, minHeight: 46, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 14 },
  buttonCompact: { flex: 0, minHeight: 40 },
  buttonGold: { backgroundColor: colors.goldLight },
  buttonOutline: { borderWidth: 1, borderColor: colors.borderSoft },
  buttonDanger: { borderWidth: 1, borderColor: "rgba(233,107,114,0.6)" },
  buttonText: { fontFamily: typography.sans, fontSize: 14.5, fontWeight: "800" },
  pressed: { opacity: 0.6 },
  sectionRow: { marginTop: 16, flexDirection: "row", alignItems: "center", gap: 8 },
  section: { color: colors.goldLight, fontFamily: typography.serifMedium, fontSize: 22 },
  count: { minWidth: 24, height: 24, paddingHorizontal: 7, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.danger },
  countText: { color: "#FFFFFF", fontFamily: typography.sans, fontSize: 12.5, fontWeight: "800" },
  card: { padding: 15, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: colors.card },
  cardGold: { borderColor: "rgba(227,181,90,0.4)", backgroundColor: "rgba(227,181,90,0.07)" },
  empty: { paddingVertical: 34, alignItems: "center", gap: 10 },
  emptyText: { color: colors.textSecondary, fontFamily: typography.sans, fontSize: 15, textAlign: "center", lineHeight: 21 },
  loading: { paddingVertical: 60, alignItems: "center" },
});
