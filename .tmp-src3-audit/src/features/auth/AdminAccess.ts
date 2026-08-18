import type { SupabaseSession } from "./SupabaseAuthService";

export type OummahAdminRole =
  | "owner"
  | "admin"
  | "mosque_moderator"
  | "support";

export const OUMMAH_OWNER_EMAIL = "bahri13015@hotmail.fr";

export function normalizeAdminEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

export function isOummahAdminSession(
  session: SupabaseSession | null | undefined,
) {
  return normalizeAdminEmail(session?.user.email) === OUMMAH_OWNER_EMAIL;
}

/**
 * Le contrôle réel des droits est effectué côté Supabase par les fonctions RPC.
 * Cette vérification locale sert uniquement à afficher ou masquer l'accès.
 * Le compte propriétaire reste un fallback de démarrage.
 */
export async function getOummahAdminRole(
  session: SupabaseSession | null | undefined,
): Promise<OummahAdminRole | null> {
  if (!session?.accessToken) return null;

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )?.trim();

  if (!url || !key) {
    return isOummahAdminSession(session) ? "owner" : null;
  }

  try {
    const response = await fetch(
      `${url}/rest/v1/rpc/get_my_admin_role`,
      {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    if (!response.ok) {
      return isOummahAdminSession(session) ? "owner" : null;
    }

    const role = (await response.json()) as OummahAdminRole | null;
    return role ?? (isOummahAdminSession(session) ? "owner" : null);
  } catch {
    return isOummahAdminSession(session) ? "owner" : null;
  }
}
