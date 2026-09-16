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
import { colors } from "../../theme/colors";
import { typography } from "../../theme/typography";

type CallbackState =
  | { status: "processing"; message: string }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

function callbackErrorMessage(error: unknown) {
  if (error instanceof ProfileRepositoryError) {
    return "Votre adresse a été confirmée, mais le profil n’a pas pu être préparé. Réessayez depuis la page Profil.";
  }
  if (!(error instanceof MagicLinkError)) {
    return "La confirmation a échoué. Vérifiez votre connexion puis demandez un nouveau lien.";
  }

  switch (error.code) {
    case "invalid-link":
      return "Ce lien de confirmation est invalide.";
    case "expired-link":
      return "Ce lien de confirmation a expiré. Demandez un nouveau lien.";
    case "missing-parameters":
      return "Ce lien ne contient pas les informations nécessaires à la confirmation.";
    case "pkce-unsupported":
      return "Ce format de lien n’est pas encore pris en charge. Demandez un nouveau magic link.";
    case "network-error":
      return "Impossible de contacter le service d’authentification. Vérifiez votre connexion.";
    case "session-save-failed":
      return "Votre adresse a été confirmée, mais la session n’a pas pu être enregistrée sur cet appareil.";
    case "supabase-error":
      return "Supabase n’a pas pu confirmer cette adresse. Demandez un nouveau lien.";
  }
}

export default function AuthCallbackScreen() {
  const incomingUrl = Linking.useLinkingURL();
  const handledUrl = useRef<string | null>(null);
  const [state, setState] = useState<CallbackState>({
    status: "processing",
    message: "Confirmation en cours…",
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
            message: "La session n’a pas pu être créée à partir de ce lien.",
          });
          return;
        }
        const profile = await createProfileDraft(session.user.id);
        if (!active) return;
        setState({
          status: "success",
          message: "Adresse email confirmée",
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
            <Text style={styles.returnButtonText}>Retour au profil</Text>
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
