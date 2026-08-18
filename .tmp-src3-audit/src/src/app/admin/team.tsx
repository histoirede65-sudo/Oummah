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
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  addAdminMember,
  getAdminMembers,
  removeAdminMember,
  updateAdminMemberRole,
  type OummahAdminRole,
  type OummahAdminRow,
} from "../../features/admin/AdminService";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

const ROLES: Array<{
  value: OummahAdminRole;
  label: string;
  description: string;
}> = [
  {
    value: "admin",
    label: "Administrateur",
    description: "Accès complet sauf gestion du propriétaire",
  },
  {
    value: "mosque_moderator",
    label: "Modérateur mosquées",
    description: "Validation, refus et signalements des mosquées",
  },
  {
    value: "support",
    label: "Support",
    description: "Consultation utilisateurs et gestion des crédits",
  },
];

function roleLabel(role: OummahAdminRole) {
  if (role === "owner") return "Propriétaire";
  return ROLES.find((item) => item.value === role)?.label ?? role;
}

export default function AdminTeamScreen() {
  const [rows, setRows] = useState<OummahAdminRow[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OummahAdminRole>("mosque_moderator");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actingUserId, setActingUserId] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      setRows(await getAdminMembers());
    } catch (error) {
      Alert.alert(
        "Équipe administratrice",
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

  const addMember = async () => {
    const cleaned = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      Alert.alert("Adresse invalide", "Saisissez une adresse e-mail valide.");
      return;
    }

    setSaving(true);
    try {
      await addAdminMember(cleaned, role);
      setEmail("");
      await load(true);
      Alert.alert(
        "Accès accordé",
        "Le compte peut maintenant accéder aux fonctions autorisées.",
      );
    } catch (error) {
      Alert.alert(
        "Ajout impossible",
        error instanceof Error ? error.message : "Réessayez.",
      );
    } finally {
      setSaving(false);
    }
  };

  const changeRole = (
    member: OummahAdminRow,
    nextRole: OummahAdminRole,
  ) => {
    Alert.alert(
      "Modifier le rôle",
      `${member.email}\n\nNouveau rôle : ${roleLabel(nextRole)}`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          onPress: async () => {
            setActingUserId(member.userId);
            try {
              await updateAdminMemberRole(member.userId, nextRole);
              await load(true);
            } catch (error) {
              Alert.alert(
                "Modification impossible",
                error instanceof Error ? error.message : "Réessayez.",
              );
            } finally {
              setActingUserId(null);
            }
          },
        },
      ],
    );
  };

  const remove = (member: OummahAdminRow) => {
    Alert.alert(
      "Retirer l’accès",
      `Retirer tous les droits administrateur de ${member.email} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Retirer",
          style: "destructive",
          onPress: async () => {
            setActingUserId(member.userId);
            try {
              await removeAdminMember(member.userId);
              await load(true);
            } catch (error) {
              Alert.alert(
                "Suppression impossible",
                error instanceof Error ? error.message : "Réessayez.",
              );
            } finally {
              setActingUserId(null);
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
          <Text style={styles.title}>Équipe administratrice</Text>
        </View>

        <Pressable onPress={() => void load()} style={styles.headerButton}>
          <Ionicons name="refresh" size={20} color={colors.goldLight} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.goldLight} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
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
          <View style={styles.securityCard}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color={colors.goldLight}
            />
            <View style={styles.securityCopy}>
              <Text style={styles.securityTitle}>Accès sécurisé par rôle</Text>
              <Text style={styles.securityText}>
                Les autorisations sont vérifiées côté Supabase pour chaque
                action sensible.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Ajouter un membre</Text>

          <View style={styles.formCard}>
            <Text style={styles.label}>Adresse e-mail du compte OUMMAH</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="utilisateur@exemple.fr"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={styles.label}>Rôle</Text>
            {ROLES.map((item) => {
              const selected = role === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setRole(item.value)}
                  style={[
                    styles.roleChoice,
                    selected && styles.roleChoiceSelected,
                  ]}
                >
                  <View style={styles.roleChoiceCopy}>
                    <Text
                      style={[
                        styles.roleChoiceTitle,
                        selected && styles.roleChoiceTitleSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    <Text style={styles.roleChoiceDescription}>
                      {item.description}
                    </Text>
                  </View>

                  <Ionicons
                    name={
                      selected ? "checkmark-circle" : "ellipse-outline"
                    }
                    size={20}
                    color={selected ? colors.goldLight : colors.textMuted}
                  />
                </Pressable>
              );
            })}

            <Pressable
              disabled={saving}
              onPress={() => void addMember()}
              style={[styles.addButton, saving && styles.disabled]}
            >
              {saving ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Ionicons
                  name="person-add-outline"
                  size={18}
                  color={colors.background}
                />
              )}
              <Text style={styles.addButtonText}>
                {saving ? "Ajout en cours…" : "Accorder l’accès"}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Membres actuels</Text>

          {rows.map((member) => {
            const acting = actingUserId === member.userId;
            const protectedOwner = member.role === "owner";

            return (
              <View key={member.userId} style={styles.memberCard}>
                <View style={styles.memberTop}>
                  <View style={styles.avatar}>
                    <Ionicons
                      name={
                        protectedOwner
                          ? "ribbon-outline"
                          : "person-outline"
                      }
                      size={20}
                      color={colors.goldLight}
                    />
                  </View>

                  <View style={styles.memberCopy}>
                    <Text style={styles.memberEmail} numberOfLines={1}>
                      {member.email}
                    </Text>
                    <Text style={styles.memberMeta}>
                      Ajouté le{" "}
                      {new Date(member.createdAt).toLocaleDateString("fr-FR")}
                    </Text>
                  </View>

                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>
                      {roleLabel(member.role)}
                    </Text>
                  </View>
                </View>

                {!protectedOwner ? (
                  <>
                    <View style={styles.quickRoles}>
                      {ROLES.map((item) => (
                        <Pressable
                          key={item.value}
                          disabled={acting || member.role === item.value}
                          onPress={() => changeRole(member, item.value)}
                          style={[
                            styles.quickRole,
                            member.role === item.value &&
                              styles.quickRoleActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.quickRoleText,
                              member.role === item.value &&
                                styles.quickRoleTextActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    <Pressable
                      disabled={acting}
                      onPress={() => remove(member)}
                      style={styles.removeButton}
                    >
                      <Ionicons
                        name="person-remove-outline"
                        size={16}
                        color="#F28B82"
                      />
                      <Text style={styles.removeButtonText}>
                        Retirer l’accès administrateur
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <View style={styles.ownerNotice}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={14}
                      color={colors.goldLight}
                    />
                    <Text style={styles.ownerNoticeText}>
                      Compte propriétaire protégé
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
  headerCopy: {
    alignItems: "center",
  },
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
  loader: {
    marginTop: 70,
  },
  content: {
    padding: 18,
    paddingBottom: 55,
  },
  securityCard: {
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(241,188,79,0.24)",
    backgroundColor: "rgba(241,188,79,0.06)",
  },
  securityCopy: {
    flex: 1,
    marginLeft: 12,
  },
  securityTitle: {
    color: colors.text,
    fontSize: 12.5,
    fontWeight: "800",
  },
  securityText: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9.5,
    lineHeight: 14,
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 11,
    color: colors.goldLight,
    fontFamily: typography.serifMedium,
    fontSize: 18,
  },
  formCard: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  label: {
    marginBottom: 7,
    color: colors.textSecondary,
    fontSize: 10.5,
    fontWeight: "700",
  },
  input: {
    minHeight: 48,
    marginBottom: 14,
    paddingHorizontal: 13,
    color: colors.text,
    fontSize: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  roleChoice: {
    minHeight: 65,
    marginBottom: 8,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  roleChoiceSelected: {
    borderColor: colors.goldLight,
    backgroundColor: "rgba(241,188,79,0.07)",
  },
  roleChoiceCopy: {
    flex: 1,
    marginRight: 10,
  },
  roleChoiceTitle: {
    color: colors.text,
    fontSize: 11.5,
    fontWeight: "800",
  },
  roleChoiceTitleSelected: {
    color: colors.goldLight,
  },
  roleChoiceDescription: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9,
    lineHeight: 13,
  },
  addButton: {
    minHeight: 49,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    backgroundColor: colors.goldLight,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 12.5,
    fontWeight: "900",
  },
  memberCard: {
    marginBottom: 11,
    padding: 14,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  memberTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  memberCopy: {
    flex: 1,
    marginHorizontal: 10,
  },
  memberEmail: {
    color: colors.text,
    fontSize: 11.5,
    fontWeight: "800",
  },
  memberMeta: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 8.5,
  },
  roleBadge: {
    maxWidth: 100,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(241,188,79,0.10)",
  },
  roleBadgeText: {
    color: colors.goldLight,
    textAlign: "center",
    fontSize: 8.5,
    fontWeight: "800",
  },
  quickRoles: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickRole: {
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickRoleActive: {
    borderColor: colors.goldLight,
    backgroundColor: colors.goldLight,
  },
  quickRoleText: {
    color: colors.textMuted,
    fontSize: 8.5,
    fontWeight: "700",
  },
  quickRoleTextActive: {
    color: colors.background,
  },
  removeButton: {
    minHeight: 40,
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#F28B82",
  },
  removeButtonText: {
    color: "#F28B82",
    fontSize: 10,
    fontWeight: "800",
  },
  ownerNotice: {
    marginTop: 11,
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderRadius: 11,
    backgroundColor: "rgba(241,188,79,0.07)",
  },
  ownerNoticeText: {
    color: colors.goldLight,
    fontSize: 9.5,
    fontWeight: "800",
  },
  disabled: {
    opacity: 0.5,
  },
});
