import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { getValidSession } from "../auth/SupabaseAuthService";
import { getPremiumAccess } from "../premium/PremiumAccessService";

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error("PUSH_SUPABASE_NOT_CONFIGURED");
  }

  return { url, key };
}

function projectId() {
  return (
    Constants.easConfig?.projectId ??
    Constants.expoConfig?.extra?.eas?.projectId ??
    null
  );
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;

  await Notifications.setNotificationChannelAsync("oummah-admin", {
    name: "Communications OUMMAH",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 140, 250],
    lightColor: "#F1BC4F",
  });
}

export async function syncPushRegistration() {
  const diagnostic = (message: string, details?: unknown) => {
    if (__DEV__) console.info(`[PushDiagnostic] ${message}`, details ?? "");
  };

  const session = await getValidSession().catch(() => null);
  if (!session) {
    diagnostic("session absente; enregistrement ignoré");
    return { registered: false as const, reason: "signed-out" as const };
  }
  diagnostic("session trouvée", { userId: session.user.id });

  await ensureAndroidChannel();

  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;

  if (!granted) {
    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    granted = requested.granted;
  }

  if (!granted) {
    diagnostic("permission notifications refusée");
    return { registered: false as const, reason: "permission-denied" as const };
  }
  diagnostic("permission notifications accordée");

  const expoProjectId = projectId();
  if (!expoProjectId) {
    diagnostic("projectId Expo absent");
    return { registered: false as const, reason: "project-id-missing" as const };
  }

  const token = (
    await Notifications.getExpoPushTokenAsync({
      projectId: expoProjectId,
    })
  ).data;
  diagnostic("token Expo récupéré", {
    tokenPreview: token.length > 12 ? `${token.slice(0, 8)}…${token.slice(-4)}` : "<court>",
    platform: Platform.OS,
    projectId: expoProjectId,
  });

  const premium = await getPremiumAccess().catch(() => null);
  const tier = premium?.isPremium ? "premium" : "free";
  const { url, key } = configuration();

  const response = await fetch(`${url}/rest/v1/rpc/register_my_push_token`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_expo_push_token: token,
      p_platform: Platform.OS,
      p_audience_tier: tier,
    }),
  });

  diagnostic("RPC register_my_push_token répondu", {
    status: response.status,
    ok: response.ok,
    userId: session.user.id,
  });

  if (!response.ok) {
    throw new Error("PUSH_TOKEN_REGISTRATION_FAILED");
  }

  return { registered: true as const, token };
}
