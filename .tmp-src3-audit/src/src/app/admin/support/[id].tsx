import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  adminReplySupportTicket,
  adminUpdateSupportTicket,
  getAdminSupportMessages,
  type AdminSupportMessage,
} from "../../../features/support/AdminSupportService";
import { colors } from "../../../theme/colors";
import { typography } from "../../../theme/typography";

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function AdminSupportThreadScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const ticketId = single(params.id);

  const [messages, setMessages] = useState<AdminSupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("in_progress");
  const [priority, setPriority] = useState("normal");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!ticketId) {
      router.back();
      return;
    }

    setLoading(true);

    try {
      setMessages(await getAdminSupportMessages(ticketId));
    } catch (error) {
      Alert.alert(
        "Support administrateur",
        error instanceof Error ? error.message : "Chargement impossible.",
      );
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const send = async () => {
    if (!ticketId || sending || reply.trim().length < 2) return;

    setSending(true);

    try {
      await adminReplySupportTicket(ticketId, reply);
      setReply("");
      await load();
    } catch (error) {
      Alert.alert(
        "Réponse impossible",
        error instanceof Error ? error.message : "Réessayez.",
      );
    } finally {
      setSending(false);
    }
  };

  const update = async () => {
    if (!ticketId) return;

    try {
      await adminUpdateSupportTicket(ticketId, status, priority);
      Alert.alert("Ticket mis à jour", "Le statut et la priorité sont enregistrés.");
    } catch (error) {
      Alert.alert(
        "Mise à jour impossible",
        error instanceof Error ? error.message : "Réessayez.",
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
          </Pressable>
          <Text style={styles.title}>Traitement du ticket</Text>
          <Pressable onPress={() => void load()} style={styles.headerButton}>
            <Ionicons name="refresh" size={20} color={colors.goldLight} />
          </Pressable>
        </View>

        <View style={styles.controls}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(["open", "in_progress", "resolved", "closed"] as const).map(
              (item) => (
                <Pressable
                  key={item}
                  onPress={() => setStatus(item)}
                  style={[
                    styles.controlButton,
                    status === item && styles.controlButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.controlText,
                      status === item && styles.controlTextActive,
                    ]}
                  >
                    {item === "open"
                      ? "Ouvert"
                      : item === "in_progress"
                        ? "En cours"
                        : item === "resolved"
                          ? "Résolu"
                          : "Fermé"}
                  </Text>
                </Pressable>
              ),
            )}
          </ScrollView>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(["low", "normal", "high", "urgent"] as const).map((item) => (
              <Pressable
                key={item}
                onPress={() => setPriority(item)}
                style={[
                  styles.priorityButton,
                  priority === item && styles.priorityButtonActive,
                  item === "urgent" &&
                    priority === item &&
                    styles.urgentButton,
                ]}
              >
                <Text
                  style={[
                    styles.controlText,
                    priority === item && styles.controlTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable onPress={() => void update()} style={styles.updateButton}>
            <Text style={styles.updateText}>Enregistrer statut et priorité</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator style={styles.loader} color={colors.goldLight} />
        ) : (
          <>
            <ScrollView contentContainerStyle={styles.content}>
              {messages.map((message) => {
                const admin = message.senderType === "admin";

                return (
                  <View
                    key={message.id}
                    style={[
                      styles.row,
                      admin ? styles.adminRow : styles.userRow,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        admin ? styles.adminBubble : styles.userBubble,
                      ]}
                    >
                      <Text style={styles.sender}>
                        {admin
                          ? message.senderEmail ?? "Administrateur"
                          : message.senderEmail ?? "Utilisateur"}
                      </Text>
                      <Text style={styles.body}>{message.body}</Text>
                      <Text style={styles.date}>
                        {new Date(message.createdAt).toLocaleString("fr-FR")}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.composer}>
              <TextInput
                value={reply}
                onChangeText={setReply}
                multiline
                maxLength={3000}
                placeholder="Répondre à l’utilisateur…"
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
              <Pressable
                disabled={sending || reply.trim().length < 2}
                onPress={() => void send()}
                style={[
                  styles.sendButton,
                  (sending || reply.trim().length < 2) && styles.disabled,
                ]}
              >
                {sending ? (
                  <ActivityIndicator color={colors.background} />
                ) : (
                  <Ionicons
                    name="send"
                    size={18}
                    color={colors.background}
                  />
                )}
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    minHeight: 70,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  title: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 19,
  },
  controls: {
    padding: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  controlButton: {
    minWidth: 75,
    height: 35,
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    backgroundColor: colors.card,
  },
  controlButtonActive: { backgroundColor: colors.goldLight },
  priorityButton: {
    minWidth: 70,
    height: 34,
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityButtonActive: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  urgentButton: {
    borderColor: "#F28B82",
    backgroundColor: "#F28B82",
  },
  controlText: {
    color: colors.textMuted,
    fontSize: 8.5,
    fontWeight: "800",
  },
  controlTextActive: { color: colors.background },
  updateButton: {
    minHeight: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  updateText: {
    color: colors.goldLight,
    fontSize: 10,
    fontWeight: "800",
  },
  loader: { marginTop: 70 },
  content: { padding: 15, paddingBottom: 24 },
  row: { marginBottom: 10, flexDirection: "row" },
  adminRow: { justifyContent: "flex-end" },
  userRow: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "85%",
    padding: 13,
    borderRadius: 16,
  },
  adminBubble: {
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  userBubble: { backgroundColor: colors.card },
  sender: {
    color: colors.goldLight,
    fontSize: 8.5,
    fontWeight: "900",
  },
  body: {
    marginTop: 6,
    color: colors.text,
    fontSize: 12,
    lineHeight: 18,
  },
  date: {
    marginTop: 7,
    color: colors.textMuted,
    fontSize: 8,
  },
  composer: {
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    paddingHorizontal: 13,
    paddingVertical: 10,
    color: colors.text,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.goldLight,
  },
  disabled: { opacity: 0.45 },
});
