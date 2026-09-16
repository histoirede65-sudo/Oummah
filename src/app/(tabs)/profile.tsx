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
import { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";

import { useI18n } from "../../i18n";
import { colors } from "../../theme/colors";
import { getMyUnreadSupportCount } from "../../features/support/SupportService";
import { typography } from "../../theme/typography";
import {
  getValidSession,
  signInWithPassword,
  signOut,
  deleteCurrentAccount,
  signUpWithPassword,
  SupabaseAuthSession,
} from "../../features/auth/SupabaseAuthService";
import { isOummahAdminSession } from "../../features/auth/AdminAccess";
import {
  createProfileDraft,
  getCurrentUserProfile,
  updateProfile,
} from "../../features/profile/UserProfileRepository";

const LOCAL_DATA = [
  { icon: "trending-up-outline", labelKey: "profile.progress" },
  { icon: "bookmark-outline", labelKey: "profile.favorites" },
  { icon: "options-outline", labelKey: "profile.preferences" },
] as const;

export default function ProfileScreen() {
  const { language, setLanguage, t } = useI18n();
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const router = useRouter();
  const [session, setSession] = useState<SupabaseAuthSession | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [nameEditorOpen, setNameEditorOpen] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const isAdmin = isOummahAdminSession(session);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getValidSession()
        .then(async (nextSession) => {
          const profile = nextSession
            ? await getCurrentUserProfile().catch(() => null)
            : null;
          if (active) {
            setSession(nextSession);
            setDisplayName(profile?.displayName?.trim() ?? "");
          }
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

  const openNameEditor = () => {
    setNameDraft(displayName);
    setNameEditorOpen(true);
  };

  const saveDisplayName = async () => {
    const nextName = nameDraft.trim();
    if (!session || !nextName) {
      Alert.alert(t("profile.name"), t("profile.nameRequired"));
      return;
    }
    setSavingName(true);
    try {
      await createProfileDraft(session.user.id);
      const profile = await updateProfile(session.user.id, { displayName: nextName });
      setDisplayName(profile.displayName?.trim() ?? nextName);
      setNameEditorOpen(false);
    } catch {
      Alert.alert(t("profile.updateFailed"), t("profile.nameSaveFailed"));
    } finally {
      setSavingName(false);
    }
  };

  const authenticateWithPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      Alert.alert(t("profile.emailAddress"), t("profile.emailInvalid"));
      return;
    }
    if (password.length < 6) {
      Alert.alert(
        t("profile.password"),
        t("profile.passwordMinimum"),
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
          t("profile.accountCreated"),
          t("profile.confirmEmail"),
        );
        return;
      }

      setSession(nextSession);
      if (authMode === "signup") {
        router.replace("/onboarding/profile");
        return;
      }
      Alert.alert(
        t("profile.signInSuccess"),
        t("profile.profileConnected"),
      );
    } catch (error) {
      Alert.alert(
        t("profile.signInFailed"),
        error instanceof Error ? error.message : t("profile.tryAgain"),
      );
    } finally {
      setLoading(false);
    }
  };

  const disconnect = () => {
    Alert.alert(
      t("profile.signOut"),
      t("profile.signOutDescription"),
      [
        { text: t("profile.cancel"), style: "cancel" },
        {
          text: t("profile.signOut"),
          style: "destructive",
          onPress: async () => {
            await signOut();
            setSession(null);
          },
        },
      ],
    );
  };

  const deleteAccount = () => {
    Alert.alert(
      t("profile.deleteAccount"),
      t("profile.deleteWarning"),
      [
        { text: t("profile.cancel"), style: "cancel" },
        {
          text: t("profile.continue"),
          style: "destructive",
          onPress: () => {
            Alert.alert(
              t("profile.finalDeletion"),
              t("profile.finalDeletionQuestion"),
              [
                { text: t("profile.cancel"), style: "cancel" },
                {
                  text: t("profile.deletePermanently"),
                  style: "destructive",
                  onPress: async () => {
                    setDeletingAccount(true);
                    try {
                      await deleteCurrentAccount();
                      setSession(null);
                      setDisplayName("");
                      router.replace("/profile");
                    } catch (error) {
                      Alert.alert(
                        t("profile.deletionFailed"),
                        error instanceof Error ? error.message : t("profile.tryAgainLater"),
                      );
                    } finally {
                      setDeletingAccount(false);
                    }
                  },
                },
              ],
            );
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
          <Text style={styles.eyebrow}>{t("profile.mySpace")}</Text>
          <Text style={styles.title}>{t("profile.title")}</Text>
          <Text style={styles.subtitle}>
            {t("profile.subtitle")}
          </Text>
        </View>

        <View style={styles.languageCard}>
          <View style={styles.languageCopy}>
            <Text style={styles.languageTitle}>{t("profile.language")}</Text>
            <Text style={styles.languageSubtitle}>{t("profile.languageSubtitle")}</Text>
          </View>
          <View style={styles.languageChoices}>
            {(["fr", "en"] as const).map((code) => {
              const selected = language === code;
              return (
                <Pressable
                  key={code}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setLanguage(code)}
                  style={[styles.languageChoice, selected && styles.languageChoiceSelected]}
                >
                  <Text style={[styles.languageChoiceText, selected && styles.languageChoiceTextSelected]}>
                    {code === "fr" ? "Français" : "English"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
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
                {session
                  ? displayName
                    ? t("profile.greetingName", { name: displayName })
                    : t("profile.greeting")
                  : t("profile.noAccount")}
              </Text>
              <Text style={styles.profileSubtitle}>
                {session?.user.email ?? t("profile.localProfile")}
              </Text>
            </View>

            {session ? (
              <Pressable
                accessibilityLabel={t("profile.editName")}
                accessibilityRole="button"
                onPress={openNameEditor}
              >
                <Ionicons name="chevron-forward" size={20} color={colors.goldLight} />
              </Pressable>
            ) : (
              <View style={styles.activeBadge}>
                <View style={styles.activeDot} />
                <Text style={styles.activeText}>{t("profile.active")}</Text>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {session ? (
            <Pressable
              accessibilityRole="button"
              onPress={openNameEditor}
              style={styles.localStatusRow}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.goldLight} />
              <Text style={styles.localStatusText}>
                {displayName ? t("profile.oummahProfile") : t("profile.addName")}
              </Text>
              <View style={[styles.activeBadge, isAdmin && styles.adminBadge]}>
                <View style={[styles.activeDot, isAdmin && styles.adminDot]} />
                <Text style={styles.activeText}>{isAdmin ? t("profile.admin") : t("profile.active")}</Text>
              </View>
            </Pressable>
          ) : (
            <View style={styles.localStatusRow}>
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color={colors.goldLight}
              />
              <Text style={styles.localStatusText}>
                {t("profile.dataStoredDevice")}
              </Text>
            </View>
          )}
        </LinearGradient>


        {isAdmin ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/admin")}
            style={({ pressed }) => [styles.adminButton, pressed && styles.premiumButtonPressed]}
          >
            <Ionicons name="shield-checkmark-outline" size={21} color={colors.goldLight} />
            <View style={styles.adminButtonCopy}>
              <Text style={styles.adminButtonTitle}>{t("profile.adminSpace")}</Text>
              <Text style={styles.adminButtonSubtitle}>{t("profile.adminSubtitle")}</Text>
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
            <Text style={styles.supportButtonTitle}>{t("profile.helpSupport")}</Text>
            <Text style={styles.supportButtonSubtitle}>
              {t("profile.helpSupportSubtitle")}
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

        <Text style={styles.sectionLabel}>{t("profile.savedOnDevice")}</Text>

        <View style={styles.dataCard}>
          {LOCAL_DATA.map((item, index) => (
            <View
              key={item.labelKey}
              style={[
                styles.dataRow,
                index < LOCAL_DATA.length - 1 && styles.dataRowBorder,
              ]}
            >
              <View style={styles.dataIcon}>
                <Ionicons name={item.icon} size={18} color={colors.goldLight} />
              </View>
              <Text style={styles.dataLabel}>{t(item.labelKey)}</Text>
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
            {session ? t("profile.securedProfile") : t("profile.protectProgress")}
          </Text>
          <Text style={styles.backupText}>
            {session
              ? t("profile.identityVerified")
              : t("profile.createProfileDescription")}
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
              {session ? t("profile.signOut") : t("profile.createProfile")}
            </Text>
          </Pressable>

          {!session && (
            <Pressable
              accessibilityRole="button"
              onPress={() => openAuth("signin")}
              style={styles.signInButton}
            >
              <Text style={styles.signInText}>{t("profile.alreadyHaveProfile")}</Text>
            </Pressable>
          )}

          {session ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t("profile.deleteAccount")}
              disabled={deletingAccount}
              onPress={deleteAccount}
              style={({ pressed }) => [styles.deleteAccountButton, pressed && styles.premiumButtonPressed]}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.deleteAccountText}>
                {deletingAccount ? t("profile.deleting") : t("profile.deleteAccount")}
              </Text>
            </Pressable>
          ) : null}
        </View>

        {!session && (
          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.textMuted}
            />
            <Text style={styles.noticeText}>
              {t("profile.localDataWarning")}
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={nameEditorOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNameEditorOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.modalBackdrop}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => !savingName && setNameEditorOpen(false)}
          />
          <View style={styles.authCard}>
            <View style={styles.authHeader}>
              <View>
                <Text style={styles.authEyebrow}>{t("profile.myProfile")}</Text>
                <Text style={styles.authTitle}>{t("profile.whatShouldWeCallYou")}</Text>
              </View>
              <Pressable
                disabled={savingName}
                onPress={() => setNameEditorOpen(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
            <TextInput
              autoCapitalize="words"
              editable={!savingName}
              maxLength={50}
              onChangeText={setNameDraft}
              onSubmitEditing={() => void saveDisplayName()}
              placeholder={t("profile.namePlaceholder")}
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              style={styles.authInput}
              value={nameDraft}
            />
            <Pressable
              accessibilityRole="button"
              disabled={savingName}
              onPress={() => void saveDisplayName()}
              style={styles.authButton}
            >
              {savingName ? (
                <ActivityIndicator color="#25152B" />
              ) : (
                <Text style={styles.authButtonText}>{t("profile.save")}</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
                <Text style={styles.authEyebrow}>{t("profile.oummahProfileUpper")}</Text>
                <Text style={styles.authTitle}>
                  {authMode === "signup" ? t("profile.createAccount") : t("profile.signIn")}
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
              {t("profile.authDescription")}
            </Text>

            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder={t("profile.emailPlaceholder")}
              placeholderTextColor={colors.textMuted}
              style={styles.authInput}
              value={email}
            />
            <View style={styles.passwordInputWrap}>
              <TextInput
                autoCapitalize="none"
                autoComplete={authMode === "signup" ? "new-password" : "password"}
                editable={!loading}
                onChangeText={setPassword}
                onSubmitEditing={authenticateWithPassword}
                placeholder={t("profile.password")}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showPassword}
                style={styles.passwordInput}
                value={password}
              />
              <Pressable
                accessibilityLabel={showPassword ? t("profile.hidePassword") : t("profile.showPassword")}
                accessibilityRole="button"
                onPress={() => setShowPassword((current) => !current)}
                style={styles.passwordToggle}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            </View>

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
                  {authMode === "signup" ? t("profile.createMyAccount") : t("profile.signIn")}
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
                  ? t("profile.alreadyHaveAccount")
                  : t("profile.createNewAccount")}
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
  languageCard: {
    marginBottom: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  languageCopy: {
    flex: 1,
    paddingRight: 12,
  },
  languageTitle: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 13,
    fontWeight: "700",
  },
  languageSubtitle: {
    marginTop: 3,
    color: colors.textMuted,
    fontFamily: typography.sans,
    fontSize: 9.5,
  },
  languageChoices: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  languageChoice: {
    minWidth: 56,
    paddingHorizontal: 9,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  languageChoiceSelected: {
    backgroundColor: colors.goldLight,
  },
  languageChoiceText: {
    color: colors.textSecondary,
    fontFamily: typography.sans,
    fontSize: 10,
    fontWeight: "700",
  },
  languageChoiceTextSelected: {
    color: "#25152B",
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
  deleteAccountButton: {
    width: "100%",
    minHeight: 46,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(239, 91, 91, 0.45)",
    backgroundColor: "rgba(239, 91, 91, 0.08)",
  },
  deleteAccountText: {
    marginLeft: 8,
    color: colors.danger,
    fontFamily: typography.sans,
    fontSize: 12.5,
    fontWeight: "700",
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
  passwordInputWrap: {
    position: "relative",
    marginTop: 16,
  },
  passwordInput: {
    minHeight: 50,
    paddingLeft: 15,
    paddingRight: 48,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "rgba(227,181,90,0.20)",
    backgroundColor: "rgba(255,255,255,0.055)",
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 14,
  },
  passwordToggle: {
    position: "absolute",
    right: 6,
    top: 5,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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
