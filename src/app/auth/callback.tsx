import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  completeMagicLink,
  MagicLinkError,
} from "../../features/auth/SupabaseAuthService";
import {
  createProfileDraft,
  ProfileRepositoryError,
} from "../../features/profile/UserProfileRepository";
import { translate } from "../../i18n";
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type CallbackState =
  | { status: "processing"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function callbackErrorMessage(error: unknown) {
  if (error instanceof ProfileRepositoryError) {
    return translate("authCallback.profileError");
  }
  if (!(error instanceof MagicLinkError)) {
    return translate("authCallback.failed");
  }

  switch (error.code) {
    case "invalid-link":
      return translate("authCallback.invalid");
    case "expired-link":
      return translate("authCallback.expired");
    case "missing-parameters":
      return translate("authCallback.missing");
    case "pkce-unsupported":
      return translate("authCallback.unsupported");
    case "network-error":
      return translate("authCallback.network");
    case "session-save-failed":
      return translate("authCallback.sessionSave");
    case "supabase-error":
      return translate("authCallback.supabase");
  }
}

export default function AuthCallbackScreen() {
  const incomingUrl = Linking.useLinkingURL();
  const handledUrl = useRef<string | null>(null);
  const [state, setState] = useState<CallbackState>({
    status: "processing",
    message: translate("authCallback.processing"),
  });

  useEffect(() => {
    if (!incomingUrl || handledUrl.current === incomingUrl) return;
    handledUrl.current = incomingUrl;
    let active = true;
    let redirectTimer: ReturnType<typeof setTimeout> | undefined;

    void completeMagicLink(incomingUrl)
      .then(async (session) => {
        if (!active) return;
        if (!session) {
          setState({
            status: "error",
            message: translate("authCallback.noSession"),
          });
          return;
        }
        const profile = await createProfileDraft(session.user.id);
        if (!active) return;
        setState({
          status: "success",
          message: translate("authCallback.confirmed"),
        });
        redirectTimer = setTimeout(
          () =>
            router.replace(
              profile.profileCompleted ? "/profile" : "/onboarding/profile",
            ),
          700,
        );
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({ status: "error", message: callbackErrorMessage(error) });
      });

    return () => {
      active = false;
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [incomingUrl]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        {state.status === "processing" ? (
          <ActivityIndicator color={colors.goldLight} size="large" />
        ) : (
          <Ionicons
            color={state.status === "success" ? colors.success : colors.danger}
            name={
              state.status === "success"
                ? "checkmark-circle-outline"
                : "alert-circle-outline"
            }
            size={44}
          />
        )}
        <Text style={styles.message}>{state.message}</Text>
        {state.status === "error" ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/profile")}
            style={({ pressed }) => [
              styles.returnButton,
              pressed && styles.returnButtonPressed,
            ]}
          >
            <Text style={styles.returnButtonText}>{translate("authCallback.back")}</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  message: {
    color: colors.text,
    fontFamily: typography.sans,
    fontSize: 17,
    lineHeight: 24,
    marginTop: 18,
    textAlign: "center",
  },
  returnButton: {
    backgroundColor: colors.gold,
    borderRadius: 14,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  returnButtonPressed: {
    opacity: 0.82,
  },
  returnButtonText: {
    color: colors.background,
    fontFamily: typography.sans,
    fontSize: 14,
    fontWeight: "700",
  },
});
