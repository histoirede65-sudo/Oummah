import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  getAdminSupportTickets,
  type AdminSupportTicket,
} from "../../features/support/AdminSupportService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type Filter = "open" | "in_progress" | "resolved" | "closed";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "open", label: "Ouverts" },
  { value: "in_progress", label: "En cours" },
  { value: "resolved", label: "Résolus" },
  { value: "closed", label: "Fermés" },
];

export default function AdminSupportScreen() {
  const [filter, setFilter] = useState<Filter>("open");
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      setTickets(await getAdminSupportTickets(filter));
    } catch (error) {
      Alert.alert(
        "Support administrateur",
        error instanceof Error ? error.message : "Chargement impossible.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={22} color={colors.goldLight} />
        </Pressable>

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>ADMINISTRATION</Text>
          <Text style={styles.title}>Support utilisateurs</Text>
        </View>

        <Pressable onPress={() => void load()} style={styles.headerButton}>
          <Ionicons name="refresh" size={20} color={colors.goldLight} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((item) => (
          <Pressable
            key={item.value}
            onPress={() => setFilter(item.value)}
            style={[
              styles.filter,
              filter === item.value && styles.filterActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                filter === item.value && styles.filterTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.goldLight} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load(true);
              }}
              tintColor={colors.goldLight}
            />
          }
        >
          {tickets.length === 0 ? (
            <Text style={styles.empty}>Aucun ticket dans cette catégorie.</Text>
          ) : (
            tickets.map((ticket) => (
              <Pressable
                key={ticket.id}
                onPress={() =>
                  router.push({
                    pathname: "/admin/support/[id]",
                    params: { id: ticket.id },
                  })
                }
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.priorityBadge,
                      ticket.priority === "urgent" &&
                        styles.urgentBadge,
                    ]}
                  >
                    <Text style={styles.priorityText}>
                      {ticket.priority.toUpperCase()}
                    </Text>
                  </View>

                  {ticket.unreadByAdmin ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>NOUVEAU</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.subject}>{ticket.subject}</Text>
                <Text style={styles.email}>{ticket.userEmail}</Text>

                <View style={styles.cardBottom}>
                  <Text style={styles.category}>{ticket.category}</Text>
                  <Text style={styles.date}>
                    {new Date(ticket.lastMessageAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Text>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}
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
  headerCopy: { alignItems: "center" },
  eyebrow: {
    color: colors.goldMuted,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  title: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 20,
  },
  filters: { padding: 12, gap: 8 },
  filter: {
    minWidth: 88,
    height: 39,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  filterActive: { backgroundColor: colors.goldLight },
  filterText: {
    color: colors.textMuted,
    fontSize: 9.5,
    fontWeight: "800",
  },
  filterTextActive: { color: colors.background },
  loader: { marginTop: 70 },
  content: { padding: 18, paddingBottom: 55 },
  empty: {
    marginTop: 60,
    textAlign: "center",
    color: colors.textMuted,
  },
  card: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  urgentBadge: {
    backgroundColor: "rgba(242,139,130,0.12)",
  },
  priorityText: {
    color: colors.goldLight,
    fontSize: 8,
    fontWeight: "900",
  },
  unreadBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: colors.goldLight,
  },
  unreadText: {
    color: colors.background,
    fontSize: 8,
    fontWeight: "900",
  },
  subject: {
    marginTop: 12,
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  email: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 9.5,
  },
  cardBottom: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  category: {
    color: colors.goldLight,
    fontSize: 8.5,
    fontWeight: "800",
  },
  date: { color: colors.textMuted, fontSize: 8.5 },
  pressed: { opacity: 0.75 },
});
