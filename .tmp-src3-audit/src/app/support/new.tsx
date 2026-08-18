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

import {
  createSupportTicket,
  type SupportTicketCategory,
  type SupportTicketPriority,
} from "../../features/support/SupportService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const CATEGORIES: Array<{
  value: SupportTicketCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: "bug", label: "Signaler un bug", icon: "bug-outline" },
  { value: "help", label: "Demander de l’aide", icon: "help-circle-outline" },
  { value: "suggestion", label: "Faire une suggestion", icon: "bulb-outline" },
  { value: "account", label: "Compte ou crédits", icon: "person-circle-outline" },
  { value: "other", label: "Autre demande", icon: "chatbox-outline" },
];

export default function NewSupportTicketScreen() {
  const [category, setCategory] =
    useState<SupportTicketCategory>("bug");
  const [priority, setPriority] =
    useState<SupportTicketPriority>("normal");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    if (cleanSubject.length < 4) {
      Alert.alert("Sujet trop court", "Décrivez brièvement votre demande.");
      return;
    }

    if (cleanMessage.length < 10) {
      Alert.alert(
        "Message trop court",
        "Ajoutez suffisamment de détails pour que nous puissions vous aider.",
      );
      return;
    }

    setSending(true);

    try {
      const ticketId = await createSupportTicket({
        category,
        priority,
        subject: cleanSubject,
        message: cleanMessage,
      });

      Alert.alert(
        "Demande envoyée",
        "L’équipe OUMMAH pourra maintenant consulter votre message.",
        [
          {
            text: "Voir la demande",
            onPress: () =>
              router.replace({
                pathname: "/support/[id]",
                params: { id: ticketId },
              }),
          },
        ],
      );
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
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>
        <Text style={styles.title}>Nouvelle demande</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionTitle}>Type de demande</Text>

        {CATEGORIES.map((item) => {
          const selected = category === item.value;

          return (
            <Pressable
              key={item.value}
              onPress={() => setCategory(item.value)}
              style={[
                styles.choice,
                selected && styles.choiceSelected,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={19}
                color={selected ? colors.background : colors.goldLight}
              />
              <Text
                style={[
                  styles.choiceText,
                  selected && styles.choiceTextSelected,
                ]}
              >
                {item.label}
              </Text>
              <Ionicons
                name={selected ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={selected ? colors.background : colors.textMuted}
              />
            </Pressable>
          );
        })}

        <Text style={styles.sectionTitle}>Priorité</Text>
        <View style={styles.priorityRow}>
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
                  styles.priorityText,
                  priority === item && styles.priorityTextActive,
                ]}
              >
                {item === "low"
                  ? "Faible"
                  : item === "normal"
                    ? "Normale"
                    : item === "high"
                      ? "Haute"
                      : "Urgente"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Sujet</Text>
        <TextInput
          value={subject}
          onChangeText={setSubject}
          maxLength={120}
          placeholder="Ex. L’application se ferme sur la page Coran"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Votre message</Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          maxLength={3000}
          multiline
          textAlignVertical="top"
          placeholder="Décrivez précisément ce qui se passe…"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, styles.messageInput]}
        />

        <Text style={styles.counter}>{message.length}/3000</Text>

        <Pressable
          disabled={sending}
          onPress={() => void submit()}
          style={[styles.submitButton, sending && styles.disabled]}
        >
          {sending ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Ionicons name="send-outline" size={18} color={colors.background} />
          )}
          <Text style={styles.submitText}>
            {sending ? "Envoi en cours…" : "Envoyer la demande"}
          </Text>
        </Pressable>
      </ScrollView>
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
    fontSize: 22,
  },
  content: { padding: 18, paddingBottom: 55 },
  sectionTitle: {
    marginTop: 6,
    marginBottom: 11,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  choice: {
    minHeight: 58,
    marginBottom: 8,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  choiceSelected: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  choiceText: {
    flex: 1,
    color: colors.text,
    fontSize: 11.5,
    fontWeight: "800",
  },
  choiceTextSelected: {
    color: colors.background,
  },
  priorityRow: { flexDirection: "row", gap: 6 },
  priorityButton: {
    flex: 1,
    minHeight: 39,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  priorityButtonActive: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  urgentButton: {
    borderColor: "#F28B82",
    backgroundColor: "#F28B82",
  },
  priorityText: {
    color: colors.textMuted,
    fontSize: 8.5,
    fontWeight: "800",
  },
  priorityTextActive: { color: colors.background },
  label: {
    marginTop: 20,
    marginBottom: 7,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
  },
  input: {
    minHeight: 49,
    paddingHorizontal: 13,
    color: colors.text,
    fontSize: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  messageInput: { minHeight: 145, paddingTop: 12 },
  counter: {
    marginTop: 5,
    textAlign: "right",
    color: colors.textMuted,
    fontSize: 8.5,
  },
  submitButton: {
    minHeight: 52,
    marginTop: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 15,
    backgroundColor: colors.goldLight,
  },
  submitText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: "900",
  },
  disabled: { opacity: 0.5 },
});
