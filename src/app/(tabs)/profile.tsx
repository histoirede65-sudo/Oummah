import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../theme/colors";
import { getMyUnreadSupportCount } from "../../features/support/SupportService";
import { typography } from "../../theme/typography";
import {
  getValidSession,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  SupabaseAuthSession,
} from "../../features/auth/SupabaseAuthService";
import { isOummahAdminSession } from "../../features/auth/AdminAccess";

const LOCAL_DATA = [
  { icon: "trending-up-outline", label: "Progression" },
  { icon: "bookmark-outline", label: "Favoris" },
  { icon: "options-outline", label: "Préférences" },
] as const;

export default function ProfileScreen() {
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const router = useRouter();
  const [session, setSession] = useState<SupabaseAuthSession | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const isAdmin = isOummahAdminSession(session);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getValidSession()
        .then((nextSession) => {
          if (active) setSession(nextSession);
        })
        .catch(() => {
          if (active) setSession(null);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const openAuth = (mode: "signup" | "signin") => {
    setAuthMode(mode);
    setPassword("");
    setAuthOpen(true);
  };

  const authenticateWithPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      Alert.alert("Adresse e-mail", "Saisissez une adresse e-mail valide.");
      return;
    }
    if (password.length < 6) {
      Alert.alert(
        "Mot de passe",
        "Choisissez un mot de passe d’au moins 6 caractères.",
      );
      return;
    }

    setLoading(true);
    try {
      const nextSession = authMode === "signup"
        ? await signUpWithPassword(normalizedEmail, password)
        : await signInWithPassword(normalizedEmail, password);

      setAuthOpen(false);
      setPassword("");

      if (authMode === "signup" && !nextSession) {
        Alert.alert(
          "Compte créé",
          "Consultez votre e-mail pour confirmer votre compte OUMMAH, puis connectez-vous.",
        );
        return;
      }

      setSession(nextSession);
      Alert.alert(
        authMode === "signup" ? "Compte créé" : "Connexion réussie",
        "Votre profil OUMMAH est maintenant connecté.",
      );
    } catch (error) {
      Alert.alert(
        "Connexion impossible",
        error instanceof Error ? error.message : "Réessayez.",
      );
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    Alert.alert(
      "Se déconnecter",
      "Votre progression locale restera sur cet appareil.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Se déconnecter",
          style: "destructive",
          onPress: async () => {
            await signOut();
            setSession(null);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>MON ESPACE</Text>
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.subtitle}>
            Votre parcours reste accessible, avec ou sans compte.
          </Text>
        </View>

        <LinearGradient
          colors={["rgba(80,43,105,0.92)", "rgba(25,16,40,0.96)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileTopRow}>
            <View style={styles.avatar}>
              <Ionicons name="person-outline" size={27} color="#211329" />
            </View>

            <View style={styles.profileCopy}>
              <Text style={styles.profileTitle}>
                {session ? "Profil OUMMAH" : "Sans compte"}
              </Text>
              <Text style={styles.profileSubtitle}>
                {session?.user.email ?? "Profil local"}
              </Text>
            </View>

            <View style={[styles.activeBadge, isAdmin && styles.adminBadge]}>
              <View style={[styles.activeDot, isAdmin && styles.adminDot]} />
              <Text style={styles.activeText}>{isAdmin ? "ADMIN" : "ACTIF"}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.localStatusRow}>
            <Ionicons
              name="phone-portrait-outline"
              size={18}
              color={colors.goldLight}
            />
            <Text style={styles.localStatusText}>
              {session
                ? "Votre profil est connecté et protégé par Supabase."
                : "Vos données sont enregistrées sur cet appareil."}
            </Text>
          </View>
        </LinearGradient>


        {isAdmin ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/admin")}
            style={({ pressed }) => [styles.adminButton, pressed && styles.premiumButtonPressed]}
          >
            <Ionicons name="shield-checkmark-outline" size={21} color={colors.goldLight} />
            <View style={styles.adminButtonCopy}>
              <Text style={styles.adminButtonTitle}>Espace administrateur</Text>
              <Text style={styles.adminButtonSubtitle}>Pilotage, utilisateurs, crédits et mosquées</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.goldLight} />
          </Pressable>
        ) : null}


        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/support")}
          style={({ pressed }) => [
            styles.supportButton,
            pressed && styles.premiumButtonPressed,
          ]}
        >
          <Ionicons name="help-buoy-outline" size={20} color={colors.goldLight} />
          <View style={styles.supportButtonCopy}>
            <Text style={styles.supportButtonTitle}>Aide et support</Text>
            <Text style={styles.supportButtonSubtitle}>
              Signaler un bug, demander de l’aide ou faire une suggestion
            </Text>
          </View>
          {supportUnreadCount > 0 ? (
            <View style={styles.supportUnreadBadge}>
              <Text style={styles.supportUnreadText}>
                {supportUnreadCount > 99 ? "99+" : supportUnreadCount}
              </Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={19} color={colors.goldLight} />
        </Pressable>

        <Text style={styles.sectionLabel}>ENREGISTRÉ SUR CET APPAREIL</Text>

        <View style={styles.dataCard}>
          {LOCAL_DATA.map((item, index) => (
            <View
              key={item.label}
              style={[
                styles.dataRow,
                index < LOCAL_DATA.length - 1 && styles.dataRowBorder,
              ]}
            >
              <View style={styles.dataIcon}>
                <Ionicons name={item.icon} size={18} color={colors.goldLight} />
              </View>
              <Text style={styles.dataLabel}>{item.label}</Text>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.success}
              />
            </View>
          ))}
        </View>

        <View style={styles.backupCard}>
          <View style={styles.backupIcon}>
            <Ionicons name="cloud-outline" size={23} color={colors.goldLight} />
          </View>

          <Text style={styles.backupTitle}>
            {session ? "Profil sécurisé" : "Protéger ma progression"}
          </Text>
          <Text style={styles.backupText}>
            {session
              ? "Votre identité est vérifiée. Elle permettra de sécuriser vos crédits Wasil."
              : "Créez un profil avec votre e-mail pour retrouver plus tard votre progression sur un autre appareil."}
          </Text>

          <Pressable
            accessibilityRole="button"
            onPress={session ? disconnect : () => openAuth("signup")}
            style={styles.primaryButton}
          >
            <Ionicons
              name={session ? "log-out-outline" : "mail-outline"}
              size={18}
              color="#25152B"
            />
            <Text style={styles.primaryButtonText}>
              {session ? "Se déconnecter" : "Créer un profil"}
            </Text>
          </Pressable>

          {!session && (
            <Pressable
              accessibilityRole="button"
              onPress={() => openAuth("signin")}
              style={styles.signInButton}
            >
              <Text style={styles.signInText}>J’ai déjà un profil</Text>
            </Pressable>
          )}
        </View>

        {!session && (
          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.textMuted}
            />
            <Text style={styles.noticeText}>
              Sans compte, vos données peuvent être perdues si l’application est
              supprimée.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={authOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAuthOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => !loading && setAuthOpen(false)}
          />
          <View style={styles.authCard}>
            <View style={styles.authHeader}>
              <View>
                <Text style={styles.authEyebrow}>PROFIL OUMMAH</Text>
                <Text style={styles.authTitle}>
                  {authMode === "signup" ? "Créer un compte" : "Se connecter"}
                </Text>
              </View>
              <Pressable
                disabled={loading}
                onPress={() => setAuthOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <Text style={styles.authText}>
              Utilisez votre e-mail et un mot de passe. Aucun lien à ouvrir et
              aucun retour vers Expo Go n’est nécessaire.
            </Text>

            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="nom@exemple.com"
              placeholderTextColor={colors.textMuted}
              style={styles.authInput}
              value={email}
            />
            <TextInput
              autoCapitalize="none"
              autoComplete={authMode === "signup" ? "new-password" : "password"}
              editable={!loading}
              onChangeText={setPassword}
              onSubmitEditing={authenticateWithPassword}
              placeholder="Mot de passe"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              style={styles.authInput}
              value={password}
            />

            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={authenticateWithPassword}
              style={({ pressed }) => [
                styles.authButton,
                pressed && styles.primaryButtonPressed,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#25152B" />
              ) : (
                <Text style={styles.authButtonText}>
                  {authMode === "signup" ? "Créer mon compte" : "Se connecter"}
                </Text>
              )}
            </Pressable>

            <Pressable
              disabled={loading}
              onPress={() =>
                setAuthMode((current) =>
                  current === "signup" ? "signin" : "signup"
                )}
              style={styles.changeEmailButton}
            >
              <Text style={styles.signInText}>
                {authMode === "signup"
                  ? "J’ai déjà un compte"
                  : "Créer un nouveau compte"}
              </Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 122,
  },
  header: {
    marginBottom: 22,
  },
  eyebrow: {
    color: colors.gold,
    fontFamily: typography.sans,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.7,
  },
  title: {
    marginTop: 3,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 38,
    lineHeight: 42,
  },
  subtitle: {
    maxWidth: 310,
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12.5,
    lineHeight: 18,
  },
  profileCard: {
    padding: 17,
    overflow: "hidden",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.22)",
  },
  profileTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 26,
    backgroundColor: colors.goldLight,
  },
  profileCopy: {
    flex: 1,
    marginLeft: 13,
  },
  profileTitle: {
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 23,
  },
  profileSubtitle: {
    marginTop: -1,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11,
  },
  activeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "rgba(98,197,139,0.12)",
  },
  activeDot: {
    width: 6,
    height: 6,
    marginRight: 5,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  activeText: {
    color: colors.success,
    fontFamily: typography.sans,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  divider: {
    height: 1,
    marginVertical: 15,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  localStatusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  localStatusText: {
    flex: 1,
    marginLeft: 9,
    color: "rgba(248,244,238,0.86)",
    fontFamily: typography.sans,
    fontSize: 11.5,
    lineHeight: 16,
  },
  supportButton: {
    minHeight: 72,
    marginTop: 14,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  supportUnreadBadge: {
    minWidth: 24,
    height: 24,
    marginRight: 8,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "#F28B82",
  },
  supportUnreadText: {
    color: colors.background,
    fontSize: 9,
    fontWeight: "900",
  },
  supportButtonCopy: {
    flex: 1,
    marginHorizontal: 12,
  },
  supportButtonTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  supportButtonSubtitle: {
    marginTop: 4,
    color: colors.textMuted,
    fontSize: 9.5,
    lineHeight: 14,
  },
  premiumButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.gold,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  premiumButtonPressed: {
    opacity: 0.82,
  },
  premiumButtonText: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.sans,
    fontSize: 15,
    fontWeight: "700",
  },
  sectionLabel: {
    marginTop: 24,
    marginBottom: 9,
    marginLeft: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 8.5,
    fontWeight: "700",
    letterSpacing: 1.25,
  },
  dataCard: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.surface,
  },
  dataRow: {
    minHeight: 55,
    marginHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  dataRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  dataIcon: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 11,
    backgroundColor: "rgba(227,181,90,0.09)",
  },
  dataLabel: {
    flex: 1,
    marginLeft: 11,
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: "600",
  },
  backupCard: {
    marginTop: 16,
    padding: 18,
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.18)",
    backgroundColor: colors.surface,
  },
  backupIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    backgroundColor: "rgba(227,181,90,0.10)",
  },
  backupTitle: {
    marginTop: 11,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 23,
  },
  backupText: {
    maxWidth: 305,
    marginTop: 4,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11.5,
    lineHeight: 17,
    textAlign: "center",
  },
  primaryButton: {
    width: "100%",
    minHeight: 48,
    marginTop: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.goldLight,
  },
  primaryButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.985 }],
  },
  primaryButtonText: {
    marginLeft: 8,
    color: "#25152B",
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: "700",
  },
  signInButton: {
    minHeight: 40,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  signInButtonPressed: {
    opacity: 0.65,
  },
  signInText: {
    color: colors.goldLight,
    fontFamily: typography.sans,
    fontSize: 12,
    fontWeight: "600",
  },
  notice: {
    marginTop: 16,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  noticeText: {
    flex: 1,
    marginLeft: 8,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 10.5,
    lineHeight: 15,
  },
  modalBackdrop: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "rgba(5,3,8,0.78)",
  },
  authCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.22)",
    backgroundColor: "#1B1224",
  },
  authHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  authEyebrow: {
    color: colors.gold,
    fontFamily: typography.sans,
    fontSize: 8.5,
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  authTitle: {
    marginTop: 4,
    color: colors.text,
    fontFamily: typography.serifSemibold,
    fontSize: 25,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  authText: {
    marginTop: 12,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 12,
    lineHeight: 18,
  },
  authInput: {
    minHeight: 50,
    marginTop: 16,
    paddingHorizontal: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.20)",
    backgroundColor: "rgba(255,255,255,0.055)",
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 14,
  },
  magicLinkStatus: {
    minHeight: 72,
    marginTop: 16,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.20)",
    backgroundColor: "rgba(227,181,90,0.06)",
  },
  magicLinkStatusText: {
    flex: 1,
    marginLeft: 11,
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 11.5,
    lineHeight: 17,
  },
  authButton: {
    minHeight: 48,
    marginTop: 13,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: colors.goldLight,
  },
  authButtonText: {
    color: "#25152B",
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: "700",
  },
  changeEmailButton: {
    minHeight: 40,
    marginTop: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  adminBadge: { borderColor: "rgba(241,188,79,0.7)", backgroundColor: "rgba(241,188,79,0.16)" },
  adminDot: { backgroundColor: colors.goldLight },
  adminButton: { minHeight: 68, marginTop: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", borderRadius: 18, borderWidth: 1, borderColor: "rgba(241,188,79,0.32)", backgroundColor: "rgba(241,188,79,0.08)" },
  adminButtonCopy: { flex: 1, marginHorizontal: 12 },
  adminButtonTitle: { color: colors.text, fontFamily: typography.serifMedium, fontSize: 16 },
  adminButtonSubtitle: { marginTop: 2, color: colors.textMuted, fontFamily: typography.sans, fontSize: 10.5 },
});
