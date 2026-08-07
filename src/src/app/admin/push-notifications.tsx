import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getValidSession } from "../../features/auth/SupabaseAuthService";
import { isOummahAdminSession } from "../../features/auth/AdminAccess";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Audience = "all" | "free" | "premium";

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) throw new Error("ADMIN_SUPABASE_NOT_CONFIGURED");
  return { url, key };
}

export default function AdminPushNotificationsScreen() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [route, setRoute] = useState("/");
  const [audience, setAudience] = useState<Audience>("all");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();

    if (cleanTitle.length < 3 || cleanBody.length < 3) {
      Alert.alert("Contenu incomplet", "Ajoutez un titre et un message.");
      return;
    }

    Alert.alert(
      "Envoyer la notification",
      `Cible : ${audience === "all" ? "Tous" : audience === "free" ? "Gratuits" : "Premium"}\n\n${cleanTitle}`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer",
          onPress: async () => {
            setSending(true);
            try {
              const session = await getValidSession(true);
              if (!isOummahAdminSession(session)) {
                throw new Error("ADMIN_FORBIDDEN");
              }

              const { url, key } = configuration();
              const response = await fetch(
                `${url}/functions/v1/send-admin-push`,
                {
                  method: "POST",
                  headers: {
                    apikey: key,
                    Authorization: `Bearer ${session!.accessToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    title: cleanTitle,
                    body: cleanBody,
                    audience,
                    route: route.trim() || "/",
                  }),
                },
              );

              const result = await response.json().catch(() => null);
              if (!response.ok) {
                throw new Error(result?.error ?? "PUSH_SEND_FAILED");
              }

              Alert.alert(
                "Notification envoyée",
                `${result?.sent ?? 0} appareil(s) ciblé(s).`,
              );
              setTitle("");
              setBody("");
              setRoute("/");
            } catch (error) {
              Alert.alert(
                "Envoi impossible",
                error instanceof Error ? error.message : "Réessayez.",
              );
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>Notification push</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.infoCard}>
          <Ionicons name="notifications-outline" size={23} color={colors.goldLight} />
          <Text style={styles.infoText}>
            Le message sera reçu même lorsque l’application est fermée.
          </Text>
        </View>

        <Text style={styles.label}>Public ciblé</Text>
        <View style={styles.audienceRow}>
          {(["all", "free", "premium"] as const).map((item) => (
            <Pressable
              key={item}
              onPress={() => setAudience(item)}
              style={[
                styles.audienceButton,
                audience === item && styles.audienceButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.audienceText,
                  audience === item && styles.audienceTextActive,
                ]}
              >
                {item === "all" ? "Tous" : item === "free" ? "Gratuits" : "Premium"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Titre</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          maxLength={80}
          placeholder="Ex. Une nouveauté vous attend"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Message</Text>
        <TextInput
          value={body}
          onChangeText={setBody}
          maxLength={220}
          multiline
          textAlignVertical="top"
          placeholder="Écrivez le message de la notification…"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.bodyInput]}
        />

        <Text style={styles.label}>Page ouverte au clic</Text>
        <TextInput
          value={route}
          onChangeText={setRoute}
          placeholder="/ ou /premium"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          style={styles.input}
        />

        <Pressable
          disabled={sending}
          onPress={() => void send()}
          style={[styles.sendButton, sending && styles.disabled]}
        >
          {sending ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Ionicons name="send-outline" size={18} color={colors.background} />
          )}
          <Text style={styles.sendText}>
            {sending ? "Envoi en cours…" : "Envoyer la notification"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 70, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border },
  headerButton: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  headerCopy: { alignItems: "center" },
  eyebrow: { color: colors.goldMuted, fontSize: 8, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: colors.text, fontFamily: typography.serifSemibold, fontSize: 22 },
  content: { padding: 18, paddingBottom: 50 },
  infoCard: { padding: 15, flexDirection: "row", alignItems: "center", gap: 11, borderRadius: 17, borderWidth: 1, borderColor: "rgba(241,188,79,0.25)", backgroundColor: "rgba(241,188,79,0.06)" },
  infoText: { flex: 1, color: colors.textSecondary, fontSize: 10.5, lineHeight: 16 },
  label: { marginTop: 18, marginBottom: 7, color: colors.textSecondary, fontSize: 11, fontWeight: "800" },
  audienceRow: { flexDirection: "row", gap: 8 },
  audienceButton: { flex: 1, minHeight: 42, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  audienceButtonActive: { borderColor: colors.goldLight, backgroundColor: colors.goldLight },
  audienceText: { color: colors.textMuted, fontSize: 10, fontWeight: "800" },
  audienceTextActive: { color: colors.background },
  input: { minHeight: 49, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, color: colors.text, fontSize: 13 },
  bodyInput: { minHeight: 115, paddingTop: 12 },
  sendButton: { minHeight: 52, marginTop: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 15, backgroundColor: colors.goldLight },
  sendText: { color: colors.background, fontSize: 13, fontWeight: "900" },
  disabled: { opacity: 0.5 },
});
