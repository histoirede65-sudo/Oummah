import { getValidSession } from "../auth/SupabaseAuthService";

/**
 * The single door from the admin space to Supabase. Every admin call goes through here, so that:
 *  - the session is renewed only when it is about to expire (never forced on each call: forced refreshes
 *    running in parallel used the same single-use token and failed, which showed « ADMIN_FORBIDDEN »);
 *  - a call refused because the session just expired is retried once with a fresh session;
 *  - errors reach the screen as a short sentence in French, never as raw JSON.
 * Rights are checked by the server functions themselves (owner and team roles); the app does not guess them.
 */

function configuration() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY)?.trim();
  if (!url || !key) throw new Error("La connexion au serveur n’est pas configurée.");
  return { url, key };
}

/** Turns a server answer into one sentence the admin can act on. */
export function adminErrorMessage(status: number, raw: string): string {
  let message = raw;
  let code = "";
  try {
    const parsed = JSON.parse(raw) as { message?: string; code?: string; hint?: string; error_description?: string };
    message = parsed.message ?? parsed.error_description ?? raw;
    code = parsed.code ?? "";
  } catch {
    // Plain text answer.
  }
  const text = `${message} ${code}`.toLowerCase();
  if (status === 401 || text.includes("jwt")) return "Votre session a expiré. Reconnectez-vous puis réessayez.";
  if (status === 403 || code === "42501" || text.includes("forbidden") || text.includes("not allowed") || text.includes("permission")) {
    return "Ce compte n’a pas les droits pour cette action.";
  }
  if (status === 404 || code === "PGRST202") return "Cette action n’est pas disponible sur le serveur.";
  if (text.includes("not found") || text.includes("introuvable")) return "Élément introuvable : il a peut-être déjà été traité.";
  if (status >= 500) return "Le serveur ne répond pas correctement. Réessayez dans un instant.";
  // A short message written for people (often in French in our SQL functions) is shown as is.
  const clean = message.trim();
  if (clean && clean.length <= 160 && !clean.startsWith("{") && !/^[A-Z0-9_]+$/.test(clean)) return clean;
  return "L’action n’a pas abouti. Réessayez.";
}

export async function adminRpc<T>(name: string, body: Record<string, unknown> = {}): Promise<T> {
  const { url, key } = configuration();
  let session = await getValidSession();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (!session?.accessToken) throw new Error("Votre session a expiré. Reconnectez-vous puis réessayez.");
    let response: Response;
    try {
      response = await fetch(`${url}/rest/v1/rpc/${name}`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error("Pas de connexion internet. Vérifiez le réseau puis réessayez.");
    }
    const text = await response.text().catch(() => "");
    if (response.status === 401 && attempt === 0) {
      // The token expired between the check and the call: renew once and try again.
      session = await getValidSession(true);
      continue;
    }
    if (!response.ok) throw new Error(adminErrorMessage(response.status, text));
    if (!text.trim()) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      throw new Error("Réponse du serveur illisible. Réessayez.");
    }
  }
  throw new Error("Votre session a expiré. Reconnectez-vous puis réessayez.");
}

/** Calls an edge function (push sending…) with the same session handling. */
export async function adminFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { url, key } = configuration();
  let session = await getValidSession();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (!session?.accessToken) throw new Error("Votre session a expiré. Reconnectez-vous puis réessayez.");
    let response: Response;
    try {
      response = await fetch(`${url}/functions/v1/${name}`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${session.accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new Error("Pas de connexion internet. Vérifiez le réseau puis réessayez.");
    }
    const text = await response.text().catch(() => "");
    if (response.status === 401 && attempt === 0) {
      session = await getValidSession(true);
      continue;
    }
    if (!response.ok) throw new Error(adminErrorMessage(response.status, text));
    try {
      return (text.trim() ? JSON.parse(text) : undefined) as T;
    } catch {
      return undefined as T;
    }
  }
  throw new Error("Votre session a expiré. Reconnectez-vous puis réessayez.");
}
