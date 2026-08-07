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
  getSupportTicketMessages,
  replyToSupportTicket,
  type SupportMessage,
} from "../../features/support/SupportService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function SupportThreadScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const ticketId = single(params.id);

  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!ticketId) {
      router.back();
      return;
    }

    setLoading(true);

    try {
      setMessages(await getSupportTicketMessages(ticketId));
    } catch (error) {
      Alert.alert(
        "Support OUMMAH",
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
    if (!ticketId || sending) return;

    const body = reply.trim();

    if (body.length < 2) return;

    setSending(true);

    try {
      await replyToSupportTicket(ticketId, body);
      setReply("");
      await load();
    } catch (error) {
      Alert.alert(
        "Envoi impossible",
        error instanceof Error ? error.message : "Réessayez.",
      );
    } finally {
      setSending(false);
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
          <Text style={styles.title}>Conversation support</Text>
          <Pressable onPress={() => void load()} style={styles.headerButton}>
            <Ionicons name="refresh" size={20} color={colors.goldLight} />
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
                      styles.messageRow,
                      admin
                        ? styles.adminMessageRow
                        : styles.userMessageRow,
                    ]}
                  >
                    <View
                      style={[
                        styles.bubble,
                        admin ? styles.adminBubble : styles.userBubble,
                      ]}
                    >
                      <Text style={styles.sender}>
                        {admin ? "Équipe OUMMAH" : "Vous"}
                      </Text>
                      <Text style={styles.body}>{message.body}</Text>
                      <Text style={styles.date}>
                        {new Date(message.createdAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
                placeholder="Écrire une réponse…"
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
    fontSize: 20,
  },
  loader: { marginTop: 70 },
  content: { padding: 16, paddingBottom: 24 },
  messageRow: { marginBottom: 10, flexDirection: "row" },
  adminMessageRow: { justifyContent: "flex-start" },
  userMessageRow: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "85%",
    padding: 13,
    borderRadius: 16,
  },
  adminBubble: {
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.08)",
  },
  userBubble: { backgroundColor: colors.card },
  sender: {
    color: colors.goldLight,
    fontSize: 9,
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
    backgroundColor: colors.background,
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
