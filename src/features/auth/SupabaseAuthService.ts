import { storageService } from "../../core/storage/StorageService";
import { revenueCatPaymentProvider } from "../premium/RevenueCatPaymentProvider";

const SESSION_KEY = "oummah.auth.session.v1";
const HANDLED_MAGIC_LINKS_KEY = "oummah.auth.handled-magic-links.v1";

export type SupabaseAuthUser = {
  id: string;
  email?: string;
};

export type SupabaseAuthSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: SupabaseAuthUser;
};

export type MagicLinkErrorCode =
  | "invalid-link"
  | "expired-link"
  | "missing-parameters"
  | "pkce-unsupported"
  | "network-error"
  | "session-save-failed"
  | "supabase-error";

export class MagicLinkError extends Error {
  constructor(
    readonly code: MagicLinkErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "MagicLinkError";
  }
}

type SupabaseSessionResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  user: SupabaseAuthUser;
};

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) {
    throw new Error("La connexion sécurisée n’est pas encore configurée.");
  }

  return { url, key };
}

async function parseError(response: Response) {
  try {
    const body = (await response.json()) as {
      msg?: string;
      message?: string;
      error_description?: string;
    };
    return (
      body.msg ??
      body.message ??
      body.error_description ??
      "Une erreur est survenue."
    );
  } catch {
    return "Une erreur est survenue.";
  }
}

function toSession(value: SupabaseSessionResponse): SupabaseAuthSession {
  return {
    accessToken: value.access_token,
    refreshToken: value.refresh_token,
    expiresAt: Date.now() + Math.max(60, value.expires_in ?? 3600) * 1000,
    user: value.user,
  };
}

async function saveSession(value: SupabaseSessionResponse) {
  const session = toSession(value);
  try {
    await storageService.set(SESSION_KEY, session);
  } catch {
    throw new MagicLinkError(
      "session-save-failed",
      "La session n’a pas pu être enregistrée sur cet appareil.",
    );
  }
  await revenueCatPaymentProvider.logIn(session.user.id);
  return session;
}

function isSessionResponse(value: unknown): value is SupabaseSessionResponse {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<SupabaseSessionResponse>;
  return typeof session.access_token === "string" &&
    typeof session.refresh_token === "string" &&
    !!session.user && typeof session.user.id === "string";
}

export async function signUpWithPassword(email: string, password: string) {
  const { url, key } = configuration();
  const response = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  if (!response.ok) throw new Error(await parseError(response));
  const result = await response.json();
  if (!isSessionResponse(result)) {
    // Lorsque la confirmation par e-mail est activée, Supabase crée bien
    // l’utilisateur mais ne renvoie pas encore de session. Ce n’est pas une
    // erreur de connexion : l’utilisateur doit simplement confirmer son e-mail.
    return null;
  }
  return saveSession(result);
}

export async function signInWithPassword(email: string, password: string) {
  const { url, key } = configuration();
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  if (!response.ok) throw new Error(await parseError(response));
  return saveSession((await response.json()) as SupabaseSessionResponse);
}

export async function requestEmailOtp(email: string) {
  const { url, key } = configuration();
  const response = await fetch(`${url}/auth/v1/otp`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      create_user: true,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

export async function requestEmailMagicLink(
  email: string,
  redirectTo = "oummah://profile",
) {
  const { url, key } = configuration();
  const requestUrl =
    `${url}/auth/v1/otp?redirect_to=${encodeURIComponent(redirectTo)}`;
  const maskedRequestUrl = requestUrl.replaceAll(key, "[API_KEY_REDACTED]");
  console.log("AUTH MAGIC LINK REQUEST", {
    file: "src/features/auth/SupabaseAuthService.ts",
    function: "requestEmailMagicLink",
    requestUrl: maskedRequestUrl,
    redirectTo,
  });

  const response = await fetch(
    requestUrl,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        create_user: true,
      }),
    },
  );
  const responseBody = await response.clone().text();
  console.log("AUTH MAGIC LINK RESPONSE", {
    file: "src/features/auth/SupabaseAuthService.ts",
    function: "requestEmailMagicLink",
    status: response.status,
    body: responseBody,
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }
}

function urlParameters(value: string) {
  const queryIndex = value.indexOf("?");
  const hashIndex = value.indexOf("#");
  const query =
    queryIndex >= 0
      ? value.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined)
      : "";
  const hash = hashIndex >= 0 ? value.slice(hashIndex + 1) : "";
  return new URLSearchParams([query, hash].filter(Boolean).join("&"));
}

