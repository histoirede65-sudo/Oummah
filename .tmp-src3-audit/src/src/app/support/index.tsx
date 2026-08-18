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
  getMySupportTickets,
  type SupportTicket,
} from "../../features/support/SupportService";
import { getValidSession } from "../../features/auth/SupabaseAuthService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const STATUS_LABELS = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
  closed: "Fermé",
} as const;

const CATEGORY_LABELS = {
  bug: "Bug",
  help: "Aide",
  suggestion: "Suggestion",
  account: "Compte",
  other: "Autre",
} as const;

export default function SupportHomeScreen() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const session = await getValidSession();
      setSignedIn(Boolean(session));

      if (!session) {
        setTickets([]);
        return;
      }

      setTickets(await getMySupportTickets());
    } catch (error) {
      Alert.alert(
        "Support OUMMAH",
        error instanceof Error ? error.message : "Chargement impossible.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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
          <Text style={styles.eyebrow}>AIDE ET CONTACT</Text>
          <Text style={styles.title}>Support OUMMAH</Text>
        </View>

        <View style={styles.headerButton} />
      </View>

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
          <View style={styles.hero}>
            <View style={styles.heroIcon}>
              <Ionicons
                name="help-buoy-outline"
                size={27}
                color={colors.goldLight}
              />
            </View>
            <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>Comment pouvons-nous aider ?</Text>
              <Text style={styles.heroText}>
                Signalez un bug, demandez de l’aide ou proposez une amélioration.
              </Text>
            </View>
          </View>

          {!signedIn ? (
            <View style={styles.authCard}>
              <Ionicons
                name="person-circle-outline"
                size={25}
                color={colors.goldLight}
              />
              <Text style={styles.authTitle}>Connexion nécessaire</Text>
              <Text style={styles.authText}>
                Connectez-vous depuis votre profil pour créer et suivre vos
                demandes.
              </Text>
              <Pressable
                onPress={() => router.push("/profile")}
                style={styles.authButton}
              >
                <Text style={styles.authButtonText}>Ouvrir mon profil</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => router.push("/support/new")}
                style={({ pressed }) => [
                  styles.newButton,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={colors.background}
                />
                <Text style={styles.newButtonText}>Créer une demande</Text>
              </Pressable>

              <Text style={styles.sectionTitle}>Mes demandes</Text>

              {tickets.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={28}
                    color={colors.goldLight}
                  />
                  <Text style={styles.emptyTitle}>Aucune demande</Text>
                  <Text style={styles.emptyText}>
                    Vos échanges avec l’équipe OUMMAH apparaîtront ici.
                  </Text>
                </View>
              ) : (
                tickets.map((ticket) => (
                  <Pressable
                    key={ticket.id}
                    onPress={() =>
                      router.push({
                        pathname: "/support/[id]",
                        params: { id: ticket.id },
                      })
                    }
                    style={({ pressed }) => [
                      styles.ticketCard,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.ticketTop}>
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>
                          {CATEGORY_LABELS[ticket.category]}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          ticket.status === "resolved" &&
                            styles.resolvedBadge,
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {STATUS_LABELS[ticket.status]}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.ticketSubject} numberOfLines={2}>
                      {ticket.subject}
                    </Text>

                    <View style={styles.ticketBottom}>
                      <Text style={styles.ticketDate}>
                        {new Date(ticket.lastMessageAt).toLocaleString(
                          "fr-FR",
                          {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </Text>

                      {ticket.unreadByUser ? (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadText}>Nouvelle réponse</Text>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                ))
              )}
            </>
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
    fontSize: 22,
  },
  loader: { marginTop: 70 },
  content: { padding: 18, paddingBottom: 55 },
  hero: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.06)",
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  heroCopy: { flex: 1, marginLeft: 13 },
  heroTitle: {
    color: colors.text,
    fontFamily: typography.serifMedium,
    fontSize: 16,
  },
  heroText: {
    marginTop: 5,
    color: colors.textMuted,
    fontSize: 10.5,
    lineHeight: 15,
  },
  authCard: {
    marginTop: 18,
    padding: 22,
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  authTitle: {
    marginTop: 9,
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  authText: {
    marginTop: 6,
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 10.5,
    lineHeight: 16,
  },
  authButton: {
    minHeight: 44,
    marginTop: 15,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.goldLight,
  },
  authButtonText: {
    color: colors.background,
    fontWeight: "800",
  },
  newButton: {
    minHeight: 52,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 15,
    backgroundColor: colors.goldLight,
  },
  newButtonText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: "900",
  },
  sectionTitle: {
    marginTop: 23,
    marginBottom: 11,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  emptyCard: {
    padding: 25,
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  emptyTitle: {
    marginTop: 10,
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  emptyText: {
    marginTop: 6,
    color: colors.textMuted,
    textAlign: "center",
    fontSize: 10,
  },
  ticketCard: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  ticketTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  categoryText: {
    color: colors.goldLight,
    fontSize: 8.5,
    fontWeight: "800",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: "rgba(116,180,255,0.10)",
  },
  resolvedBadge: {
    backgroundColor: "rgba(100,210,150,0.10)",
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 8.5,
    fontWeight: "800",
  },
  ticketSubject: {
    marginTop: 12,
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18,
  },
  ticketBottom: {
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ticketDate: {
    color: colors.textMuted,
    fontSize: 8.5,
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
  pressed: { opacity: 0.75 },
});