function magicLinkFingerprint(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

async function consumeMagicLinkOnce(callbackUrl: string) {
  const fingerprint = magicLinkFingerprint(callbackUrl);
  const handled =
    (await storageService.get<string[]>(HANDLED_MAGIC_LINKS_KEY).catch(
      () => null,
    )) ?? [];
  if (handled.includes(fingerprint)) return false;
  await storageService.set(
    HANDLED_MAGIC_LINKS_KEY,
    [fingerprint, ...handled].slice(0, 12),
  );
  return true;
}

export async function completeMagicLink(callbackUrl: string) {
  if (!/^(oummah|exp|exps):\/\//.test(callbackUrl)) {
    throw new MagicLinkError("invalid-link", "Ce lien de confirmation est invalide.");
  }
  const parameters = urlParameters(callbackUrl);
  const containsAuthenticationResult =
    parameters.has("access_token") ||
    parameters.has("refresh_token") ||
    parameters.has("token_hash") ||
    parameters.has("code") ||
    parameters.has("error") ||
    parameters.has("error_description");
  if (!containsAuthenticationResult) {
    throw new MagicLinkError(
      "missing-parameters",
      "Les paramètres de confirmation sont manquants.",
    );
  }
  if (!(await consumeMagicLinkOnce(callbackUrl))) return getStoredSession();

  const error = parameters.get("error_description") ?? parameters.get("error");
  if (error) {
    const message = decodeURIComponent(error.replace(/\+/g, " "));
    throw new MagicLinkError(
      /expired|otp_expired/i.test(message) ? "expired-link" : "supabase-error",
      message,
    );
  }

  if (parameters.has("code")) {
    throw new MagicLinkError(
      "pkce-unsupported",
      "Ce lien utilise un échange PKCE qui n’est pas encore pris en charge.",
    );
  }

  const accessToken = parameters.get("access_token");
  const refreshToken = parameters.get("refresh_token");
  if (accessToken && refreshToken) {
    const { url, key } = configuration();
    let userResponse: Response;
    try {
      userResponse = await fetch(`${url}/auth/v1/user`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      throw new MagicLinkError(
        "network-error",
        "La connexion au service d’authentification a échoué.",
      );
    }
    if (!userResponse.ok) throw new Error(await parseError(userResponse));
    return saveSession({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: Number(parameters.get("expires_in")) || 3600,
      user: (await userResponse.json()) as SupabaseAuthUser,
    });
  }

  const tokenHash = parameters.get("token_hash");
  if (tokenHash) {
    const { url, key } = configuration();
    const type = parameters.get("type") ?? "magiclink";
    if (!["magiclink", "signup", "invite", "recovery", "email_change"].includes(type)) {
      throw new MagicLinkError("invalid-link", "Le type de lien est invalide.");
    }
    let response: Response;
    try {
      response = await fetch(`${url}/auth/v1/verify`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token_hash: tokenHash, type }),
      });
    } catch {
      throw new MagicLinkError(
        "network-error",
        "La connexion au service d’authentification a échoué.",
      );
    }
    if (!response.ok) {
      const message = await parseError(response);
      throw new MagicLinkError(
        /expired|otp_expired/i.test(message) ? "expired-link" : "supabase-error",
        message,
      );
    }
    return saveSession((await response.json()) as SupabaseSessionResponse);
  }

  throw new MagicLinkError(
    "missing-parameters",
    "Les paramètres de session sont incomplets.",
  );
}

export async function verifyEmailOtp(email: string, token: string) {
  const { url, key } = configuration();
  const response = await fetch(`${url}/auth/v1/verify`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type: "email",
    }),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return saveSession((await response.json()) as SupabaseSessionResponse);
}

export async function getStoredSession() {
  return storageService.get<SupabaseAuthSession>(SESSION_KEY);
}

export async function getValidSession(forceRefresh = false) {
  const session = await getStoredSession();
  if (
    !session ||
    (!forceRefresh && session.expiresAt > Date.now() + 60_000)
  ) {
    return session;
  }

  const { url, key } = configuration();
  const response = await fetch(
    `${url}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: session.refreshToken }),
    },
  );

  if (!response.ok) {
    await storageService.remove(SESSION_KEY);
    return null;
  }

  return saveSession((await response.json()) as SupabaseSessionResponse);
}

export async function signOut() {
  const session = await getStoredSession();
  await storageService.remove(SESSION_KEY);
  await revenueCatPaymentProvider.logOut();
  if (!session) return;

  try {
    const { url, key } = configuration();
    await fetch(`${url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${session.accessToken}`,
      },
    });
  } catch {
    // La session locale est déjà supprimée, même hors connexion.
  }
}
